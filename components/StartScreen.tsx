/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState } from 'react';
import { UploadIcon, MagicWandIcon, PaletteIcon, SunIcon, BullseyeIcon } from './icons';
import { generateImageFromText } from '../services/geminiService';
import { dataURLtoFile } from '../utils/fileUtils';
import BloomFlowerLoader from './BloomFlowerLoader';
import StartTabNav from './StartTabNav';
import { useLanguage } from '../contexts/LanguageContext';
import { useSettings } from '../contexts/SettingsContext';
import { useTheme } from '../contexts/ThemeContext';
import type { ThemeType } from '../contexts/ThemeContext';

type StartTab = 'upload' | 'generate';

/** Theme-based class snippets for StartScreen (bloom / night / newyear) */
const themeStyles = {
  bloom: {
    drag: 'bg-fuchsia-500/10 border-dashed border-fuchsia-400',
    slogan: 'text-fuchsia-300/95',
    border: 'border-fuchsia-500/30 hover:border-fuchsia-400/50',
    borderCard: 'border-fuchsia-500/20',
    btn: 'from-fuchsia-600 via-pink-500 to-rose-500 shadow-fuchsia-500/25 focus-within:ring-fuchsia-400',
    btnSecondary: 'from-fuchsia-600 to-pink-500 border-fuchsia-500/50',
    inputFocus: 'focus:ring-fuchsia-500 focus:border-fuchsia-500/50',
    cardIcon: 'from-fuchsia-500/30 to-pink-500/30 border-fuchsia-400/30',
    cardIconText: 'text-fuchsia-300',
    generateBtn: 'from-fuchsia-600 to-pink-500 shadow-fuchsia-500/20 hover:shadow-fuchsia-500/40 focus:ring-fuchsia-500',
    titleGradient: 'from-amber-300 via-pink-400 to-fuchsia-400',
  },
  night: {
    drag: 'bg-blue-500/10 border-dashed border-blue-400',
    slogan: 'text-slate-300',
    border: 'border-blue-500/30 hover:border-blue-400/50',
    borderCard: 'border-slate-600/50',
    btn: 'from-blue-600 to-cyan-500 shadow-blue-500/25 focus-within:ring-blue-400',
    btnSecondary: 'from-blue-600 to-cyan-500 border-blue-500/50',
    inputFocus: 'focus:ring-blue-500 focus:border-blue-500/50',
    cardIcon: 'from-blue-500/30 to-cyan-500/30 border-blue-400/30',
    cardIconText: 'text-cyan-300',
    generateBtn: 'from-blue-600 to-blue-500 shadow-blue-500/20 hover:shadow-blue-500/40 focus:ring-blue-500',
    titleGradient: 'from-slate-200 via-blue-300 to-cyan-300',
  },
  newyear: {
    drag: 'bg-red-500/10 border-dashed border-red-400',
    slogan: 'text-red-200',
    border: 'border-red-500/30 hover:border-red-400/50',
    borderCard: 'border-red-700/50',
    btn: 'from-red-600 to-amber-500 shadow-red-500/25 focus-within:ring-red-400',
    btnSecondary: 'from-red-600 to-amber-500 border-red-500/50',
    inputFocus: 'focus:ring-red-500 focus:border-red-500/50',
    cardIcon: 'from-red-500/30 to-amber-500/30 border-red-400/30',
    cardIconText: 'text-amber-300',
    generateBtn: 'from-red-600 to-red-500 shadow-red-500/20 hover:shadow-red-500/40 focus:ring-red-500',
    titleGradient: 'from-red-200 via-amber-300 to-yellow-400',
  },
} as const satisfies Record<ThemeType, Record<string, string>>;

