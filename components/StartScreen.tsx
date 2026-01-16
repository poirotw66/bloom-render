/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState } from 'react';
import { UploadIcon, MagicWandIcon, PaletteIcon, SunIcon, BullseyeIcon } from './icons';
import { generateImageFromText } from '../services/geminiService';
import Spinner from './Spinner';
import { useLanguage } from '../contexts/LanguageContext';
import { useSettings } from '../contexts/SettingsContext';

interface StartScreenProps {
  onImageSelected: (file: File) => void;
}

// Helper to convert a data URL string to a File object
const dataURLtoFile = (dataurl: string, filename: string): File => {
    const arr = dataurl.split(',');
    if (arr.length < 2) throw new Error("Invalid data URL");
    const mimeMatch = arr[0].match(/:(.*?);/);
    if (!mimeMatch || !mimeMatch[1]) throw new Error("Could not parse MIME type from data URL");

    const mime = mimeMatch[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while(n--){
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, {type:mime});
}

const StartScreen: React.FC<StartScreenProps> = ({ onImageSelected }) => {
  const { t } = useLanguage();
  const settings = useSettings();
  const [activeTab, setActiveTab] = useState<'upload' | 'generate'>('upload');
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
      className={`w-full max-w-5xl mx-auto text-center p-8 transition-all duration-300 rounded-2xl border-2 ${isDraggingOver && activeTab === 'upload' ? 'bg-blue-500/10 border-dashed border-blue-400' : 'border-transparent'}`}
      onDragOver={(e) => { 
          if(activeTab === 'upload') {
            e.preventDefault(); 
            setIsDraggingOver(true); 
          }
      }}
      onDragLeave={() => setIsDraggingOver(false)}
      onDrop={(e) => {
        if(activeTab === 'upload') {
            e.preventDefault();
            setIsDraggingOver(false);
            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                onImageSelected(e.dataTransfer.files[0]);
            }
        }
      }}
    >
      <div className="flex flex-col items-center gap-6 animate-fade-in">
        <h1 className="text-5xl font-extrabold tracking-tight text-gray-100 sm:text-6xl md:text-7xl">
          {t('start.title_part1')} <span className="text-blue-400">{t('start.title_part2')}</span>.
        </h1>
        <p className="max-w-2xl text-lg text-gray-400 md:text-xl">
          {t('start.subtitle')}
        </p>

        {/* Tab Switcher */}
        <div className="bg-gray-800/50 p-1 rounded-xl flex items-center gap-1 border border-gray-700 mt-4 mb-4">
            <button
                onClick={() => { setActiveTab('upload'); setGeneratedImages([]); }}
                className={`px-8 py-3 rounded-lg text-lg font-semibold transition-all duration-200 ${activeTab === 'upload' ? 'bg-gray-700 text-white shadow-lg' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
            >
                {t('start.tab_upload')}
            </button>
            <button
                onClick={() => setActiveTab('generate')}
                className={`px-8 py-3 rounded-lg text-lg font-semibold transition-all duration-200 ${activeTab === 'generate' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
            >
                {t('start.tab_generate')}
            </button>
        </div>

        {activeTab === 'upload' ? (
            <div className="flex flex-col items-center gap-4 w-full animate-fade-in">
                <div className="p-12 border-2 border-dashed border-gray-700 rounded-xl bg-gray-800/20 w-full max-w-2xl flex flex-col items-center justify-center gap-4 hover:border-gray-500 transition-colors">
                    <label htmlFor="image-upload-start" className="relative inline-flex items-center justify-center px-10 py-5 text-xl font-bold text-white bg-blue-600 rounded-full cursor-pointer group hover:bg-blue-500 transition-colors shadow-lg shadow-blue-600/20">
                        <UploadIcon className="w-6 h-6 mr-3 transition-transform duration-500 ease-in-out group-hover:rotate-[360deg] group-hover:scale-110" />
                        {t('start.upload_button')}
                    </label>
                    <input id="image-upload-start" type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                    <p className="text-sm text-gray-400">{t('start.upload_drag')}</p>
                </div>
            </div>
        ) : generatedImages.length > 0 ? (
            <div className="flex flex-col items-center gap-6 w-full max-w-4xl animate-fade-in bg-gray-800/40 p-6 rounded-xl border border-gray-700/50 backdrop-blur-sm">
                <h3 className="text-xl font-bold text-white">{t('start.select_image')}</h3>
                <div className={`grid gap-4 w-full ${generatedImages.length >= 2 ? 'grid-cols-2' : 'grid-cols-1'}`}> 
                    {generatedImages.map((url, idx) => (
                        <div key={idx} className="relative group aspect-square rounded-xl overflow-hidden cursor-pointer border-2 border-transparent hover:border-blue-500 transition-all shadow-lg"
                            onClick={() => handleSelectGenerated(url, idx)}>
                            <img src={url} className="w-full h-full object-cover" alt={`Generated ${idx + 1}`} />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <span className="bg-blue-600 text-white px-6 py-2 rounded-full font-bold shadow-lg transform scale-90 group-hover:scale-100 transition-transform">{t('start.edit_this')}</span>
                            </div>
                        </div>
                    ))}
                </div>
                <button 
                    onClick={() => setGeneratedImages([])}
                    className="text-gray-400 hover:text-white underline underline-offset-4"
                >
                    {t('start.generate_new')}
                </button>
            </div>
        ) : (
            <div className="flex flex-col items-center gap-4 w-full max-w-2xl animate-fade-in bg-gray-800/40 p-6 rounded-xl border border-gray-700/50 backdrop-blur-sm">
                <textarea 
                    value={generationPrompt}
                    onChange={(e) => setGenerationPrompt(e.target.value)}
                    placeholder={t('start.prompt_placeholder')}
                    className="w-full h-32 bg-gray-900/50 border border-gray-600 rounded-lg p-4 text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
                    disabled={isGenerating}
                />
                
                <div className="w-full flex flex-col md:flex-row gap-4">
                    <div className="flex-grow">
                        <label className="block text-left text-sm font-medium text-gray-400 mb-2">{t('start.aspect_ratio')}</label>
                        <div className="flex flex-wrap gap-2">
                            {(["1:1", "16:9", "9:16", "4:3", "3:4"] as const).map((ratio) => (
                                <button
                                    key={ratio}
                                    onClick={() => setAspectRatio(ratio)}
                                    disabled={isGenerating}
                                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                                        aspectRatio === ratio 
                                        ? 'bg-blue-600 text-white border border-blue-500' 
                                        : 'bg-gray-800 text-gray-300 border border-gray-600 hover:bg-gray-700'
                                    }`}
                                >
                                    {ratio}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="w-full md:w-32">
                         <label className="block text-left text-sm font-medium text-gray-400 mb-2">{t('start.image_count')}</label>
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
                             className="w-full bg-gray-900/50 border border-gray-600 rounded-lg p-2 text-gray-100 focus:ring-2 focus:ring-blue-500 focus:outline-none text-center"
                         />
                    </div>
                </div>

                {error && <p className="text-red-400 text-sm mt-2">{error}</p>}

                <button 
                    onClick={handleGenerateClick}
                    disabled={isGenerating || !generationPrompt.trim()}
                    className="w-full mt-2 bg-gradient-to-br from-blue-600 to-blue-500 text-white font-bold py-4 px-6 rounded-lg transition-all duration-300 ease-in-out shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/40 hover:-translate-y-px active:scale-95 active:shadow-inner disabled:from-gray-700 disabled:to-gray-600 disabled:shadow-none disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
                >
                    {isGenerating ? <><Spinner /> {t('start.generating')}</> : <><MagicWandIcon className="w-5 h-5" /> {t('start.generate_button')}</>}
                </button>
            </div>
        )}

        {activeTab === 'upload' && (
            <div className="mt-16 w-full animate-fade-in">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="bg-black/20 p-6 rounded-lg border border-gray-700/50 flex flex-col items-center text-center hover:bg-white/5 transition-colors">
                        <div className="flex items-center justify-center w-12 h-12 bg-gray-700 rounded-full mb-4">
                        <BullseyeIcon className="w-6 h-6 text-blue-400" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-100">{t('start.feature_retouch_title')}</h3>
                        <p className="mt-2 text-gray-400">{t('start.feature_retouch_desc')}</p>
                    </div>
                    <div className="bg-black/20 p-6 rounded-lg border border-gray-700/50 flex flex-col items-center text-center hover:bg-white/5 transition-colors">
                        <div className="flex items-center justify-center w-12 h-12 bg-gray-700 rounded-full mb-4">
                        <PaletteIcon className="w-6 h-6 text-blue-400" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-100">{t('start.feature_filter_title')}</h3>
                        <p className="mt-2 text-gray-400">{t('start.feature_filter_desc')}</p>
                    </div>
                    <div className="bg-black/20 p-6 rounded-lg border border-gray-700/50 flex flex-col items-center text-center hover:bg-white/5 transition-colors">
                        <div className="flex items-center justify-center w-12 h-12 bg-gray-700 rounded-full mb-4">
                        <SunIcon className="w-6 h-6 text-blue-400" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-100">{t('start.feature_adjust_title')}</h3>
                        <p className="mt-2 text-gray-400">{t('start.feature_adjust_desc')}</p>
                    </div>
                </div>
            </div>
        )}

      </div>
    </div>
  );
};

export default StartScreen;