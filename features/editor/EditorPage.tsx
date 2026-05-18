/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { ROUTES } from '../../constants/routes';
import ReactCrop, { type Crop, type PixelCrop } from 'react-image-crop';
import {
  generateEditedImage,
  generateFilteredImage,
  generateAdjustedImage,
} from '../../services/geminiService';
import Spinner from '../../components/Spinner';
import FilterPanel from '../../components/FilterPanel';
import AdjustmentPanel from '../../components/AdjustmentPanel';
import CropPanel from '../../components/CropPanel';
import { UndoIcon, RedoIcon, EyeIcon } from '../../components/icons';
import { ErrorDisplay } from '../../components/ErrorDisplay';
import { formatApiErrorMessage } from '../../services/gemini/shared';
import { dataURLtoFile } from '../../utils/fileUtils';
import { logger } from '../../utils/logger';
import { getEditorThemeClasses } from '../../utils/themeUtils';
import { useLanguage } from '../../contexts/LanguageContext';
import { useSettings } from '../../contexts/SettingsContext';
import { useTheme } from '../../contexts/ThemeContext';

export type EditorLocationState = {
  initialFile?: File;
};

type Tab = 'retouch' | 'adjust' | 'filters' | 'crop';

const EditorPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const initialFile = (location.state as EditorLocationState | null)?.initialFile;

  useEffect(() => {
    if (initialFile) {
      navigate(location.pathname, { replace: true, state: null });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- consume router state once on mount
  }, []);
  const { t } = useLanguage();
  const settings = useSettings();
  const { theme } = useTheme();
  const editorTheme = getEditorThemeClasses(theme);
  const [history, setHistory] = useState<File[]>(() => (initialFile ? [initialFile] : []));
  const [historyIndex, setHistoryIndex] = useState<number>(() => (initialFile ? 0 : -1));
  const [prompt, setPrompt] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [editHotspot, setEditHotspot] = useState<{ x: number; y: number } | null>(null);
  const [displayHotspot, setDisplayHotspot] = useState<{ x: number; y: number } | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('retouch');

  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [aspect, setAspect] = useState<number | undefined>();
  const [isComparing, setIsComparing] = useState<boolean>(false);
  const imgRef = useRef<HTMLImageElement>(null);

  const currentImage = history[historyIndex] ?? null;
  const originalImage = history[0] ?? null;

  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);
  const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null);

  // Effect to create and revoke object URLs safely for the current image
  useEffect(() => {
    if (currentImage) {
      const url = URL.createObjectURL(currentImage);
      setCurrentImageUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setCurrentImageUrl(null);
    }
  }, [currentImage]);

  // Effect to create and revoke object URLs safely for the original image
  useEffect(() => {
    if (originalImage) {
      const url = URL.createObjectURL(originalImage);
      setOriginalImageUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setOriginalImageUrl(null);
    }
  }, [originalImage]);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  const addImageToHistory = useCallback(
    (newImageFile: File) => {
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push(newImageFile);
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
      // Reset transient states after an action
      setCrop(undefined);
      setCompletedCrop(undefined);
    },
    [history, historyIndex],
  );

  const handleDownload = useCallback(() => {
    if (currentImage) {
      const link = document.createElement('a');
      link.href = URL.createObjectURL(currentImage);
      link.download = `edited-${currentImage.name}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
    }
  }, [currentImage]);

  const handleImageClick = useCallback(
    (e: React.MouseEvent<HTMLImageElement>) => {
      if (activeTab !== 'retouch') return;

      const img = e.currentTarget;
      const rect = img.getBoundingClientRect();

      const offsetX = e.clientX - rect.left;
      const offsetY = e.clientY - rect.top;

      setDisplayHotspot({ x: offsetX, y: offsetY });

      const { naturalWidth, naturalHeight, clientWidth, clientHeight } = img;
      const scaleX = naturalWidth / clientWidth;
      const scaleY = naturalHeight / clientHeight;

      const originalX = Math.round(offsetX * scaleX);
      const originalY = Math.round(offsetY * scaleY);

      setEditHotspot({ x: originalX, y: originalY });
    },
    [activeTab],
  );

  const renderEditor = () => {
    if (error) {
      return (
        <div className="text-center animate-fade-in bg-red-500/10 border border-red-500/20 p-8 rounded-lg max-w-2xl mx-auto flex flex-col items-center gap-4">
          <h2 className="text-2xl font-bold text-red-300">{t('main.error_title')}</h2>
          <ErrorDisplay message={error} className="text-md" />
          <button
            onClick={() => setError(null)}
            className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-6 rounded-lg text-md transition-colors"
          >
            {t('main.error_try_again')}
          </button>
        </div>
      );
    }

    const imageDisplay = (
      <div className="relative">
        {/* Base image is the original, always at the bottom */}
        {originalImageUrl && (
          <img
            key={originalImageUrl}
            src={originalImageUrl}
            alt="Original image"
            className="w-full h-auto object-contain max-h-[60vh] rounded-xl pointer-events-none"
          />
        )}
        {/* The current image is an overlay that fades in/out for comparison */}
        <img
          ref={imgRef}
          key={currentImageUrl ?? 'none'}
          src={currentImageUrl ?? undefined}
          alt="Current edited image"
          onClick={handleImageClick}
          className={`absolute top-0 left-0 w-full h-auto object-contain max-h-[60vh] rounded-xl transition-opacity duration-200 ease-in-out ${isComparing ? 'opacity-0' : 'opacity-100'} ${activeTab === 'retouch' ? 'cursor-crosshair' : 'cursor-default'}`}
        />
      </div>
    );

    // For ReactCrop, we need a single image element. We'll use the current one.
    const cropImageElement = (
      <img
        ref={imgRef}
        key={`crop-${currentImageUrl ?? 'none'}`}
        src={currentImageUrl ?? undefined}
        alt="Image to crop"
        className="w-full h-auto object-contain max-h-[60vh] rounded-xl"
      />
    );

    return (
      <div className="w-full max-w-4xl mx-auto flex flex-col items-center gap-6 animate-fade-in">
        <div className="relative w-full shadow-2xl rounded-xl overflow-hidden bg-black/20">
          {isLoading && (
            <div className="absolute inset-0 bg-black/70 z-30 flex flex-col items-center justify-center gap-4 animate-fade-in">
              <Spinner />
              <p className="text-gray-300">{t('main.loading')}</p>
            </div>
          )}

          {activeTab === 'crop' ? (
            <ReactCrop
              crop={crop}
              onChange={(c) => setCrop(c)}
              onComplete={(c) => setCompletedCrop(c)}
              aspect={aspect}
              className="max-h-[60vh]"
            >
              {cropImageElement}
            </ReactCrop>
          ) : (
            imageDisplay
          )}

          {displayHotspot && !isLoading && activeTab === 'retouch' && (
            <div
              className="absolute rounded-full w-6 h-6 bg-blue-500/50 border-2 border-white pointer-events-none -translate-x-1/2 -translate-y-1/2 z-10"
              style={{ left: `${displayHotspot.x}px`, top: `${displayHotspot.y}px` }}
            >
              <div className="absolute inset-0 rounded-full w-6 h-6 animate-ping bg-blue-400"></div>
            </div>
          )}
        </div>

        <div
          className={`w-full border rounded-lg p-2 flex items-center justify-center gap-2 backdrop-blur-sm transition-colors duration-300 ${editorTheme.tabContainer}`}
        >
          {(['retouch', 'crop', 'adjust', 'filters'] as Tab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`w-full capitalize font-semibold py-3 px-5 rounded-md transition-colors duration-200 text-base cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 ${activeTab === tab ? editorTheme.tabActive : editorTheme.tabInactive}`}
            >
              {t(`main.tab_${tab}`)}
            </button>
          ))}
        </div>

        <div className="w-full">
          {activeTab === 'retouch' && (
            <div className="flex flex-col items-center gap-4">
              <p className={`text-md ${editorTheme.retouchInstruction}`}>
                {editHotspot ? t('main.retouch_instr_ready') : t('main.retouch_instr_initial')}
              </p>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleGenerate();
                }}
                className="w-full flex items-center gap-2"
              >
                <input
                  type="text"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder={
                    editHotspot
                      ? t('main.retouch_placeholder_ready')
                      : t('main.retouch_placeholder_initial')
                  }
                  className={`flex-grow border rounded-lg p-5 text-lg focus:ring-2 focus:outline-none transition w-full disabled:cursor-not-allowed disabled:opacity-60 ${editorTheme.input}`}
                  disabled={isLoading || !editHotspot}
                />
                <button
                  type="submit"
                  className={`text-white font-bold py-5 px-8 text-lg rounded-lg transition-all duration-200 ease-in-out hover:-translate-y-px active:scale-95 active:shadow-inner disabled:shadow-none disabled:cursor-not-allowed disabled:transform-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 ${editorTheme.submitButton}`}
                  disabled={isLoading || !prompt.trim() || !editHotspot}
                >
                  {t('main.btn_generate')}
                </button>
              </form>
            </div>
          )}
          {activeTab === 'crop' && (
            <CropPanel
              onApplyCrop={handleApplyCrop}
              onSetAspect={setAspect}
              isLoading={isLoading}
              isCropping={!!completedCrop?.width && completedCrop.width > 0}
            />
          )}
          {activeTab === 'adjust' && (
            <AdjustmentPanel onApplyAdjustment={handleApplyAdjustment} isLoading={isLoading} />
          )}
          {activeTab === 'filters' && (
            <FilterPanel onApplyFilter={handleApplyFilter} isLoading={isLoading} />
          )}
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
          <button
            onClick={handleUndo}
            disabled={!canUndo}
            className="flex items-center justify-center text-center bg-white/10 border border-white/20 text-gray-200 font-semibold py-3 px-5 rounded-md transition-colors duration-200 ease-in-out hover:bg-white/20 hover:border-white/30 active:scale-95 text-base disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-white/5 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800"
            aria-label="Undo last action"
          >
            <UndoIcon className="w-5 h-5 mr-2" />
            {t('main.btn_undo')}
          </button>
          <button
            onClick={handleRedo}
            disabled={!canRedo}
            className="flex items-center justify-center text-center bg-white/10 border border-white/20 text-gray-200 font-semibold py-3 px-5 rounded-md transition-colors duration-200 ease-in-out hover:bg-white/20 hover:border-white/30 active:scale-95 text-base disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-white/5 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800"
            aria-label="Redo last action"
          >
            <RedoIcon className="w-5 h-5 mr-2" />
            {t('main.btn_redo')}
          </button>

          <div className="h-6 w-px bg-gray-600 mx-1 hidden sm:block"></div>

          {canUndo && (
            <button
              onMouseDown={() => setIsComparing(true)}
              onMouseUp={() => setIsComparing(false)}
              onMouseLeave={() => setIsComparing(false)}
              onTouchStart={() => setIsComparing(true)}
              onTouchEnd={() => setIsComparing(false)}
              className="flex items-center justify-center text-center bg-white/10 border border-white/20 text-gray-200 font-semibold py-3 px-5 rounded-md transition-colors duration-200 ease-in-out hover:bg-white/20 hover:border-white/30 active:scale-95 text-base cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800"
              aria-label="Press and hold to see original image"
            >
              <EyeIcon className="w-5 h-5 mr-2" />
              {t('main.btn_compare')}
            </button>
          )}

          <button
            onClick={handleReset}
            disabled={!canUndo}
            className="text-center bg-transparent border border-white/20 text-gray-200 font-semibold py-3 px-5 rounded-md transition-colors duration-200 ease-in-out hover:bg-white/10 hover:border-white/30 active:scale-95 text-base disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-transparent cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800"
          >
            {t('main.btn_reset')}
          </button>
          <button
            onClick={handleUploadNew}
            className="text-center bg-white/10 border border-white/20 text-gray-200 font-semibold py-3 px-5 rounded-md transition-colors duration-200 ease-in-out hover:bg-white/20 hover:border-white/30 active:scale-95 text-base cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800"
          >
            {t('main.btn_start_over')}
          </button>

          <button
            onClick={handleDownload}
            className="flex-grow sm:flex-grow-0 ml-auto bg-gradient-to-br from-green-600 to-green-500 text-white font-bold py-3 px-5 rounded-md transition-all duration-200 ease-in-out shadow-lg shadow-green-500/20 hover:shadow-xl hover:shadow-green-500/40 hover:-translate-y-px active:scale-95 active:shadow-inner text-base cursor-pointer focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-gray-800"
          >
            {t('main.btn_download')}
          </button>
        </div>
      </div>
    );
  };

  if (!currentImage) {
    return <Navigate to={ROUTES.HOME} replace />;
  }

  return renderEditor();
};

export default EditorPage;
