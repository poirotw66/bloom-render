# BloomRender 專案優化計畫 2026

> 最後更新：2026-05-08  
> 基於專案全面檢視與現有優化文件整合

---

## 執行摘要

本文件整合了 [`ARCHITECTURE_REVIEW.md`](./ARCHITECTURE_REVIEW.md)、[`OPTIMIZATION_ROADMAP.md`](./OPTIMIZATION_ROADMAP.md) 與 [`REVIEW_OPTIMIZATIONS.md`](./REVIEW_OPTIMIZATIONS.md) 的內容，並基於最新的專案檢視，提供一份系統性的優化計畫。

### 專案現況評估

**✅ 已完成的優化項目：**

- 路由層級 Code Splitting（React.lazy + Suspense）
- Context value 使用 useMemo 優化
- 主題樣式集中管理（themeUtils）
- TypeScript strict 模式啟用
- ESLint 配置完成
- Error Boundary 實作
- ServiceCard 無障礙性改進
- 建置腳本 ESM 化
- 共用 Hook 實作（useGeneratePage、useBatchProcessing、useHistory）
- 共用元件實作（GenericUploadSection、GenericResult）
- 圖片壓縮功能

**🎯 核心優勢：**

- 清晰的功能模組化（features/）
- 良好的依賴方向（無循環依賴）
- 完整的多語系支援
- 豐富的 AI 生成功能

---

## 一、架構優化

### 1.1 型別與常數歸屬統一 🟡 中優先級

**現況問題：**

- Travel 領域型別定義在 `constants/travel.ts`
- 其他領域型別定義在根目錄 `types.ts`
- Photography Service 型別在 `features/photography-service/types.ts`

**建議方案：**

**選項 A：統一至根目錄（推薦）**

```typescript
// types.ts - 統一所有領域型別
export type TravelAspectRatio = '1:1' | '4:3' | '3:4' | '16:9' | '9:16';
export type TravelStyle = 'natural' | 'cinematic' | 'vintage' | ...;
// ... 其他 Travel 型別

// constants/travel.ts - 僅保留常數與再匯出
export { TravelAspectRatio, TravelStyle } from '../types';
export const TRAVEL_STYLES = [...];
```

**選項 B：文件化現狀**

- 在 README 或 ARCHITECTURE.md 註明型別歸屬規則
- 接受 Travel 自成一包的現狀

**影響範圍：**

- `types.ts`
- `constants/travel.ts`
- `features/travel/*.ts`

---

### 1.2 路由配置集中化 🟢 低優先級

**現況問題：**

- 路由路徑硬編碼在 `App.tsx`
- `photographyService.ts` 的 `targetRoute` 可能與實際路徑不一致

**建議方案：**

```typescript
// constants/routes.ts
export const ROUTES = {
  HOME: '/',
  GENERATE: '/generate',
  EDIT: '/edit',
  ID_PHOTO: '/idphoto',
  PORTRAIT: '/portrait',
  TRAVEL: '/travel',
  THEMED: '/themed',
  COUPLE_GROUP: '/couple-group',
  TRY_ON: '/try-on',
  PHOTOGRAPHY_SERVICE: '/photography-service',
} as const;

// App.tsx
import { ROUTES } from './constants/routes';
<Route path={ROUTES.ID_PHOTO} element={<IdPhotoPage />} />

// constants/photographyService.ts
import { ROUTES } from './routes';
targetRoute: ROUTES.ID_PHOTO
```

**優點：**

- 單一真實來源（Single Source of Truth）
- 避免路徑拼寫錯誤
- 便於路由重構

**影響範圍：**

- 新增 `constants/routes.ts`
- `App.tsx`
- `constants/photographyService.ts`
- 各功能頁的導航邏輯

---

### 1.3 編輯器邏輯抽離 🟡 中優先級

**現況問題：**

- `App.tsx` 同時負責路由與編輯器邏輯（約 600 行）
- 編輯器狀態與處理函數混在 App 中
- 不利於單元測試與維護

**建議方案：**

**選項 A：抽成自訂 Hook**

