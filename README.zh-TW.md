# BloomRender

[English](./README.md) | [繁體中文](./README.zh-TW.md)

[![CI](https://github.com/poirotw66/bloom-render/actions/workflows/ci.yml/badge.svg)](https://github.com/poirotw66/bloom-render/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![線上 Demo](https://img.shields.io/badge/demo-bloss0m.com-e23d2f)](https://www.bloss0m.com/bloom-render/)

**BloomRender — Let your ideas bloom.**

AI 驅動的專業照片編輯與生成工作室，支援自備金鑰的 **Google Gemini** 或 **OpenRouter**：修圖、濾鏡、證件照、形象照、旅遊照、主題寫真、雙人／團體照與 AI 虛擬試穿等功能。

**線上 Demo：** [https://www.bloss0m.com/bloom-render/](https://www.bloss0m.com/bloom-render/)

### 預覽

| 文字生圖                                     | AI 證件照                               | 圖片編輯器                             |
| -------------------------------------------- | --------------------------------------- | -------------------------------------- |
| ![文字生圖結果](images/generate_2_image.png) | ![證件照結果](images/idphoto_5_idp.png) | ![編輯器修圖](images/edit_2_image.png) |

| AI 旅遊照                                    | AI 虛擬試穿                                  |
| -------------------------------------------- | -------------------------------------------- |
| ![旅遊照結果](images/travel_5_cuple_img.png) | ![虛擬試穿結果](images/tryon_4_girl_img.png) |

---

## 功能概覽

入口頁以分頁切換，順序為：**上傳圖片** → **文字生圖** → **攝影服務** → **證件照** → **形象照** → **旅遊照** → **主題寫真** → **雙人／團體照** → **虛擬試穿**。

- **上傳圖片**：拖放或選擇檔案後進入編輯器。
- **文字生圖**：輸入描述、選擇長寬比（1:1、4:3、3:4、16:9、9:16）與張數（1～4），由 AI 生成圖片；多張結果可單張下載或**全部下載為 ZIP**，亦可選一張送入編輯器。
- **圖片編輯器**
  - **修圖**：點選畫面位置並輸入描述，進行局部編輯。
  - **濾鏡**：套用風格濾鏡（如 Synthwave、Anime、Lomo 等）或自訂描述。
  - **調整**：整體調整（模糊背景、增強細節、光線等）或自訂描述。
  - **裁切**：自由裁切或證件規格（2 吋大頭／半身、1 吋等）。
  - 支援復原、重做、與原圖比較、重置、下載。
- **AI 證件照**：選擇證件類型、修圖等級、輸出規格、服裝（可自訂描述與參考圖），上傳肖像後生成證件照；支援單張與批次 ZIP 下載。
- **AI 形象照**：選擇類型與輸出規格，上傳肖像後生成專業形象照。
- **AI 旅遊照**：世界地圖／台灣地圖選景，搭配天氣、時間、服裝、構圖等選項，上傳肖像後生成旅遊照；單人、情侶或團體皆可。
- **AI 主題寫真**：選擇主題類型、輸出尺寸與長寬比，上傳肖像後生成主題寫真。
- **AI 雙人／團體照**：上傳 2 張（雙人）或 3～6 張（團體），選擇風格後生成合照。
- **AI 虛擬試穿**：上傳一張人物照與 1～5 張服裝照，可產出多種風格試穿圖，支援單張下載與全部下載。
- **攝影服務**：導向各 AI 生成功能的入口頁。
- **設定**：影像供應商（Gemini／OpenRouter）、對應 API 金鑰與模型、語言、主題（僅存於瀏覽器）。
- **多語系**：英文、繁體中文。
- **主題**：繁花（Bloom）、深夜（Night）、新年（New Year）。
- **生成歷史**：可檢視、篩選與批次下載過往生成結果。

---

## 快速開始

環境需求：**Node.js 20+**、npm（有 `package-lock.json` 時請用 `npm ci`）。

1. **安裝依賴**

   ```bash
   npm ci
   ```

2. **API 金鑰（自備金鑰 / BYOK）** — 於「設定」選擇 **影像供應商**（`Google Gemini` 或 `OpenRouter（自備金鑰）`）並貼上對應金鑰。金鑰只存在此瀏覽器分頁（`sessionStorage`），關閉分頁後即清除；不會寫入 repo、不會從環境變數讀取，也不會打包進正式版。見 [`.env.example`](./.env.example)。

3. **啟動**

   ```bash
   npm run dev
   ```

   依終端顯示網址開啟（預設 [http://localhost:3002](http://localhost:3002)）。

4. **（選用）靜態圖片**
   - **地圖**：Travel 需 `public/images/world-map.webp`、`public/images/taiwan-map.webp`（見 `public/images/README.md`）。PNG 可執行 `node scripts/convert-public-images-to-webp.mjs` 轉檔。
   - **旅遊場景參考圖**：可依 [docs/SCENE_IMAGES_SOURCES.md](docs/SCENE_IMAGES_SOURCES.md) 放入 `public/images/scenes/`；未放置時仍可以文字描述生成。

---

## API 金鑰

| 情境                    | 作法                                                                                                                                                      |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **設定（BYOK）**        | 齒輪 → **影像供應商**：`Google Gemini` 或 `OpenRouter（自備金鑰）`。貼上對應金鑰並選擇模型。金鑰存於 `sessionStorage`（僅此分頁，關閉後清除），永不打包。 |
| **取得金鑰**            | Gemini：[Google AI Studio](https://aistudio.google.com/app/apikey)。OpenRouter：[openrouter.ai/keys](https://openrouter.ai/keys)。                        |
| **環境變數／CI／Pages** | 不使用任何 API 金鑰環境變數。建置時請勿設定 `GEMINI_API_KEY`／`OPENROUTER_*` — 前端不會注入金鑰。                                                         |

### 各供應商涵蓋範圍

| 功能                                                                                     | 供應商                                             |
| ---------------------------------------------------------------------------------------- | -------------------------------------------------- |
| 文字生圖、編輯器（修圖／濾鏡／調整）、證件照、形象照、旅遊照、主題寫真、雙人／團體、試穿 | 所選供應商（`services/imageProviders/`）           |
| 旅遊照「自訂場景」**提示詞優化**（文字）                                                 | **僅 Gemini** — 選 OpenRouter 時略過，直接使用原文 |
| 首頁 **模型比較**                                                                        | **僅 Gemini**（比較 Gemini 模型 ID）               |

OpenRouter 請優先選支援影像的模型（例如 `google/gemini-2.5-flash-image`）。不支援影像參考的模型，在修圖／試穿／多圖流程可能失敗。

請勿提交 `.env`／`.env.local`，也勿把金鑰貼到 issue。請在供應商端設定配額與帳單上限。

---

## 技術與依賴

- **Runtime**：React 19、TypeScript、Vite 6
- **路由**：React Router 7
- **編輯**：react-image-crop
- **AI**：[@google/genai](https://www.npmjs.com/package/@google/genai)（Gemini）＋ OpenRouter Images API（`services/imageProviders/`）
- **批次下載**：JSZip
- **樣式**：Tailwind CSS 4（`@tailwindcss/vite` 建置時編譯，非 CDN）＋自訂 CSS
- **開發**：ESLint、Prettier、Vitest、Husky、lint-staged

---

## 可用指令

| 指令                              | 說明                                     |
| --------------------------------- | ---------------------------------------- |
| `npm run dev`                     | 開發伺服器（port 3002）                  |
| `npm run build`                   | 建置至 `dist/`，並產生 SPA 用 `404.html` |
| `npm run preview`                 | 預覽建置結果                             |
| `npm run typecheck`               | `tsc --noEmit`                           |
| `npm run lint`                    | ESLint                                   |
| `npm test`                        | Vitest                                   |
| `npm run format` / `format:check` | Prettier 寫入／檢查                      |

---

## 部署

- 將 `dist/` 部署至任何靜態託管即可。
- **GitHub Pages**：建置時設定 `GITHUB_PAGES=true`，使 `base` 為 `/bloom-render/`。見 [.github/workflows/deploy.yml](.github/workflows/deploy.yml)（僅在 `main` 部署，且須通過 CI quality-gate）。

---

## 文件

完整索引見 [docs/README.md](docs/README.md)。重點：

- **[BloomRender 操作手冊](docs/BLOOMRENDER_MANUAL.md)**：圖文教學，含文字生圖、證件照、形象照、旅遊照、虛擬試穿與編輯器流程
- **[場景圖來源](docs/SCENE_IMAGES_SOURCES.md)**／**[狀態表](docs/SCENE_IMAGES_STATUS.md)**：可選的旅遊場景參考圖
- **[型別配置](docs/TYPES.md)**：共用與 feature 區域 TypeScript 型別放置說明

---

## 貢獻

見 [CONTRIBUTING.md](./CONTRIBUTING.md)。本專案遵循 [Contributor Covenant 行為準則](./CODE_OF_CONDUCT.md)。安全性回報見 [SECURITY.md](./SECURITY.md)。

---

## 授權

[MIT](./LICENSE) © 2026 poirotw66
