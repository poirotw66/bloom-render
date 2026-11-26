# BloomRender material MCP

[繁體中文](#繁體中文) · [English](#english)

## 繁體中文

這個本機 stdio MCP 服務讓 Codex 等 agent 搜尋 BloomRender 的內建素材，取得參考圖資訊，組裝提示詞及可開啟的試穿配方。它直接讀取專案的 `constants/tryOnMaterials.json`，不依賴執行時所在目錄，也不需要先啟動網站。

目前目錄有 8 個原創 CC0 素材，分為服裝、姿勢與光線三類。工具不會讀取瀏覽器的照片、草稿、歷史或金鑰，不會寫入素材籃，也不會呼叫圖片供應商。個人照片請在 BloomRender 網頁中加入。

### 安裝及接入

需要 Node.js 20+。此專案的開發環境使用 Node.js 22；執行前，在專案根目錄安裝包含開發工具的依賴：

```sh
npm ci
```

在專案根目錄執行下列指令，可把服務加入 Codex。此步驟會修改你自己的 Codex MCP 設定，請由你決定何時執行：

```sh
codex mcp add bloomrender -- node "$PWD/mcp/server.mjs"
```

或在支援 stdio 的 MCP 客戶端中使用絕對路徑：

```json
{
  "mcpServers": {
    "bloomrender": {
      "command": "node",
      "args": ["/absolute/path/to/bloom-render/mcp/server.mjs"]
    }
  }
}
```

服務的標準輸出只用於 MCP 協定。手動啟動可用 `npm run --silent mcp`；一般 `npm run mcp` 的 npm 標題輸出不適合作為客戶端傳輸設定。

### 工具

| 工具                            | 輸入及用途                                                                |
| ------------------------------- | ------------------------------------------------------------------------- |
| `bloomrender_list_collections`  | 列出實際有素材的角色分類及數量。                                          |
| `bloomrender_search_references` | 用 `query`、可選的 `role` 搜尋；`offset` 與 `limit` 提供分頁。            |
| `bloomrender_get_reference`     | 以 `id` 取得提示詞、圖片連結、詳情頁、授權與圖片格式。                    |
| `bloomrender_compose_brief`     | 以 `materialIds` 和可選的 `prompt` 組裝有序參考圖、提示詞及試穿配方連結。 |

`language` 可選 `zh-TW`（預設）或 `en`。搜尋涵蓋中英文標題、描述、素材 ID 與提示詞，採關鍵字比對，不是語意搜尋。目錄原始 `prompt` 為英文，語言選項會切換分類、標題、描述及工具組裝的說明。

例如，先用 `role: "pose"`、`query: "seated"` 找坐姿，再將選好的素材交給組裝工具：

```json
{
  "materialIds": ["white-oxford-shirt", "pose-seated-profile", "lighting-soft-window"],
  "language": "zh-TW",
  "prompt": "使用白色襯衫、側面坐姿與柔和窗光，保持自然的服裝材質。"
}
```

回傳 `prompt` 保留傳入的自訂文字，`brief` 附上按輸入順序編號的參考圖，`recipeUrl` 可在 BloomRender 開啟素材組合。配方只包含內建 ID 與預設設定，不包含自訂提示詞；若需要，在網頁的「提示詞」面板貼上該段文字。網頁試穿會把人物照放在第一張，之後按角色排序，與 MCP 簡報的傳入順序可能不同。

組裝最多接受 9 個不重複的內建 ID，其中服裝最多 5 個，其他角色各 1 個。不明 ID 或衝突選取會回報錯誤，不會默默刪除參考圖。自訂提示詞最長 8000 字元，搜尋每頁最多 50 筆。

### SVG 與部署網址

目前參考圖都是 SVG。回傳資料會標示 `mimeType: "image/svg+xml"` 及 `requiresRasterization: true`。不要直接把 SVG 當成僅接受 PNG/JPEG/WebP 的圖片模型輸入。可先轉成 PNG/JPEG，或透過配方連結進入 BloomRender，網頁會在送出請求前轉換內建素材。

預設連結基底為 `https://www.bloss0m.com/bloom-render/`。本地預覽或自部署時，可在 MCP 客戶端設定環境變數；路徑前綴會保留：

```json
{
  "command": "node",
  "args": ["/absolute/path/to/bloom-render/mcp/server.mjs"],
  "env": {
    "BLOOMRENDER_SITE_URL": "http://127.0.0.1:4196/"
  }
}
```

設定值只用於組裝連結，服務不會下載該網址。只接受 HTTP(S) 基底網址，不接受帳密、query 或 fragment。網址設定錯誤時，服務會在接收請求前結束，診斷只寫入標準錯誤。

## English

This read-only stdio MCP server lets agents search the same built-in catalog as the BloomRender app, retrieve reference URLs and licensing metadata, and compose a prompt plus a try-on recipe link. It reads the repository catalog from a fixed path relative to its module, so it also works when a client launches it from another directory.

Install the development dependencies with `npm ci` using Node.js 20+ (the project uses Node.js 22). Connect a client directly with `node /absolute/path/to/bloom-render/mcp/server.mjs`, or register it yourself from the repository root:

```sh
codex mcp add bloomrender -- node "$PWD/mcp/server.mjs"
```

Use `npm run --silent mcp` for a quiet manual launch. Plain npm banners must not appear in the protocol stdout stream.

The four tools are `bloomrender_list_collections`, `bloomrender_search_references`, `bloomrender_get_reference`, and `bloomrender_compose_brief`. They expose structured input/output schemas. Labels and descriptions support `en` and `zh-TW` (default); source material prompts remain in their catalog language, English. Keyword search covers both languages, IDs and prompts, with offset/limit pagination.

The current catalog contains eight original CC0 references across clothing, pose and lighting. It does not include personal portraits or camera-angle variants. Every current image is SVG and is marked as requiring rasterization. Convert SVG to PNG/JPEG before using an image model that cannot accept SVG; BloomRender performs this conversion when references are used through its web interface.

`compose_brief` preserves the supplied reference order and custom prompt. It accepts at most nine distinct catalog IDs, with no more than five clothing entries and one per other role. Invalid selections fail instead of dropping inputs. Its recipe link shares only catalog IDs and default settings, not custom prompt text. Add your person photo and paste any custom prompt in the web app. Web try-on puts the person image first and groups references by role, so its image numbers may differ from the agent brief.

Set `BLOOMRENDER_SITE_URL` in the client environment for a local or self-hosted HTTP(S) deployment, including any subpath. The default is `https://www.bloss0m.com/bloom-render/`. URLs with credentials, a query or fragment are rejected. The configured URL is never fetched by this server.

The server does not access browser photos, drafts, history or API keys; it does not update the browser basket or make provider calls. It exposes no network listener. Protocol output goes to stdout and startup/transport diagnostics go to stderr. No client configuration is changed by installing or running the server.

Implementation uses the official [MCP TypeScript SDK v2](https://ts.sdk.modelcontextprotocol.io/v2/) with Node-compatible ES modules. Run the catalog and real stdio integration tests with:

```sh
npx vitest run mcp/
```