```typescript
// hooks/useEditor.ts
export function useEditor(initialImage: File | null) {
  const [history, setHistory] = useState<File[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  // ... 所有編輯器狀態與邏輯

  return {
    currentImage,
    originalImage,
    handlers: {
      handleGenerate,
      handleApplyFilter,
      handleApplyCrop,
      handleUndo,
      handleRedo,
      // ...
    },
    state: {
      isLoading,
      error,
      canUndo,
      canRedo,
      // ...
    },
  };
}

// App.tsx
const editor = useEditor(null);
```

**選項 B：抽成獨立元件**

```typescript
// components/EditorView.tsx
interface EditorViewProps {
  history: File[];
  historyIndex: number;
  onGenerate: () => void;
  // ... 其他 props
}

// App.tsx
<Route path="/edit" element={
  <EditorView
    history={history}
    historyIndex={historyIndex}
    onGenerate={handleGenerate}
    // ...
  />
} />
```

**推薦：選項 A（Hook）**

- 更好的邏輯封裝
- 便於測試
- 保持 App.tsx 專注於路由

**影響範圍：**

- 新增 `hooks/useEditor.ts`
- `App.tsx` 簡化

---

## 二、程式碼品質優化

### 2.1 錯誤處理統一化 ⚠️ 高優先級

**現況問題：**

- 部分錯誤訊息為硬編碼英文
- 各 hook 自行處理錯誤，格式不一致
- `normalizeApiError` 已實作但未完全統一使用

**建議方案：**

**階段 1：統一錯誤訊息多語化**

```typescript
// contexts/LanguageContext.tsx - 補充錯誤訊息 key
const translations = {
  en: {
    'error.api_key_missing': 'API key is missing. Please set it in Settings.',
    'error.blocked': 'Request was blocked. Please try different content.',
    'error.safety_filter': 'Content filtered by safety system.',
    'error.no_image': 'No image was generated.',
    'error.quota_exceeded': 'API quota exceeded. Please try again later.',
    'error.network_error': 'Network error. Please check your connection.',
    'error.invalid_request': 'Invalid request. Please check your input.',
    'error.unknown': 'An unknown error occurred.',
    // 各功能特定錯誤
    'portrait.error_failed': 'Failed to generate portrait',
    'themed.error_failed': 'Failed to generate themed photo',
    // ...
  },
  'zh-TW': {
    'error.api_key_missing': 'API 金鑰遺失，請至設定中輸入。',
    // ...
  },
};
```

**階段 2：統一使用 normalizeApiError**

```typescript
// 所有 hook 統一使用
try {
  const result = await generateApi(...);
} catch (err) {
  const normalizedError = normalizeApiError(err, 'portrait');
  setError(t(normalizedError.message));
  console.error('Generation error:', normalizedError.originalError);
}
```

**階段 3：建立共用錯誤顯示元件（已完成）**

- `components/ErrorDisplay.tsx` 已存在
- 確保所有頁面統一使用

**影響範圍：**

- `contexts/LanguageContext.tsx`
- `features/*/use*.ts`
- `services/gemini/*.ts`

---

### 2.2 生產環境 Console 日誌清理 🟡 中優先級

**現況問題：**

- 多處使用 `console.log`、`console.warn` 用於除錯
- 生產環境會輸出不必要的日誌

**建議方案：**

**選項 A：環境變數控制**

```typescript
// utils/logger.ts
const isDev = import.meta.env.DEV;

export const logger = {
  debug: (...args: unknown[]) => {
    if (isDev) console.log('[DEBUG]', ...args);
  },
  info: (...args: unknown[]) => {
    if (isDev) console.info('[INFO]', ...args);
  },
  warn: (...args: unknown[]) => {
    console.warn('[WARN]', ...args);
  },
  error: (...args: unknown[]) => {
    console.error('[ERROR]', ...args);
  },
};

// 使用
import { logger } from '@/utils/logger';
logger.debug('Image compressed:', compressed.size);
logger.error('Generation failed:', error);
```

**選項 B：Vite 建置時移除**

```javascript
// vite.config.ts
export default defineConfig({
  esbuild: {
    drop: process.env.NODE_ENV === 'production' ? ['console', 'debugger'] : [],
  },
});
```

