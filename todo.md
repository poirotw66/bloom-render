## BloomRender 專案截圖規劃

以下為建議要收集的操作／結果截圖與對應說明，請依序截圖並將檔案放到 `public/screenshots/`（或你自訂的資料夾），再在 README 或投影片中引用。

> 圖片路徑僅為建議，可依實際放置位置調整。

---

### 1. 入口與導覽

#### 1-1 Start 畫面（入口頁）

- **檔名建議**：`public/screenshots/01-start-screen.png`
- **畫面重點**：
  - 頂部 `Header`（LOGO、主題切換、語言切換、設定按鈕）。
  - 中間 `StartScreen`：顯示上方 tab（上傳 / 文字生圖 / 證件照 / 形象照 / 旅遊照 / 主題寫真 / 雙人團體 / 試穿）。
  - 背景星空與 Bloom 漂浮光團。

**說明文字（可貼到 README）**：

> BloomRender 的入口畫面，從單一入口切換各種 AI 生成功能與編輯工具。

---

### 2. 圖片編輯器

#### 2-1 主編輯器（修圖 / 濾鏡 / 調整 / 裁切）

- **檔名建議**：`public/screenshots/02-editor-main.png`
- **畫面重點**：
  - 左側或中央顯示正在編輯的照片。
  - 右側面板打開其中一個 tab（例如「修圖」或「濾鏡」）。
  - 底部或上方顯示復原 / 重做 / 比較原圖按鈕。

**說明文字**：

> 單張圖片的完整編輯器，支援局部修圖、濾鏡、調整與裁切，並提供復原、重做與原圖比較。

---

### 3. AI 證件照（Id Photo）

#### 3-1 證件照設定與上傳

- **檔名建議**：`public/screenshots/03-idphoto-form.png`
- **畫面重點**：
  - 顯示 `IdPhotoForm`：證件類型、修圖等級、輸出規格、服裝選項等。
  - 右側 `IdPhotoUploadSection`：上傳區與預覽（有已上傳的人像）。

**說明文字**：

> 使用者選擇證件規格、修圖等級與服裝，並上傳肖像，系統會自動生成符合規格的證件照。

#### 3-2 證件照生成結果

- **檔名建議**：`public/screenshots/04-idphoto-result.png`
- **畫面重點**：
  - 多張 ID Photo 的結果卡片（`IdPhotoResult`）。
  - 顯示類型、修圖等級、輸出規格、服裝與模型資訊。
  - 批次下載按鈕與「再次生成」按鈕。

**說明文字**：

> 完成後會顯示多張證件照，並附上所有生成參數，支援單張與批次下載。

---

### 4. AI 形象照（Portrait）

#### 4-1 形象照表單與上傳

- **檔名建議**：`public/screenshots/05-portrait-form.png`
- **畫面重點**：
  - `PortraitForm`：形象照類型、輸出規格。
  - `QuantitySelector`：設定生成張數。
  - `PortraitUploadSection`：上傳與預覽。

**說明文字**：

> 適合履歷與個人品牌的專業形象照，提供類型與輸出規格選擇，並可一次生成多張版本。

#### 4-2 形象照生成結果

- **檔名建議**：`public/screenshots/06-portrait-result.png`
- **畫面重點**：
  - 單張或多張 `PortraitResult` 卡片。
  - 顯示類型與輸出規格文字。
  - 下載／再次生成／送入編輯器按鈕。

**說明文字**：

> 形象照結果以卡片呈現，使用者可直接下載或送入編輯器做進一步微調。

---

### 5. AI 旅遊照（Travel）

#### 5-1 世界／台灣地圖選景 + 表單

- **檔名建議**：`public/screenshots/07-travel-map-and-form.png`
- **畫面重點**：
  - 左側為 `WorldMap` 或 `TaiwanMap`，顯示多個可點擊景點標記。
  - 右側為 `TravelForm`：場景、天氣、時間、氛圍、服裝、構圖等選項。
  - 下方有張數與上傳區（`TravelUploadSection`）。

**說明文字**：

> 使用者可在世界地圖或台灣地圖上點選景點，並搭配天氣、時間與氛圍等選項，生成在該地拍攝的旅遊照。

#### 5-2 旅遊照結果卡片

- **檔名建議**：`public/screenshots/08-travel-result.png`
- **畫面重點**：
  - 多張 `TravelResult` 卡片。
  - 顯示場景名稱（或自訂標籤）、天氣、時間、服裝、構圖等 metadata。
  - 批次下載與再次生成按鈕。

