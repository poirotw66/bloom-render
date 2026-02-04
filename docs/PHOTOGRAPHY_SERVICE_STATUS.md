# 照片館功能完成度與專案優化建議

> 審視日期：依目前程式碼狀態整理。

---

## 一、照片館功能完成度

### 1.1 已實作項目（對照 PROJECT_PLAN_PHOTOGRAPHY_SERVICE.md）

| 規劃項目 | 狀態 | 說明 |
|----------|------|------|
| **資料層** | ✅ | `constants/photographyService.ts`：`PHOTOGRAPHY_SERVICE_CATEGORIES`、`PHOTOGRAPHY_SERVICE_ITEMS`，靜態陣列，含 nameKey/descriptionKey/priceRange/targetRoute/actionLabelKey/badgeKey |
| **路由** | ✅ | `/photography-service` → `PhotographyServicePage` |
| **入口** | ✅ | `StartTabNav` 含「照片館」Tab，與 upload / generate / idphoto / portrait / travel / themed 並列 |
| **分類 Tab** | ✅ | 依 `PHOTOGRAPHY_SERVICE_CATEGORIES` 渲染，點選後篩選方案列表 |
| **方案列表** | ✅ | 依目前選中分類過濾 `PHOTOGRAPHY_SERVICE_ITEMS`，grid 排版 |
| **ServiceCard** | ✅ | 名稱、描述、原價/售價、badge、主按鈕；點擊依 `targetRoute`（及可選 `queryParams`）導向 |
| **與既有功能串接** | ✅ | 見下表 |
| **多語** | ✅ | 分類、方案名稱/描述、按鈕文案皆用 `LanguageContext` key（中/英） |
| **精選區塊（Phase 3 可選）** | ✅ | 頁底「作品精選」區塊，使用 `service.showcase.title` / `service.showcase.desc` |

### 1.2 目前分類與導向一覽

| 分類 | 方案數 | 導向目標 | 備註 |
|------|--------|----------|------|
| 韓式證件照 (idphoto) | 3 | `/idphoto?level=self|standard|premium` | 依方案帶修圖等級 |
| 職業形象照 (corporate) | 11 | `/portrait?type=...` 或 `type=...&spec=half_body|full_body` | 領袖之境、爾雅界、MAG、學士、職業半/全身、空服、模特卡等 |
| 肖像履歷照 (portrait) | 2 | `/portrait?type=portrait_resume_grad|portrait_resume` | 學士/碩士/博士、一般肖像履歷照 |
| 主題寫真 (themed) | 15 | `/themed?type=themed-xxx` | 生日、雜誌、撕拉片、運動、孕婦、肯豆、美式學院等，皆可上傳照片用 Gemini 生成 |
| 雙人寫真 (couple) | 10 | `/travel` 或 `/idphoto` | 多數為 `/travel`；結婚登記套餐為 `/idphoto` |
| 多人寫真 (group) | 6 | `/travel` | 全家福、新中式、畢業等 |

已移除之分類：**票券/團體**、**高級訂製**（規劃中之 promotions/combo 未獨立成分類）。

### 1.3 與各功能頁的串接狀態

- **證件照**：照片館證件照方案 → `/idphoto?level=xxx`，`useIdPhoto` 會讀 `level` 並預填修圖等級。
- **形象照**：職業形象照、肖像履歷照方案 → `/portrait?type=xxx` 或 `&spec=xxx`，`usePortrait` 會讀 `type`、`spec` 並預填表單。
- **主題寫真**：主題寫真方案 → `/themed?type=themed-xxx`，`useThemed` 會讀 `type` 並預填主題；頁面可上傳照片並用 Gemini 生成。
- **旅遊照**：雙人/多人寫真方案目前多數 → `/travel`，未帶 query；若未來要依方案預選場景或模式，可補 `queryParams` 或擴充 `useTravel` 讀取參數。

---

## 二、整體專案可優化事項

### 2.1 無障礙與互動

- **ServiceCard**：目前為 `div` + `onClick`，鍵盤無法聚焦與觸發。建議改為可聚焦並支援 Enter/Space（例如 `role="button"`、`tabIndex={0}`、`onKeyDown`），或外層用 `<Link>` 導向 `targetRoute`，以利鍵盤與螢幕閱讀器使用。
- **StartTabNav / 各頁按鈕**：已有 `focus:ring`，可再確認焦點順序與可見焦點樣式是否一致。

### 2.2 錯誤處理與多語

- **生成失敗**：portrait / themed / idphoto / travel 的錯誤多為 `setError(msg)`，部分為英文 "Failed: ..."。建議錯誤訊息改為 i18n key（如 `portrait.error_failed`、`themed.error_failed`），與現有 `portrait.error_no_image` 等一致。
- **API 錯誤**：可考慮統一在 `geminiService` 或各 hook 內轉成使用者可讀訊息（含安全/配額等），再 setError。

### 2.3 程式碼結構（可選）

- **usePortrait / useThemed / useIdPhoto**：三者皆為「檔案 + 選項 + 生成 + 結果 + 下載/再試」，差異在選項欄位與 API。若後續擴充更多類似頁面，可考慮抽成共用 hook（例如 `useGeneratePage({ defaultOptions, readSearchParams, generateApi })`），減少重複。
- **ServiceCard**：與 ThemedPage 先前「僅列表」版本已不再使用，目前僅 PhotographyServicePage 使用，無多餘程式。

### 2.4 文件與維護

- **PROJECT_PLAN_PHOTOGRAPHY_SERVICE.md**：可更新為「已實作狀態」：補充目前 6 大分類、portrait/themed 頁面與導向方式、已移除票券/團體與高級訂製、Phase 3 精選區塊已存在等，方便後續維護與 onboarding。
- **README / 功能列表**：若對外說明產品，可列出現有入口：照片館、證件照、形象照、主題寫真、旅遊照、編輯器，與本文件對齊。

### 2.5 雙人／多人寫真與旅遊照

- 雙人/多人方案目前多數只導向 `/travel`，未帶場景或模式參數。若產品需要「從照片館點雙人寫真 → 預選雙人模式或推薦場景」，可為對應方案加上 `queryParams`，並在 `useTravel` 或 TravelPage 讀取後預填表單。

### 2.6 其他小項

- **PortraitForm**：底部的 `idphoto.model_recommendation` 可改為 portrait 專用 key（如 `portrait.model_recommendation`），語意更清楚（若目前共用文案則可維持）。
- **動畫**：各頁已有 `animate-fade-in`，若需更一致的可考慮統一 duration 或 class。

---

## 三、總結

- **照片館**：Phase 1～2 已完成，分類、方案列表、導向 idphoto/portrait/themed/travel 皆串接；Phase 3 精選區塊已存在。票券/團體與高級訂製已移除，目前為 6 大分類。
- **建議優先**：ServiceCard 無障礙（鍵盤/焦點）、錯誤訊息 i18n；其餘為結構與文件優化，可依時程分階段處理。
- 若需要，可再針對「某一個分類」或「某一個優化項」拆成具體任務清單（含檔案與修改要點）。
