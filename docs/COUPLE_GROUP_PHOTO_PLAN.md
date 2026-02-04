# 雙人與多人寫真功能規劃（新建獨立分頁）

> 目標：新建 `/couple-group` 分頁，內含「雙人寫真」與「多人寫真」兩個子分類。

---

## 一、頁面結構規劃

### 1.1 路由與導覽

**新路由**：`/couple-group`

**導覽位置**：
- 在 `StartTabNav` 新增「雙人/多人寫真」按鈕
- 照片館「couple」與「group」分類項目導向 `/couple-group?mode=couple` 或 `/couple-group?mode=group`

### 1.2 頁面內部結構

```
CoupleGroupPage
├── StartTabNav (頂部導覽)
├── 標題區塊
│   ├── 主標題：「雙人/多人寫真」
│   └── 副標題說明
├── 模式切換 Tab（頁面內）
│   ├── 「雙人寫真」Tab
│   └── 「多人寫真」Tab
└── 內容區（依選中 Tab 切換）
    ├── 雙人寫真模式
    │   ├── 上傳區域（2 個檔案）
    │   ├── 風格選擇（形象照/主題寫真/旅遊照）
    │   ├── 進階選項（依風格而定）
    │   └── 生成按鈕
    └── 多人寫真模式
        ├── 上傳區域（3-6 個檔案）
        ├── 風格選擇（形象照/主題寫真/旅遊照）
        ├── 進階選項（依風格而定）
        └── 生成按鈕
```

---

## 二、功能設計

### 2.1 雙人寫真模式

**檔案限制**：嚴格 2 個檔案

**支援風格**：
- **形象照風格**：專業雙人照、情侶形象照、閨蜜照
- **主題寫真風格**：拍立得、美式校園、復古、浪漫
- **旅遊照風格**：景點雙人照、美食地圖雙人照

**進階選項**：
- 形象照：選擇形象類型、輸出規格（半身/全身）
- 主題寫真：選擇主題類型
- 旅遊照：選擇場景、長寬比、風格等

### 2.2 多人寫真模式

**檔案限制**：3-6 個檔案（建議上限 4-6 人）

**支援風格**：
- **形象照風格**：家庭照、畢業團體照、公司團體照
- **主題寫真風格**：團體拍立得、派對主題
- **旅遊照風格**：團體旅遊照、家庭出遊照

**進階選項**：
- 形象照：選擇形象類型、輸出規格
- 主題寫真：選擇主題類型
- 旅遊照：選擇場景、長寬比、風格等

### 2.3 風格選擇 UI

在頁面內提供風格切換（類似 `TravelUploadSection` 的模式切換）：

```
[形象照] [主題寫真] [旅遊照]
```

選擇風格後，顯示對應的進階選項表單。

---

## 三、目錄結構

```
features/
  couple-group/
    CoupleGroupPage.tsx          # 主頁面容器
    CoupleGroupModeTabs.tsx      # 雙人/多人 Tab 切換
    CoupleGroupUploadSection.tsx # 上傳區域（支援多檔案）
    CoupleGroupStyleSelector.tsx # 風格選擇（形象照/主題寫真/旅遊照）
    CoupleGroupForm.tsx          # 進階選項表單（依風格動態顯示）
    CoupleGroupResult.tsx        # 結果展示
    useCoupleGroup.ts            # Hook：狀態管理、檔案處理、生成邏輯
    types.ts                     # 型別定義
```

---

## 四、技術實作

### 4.1 狀態管理 (`useCoupleGroup.ts`)

```typescript
export type CoupleGroupMode = 'couple' | 'group';
export type CoupleGroupStyle = 'portrait' | 'themed' | 'travel';

export function useCoupleGroup() {
  const [mode, setMode] = useState<CoupleGroupMode>('couple'); // couple | group
  const [style, setStyle] = useState<CoupleGroupStyle>('portrait'); // portrait | themed | travel
  const [files, setFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // 風格相關狀態（依 style 動態使用）
  const [portraitType, setPortraitType] = useState<PortraitType>(...);
  const [portraitSpec, setPortraitSpec] = useState<OutputSpec>(...);
  const [themedType, setThemedType] = useState<ThemedType>(...);
  const [travelScene, setTravelScene] = useState<string>(...);
  // ... 其他旅遊照選項
  
  const handleGenerate = async () => {
    // 驗證檔案數量
    if (mode === 'couple' && files.length !== 2) {
      setError('雙人寫真需要上傳 2 張照片');
      return;
    }
    if (mode === 'group' && (files.length < 3 || files.length > 6)) {
      setError('多人寫真需要上傳 3-6 張照片');
      return;
    }
    
    // 依風格調用對應的生成函數
    if (style === 'portrait') {
      const result = await generateProfessionalPortrait(files, { ... });
      setResult(result);
    } else if (style === 'themed') {
      const result = await generateThemedPhoto(files, { ... });
      setResult(result);
    } else if (style === 'travel') {
      const result = await generateTravelPhoto(files, { ... });
      setResult(result);
    }
  };
  
  return { ... };
}
```

### 4.2 檔案上傳驗證

```typescript
const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const selectedFiles = Array.from(e.target.files || []);
  
  if (mode === 'couple') {
    if (selectedFiles.length > 2) {
      setError('雙人寫真最多上傳 2 張照片');
      return;
    }
    setFiles(selectedFiles.slice(0, 2));
  } else if (mode === 'group') {
    if (selectedFiles.length > 6) {
      setError('多人寫真最多上傳 6 張照片');
      return;
    }
    setFiles(prev => [...prev, ...selectedFiles].slice(0, 6));
  }
};
```

