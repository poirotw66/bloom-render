# 專案檢視：可優化項目整理

> 檢視日期：2026-02-13  
> 與現有 `OPTIMIZATION_ROADMAP.md` 互補，偏重實作細節與可立即改動項目。

---

## 一、效能與載入

### 1.1 路由層級 Code Splitting（高價值）

**現況**：`App.tsx` 以靜態 `import` 載入所有功能頁（IdPhotoPage、PortraitPage、TravelPage、ThemedPage、CoupleGroupPage、TryOnPage、PhotographyServicePage），首屏即載入全部頁面程式碼。

**建議**：使用 `React.lazy` + `Suspense` 做路由層級分割，僅在進入該路由時才載入對應 chunk。

```tsx
// Example: lazy load feature pages
const IdPhotoPage = React.lazy(() => import('./features/idphoto/IdPhotoPage'));
const PortraitPage = React.lazy(() => import('./features/portrait/PortraitPage'));
// ... etc

// In Routes, wrap with Suspense
<Route path="/idphoto" element={
  <Suspense fallback={<Spinner />}>
    <IdPhotoPage onImageSelected={handleImageUpload} />
  </Suspense>
} />
```

**影響**：縮小初始 bundle，加快首屏載入；與 `OPTIMIZATION_ROADMAP.md` 中「Code Splitting」一致。

---

### 1.2 Vite build：manualChunks 細分（可選）

**現況**：`vite.config.ts` 僅將 `node_modules` 打成單一 `vendor` chunk。

**建議**：若已做路由 lazy，各 lazy 頁會自然帶出各自依賴；若希望 Gemini 相關程式單獨成 chunk，可再細分，例如：

```ts
manualChunks(id) {
  if (id.includes('node_modules')) return 'vendor';
  if (id.includes('services/gemini')) return 'gemini';
}
```

依實際 bundle 分析再調整即可。

---

## 二、程式碼品質與可維護性

### 2.1 App.tsx 主題樣式重複

**現況**：`App.tsx` 內多處依 `theme === 'newyear' | 'bloom' | ...` 重複撰寫相同風格的 Tailwind class（按鈕、輸入框、邊框等），易錯且難維護。

**建議**：

- 在 `ThemeContext` 或 `themeUtils` 提供小 helper，例如依 `theme` 回傳「主按鈕 / 輸入框 / 邊框」的 class 字串或物件；或
- 使用 `data-theme`（專案已有）在 CSS/ Tailwind 用選取器 `.data-theme-newyear .btn-primary` 等集中管理，減少 JS 內三元運算。

---

### 2.2 編輯器區 handleImageClick 未 memo

**現況**：`handleImageClick` 以一般函數傳給 `<img onClick={handleImageClick}>`，每次 App 重繪都會建立新函數。

**建議**：以 `useCallback` 包裝，依賴為 `[activeTab]`（因內有 `activeTab !== 'retouch'` 判斷）。可減少子樹不必要的更新（若該區未來抽出成子元件時效益更明顯）。

---

### 2.3 Context 的 value 未 memo

**現況**：`SettingsContext`、`ThemeContext` 的 Provider 皆以 inline 物件傳 value（例如 `value={{ apiKey, setApiKey, ... }}`），每次父元件重繪都會產生新物件，導致所有消費該 context 的元件重繪。

**建議**：以 `useMemo` 包裝 value，依賴為實際用到的 state / setter，例如：

```tsx
const value = useMemo(() => ({
  apiKey, setApiKey, model, setModel, ...
}), [apiKey, model, enableImageCompression, compressionThresholdMB]);
<SettingsContext.Provider value={value}>
```

同理可套用在 `ThemeContext`（`theme`, `setTheme`, `colors`）。

---

## 三、建置與環境

### 3.1 建置指令中的 404 複製

**現況**：`package.json` 的 build 為 `vite build && node -e "require('fs').copyFileSync(...)"`。專案為 `"type": "module"`，在純 ESM 環境下 `require('fs')` 可能不適用。

**建議**：改為小型 ESM 腳本，例如 `scripts/copy-404.mjs`：

```js
import { copyFileSync } from 'fs';
copyFileSync('dist/index.html', 'dist/404.html');
```

並在 `package.json` 改為：`"build": "vite build && node scripts/copy-404.mjs"`，避免依賴 Node 的 CommonJS 相容性。

---

### 3.2 API Key 與建置時注入

**現況**：`vite.config.ts` 以 `define` 注入 `process.env.API_KEY` / `process.env.GEMINI_API_KEY`，若建置時有設定環境變數，key 會被打進前端 bundle。

**建議**：

- 正式環境建置時不要將真實 API key 放進環境變數，改由使用者於「設定」中輸入（存 localStorage），應用內已有此流程。
- 在 README 或 `docs` 註明：生產環境請勿在 build 時設定 `GEMINI_API_KEY`，僅供本機開發使用。

---

## 四、型別與工具

### 4.1 TypeScript strict 模式

**現況**：`tsconfig.json` 未啟用 `"strict": true`（亦未單獨設定如 `strictNullChecks`）。

**建議**：逐步啟用 `"strict": true` 或至少 `"strictNullChecks": true`，可提早發現 null/undefined 與型別問題。若現有程式碼報錯多，可先僅開 `strictNullChecks` 並分批修復。

---

### 4.2 ESLint

**現況**：專案中未發現 `.eslintrc*` 或等同設定。

**建議**：加入 ESLint（含 TypeScript、React 建議規則），有助風格一致、避免常見錯誤（如 dependency array、hook 規則等）。可與現有 Prettier 並存。

---

## 五、與既有路線圖的對應

| 本文件建議 | OPTIMIZATION_ROADMAP / FUTURE 對應 |
|------------|-------------------------------------|
| 路由 Code Splitting | 2.3 Code Splitting、FUTURE React.lazy |
| 主題樣式集中 / helper | 1.3 程式碼重複消除（可一併考慮 UI 重複） |
| Context value useMemo | 屬效能與架構優化，路線圖未明列 |
| 建置 404 腳本、API key 說明 | 文檔與維護、部署安全 |
| TypeScript strict、ESLint | 程式碼品質與長期維護 |

---

## 六、建議優先順序（摘要）

1. **高**：路由層級 `React.lazy` + `Suspense`（縮小首屏、與路線圖一致）。  
2. **高**：建置 404 改為 ESM 腳本，避免 `require` 在 ESM 專案中的相容性問題。  
3. **中**：Context provider 的 value 以 `useMemo` 包裝，減少不必要重繪。  
4. **中**：主題樣式抽成 helper 或 data-theme CSS，減少 App 內重複。  
5. **中**：`handleImageClick` 改為 `useCallback`。  
6. **低**：啟用 TypeScript strict（或先 strictNullChecks）、加入 ESLint；文件補充 API key 與建置環境說明。

以上項目可依人力與時程與既有 `OPTIMIZATION_ROADMAP.md` 一併排程實作。
