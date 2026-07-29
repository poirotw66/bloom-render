/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useId, useState } from 'react';
import { useSettings } from '../contexts/SettingsContext';
import { MODEL_LABEL_KEYS, SUPPORTED_MODELS, type ModelType } from '../constants/models';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme, type ThemeType } from '../contexts/ThemeContext';
import { useDialog } from '../hooks/useDialog';
import { ChevronDownIcon, XMarkIcon } from './icons';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/** Theme-derived class snippets, so markup below stays readable. */
const themeStyles = {
  bloom: {
    dialog: 'bg-gray-800 border border-fuchsia-500/30',
    section: 'border-fuchsia-500/20 bg-gray-900/40',
    divider: 'border-fuchsia-500/20',
    heading: 'text-white',
    sectionTitle: 'text-white',
    chevron: 'text-gray-200',
    iconBtn: 'text-gray-400 hover:text-white focus-visible:ring-fuchsia-500',
    choiceActive: 'border-fuchsia-400 text-white focus-visible:ring-fuchsia-400',
    choiceIdle:
      'border-gray-700 text-gray-200 hover:border-fuchsia-300/60 hover:text-white focus-visible:ring-fuchsia-400',
    selectedTag: 'text-cyan-300',
    label: 'text-gray-300',
    hint: 'text-gray-500',
    field:
      'bg-gray-900 border-gray-600 text-white placeholder-gray-500 focus-visible:ring-fuchsia-500',
    checkbox: 'text-fuchsia-600 bg-gray-900 border-gray-600 focus-visible:ring-fuchsia-500',
    confirm: 'bg-fuchsia-600 hover:bg-fuchsia-500 text-white focus-visible:ring-fuchsia-400',
  },
  night: {
    dialog: 'bg-gray-800 border border-gray-700',
    section: 'border-gray-700 bg-gray-900/40',
    divider: 'border-gray-700',
    heading: 'text-white',
    sectionTitle: 'text-white',
    chevron: 'text-gray-200',
    iconBtn: 'text-gray-400 hover:text-white focus-visible:ring-blue-500',
    choiceActive: 'border-cyan-400 text-white focus-visible:ring-cyan-400',
    choiceIdle:
      'border-gray-700 text-gray-200 hover:border-cyan-300/60 hover:text-white focus-visible:ring-cyan-400',
    selectedTag: 'text-cyan-300',
    label: 'text-gray-300',
    hint: 'text-gray-500',
    field:
      'bg-gray-900 border-gray-600 text-white placeholder-gray-500 focus-visible:ring-blue-500',
    checkbox: 'text-blue-600 bg-gray-900 border-gray-600 focus-visible:ring-blue-500',
    confirm: 'bg-blue-600 hover:bg-blue-500 text-white focus-visible:ring-blue-400',
  },
  newyear: {
    dialog: 'bg-red-900/90 border border-red-700/50',
    section: 'border-red-700/60 bg-red-900/30',
    divider: 'border-red-700/50',
    heading: 'text-red-50',
    sectionTitle: 'text-red-50',
    chevron: 'text-yellow-200',
    iconBtn: 'text-red-400 hover:text-red-100 focus-visible:ring-red-500',
    choiceActive: 'border-yellow-400/80 text-yellow-200 focus-visible:ring-yellow-400',
    choiceIdle:
      'border-red-700/50 text-red-100 hover:border-yellow-300/60 hover:text-yellow-200 focus-visible:ring-yellow-400',
    selectedTag: 'text-yellow-300',
    label: 'text-red-200',
    hint: 'text-red-300',
    field:
      'bg-red-900/50 border-red-700/50 text-red-50 placeholder-red-300 focus-visible:ring-red-500',
    checkbox: 'text-red-600 bg-red-900/50 border-red-700 focus-visible:ring-red-500',
    confirm: 'bg-red-600 hover:bg-red-500 text-white focus-visible:ring-red-400',
  },
} as const satisfies Record<ThemeType, Record<string, string>>;

const FIELD_BASE =
  'w-full border rounded-lg p-3 focus:outline-none focus-visible:ring-2 transition-colors';
const CHOICE_BASE =
  'rounded-lg border px-3 py-2 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-offset-black cursor-pointer';

type SectionKey = 'theme' | 'language' | 'model' | 'compression';

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const {
    apiKey,
    setApiKey,
    model,
    setModel,
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
    model: false,
    compression: false,
  });
  const [showApiKey, setShowApiKey] = useState(false);

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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
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
        className={`rounded-xl p-6 w-full max-w-md md:max-w-lg shadow-2xl relative max-h-[90vh] overflow-y-auto focus:outline-none ${s.dialog}`}
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
                        <span className={`text-xs uppercase tracking-wide ${s.selectedTag}`}>
                          {t('common.selected')}
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>

              <div className={`mt-4 pt-4 border-t flex items-start gap-3 ${s.divider}`}>
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
                  <p className={`text-xs ${s.hint}`}>{t('settings.motion.enable_desc')}</p>
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
            'settings.model',
            <div className="px-4 pb-4 space-y-4">
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
                    className={`absolute inset-y-0 right-2 my-auto h-7 px-2 rounded-md text-xs font-medium cursor-pointer transition-colors focus:outline-none focus-visible:ring-2 ${s.iconBtn}`}
                  >
                    {showApiKey ? t('settings.api_key_hide') : t('settings.api_key_show')}
                  </button>
                </div>
                <p className={`text-xs mt-2 ${s.hint}`}>{t('settings.api_key_desc')}</p>
              </div>
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
                  <p className={`text-xs ${s.hint}`}>{t('settings.compression.enable_desc')}</p>
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
                  <p className={`text-xs mt-2 ${s.hint}`}>
                    {t('settings.compression.threshold_desc')}
                  </p>
                </div>
              )}
            </div>,
          )}
        </div>

        {/* Settings persist as soon as they change, so a single dismiss action is
            honest here — a "Cancel" button that discarded nothing was misleading. */}
        <div className="mt-8 flex items-center justify-between gap-3">
          <p className={`text-xs ${s.hint}`}>{t('settings.autosave_hint')}</p>
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
