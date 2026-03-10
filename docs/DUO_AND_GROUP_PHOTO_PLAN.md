# 雙人與多人寫真功能規劃

> 目標：擴展現有功能以支援雙人與多人寫真，而非新建獨立分頁。

---

## 一、現況分析

### 1.1 現有功能支援狀況

| 功能         | 路由        | 單人 | 雙人 | 多人（3+） | 備註                                     |
| ------------ | ----------- | ---- | ---- | ---------- | ---------------------------------------- |
| **旅遊照**   | `/travel`   | ✅   | ✅   | ✅         | 已完整支援，有單人/團體模式切換，最多4人 |
| **形象照**   | `/portrait` | ✅   | ❌   | ❌         | 目前僅支援單人                           |
| **主題寫真** | `/themed`   | ✅   | ❌   | ❌         | 目前僅支援單人                           |

### 1.2 照片館項目現況

| 分類              | 項目數 | 目前導向  | 問題                               |
| ----------------- | ------ | --------- | ---------------------------------- |
| **情侶 (couple)** | 11 項  | `/travel` | 部分項目應為形象照或主題寫真風格   |
| **團體 (group)**  | 7 項   | `/travel` | 家庭照、畢業照可能更適合形象照風格 |

---

## 二、規劃方案

### 2.1 統一擴展現有功能（推薦）

**原則**：擴展 `/portrait` 和 `/themed` 支援多人，與 `/travel` 保持一致的使用者體驗。

#### Phase 1: 擴展形象照 (`/portrait`) 支援多人

**實作項目**：

1. **`usePortrait.ts`**：
   - 新增 `isGroupMode: boolean` 狀態
   - 將 `portraitFile: File | null` 改為 `portraitFiles: File[]`
   - 新增 `removeFile(index)` 方法
   - 修改 `handleGenerate` 支援 `File[]`

2. **`PortraitUploadSection.tsx`**：
   - 新增單人/雙人/多人模式切換（參考 `TravelUploadSection`）
   - 支援多檔案上傳與預覽
   - 顯示已上傳檔案縮圖與移除按鈕
   - 多人模式最多支援 4-6 人（可配置）

3. **`services/gemini/portrait.ts`**：
   - `generateProfessionalPortrait` 參數改為 `File | File[]`
   - Prompt 調整：單人時保持原邏輯，多人時加入「group portrait」「family portrait」等提示
   - 根據人數調整 prompt（2人：couple，3+人：group/family）

4. **照片館導向調整**：
   - 雙人形象照風格項目 → `/portrait?mode=couple`
   - 多人形象照風格項目 → `/portrait?mode=group`

#### Phase 2: 擴展主題寫真 (`/themed`) 支援多人

**實作項目**：

1. **`useThemed.ts`**：
   - 新增 `isGroupMode: boolean` 狀態
   - 將 `themedFile: File | null` 改為 `themedFiles: File[]`
   - 新增 `removeFile(index)` 方法
   - 修改 `handleGenerate` 支援 `File[]`

2. **`ThemedUploadSection.tsx`**：
   - 新增單人/雙人/多人模式切換
   - 支援多檔案上傳與預覽
   - 多人模式最多支援 4-6 人

3. **`services/gemini/themed.ts`**：
   - `generateThemedPhoto` 參數改為 `File | File[]`
   - Prompt 調整：多人時加入「group themed photoshoot」提示

4. **照片館導向調整**：
   - 雙人主題寫真項目 → `/themed?mode=couple`
   - 多人主題寫真項目 → `/themed?mode=group`

#### Phase 3: 照片館項目重新分類與導向

**分類原則**：

- **形象照風格**（專業、工作室、家庭、畢業）→ `/portrait`
- **主題寫真風格**（拍立得、美式校園、復古、生日派對）→ `/themed`
- **旅遊場景風格**（景點、美食地圖）→ `/travel`（維持現狀）

**調整項目**：

| 分類   | 項目 ID             | 建議導向    | 模式參數                              |
| ------ | ------------------- | ----------- | ------------------------------------- |
| couple | `couple-romance`    | `/portrait` | `?mode=couple`                        |
| couple | `couple-office`     | `/portrait` | `?mode=couple`                        |
| couple | `couple-polaroid`   | `/themed`   | `?mode=couple&type=themed-polaroid`   |
| couple | `couple-us-college` | `/themed`   | `?mode=couple&type=themed-us-college` |
| group  | `group-family`      | `/portrait` | `?mode=group`                         |
| group  | `group-grad`        | `/portrait` | `?mode=group`                         |
| group  | `group-new-style`   | `/themed`   | `?mode=group`                         |

---

## 三、技術實作細節

### 3.1 模式切換 UI

參考 `TravelUploadSection` 的實作：

```tsx
// 單人 / 雙人 / 多人切換
<div className="flex justify-center mb-2">
  <div className="flex bg-gray-900/60 p-1 rounded-full">
    <button onClick={() => setIsGroupMode(false)}>👤 單人</button>
    <button onClick={() => setIsGroupMode(true)}>👥 雙人/多人</button>
  </div>
</div>
```

### 3.2 Prompt 調整範例

**形象照（多人）**：

```typescript
const positive = [
  'Professional group photography portrait',
  isGroupMode && files.length === 2
    ? 'Couple portrait, two people'
    : `Group portrait with ${files.length} people`,
  'High-end studio retouching',
  'Preserve identity and facial features of all people in the source images',
  style.promptHint,
  spec.cropHint,
  // ...
]
  .filter(Boolean)
  .join('. ');
```

**主題寫真（多人）**：

```typescript
const prompt = `... 
${
  files.length === 2
    ? 'Create a couple themed photoshoot'
    : `Create a group themed photoshoot with ${files.length} people`
}
...`;
```

### 3.3 檔案上傳限制

- **單人模式**：1 個檔案
- **雙人模式**：2 個檔案
- **多人模式**：3-6 個檔案（建議上限 4-6 人，依 API 限制調整）

---

## 四、實作優先順序

### 階段 1：形象照多人支援（優先）

1. 擴展 `usePortrait` 與 `PortraitUploadSection`
2. 修改 `generateProfessionalPortrait` 支援 `File[]`
3. 照片館「couple」與「group」中形象照風格項目導向 `/portrait`

### 階段 2：主題寫真多人支援

1. 擴展 `useThemed` 與 `ThemedUploadSection`
2. 修改 `generateThemedPhoto` 支援 `File[]`
3. 照片館「couple」與「group」中主題寫真風格項目導向 `/themed`

### 階段 3：照片館項目重新分類

1. 檢視所有「couple」與「group」項目
2. 依性質重新設定 `targetRoute` 與 `queryParams`
3. 更新多語 key（如有需要）

---

## 五、注意事項

1. **向後相容**：單人模式應保持原有行為，不影響現有使用者
2. **API 限制**：確認 Gemini API 對多人圖片的支援與限制
3. **UI/UX 一致性**：多人上傳體驗應與 `/travel` 保持一致
4. **錯誤處理**：檔案數量不符模式時應有明確提示
5. **多語支援**：新增的 UI 文字需加入 `LanguageContext`

---

## 六、預期成果

完成後：

- ✅ `/portrait` 支援單人、雙人、多人（最多 4-6 人）
- ✅ `/themed` 支援單人、雙人、多人（最多 4-6 人）
- ✅ `/travel` 維持現有多人支援
- ✅ 照片館「couple」與「group」項目依性質導向正確頁面
- ✅ 使用者體驗統一，無需學習新的操作流程
