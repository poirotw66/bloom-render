import React, { useRef, useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { parseTryOnRecipe, type TryOnRecipe } from '../../types/tryOnRecipe';
import { buildRemixUrl } from '../../utils/remixLink';
import { UI_BTN_SECONDARY, UI_INPUT } from '../../utils/uiClasses';

interface Props {
  recipe: TryOnRecipe;
  onApply: (recipe: TryOnRecipe) => void;
}

export default function TryOnRecipeActions({ recipe, onApply }: Props) {
  const { language } = useLanguage();
  const zh = language === 'zh-TW';
  const [message, setMessage] = useState('');
  const [shareUrl, setShareUrl] = useState('');
  const [busy, setBusy] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  async function share() {
    try {
      const url = buildRemixUrl({ v: 1, f: 'tryon', recipe });
      setShareUrl(url);
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
        setMessage(zh ? '配方連結已複製。' : 'Recipe link copied.');
      } else {
        setMessage(zh ? '請複製下方連結。' : 'Copy the link below.');
      }
    } catch {
      setMessage(
        zh ? '請複製下方連結，或下載配方。' : 'Copy the link below or download the recipe.',
      );
    }
  }

  function download() {
    const valid = parseTryOnRecipe(recipe);
    if (!valid) return;
    const blob = new Blob([JSON.stringify(valid, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'bloomrender-tryon-recipe.json';
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  async function importFile(file: File) {
    setBusy(true);
    setShareUrl('');
    try {
      if (file.size > 32_768) throw new Error('Recipe too large');
      const parsed = parseTryOnRecipe(JSON.parse(await file.text()));
      if (!parsed) throw new Error('Invalid recipe');
      onApply(parsed);
      setMessage(
        zh
          ? '配方已套用，請確認參考素材並上傳自己的照片。'
          : 'Recipe applied. Check the materials and upload your photo.',
      );
    } catch {
      setMessage(
        zh
          ? '無法讀取配方，請選擇有效的 BloomRender 試穿配方 JSON。'
          : 'Choose a valid BloomRender try-on recipe JSON file.',
      );
    } finally {
      setBusy(false);
      if (fileInput.current) fileInput.current.value = '';
    }
  }

  return (
    <section
      className="space-y-3 border-t theme-border pt-5"
      aria-label={zh ? '試穿配方' : 'Try-on recipe'}
    >
      <h2 className="text-base font-semibold theme-ink">
        {zh ? '儲存與分享配方' : 'Save and share a recipe'}
      </h2>
      <p className="text-sm theme-ink-muted">
        {zh
          ? '連結與配方只含內建素材及設定，不包含你的照片、上傳參考圖或金鑰。自訂參考圖需由使用者重新上傳。'
          : 'Links and recipes contain built-in materials and settings only. Photos, uploaded references and keys stay private. Custom references must be uploaded again.'}
      </p>
      <div className="flex flex-wrap gap-2">
        <button type="button" className={UI_BTN_SECONDARY} onClick={() => void share()}>
          {zh ? '複製配方連結' : 'Copy recipe link'}
        </button>
        <button type="button" className={UI_BTN_SECONDARY} onClick={download}>
          {zh ? '下載配方' : 'Download recipe'}
        </button>
        <button
          type="button"
          className={UI_BTN_SECONDARY}
          disabled={busy}
          onClick={() => fileInput.current?.click()}
        >
          {zh ? '匯入配方' : 'Import recipe'}
        </button>
        <input
          ref={fileInput}
          type="file"
          accept="application/json,.json"
          className="hidden"
          aria-label={zh ? '選擇試穿配方檔案' : 'Choose try-on recipe file'}
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void importFile(file);
          }}
        />
      </div>
      {shareUrl && (
        <label className="block text-sm theme-ink-muted">
          {zh ? '配方連結' : 'Recipe link'}
          <input
            className={`mt-1 w-full ${UI_INPUT}`}
            readOnly
            value={shareUrl}
            onFocus={(event) => event.target.select()}
          />
        </label>
      )}
      <p role="status" className="text-sm theme-ink-muted">
        {message}
      </p>
    </section>
  );
}
