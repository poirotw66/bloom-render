/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { dataURLtoFile } from '../../utils/fileUtils';
import { ROUTES } from '../../constants/routes';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';
import ApiKeyNotice from '../../components/ApiKeyNotice';
import ProgressIndicator from '../../components/ProgressIndicator';
import { useIdPhoto } from './useIdPhoto';
import IdPhotoForm from './IdPhotoForm';
import IdPhotoUploadSection from './IdPhotoUploadSection';
import IdPhotoResult from './IdPhotoResult';
import QuantitySelector from '../../components/QuantitySelector';
import GenerationFailureNotice from '../../components/GenerationFailureNotice';
import {
  UI_BTN_GHOST,
  UI_BTN_SECONDARY,
  UI_BTN_SUCCESS,
  UI_PAGE,
  UI_SUBTITLE,
  UI_TITLE,
  getPageSurface,
  getTitleAccent,
} from '../../utils/uiClasses';

interface IdPhotoPageProps {
  onImageSelected: (file: File) => void;
}

const IdPhotoPage: React.FC<IdPhotoPageProps> = ({ onImageSelected }) => {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const id = useIdPhoto();

  /** Nothing generated yet: the form is showing, so there is room for examples. */
  const isEmptyState =
    !id.idPhotoResult &&
    (!id.idPhotoResults || id.idPhotoResults.length === 0) &&
    !id.idPhotoLoading;

  const handleEditInEditor = (result: string, index?: number) => {
    if (!result) return;
    const filename = index !== undefined ? `id-photo-${index + 1}.png` : 'id-photo-export.png';
    onImageSelected(dataURLtoFile(result, filename));
  };

  return (
    <div className={`${UI_PAGE} ${getPageSurface(theme)}`}>
      <div className="flex flex-col items-center gap-6 animate-fade-in">
        <h1 className={UI_TITLE}>
          <span className={getTitleAccent(theme)}>{t('idphoto.title')}</span>
        </h1>
        <p className={UI_SUBTITLE}>{t('idphoto.subtitle')}</p>

        <ApiKeyNotice />

        {isEmptyState && (
          <div className="w-full flex justify-center">
            <button
              type="button"
              onClick={() => navigate(ROUTES.ID_PHOTO_BATCH)}
              className={UI_BTN_GHOST}
            >
              {t('batch.title')}
            </button>
          </div>
        )}

        {id.idPhotoResults && id.idPhotoResults.length > 0 ? (
          <div className="w-full flex flex-col gap-6">
            <GenerationFailureNotice
              failures={id.failures}
              requestedCount={id.requestedCount}
              succeededCount={id.succeededCount}
              isRetrying={id.isRetrying}
              onRetry={id.handleRetryFailed}
              context="idphoto"
            />
            <div className="flex items-center justify-center gap-4">
              <button
                type="button"
                onClick={id.handleIdPhotoBatchDownload}
                className={UI_BTN_SUCCESS}
              >
                💾 {t('history.batch_download')} ({id.idPhotoResults.length})
              </button>
              <button type="button" onClick={id.clearIdPhotoResult} className={UI_BTN_SECONDARY}>
                {t('start.idphoto_again')}
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6 w-full">
              {id.idPhotoResults.map((result, idx) => (
                <IdPhotoResult
                  key={idx}
                  idPhotoResult={result}
                  idPhotoType={id.idPhotoType}
                  idPhotoRetouchLevel={id.idPhotoRetouchLevel}
                  idPhotoOutputSpec={id.idPhotoOutputSpec}
                  idPhotoClothingOption={id.idPhotoClothingOption}
                  onDownload={() => {
                    const link = document.createElement('a');
                    link.href = result;
                    link.download = `id-photo-${idx + 1}.png`;
                    link.click();
                  }}
                  onAgain={id.clearIdPhotoResult}
                  onEditInEditor={() => handleEditInEditor(result, idx)}
                />
              ))}
            </div>
          </div>
        ) : id.idPhotoResult ? (
          <IdPhotoResult
            idPhotoResult={id.idPhotoResult}
            idPhotoType={id.idPhotoType}
            idPhotoRetouchLevel={id.idPhotoRetouchLevel}
            idPhotoOutputSpec={id.idPhotoOutputSpec}
            idPhotoClothingOption={id.idPhotoClothingOption}
            onDownload={id.handleIdPhotoDownload}
            onAgain={id.clearIdPhotoResult}
            onEditInEditor={() => handleEditInEditor(id.idPhotoResult!)}
          />
        ) : id.idPhotoLoading ? (
          <ProgressIndicator
            progress={id.progress}
            statusMessages={['start.idphoto_generating']}
            onCancel={id.cancelGeneration}
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
