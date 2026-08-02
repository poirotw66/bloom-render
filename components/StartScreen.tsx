/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  UploadIcon,
  MagicWandIcon,
  PaletteIcon,
  SunIcon,
  BullseyeIcon,
  DownloadIcon,
  EditIcon,
} from './icons';
import { generateImageFromText } from '../services/geminiService';
import { formatApiErrorMessage } from '../services/gemini/shared';
import { logger } from '../utils/logger';
import { dataURLtoFile } from '../utils/fileUtils';
import { downloadBatchWithZipFallback } from '../utils/downloadHelpers';
import BloomFlowerLoader from './BloomFlowerLoader';
import { ErrorDisplay } from './ErrorDisplay';
import SavedPromptsBar from './SavedPromptsBar';
import ApiKeyNotice from './ApiKeyNotice';
import { useLanguage } from '../contexts/LanguageContext';
import { useSettings } from '../contexts/SettingsContext';
import { useTheme } from '../contexts/ThemeContext';
import type { ThemeType } from '../contexts/ThemeContext';
import { applyValidatedImageFile } from '../utils/applyValidatedImageFile';
import {
  UI_BTN_GHOST,
  UI_BTN_PRIMARY,
  UI_BTN_SECONDARY,
  UI_BTN_SUCCESS,
  UI_PAGE,
  UI_SUBTITLE,
  UI_TITLE,
  getPageSurface,
} from '../utils/uiClasses';

type StartTab = 'upload' | 'generate';

/** Shared shape for the aspect-ratio / image-count segmented controls. */
const OPTION_BTN =
  'px-5 py-2.5 rounded-lg text-sm font-medium transition-colors duration-200 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-800 disabled:cursor-not-allowed disabled:opacity-50';

interface StartScreenProps {
  tab: StartTab;
  onImageSelected: (file: File) => void;
  navigate: (path: string) => void;
}

/** Theme-based class snippets for StartScreen (bloom / night / newyear) */
const themeStyles = {
  bloom: {
    drag: 'bg-fuchsia-500/10 border-dashed border-fuchsia-400',
    slogan: 'text-fuchsia-300/95',
    border: 'border-fuchsia-500/30 hover:border-fuchsia-400/50',
    borderCard: 'border-fuchsia-500/20',
    btn: 'from-fuchsia-600 via-pink-500 to-rose-500 shadow-fuchsia-500/25 focus-within:ring-fuchsia-400',
    btnSecondary: 'from-fuchsia-600 to-pink-500 border-fuchsia-500/50',
    inputFocus: 'focus-visible:ring-fuchsia-500 focus:border-fuchsia-500/50',
    cardIcon: 'from-fuchsia-500/30 to-pink-500/30 border-fuchsia-400/30',
    cardIconText: 'text-fuchsia-300',
    generateBtn:
      'from-fuchsia-600 to-pink-500 shadow-fuchsia-500/20 hover:shadow-fuchsia-500/40 focus-visible:ring-fuchsia-500',
    titleGradient: 'from-amber-300 via-pink-400 to-fuchsia-400',
  },
  night: {
    drag: 'bg-blue-500/10 border-dashed border-blue-400',
    slogan: 'text-slate-300',
    border: 'border-blue-500/30 hover:border-blue-400/50',
    borderCard: 'border-slate-600/50',
    btn: 'from-blue-600 to-cyan-500 shadow-blue-500/25 focus-within:ring-blue-400',
    btnSecondary: 'from-blue-600 to-cyan-500 border-blue-500/50',
    inputFocus: 'focus-visible:ring-blue-500 focus:border-blue-500/50',
    cardIcon: 'from-blue-500/30 to-cyan-500/30 border-blue-400/30',
    cardIconText: 'text-cyan-300',
    generateBtn:
      'from-blue-600 to-blue-500 shadow-blue-500/20 hover:shadow-blue-500/40 focus-visible:ring-blue-500',
    titleGradient: 'from-slate-200 via-blue-300 to-cyan-300',
  },
  newyear: {
    drag: 'bg-red-500/10 border-dashed border-red-400',
    slogan: 'text-red-200',
    border: 'border-red-500/30 hover:border-red-400/50',
    borderCard: 'border-red-700/50',
    btn: 'from-red-600 to-amber-500 shadow-red-500/25 focus-within:ring-red-400',
    btnSecondary: 'from-red-600 to-amber-500 border-red-500/50',
    inputFocus: 'focus-visible:ring-red-500 focus:border-red-500/50',
    cardIcon: 'from-red-500/30 to-amber-500/30 border-red-400/30',
    cardIconText: 'text-amber-300',
    generateBtn:
      'from-red-600 to-red-500 shadow-red-500/20 hover:shadow-red-500/40 focus-visible:ring-red-500',
    titleGradient: 'from-red-200 via-amber-300 to-yellow-400',
  },
} as const satisfies Record<ThemeType, Record<string, string>>;

