# BloomRender

**BloomRender: Let your ideas bloom.**

AI 驅動的專業照片編輯與生成工作室，以 Google Gemini API 提供修圖、濾鏡、證件照、形象照、旅遊照與主題寫真等功能。

---

## 功能概覽

- **上傳圖片**：拖放或選擇檔案後進入編輯器。
- **文字生圖**：輸入描述、選擇長寬比與張數，由 AI 生成圖片後可進入編輯。
- **圖片編輯器**
  - **修圖**：點選畫面位置並輸入描述，進行局部編輯。
  - **濾鏡**：套用風格濾鏡（如 Synthwave、Anime、Lomo 等）或自訂描述。
  - **調整**：整體調整（模糊背景、增強細節、光線等）或自訂描述。
  - **裁切**：自由裁切或證件規格（2 吋大頭／半身、1 吋等）。
  - 支援復原、重做、與原圖比較、重置、下載。
- **AI 證件照**：選擇證件類型、修圖等級、輸出規格、服裝（可自訂描述與參考圖），上傳肖像後生成證件照。
- **AI 旅遊照**：選擇輸出尺寸、長寬比與場景（國際／台灣景點、隨機地點或自訂描述與參考圖），上傳肖像後生成旅遊照；結果頁會顯示使用的場景名稱。
- **設定**：可設定 Google GenAI API 金鑰與模型（Gemini 2.5 Flash / Gemini 3 Pro）。
- **多語系**：英文、繁體中文。
- **主題**：預設與新年主題。

---

## 技術與依賴

- React 19、TypeScript、Vite
- React Router、react-image-crop
- [@google/genai](https://www.npmjs.com/package/@google/genai)（Gemini API）

---

## 環境需求

- Node.js（建議 18+）

---

## 本地執行

1. **安裝依賴**
   ```bash
   npm install
   ```

2. **設定 API 金鑰**  
   在專案根目錄建立 [.env.local](.env.local)，設定：
   ```
   GEMINI_API_KEY=你的_Google_GenAI_API_金鑰
   ```
   或於應用內「設定」中輸入金鑰（僅儲存於本地）。

3. **啟動開發伺服器**
   ```bash
   npm run dev
   ```
   依終端顯示網址開啟（例如 http://localhost:5173）。

4. **（選用）旅遊場景參考圖**  
   專案不將 `public/images/scenes/` 內的大圖提交至 Git，以控制儲存庫大小。若要使用「AI 旅遊照」的場景參考圖以提升生成品質，請依 [docs/SCENE_IMAGES_SOURCES.md](docs/SCENE_IMAGES_SOURCES.md) 下載免費圖庫照片並放入 `public/images/scenes/`；未放置時仍可正常使用，僅改以文字描述生成。

---

## 可用指令

| 指令 | 說明 |
|------|------|
| `npm run dev` | 啟動開發伺服器 |
| `npm run build` | 建置正式版至 `dist/`，並產生 `404.html` 供 SPA 部署 |
| `npm run preview` | 預覽建置結果 |

---

## 部署

建置後將 `dist/` 目錄內容部署至靜態託管即可。若使用 GitHub Actions，可參考 [.github/workflows/deploy.yml](.github/workflows/deploy.yml)。

---

## 授權

本專案採用 **創用 CC 姓名標示-非商業性-相同方式分享 4.0 國際版**（CC BY-NC-SA 4.0）授權。  
完整條款請見 [LICENSE.txt](LICENSE.txt)。

- **姓名標示**：使用時須標示適當署名並提供授權條款連結。
- **非商業性**：不得將本作品用於商業目的。
- **相同方式分享**：改作或衍生作品須以相同授權方式散布。

**商業使用**：如需商業授權，請聯繫作者。詳見 [LICENSE.txt](LICENSE.txt) 當中的「商業授權」一節。
