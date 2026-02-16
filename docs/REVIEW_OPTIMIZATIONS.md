# 專案檢視：可優化項目整理

> 檢視日期：2026-02-13  
> 與現有 `OPTIMIZATION_ROADMAP.md` 互補，偏重實作細節與可立即改動項目。

---

## 一、效能與載入

### 1.1 路由層級 Code Splitting（高價值）✅ 已實作

**原況**：`App.tsx` 以靜態 `import` 載入所有功能頁，首屏即載入全部頁面程式碼。

**已實作**：功能頁改為 `React.lazy` 動態 import，並以 `Suspense` 包裝 Routes，fallback 為 `<Spinner />`。建置後各頁獨立 chunk（如 IdPhotoPage、TravelPage 等），首屏僅載入 index + vendor，進入對應路由才載入該頁。原建議如下：

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

### 2.1 App.tsx 主題樣式重複 ✅ 已實作

**原況**：`App.tsx` 內多處依 `theme === 'newyear' | 'bloom' | ...` 重複撰寫相同風格的 Tailwind class（按鈕、輸入框、邊框等）。

**已實作**：在 `utils/themeUtils.ts` 新增 `getEditorThemeClasses(theme)`，回傳 `tabContainer`、`tabActive`、`tabInactive`、`retouchInstruction`、`input`、`submitButton`。App 編輯器區改為使用 `editorTheme.*`。原建議：ThemeContext/themeUtils helper 或 data-theme CSS 集中管理。

---

### 2.2 編輯器區 handleImageClick 未 memo ✅ 已實作

**原況**：`handleImageClick` 以一般函數傳給 `<img onClick={handleImageClick}>`，每次 App 重繪都會建立新函數。

**已實作**：改為 `useCallback` 包裝，依賴 `[activeTab]`。

---

### 2.3 Context 的 value 未 memo ✅ 已實作

**原況**：`SettingsContext`、`ThemeContext` 的 Provider 皆以 inline 物件傳 value，每次重繪產生新物件，導致所有消費者重繪。

**已實作**：`SettingsContext` 以 `useMemo` 包裝 value，依賴 `[apiKey, model, enableImageCompression, compressionThresholdMB]`；`ThemeContext` 以 `useMemo` 包裝，依賴 `[theme, colors]`。原建議如下：

```tsx
const value = useMemo(() => ({
  apiKey, setApiKey, model, setModel, ...
}), [apiKey, model, enableImageCompression, compressionThresholdMB]);
<SettingsContext.Provider value={value}>
```

同理可套用在 `ThemeContext`（`theme`, `setTheme`, `colors`）。

---

## 三、建置與環境

### 3.1 建置指令中的 404 複製 ✅ 已實作

**原況**：`package.json` 的 build 曾使用 `node -e "require('fs').copyFileSync(...)"`，在 ESM 專案中可能不適用。

**已實作**：已新增 `scripts/copy-404.mjs`（ESM），build 改為 `vite build && node scripts/copy-404.mjs`。參考如下：

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

### 4.1 TypeScript strict 模式 ✅ 已實作

**原況**：`tsconfig.json` 未啟用 `"strict": true`。

**已實作**：已啟用 `"strict": true`、`"strictNullChecks": true`，並安裝 `@types/react`、`@types/react-dom`。新增 `vite-env.d.ts` 以支援 `import.meta.env`。修正 strict 產生的型別錯誤：App.tsx（img src null）、StartScreen（StartScreenProps）、LanguageContext（t 第二參數插值）、TravelResult（onEditInEditor 簽名）、idPhoto（clothingReferenceImage null）。原建議：

---

### 4.2 ESLint ✅ 已實作

**原況**：專案中未發現 ESLint 設定。

**已實作**：新增 `eslint.config.js`（flat config），使用 `@typescript-eslint`、`eslint-plugin-react`、`eslint-plugin-react-hooks`，涵蓋 `**/*.ts`、`**/*.tsx`。規則包含 recommended、React、React Hooks；`no-unused-vars` 設為 warn 並允許 `_` 前綴；新增 `npm run lint` 腳本。原建議：

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

