/**
 * @license
 * SPDX-License-Identifier: MIT
 *
 * /r#<payload> — decode remix hash, stash pending settings, route to the right surface.
 */

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { useSettings } from '../../contexts/SettingsContext';
import { ROUTES } from '../../constants/routes';
import { parseRemixHash } from '../../utils/remixLink';
import { setPendingRemix } from '../../utils/pendingRemix';
import {
  applyViralTemplate,
  remixToGeneratePreset,
  resolveRemixToTemplate,
  remixToEditorPreset,
} from '../../utils/applyViralTemplate';
import { getViralTemplateById } from '../../constants/viralTemplates';
import type { GenerateGalleryLocationState } from '../../utils/applyPromptGalleryPreset';
import type { EditorLocationState } from '../editor/EditorPage';
import { demoAssetsForFeature } from '../../services/imageProviders/demoCatalog';
import { fetchPublicImageAsFile } from '../../services/imageProviders/demoProvider';
import Spinner from '../../components/Spinner';

const RemixPage: React.FC = () => {
  const { t } = useLanguage();
  const { isDemoMode } = useSettings();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      const payload = parseRemixHash(window.location.hash);
      if (!payload) {
        setError(t('viral.remix_invalid'));
        return;
      }
      setPendingRemix(payload);

      const template = resolveRemixToTemplate(payload);
      if (template) {
        await applyViralTemplate(template, navigate, { demoMode: isDemoMode });
        return;
      }

      const generatePreset = remixToGeneratePreset(payload);
      if (generatePreset) {
        const state: GenerateGalleryLocationState = { galleryPreset: generatePreset };
        navigate(ROUTES.GENERATE, { state, replace: true });
        return;
      }

      const editorPreset = remixToEditorPreset(payload);
      if (editorPreset) {
        if (isDemoMode) {
          const before = demoAssetsForFeature('editor').before;
          if (before) {
            const initialFile = await fetchPublicImageAsFile(before, 'remix-editor-sample.webp');
            if (cancelled) return;
            const state: EditorLocationState = {
              initialFile,
              galleryPreset: editorPreset,
            };
            navigate(ROUTES.EDIT, { state, replace: true });
            return;
          }
        }
        navigate(ROUTES.HOME, { state: { remixReady: true }, replace: true });
        return;
      }

      // Unknown template id
      if ('id' in payload && !getViralTemplateById(payload.id)) {
        setError(t('viral.remix_unknown'));
        return;
      }
      navigate(ROUTES.HOME, { replace: true });
    };

    void run().catch(() => {
      if (!cancelled) setError(t('viral.remix_invalid'));
    });

    return () => {
      cancelled = true;
    };
  }, [isDemoMode, navigate, t]);

  if (error) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <p className="theme-ink text-base">{error}</p>
        <button
          type="button"
          className="px-5 py-2.5 rounded-xl brand-bg text-white font-semibold"
          onClick={() => navigate(ROUTES.HOME)}
        >
          {t('viral.remix_home')}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[40vh] gap-3">
      <Spinner />
      <p className="text-sm theme-ink-muted">{t('viral.remix_loading')}</p>
    </div>
  );
};

export default RemixPage;
