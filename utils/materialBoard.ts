import type { TryOnMaterial } from '../constants/tryOnMaterials';
import { getPoseMetadataLabel } from '../constants/poseMetadata.mjs';
import type { Language } from '../contexts/LanguageContext';
import { publicAssetUrl } from './publicAsset';

export interface MaterialBoardEntry {
  id: string;
  number: number;
  title: string;
  role: string;
  pose: string;
  image: string;
  attribution: string;
}

export interface MaterialBoardColors {
  background: string;
  surface: string;
  ink: string;
  muted: string;
  accent: string;
}

const ROLES: Record<string, [string, string]> = {
  clothing: ['Clothing', '服裝'],
  pose: ['Pose', '姿勢'],
  expression: ['Expression', '表情'],
  scene: ['Scene', '場景'],
  lighting: ['Lighting', '光線'],
};

export function materialBoardEntries(
  materials: readonly TryOnMaterial[],
  language: Language,
): MaterialBoardEntry[] {
  const zh = language === 'zh-TW';
  return materials.map((material, index) => ({
    id: material.id,
    number: index + 1,
    title: zh ? material.titleZh : material.title,
    role: ROLES[material.role]?.[zh ? 1 : 0] ?? material.role,
    pose: material.pose
      ? (['posture', 'view', 'cameraHeight', 'framing'] as const)
          .filter((field) => material.pose![field] !== 'unspecified')
          .map((field) => getPoseMetadataLabel(field, material.pose![field], language))
          .join(' · ')
      : '',
    image: material.image,
    attribution: `${material.license} · ${material.source}`,
  }));
}

export function wrapBoardText(
  context: Pick<CanvasRenderingContext2D, 'measureText'>,
  text: string,
  width: number,
): string[] {
  const lines: string[] = [];
  for (const paragraph of text.split('\n')) {
    let line = '';
    for (const character of paragraph) {
      if (line && context.measureText(line + character).width > width) {
        lines.push(line.trimEnd());
        line = character.trimStart();
      } else line += character;
    }
    lines.push(line);
  }
  return lines;
}

function loadBoardImage(path: string, signal?: AbortSignal): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const finish = (error?: Error) => {
      clearTimeout(timer);
      signal?.removeEventListener('abort', aborted);
      image.onload = null;
      image.onerror = null;
      if (error) {
        image.src = '';
        reject(error);
      } else resolve(image);
    };
    const aborted = () => finish(new DOMException('Export cancelled', 'AbortError'));
    const timer = setTimeout(() => finish(new Error(`Cannot load board image: ${path}`)), 15000);
    image.onload = () =>
      image.naturalWidth && image.naturalHeight
        ? finish()
        : finish(new Error(`Empty board image: ${path}`));
    image.onerror = () => finish(new Error(`Cannot load board image: ${path}`));
    signal?.addEventListener('abort', aborted, { once: true });
    if (signal?.aborted) aborted();
    else image.src = publicAssetUrl(path);
  });
}

const FONT = '"Work Sans", Arial, sans-serif';
const WIDTH = 1200;
const MARGIN = 48;
const GAP = 24;
const IMAGE_HEIGHT = 360;
const SCALE = 2;

