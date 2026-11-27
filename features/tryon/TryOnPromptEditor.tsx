import React, { useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { MAX_TRYON_PROMPT_LENGTH } from '../../types/tryOnRecipe';
import { TRYON_MATERIALS } from '../../constants/tryOnMaterials';
import { SITE_URL } from '../../constants/site';
import { formatReferenceBrief } from '../../utils/posewearReferences';
import './tryon-prompt-editor.css';

interface Props {
  automaticPrompt: string;
  quantity: number;
  promptOverride?: string;
  referenceMap: { role: string; name: string; materialId?: string }[];
  onChange: (value: string | undefined) => void;
  disabled?: boolean;
}

export default function TryOnPromptEditor({
  automaticPrompt,
  quantity,
  promptOverride,
  referenceMap,
  onChange,
  disabled,
}: Props) {
  const { language } = useLanguage();
  const zh = language === 'zh-TW';
  const [message, setMessage] = useState('');
  const [showBrief, setShowBrief] = useState(false);
  const manual = promptOverride !== undefined;
  const prompt = promptOverride ?? automaticPrompt;
  const roleLabels: Record<string, string> = zh
    ? {
        person: '人物',
        clothing: '服裝',
        pose: '姿勢',
        expression: '表情',
        scene: '場景',
        lighting: '光線',
      }
    : {
        person: 'Person',
        clothing: 'Clothing',
        pose: 'Pose',
        expression: 'Expression',
        scene: 'Scene',
        lighting: 'Lighting',
      };
  const publicReferences = referenceMap.map((ref) => {
    if (ref.role === 'person') return null;
    const material = TRYON_MATERIALS.find(
      (item) => item.id === ref.materialId && item.role === ref.role,
    );
    return material
      ? {
          label: `${roleLabels[material.role]} · ${zh ? material.titleZh : material.title}`,
          url: new URL(material.image, SITE_URL).href,
        }
      : null;
  });
  const hasSvgReferences = publicReferences.some((ref) => ref?.url.endsWith('.svg'));
  const brief = formatReferenceBrief(prompt, publicReferences, language);
  async function copy() {
    setShowBrief(false);
    try {
      await navigator.clipboard.writeText(prompt);
      setMessage(zh ? '提示詞已複製。' : 'Prompt copied.');
    } catch {
      setMessage(zh ? '請選取下方文字並複製。' : 'Select the prompt below to copy it.');
    }
  }
  async function copyBrief() {
    try {
      await navigator.clipboard.writeText(brief);
      setShowBrief(false);
      setMessage(zh ? '參考摘要已複製。' : 'Reference brief copied.');
    } catch {
      setShowBrief(true);
      setMessage(
        zh ? '請選取下方參考摘要並複製。' : 'Select the reference brief below to copy it.',
      );
    }
  }
  return (
    <div className="tryon-prompt-editor">
      <label className="tryon-field">
        {zh ? '提示詞模式' : 'Prompt mode'}
        <select
          className="tool-control"
          data-testid="tryon-prompt-mode"
          value={manual ? 'manual' : 'automatic'}
          disabled={disabled}
          onChange={(event) => {
            onChange(event.target.value === 'manual' ? automaticPrompt : undefined);
            setMessage('');
          }}
        >
          <option value="automatic">{zh ? '自動' : 'Automatic'}</option>
          <option value="manual">{zh ? '自訂' : 'Manual'}</option>
        </select>
      </label>
      <p className="tryon-hint">
        {manual
          ? zh
            ? '自訂模式會使用下方文字；更改素材或設定不會改寫它。請確認圖片編號仍符合參考圖順序。'
            : 'Manual mode uses the text below. Changing references or settings will not rewrite it. Check that its image numbers still match the reference order.'
          : zh
            ? '自動模式會依照照片、參考素材及設定組裝提示詞。切換到自訂可修改文字。'
            : 'Automatic mode builds the prompt from your photos, references and settings. Switch to Manual to edit it.'}
      </p>
      <ol
        data-testid="tryon-reference-map"
        className="tryon-reference-map"
        aria-label={zh ? '參考圖順序' : 'Reference image order'}
      >
        {referenceMap.map((ref, index) => (
          <li key={`${index}-${ref.role}`}>
            <strong>
              {zh ? `圖 ${index + 1}` : `Image ${index + 1}`} · {roleLabels[ref.role] ?? ref.role}
            </strong>
            <span>{ref.name || (zh ? '尚未上傳' : 'Not uploaded')}</span>
          </li>
        ))}
      </ol>
      <label className="tryon-field">
        {!manual && quantity > 1
          ? zh
            ? `自動提示詞 · 第 1 張，共 ${quantity} 張`
            : `Automatic prompt — image 1 of ${quantity}`
          : zh
            ? '生成提示詞'
            : 'Generation prompt'}
        <textarea
          className="tool-control tryon-prompt-text"
          data-testid="tryon-prompt"
          rows={12}
          value={prompt}
          readOnly={!manual}
          disabled={disabled}
          maxLength={MAX_TRYON_PROMPT_LENGTH}
          onChange={(event) => onChange(event.target.value)}
        />
      </label>
      {quantity > 1 && (
        <p className="tryon-hint">
          {manual
            ? zh
              ? '每張圖片都會使用相同的自訂提示詞。'
              : 'Every image uses this exact custom prompt.'
            : zh
              ? '其他圖片使用相同的參考圖與設定，並加入各自的變化指示。'
              : 'Other images use the same references and settings with different variation instructions.'}
        </p>
      )}
      {manual && !prompt.trim() && (
        <p role="alert" className="tryon-error">
          {zh ? '請輸入提示詞，或回復自動模式。' : 'Enter a prompt or reset to automatic mode.'}
        </p>
      )}
      <div className="tryon-action-row">
        <button
          type="button"
          className="tool-button tool-button-secondary"
          onClick={() => void copy()}
        >
          {zh ? '複製提示詞' : 'Copy prompt'}
        </button>
        <button
          type="button"
          className="tool-button tool-button-secondary"
          data-testid="tryon-copy-reference-brief"
          onClick={() => void copyBrief()}
        >
          {zh ? '複製參考摘要' : 'Copy reference brief'}
        </button>
        {manual && (
          <button
            type="button"
            className="tool-button tool-button-secondary"
            disabled={disabled}
            onClick={() => {
              onChange(undefined);
              setMessage('');
            }}
          >
            {zh ? '回復自動模式' : 'Reset to automatic'}
          </button>
        )}
      </div>
      <p className="tryon-hint">
        {zh
          ? '參考摘要會附上內建素材的公開連結；你上傳的圖片需另外附上。'
          : 'Reference briefs include public links to built-in materials. Attach your uploaded images separately.'}
      </p>
      {hasSvgReferences && (
        <p className="tryon-hint">
          {zh
            ? 'SVG 參考圖需先轉成 PNG，再附加到生圖模型。'
            : 'Convert SVG references to PNG before attaching them to an image model.'}
        </p>
      )}
      {showBrief && (
        <label className="tryon-field">
          {zh ? '參考摘要' : 'Reference brief'}
          <textarea
            className="tool-control tryon-prompt-text"
            data-testid="tryon-reference-brief"
            rows={8}
            value={brief}
            readOnly
            onFocus={(event) => event.target.select()}
          />
        </label>
      )}
      {message && (
        <p role="status" className="tryon-hint">
          {message}
        </p>
      )}
    </div>
  );
}
