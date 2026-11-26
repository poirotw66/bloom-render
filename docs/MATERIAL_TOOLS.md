# Material tools

The material library and try-on reference picker share favorites and recently
used references. These are separate from the material basket. Only known built-in
material IDs are saved in `bloom_material_preferences`; uploaded photos, prompts
and API keys are excluded. Favorites survive reloads. Recently used references
are ordered newest first and limited to 12 entries. Opening a material detail or
preview, applying it in the picker, or using a basket records that reference.
Filtering or favoriting alone does not count as use. If browser storage is
unavailable, the controls continue to work for the current session.

## Reference board PNG

Open the material basket and choose **Export board PNG**. The downloaded PNG
contains every selected built-in reference, in basket order, with a number,
material role, title, available pose information and its license/source URL.
Unspecified camera height is omitted. The canvas uses the active theme colors
and exports at 2400 pixels wide. No API call is made.

The export requires every image to load. A failed image reports an error instead
of producing a partial board. Close the basket to cancel; selection changes also
cancel an export in progress. Empty baskets cannot export. The board contains
built-in catalog references, not uploaded person or clothing photos.

## Material viewer

Use **View image** in the material library or reference picker. The viewer
provides 1×–3× zoom, drag-to-pan when enlarged, horizontal mirror, composition
lines and grayscale. The controls affect only the preview and do not alter the
reference sent to an image provider. Opening another material resets the tools.

| Key      | Action                                 |
| -------- | -------------------------------------- |
| `Z`      | Cycle zoom                             |
| `H`      | Toggle horizontal mirror               |
| `G`      | Cycle no grid, thirds and center lines |
| `B`      | Toggle grayscale                       |
| `0`      | Reset the view                         |
| `Escape` | Close the viewer and restore focus     |

Double-click the preview to toggle 1×/2× zoom. A viewer opened from the try-on
reference dialog closes before its parent dialog; its selection remains intact.

## Command palette

Press `Ctrl+K` on Windows/Linux or `⌘K` on macOS, or use **Search tools and
materials** in the tools menu. The desktop tool header also exposes **Search**.
Search works with English and Traditional Chinese names. Results include photo
tools, built-in materials, commands for the current workspace, the material
basket, settings, themes and language.

Use arrow keys to select, `Enter` to run a command and `Escape` to close. Route
changes use the existing unsaved-work confirmation. The palette does not open on
top of an already active dialog. Dialog actions close the palette before opening
the next dialog. The palette is loaded only when first opened.

本次功能包含素材畫板 PNG、素材大圖檢視、全域命令搜尋，以及素材收藏與最近使用。
所有設定保留於瀏覽器；未新增本機生成引擎、深度圖或外部素材來源。