---

## 七、本次全面檢視補充（後續檢視）

### 7.1 未捕獲錯誤與 Error Boundary ✅ 已實作

**原況**：`index.tsx` 僅以 `React.StrictMode` 包裝，未使用 `ErrorBoundary`。

**已實作**：新增 `components/ErrorBoundary.tsx`（class component，`getDerivedStateFromError` + `componentDidCatch`），於 `index.tsx` 根層級包裝 `BrowserRouter`，catch 時顯示友善錯誤訊息與「Reload page」按鈕，避免白屏。

---

### 7.2 單元測試

**現況**：專案中無 `*.test.ts(x)` / `*.spec.ts(x)`，亦未配置 Jest / Vitest。

**建議**：可先為核心邏輯（如 `utils/fileUtils.ts`、`services/gemini/shared.ts` 的 `normalizeApiError`、`dataURLtoFile`）與關鍵 hook 撰寫單元測試，再逐步涵蓋 UI。建置前可加入 `npm run test` 以維持品質。

---

### 7.3 生產環境 console 日誌

**現況**：`services/gemini/*.ts` 與多處 hook 內有 `console.log` / `console.warn` / `console.error`，除錯用 log 會出現在生產環境。

**建議**：以環境變數或 Vite `define` 區分 dev/prod，僅在開發時輸出 debug log；或統一改用小型 logger 模組，依 level 與 `import.meta.env.DEV` 決定是否輸出。`console.error` 用於真實錯誤可保留，但可考慮送往錯誤追蹤服務。

---

### 7.4 型別安全

**現況**：`SettingsModal` 曾以 `setModel(e.target.value as any)` 設定模型。

**已實作**：改為 `setModel(e.target.value as ModelType)` 並自 `SettingsContext` 匯入 `ModelType`，避免使用 `any`。

---

## 八、已實作項目（本次檢視後完成）

| 項目 | 說明 |
|------|------|
| **建置 404** | 新增 `scripts/copy-404.mjs`（ESM），`package.json` build 改為 `vite build && node scripts/copy-404.mjs`。 |
| **ServiceCard 無障礙** | `features/photography-service/ServiceCard.tsx` 新增 `role="button"`、`tabIndex={0}`、`onKeyDown`（Enter/Space）、`aria-label`、focus ring。 |
| **SettingsModal 型別** | `components/SettingsModal.tsx` 的 model 選單改為 `ModelType` 型別斷言，移除 `any`。 |
| **路由 Code Splitting** | `App.tsx` 功能頁改為 `React.lazy` + `Suspense`（fallback `<Spinner />`），建置產出各頁獨立 chunk，首屏僅載入 index + vendor。 |
| **Context value useMemo** | `SettingsContext`、`ThemeContext` 的 Provider value 改為 `useMemo` 包裝，減少不必要重繪。 |
| **handleImageClick useCallback** | `App.tsx` 編輯器區 `handleImageClick` 改為 `useCallback(..., [activeTab])`。 |
| **根層 Error Boundary** | 新增 `components/ErrorBoundary.tsx`，於 `index.tsx` 包裝整棵樹，catch 時顯示錯誤 UI 與「Reload page」。 |
| **主題 helper** | `utils/themeUtils.ts` 新增 `getEditorThemeClasses(theme)`，App 編輯器區改用 `editorTheme.*`。 |
| **TypeScript strict** | `tsconfig.json` 啟用 `strict`、`strictNullChecks`；新增 `vite-env.d.ts`、`@types/react` / `@types/react-dom`；修正相關型別錯誤。 |
| **ESLint** | 新增 `eslint.config.js`（flat config）、TypeScript + React + React Hooks 規則、`npm run lint`。 |

以上已實作項目可直接沿用；其餘建議（單元測試、生產環境 console 等）仍可依優先順序排入後續迭代。
