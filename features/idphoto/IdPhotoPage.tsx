/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { dataURLtoFile } from '../../utils/fileUtils';
import { useLanguage } from '../../contexts/LanguageContext';
import StartTabNav from '../../components/StartTabNav';
import ProgressIndicator from '../../components/ProgressIndicator';
import { useIdPhoto } from './useIdPhoto';
import IdPhotoForm from './IdPhotoForm';
import IdPhotoUploadSection from './IdPhotoUploadSection';
import IdPhotoResult from './IdPhotoResult';
import QuantitySelector from '../../components/QuantitySelector';

interface IdPhotoPageProps {
  onImageSelected: (file: File) => void;
}

const IdPhotoPage: React.FC<IdPhotoPageProps> = ({ onImageSelected }) => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const id = useIdPhoto();

  const handleEditInEditor = (result: string, index?: number) => {
    if (!result) return;
    onImageSelected(dataURLtoFile(result, `id-photo-${index !== undefined ? index + 1 : Date.now()}.png`));
  };

  return (
    <div className="w-full max-w-5xl mx-auto text-center p-8 transition-all duration-300 rounded-2xl border-2 border-transparent">
      <div className="flex flex-col items-center gap-6 animate-fade-in">
        <h1 className="text-5xl font-extrabold tracking-tight text-gray-100 sm:text-6xl md:text-7xl">
          {t('start.title_part1')} <span className="text-blue-400">{t('start.title_part2')}</span>.
        </h1>
        <p className="max-w-2xl text-lg text-gray-400 md:text-xl">
          {t('start.subtitle')}
        </p>

        <StartTabNav currentTab="idphoto" navigate={navigate} />

        {id.idPhotoResults && id.idPhotoResults.length > 0 ? (
          <div className="w-full flex flex-col gap-6">
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={id.handleIdPhotoBatchDownload}
                className="px-6 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-colors"
              >
                💾 {t('history.batch_download')} ({id.idPhotoResults.length})
              </button>
              <button
                onClick={id.clearIdPhotoResult}
                className="px-6 py-3 bg-gray-700 text-white rounded-xl font-bold hover:bg-gray-600 transition-colors"
              >
                {t('start.idphoto_again')}
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 w-full">
              {id.idPhotoResults.map((result, idx) => (
                <div key={idx} className="relative group">
                  <div className="aspect-[3/4] rounded-lg overflow-hidden border-2 border-gray-700 bg-white flex items-center justify-center">
                    <img
                      src={result}
                      alt={`ID Photo ${idx + 1}`}
                      className="max-w-full max-h-full w-auto h-auto object-contain"
                    />
                  </div>
                  <button
                    onClick={() => handleEditInEditor(result, idx)}
                    className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                  >
                    <span className="text-white font-bold">{t('history.edit')}</span>
                  </button>
                  <button
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = result;
                      link.download = `id-photo-${idx + 1}.png`;
                      link.click();
                    }}
                    className="absolute top-2 right-2 bg-blue-600 hover:bg-blue-500 text-white p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                    title={t('start.idphoto_download')}
                  >
                    ⬇️
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : id.idPhotoLoading ? (
          <ProgressIndicator
            progress={id.progress}
            statusMessages={['start.idphoto_generating']}
          />
        ) : (
          <>
            <IdPhotoForm
              idPhotoType={id.idPhotoType}
              setIdPhotoType={id.setIdPhotoType}
              idPhotoRetouchLevel={id.idPhotoRetouchLevel}
              setIdPhotoRetouchLevel={id.setIdPhotoRetouchLevel}
              idPhotoOutputSpec={id.idPhotoOutputSpec}
              setIdPhotoOutputSpec={id.setIdPhotoOutputSpec}
              idPhotoClothingOption={id.idPhotoClothingOption}
              setIdPhotoClothingOption={id.setIdPhotoClothingOption}
              idPhotoClothingCustomText={id.idPhotoClothingCustomText}
              setIdPhotoClothingCustomText={id.setIdPhotoClothingCustomText}
              idPhotoClothingReferenceFile={id.idPhotoClothingReferenceFile}
              setIdPhotoClothingReferenceFile={id.setIdPhotoClothingReferenceFile}
              idPhotoClothingReferenceUrl={id.idPhotoClothingReferenceUrl}
              disabled={id.idPhotoLoading}
            />
            <div className="w-full max-w-md mx-auto">
              <QuantitySelector
                quantity={id.quantity}
                onChange={id.setQuantity}
                disabled={id.idPhotoLoading}
              />
            </div>
            <IdPhotoUploadSection
              idPhotoFile={id.idPhotoFile}
              idPhotoPreviewUrl={id.idPhotoPreviewUrl}
              idPhotoError={id.idPhotoError}
              idPhotoLoading={id.idPhotoLoading}
              isDraggingOver={id.isDraggingOver}
              onFileChange={id.handleIdPhotoFileChange}
              onGenerate={id.handleIdPhotoGenerate}
              onDragOver={id.handleDragOver}
              onDragLeave={id.handleDragLeave}
              onDrop={id.handleDrop}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default IdPhotoPage;
