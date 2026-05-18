/**
 * Resolve paths under `public/` for the current Vite base URL (e.g. GitHub Pages /bloom-render/).
 */
export function publicAssetUrl(path: string): string {
  const normalized = path.replace(/^\//, '');
  const base = import.meta.env.BASE_URL || '/';
  return `${base}${normalized}`;
}