export async function renderMaterialBoard(
  materials: readonly TryOnMaterial[],
  {
    language,
    colors,
    signal,
  }: { language: Language; colors: MaterialBoardColors; signal?: AbortSignal },
): Promise<Blob> {
  if (!materials.length) throw new Error('Select references before exporting a board.');
  if (materials.length > 9) throw new Error('A reference board supports up to nine materials.');
  const entries = materialBoardEntries(materials, language);
  const images = await Promise.all(entries.map((entry) => loadBoardImage(entry.image, signal)));
  await document.fonts?.ready;
  signal?.throwIfAborted();
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas is unavailable.');
  const columns = entries.length === 1 ? 1 : 2;
  const cardWidth = (WIDTH - MARGIN * 2 - GAP * (columns - 1)) / columns;
  const textWidth = cardWidth - 48;
  const cards = entries.map((entry) => {
    context.font = `600 22px ${FONT}`;
    const title = wrapBoardText(context, `${entry.number}. ${entry.title}`, textWidth);
    context.font = `400 16px ${FONT}`;
    const pose = entry.pose ? wrapBoardText(context, entry.pose, textWidth) : [];
    context.font = `400 12px ${FONT}`;
    const attribution = wrapBoardText(context, entry.attribution, textWidth);
    const height =
      24 +
      22 +
      16 +
      IMAGE_HEIGHT +
      24 +
      title.length * 30 +
      pose.length * 24 +
      16 +
      attribution.length * 18 +
      24;
    return { title, pose, attribution, height };
  });
  const rows = Array.from({ length: Math.ceil(cards.length / columns) }, (_, row) =>
    Math.max(...cards.slice(row * columns, row * columns + columns).map((card) => card.height)),
  );
  const height = 144 + rows.reduce((total, row) => total + row, 0) + GAP * (rows.length - 1) + 64;
  canvas.width = WIDTH * SCALE;
  canvas.height = height * SCALE;
  context.scale(SCALE, SCALE);
  context.fillStyle = colors.background;
  context.fillRect(0, 0, WIDTH, height);
  context.fillStyle = colors.ink;
  context.font = `600 32px ${FONT}`;
  context.fillText(
    language === 'zh-TW' ? 'BloomRender 參考畫板' : 'BloomRender Reference Board',
    MARGIN,
    65,
  );
  context.font = `400 16px ${FONT}`;
  context.fillStyle = colors.muted;
  context.fillText(
    language === 'zh-TW'
      ? `${entries.length} 張參考圖 · 依素材籃順序編號`
      : `${entries.length} references · Numbered in basket order`,
    MARGIN,
    101,
  );
  let rowY = 144;
  for (let index = 0; index < entries.length; index++) {
    signal?.throwIfAborted();
    if (index > 0 && index % columns === 0) rowY += rows[Math.floor(index / columns) - 1] + GAP;
    const x = MARGIN + (index % columns) * (cardWidth + GAP);
    const card = cards[index];
    context.fillStyle = colors.surface;
    context.fillRect(x, rowY, cardWidth, rows[Math.floor(index / columns)]);
    context.fillStyle = colors.accent;
    context.font = `600 16px ${FONT}`;
    context.fillText(`${entries[index].number} / ${entries[index].role}`, x + 24, rowY + 40);
    const image = images[index];
    const factor = Math.min(textWidth / image.naturalWidth, IMAGE_HEIGHT / image.naturalHeight);
    const imageWidth = image.naturalWidth * factor;
    const imageHeight = image.naturalHeight * factor;
    context.drawImage(
      image,
      x + 24 + (textWidth - imageWidth) / 2,
      rowY + 62 + (IMAGE_HEIGHT - imageHeight) / 2,
      imageWidth,
      imageHeight,
    );
    let textY = rowY + 62 + IMAGE_HEIGHT + 36;
    context.fillStyle = colors.ink;
    context.font = `600 22px ${FONT}`;
    for (const line of card.title) {
      context.fillText(line, x + 24, textY);
      textY += 30;
    }
    context.fillStyle = colors.muted;
    context.font = `400 16px ${FONT}`;
    for (const line of card.pose) {
      context.fillText(line, x + 24, textY);
      textY += 24;
    }
    textY += 16;
    context.font = `400 12px ${FONT}`;
    for (const line of card.attribution) {
      context.fillText(line, x + 24, textY);
      textY += 18;
    }
  }
  context.fillStyle = colors.muted;
  context.font = `400 13px ${FONT}`;
  context.fillText('BloomRender · Original reference illustrations · CC0 1.0', MARGIN, height - 26);
  signal?.throwIfAborted();
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (signal?.aborted) reject(new DOMException('Export cancelled', 'AbortError'));
      else if (blob) resolve(blob);
      else reject(new Error('PNG encoding failed.'));
    }, 'image/png');
  });
}

export function downloadMaterialBoard(blob: Blob): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `bloomrender-reference-board-${new Date().toISOString().slice(0, 10)}.png`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
