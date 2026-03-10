# BloomRender

**BloomRender — Let your ideas bloom.**

AI 驅動的專業照片編輯與生成工作室，以 Google Gemini API 提供修圖、濾鏡、證件照、形象照、旅遊照、主題寫真、雙人／團體照與 AI 虛擬試穿等功能。

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
- **AI 形象照**：選擇類型與輸出規格，上傳肖像後生成專業形象照。
- **AI 旅遊照**：選擇輸出尺寸、長寬比與場景（世界地圖／台灣地圖／國際景點／自訂描述與參考圖），上傳肖像後生成旅遊照。
- **AI 主題寫真**：選擇主題類型、輸出尺寸與長寬比，上傳肖像後生成主題寫真。
- **AI 雙人／團體照**：上傳 2 張（雙人）或 3～6 張（團體），選擇風格後生成合照。
- **AI 虛擬試穿**：上傳人物照與多張服裝照，生成試穿效果。
- **攝影服務**：導向各 AI 生成功能的入口頁。
- **設定**：可設定 Google GenAI API 金鑰與模型（Gemini 2.5 Flash / Gemini 3 Pro）。
- **多語系**：英文、繁體中文。
- **主題**：預設繁花、深夜、新年主題。
- **生成歷史**：可檢視、篩選與下載過往生成結果。

> 更完整的圖文教學請參考：[BloomRender 操作手冊](docs/BLOOMRENDER_MANUAL.md)

---

## 技術與依賴

- **Runtime**：React 19、TypeScript、Vite 6
- **路由**：React Router 7
- **編輯**：react-image-crop
- **AI**：[@google/genai](https://www.npmjs.com/package/@google/genai)（Gemini API）
- **樣式**：Tailwind CSS（CDN）、自訂 CSS
- **開發**：ESLint、Prettier、Vitest、Husky、lint-staged

---

## 環境需求

- **Node.js** 20+（建議與 CI 一致）
- **npm**（依賴 `package-lock.json` 時請用 `npm ci`）

---

## 本地執行

1. **安裝依賴**

   ```bash
   npm install
   ```

2. **設定 API 金鑰**  
   於應用內「設定」輸入 Google GenAI API 金鑰（僅儲存於本地瀏覽器）。

3. **啟動開發伺服器**

   ```bash
   npm run dev
   ```

   依終端顯示網址開啟（預設為 http://localhost:3002）。

4. **（選用）靜態圖片**
   - **地圖**：Travel 功能的世界／台灣地圖背景需 `public/images/world-map.png`、`public/images/taiwan-map.png`，請自行放入（見 `public/images/README.md`）。
   - **旅遊場景參考圖**：專案不將 `public/images/scenes/` 內大圖提交至 Git。若要使用場景參考圖，請依 [docs/SCENE_IMAGES_SOURCES.md](docs/SCENE_IMAGES_SOURCES.md) 下載並放入 `public/images/scenes/`；未放置時仍可以文字描述生成。

---

## 可用指令

| 指令                   | 說明                                                |
| ---------------------- | --------------------------------------------------- |
| `npm run dev`          | 啟動開發伺服器（port 3002）                         |
| `npm run build`        | 建置正式版至 `dist/`，並產生 `404.html` 供 SPA 部署 |
| `npm run preview`      | 預覽建置結果                                        |
| `npm run lint`         | 執行 ESLint                                         |
| `npm run test`         | 執行 Vitest 單元測試                                |
| `npm run test:watch`   | Vitest 監聽模式                                     |
| `npm run format`       | 使用 Prettier 格式化專案                            |
| `npm run format:check` | 檢查格式（不寫入）                                  |

提交前會經 **Husky** 執行 **lint-staged**（Prettier + ESLint --fix）。

---

## 部署

- **建置**：將 `dist/` 目錄內容部署至靜態託管即可。
- **GitHub Pages**：建置時請設定 `GITHUB_PAGES=true`，使 `base` 為 `/bloom-render/`。  
  可參考 [.github/workflows/deploy.yml](.github/workflows/deploy.yml)：push 至 `main` 或手動觸發後會建置並部署至 GitHub Pages。

---

## 授權

本專案採用 **創用 CC 姓名標示-非商業性-相同方式分享 4.0 國際版**（CC BY-NC-SA 4.0）授權。  
完整條款請見 [LICENSE.txt](LICENSE.txt)。

- **姓名標示**：使用時須標示適當署名並提供授權條款連結。
- **非商業性**：不得將本作品用於商業目的。
- **相同方式分享**：改作或衍生作品須以相同授權方式散布。

**商業使用**：如需商業授權，請聯繫作者。詳見 [LICENSE.txt](LICENSE.txt) 當中的「商業授權」一節。