const StartScreen: React.FC<StartScreenProps> = ({ tab, onImageSelected, navigate: _navigate }) => {
  const { t } = useLanguage();
  const settings = useSettings();
  const { theme } = useTheme();
  const s = themeStyles[theme];
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [generationPrompt, setGenerationPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState<'1:1' | '3:4' | '4:3' | '16:9' | '9:16'>('1:1');
  const [numberOfImages, setNumberOfImages] = useState<number>(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);

  const pickUploadFile = (file: File) => {
    void applyValidatedImageFile(file, t, onImageSelected, setError);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      pickUploadFile(e.target.files[0]);
    }
  };

  const handleGenerateClick = async () => {
    if (!generationPrompt.trim()) {
      setError(t('start.error_no_prompt'));
      return;
    }

    setIsGenerating(true);
    setError(null);
    setGeneratedImages([]);

    try {
      const urls = await generateImageFromText(generationPrompt, aspectRatio, numberOfImages, {
        apiKey: settings.apiKey,
        model: settings.model,
      });
      if (urls.length === 1) {
        // If only one image, proceed directly to editing
        const newFile = dataURLtoFile(urls[0], `generated-${Date.now()}.png`);
        onImageSelected(newFile);
      } else {
        // If multiple images, show selection screen
        setGeneratedImages(urls);
      }
    } catch (err) {
      setError(formatApiErrorMessage(err, t, 'generation'));
      logger.error('Text-to-image generation failed:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSelectGenerated = (url: string, index: number) => {
    const newFile = dataURLtoFile(url, `generated-${Date.now()}-${index}.png`);
    onImageSelected(newFile);
  };

  const handleDownloadOne = (dataUrl: string, index: number) => {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `generated-${index + 1}.png`;
    link.click();
  };

  const handleDownloadAllZip = async () => {
    await downloadBatchWithZipFallback({
      sources: generatedImages,
      itemFileName: (i) => `generated-${i + 1}.png`,
      zipFileName: `generated-images-${Date.now()}.zip`,
    });
  };

  return (
    <div
      className={`${UI_PAGE} ${getPageSurface(theme)} ${isDraggingOver && tab === 'upload' ? s.drag : ''}`}
      onDragOver={(e) => {
        if (tab === 'upload') {
          e.preventDefault();
          setIsDraggingOver(true);
        }
      }}
      onDragLeave={() => setIsDraggingOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDraggingOver(false);
        const file = e.dataTransfer.files?.[0];
        if (!file) return;
        if (tab === 'upload') {
          pickUploadFile(file);
        }
      }}
    >
      <div className="flex flex-col items-center gap-8 animate-fade-in">
        <img
          src={`${import.meta.env.BASE_URL}logo/bloomrender_bg.png`}
          alt=""
          className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 object-contain drop-shadow-lg"
          aria-hidden="true"
        />
        <h1 className={UI_TITLE}>
          {t('start.title_part1')}{' '}
          <span className={`bg-gradient-to-r ${s.titleGradient} bg-clip-text text-transparent`}>
            {t('start.title_part2')}
          </span>
          .
        </h1>
        <p className={`text-base md:text-lg ${s.slogan} font-medium italic mt-1`}>
          {t('app.slogan')}
        </p>
        <p className={UI_SUBTITLE}>{t('start.subtitle')}</p>

        <ApiKeyNotice />

        {tab === 'upload' ? (
          <div className="flex flex-col items-center gap-4 w-full animate-fade-in">
            <div
              className={`p-12 border-2 border-dashed rounded-2xl bg-gray-800/30 w-full max-w-2xl flex flex-col items-center justify-center gap-4 transition-colors duration-200 ${s.border}`}
            >
              <label
                htmlFor="image-upload-start"
                className={`relative inline-flex items-center justify-center px-10 py-5 text-xl font-bold text-white bg-gradient-to-r rounded-full cursor-pointer group hover:opacity-95 transition-all duration-200 shadow-lg focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-offset-gray-800 ${s.btn}`}
              >
                <UploadIcon className="w-6 h-6 mr-3 transition-transform duration-300 ease-in-out group-hover:rotate-[360deg] group-hover:scale-110" />
                {t('start.upload_button')}
              </label>
              <input
                id="image-upload-start"
                type="file"
                className="hidden"
                accept="image/*"
                onChange={handleFileChange}
                aria-label={t('start.upload_button')}
              />
              <p className="text-sm text-gray-300">{t('start.upload_drag')}</p>
              {error && <ErrorDisplay message={error} className="mt-2 w-full max-w-md" />}
            </div>
          </div>
        ) : generatedImages.length > 0 ? (
          <div
            className={`flex flex-col items-center gap-6 w-full max-w-4xl animate-fade-in bg-gray-800/40 p-6 rounded-2xl border backdrop-blur-sm shadow-lg ${s.borderCard}`}
          >
            <h3 className="text-xl font-bold text-white">{t('start.select_image')}</h3>
            <div className="flex flex-wrap items-center justify-center gap-3 w-full">
              {generatedImages.length > 1 && (
                <button type="button" onClick={handleDownloadAllZip} className={UI_BTN_SUCCESS}>
                  <DownloadIcon className="w-5 h-5" />
                  {t('start.download_all_zip')}
                </button>
              )}
              <button type="button" onClick={() => setGeneratedImages([])} className={UI_BTN_GHOST}>
                {t('start.generate_new')}
              </button>
            </div>
            <div
              className={`grid gap-4 w-full ${generatedImages.length >= 2 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`}
            >
              {generatedImages.map((url, idx) => (
                <article
                  key={idx}
                  className={`group rounded-xl overflow-hidden border transition-colors duration-200 shadow-lg bg-gray-900 ${
                    theme === 'newyear'
                      ? 'border-red-900/40 hover:border-red-400'
                      : theme === 'bloom'
                        ? 'border-fuchsia-900/40 hover:border-fuchsia-400'
                        : 'border-slate-700 hover:border-blue-400'
                  }`}
                >
                  <div className="aspect-square flex items-center justify-center bg-gray-950 p-3">
                    <img
                      src={url}
                      className="max-w-full max-h-full w-auto h-auto object-contain"
                      alt={`${t('start.select_image')} ${idx + 1}`}
                    />
                  </div>
                  <div className="p-3 flex flex-wrap items-center justify-between gap-3">
                    <span className="text-sm font-medium text-gray-300">
                      {t('start.select_image')} {idx + 1}
                    </span>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleSelectGenerated(url, idx)}
                        className={UI_BTN_PRIMARY}
                        aria-label={`${t('start.edit_this')} ${idx + 1}`}
                      >
                        <EditIcon className="w-4 h-4" />
                        {t('start.edit_this')}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDownloadOne(url, idx)}
                        className={UI_BTN_SECONDARY}
                        aria-label={t('start.download_image')}
                      >
                        <DownloadIcon className="w-4 h-4" />
                        {t('start.download_image')}
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        ) : (
          <div
            className={`flex flex-col items-center gap-6 w-full max-w-4xl animate-fade-in bg-gray-800/40 p-8 md:p-10 rounded-2xl border backdrop-blur-sm shadow-lg ${s.borderCard}`}
          >
            <textarea
              id="generate-prompt"
              value={generationPrompt}
              onChange={(e) => setGenerationPrompt(e.target.value)}
              placeholder={t('start.prompt_placeholder')}
              aria-label={t('start.prompt_placeholder')}
              className={`w-full h-40 md:h-44 bg-gray-900/50 border border-gray-600 rounded-xl p-5 text-gray-100 placeholder-gray-500 focus:outline-none focus-visible:ring-2 resize-none transition-colors duration-200 text-base ${s.inputFocus}`}
              disabled={isGenerating}
            />

            <SavedPromptsBar
              scope="generate"
              value={generationPrompt}
              onApply={setGenerationPrompt}
              disabled={isGenerating}
              className="w-full -mt-2"
            />

            <div className="w-full flex flex-col md:flex-row gap-6">
              <div className="flex-grow">
                <span
                  id="aspect-ratio-label"
                  className="block text-left text-sm font-medium text-gray-300 mb-3"
                >
                  {t('start.aspect_ratio')}
                </span>
                <div
                  className="flex flex-wrap gap-3"
                  role="group"
                  aria-labelledby="aspect-ratio-label"
                >
                  {(['1:1', '16:9', '9:16', '4:3', '3:4'] as const).map((ratio) => (
                    <button
                      key={ratio}
                      type="button"
                      onClick={() => setAspectRatio(ratio)}
                      disabled={isGenerating}
                      aria-pressed={aspectRatio === ratio}
                      className={`${OPTION_BTN} ${
                        aspectRatio === ratio
                          ? `border bg-gradient-to-r ${s.btnSecondary} text-white`
                          : 'bg-gray-800 text-gray-300 border border-gray-600 hover:bg-gray-700'
                      }`}
                    >
                      {ratio}
                    </button>
                  ))}
                </div>
              </div>
              <div className="w-full md:w-auto">
                <span
                  id="image-count-label"
                  className="block text-left text-sm font-medium text-gray-300 mb-3"
                >
                  {t('start.image_count')}
                </span>
                {/* A segmented control instead of a number field: the range is 1-4,
                    so there is nothing to type and no invalid state to recover from. */}
                <div
                  className="flex flex-wrap gap-3"
                  role="group"
                  aria-labelledby="image-count-label"
                >
                  {[1, 2, 3, 4].map((count) => (
                    <button
                      key={count}
                      type="button"
                      onClick={() => setNumberOfImages(count)}
                      disabled={isGenerating}
                      aria-pressed={numberOfImages === count}
                      className={`${OPTION_BTN} min-w-[3rem] ${
                        numberOfImages === count
                          ? `border bg-gradient-to-r ${s.btnSecondary} text-white`
                          : 'bg-gray-800 text-gray-300 border border-gray-600 hover:bg-gray-700'
                      }`}
                    >
                      {count}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {error && <ErrorDisplay message={error} className="mt-2" />}

            {settings.model === 'gemini-3-pro-image' && (
              <p className="text-xs text-gray-300">{t('start.generate_pro_slow_hint')}</p>
            )}

            <button
              type="button"
              onClick={handleGenerateClick}
              disabled={isGenerating || !generationPrompt.trim()}
              aria-busy={isGenerating}
              className={`w-full mt-2 bg-gradient-to-br text-white font-bold py-5 px-8 rounded-xl text-base transition-all duration-200 ease-in-out shadow-lg hover:-translate-y-px active:scale-95 active:shadow-inner disabled:from-gray-700 disabled:to-gray-600 disabled:shadow-none disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-800 ${s.generateBtn}`}
            >
              {isGenerating ? (
                <>
                  <BloomFlowerLoader size={24} className="shrink-0" /> {t('start.generating')}
                </>
              ) : (
                <>
                  <MagicWandIcon className="w-6 h-6" /> {t('start.generate_button')}
                </>
              )}
            </button>
          </div>
        )}

        {tab === 'upload' && (
          <div className="mt-16 w-full animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div
                className={`bg-gray-800/30 p-6 rounded-2xl border flex flex-col items-center text-center hover:bg-gray-800/50 transition-all duration-200 cursor-default ${s.borderCard}`}
              >
                <div
                  className={`flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br border mb-4 ${s.cardIcon}`}
                >
                  <BullseyeIcon className={`w-6 h-6 ${s.cardIconText}`} />
                </div>
                <h3 className="text-xl font-bold text-white">{t('start.feature_retouch_title')}</h3>
                <p className="mt-2 text-gray-300">{t('start.feature_retouch_desc')}</p>
              </div>
              <div
                className={`bg-gray-800/30 p-6 rounded-2xl border flex flex-col items-center text-center hover:bg-gray-800/50 transition-all duration-200 cursor-default ${s.borderCard}`}
              >
                <div
                  className={`flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br border mb-4 ${s.cardIcon}`}
                >
                  <PaletteIcon className={`w-6 h-6 ${s.cardIconText}`} />
                </div>
                <h3 className="text-xl font-bold text-white">{t('start.feature_filter_title')}</h3>
                <p className="mt-2 text-gray-300">{t('start.feature_filter_desc')}</p>
              </div>
              <div
                className={`bg-gray-800/30 p-6 rounded-2xl border flex flex-col items-center text-center hover:bg-gray-800/50 transition-all duration-200 cursor-default ${s.borderCard}`}
              >
                <div
                  className={`flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br border mb-4 ${s.cardIcon}`}
                >
                  <SunIcon className={`w-6 h-6 ${s.cardIconText}`} />
                </div>
                <h3 className="text-xl font-bold text-white">{t('start.feature_adjust_title')}</h3>
                <p className="mt-2 text-gray-300">{t('start.feature_adjust_desc')}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StartScreen;
