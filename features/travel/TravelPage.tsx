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
import TravelMapContainer from './TravelMapContainer';

interface TravelPageProps {
  onImageSelected: (file: File) => void;
}

const LOADING_STATUSES = [
  'travel.status.analyzing',
  'travel.status.blending',
  'travel.status.lighting',
  'travel.status.refining'
];

const TravelPage: React.FC<TravelPageProps> = ({ onImageSelected }) => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const tr = useTravel();
  const [viewMode, setViewMode] = React.useState<'list' | 'map'>('map');
  const [statusIndex, setStatusIndex] = React.useState(0);

  React.useEffect(() => {
    let interval: NodeJS.Timeout;
    if (tr.loading) {
      interval = setInterval(() => {
        setStatusIndex((prev) => (prev + 1) % LOADING_STATUSES.length);
      }, 3000);
    } else {
      setStatusIndex(0);
    }
    return () => clearInterval(interval);
  }, [tr.loading]);

  const handleEditInEditor = () => {
    if (!tr.result) return;
    onImageSelected(dataURLtoFile(tr.result, `travel-photo-${Date.now()}.png`));
  };

  return (
    <div className="w-full max-w-7xl mx-auto text-center p-4 md:p-6 transition-all duration-300 rounded-2xl border-2 border-transparent">
      <div className="flex flex-col items-center gap-6 animate-fade-in text-left">
        <div className="text-center w-full">
          <h1 className="text-5xl font-extrabold tracking-tight text-gray-100 sm:text-6xl md:text-7xl">
            {t('start.title_part1')} <span className="text-blue-400">{t('start.title_part2')}</span>.
          </h1>
          <p className="max-w-2xl text-lg text-gray-400 md:text-xl mx-auto mb-4">
            {t('start.subtitle')}
          </p>
        </div>

        <StartTabNav currentTab="travel" navigate={navigate} />

        {tr.result ? (
          <TravelResult
            result={tr.result}
            resultSceneNameKey={tr.resultSceneNameKey}
            resultSceneCustomLabel={tr.resultSceneCustomLabel}
            onDownload={tr.handleDownload}
            onAgain={tr.clearResult}
            onEditInEditor={handleEditInEditor}
          />
        ) : tr.loading ? (
          <div className="flex flex-col items-center gap-4 w-full max-w-md animate-fade-in bg-gray-800/40 p-12 rounded-2xl border border-gray-700/50 backdrop-blur-md mx-auto shadow-2xl">
            <div className="relative">
              <Spinner />
              <div className="absolute inset-0 bg-blue-500/20 blur-2xl rounded-full -z-10 animate-pulse" />
            </div>
            <div className="space-y-2 text-center">
              <p className="text-xl font-bold text-gray-100">{t('travel.generating')}</p>
              <p className="text-blue-400 font-medium animate-pulse">{t(LOADING_STATUSES[statusIndex])}</p>
            </div>
          </div>
        ) : (
          <div className={`w-full ${viewMode === 'map' ? 'flex flex-col gap-6' : 'grid grid-cols-1 lg:grid-cols-2 gap-6 items-start'}`}>
            <div className={viewMode === 'map' ? 'w-full' : 'space-y-4'}>
              {/* View mode toggle */}
              <div className="flex bg-gray-900/50 p-1.5 rounded-xl border border-gray-700 w-fit shadow-lg mb-4">
                <button
                  onClick={() => setViewMode('map')}
                  className={`px-5 py-2.5 text-sm font-bold rounded-lg transition-all duration-200 flex items-center gap-2 ${viewMode === 'map'
                    ? 'bg-gradient-to-br from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/30'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
                    }`}
                >
                  <span>🗺️</span>
                  <span>Map View</span>
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-5 py-2.5 text-sm font-bold rounded-lg transition-all duration-200 flex items-center gap-2 ${viewMode === 'list'
                    ? 'bg-gradient-to-br from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/30'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
                    }`}
                >
                  <span>📋</span>
                  <span>List View</span>
                </button>
              </div>

              {/* Map or Form display */}
              {viewMode === 'map' ? (
                <div className="flex flex-col gap-6">
                  <TravelMapContainer
                    selectedSceneId={tr.selectedSceneId}
                    onSceneSelect={tr.setSelectedSceneId}
                    weather={tr.weather}
                    setWeather={tr.setWeather}
                    timeOfDay={tr.timeOfDay}
                    setTimeOfDay={tr.setTimeOfDay}
                    vibe={tr.vibe}
                    setVibe={tr.setVibe}
                  />
                  {/* Show settings below map */}
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
                    style={tr.style}
                    setStyle={tr.setStyle}
                    weather={tr.weather}
                    setWeather={tr.setWeather}
                    timeOfDay={tr.timeOfDay}
                    setTimeOfDay={tr.setTimeOfDay}
                    vibe={tr.vibe}
                    setVibe={tr.setVibe}
                    useReferenceImage={tr.useReferenceImage}
                    setUseReferenceImage={tr.setUseReferenceImage}
                    disabled={tr.loading}
                    showSceneSelector={false}
                  />
                </div>
              ) : (
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
                  style={tr.style}
                  setStyle={tr.setStyle}
                  weather={tr.weather}
                  setWeather={tr.setWeather}
                  timeOfDay={tr.timeOfDay}
                  setTimeOfDay={tr.setTimeOfDay}
                  vibe={tr.vibe}
                  setVibe={tr.setVibe}
                  useReferenceImage={tr.useReferenceImage}
                  setUseReferenceImage={tr.setUseReferenceImage}
                  disabled={tr.loading}
                  showSceneSelector={true}
                />
              )}
            </div>

            {/* Upload section - full width in map view, sidebar in list view */}
            <div className={viewMode === 'map' ? 'w-full' : 'lg:sticky lg:top-4'}>
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
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TravelPage;