**推薦：選項 A + 選項 B 組合**

- 開發時使用 logger 便於除錯
- 生產建置時自動移除 console

**影響範圍：**

- 新增 `utils/logger.ts`
- `vite.config.ts`
- 所有使用 console 的檔案

---

### 2.3 型別安全強化 🟢 低優先級

**現況問題：**

- 雖已啟用 TypeScript strict，但仍有改進空間
- 部分地方使用型別斷言可以更精確

**建議改進：**

```typescript
// 使用 discriminated unions
type GenerationState =
  | { status: 'idle' }
  | { status: 'loading'; progress: number }
  | { status: 'success'; result: string }
  | { status: 'error'; error: string };

// 使用 branded types 避免混淆
type ImageDataURL = string & { readonly __brand: 'ImageDataURL' };
type FileURL = string & { readonly __brand: 'FileURL' };

// 更精確的函數簽名
function processImage(url: ImageDataURL): Promise<File>;
function createObjectURL(file: File): FileURL;
```

**影響範圍：**

- `types.ts`
- 各功能 hook

---

## 三、效能優化

### 3.1 圖片壓縮策略優化 ✅ 已實作（可微調）

**現況：**

- 已實作 `compressImageIfNeeded` 與 Web Worker
- 預設閾值 5MB

**可選微調：**

```typescript
// 根據圖片用途調整壓縮策略
export const COMPRESSION_PRESETS = {
  thumbnail: { maxWidth: 800, maxHeight: 800, quality: 0.7 },
  preview: { maxWidth: 1920, maxHeight: 1920, quality: 0.85 },
  highQuality: { maxWidth: 4096, maxHeight: 4096, quality: 0.92 },
};

// 根據 API 需求自動選擇
async function prepareImageForApi(file: File, apiType: string) {
  const preset =
    apiType === 'idphoto' ? COMPRESSION_PRESETS.highQuality : COMPRESSION_PRESETS.preview;
  return compressImage(file, preset);
}
```

---

### 3.2 Vite Build 優化 🟢 低優先級

**現況：**

- 已實作基本 manualChunks（vendor）
- 已實作路由層級 Code Splitting

**可選進階優化：**

```typescript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          // 第三方套件
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom')) {
              return 'react-vendor';
            }
            if (id.includes('@google/genai')) {
              return 'gemini-sdk';
            }
            return 'vendor';
          }

          // Gemini 服務
          if (id.includes('services/gemini')) {
            return 'gemini-services';
          }

          // 共用元件
          if (id.includes('components/')) {
            return 'components';
          }
        },
      },
    },
    // 啟用 CSS code splitting
    cssCodeSplit: true,
    // 調整 chunk 大小警告閾值
    chunkSizeWarningLimit: 1000,
  },
});
```

---

### 3.3 快取策略 🟡 中優先級

**建議實作：**

```typescript
// utils/cache.ts
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresIn: number;
}

class SimpleCache<T> {
  private cache = new Map<string, CacheEntry<T>>();

  set(key: string, data: T, expiresIn = 3600000) {
    // 1小時
    this.cache.set(key, { data, timestamp: Date.now(), expiresIn });
  }

  get(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() - entry.timestamp > entry.expiresIn) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  clear() {
    this.cache.clear();
  }
}

// 使用範例
const resultCache = new SimpleCache<string>();

async function generateWithCache(params: GenerateParams) {
  const cacheKey = JSON.stringify(params);
  const cached = resultCache.get(cacheKey);
  if (cached) return cached;

  const result = await generateApi(params);
  resultCache.set(cacheKey, result);
  return result;
}
```

**應用場景：**

- 相同參數的生成結果
- 場景圖片載入
- 地圖資源

---

## 四、使用者體驗優化

### 4.1 生成進度優化 ✅ 已實作（可增強）

**現況：**

- 已有 `startRandomProgressTicker` 模擬進度
- TravelPage 有狀態輪播

**可選增強：**

