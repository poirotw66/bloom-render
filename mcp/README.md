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
| `bloomrender_search_references` | 用 `query`、`role` 與姿勢欄位篩選；`offset`、`limit` 提供分頁。           |
| `bloomrender_get_reference`     | 以 `id` 取得提示詞、圖片連結、詳情頁、授權、格式及姿勢／機位資料。        |
| `bloomrender_compose_brief`     | 以 `materialIds` 和可選的 `prompt` 組裝有序參考圖、提示詞及試穿配方連結。 |

`language` 可選 `zh-TW`（預設）或 `en`。搜尋涵蓋中英文標題、描述、素材 ID 與提示詞，採關鍵字比對，不是語意搜尋。目錄原始 `prompt` 為英文，語言選項會切換分類、標題、描述及工具組裝的說明。

### 姿勢與機位篩選

姿勢素材會回傳 `pose` 物件；服裝、光線等其他素材不會帶有此欄位。欄位值為語言無關的代碼：

| 欄位           | 意義與允許值                                                          |
| -------------- | --------------------------------------------------------------------- |
| `groupId`      | 穩定姿勢群組 ID；目前為 `relaxed-standing`、`hand-on-hip`、`seated`。 |
| `posture`      | `standing`、`seated`。                                                |
| `view`         | `front`、`three-quarter`、`profile`。                                 |
| `cameraHeight` | `eye-level`、`high-angle`、`low-angle`、`unspecified`。               |
| `framing`      | `full-body`、`upper-body`、`close-up`。                               |

搜尋工具接受上述欄位作為可選篩選，並以交集比對。例如：

```json
{ "role": "pose", "posture": "seated", "view": "profile", "language": "zh-TW" }
```

目前三個姿勢群組各只有一張實際參考圖；全部為全身取景，機位高度均未標示。`unspecified` 不會被提示詞組裝器轉成猜測的平視、俯視或仰視指令，也沒有深度圖或精確角度。篩選尚無素材的值會回傳空結果；服裝類別搭配姿勢篩選也回傳空結果，不會忽略條件。文字搜尋同時涵蓋中英文姿勢／機位標籤。

參考圖的 `prompt` 與預設組合提示詞會附加共用的姿勢及機位指令，與網頁自動生成使用相同資料。自訂 `prompt` 仍原樣保留，配方仍只儲存既有素材 ID 與設定。

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

The current catalog contains eight original CC0 references across clothing, pose and lighting. Pose references include `pose: {groupId, posture, view, cameraHeight, framing}`; other roles omit `pose`. There are three stable pose groups, each with one actual view. All current poses use `full-body` framing and `unspecified` camera height; no numeric camera angles, depth maps or unprovided view variants are invented. Every current image is SVG and is marked as requiring rasterization. Convert SVG to PNG/JPEG before using an image model that cannot accept SVG; BloomRender performs this conversion when references are used through its web interface.

Search also accepts optional `posture`, `view`, `groupId`, `cameraHeight`, and `framing` filters. Supported values are listed in the table above and advertised in the tool schema. Filters intersect, so a non-pose role combined with a pose filter returns no matches. Keyword search includes the shared English/Traditional Chinese metadata labels. For example, `{"role":"pose","posture":"seated","view":"profile"}` resolves the existing seated-profile reference. Pose metadata values are language-independent codes. The reference prompt and automatic brief use the same structured pose/camera instructions as browser generation; unspecified camera height adds no fabricated height instruction.

`compose_brief` preserves the supplied reference order and custom prompt. It accepts at most nine distinct catalog IDs, with no more than five clothing entries and one per other role. Invalid selections fail instead of dropping inputs. Its recipe link shares only catalog IDs and default settings, not custom prompt text. Add your person photo and paste any custom prompt in the web app. Web try-on puts the person image first and groups references by role, so its image numbers may differ from the agent brief.

Set `BLOOMRENDER_SITE_URL` in the client environment for a local or self-hosted HTTP(S) deployment, including any subpath. The default is `https://www.bloss0m.com/bloom-render/`. URLs with credentials, a query or fragment are rejected. The configured URL is never fetched by this server.

The server does not access browser photos, drafts, history or API keys; it does not update the browser basket or make provider calls. It exposes no network listener. Protocol output goes to stdout and startup/transport diagnostics go to stderr. No client configuration is changed by installing or running the server.

Implementation uses the official [MCP TypeScript SDK v2](https://ts.sdk.modelcontextprotocol.io/v2/) with Node-compatible ES modules. Run the catalog and real stdio integration tests with:

```sh
npx vitest run mcp/
```
