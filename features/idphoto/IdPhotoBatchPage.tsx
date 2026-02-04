/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Batch ID photo generation page.
 */

import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { useSettings } from '../../contexts/SettingsContext';
import { useBatchProcessing } from '../../hooks/useBatchProcessing';
import { generateIdPhoto } from '../../services/geminiService';
import StartTabNav from '../../components/StartTabNav';
import BatchUploadSection from '../../components/BatchUploadSection';
import BatchProgress from '../../components/BatchProgress';
import {
  DEFAULT_ID_TYPE,
  DEFAULT_RETOUCH_LEVEL,
  DEFAULT_OUTPUT_SPEC,
  DEFAULT_CLOTHING_OPTION,
} from '../../constants/idPhoto';
import type { IdPhotoType, RetouchLevel, OutputSpec, ClothingOption } from '../../constants/idPhoto';
import { dataURLtoFile } from '../../utils/fileUtils';

interface IdPhotoBatchPageProps {
  onImageSelected: (file: File) => void;
}

const IdPhotoBatchPage: React.FC<IdPhotoBatchPageProps> = ({ onImageSelected }) => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const settings = useSettings();
  const batch = useBatchProcessing<File, {
    retouchLevel: RetouchLevel;
    idType: IdPhotoType;
    outputSpec: OutputSpec;
    clothingOption: ClothingOption;
    clothingCustomText?: string;
    clothingReferenceImage?: File;
  }>();

  const [files, setFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [idPhotoType, setIdPhotoType] = useState<IdPhotoType>(DEFAULT_ID_TYPE);
  const [idPhotoRetouchLevel, setIdPhotoRetouchLevel] = useState<RetouchLevel>(DEFAULT_RETOUCH_LEVEL);
  const [idPhotoOutputSpec, setIdPhotoOutputSpec] = useState<OutputSpec>(DEFAULT_OUTPUT_SPEC);
  const [idPhotoClothingOption, setIdPhotoClothingOption] = useState<ClothingOption>(DEFAULT_CLOTHING_OPTION);
  const [idPhotoClothingCustomText, setIdPhotoClothingCustomText] = useState('');
  const [idPhotoClothingReferenceFile, setIdPhotoClothingReferenceFile] = useState<File | null>(null);

  // Generate preview URLs
  useEffect(() => {
    const urls = files.map((file) => URL.createObjectURL(file));
    setPreviewUrls(urls);
    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [files]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    setFiles((prev) => [...prev, ...selectedFiles].slice(0, 10));
    e.target.value = '';
  }, []);

  const removeFile = useCallback((index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDraggingOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
    const droppedFiles = Array.from(e.dataTransfer.files).filter((file) =>
      file.type.startsWith('image/')
    );
    setFiles((prev) => [...prev, ...droppedFiles].slice(0, 10));
  }, []);

  const handleBatchGenerate = useCallback(async () => {
    if (files.length === 0) return;
    if (idPhotoClothingOption === 'custom' && !idPhotoClothingCustomText.trim() && !idPhotoClothingReferenceFile) {
      return;
    }

    await batch.processBatch(files, {
      generateApi: generateIdPhoto,
      options: {
        retouchLevel: idPhotoRetouchLevel,
        idType: idPhotoType,
        outputSpec: idPhotoOutputSpec,
        clothingOption: idPhotoClothingOption,
        clothingCustomText: idPhotoClothingOption === 'custom' ? idPhotoClothingCustomText.trim() || undefined : undefined,
        clothingReferenceImage: idPhotoClothingOption === 'custom' && idPhotoClothingReferenceFile ? idPhotoClothingReferenceFile : undefined,
      },
      settings: { apiKey: settings.apiKey, model: settings.model },
      maxConcurrent: 3,
      historyType: 'idphoto',
    });
  }, [
    files,
    idPhotoRetouchLevel,
    idPhotoType,
    idPhotoOutputSpec,
    idPhotoClothingOption,
    idPhotoClothingCustomText,
    idPhotoClothingReferenceFile,
    settings,
    batch,
  ]);

  const handleBatchDownload = useCallback(async () => {
    if (batch.results.length === 0) return;

    try {
      // Try to use JSZip if available
      const JSZip = await import('jszip');
      const zip = new JSZip.default();
      batch.results.forEach((item, index) => {
        const base64 = item.result.split(',')[1];
        zip.file(`id-photo-${index + 1}.png`, base64, { base64: true });
      });

      const content = await zip.generateAsync({ type: 'blob' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(content);
      link.download = `id-photos-batch-${Date.now()}.zip`;
      link.click();
      URL.revokeObjectURL(link.href);
    } catch {
      // Fallback: download individually
      batch.results.forEach((item, index) => {
        setTimeout(() => {
          const link = document.createElement('a');
          link.href = item.result;
          link.download = `id-photo-${index + 1}.png`;
          link.click();
        }, index * 100);
      });
    }
  }, [batch.results]);

  return (
    <div className="w-full max-w-5xl mx-auto text-center p-8">
      <div className="flex flex-col items-center gap-6">
        <h1 className="text-5xl font-extrabold tracking-tight text-gray-100 sm:text-6xl">
          {t('start.title_part1')} <span className="text-emerald-400">{t('batch.title')}</span>
        </h1>
        <p className="max-w-2xl text-lg text-gray-400 md:text-xl">
          {t('batch.upload_hint', { min: 1, max: 10 })}
        </p>

        <StartTabNav currentTab="idphoto" navigate={navigate} />

        {batch.isProcessing ? (
          <BatchProgress
            completed={batch.progress.completed}
            total={batch.progress.total}
            current={batch.progress.current}
            results={batch.results}
            errors={batch.errors}
          />
        ) : batch.results.length > 0 ? (
          <div className="w-full flex flex-col gap-6">
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={handleBatchDownload}
                className="px-6 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-colors"
              >
                💾 {t('history.batch_download')} ({batch.results.length})
              </button>
              <button
                onClick={() => {
                  batch.reset();
                  setFiles([]);
                }}
                className="px-6 py-3 bg-gray-700 text-white rounded-xl font-bold hover:bg-gray-600 transition-colors"
              >
                {t('start.idphoto_again')}
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {batch.results.map((item, idx) => (
                <div key={idx} className="relative group">
                  <img
                    src={item.result}
                    alt={`Result ${idx + 1}`}
                    className="w-full rounded-lg border-2 border-gray-700"
                  />
                  <button
                    onClick={() => onImageSelected(dataURLtoFile(item.result, `id-photo-${idx + 1}.png`))}
                    className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                  >
                    <span className="text-white font-bold">{t('history.edit')}</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* Form options - reuse from IdPhotoForm */}
            <BatchUploadSection
              files={files}
              previewUrls={previewUrls}
              error={null}
              loading={batch.isProcessing}
              isDraggingOver={isDraggingOver}
              onFileChange={handleFileChange}
              onGenerate={handleBatchGenerate}
              onRemoveFile={removeFile}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              maxFiles={10}
              minFiles={1}
              icon="🪪"
            />
          </>
        )}
      </div>
    </div>
  );
};

export default IdPhotoBatchPage;
