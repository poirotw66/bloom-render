# 照片館／服務項目功能規劃

> 參考：春山相館照片館頁面結構（見 [CHUNSHAN_PHOTOGRAPHY_SERVICE.md](./CHUNSHAN_PHOTOGRAPHY_SERVICE.md)）  
> 目標：在 enhance-pixshop 專案中新增「照片館／服務項目」一致的功能與頁面。

---

## 1. 專案現況摘要

- **專案**：enhance-pixshop（圖片編輯／證件照／旅行寫真）
- **路由**：`/`（上傳）、`/generate`（生成）、`/idphoto`（證件照）、`/travel`（旅行寫真）、`/edit`（編輯器）
- **入口**：`StartScreen` + `StartTabNav`（upload / generate / idphoto / travel）
- **功能模組**：`features/idphoto`、`features/travel`，共用 `App.tsx` 編輯器（retouch / crop / adjust / filters）

---

## 2. 目標功能概述

新增「照片館」頁面，提供：

1. **服務分類導覽**：以 Tab 或篩選列切換分類（對應春山：優惠活動、組合套餐、職業形象照、肖像照、主題寫真等）。
2. **服務方案列表**：每個方案以「卡片」呈現（名稱、描述、價格區間可選、主按鈕）。
3. **方案與既有流程串接**：點選方案後，導向對應功能（證件照 → IdPhoto、寫真／場景 → Travel、或進入編輯器）。

本功能偏「服務目錄＋導流」，不實作金流或預約系統；價格與方案內容可為靜態資料或後續接 API。

---

## 3. 建議實作規劃

### 3.1 資料層

| 項目 | 說明 |
|------|------|
| **服務分類** | 定義 `PhotographyServiceCategory`（id, label, order），例如：promotions, combo, idphoto, portrait, themed, premium, couple, group, corporate。 |
| **服務方案** | 定義 `PhotographyServiceItem`：id, categoryId, name, description, originalPrice?, priceRange?, badge?（限定門市等）, actionLabel, targetRoute（如 `/idphoto`, `/travel`, `/edit`）, queryParams?。 |
| **資料來源** | 初期可為 `constants/photographyService.ts` 靜態陣列；之後可改為 API 或 CMS。 |

### 3.2 路由與入口

| 項目 | 說明 |
|------|------|
| **新路由** | 新增 `/photography-service`（或 `/services`），對應 `PhotographyServicePage`。 |
| **導覽** | 在 `StartTabNav` 新增「照片館」Tab，與 upload / generate / idphoto / travel 並列；或在 Header / 首頁加一個入口連結。 |

### 3.3 頁面與元件

| 項目 | 說明 |
|------|------|
| **PhotographyServicePage** | 頁面容器：標題、分類 Tab、方案列表、可選的「作品集／精選」區塊。 |
| **ServiceCategoryTabs** | 分類 Tab 列，依 `PhotographyServiceCategory` 渲染，點選後篩選下方列表。 |
| **ServiceCard** | 單一方案卡片：名稱、描述、原價/售價（可選）、badge、主按鈕；點擊依 `targetRoute` + `queryParams` 導向。 |
| **ServiceList** | 依目前選中分類過濾 `PhotographyServiceItem`，用 grid/list 排版 `ServiceCard`。 |

### 3.4 與既有功能對應

| 照片館類型 | 對應路由／行為 |
|--------------|----------------|
| 證件照、證件照＋形象照 | `/idphoto`，可帶 query 指定規格或方案 id。 |
| 主題寫真、場景風格 | `/travel`，可帶 query 指定場景或主題。 |
| 形象照、修圖、濾鏡、裁切 | `/edit`（需先有圖片：可從 `/` 上傳後再導向，或從 IdPhoto/Travel 結果「進入編輯」）。 |
| 僅展示、無對應流程 | 主按鈕可為「即將推出」或連到說明頁。 |

### 3.5 文案與多語

- 分類名稱、方案名稱、描述、按鈕文案納入多語（如 `LanguageContext` 的 key），與現有 `idphoto`、`travel` 一致。
- 若專案僅繁中，可先寫死繁體，預留 key 結構以便之後 i18n。

### 3.6 樣式與無障礙

- 與現有主題一致（如 `ThemeContext`、newyear 主題）；卡片 hover、focus 狀態需明顯。
- 按鈕與連結需具備明確的 `aria-label` 或可見文案，方便鍵盤與螢幕閱讀器操作。

---

## 4. 建議目錄結構

```
features/
  photography-service/
    PhotographyServicePage.tsx   # 頁面
    ServiceCategoryTabs.tsx      # 分類 Tab
    ServiceCard.tsx              # 方案卡片
    ServiceList.tsx              # 方案列表（依分類篩選）
    usePhotographyService.ts     # 可選：資料載入、篩選狀態
constants/
  photographyService.ts          # 分類 + 方案靜態資料
```

（若資料量小，可將 Tabs/List 合併進 Page，後續再拆。）

---

## 5. 實作優先順序建議

1. **Phase 1**  
   - 新增 `constants/photographyService.ts`（分類 + 少量方案）。  
   - 新增路由 `/photography-service` 與 `PhotographyServicePage`，只做「單一分類 + 方案列表 + ServiceCard 點擊導向」。  
   - 在 `StartTabNav` 或 Header 加上「照片館」入口。

2. **Phase 2**  
   - 加上 `ServiceCategoryTabs`，依分類篩選方案。  
   - 補齊方案資料與多語 key。  
   - 依需要帶 query 參數串接 `/idphoto`、`/travel`、`/edit`。

3. **Phase 3**（可選）  
   - 精選方案／作品集區塊。  
   - 若後端有方案 API，改為從 API 載入並保留 fallback 靜態資料。

---

## 6. 注意事項

- **無簡體中文**：專案規則要求程式與註解不出現簡體中文，文案一律使用繁體（或英文）。  
- **註解語言**：程式註解以英文撰寫。  
- **參考來源**：方案命名與分類可參考春山，但實際文案與定價以本專案需求為準，避免直接複製商業文案。

以上規劃可直接作為開發任務拆分與實作順序的依據；若需我先從「資料結構 + 一頁靜態列表」開始實作，可指定 Phase 1 的範圍與方案數量。
