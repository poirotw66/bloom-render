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

      if ('f' in payload && payload.f === 'restore') {
        navigate(ROUTES.RESTORE, {
          replace: true,
          state: { restorePreset: { colorize: payload.p !== 'restore-only' } },
        });
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
        if (cancelled) return;
        const state: EditorLocationState = {
          awaitUpload: !isDemoMode,
          galleryPreset: editorPreset,
        };
        // Demo without a concrete viral template id: still land on editor upload.
        navigate(ROUTES.EDIT, { state, replace: true });
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
      <div className="flex flex-col items-center gap-4 py-16 text-center px-4">
        <p className="text-red-300" role="alert">
          {error}
        </p>
        <button
          type="button"
          className="underline text-sm theme-ink"
          onClick={() => navigate(ROUTES.HOME)}
        >
          {t('viral.remix_home')}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3 py-16" data-testid="remix-loading">
      <Spinner />
      <p className="text-sm theme-ink-muted">{t('viral.remix_loading')}</p>
    </div>
  );
};

export default RemixPage;
