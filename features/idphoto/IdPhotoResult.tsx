/**
 * @license
 * SPDX-License-Identifier: MIT
 */

import React, { useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useSettings } from '../../contexts/SettingsContext';
import { MODEL_LABEL_KEYS } from '../../constants/models';
import GenericResult from '../../components/GenericResult';
import {
  ID_PHOTO_TYPES,
  RETOUCH_LEVELS,
  OUTPUT_SPECS,
  CLOTHING_OPTIONS,
} from '../../constants/idPhoto';
import type {
  IdPhotoType,
  RetouchLevel,
  OutputSpec,
  ClothingOption,
} from '../../constants/idPhoto';
import { getIdPhotoSizePreset, type IdPhotoSizeId } from '../../constants/idPhotoSizes';
import { UI_BTN_SECONDARY } from '../../utils/uiClasses';
import { logger } from '../../utils/logger';

interface IdPhotoResultProps {
  idPhotoResult: string;
  originalUrl?: string | null;
  idPhotoType: IdPhotoType;
  idPhotoRetouchLevel: RetouchLevel;
  idPhotoOutputSpec: OutputSpec;
  idPhotoSizeId: IdPhotoSizeId;
  idPhotoClothingOption: ClothingOption;
  onAgain: () => void;
  hideAgain?: boolean;
  onEditInEditor: () => void;
  onDownloadPrintSheetJpg: (source?: string | null) => Promise<void>;
  onDownloadPrintSheetPdf: (source?: string | null) => Promise<void>;
}

const IdPhotoResult: React.FC<IdPhotoResultProps> = ({
  idPhotoResult,
  originalUrl,
  idPhotoType,
  idPhotoRetouchLevel,
  idPhotoOutputSpec,
  idPhotoSizeId,
  idPhotoClothingOption,
  onAgain,
  hideAgain = false,
  onEditInEditor,
  onDownloadPrintSheetJpg,
  onDownloadPrintSheetPdf,
}) => {
  const { t } = useLanguage();
  const settings = useSettings();
  const [busy, setBusy] = useState<'jpg' | 'pdf' | null>(null);
  const sizePreset = getIdPhotoSizePreset(idPhotoSizeId);

  const runExport = async (kind: 'jpg' | 'pdf') => {
    setBusy(kind);
    try {
      if (kind === 'jpg') await onDownloadPrintSheetJpg(idPhotoResult);
      else await onDownloadPrintSheetPdf(idPhotoResult);
    } catch (err) {
      logger.error('ID photo print sheet export failed:', err);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      <GenericResult
        result={idPhotoResult}
        originalUrl={originalUrl}
        onAgain={onAgain}
        hideAgain={hideAgain}
        onEditInEditor={onEditInEditor}
        fileBaseName="id-photo"
        paramsTitleKey="idphoto.result.params_title"
        params={[
          {
            labelKey: 'idphoto.label.type',
            value: t(ID_PHOTO_TYPES.find((x) => x.id === idPhotoType)?.nameKey ?? ''),
          },
          {
            labelKey: 'idphoto.label.level',
            value: t(RETOUCH_LEVELS.find((x) => x.id === idPhotoRetouchLevel)?.nameKey ?? ''),
          },
          {
            labelKey: 'idphoto.label.spec',
            value: t(OUTPUT_SPECS.find((x) => x.id === idPhotoOutputSpec)?.nameKey ?? ''),
          },
          {
            labelKey: 'idphoto.label.print_size',
            value: t(sizePreset.nameKey),
          },
          {
            labelKey: 'idphoto.label.clothing',
            value: t(CLOTHING_OPTIONS.find((x) => x.id === idPhotoClothingOption)?.nameKey ?? ''),
          },
          {
            labelKey: 'settings.model',
            value:
              settings.imageProvider === 'gemini'
                ? t(MODEL_LABEL_KEYS[settings.model])
                : settings.effectiveModel,
          },
        ]}
      />

      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          className={UI_BTN_SECONDARY}
          disabled={busy !== null}
          onClick={() => void runExport('jpg')}
        >
          {busy === 'jpg'
            ? t('idphoto.print_sheet.exporting')
            : t('idphoto.print_sheet.download_jpg')}
        </button>
        <button
          type="button"
          className={UI_BTN_SECONDARY}
          disabled={busy !== null}
          onClick={() => void runExport('pdf')}
        >
          {busy === 'pdf'
            ? t('idphoto.print_sheet.exporting')
            : t('idphoto.print_sheet.download_pdf')}
        </button>
      </div>
      <p className="text-xs theme-ink-muted text-center max-w-md">
        {t('idphoto.print_sheet.hint')}
      </p>
    </div>
  );
};

export default IdPhotoResult;