```typescript
// 更精確的進度估算
interface ProgressStage {
  name: string;
  weight: number;
  message: string;
}

const GENERATION_STAGES: ProgressStage[] = [
  { name: 'upload', weight: 0.1, message: 'Uploading image...' },
  { name: 'analyze', weight: 0.2, message: 'Analyzing content...' },
  { name: 'generate', weight: 0.6, message: 'Generating result...' },
  { name: 'finalize', weight: 0.1, message: 'Finalizing...' },
];

// 顯示當前階段
function ProgressIndicator({ progress, stage }: Props) {
  return (
    <div>
      <div className="progress-bar" style={{ width: `${progress}%` }} />
      <p>{GENERATION_STAGES[stage].message}</p>
    </div>
  );
}
```

---

### 4.2 批次處理 UI 改進 ✅ 已實作（可增強）

**現況：**

- 已有 `useBatchProcessing` hook
- 已有 `BatchProgress` 元件

**可選增強：**

```typescript
// 批次處理狀態視覺化
interface BatchItemStatus {
  index: number;
  status: 'pending' | 'processing' | 'success' | 'error';
  result?: string;
  error?: string;
}

function BatchProgressGrid({ items }: { items: BatchItemStatus[] }) {
  return (
    <div className="grid grid-cols-3 gap-4">
      {items.map(item => (
        <div key={item.index} className={`status-${item.status}`}>
          {item.status === 'success' && <img src={item.result} />}
          {item.status === 'error' && <ErrorIcon />}
          {item.status === 'processing' && <Spinner />}
        </div>
      ))}
    </div>
  );
}
```

---

### 4.3 鍵盤快捷鍵 🟢 低優先級

**建議實作：**

```typescript
// hooks/useKeyboardShortcuts.ts
export function useKeyboardShortcuts(handlers: {
  onUndo?: () => void;
  onRedo?: () => void;
  onSave?: () => void;
  onReset?: () => void;
}) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const modifier = isMac ? e.metaKey : e.ctrlKey;

      if (modifier && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handlers.onUndo?.();
      } else if (modifier && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        handlers.onRedo?.();
      } else if (modifier && e.key === 's') {
        e.preventDefault();
        handlers.onSave?.();
      } else if (modifier && e.key === 'r') {
        e.preventDefault();
        handlers.onReset?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlers]);
}

// App.tsx 編輯器區
useKeyboardShortcuts({
  onUndo: handleUndo,
  onRedo: handleRedo,
  onSave: handleDownload,
  onReset: handleReset,
});
```

---

### 4.4 上傳前預覽與驗證 🟡 中優先級

**建議實作：**

```typescript
// utils/imageValidation.ts
export interface ImageValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  info: {
    width: number;
    height: number;
    size: number;
    format: string;
  };
}

export async function validateImage(file: File): Promise<ImageValidationResult> {
  const result: ImageValidationResult = {
    valid: true,
    errors: [],
    warnings: [],
    info: { width: 0, height: 0, size: file.size, format: file.type },
  };

  // 檢查檔案大小
  const maxSize = 50 * 1024 * 1024; // 50MB
  if (file.size > maxSize) {
    result.errors.push(`File size exceeds ${maxSize / 1024 / 1024}MB`);
    result.valid = false;
  }

  // 檢查圖片尺寸
  const img = await loadImage(file);
  result.info.width = img.width;
  result.info.height = img.height;

  if (img.width < 512 || img.height < 512) {
    result.warnings.push('Image resolution is low, may affect quality');
  }

  if (img.width > 4096 || img.height > 4096) {
    result.warnings.push('Large image will be compressed');
  }

  return result;
}

// 使用
const validation = await validateImage(file);
if (!validation.valid) {
  setError(validation.errors.join(', '));
  return;
}
if (validation.warnings.length > 0) {
  showWarning(validation.warnings.join(', '));
}
```

---

## 五、測試與文件

### 5.1 單元測試 🟡 中優先級

**現況：**

- 已配置 Vitest
- 僅有 `utils/generationHelpers.test.ts`

**建議測試範圍：**

