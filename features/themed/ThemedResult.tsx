/**
 * @license
 * SPDX-License-Identifier: MIT
 */

import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import GenericResult from '../../components/GenericResult';

interface ThemedResultProps {
  themedResult: string;
  originalUrl?: string | null;
  themeType: string;
  onAgain: () => void;
  hideAgain?: boolean;
  onEditInEditor: () => void;
}

const ThemedResult: React.FC<ThemedResultProps> = ({
  themedResult,
  originalUrl,
  themeType,
  onAgain,
  hideAgain = false,
  onEditInEditor,
}) => {
  const { t } = useLanguage();

  const themeNameKey = `service.item.${themeType.replace(/-/g, '_')}.name`;

  return (
    <GenericResult
      result={themedResult}
      originalUrl={originalUrl}
      onAgain={onAgain}
      hideAgain={hideAgain}
      onEditInEditor={onEditInEditor}
      fileBaseName="themed"
      paramsTitleKey="idphoto.result.params_title"
      params={[{ labelKey: 'themed.label.type', value: t(themeNameKey) }]}
    />
  );
};

export default ThemedResult;