### 4.3 Gemini 服務調整

**需要修改的服務函數**：
1. `services/gemini/portrait.ts`：
   - `generateProfessionalPortrait` 參數改為 `File | File[]`
   - Prompt 調整：2 人時加入 "couple portrait"，3+ 人時加入 "group portrait" / "family portrait"

2. `services/gemini/themed.ts`：
   - `generateThemedPhoto` 參數改為 `File | File[]`
   - Prompt 調整：多人時加入 "couple/group themed photoshoot"

3. `services/gemini/travel.ts`：
   - 已支援 `File | File[]`，無需修改

### 4.4 頁面內 Tab 切換 UI

```tsx
<div className="flex justify-center mb-6">
  <div className="flex bg-gray-900/60 p-1 rounded-full border border-gray-700/50">
    <button
      onClick={() => setMode('couple')}
      className={`px-6 py-2 rounded-full font-bold transition-all ${
        mode === 'couple'
          ? 'bg-pink-600 text-white shadow-lg'
          : 'text-gray-400 hover:text-gray-200'
      }`}
    >
      💑 雙人寫真
    </button>
    <button
      onClick={() => setMode('group')}
      className={`px-6 py-2 rounded-full font-bold transition-all ${
        mode === 'group'
          ? 'bg-purple-600 text-white shadow-lg'
          : 'text-gray-400 hover:text-gray-200'
      }`}
    >
      👨‍👩‍👧‍👦 多人寫真
    </button>
  </div>
</div>
```

---

## 五、照片館項目對接

### 5.1 路由參數設計

**雙人寫真項目**：
```
/couple-group?mode=couple&style=portrait&type=premium_leader
/couple-group?mode=couple&style=themed&type=themed-polaroid
/couple-group?mode=couple&style=travel&scene=eiffel
```

**多人寫真項目**：
```
/couple-group?mode=group&style=portrait&type=business
/couple-group?mode=group&style=themed&type=themed-birthday
/couple-group?mode=group&style=travel&scene=taipei101
```

### 5.2 照片館項目調整

在 `constants/photographyService.ts` 中：

```typescript
// 雙人寫真項目
{
  id: 'couple-romance',
  categoryId: 'couple',
  nameKey: 'service.item.couple_romance.name',
  targetRoute: '/couple-group',
  queryParams: { mode: 'couple', style: 'portrait', type: 'premium_leader' },
}

// 多人寫真項目
{
  id: 'group-family',
  categoryId: 'group',
  nameKey: 'service.item.group_family.name',
  targetRoute: '/couple-group',
  queryParams: { mode: 'group', style: 'portrait', type: 'business' },
}
```

---

## 六、實作步驟

### Phase 1: 基礎頁面結構
1. 建立 `features/couple-group/` 目錄
2. 建立 `CoupleGroupPage.tsx`（基本容器）
3. 建立 `CoupleGroupModeTabs.tsx`（雙人/多人切換）
4. 建立 `useCoupleGroup.ts`（基礎狀態管理）
5. 在 `App.tsx` 新增路由 `/couple-group`
6. 在 `StartTabNav` 新增按鈕

### Phase 2: 上傳與風格選擇
1. 建立 `CoupleGroupUploadSection.tsx`（多檔案上傳）
2. 建立 `CoupleGroupStyleSelector.tsx`（形象照/主題寫真/旅遊照切換）
3. 實作檔案驗證邏輯（雙人 2 檔、多人 3-6 檔）

### Phase 3: 進階選項表單
1. 建立 `CoupleGroupForm.tsx`（依風格動態顯示選項）
2. 整合形象照選項（類型、規格）
3. 整合主題寫真選項（主題類型）
4. 整合旅遊照選項（場景、長寬比等）

### Phase 4: 生成與結果
1. 修改 `services/gemini/portrait.ts` 支援 `File[]`
2. 修改 `services/gemini/themed.ts` 支援 `File[]`
3. 建立 `CoupleGroupResult.tsx`（結果展示）
4. 實作生成邏輯（依風格調用對應服務）

### Phase 5: 照片館對接
1. 更新 `constants/photographyService.ts` 中「couple」與「group」項目的 `targetRoute`
2. 新增 `queryParams` 參數
3. 在 `CoupleGroupPage` 中讀取 URL 參數並預填選項

### Phase 6: 多語與樣式
1. 在 `LanguageContext` 新增相關翻譯 key
2. 調整樣式與動畫
3. 測試與優化

---

## 七、注意事項

1. **檔案數量驗證**：雙人嚴格 2 檔，多人 3-6 檔，需有明確錯誤提示
2. **模式切換**：切換模式時應清空已上傳檔案或提示使用者
3. **風格切換**：切換風格時保留已上傳檔案，但清空風格相關選項
4. **URL 參數**：支援從照片館帶入參數預填選項
5. **向後相容**：修改 `generateProfessionalPortrait` 和 `generateThemedPhoto` 時需保持單人模式向後相容
6. **Prompt 優化**：多人時需明確指定人數與關係（couple / family / group）

---

## 八、預期成果

完成後：
- ✅ 新增 `/couple-group` 路由與頁面
- ✅ 頁面內有「雙人寫真」與「多人寫真」Tab 切換
- ✅ 支援形象照、主題寫真、旅遊照三種風格
- ✅ 照片館「couple」與「group」項目導向新頁面並帶入參數
- ✅ `StartTabNav` 新增「雙人/多人寫真」按鈕
- ✅ 完整的檔案上傳、驗證、生成、結果展示流程