import React, { useRef, useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { parseTryOnRecipe, type TryOnRecipe } from '../../types/tryOnRecipe';
import { buildRemixUrl } from '../../utils/remixLink';

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
  const [includePrompt, setIncludePrompt] = useState(false);
  const { promptOverride, ...baseRecipe } = recipe;
  const sharedRecipe = includePrompt ? recipe : baseRecipe;
  const fileInput = useRef<HTMLInputElement>(null);

  async function share() {
    let url: string;
    try {
      url = buildRemixUrl({ v: 1, f: 'tryon', recipe: sharedRecipe });
    } catch {
      setShareUrl('');
      setMessage(
        zh
          ? '無法建立連結，提示詞可能過長。請下載配方 JSON 分享。'
          : 'Could not create the link; the prompt may be too long. Download the recipe JSON to share it.',
      );
      return;
    }

    setShareUrl(url);
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(url);
      setMessage(zh ? '配方連結已複製。' : 'Recipe link copied.');
    } catch {
      setMessage(zh ? '請複製下方連結。' : 'Copy the link below.');
    }
  }

  function download() {
    const valid = parseTryOnRecipe(sharedRecipe);
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
    <section className="tryon-recipe" aria-label={zh ? '試穿配方' : 'Try-on recipe'}>
      <h2 className="tryon-subheading">{zh ? '儲存與分享配方' : 'Save and share a recipe'}</h2>
      <p className="tryon-hint">
        {zh
          ? '連結與配方包含內建素材及設定；你可另選是否分享自訂提示詞。照片、上傳參考圖與金鑰不會分享，自訂參考圖需重新上傳。'
          : 'Links and recipes contain built-in materials and settings, with custom prompt text only when you choose to include it. Photos, uploaded references and keys stay private. Custom references must be uploaded again.'}
      </p>
      {promptOverride !== undefined && (
        <label className="tryon-preservation">
          <input
            type="checkbox"
            checked={includePrompt}
            onChange={(event) => {
              setIncludePrompt(event.target.checked);
              setShareUrl('');
              setMessage('');
            }}
          />
          <span>{zh ? '在配方中包含自訂提示詞' : 'Include custom prompt in recipe'}</span>
        </label>
      )}
      {promptOverride !== undefined && (
        <p className="tryon-hint">
          {zh
            ? '勾選後，自訂文字會包含在下載的 JSON 與配方連結中；請先檢查有無個人資訊。'
            : 'When checked, your custom text is included in downloaded JSON and recipe links. Review it for personal information before sharing.'}
        </p>
      )}
      <div className="tryon-action-row">
        <button
          type="button"
          className="tool-button tool-button-secondary"
          onClick={() => void share()}
        >
          {zh ? '複製配方連結' : 'Copy recipe link'}
        </button>
        <button type="button" className="tool-button tool-button-secondary" onClick={download}>
          {zh ? '下載配方' : 'Download recipe'}
        </button>
        <button
          type="button"
          className="tool-button tool-button-secondary"
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
        <label className="tryon-field">
          {zh ? '配方連結' : 'Recipe link'}
          <input
            className="tool-control"
            readOnly
            value={shareUrl}
            onFocus={(event) => event.target.select()}
          />
        </label>
      )}
      {message && (
        <p role="status" className="tryon-hint">
          {message}
        </p>
      )}
    </section>
  );
}