```typescript
// utils/fileUtils.test.ts
describe('dataURLtoFile', () => {
  it('should convert data URL to File', () => {
    const dataUrl = 'data:image/png;base64,iVBORw0KG...';
    const file = dataURLtoFile(dataUrl, 'test.png');
    expect(file).toBeInstanceOf(File);
    expect(file.name).toBe('test.png');
    expect(file.type).toBe('image/png');
  });
});

// services/gemini/shared.test.ts
describe('normalizeApiError', () => {
  it('should detect API key missing error', () => {
    const error = new Error('API key is missing');
    const result = normalizeApiError(error);
    expect(result.type).toBe(ApiErrorType.API_KEY_MISSING);
    expect(result.message).toBe('error.api_key_missing');
  });
});

// hooks/useGeneratePage.test.ts
describe('useGeneratePage', () => {
  it('should handle file upload', () => {
    const { result } = renderHook(() => useGeneratePage({...}));
    // ...
  });
});
```

**測試覆蓋目標：**

- Utils: 80%+
- Services: 70%+
- Hooks: 60%+
- Components: 50%+

---

### 5.2 E2E 測試 🟢 低優先級

**建議使用 Playwright：**

```typescript
// tests/e2e/idphoto.spec.ts
import { test, expect } from '@playwright/test';

test('ID Photo generation flow', async ({ page }) => {
  await page.goto('/idphoto');

  // 上傳圖片
  await page.setInputFiles('input[type="file"]', 'test-image.jpg');

  // 選擇選項
  await page.selectOption('select[name="idPhotoType"]', 'passport');

  // 生成
  await page.click('button:has-text("Generate")');

  // 等待結果
  await expect(page.locator('img[alt="Generated result"]')).toBeVisible();

  // 下載
  const downloadPromise = page.waitForEvent('download');
  await page.click('button:has-text("Download")');
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toContain('idphoto');
});
```

---

### 5.3 文件更新 🟡 中優先級

**需要更新的文件：**

1. **README.md**
   - ✅ 已包含主要功能說明
   - 可補充：效能優化功能（圖片壓縮）
   - 可補充：批次處理功能
   - 可補充：歷史記錄功能

2. **API 文檔**

   ````typescript
   /**
    * Generate ID photo from portrait image.
    *
    * @param file - Portrait image file
    * @param options - Generation options
    * @param options.idPhotoType - Type of ID photo (passport, visa, etc.)
    * @param options.retouchLevel - Retouch level (none, light, standard, heavy)
    * @param options.outputSpec - Output specification
    * @param settings - API settings (key, model)
    * @returns Promise<string> - Data URL of generated image
    * @throws {Error} - If API key is missing or generation fails
    *
    * @example
    * ```typescript
    * const result = await generateIdPhoto(file, {
    *   idPhotoType: 'passport',
    *   retouchLevel: 'standard',
    *   outputSpec: { format: '2inch', layout: 'single' }
    * }, { apiKey: 'your-key' });
    * ```
    */
   export async function generateIdPhoto(...) { }
   ````

3. **開發指南**

   ```markdown
   # docs/DEVELOPMENT.md

   ## 開發流程

   ### 新增功能頁面

   1. 在 `features/` 建立新目錄
   2. 實作 Page、Form、UploadSection、Result 元件
   3. 建立 useXxx hook（可使用 useGeneratePage）
   4. 在 `services/gemini/` 新增 API 函數
   5. 在 `App.tsx` 新增路由
   6. 更新多語系檔案

   ### 命名規範

   - 元件：PascalCase (IdPhotoPage)
   - Hook：camelCase with use prefix (useIdPhoto)
   - 常數：UPPER_SNAKE_CASE (ID_PHOTO_TYPES)
   - 檔案：kebab-case or PascalCase

   ### 提交規範

   - feat: 新功能
   - fix: 錯誤修復
   - docs: 文件更新
   - style: 格式調整
   - refactor: 重構
   - test: 測試
   - chore: 建置/工具
   ```

4. **架構文檔**
   - 更新 `ARCHITECTURE_REVIEW.md` 反映最新架構
   - 記錄設計決策與權衡

---

## 六、新功能開發方向

### 6.1 進階編輯功能 🟡 中優先級

**背景移除/替換**

