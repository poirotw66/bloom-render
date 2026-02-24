/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import GenericResult from '../../components/GenericResult';

interface ThemedResultProps {
  themedResult: string;
  themeType: string;
  onDownload: () => void;
  onAgain: () => void;
  onEditInEditor: () => void;
}

const ThemedResult: React.FC<ThemedResultProps> = ({
  themedResult,
  themeType,
  onDownload,
  onAgain,
  onEditInEditor,
}) => {
  const { t } = useLanguage();

  const themeNameKey = `service.item.${themeType.replace(/-/g, '_')}.name`;

  return (
    <GenericResult
      result={themedResult}
      onDownload={onDownload}
      onAgain={onAgain}
      onEditInEditor={onEditInEditor}
      paramsTitleKey="idphoto.result.params_title"
      params={[{ labelKey: 'themed.label.type', value: t(themeNameKey) }]}
    />
  );
};

export default ThemedResult;
