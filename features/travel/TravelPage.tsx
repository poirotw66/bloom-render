/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { dataURLtoFile } from '../../utils/fileUtils';
import { useLanguage } from '../../contexts/LanguageContext';
import ProgressIndicator from '../../components/ProgressIndicator';
import { DownloadIcon } from '../../components/icons';
import { useTravel } from './useTravel';
import TravelForm from './TravelForm';
import TravelUploadSection from './TravelUploadSection';
import TravelResult from './TravelResult';
import TravelMapContainer from './TravelMapContainer';
import QuantitySelector from '../../components/QuantitySelector';
import { TRAVEL_PANEL, TravelToolbar } from './travelUi';

interface TravelPageProps {
  onImageSelected: (file: File) => void;
}

const TravelPage: React.FC<TravelPageProps> = ({ onImageSelected }) => {
  const { t } = useLanguage();
  const _navigate = useNavigate();
  const tr = useTravel();
  const [viewMode, setViewMode] = React.useState<'list' | 'map'>('map');

  const sceneLabel = React.useMemo(() => {
    if (tr.selectedSceneId === 'custom') return t('travel.custom_btn');
    if (tr.selectedSceneId === 'random')
      return t('travel.random_scene') || t('travel.map_instruction');
    const scene = tr.scenesAll.find((s) => s.id === tr.selectedSceneId);
    return scene ? t(scene.nameKey) : t('travel.map_instruction');
  }, [tr.selectedSceneId, tr.scenesAll, t]);

  const sceneCatalogProps = {
    scenesInternational: tr.scenesInternational,
    scenesTaiwan: tr.scenesTaiwan,
    scenesLoading: tr.scenesLoading,
  };

  const instruction =
    viewMode === 'list' ? t('travel.list_instruction') : t('travel.map_instruction');

  const handleEditInEditor = (result: string, index?: number) => {
    if (!result) return;
    onImageSelected(
      dataURLtoFile(result, `travel-photo-${index !== undefined ? index + 1 : 1}.png`),
    );
  };

  return (
    <div
      className={`w-full max-w-7xl mx-auto text-center p-4 md:p-6 transition-colors duration-300 ${TRAVEL_PANEL}`}
    >
      <div className="flex flex-col items-center gap-6 motion-safe:animate-fade-in text-left">
        <header className="text-center w-full space-y-3">
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl">
            <span className="bg-gradient-to-r from-sky-200 via-cyan-100 to-sky-300 bg-clip-text text-transparent">
              {t('travel.title')}
            </span>
          </h1>
          <p className="max-w-3xl text-lg text-slate-300 md:text-xl leading-relaxed mx-auto">
            {t('travel.subtitle')}
          </p>
        </header>

        {tr.results && tr.results.length > 0 ? (
          <div className="w-full flex flex-col gap-6 motion-safe:animate-fade-in">
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={tr.handleBatchDownload}
                className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-500 transition-colors duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 focus:ring-offset-slate-900"
              >
                <DownloadIcon className="w-5 h-5" />
                {t('history.batch_download')} ({tr.results.length})
              </button>
              <button
                type="button"
                onClick={tr.clearResult}
                className="px-6 py-3 bg-slate-700/80 border border-slate-600 text-white rounded-xl font-bold hover:bg-slate-600 transition-colors duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-offset-2 focus:ring-offset-slate-900"
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
          <ProgressIndicator progress={tr.progress} statusMessages={['travel.generating']} />
        ) : (
          <div className="w-full flex flex-col gap-6">
            <TravelToolbar
              sceneLabel={sceneLabel}
              instruction={instruction}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              mapLabel={t('travel.map_world')}
              listLabel={t('travel.list_view')}
              surpriseHint={t('travel.surprise_me')}
            />

            <div
              className={`w-full ${viewMode === 'map' ? 'flex flex-col gap-6' : 'grid grid-cols-1 lg:grid-cols-2 gap-6 items-start'}`}
            >
              <div className={viewMode === 'map' ? 'w-full' : 'space-y-4'}>
                {viewMode === 'map' ? (
                  <div className="flex flex-col gap-6">
                    <TravelMapContainer
                      {...sceneCatalogProps}
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
                      {...sceneCatalogProps}
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
                    {...sceneCatalogProps}
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
