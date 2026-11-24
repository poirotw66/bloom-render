/**
 * @license
 * SPDX-License-Identifier: MIT
 */

import React, { Suspense, lazy, useCallback, useRef, useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useSettings } from '../contexts/SettingsContext';
import { useTheme } from '../contexts/ThemeContext';
import { usePasteImage } from '../hooks/usePasteImage';
import { demoAssetsForFeature } from '../services/imageProviders/demoCatalog';
import { fetchPublicImageAsFile } from '../services/imageProviders/demoProvider';
import { applyValidatedImageFile } from '../utils/applyValidatedImageFile';
import { UI_PAGE, getPageSurface } from '../utils/uiClasses';
import { ErrorDisplay } from './ErrorDisplay';
import ExampleShowcase from './ExampleShowcase';
import HomeGallery from './HomeGallery';
import { UploadIcon } from './icons';
import StartScreenIntro from './StartScreenIntro';
import { themeStyles } from './startScreenStyles';

const ViralTemplatesSection = lazy(() => import('./ViralTemplatesSection'));

export default function UploadStartScreen({
  active = true,
  onImageSelected,
}: {
  active?: boolean;
  onImageSelected: (file: File) => void;
}) {
  const { t } = useLanguage();
  const settings = useSettings();
  const { theme } = useTheme();
  const s = themeStyles[theme];
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const uploadZoneRef = useRef<HTMLDivElement>(null);
  const pickUploadFile = useCallback(
    (file: File) => {
      void applyValidatedImageFile(file, t, onImageSelected, setError);
    },
    [onImageSelected, t],
  );
  usePasteImage(uploadZoneRef, pickUploadFile, { enabled: active && !settings.isDemoMode });
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) pickUploadFile(file);
  };
  if (!active) return null;
  return (
    <div
      className={`${UI_PAGE} ${getPageSurface(theme)} ${isDraggingOver ? s.drag : ''}`}
      onDragOver={(event) => {
        event.preventDefault();
        setIsDraggingOver(true);
      }}
      onDragLeave={() => setIsDraggingOver(false)}
      onDrop={(event) => {
        event.preventDefault();
        setIsDraggingOver(false);
        const file = event.dataTransfer.files?.[0];
        if (file) pickUploadFile(file);
      }}
    >
      <div className="flex flex-col items-center gap-8 max-[640px]:gap-3 animate-fade-in">
        <StartScreenIntro showHero />
        <Suspense fallback={null}>
          <ViralTemplatesSection className="mt-6 sm:mt-8 w-full max-w-6xl" />
        </Suspense>
        <HomeGallery className="mt-8 sm:mt-10 w-full max-w-6xl" />
        <div className="flex flex-col items-center gap-4 w-full animate-fade-in">
          <h2 className="text-lg font-bold text-gray-200">{t('gallery.start_editing')}</h2>
          <div
            ref={uploadZoneRef}
            tabIndex={settings.isDemoMode ? undefined : 0}
            role="group"
            aria-label={t('start.upload_drag')}
            className={`p-12 border-2 border-dashed rounded-2xl bg-gray-800/50 w-full max-w-2xl flex flex-col items-center justify-center gap-4 transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-800 ${s.border}`}
          >
            {settings.isDemoMode ? (
              <>
                <button
                  type="button"
                  onClick={() => {
                    const before = demoAssetsForFeature('editor').before;
                    if (!before) return;
                    void fetchPublicImageAsFile(before, 'demo-editor-sample.webp').then(
                      onImageSelected,
                    );
                  }}
                  className={`relative inline-flex items-center justify-center px-10 py-5 text-xl font-bold text-white rounded-xl cursor-pointer group hover:opacity-95 transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-800 ${s.btn}`}
                >
                  <UploadIcon className="w-6 h-6 mr-3" />
                  {t('demo.open_editor_sample')}
                </button>
                <p className="text-sm text-sky-200/80 text-center max-w-sm">
                  {t('demo.sample_only_hint')}
                </p>
              </>
            ) : (
              <>
                <label
                  htmlFor="image-upload-start"
                  className={`relative inline-flex items-center justify-center px-10 py-5 text-xl font-bold text-white rounded-xl cursor-pointer group hover:opacity-95 transition-colors duration-200 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-offset-gray-800 ${s.btn}`}
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
              </>
            )}
          </div>
        </div>
        <div className="max-[640px]:hidden">
          <ExampleShowcase feature="editor" />
        </div>
        <section
          className="mt-16 w-full max-w-3xl mx-auto text-left animate-fade-in"
          aria-label={`${t('start.feature_retouch_title')}, ${t('start.feature_filter_title')}, ${t('start.feature_adjust_title')}`}
        >
          <ul className="grid grid-cols-1 md:grid-cols-3 gap-x-10 gap-y-8 list-none p-0 m-0">
            <li>
              <p className={`text-base font-semibold ${s.cardIconText}`}>
                {t('start.feature_retouch_title')}
              </p>
              <p className="mt-2 text-base text-gray-300 leading-relaxed">
                {t('start.feature_retouch_desc')}
              </p>
            </li>
            <li>
              <p className={`text-base font-semibold ${s.cardIconText}`}>
                {t('start.feature_filter_title')}
              </p>
              <p className="mt-2 text-base text-gray-300 leading-relaxed">
                {t('start.feature_filter_desc')}
              </p>
            </li>
            <li>
              <p className={`text-base font-semibold ${s.cardIconText}`}>
                {t('start.feature_adjust_title')}
              </p>
              <p className="mt-2 text-base text-gray-300 leading-relaxed">
                {t('start.feature_adjust_desc')}
              </p>
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
}