**說明文字**：

> 旅遊照結果會附上使用的場景與條件，方便重現或調整設定後重新生成。

---

### 6. AI 主題寫真（Themed）

#### 6-1 主題寫真設定與上傳

- **檔名建議**：`public/screenshots/09-themed-form.png`
- **畫面重點**：
  - `ThemedForm`：主題類型列表。
  - `QuantitySelector` 與 `OutputSizeRatioSelector`。
  - `ThemedUploadSection`：上傳區與預覽。

**說明文字**：

> 主題寫真支援多種風格（如動漫、時尚、插畫感），可自訂輸出尺寸與長寬比。

#### 6-2 主題寫真結果

- **檔名建議**：`public/screenshots/10-themed-result.png`
- **畫面重點**：
  - 多張 `ThemedResult` 卡片。
  - 顯示主題類型名稱。
  - 下載／再次生成／送入編輯器。

---

### 7. AI 雙人／團體照（Couple / Group）

#### 7-1 模式與風格設定 + 上傳

- **檔名建議**：`public/screenshots/11-couple-group-form.png`
- **畫面重點**：
  - `CoupleGroupModeTabs`：雙人 / 多人模式切換。
  - `CoupleGroupStyleSelector`：風格列表。
  - `QuantitySelector`、尺寸與長寬比選擇。
  - `CoupleGroupUploadSection`：多檔上傳與預覽。

**說明文字**：

> 支援雙人與 3～6 人團體照，透過風格與輸出設定生成合照。

#### 7-2 雙人／團體照結果

- **檔名建議**：`public/screenshots/12-couple-group-result.png`
- **畫面重點**：
  - 多張 `CoupleGroupResult` 卡片。
  - 顯示模式與風格。
  - 下載、再次生成、送入編輯器。

---

### 8. AI 虛擬試穿（Try On）

#### 8-1 上傳人物與多件服裝

- **檔名建議**：`public/screenshots/13-tryon-upload.png`
- **畫面重點**：
  - `TryOnUploadSection`：一張人物照預覽 + 多張服裝照預覽。
  - 顯示可選張數（Quantity）、最少／最多服裝張數提示。

**說明文字**：

> 使用者上傳一張人物照與多件服裝照，系統會生成「虛擬試穿」效果。

#### 8-2 試穿結果列表

- **檔名建議**：`public/screenshots/14-tryon-result.png`
- **畫面重點**：
  - 多張 `TryOnResult` 卡片（不同背景或風格）。
  - 卡片上可看到風格標籤與下載、送入編輯器按鈕。

**說明文字**：

> 試穿結果以多張卡片呈現，方便比較不同風格並擇一導入編輯器。

---

### 9. 設定與多語系

#### 9-1 設定頁（Settings）

- **檔名建議**：`public/screenshots/15-settings.png`
- **畫面重點**：
  - API Key 輸入（請將真實金鑰打馬賽克或用假字串）。
  - 模型選擇（Gemini 2.5 Flash / Gemini 3 Pro）。
  - 語言切換、主題切換（Bloom / Night / New Year）。

**說明文字**：

> 設定頁允許使用者切換模型、主題與語言，並管理 Google GenAI API 金鑰。

#### 9-2 多語系對照

- **檔名建議**：`public/screenshots/16-i18n-en.png`, `public/screenshots/17-i18n-zh.png`
- **畫面重點**：
  - 選擇同一個頁面（建議入口或編輯器），分別截英文介面與繁中介面。

**說明文字**：

> BloomRender 目前支援英文與繁體中文介面，可依使用者偏好切換。

---

### 10. 錯誤處理與歷史

#### 10-1 API Key 錯誤或缺失提示

- **檔名建議**：`public/screenshots/18-error-apikey.png`
- **畫面重點**：
  - 顯示 `ErrorDisplay` 或 try-on 的 API Key 提示卡（黃色警告框）。

**說明文字**：

> 針對常見錯誤（如未設定 API Key），系統會以清楚的提示卡與多語系訊息引導使用者。

#### 10-2 生成歷史（如有）

- **檔名建議**：`public/screenshots/19-history.png`
- **畫面重點**：
  - 歷史列表／卡片、搜尋與篩選列、批次下載按鈕。

**說明文字**：

> 生成歷史功能讓使用者可以回顧過往的生成結果，並支援搜尋與批次下載。
