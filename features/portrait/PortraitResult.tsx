/**
 * @license
 * SPDX-License-Identifier: MIT
 */

import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import GenericResult from '../../components/GenericResult';

interface PortraitResultProps {
  portraitResult: string;
  originalUrl?: string | null;
  portraitType: string;
  portraitOutputSpec: string;
  onAgain: () => void;
  onEditInEditor: () => void;
}

const PortraitResult: React.FC<PortraitResultProps> = ({
  portraitResult,
  originalUrl,
  portraitType,
  portraitOutputSpec,
  onAgain,
  onEditInEditor,
}) => {
  const { t } = useLanguage();

  return (
    <GenericResult
      result={portraitResult}
      originalUrl={originalUrl}
      onAgain={onAgain}
      onEditInEditor={onEditInEditor}
      fileBaseName="portrait"
      paramsTitleKey="idphoto.result.params_title"
      params={[
        { labelKey: 'portrait.label.type', value: t(`portrait.type.${portraitType}`) },
        { labelKey: 'portrait.label.spec', value: t(`portrait.spec.${portraitOutputSpec}`) },
      ]}
    />
  );
};

export default PortraitResult;
