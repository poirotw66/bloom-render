/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Main page for couple/group photo feature.
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { dataURLtoFile } from '../../utils/fileUtils';
import { useLanguage } from '../../contexts/LanguageContext';
import StartTabNav from '../../components/StartTabNav';
import Spinner from '../../components/Spinner';
import CoupleGroupModeTabs from './CoupleGroupModeTabs';
import CoupleGroupStyleSelector from './CoupleGroupStyleSelector';
import CoupleGroupUploadSection from './CoupleGroupUploadSection';
import CoupleGroupResult from './CoupleGroupResult';
import { useCoupleGroup } from './useCoupleGroup';
import QuantitySelector from '../../components/QuantitySelector';

interface CoupleGroupPageProps {
  onImageSelected: (file: File) => void;
}

const CoupleGroupPage: React.FC<CoupleGroupPageProps> = ({ onImageSelected }) => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const coupleGroup = useCoupleGroup();

  return (
    <div className="w-full max-w-5xl mx-auto text-center p-8 transition-all duration-300 rounded-2xl border-2 border-transparent">
      <div className="flex flex-col items-center gap-6 animate-fade-in">
        <h1 className="text-5xl font-extrabold tracking-tight text-gray-100 sm:text-6xl md:text-7xl">
          {t('couple_group.title_part1')} <span className="text-pink-400">{t('couple_group.title_part2')}</span>
        </h1>
        <p className="max-w-2xl text-lg text-gray-400 md:text-xl">
          {t('couple_group.subtitle')}
        </p>

        <StartTabNav currentTab="couple-group" navigate={navigate} />

        <CoupleGroupModeTabs mode={coupleGroup.mode} onChange={coupleGroup.setMode} />

        {coupleGroup.results && coupleGroup.results.length > 0 ? (
          <div className="w-full flex flex-col gap-6">
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={coupleGroup.handleBatchDownload}
                className="px-6 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-colors"
              >
                💾 {t('history.batch_download')} ({coupleGroup.results.length})
              </button>
              <button
                onClick={coupleGroup.clearResult}
                className="px-6 py-3 bg-gray-700 text-white rounded-xl font-bold hover:bg-gray-600 transition-colors"
              >
                {t('couple_group.again')}
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6 w-full">
              {coupleGroup.results.map((result, idx) => (
                <CoupleGroupResult
                  key={idx}
                  result={result}
                  mode={coupleGroup.mode}
                  style={coupleGroup.style}
                  onDownload={() => {
                    const link = document.createElement('a');
                    link.href = result;
                    link.download = `couple-group-${coupleGroup.mode}-${idx + 1}.png`;
                    link.click();
                  }}
                  onAgain={coupleGroup.clearResult}
                  onEditInEditor={() => {
                    onImageSelected(
                      dataURLtoFile(result, `couple-group-${idx + 1}.png`)
                    );
                  }}
                />
              ))}
            </div>
          </div>
        ) : coupleGroup.result ? (
          <CoupleGroupResult
            result={coupleGroup.result}
            mode={coupleGroup.mode}
            style={coupleGroup.style}
            onDownload={() => {
              if (!coupleGroup.result) return;
              const link = document.createElement('a');
              link.href = coupleGroup.result;
              link.download = `couple-group-${coupleGroup.mode}-${Date.now()}.png`;
              link.click();
            }}
            onAgain={coupleGroup.clearResult}
            onEditInEditor={() => {
              if (!coupleGroup.result) return;
              onImageSelected(
                dataURLtoFile(coupleGroup.result, `couple-group-${Date.now()}.png`)
              );
            }}
          />
        ) : coupleGroup.loading ? (
          <div className="w-full max-w-2xl mx-auto p-8 bg-gray-800/40 rounded-xl border border-gray-700/50 backdrop-blur-sm">
            <Spinner />
            <p className="text-gray-300 mt-4">{t('couple_group.generating')}</p>
          </div>
        ) : (
          <>
            <CoupleGroupStyleSelector
              mode={coupleGroup.mode}
              style={coupleGroup.style}
              onChange={coupleGroup.setStyle}
              disabled={coupleGroup.loading}
            />
            <div className="w-full max-w-md mx-auto">
              <QuantitySelector
                quantity={coupleGroup.quantity}
                onChange={coupleGroup.setQuantity}
                disabled={coupleGroup.loading}
              />
            </div>
            <CoupleGroupUploadSection
              mode={coupleGroup.mode}
              files={coupleGroup.files}
              previewUrls={coupleGroup.previewUrls}
              error={coupleGroup.error}
              loading={coupleGroup.loading}
              isDraggingOver={coupleGroup.isDraggingOver}
              onFileChange={coupleGroup.handleFileChange}
              onGenerate={coupleGroup.handleGenerate}
              onRemoveFile={coupleGroup.removeFile}
              onDragOver={coupleGroup.handleDragOver}
              onDragLeave={coupleGroup.handleDragLeave}
              onDrop={coupleGroup.handleDrop}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default CoupleGroupPage;
