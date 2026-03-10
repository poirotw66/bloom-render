# 優化功能實作總結

> 實作日期：2026-02-03  
> 完成項目：錯誤處理統一化、程式碼重複消除、用戶體驗改進

---

## 一、錯誤處理統一化 ✅

### 1.1 統一 API 錯誤處理邏輯

**檔案**：`services/gemini/shared.ts`

- ✅ 新增 `ApiErrorType` 枚舉，定義錯誤類型（BLOCKED、SAFETY_FILTER、NO_IMAGE、NETWORK_ERROR 等）
- ✅ 新增 `normalizeApiError` 函數，統一轉換 API 錯誤為使用者友善的錯誤訊息
- ✅ 更新 `handleApiResponse` 函數，為錯誤添加 `name` 屬性以便識別錯誤類型

**錯誤類型**：

- `API_KEY_MISSING`：API 金鑰缺失
- `BLOCKED`：請求被阻擋
- `SAFETY_FILTER`：安全過濾
- `NO_IMAGE`：未返回圖片
- `NETWORK_ERROR`：網路錯誤
- `QUOTA_EXCEEDED`：配額用盡
- `INVALID_REQUEST`：無效請求
- `UNKNOWN`：未知錯誤

### 1.2 錯誤訊息多語化

**檔案**：`contexts/LanguageContext.tsx`

新增統一的錯誤訊息 i18n key：

- `error.api_key_missing`
- `error.blocked`
- `error.safety_filter`
- `error.no_image`
- `error.network_error`
- `error.quota_exceeded`
- `error.invalid_request`
- `error.unknown`
- `error.generation_failed`

支援英文與繁體中文。

### 1.3 更新所有 use\* hooks

**更新的檔案**：

- ✅ `features/portrait/usePortrait.ts`
- ✅ `features/themed/useThemed.ts`
- ✅ `features/idphoto/useIdPhoto.ts`

**變更**：

- 移除硬編碼的 `Failed: ${msg}` 錯誤訊息
- 使用 `normalizeApiError` 統一處理錯誤
- 使用 i18n key 顯示錯誤訊息

---

## 二、程式碼重複消除 ✅

### 2.1 共用 Hook：`useGeneratePage`

**檔案**：`hooks/useGeneratePage.ts`

提供統一的生成頁面邏輯，包含：

- 檔案管理（上傳、預覽、拖放）
- 選項管理（從 URL 參數讀取）
- 生成邏輯（含進度追蹤）
- 錯誤處理（使用統一錯誤處理）
- 下載與清除結果

**使用方式**：

```typescript
const page = useGeneratePage({
  defaultFile: null,
  defaultOptions: {
    /* ... */
  },
  readSearchParams: (params) => {
    /* ... */
  },
  generateApi: generateProfessionalPortrait,
  errorContext: 'portrait',
});
```

### 2.2 共用元件：`GenericUploadSection`

**檔案**：`components/GenericUploadSection.tsx`

統一的檔案上傳區塊，支援：

- 拖放上傳
- 預覽顯示
- 錯誤顯示
- 載入狀態
- 可自訂圖示與提示文字

### 2.3 共用元件：`GenericResult`

**檔案**：`components/GenericResult.tsx`

統一的結果顯示區塊，支援：

- 結果圖片顯示
- 參數資訊顯示
- 下載、編輯、重新生成按鈕
- 可自訂參數標籤

---

## 三、用戶體驗改進 ✅

### 3.1 生成進度指示

**檔案**：`components/ProgressIndicator.tsx`

新增進度指示元件，包含：

- 進度百分比顯示
- 進度條動畫
- 狀態訊息輪播（可選）
- 統一的載入樣式

**更新的頁面**：

- ✅ `features/portrait/PortraitPage.tsx`
- ✅ `features/themed/ThemedPage.tsx`
- ✅ `features/idphoto/IdPhotoPage.tsx`

所有生成頁面現在顯示進度百分比而非僅 Spinner。

### 3.2 批量處理功能

**檔案**：`hooks/useBatchProcessing.ts`

新增批量處理 hook，支援：

- 並發控制（預設最多 3 個同時處理）
- 進度追蹤（已完成/總數/當前）
- 結果收集（成功與失敗分開）
- 歷史記錄整合
- 回調函數（onProgress、onItemComplete、onComplete、onError）

**使用方式**：

```typescript
const batch = useBatchProcessing();

await batch.processBatch(files, {
  generateApi: generateProfessionalPortrait,
  options: { portraitType, outputSpec },
  settings: { apiKey, model },
  maxConcurrent: 3,
  historyType: 'portrait',
  onProgress: (completed, total) => {
    /* ... */
  },
});
```

### 3.3 歷史記錄功能

**檔案**：`hooks/useHistory.ts`

