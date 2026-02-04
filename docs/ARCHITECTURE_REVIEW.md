# 程式架構審視

> 從程式架構面檢視專案，列出既有問題與可選優化。

---

## 一、目前架構概況（無嚴重問題）

- **分層**：`App` 負責路由與編輯器；各功能在 `features/*`（Page + Form + UploadSection + Result + useXxx）；共用元件在 `components/`；API 在 `services/geminiService`；領域常數在 `constants/`；共用型別在 `types.ts`。
- **依賴方向**：features → contexts / components / constants / services / utils / types，無反向依賴，無跨 feature 互相引用（photography-service 僅被 App 使用）。
- **狀態**：編輯器狀態在 App；各功能頁狀態在各自 useXxx；Language / Settings / Theme 用 Context，合理。
- **路由**：集中定義在 App.tsx，路徑與元件對應清楚。

整體沒有明顯架構錯誤或循環依賴。

---

## 二、可改進的架構面

### 2.1 型別與常數的歸屬不一致

| 領域 | 型別定義位置 | 常數定義位置 |
|------|--------------|--------------|
| IdPhoto | `types.ts`（並由 `constants/idPhoto.ts` 再匯出） | `constants/idPhoto.ts` |
| Portrait | `types.ts` | `constants/portrait.ts` |
| Themed | `types.ts` | `constants/themed.ts` |
| Travel | **`constants/travel.ts`**（型別與常數同檔案） | `constants/travel.ts` |
| Photography 服務 | **`features/photography-service/types.ts`**（feature 內） | `constants/photographyService.ts` |

- **Travel**：領域型別（如 `TravelAspectRatio`、`TravelStyle`）放在 `constants/travel.ts`，其餘領域型別在根目錄 `types.ts`，歸屬不統一。
- **建議（可選）**：若要統一，可把 Travel 相關的「領域型別」移到 `types.ts`，`constants/travel.ts` 只做常數與再匯出；或接受「travel 自成一包」的現狀並在 README 註明。

### 2.2 `geminiService.ts` 職責過多、耦合多個領域

- **現狀**：單檔負責編輯、濾鏡、調整、證件照、形象照、主題照、旅遊照、文生圖、提示詞優化等，並依賴多個 constants（travel、idPhoto、portrait、themed）。
- **影響**：檔案大（600+ 行）、改一個領域易動到其他、多人協作易衝突。
- **建議（可選）**：  
  - 依領域拆成多個模組，例如：`services/gemini/edit.ts`、`gemini/idPhoto.ts`、`gemini/portrait.ts`、`gemini/themed.ts`、`gemini/travel.ts`、`gemini/generate.ts`，再由 `geminiService.ts` 或 `services/gemini/index.ts` 統一 re-export。  
  - 或至少把「與 idphoto/portrait/themed/travel 強相關」的 prompt 組裝抽到各自小檔，主檔只負責呼叫 API 與共用 `fileToPart` / `handleApiResponse`。

### 2.3 `App.tsx` 同時負責路由與編輯器邏輯

- **現狀**：App 內含編輯器狀態（history、crop、activeTab、hotspot 等）、所有編輯器 handler，以及 `renderEditor()` 的大段 JSX（約 200+ 行）。
- **影響**：App 較長，路由/版面與編輯器邏輯混在一起，不利單元測試編輯器行為。
- **建議（可選）**：  
  - 將編輯器狀態與邏輯抽成 `useEditor(initialImage: File | null)`，回傳 `{ currentImage, handlers, ... }`。  
  - 或將「編輯器區塊」抽成獨立元件，例如 `<EditorView history={...} onUndo={...} ... />`，由 App 只負責提供 state 與 callback。  
這樣 App 專注在路由與版面，編輯器變更好維護與測試。

### 2.4 路由設定為硬編碼

- **現狀**：`<Route path="/idphoto" element={...} />` 等直接寫在 App.tsx。
- **影響**：新增/修改路由或權限時要改 App，路徑字串散落各處（如 photographyService 的 `targetRoute`）時可能不一致。
- **建議（可選）**：  
  - 定義路由設定陣列（例如 `routes.ts`：`{ path, element }[]`），App 用 `routes.map(...)` 渲染；或  
  - 至少把路徑常數集中成一個小模組（如 `constants/routes.ts`），照片館的 `targetRoute` 與 App 的 path 都引用同一組常數，避免打錯字或漏改。

### 2.5 重複的「生成頁」模式（非錯誤，可選優化）

- **現狀**：idphoto、portrait、themed 皆為「表單選項 + 上傳區 + 生成 + 結果區」，hook 結構類似（file、result、loading、error、searchParams 預填、generate、download、clear）。
- **建議（可選）**：  
  - 若之後再增加類似頁面，可抽成共用 hook，例如：  
    `useGeneratePage<T>({ defaultOptions, parseSearchParams, generateApi })`  
    回傳 `{ file, setFile, result, loading, error, options, setOptions, generate, download, clear, ... }`。  
  - 或僅在文件註明「idphoto/portrait/themed 採用同一模式」，複製貼上時有一致範例即可。

---

## 三、小結

| 項目 | 嚴重度 | 說明 |
|------|--------|------|
| 型別/常數歸屬不一致 | 低 | Travel 型別在 constants、其餘在 types；可選統一或文件化 |
| geminiService 單檔過大 | 中 | 可依領域拆分或抽離 prompt 組裝，利維護與協作 |
| App 含編輯器邏輯 | 中 | 可抽 useEditor 或 EditorView，利測試與閱讀 |
| 路由硬編碼 | 低 | 可集中路由設定或路徑常數，避免不一致 |
| 生成頁模式重複 | 低 | 可選抽共用 hook 或僅文件化 |

**結論**：架構面沒有致命問題，依賴方向正確、feature 邊界清楚。上述皆為「可改進項」，可依優先級與時間分批處理（例如先拆 geminiService 或抽編輯器，再考慮型別歸屬與路由常數）。
