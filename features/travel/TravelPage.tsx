/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { dataURLtoFile } from '../../utils/fileUtils';
import { useLanguage } from '../../contexts/LanguageContext';
import ProgressIndicator from '../../components/ProgressIndicator';
import { useTravel } from './useTravel';
import TravelForm from './TravelForm';
import TravelUploadSection from './TravelUploadSection';
import TravelResult from './TravelResult';
import TravelMapContainer from './TravelMapContainer';
import QuantitySelector from '../../components/QuantitySelector';
import { TRAVEL_SCENES_INTERNATIONAL, TRAVEL_SCENES_TAIWAN } from '../../constants/travel';

interface TravelPageProps {
  onImageSelected: (file: File) => void;
}

const TravelPage: React.FC<TravelPageProps> = ({ onImageSelected }) => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const tr = useTravel();
  const [viewMode, setViewMode] = React.useState<'list' | 'map'>('map');

  const sceneLabel = React.useMemo(() => {
    if (tr.selectedSceneId === 'custom') return t('travel.custom_btn');
    if (tr.selectedSceneId === 'random') return t('travel.random_scene') || t('travel.map_instruction');
    const scene = [...TRAVEL_SCENES_INTERNATIONAL, ...TRAVEL_SCENES_TAIWAN].find((s) => s.id === tr.selectedSceneId);
    return scene ? t(scene.nameKey) : t('travel.map_instruction');
  }, [tr.selectedSceneId, t]);

  const handleEditInEditor = (result: string, index?: number) => {
    if (!result) return;
    onImageSelected(dataURLtoFile(result, `travel-photo-${index !== undefined ? index + 1 : Date.now()}.png`));
  };

  return (
    <div className="w-full max-w-7xl mx-auto text-center p-4 md:p-6 transition-all duration-300 rounded-2xl border border-blue-900/20 bg-gradient-to-b from-gray-900/40 via-gray-950/60 to-black/50 shadow-2xl">
      <div className="flex flex-col items-center gap-6 animate-fade-in text-left">
        <div className="text-center w-full">
          <h1 className="text-5xl font-extrabold tracking-tight text-gray-100 sm:text-6xl md:text-7xl">
            <span className="text-blue-200">{t('travel.title')}</span>
          </h1>
          <p className="max-w-3xl text-lg text-gray-300 md:text-xl mx-auto mb-4">
            {t('travel.subtitle')}
          </p>
        </div>

        {!tr.result && !tr.results && !tr.loading && (
          <div className="w-full flex flex-col gap-3 p-4 rounded-2xl border border-white/5 bg-white/5 shadow-lg shadow-blue-500/10">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3">
              <div className="flex items-center gap-3 text-sm text-blue-100">
                <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 font-semibold">
                  📍 {sceneLabel}
                </span>
                <span className="text-gray-400 hidden md:inline">
                  {viewMode === 'list' ? t('travel.list_instruction') : t('travel.map_instruction')}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex bg-gray-900/70 p-1.5 rounded-xl border border-gray-800 shadow-inner">
                  <button
                    onClick={() => setViewMode('map')}
                    className={`px-4 py-2 text-xs font-bold rounded-lg transition-all duration-200 flex items-center gap-2 ${viewMode === 'map'
                      ? 'bg-gradient-to-br from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/30'
                      : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
                      }`}
                  >
                    <span>🗺️</span>
                    <span>{t('travel.map_world')}</span>
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`px-4 py-2 text-xs font-bold rounded-lg transition-all duration-200 flex items-center gap-2 ${viewMode === 'list'
                      ? 'bg-gradient-to-br from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/30'
                      : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
                      }`}
                  >
                    <span>📋</span>
                    <span>{t('travel.list_view')}</span>
                  </button>
                </div>
                <div className="hidden md:flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-100 text-xs font-semibold">
                  ⚡ {t('travel.surprise_me')}
                </div>
              </div>
            </div>
          </div>
        )}

        {tr.results && tr.results.length > 0 ? (
          <div className="w-full flex flex-col gap-6">
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={tr.handleBatchDownload}
                className="px-6 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-colors"
              >
                💾 {t('history.batch_download')} ({tr.results.length})
              </button>
              <button
                onClick={tr.clearResult}
                className="px-6 py-3 bg-gray-700 text-white rounded-xl font-bold hover:bg-gray-600 transition-colors"
              >
                {t('travel.again')}
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6 w-full">
              {tr.results.map((result, idx) => (
                <TravelResult
                  key={idx}
                  result={result}
                  resultSceneNameKey={tr.resultSceneNameKey}
                  resultSceneCustomLabel={tr.resultSceneCustomLabel}
                  resultMetadata={tr.resultMetadata}
                  onDownload={() => {
                    const link = document.createElement('a');
                    link.href = result;
                    link.download = `travel-photo-${idx + 1}.png`;
                    link.click();
                  }}
                  onAgain={tr.clearResult}
                  onEditInEditor={() => handleEditInEditor(result, idx)}
                />
              ))}
            </div>
          </div>
        ) : tr.result ? (
          <TravelResult
            result={tr.result}
            resultSceneNameKey={tr.resultSceneNameKey}
            resultSceneCustomLabel={tr.resultSceneCustomLabel}
            resultMetadata={tr.resultMetadata}
            onDownload={tr.handleDownload}
            onAgain={tr.clearResult}
            onEditInEditor={handleEditInEditor}
          />
        ) : tr.loading ? (
          <ProgressIndicator
            progress={tr.progress}
            statusMessages={['travel.generating']}
          />
        ) : (
          <div className="w-full flex flex-col gap-6">
            {/* View mode toggle - visible directly above map/form so users can switch to list */}
            <div className="flex flex-wrap items-center justify-center sm:justify-between gap-3 p-4 rounded-2xl border border-blue-500/20 bg-blue-500/5">
              <span className="text-sm text-blue-100/90 font-medium">
                {viewMode === 'list' ? t('travel.list_instruction') : t('travel.map_instruction')}
              </span>
              <div className="flex bg-gray-900/70 p-1.5 rounded-xl border border-gray-800 shadow-inner">
                <button
                  type="button"
                  onClick={() => setViewMode('map')}
                  className={`px-4 py-2.5 text-sm font-bold rounded-lg transition-all duration-200 flex items-center gap-2 ${viewMode === 'map'
                    ? 'bg-gradient-to-br from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/30'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
                    }`}
                >
                  <span>🗺️</span>
                  <span>{t('travel.map_world')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  className={`px-4 py-2.5 text-sm font-bold rounded-lg transition-all duration-200 flex items-center gap-2 ${viewMode === 'list'
                    ? 'bg-gradient-to-br from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/30'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
                    }`}
                >
                  <span>📋</span>
                  <span>{t('travel.list_view')}</span>
                </button>
              </div>
            </div>

            <div className={`w-full ${viewMode === 'map' ? 'flex flex-col gap-6' : 'grid grid-cols-1 lg:grid-cols-2 gap-6 items-start'}`}>
            <div className={viewMode === 'map' ? 'w-full' : 'space-y-4'}>
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
                    outfit={tr.outfit}
                    setOutfit={tr.setOutfit}
                    customOutfitText={tr.customOutfitText}
                    setCustomOutfitText={tr.setCustomOutfitText}
                    pose={tr.pose}
                    setPose={tr.setPose}
                    customPoseText={tr.customPoseText}
                    setCustomPoseText={tr.setCustomPoseText}
                    framing={tr.framing}
                    setFraming={tr.setFraming}
                    outfitColor={tr.outfitColor}
                    setOutfitColor={tr.setOutfitColor}
                    clearBackground={tr.clearBackground}
                    setClearBackground={tr.setClearBackground}
                  />
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
                    outfit={tr.outfit}
                    setOutfit={tr.setOutfit}
                    customOutfitText={tr.customOutfitText}
                    setCustomOutfitText={tr.setCustomOutfitText}
                    outfitColor={tr.outfitColor}
                    setOutfitColor={tr.setOutfitColor}
                    pose={tr.pose}
                    setPose={tr.setPose}
                    customPoseText={tr.customPoseText}
                    setCustomPoseText={tr.setCustomPoseText}
                    relationship={tr.relationship}
                    setRelationship={tr.setRelationship}
                    framing={tr.framing}
                    setFraming={tr.setFraming}
                    clearBackground={tr.clearBackground}
                    setClearBackground={tr.setClearBackground}
                    handleSurpriseMe={tr.handleSurpriseMe}
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
                  outfit={tr.outfit}
                  setOutfit={tr.setOutfit}
                  customOutfitText={tr.customOutfitText}
                  setCustomOutfitText={tr.setCustomOutfitText}
                  outfitColor={tr.outfitColor}
                  setOutfitColor={tr.setOutfitColor}
                  pose={tr.pose}
                  setPose={tr.setPose}
                  customPoseText={tr.customPoseText}
                  setCustomPoseText={tr.setCustomPoseText}
                  relationship={tr.relationship}
                  setRelationship={tr.setRelationship}
                  framing={tr.framing}
                  setFraming={tr.setFraming}
                  clearBackground={tr.clearBackground}
                  setClearBackground={tr.setClearBackground}
                  handleSurpriseMe={tr.handleSurpriseMe}
                  useReferenceImage={tr.useReferenceImage}
                  setUseReferenceImage={tr.setUseReferenceImage}
                  disabled={tr.loading}
                  showSceneSelector={true}
                />
              )}
            </div>

            <div className={viewMode === 'map' ? 'w-full' : 'lg:sticky lg:top-4'}>
              <div className="mb-4">
                <QuantitySelector
                  quantity={tr.quantity}
                  onChange={tr.setQuantity}
                  disabled={tr.loading}
                />
              </div>
              <TravelUploadSection
                files={tr.files}
                previewUrls={tr.previewUrls}
                isGroupMode={tr.isGroupMode}
                setIsGroupMode={tr.setIsGroupMode}
                removeFile={tr.removeFile}
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
          </div>
        )}
      </div>
    </div>
  );
};

export default TravelPage;