```typescript
// services/gemini/backgroundRemoval.ts
export async function removeBackground(file: File, settings: ServiceSettings): Promise<string> {
  const prompt = `Remove the background from this image, 
    keeping only the main subject. Output a PNG with transparency.`;
  // ...
}

export async function replaceBackground(
  file: File,
  backgroundDescription: string,
  settings: ServiceSettings,
): Promise<string> {
  const prompt = `Replace the background with: ${backgroundDescription}. 
    Keep the main subject unchanged.`;
  // ...
}
```

**物件移除**

```typescript
export async function removeObject(
  file: File,
  objectDescription: string,
  settings: ServiceSettings,
): Promise<string> {
  const prompt = `Remove ${objectDescription} from this image 
    and fill the area naturally.`;
  // ...
}
```

---

### 6.2 歷史記錄 UI ✅ 已實作（可增強）

**現況：**

- 已有 `useHistory` hook
- 儲存於 localStorage

**可選增強：**

```typescript
// features/history/HistoryPage.tsx
export function HistoryPage() {
  const { history, removeFromHistory, clearHistory } = useHistory();
  const [filter, setFilter] = useState<string>('all');

  const filteredHistory = filter === 'all'
    ? history
    : history.filter(item => item.type === filter);

  return (
    <div>
      <div className="filters">
        <button onClick={() => setFilter('all')}>All</button>
        <button onClick={() => setFilter('idphoto')}>ID Photo</button>
        <button onClick={() => setFilter('portrait')}>Portrait</button>
        {/* ... */}
      </div>

      <div className="grid">
        {filteredHistory.map(item => (
          <HistoryCard
            key={item.id}
            item={item}
            onDelete={() => removeFromHistory(item.id)}
            onDownload={() => downloadImage(item.result)}
          />
        ))}
      </div>

      <button onClick={clearHistory}>Clear All</button>
    </div>
  );
}
```

---

### 6.3 照片館 Phase 3 🟢 低優先級

**API 載入方案**

```typescript
// services/photographyService.ts
export async function fetchServices(): Promise<ServiceItem[]> {
  try {
    const response = await fetch('/api/services');
    return await response.json();
  } catch (error) {
    console.warn('Failed to fetch services, using fallback');
    return PHOTOGRAPHY_SERVICES; // 靜態 fallback
  }
}

// features/photography-service/PhotographyServicePage.tsx
const [services, setServices] = useState(PHOTOGRAPHY_SERVICES);

useEffect(() => {
  fetchServices().then(setServices);
}, []);
```

---

## 七、優先級總覽與實施建議

### 🔴 高優先級（立即處理）

1. **錯誤處理統一化**
   - 工作量：中（2-3 天）
   - 影響：提升使用者體驗與程式碼品質
   - 依賴：無

2. **文件更新**
   - 工作量：小（1 天）
   - 影響：便於維護與新成員加入
   - 依賴：無

### 🟡 中優先級（近期處理）

3. **編輯器邏輯抽離**
   - 工作量：中（2-3 天）
   - 影響：提升程式碼可維護性
   - 依賴：無

4. **生產環境日誌清理**
   - 工作量：小（1 天）
   - 影響：減少生產環境輸出
   - 依賴：無

5. **快取策略實作**
   - 工作量：中（2-3 天）
   - 影響：提升效能與使用者體驗
   - 依賴：無

6. **單元測試**
   - 工作量：大（持續進行）
   - 影響：提升程式碼品質與信心
   - 依賴：無

7. **上傳前預覽與驗證**
   - 工作量：小（1-2 天）
   - 影響：提升使用者體驗
   - 依賴：無

### 🟢 低優先級（長期規劃）

8. **型別與常數歸屬統一**
   - 工作量：小（1 天）
   - 影響：提升程式碼一致性
   - 依賴：無

9. **路由配置集中化**
   - 工作量：小（1 天）
   - 影響：避免路徑錯誤
   - 依賴：無

10. **鍵盤快捷鍵**
    - 工作量：小（1 天）
    - 影響：提升進階使用者體驗
    - 依賴：無

11. **E2E 測試**
    - 工作量：大（持續進行）
    - 影響：確保功能正確性
    - 依賴：單元測試完成

12. **進階編輯功能**
    - 工作量：大（每個功能 3-5 天）
    - 影響：擴充產品功能
    - 依賴：核心功能穩定

