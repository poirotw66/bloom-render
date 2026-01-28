/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { dataURLtoFile } from '../../utils/fileUtils';
import { useLanguage } from '../../contexts/LanguageContext';
import StartTabNav from '../../components/StartTabNav';
import Spinner from '../../components/Spinner';
import { useTravel } from './useTravel';
import TravelForm from './TravelForm';
import TravelUploadSection from './TravelUploadSection';
import TravelResult from './TravelResult';

interface TravelPageProps {
  onImageSelected: (file: File) => void;
}

const TravelPage: React.FC<TravelPageProps> = ({ onImageSelected }) => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const tr = useTravel();

  const handleEditInEditor = () => {
    if (!tr.result) return;
    onImageSelected(dataURLtoFile(tr.result, `travel-photo-${Date.now()}.png`));
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

        <StartTabNav currentTab="travel" navigate={navigate} />

        {tr.result ? (
          <TravelResult
            result={tr.result}
            onDownload={tr.handleDownload}
            onAgain={tr.clearResult}
            onEditInEditor={handleEditInEditor}
          />
        ) : tr.loading ? (
          <div className="flex flex-col items-center gap-4 w-full max-w-md animate-fade-in bg-gray-800/40 p-8 rounded-xl border border-gray-700/50 backdrop-blur-sm">
            <Spinner />
            <p className="text-gray-300">{t('travel.generating')}</p>
          </div>
        ) : (
          <>
            <TravelForm
              selectedSceneId={tr.selectedSceneId}
              setSelectedSceneId={tr.setSelectedSceneId}
              customSceneText={tr.customSceneText}
              setCustomSceneText={tr.setCustomSceneText}
              customSceneReferenceFile={tr.customSceneReferenceFile}
              customSceneReferenceUrl={tr.customSceneReferenceUrl}
              setCustomSceneReferenceFile={tr.setCustomSceneReferenceFile}
              aspectRatio={tr.aspectRatio}
              setAspectRatio={tr.setAspectRatio}
              imageSize={tr.imageSize}
              setImageSize={tr.setImageSize}
              disabled={tr.loading}
            />
            <TravelUploadSection
              file={tr.file}
              previewUrl={tr.previewUrl}
              error={tr.error}
              loading={tr.loading}
              isDraggingOver={tr.isDraggingOver}
              onFileChange={tr.handleFileChange}
              onGenerate={tr.handleGenerate}
              onDragOver={tr.handleDragOver}
              onDragLeave={tr.handleDragLeave}
              onDrop={tr.handleDrop}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default TravelPage;