新增歷史記錄 hook，功能包含：

- 自動儲存到 localStorage
- 最多保留 50 筆記錄
- 依類型篩選
- 新增、刪除、清除記錄

**整合**：

- ✅ `features/portrait/usePortrait.ts` - 生成後自動加入歷史
- ✅ `features/themed/useThemed.ts` - 生成後自動加入歷史
- ✅ `features/idphoto/useIdPhoto.ts` - 生成後自動加入歷史

**歷史記錄結構**：

```typescript
interface HistoryItem {
  id: string;
  type: string; // 'portrait' | 'themed' | 'idphoto' | ...
  result: string; // data URL
  timestamp: number;
  options?: Record<string, unknown>;
}
```

---

## 四、檔案結構變更

### 新增檔案

```
hooks/
  ├── useGeneratePage.ts          # 共用生成頁面 hook
  ├── useBatchProcessing.ts       # 批量處理 hook
  └── useHistory.ts               # 歷史記錄 hook

components/
  ├── ProgressIndicator.tsx      # 進度指示元件
  ├── GenericUploadSection.tsx   # 共用上傳區塊
  └── GenericResult.tsx          # 共用結果顯示
```

### 修改檔案

```
services/gemini/
  └── shared.ts                   # 新增錯誤處理函數

contexts/
  └── LanguageContext.tsx         # 新增錯誤訊息 i18n key

features/portrait/
  ├── usePortrait.ts             # 使用統一錯誤處理、進度、歷史
  └── PortraitPage.tsx           # 使用 ProgressIndicator

features/themed/
  ├── useThemed.ts               # 使用統一錯誤處理、進度、歷史
  └── ThemedPage.tsx             # 使用 ProgressIndicator

features/idphoto/
  ├── useIdPhoto.ts              # 使用統一錯誤處理、進度、歷史
  └── IdPhotoPage.tsx            # 使用 ProgressIndicator
```

---

## 五、使用範例

### 5.1 使用統一錯誤處理

```typescript
import { normalizeApiError } from '../../services/gemini/shared';

try {
  const result = await generateApi(file, options, settings);
  // ...
} catch (err) {
  const normalizedError = normalizeApiError(err, 'portrait');
  const errorKey = normalizedError.message || 'error.unknown';
  setError(t(errorKey));
}
```

### 5.2 使用進度指示

```typescript
import ProgressIndicator from '../../components/ProgressIndicator';

{loading ? (
  <ProgressIndicator
    progress={progress}
    statusMessages={['portrait.generating']}
  />
) : (
  // ...
)}
```

### 5.3 使用歷史記錄

```typescript
import { useHistory } from '../../hooks/useHistory';

const { addToHistory, getHistoryByType } = useHistory();

// 生成後加入歷史
addToHistory('portrait', resultUrl, { portraitType, outputSpec });

// 取得特定類型的歷史
const portraitHistory = getHistoryByType('portrait');
```

### 5.4 使用批量處理

```typescript
import { useBatchProcessing } from '../../hooks/useBatchProcessing';

const batch = useBatchProcessing();

const handleBatchGenerate = async () => {
  const { results, errors } = await batch.processBatch(files, {
    generateApi: generateProfessionalPortrait,
    options: { portraitType, outputSpec },
    settings: { apiKey, model },
    maxConcurrent: 3,
    historyType: 'portrait',
    onProgress: (completed, total) => {
      console.log(`Progress: ${completed}/${total}`);
    },
  });
};
```

---

## 六、後續建議

### 6.1 可選改進

1. **歷史記錄 UI**：建立歷史記錄頁面或側邊欄，讓用戶查看與重新下載過去的結果
2. **批量處理 UI**：在證件照/形象照頁面添加批量上傳按鈕與進度顯示
3. **錯誤重試機制**：為失敗的請求添加重試按鈕
4. **進度細化**：根據實際 API 回應細化進度階段（如 TravelPage 的狀態輪播）

### 6.2 遷移建議

現有的 `usePortrait`、`useThemed`、`useIdPhoto` 已更新使用統一錯誤處理與歷史記錄。未來可考慮：

- 逐步遷移到 `useGeneratePage`（需處理選項結構差異）
- 使用 `GenericUploadSection` 和 `GenericResult` 取代現有元件（需保持向後相容）

---

## 七、測試建議

1. **錯誤處理測試**：測試各種錯誤情況（API key 缺失、網路錯誤、配額用盡等）
2. **進度指示測試**：確認進度條正確顯示與動畫流暢
3. **歷史記錄測試**：確認記錄正確儲存與載入，localStorage 限制處理
4. **批量處理測試**：測試並發控制、錯誤處理、進度追蹤

---

**狀態**：✅ 所有功能已完成並通過編譯測試