const StartScreen: React.FC<StartScreenProps> = ({ tab, onImageSelected, navigate }) => {
  const { t } = useLanguage();
  const settings = useSettings();
  const { theme } = useTheme();
  const s = themeStyles[theme];
    const surface = theme === 'newyear'
        ? 'bg-red-900/30 border-red-700/50 shadow-red-900/20'
        : theme === 'bloom'
            ? 'bg-gray-900/40 border-fuchsia-500/15 shadow-fuchsia-500/10'
            : 'bg-black/60 border-slate-700/60 shadow-slate-900/30';
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [generationPrompt, setGenerationPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState<"1:1" | "3:4" | "4:3" | "16:9" | "9:16">("1:1");
  const [numberOfImages, setNumberOfImages] = useState<number>(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
        onImageSelected(e.target.files[0]);
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
        const urls = await generateImageFromText(generationPrompt, aspectRatio, numberOfImages, { apiKey: settings.apiKey, model: settings.model });
        if (urls.length === 1) {
            // If only one image, proceed directly to editing
            const newFile = dataURLtoFile(urls[0], `generated-${Date.now()}.png`);
            onImageSelected(newFile);
        } else {
            // If multiple images, show selection screen
            setGeneratedImages(urls);
        }
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
        setError(`${t('start.error_gen_failed')} ${errorMessage}`);
    } finally {
        setIsGenerating(false);
    }
  };

  const handleSelectGenerated = (url: string, index: number) => {
      const newFile = dataURLtoFile(url, `generated-${Date.now()}-${index}.png`);
      onImageSelected(newFile);
  };

  return (
        <div 
            className={`w-full max-w-5xl mx-auto text-center p-8 transition-all duration-300 rounded-2xl border-2 shadow-xl backdrop-blur-xl ${surface} ${isDraggingOver && tab === 'upload' ? s.drag : ''}`}
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
          onImageSelected(file);
        }
      }}
    >
      <div className="flex flex-col items-center gap-6 animate-fade-in">
        <img src="/logo/bloomrender_bg.png" alt="" className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 object-contain drop-shadow-lg" aria-hidden="true" />
        <h1 className="text-5xl font-extrabold tracking-tight text-white sm:text-6xl md:text-7xl">
          {t('start.title_part1')} <span className={`bg-gradient-to-r ${s.titleGradient} bg-clip-text text-transparent`}>{t('start.title_part2')}</span>.
        </h1>
        <p className={`text-base md:text-lg ${s.slogan} font-medium italic mt-1`}>
          {t('app.slogan')}
        </p>
        <p className="max-w-2xl text-lg text-gray-200 md:text-xl">
          {t('start.subtitle')}
        </p>

        <StartTabNav currentTab={tab} navigate={navigate} />

        {tab === 'upload' ? (
            <div className="flex flex-col items-center gap-4 w-full animate-fade-in">
                <div className={`p-12 border-2 border-dashed rounded-2xl bg-gray-800/30 w-full max-w-2xl flex flex-col items-center justify-center gap-4 transition-colors duration-200 ${s.border}`}>
                    <label htmlFor="image-upload-start" className={`relative inline-flex items-center justify-center px-10 py-5 text-xl font-bold text-white bg-gradient-to-r rounded-full cursor-pointer group hover:opacity-95 transition-all duration-200 shadow-lg focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-offset-gray-800 ${s.btn}`}>
                        <UploadIcon className="w-6 h-6 mr-3 transition-transform duration-300 ease-in-out group-hover:rotate-[360deg] group-hover:scale-110" />
                        {t('start.upload_button')}
                    </label>
                    <input id="image-upload-start" type="file" className="hidden" accept="image/*" onChange={handleFileChange} aria-label={t('start.upload_button')} />
                    <p className="text-sm text-gray-300">{t('start.upload_drag')}</p>
                </div>
            </div>
        ) : generatedImages.length > 0 ? (
            <div className={`flex flex-col items-center gap-6 w-full max-w-4xl animate-fade-in bg-gray-800/40 p-6 rounded-2xl border backdrop-blur-sm shadow-lg ${s.borderCard}`}>
                <h3 className="text-xl font-bold text-white">{t('start.select_image')}</h3>
                <div className={`grid gap-4 w-full ${generatedImages.length >= 2 ? 'grid-cols-2' : 'grid-cols-1'}`}> 
                    {generatedImages.map((url, idx) => (
                        <div 
                            key={idx} 
                            className={`relative group aspect-square rounded-xl overflow-hidden cursor-pointer border-2 border-transparent transition-colors duration-200 shadow-lg focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-offset-gray-800 flex items-center justify-center bg-gray-900 ${theme === 'newyear' ? 'hover:border-red-400 focus-within:ring-red-400' : theme === 'bloom' ? 'hover:border-fuchsia-400 focus-within:ring-fuchsia-400' : 'hover:border-blue-400 focus-within:ring-blue-400'}`}
                            onClick={() => handleSelectGenerated(url, idx)}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    handleSelectGenerated(url, idx);
                                }
                            }}
                            aria-label={`${t('start.select_image')} ${idx + 1}`}
                        >
                            <img src={url} className="max-w-full max-h-full w-auto h-auto object-contain" alt={`${t('start.select_image')} ${idx + 1}`} />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                                <span className={`bg-gradient-to-r ${s.btnSecondary} text-white px-6 py-2 rounded-full font-bold shadow-lg transform scale-90 group-hover:scale-100 transition-transform duration-200`}>{t('start.edit_this')}</span>
                            </div>
                        </div>
                    ))}
                </div>
                <button 
                    onClick={() => setGeneratedImages([])}
                    className={`text-gray-300 hover:text-white underline underline-offset-4 transition-colors duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 rounded ${theme === 'newyear' ? 'focus:ring-red-500' : theme === 'bloom' ? 'focus:ring-fuchsia-500' : 'focus:ring-blue-500'}`}
                >
                    {t('start.generate_new')}
                </button>
            </div>
        ) : (
            <div className={`flex flex-col items-center gap-4 w-full max-w-2xl animate-fade-in bg-gray-800/40 p-6 rounded-2xl border backdrop-blur-sm shadow-lg ${s.borderCard}`}>
                <textarea 
                    value={generationPrompt}
                    onChange={(e) => setGenerationPrompt(e.target.value)}
                    placeholder={t('start.prompt_placeholder')}
                    className={`w-full h-32 bg-gray-900/50 border border-gray-600 rounded-xl p-4 text-gray-100 placeholder-gray-500 focus:ring-2 focus:outline-none resize-none transition-colors duration-200 ${s.inputFocus}`}
                    disabled={isGenerating}
                />
                
                <div className="w-full flex flex-col md:flex-row gap-4">
                    <div className="flex-grow">
                        <label className="block text-left text-sm font-medium text-gray-300 mb-2">{t('start.aspect_ratio')}</label>
                        <div className="flex flex-wrap gap-2">
                            {(["1:1", "16:9", "9:16", "4:3", "3:4"] as const).map((ratio) => (
                                <button
                                    key={ratio}
                                    onClick={() => setAspectRatio(ratio)}
                                    disabled={isGenerating}
                                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 ${
                                        aspectRatio === ratio 
                                        ? `border bg-gradient-to-r ${s.btnSecondary} text-white` 
                                        : 'bg-gray-800 text-gray-300 border border-gray-600 hover:bg-gray-700'
                                    } disabled:cursor-not-allowed disabled:opacity-50`}
                                >
                                    {ratio}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="w-full md:w-32">
                         <label className="block text-left text-sm font-medium text-gray-300 mb-2">{t('start.image_count')}</label>
                         <input 
                             type="number" 
                             min="1" 
                             max="4" 
                             value={numberOfImages}
                             onChange={(e) => {
                                 const val = parseInt(e.target.value);
                                 if (!isNaN(val)) {
                                     setNumberOfImages(Math.max(1, Math.min(4, val)));
                                 }
                             }}
                             disabled={isGenerating}
                             className={`w-full bg-gray-900/50 border border-gray-600 rounded-lg p-2 text-gray-100 focus:ring-2 focus:outline-none text-center ${theme === 'newyear' ? 'focus:ring-red-500' : theme === 'bloom' ? 'focus:ring-fuchsia-500' : 'focus:ring-blue-500'}`}
                         />
                    </div>
                </div>

                {error && <p className="text-red-400 text-sm mt-2">{error}</p>}

                {settings.model === 'gemini-3-pro-image-preview' && (
                    <p className="text-xs text-gray-300">{t('start.generate_pro_slow_hint')}</p>
                )}

                <button 
                    onClick={handleGenerateClick}
                    disabled={isGenerating || !generationPrompt.trim()}
                    className={`w-full mt-2 bg-gradient-to-br text-white font-bold py-4 px-6 rounded-lg transition-all duration-200 ease-in-out shadow-lg hover:-translate-y-px active:scale-95 active:shadow-inner disabled:from-gray-700 disabled:to-gray-600 disabled:shadow-none disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 ${s.generateBtn}`}
                >
                    {isGenerating ? <><BloomFlowerLoader size={24} className="shrink-0" /> {t('start.generating')}</> : <><MagicWandIcon className="w-5 h-5" /> {t('start.generate_button')}</>}
                </button>
            </div>
        )}

        {tab === 'upload' && (
            <div className="mt-16 w-full animate-fade-in">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className={`bg-gray-800/30 p-6 rounded-2xl border flex flex-col items-center text-center hover:bg-gray-800/50 transition-all duration-200 cursor-default ${s.borderCard}`}>
                        <div className={`flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br border mb-4 ${s.cardIcon}`}>
                        <BullseyeIcon className={`w-6 h-6 ${s.cardIconText}`} />
                        </div>
                        <h3 className="text-xl font-bold text-white">{t('start.feature_retouch_title')}</h3>
                        <p className="mt-2 text-gray-300">{t('start.feature_retouch_desc')}</p>
                    </div>
                    <div className={`bg-gray-800/30 p-6 rounded-2xl border flex flex-col items-center text-center hover:bg-gray-800/50 transition-all duration-200 cursor-default ${s.borderCard}`}>
                        <div className={`flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br border mb-4 ${s.cardIcon}`}>
                        <PaletteIcon className={`w-6 h-6 ${s.cardIconText}`} />
                        </div>
                        <h3 className="text-xl font-bold text-white">{t('start.feature_filter_title')}</h3>
                        <p className="mt-2 text-gray-300">{t('start.feature_filter_desc')}</p>
                    </div>
                    <div className={`bg-gray-800/30 p-6 rounded-2xl border flex flex-col items-center text-center hover:bg-gray-800/50 transition-all duration-200 cursor-default ${s.borderCard}`}>
                        <div className={`flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br border mb-4 ${s.cardIcon}`}>
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