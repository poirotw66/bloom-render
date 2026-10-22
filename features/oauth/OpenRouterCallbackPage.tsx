/**
 * @license
 * SPDX-License-Identifier: MIT
 *
 * /oauth/openrouter?code=…&state=… — finish OpenRouter PKCE exchange.
 */

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Spinner from '../../components/Spinner';
import { ROUTES } from '../../constants/routes';
import { useLanguage } from '../../contexts/LanguageContext';
import { useSettings } from '../../contexts/SettingsContext';
import { completeOpenRouterOAuth } from '../../utils/openRouterOAuth';
import { UI_BTN_PRIMARY } from '../../utils/uiClasses';

const OpenRouterCallbackPage: React.FC = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { setOpenRouterApiKey, setImageProvider } = useSettings();
  const [errorKey, setErrorKey] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      const result = await completeOpenRouterOAuth(window.location.search);
      if (cancelled) return;

      if (result.ok) {
        setOpenRouterApiKey(result.key);
        setImageProvider('openrouter');
        navigate(ROUTES.HOME, { replace: true, state: { openRouterOAuth: 'ok' } });
        return;
      }

      const map: Record<typeof result.error, string> = {
        denied: 'openrouter.oauth_denied',
        missing_code: 'openrouter.oauth_missing_code',
        missing_verifier: 'openrouter.oauth_missing_verifier',
        state_mismatch: 'openrouter.oauth_state_mismatch',
        exchange_failed: 'openrouter.oauth_exchange_failed',
      };
      setErrorKey(map[result.error] ?? 'openrouter.oauth_exchange_failed');
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [navigate, setImageProvider, setOpenRouterApiKey]);

  if (errorKey) {
    return (
      <div
        className="flex flex-col items-center gap-4 py-16 text-center max-w-md mx-auto"
        data-testid="openrouter-oauth-error"
      >
        <p className="theme-ink text-base">{t(errorKey)}</p>
        <button type="button" className={UI_BTN_PRIMARY} onClick={() => navigate(ROUTES.HOME)}>
          {t('openrouter.oauth_home')}
        </button>
      </div>
    );
  }

  return (
    <div
      className="flex flex-col items-center justify-center min-h-[40vh] gap-3"
      data-testid="openrouter-oauth-loading"
    >
      <Spinner />
      <p className="text-sm theme-ink-muted">{t('openrouter.oauth_exchanging')}</p>
    </div>
  );
};

export default OpenRouterCallbackPage;
