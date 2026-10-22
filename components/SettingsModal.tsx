/**
 * @license
 * SPDX-License-Identifier: MIT
 */

import React, { useEffect, useId, useState } from 'react';
import { useSettings } from '../contexts/SettingsContext';
import { IMAGE_PRICING_LAST_UPDATED } from '../constants/imagePricing';
import { MODEL_LABEL_KEYS, SUPPORTED_MODELS, type ModelType } from '../constants/models';
import {
  OPENROUTER_IMAGE_MODELS,
  OPENROUTER_MODEL_LABEL_KEYS,
  type ImageProviderId,
  type OpenRouterModel,
} from '../services/imageProviders';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme, type ThemeType } from '../contexts/ThemeContext';
import { useDialog } from '../hooks/useDialog';
import { formatUsd } from '../utils/costEstimate';
import {
  readSessionSpendUsd,
  resetSessionSpendUsd,
  SESSION_SPEND_EVENT,
  notifySessionSpendChanged,
} from '../utils/sessionSpend';
import { ChevronDownIcon, XMarkIcon } from './icons';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/** Theme-derived class snippets, so markup below stays readable. */
const themeStyles = {
  bloom: {
    dialog: 'theme-surface border theme-border',
    section: 'theme-border theme-raised',
    divider: 'theme-border',
    heading: 'theme-ink',
    sectionTitle: 'theme-ink',
    chevron: 'theme-ink-soft',
    iconBtn: 'theme-ink-muted hover:text-white focus-visible:brand-ring',
    choiceActive: 'theme-border-strong theme-ink focus-visible:brand-ring',
    choiceIdle:
      'theme-border theme-ink-soft hover:theme-border-strong hover:text-white focus-visible:brand-ring',
    selectedTag: 'brand-text-soft',
    label: 'theme-ink-soft',
    hint: 'theme-ink-muted',
    field: 'theme-raised theme-border theme-ink focus-visible:brand-ring',
    checkbox: 'brand-text-strong theme-raised theme-border focus-visible:brand-ring',
    confirm: 'brand-bg-strong hover:opacity-95 text-white focus-visible:brand-ring',
  },
  night: {
    dialog: 'theme-surface border theme-border',
    section: 'theme-border theme-raised',
    divider: 'theme-border',
    heading: 'theme-ink',
    sectionTitle: 'theme-ink',
    chevron: 'theme-ink-soft',
    iconBtn: 'theme-ink-muted hover:text-white focus-visible:brand-ring',
    choiceActive: 'theme-border-strong theme-ink focus-visible:brand-ring',
    choiceIdle:
      'theme-border theme-ink-soft hover:theme-border-strong hover:text-white focus-visible:brand-ring',
    selectedTag: 'brand-text-soft',
    label: 'theme-ink-soft',
    hint: 'theme-ink-muted',
    field: 'theme-raised theme-border theme-ink focus-visible:brand-ring',
    checkbox: 'brand-text-strong theme-raised theme-border focus-visible:brand-ring',
    confirm: 'brand-bg-strong hover:opacity-95 text-white focus-visible:brand-ring',
  },
  newyear: {
    dialog: 'theme-surface border theme-border',
    section: 'theme-border theme-raised',
    divider: 'theme-border',
    heading: 'theme-ink',
    sectionTitle: 'theme-ink',
    chevron: 'theme-ink-soft',
    iconBtn: 'theme-ink-muted hover:text-white focus-visible:brand-ring',
    choiceActive: 'theme-border-strong theme-ink focus-visible:brand-ring',
    choiceIdle:
      'theme-border theme-ink-soft hover:theme-border-strong hover:text-white focus-visible:brand-ring',
    selectedTag: 'brand-text-soft',
    label: 'theme-ink-soft',
    hint: 'theme-ink-muted',
    field: 'theme-raised theme-border theme-ink focus-visible:brand-ring',
    checkbox: 'brand-text-strong theme-raised theme-border focus-visible:brand-ring',
    confirm: 'brand-bg-strong hover:opacity-95 text-white focus-visible:brand-ring',
  },
} as const satisfies Record<ThemeType, Record<string, string>>;

const FIELD_BASE =
  'w-full border rounded-lg p-3 focus:outline-none focus-visible:ring-2 transition-colors';
const CHOICE_BASE =
  'rounded-lg border px-3 py-2 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-offset-black cursor-pointer';

