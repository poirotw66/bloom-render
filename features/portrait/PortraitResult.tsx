/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import GenericResult from '../../components/GenericResult';

interface PortraitResultProps {
  portraitResult: string;
  portraitType: string;
  portraitOutputSpec: string;
  onDownload: () => void;
  onAgain: () => void;
  onEditInEditor: () => void;
}

const PortraitResult: React.FC<PortraitResultProps> = ({
  portraitResult,
  portraitType,
  portraitOutputSpec,
  onDownload,
  onAgain,
  onEditInEditor,
}) => {
  const { t } = useLanguage();

  return (
    <GenericResult
      result={portraitResult}
      onDownload={onDownload}
      onAgain={onAgain}
      onEditInEditor={onEditInEditor}
      paramsTitleKey="idphoto.result.params_title"
      params={[
        { labelKey: 'portrait.label.type', value: t(`portrait.type.${portraitType}`) },
        { labelKey: 'portrait.label.spec', value: t(`portrait.spec.${portraitOutputSpec}`) },
      ]}
    />
  );
};

export default PortraitResult;