13. **照片館 Phase 3**
    - 工作量：中（3-5 天）
    - 影響：擴充產品功能
    - 依賴：後端 API

---

## 八、實施時程建議

### Sprint 1（2 週）- 品質提升

- ✅ 錯誤處理統一化
- ✅ 文件更新（README、API 文檔）
- ✅ 生產環境日誌清理

### Sprint 2（2 週）- 架構優化

- ✅ 編輯器邏輯抽離
- ✅ 型別與常數歸屬統一
- ✅ 路由配置集中化

### Sprint 3（2 週）- 效能與體驗

- ✅ 快取策略實作
- ✅ 上傳前預覽與驗證
- ✅ 鍵盤快捷鍵

### Sprint 4+（持續）- 測試與新功能

- ✅ 單元測試覆蓋率提升至 60%+
- ✅ E2E 測試關鍵流程
- ✅ 進階編輯功能（依需求）
- ✅ 照片館 Phase 3（依需求）

---

## 九、成功指標

### 程式碼品質

- [ ] ESLint 無錯誤
- [ ] TypeScript strict 模式無錯誤
- [ ] 測試覆蓋率 > 60%
- [ ] 無 console.log 在生產環境

### 效能指標

- [ ] 首屏載入時間 < 3 秒
- [ ] 路由切換時間 < 500ms
- [ ] 圖片生成回應時間 < 30 秒（取決於 API）
- [ ] Bundle size < 1MB（gzipped）

### 使用者體驗

- [ ] 所有互動元素支援鍵盤導航
- [ ] 錯誤訊息清晰且多語化
- [ ] 載入狀態有明確提示
- [ ] 支援批次處理

### 文件完整性

- [ ] README 涵蓋所有功能
- [ ] API 函數有 JSDoc
- [ ] 有開發指南
- [ ] 有架構文檔

---

## 十、風險與注意事項

### 技術風險

1. **Gemini API 變更**
   - 風險：API 介面或行為變更
   - 緩解：定期檢查 API 文檔，使用版本鎖定

2. **瀏覽器相容性**
   - 風險：新功能在舊瀏覽器不支援
   - 緩解：使用 polyfill，設定最低支援版本

3. **效能瓶頸**
   - 風險：大量圖片處理導致記憶體不足
   - 緩解：實作圖片壓縮，限制批次數量

### 專案風險

1. **範疇蔓延**
   - 風險：不斷新增功能導致專案失焦
   - 緩解：嚴格遵循優先級，定期檢視目標

2. **技術債累積**
   - 風險：為了快速交付忽略品質
   - 緩解：每個 Sprint 預留 20% 時間處理技術債

---

## 十一、參考資源

### 官方文檔

- [Google Gemini API](https://ai.google.dev/docs)
- [React 19 Documentation](https://react.dev/)
- [Vite Documentation](https://vitejs.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

### 最佳實踐

- [WAI-ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [React Testing Library](https://testing-library.com/react)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)

### 專案文件

- [ARCHITECTURE_REVIEW.md](./ARCHITECTURE_REVIEW.md)
- [OPTIMIZATION_ROADMAP.md](./OPTIMIZATION_ROADMAP.md)
- [REVIEW_OPTIMIZATIONS.md](./REVIEW_OPTIMIZATIONS.md)
- [BLOOMRENDER_MANUAL.md](./BLOOMRENDER_MANUAL.md)

---

## 十二、結論

BloomRender 專案已具備良好的基礎架構與豐富的功能。本優化計畫聚焦於：

1. **提升程式碼品質**：統一錯誤處理、清理日誌、強化型別安全
2. **優化架構**：抽離編輯器邏輯、統一型別歸屬、集中路由配置
3. **改善效能**：快取策略、圖片壓縮優化
4. **增強體驗**：上傳驗證、鍵盤快捷鍵、進度優化
5. **完善測試與文件**：單元測試、E2E 測試、API 文檔

建議採用漸進式實施策略，優先處理高優先級項目，確保每個 Sprint 都能交付可見的價值。同時保持靈活性，根據實際需求調整優先順序。

---

**文件版本：** 1.0  
**最後更新：** 2026-05-08  
**維護者：** BloomRender Team
