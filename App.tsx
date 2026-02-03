/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/


import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import ReactCrop, { type Crop, type PixelCrop } from 'react-image-crop';
import { generateEditedImage, generateFilteredImage, generateAdjustedImage } from './services/geminiService';
import Header from './components/Header';
import Spinner from './components/Spinner';
import FilterPanel from './components/FilterPanel';
import AdjustmentPanel from './components/AdjustmentPanel';
import CropPanel from './components/CropPanel';
import { UndoIcon, RedoIcon, EyeIcon } from './components/icons';
import StartScreen from './components/StartScreen';
import IdPhotoPage from './features/idphoto/IdPhotoPage';
import PortraitPage from './features/portrait/PortraitPage';
import TravelPage from './features/travel/TravelPage';
import PhotographyServicePage from './features/photography-service/PhotographyServicePage';
import { dataURLtoFile } from './utils/fileUtils';
import { useLanguage } from './contexts/LanguageContext';
import { useSettings } from './contexts/SettingsContext';
import { useTheme } from './contexts/ThemeContext';

type Tab = 'retouch' | 'adjust' | 'filters' | 'crop';

const App: React.FC = () => {
  const { t } = useLanguage();
  const settings = useSettings();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [history, setHistory] = useState<File[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [prompt, setPrompt] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [editHotspot, setEditHotspot] = useState<{ x: number, y: number } | null>(null);
  const [displayHotspot, setDisplayHotspot] = useState<{ x: number, y: number } | null>(null);
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

  const addImageToHistory = useCallback((newImageFile: File) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newImageFile);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    // Reset transient states after an action
    setCrop(undefined);
    setCompletedCrop(undefined);
  }, [history, historyIndex]);

  const handleImageUpload = useCallback((file: File) => {
    setError(null);
    setHistory([file]);
    setHistoryIndex(0);
    setEditHotspot(null);
    setDisplayHotspot(null);
    setActiveTab('retouch');
    setCrop(undefined);
    setCompletedCrop(undefined);
    navigate('/edit');
  }, [navigate]);

  const handleGenerate = useCallback(async () => {
    if (!currentImage) {
      setError(t('main.error_no_image_edit'));
      return;
    }

    if (!prompt.trim()) {
      setError(t('main.error_no_prompt_edit'));
      return;
    }

    if (!editHotspot) {
      setError(t('main.error_no_hotspot'));
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const editedImageUrl = await generateEditedImage(currentImage, prompt, editHotspot, { apiKey: settings.apiKey, model: settings.model });
      const newImageFile = dataURLtoFile(editedImageUrl, `edited-${Date.now()}.png`);
      addImageToHistory(newImageFile);
      setEditHotspot(null);
      setDisplayHotspot(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(`${t('main.error_failed_gen')} ${errorMessage}`);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [currentImage, prompt, editHotspot, addImageToHistory, t, settings]);

  const handleApplyFilter = useCallback(async (filterPrompt: string) => {
    if (!currentImage) {
      setError(t('main.error_no_image_filter'));
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const filteredImageUrl = await generateFilteredImage(currentImage, filterPrompt, { apiKey: settings.apiKey, model: settings.model });
      const newImageFile = dataURLtoFile(filteredImageUrl, `filtered-${Date.now()}.png`);
      addImageToHistory(newImageFile);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(`${t('main.error_failed_filter')} ${errorMessage}`);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [currentImage, addImageToHistory, t, settings]);

  const handleApplyAdjustment = useCallback(async (adjustmentPrompt: string) => {
    if (!currentImage) {
      setError(t('main.error_no_image_adjust'));
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const adjustedImageUrl = await generateAdjustedImage(currentImage, adjustmentPrompt, { apiKey: settings.apiKey, model: settings.model });
      const newImageFile = dataURLtoFile(adjustedImageUrl, `adjusted-${Date.now()}.png`);
      addImageToHistory(newImageFile);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(`${t('main.error_failed_adjust')} ${errorMessage}`);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [currentImage, addImageToHistory, t, settings]);

  const handleApplyCrop = useCallback(() => {
    if (!completedCrop || !imgRef.current) {
      setError(t('main.error_no_crop'));
      return;
    }

    const image = imgRef.current;
    const canvas = document.createElement('canvas');
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    canvas.width = completedCrop.width;
    canvas.height = completedCrop.height;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      setError(t('main.error_failed_crop'));
      return;
    }

    const pixelRatio = window.devicePixelRatio || 1;
    canvas.width = completedCrop.width * pixelRatio;
    canvas.height = completedCrop.height * pixelRatio;
    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    ctx.imageSmoothingQuality = 'high';

    ctx.drawImage(
      image,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      0,
      0,
      completedCrop.width,
      completedCrop.height,
    );

    const croppedImageUrl = canvas.toDataURL('image/png');
    const newImageFile = dataURLtoFile(croppedImageUrl, `cropped-${Date.now()}.png`);
    addImageToHistory(newImageFile);

  }, [completedCrop, addImageToHistory, t]);

  const handleUndo = useCallback(() => {
    if (canUndo) {
      setHistoryIndex(historyIndex - 1);
      setEditHotspot(null);
      setDisplayHotspot(null);
    }
  }, [canUndo, historyIndex]);

  const handleRedo = useCallback(() => {
    if (canRedo) {
      setHistoryIndex(historyIndex + 1);
      setEditHotspot(null);
      setDisplayHotspot(null);
    }
  }, [canRedo, historyIndex]);

  const handleReset = useCallback(() => {
    if (history.length > 0) {
      setHistoryIndex(0);
      setError(null);
      setEditHotspot(null);
      setDisplayHotspot(null);
    }
  }, [history]);

  const handleUploadNew = useCallback(() => {
    setHistory([]);
    setHistoryIndex(-1);
    setError(null);
    setPrompt('');
    setEditHotspot(null);
    setDisplayHotspot(null);
    navigate('/');
  }, [navigate]);

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

  const handleImageClick = (e: React.MouseEvent<HTMLImageElement>) => {
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
  };

  const renderEditor = () => {
    if (error) {
      return (
        <div className="text-center animate-fade-in bg-red-500/10 border border-red-500/20 p-8 rounded-lg max-w-2xl mx-auto flex flex-col items-center gap-4">
          <h2 className="text-2xl font-bold text-red-300">{t('main.error_title')}</h2>
          <p className="text-md text-red-400">{error}</p>
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
          key={currentImageUrl}
          src={currentImageUrl}
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
        key={`crop-${currentImageUrl}`}
        src={currentImageUrl}
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
              onChange={c => setCrop(c)}
              onComplete={c => setCompletedCrop(c)}
              aspect={aspect}
              className="max-h-[60vh]"
            >
              {cropImageElement}
            </ReactCrop>
          ) : imageDisplay}

          {displayHotspot && !isLoading && activeTab === 'retouch' && (
            <div
              className="absolute rounded-full w-6 h-6 bg-blue-500/50 border-2 border-white pointer-events-none -translate-x-1/2 -translate-y-1/2 z-10"
              style={{ left: `${displayHotspot.x}px`, top: `${displayHotspot.y}px` }}
            >
              <div className="absolute inset-0 rounded-full w-6 h-6 animate-ping bg-blue-400"></div>
            </div>
          )}
        </div>

        <div className={`w-full border rounded-lg p-2 flex items-center justify-center gap-2 backdrop-blur-sm transition-colors duration-300 ${theme === 'newyear'
            ? 'bg-red-900/30 border-red-700/50'
            : 'bg-gray-800/80 border-gray-700/80'
          }`}>
          {(['retouch', 'crop', 'adjust', 'filters'] as Tab[]).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`w-full capitalize font-semibold py-3 px-5 rounded-md transition-colors duration-200 text-base cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 ${activeTab === tab
                  ? theme === 'newyear'
                    ? 'bg-gradient-to-br from-red-500 to-yellow-400 text-white shadow-lg shadow-red-500/40 focus:ring-red-500'
                    : 'bg-gradient-to-br from-blue-500 to-cyan-400 text-white shadow-lg shadow-cyan-500/40 focus:ring-blue-500'
                  : theme === 'newyear'
                    ? 'text-red-200 hover:text-red-50 hover:bg-red-500/20 focus:ring-red-500'
                    : 'text-gray-300 hover:text-white hover:bg-white/10 focus:ring-blue-500'
                }`}
            >
              {t(`main.tab_${tab}`)}
            </button>
          ))}
        </div>

        <div className="w-full">
          {activeTab === 'retouch' && (
            <div className="flex flex-col items-center gap-4">
              <p className={`text-md ${theme === 'newyear' ? 'text-red-300' : 'text-gray-400'}`}>
                {editHotspot ? t('main.retouch_instr_ready') : t('main.retouch_instr_initial')}
              </p>
              <form onSubmit={(e) => { e.preventDefault(); handleGenerate(); }} className="w-full flex items-center gap-2">
                <input
                  type="text"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder={editHotspot ? t('main.retouch_placeholder_ready') : t('main.retouch_placeholder_initial')}
                  className={`flex-grow border rounded-lg p-5 text-lg focus:ring-2 focus:outline-none transition w-full disabled:cursor-not-allowed disabled:opacity-60 ${theme === 'newyear'
                      ? 'bg-red-900/30 border-red-700/50 text-red-50 placeholder-red-300 focus:ring-red-500'
                      : 'bg-gray-800 border-gray-700 text-gray-200 focus:ring-blue-500'
                    }`}
                  disabled={isLoading || !editHotspot}
                />
                <button
                  type="submit"
                  className={`text-white font-bold py-5 px-8 text-lg rounded-lg transition-all duration-200 ease-in-out hover:-translate-y-px active:scale-95 active:shadow-inner disabled:shadow-none disabled:cursor-not-allowed disabled:transform-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 ${theme === 'newyear'
                      ? 'bg-gradient-to-br from-red-600 to-red-500 shadow-lg shadow-red-500/20 hover:shadow-xl hover:shadow-red-500/40 disabled:from-red-800 disabled:to-red-700 focus:ring-red-500'
                      : 'bg-gradient-to-br from-blue-600 to-blue-500 shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/40 disabled:from-blue-800 disabled:to-blue-700 focus:ring-blue-500'
                    }`}
                  disabled={isLoading || !prompt.trim() || !editHotspot}
                >
                  {t('main.btn_generate')}
                </button>
              </form>
            </div>
          )}
          {activeTab === 'crop' && <CropPanel onApplyCrop={handleApplyCrop} onSetAspect={setAspect} isLoading={isLoading} isCropping={!!completedCrop?.width && completedCrop.width > 0} />}
          {activeTab === 'adjust' && <AdjustmentPanel onApplyAdjustment={handleApplyAdjustment} isLoading={isLoading} />}
          {activeTab === 'filters' && <FilterPanel onApplyFilter={handleApplyFilter} isLoading={isLoading} />}
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

  return (
    <div className="min-h-screen text-gray-100 flex flex-col">
      <Header />
      <main className={`flex-grow w-full max-w-[1600px] mx-auto p-4 md:p-8 flex justify-center ${currentImage ? 'items-start' : 'items-center'}`}>
        <Routes>
          <Route path="/" element={<StartScreen tab="upload" onImageSelected={handleImageUpload} navigate={navigate} />} />
          <Route path="/generate" element={<StartScreen tab="generate" onImageSelected={handleImageUpload} navigate={navigate} />} />
          <Route path="/idphoto" element={<IdPhotoPage onImageSelected={handleImageUpload} />} />
          <Route path="/portrait" element={<PortraitPage onImageSelected={handleImageUpload} />} />
          <Route path="/travel" element={<TravelPage onImageSelected={handleImageUpload} />} />
          <Route path="/photography-service" element={<PhotographyServicePage />} />
          <Route path="/edit" element={!currentImage ? <Navigate to="/" replace /> : renderEditor()} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
};

export default App;