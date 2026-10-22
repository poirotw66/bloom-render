# README showcase assets

Fresh UI captures of BloomRender after Wave K/L (demo mode / no API keys).

| File                             | Theme | Content                                     |
| -------------------------------- | ----- | ------------------------------------------- |
| `core-flow.gif` / `.webp`        | Bloom | Try demo → ID photo generate → result/share |
| `hero-bloom.webp`                | 繁花  | Landing + API-key / Try demo notice         |
| `hero-night.webp`                | 深夜  | Landing                                     |
| `hero-newyear.webp`              | 新年  | Landing                                     |
| `generate-night.webp`            | 深夜  | Text-to-image                               |
| `idphoto-print-newyear.webp`     | 新年  | ID photo result, before/after, 4×6" sheet   |
| `photography-service-bloom.webp` | 繁花  | Photography Studio (no prices)              |
| `enhance-night.webp`             | 深夜  | On-device enhance                           |
| `editor-mask-bloom.webp`         | 繁花  | Editor retouch brush mask                   |
| `prompt-gallery-bloom.webp`      | 繁花  | Community prompt gallery                    |

Regenerate:

```bash
npm run build && npx serve -s dist -l 4175
node scripts/capture-readme-showcase.mjs --base http://127.0.0.1:4175
node scripts/capture-readme-showcase-part2.mjs --base http://127.0.0.1:4175
# then compress / ffmpeg as in Wave M notes
```