type SectionKey = 'theme' | 'language' | 'model' | 'compression' | 'spend';

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const {
    imageProvider,
    setImageProvider,
    apiKey,
    setApiKey,
    model,
    setModel,
    openRouterApiKey,
    setOpenRouterApiKey,
    openRouterModel,
    setOpenRouterModel,
    enableImageCompression,
    setEnableImageCompression,
    compressionThresholdMB,
    setCompressionThresholdMB,
    enableBackgroundMotion,
    setEnableBackgroundMotion,
  } = useSettings();
  const { t, language, setLanguage } = useLanguage();
  const { theme, setTheme } = useTheme();
  const dialogRef = useDialog<HTMLDivElement>(isOpen, onClose);
  const baseId = useId();

  const [openSections, setOpenSections] = useState<Record<SectionKey, boolean>>({
    theme: true,
    language: false,
    model: true,
    compression: false,
    spend: true,
  });
  const [showApiKey, setShowApiKey] = useState(false);
  const [sessionSpend, setSessionSpend] = useState(0);
  const isDemo = imageProvider === 'demo';
  const isGemini = imageProvider === 'gemini';

  useEffect(() => {
    if (!isOpen) return;
    const sync = () => setSessionSpend(readSessionSpendUsd());
    sync();
    window.addEventListener(SESSION_SPEND_EVENT, sync);
    return () => window.removeEventListener(SESSION_SPEND_EVENT, sync);
  }, [isOpen]);

  const toggleSection = (key: SectionKey) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  if (!isOpen) return null;

  const s = themeStyles[theme];

  const renderSection = (key: SectionKey, titleKey: string, body: React.ReactNode) => {
    const panelId = `${baseId}-${key}-panel`;
    const buttonId = `${baseId}-${key}-button`;

    return (
      <div className={`border rounded-xl ${s.section}`}>
        <button
          type="button"
          id={buttonId}
          onClick={() => toggleSection(key)}
          aria-expanded={openSections[key]}
          aria-controls={panelId}
          className="w-full flex items-center justify-between px-4 py-3 text-left cursor-pointer rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white/60"
        >
          <span className={`text-sm font-semibold ${s.sectionTitle}`}>{t(titleKey)}</span>
          <ChevronDownIcon
            className={`h-5 w-5 transition-transform duration-200 ${s.chevron} ${
              openSections[key] ? 'rotate-180' : 'rotate-0'
            }`}
          />
        </button>
        <div id={panelId} role="region" aria-labelledby={buttonId} hidden={!openSections[key]}>
          {openSections[key] && body}
        </div>
      </div>
    );
  };

  const choiceClass = (active: boolean) =>
    `${CHOICE_BASE} ${active ? s.choiceActive : s.choiceIdle}`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 animate-fade-in"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${baseId}-title`}
        className={`rounded-xl p-6 w-full max-w-md md:max-w-lg relative max-h-[90vh] overflow-y-auto focus:outline-none ${s.dialog}`}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label={t('settings.close')}
          title={t('settings.close')}
          className={`absolute top-4 right-4 p-1 rounded-lg cursor-pointer transition-colors focus:outline-none focus-visible:ring-2 ${s.iconBtn}`}
        >
          <XMarkIcon className="h-6 w-6" />
        </button>

        <h2 id={`${baseId}-title`} className={`text-xl font-bold mb-6 ${s.heading}`}>
          {t('settings.title')}
        </h2>

        <div className="space-y-4">
          {renderSection(
            'theme',
            'settings.theme',
            <div className="px-4 pb-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {(
                  [
                    { id: 'bloom', label: t('theme.bloom') },
                    { id: 'night', label: t('theme.night') },
                    { id: 'newyear', label: t('theme.newyear') },
                  ] as const
                ).map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setTheme(option.id)}
                    aria-pressed={option.id === theme}
                    className={`w-full text-left ${choiceClass(option.id === theme)} ${
                      option.id === 'night' ? 'bg-black/40' : 'bg-white/5'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium">{option.label}</span>
                      {option.id === theme && (
                        <span className={`text-sm tracking-normal ${s.selectedTag}`}>
                          {t('common.selected')}
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>

              <div className={`mt-4 pt-4 border-0 flex items-start gap-3 ${s.divider}`}>
                <input
                  type="checkbox"
                  id="enable-background-motion"
                  checked={enableBackgroundMotion}
                  onChange={(e) => setEnableBackgroundMotion(e.target.checked)}
                  className={`mt-1 w-4 h-4 rounded cursor-pointer focus:outline-none focus-visible:ring-2 ${s.checkbox}`}
                />
                <div className="flex-1">
                  <label
                    htmlFor="enable-background-motion"
                    className={`block text-sm font-medium mb-1 cursor-pointer ${s.label}`}
                  >
                    {t('settings.motion.enable')}
                  </label>
                  <p className={`text-sm ${s.hint}`}>{t('settings.motion.enable_desc')}</p>
                </div>
              </div>
            </div>,
          )}

          {renderSection(
            'language',
            'settings.language',
            <div className="px-4 pb-4">
              <div className="flex gap-3">
                {(
                  [
                    { id: 'en', label: t('settings.language.en') },
                    { id: 'zh-TW', label: t('settings.language.zh') },
                  ] as const
                ).map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setLanguage(option.id)}
                    aria-pressed={language === option.id}
                    className={`flex-1 text-sm font-medium ${choiceClass(language === option.id)}`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>,
          )}

          {renderSection(
            'model',
            'settings.provider_section',
            <div className="px-4 pb-4 space-y-4">
              <div>
                <label
                  htmlFor={`${baseId}-provider`}
                  className={`block text-sm font-medium mb-2 ${s.label}`}
                >
                  {t('settings.provider')}
                </label>
                <select
                  id={`${baseId}-provider`}
                  value={imageProvider}
                  onChange={(e) => setImageProvider(e.target.value as ImageProviderId)}
                  className={`${FIELD_BASE} cursor-pointer ${s.field}`}
                >
                  <option value="gemini">{t('settings.provider.gemini')}</option>
                  <option value="openrouter">{t('settings.provider.openrouter')}</option>
                  <option value="demo">{t('settings.provider.demo')}</option>
                </select>
                <p className={`text-sm mt-2 ${s.hint}`}>
                  {isDemo ? t('settings.provider_desc_demo') : t('settings.provider_desc')}
                </p>
              </div>

              {isDemo ? (
                <p className={`text-sm ${s.hint}`}>{t('settings.demo_note')}</p>
              ) : isGemini ? (
                <>
                  <div>
                    <label
                      htmlFor={`${baseId}-model`}
                      className={`block text-sm font-medium mb-2 ${s.label}`}
                    >
                      {t('settings.model')}
                    </label>
                    <select
                      id={`${baseId}-model`}
                      value={model}
                      onChange={(e) => setModel(e.target.value as ModelType)}
                      className={`${FIELD_BASE} cursor-pointer ${s.field}`}
                    >
                      {SUPPORTED_MODELS.map((modelId) => (
                        <option key={modelId} value={modelId}>
                          {t(MODEL_LABEL_KEYS[modelId])}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor={`${baseId}-api-key`}
                      className={`block text-sm font-medium mb-2 ${s.label}`}
                    >
                      {t('settings.api_key')}
                    </label>
                    <div className="relative">
                      <input
                        id={`${baseId}-api-key`}
                        type={showApiKey ? 'text' : 'password'}
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        placeholder={t('settings.api_key_placeholder')}
                        autoComplete="off"
                        spellCheck={false}
                        className={`${FIELD_BASE} pr-20 ${s.field}`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowApiKey((prev) => !prev)}
                        aria-pressed={showApiKey}
                        className={`absolute inset-y-0 right-2 my-auto h-7 px-2 rounded-md text-sm font-medium cursor-pointer transition-colors focus:outline-none focus-visible:ring-2 ${s.iconBtn}`}
                      >
                        {showApiKey ? t('settings.api_key_hide') : t('settings.api_key_show')}
                      </button>
                    </div>
                    <p className={`text-sm mt-2 ${s.hint}`}>{t('settings.api_key_desc')}</p>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label
                      htmlFor={`${baseId}-or-model`}
                      className={`block text-sm font-medium mb-2 ${s.label}`}
                    >
                      {t('settings.openrouter.model')}
                    </label>
                    <select
                      id={`${baseId}-or-model`}
                      value={openRouterModel}
                      onChange={(e) => setOpenRouterModel(e.target.value as OpenRouterModel)}
                      className={`${FIELD_BASE} cursor-pointer ${s.field}`}
                    >
                      {OPENROUTER_IMAGE_MODELS.map((modelId) => (
                        <option key={modelId} value={modelId}>
                          {t(OPENROUTER_MODEL_LABEL_KEYS[modelId])}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor={`${baseId}-or-api-key`}
                      className={`block text-sm font-medium mb-2 ${s.label}`}
                    >
                      {t('settings.openrouter.api_key')}
                    </label>
                    <div className="relative">
                      <input
                        id={`${baseId}-or-api-key`}
                        type={showApiKey ? 'text' : 'password'}
                        value={openRouterApiKey}
                        onChange={(e) => setOpenRouterApiKey(e.target.value)}
                        placeholder={t('settings.openrouter.api_key_placeholder')}
                        autoComplete="off"
                        spellCheck={false}
                        className={`${FIELD_BASE} pr-20 ${s.field}`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowApiKey((prev) => !prev)}
                        aria-pressed={showApiKey}
                        className={`absolute inset-y-0 right-2 my-auto h-7 px-2 rounded-md text-sm font-medium cursor-pointer transition-colors focus:outline-none focus-visible:ring-2 ${s.iconBtn}`}
                      >
                        {showApiKey ? t('settings.api_key_hide') : t('settings.api_key_show')}
                      </button>
                    </div>
                    <p className={`text-sm mt-2 ${s.hint}`}>
                      {t('settings.openrouter.api_key_desc')}
                    </p>
                  </div>

                  <p className={`text-sm ${s.hint}`}>{t('settings.openrouter.gemini_only_note')}</p>
                </>
              )}
            </div>,
          )}

          {renderSection(
            'compression',
            'settings.compression',
            <div className="px-4 pb-4 space-y-4">
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="enable-compression"
                  checked={enableImageCompression}
                  onChange={(e) => setEnableImageCompression(e.target.checked)}
                  className={`mt-1 w-4 h-4 rounded cursor-pointer focus:outline-none focus-visible:ring-2 ${s.checkbox}`}
                />
                <div className="flex-1">
                  <label
                    htmlFor="enable-compression"
                    className={`block text-sm font-medium mb-1 cursor-pointer ${s.label}`}
                  >
                    {t('settings.compression.enable')}
                  </label>
                  <p className={`text-sm ${s.hint}`}>{t('settings.compression.enable_desc')}</p>
                </div>
              </div>

              {enableImageCompression && (
                <div>
                  <label
                    htmlFor={`${baseId}-threshold`}
                    className={`block text-sm font-medium mb-2 ${s.label}`}
                  >
                    {t('settings.compression.threshold')}
                  </label>
                  <input
                    id={`${baseId}-threshold`}
                    type="number"
                    min="1"
                    max="50"
                    step="0.5"
                    value={compressionThresholdMB}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value);
                      if (!isNaN(value) && value > 0) {
                        setCompressionThresholdMB(value);
                      }
                    }}
                    className={`${FIELD_BASE} ${s.field}`}
                  />
                  <p className={`text-sm mt-2 ${s.hint}`}>
                    {t('settings.compression.threshold_desc')}
                  </p>
                </div>
              )}
            </div>,
          )}

          {renderSection(
            'spend',
            'settings.spend',
            <div className="px-4 pb-4 space-y-3">
              <p className={`text-sm ${s.label}`}>
                {t('settings.spend_total', { amount: formatUsd(sessionSpend) })}
              </p>
              <p className={`text-sm ${s.hint}`}>
                {t('settings.spend_desc', { date: IMAGE_PRICING_LAST_UPDATED })}
              </p>
              <button
                type="button"
                onClick={() => {
                  resetSessionSpendUsd();
                  notifySessionSpendChanged();
                  setSessionSpend(0);
                }}
                className={`text-sm font-medium px-3 py-2 rounded-lg border cursor-pointer focus:outline-none focus-visible:ring-2 ${s.choiceIdle}`}
              >
                {t('settings.spend_reset')}
              </button>
            </div>,
          )}
        </div>

        {/* Settings persist as soon as they change, so a single dismiss action is
            honest here — a "Cancel" button that discarded nothing was misleading. */}
        <div className="mt-8 flex items-center justify-between gap-3">
          <p className={`text-sm ${s.hint}`}>{t('settings.autosave_hint')}</p>
          <button
            type="button"
            onClick={onClose}
            className={`px-4 py-2 rounded-lg transition-colors font-medium cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent ${s.confirm}`}
          >
            {t('settings.done')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
