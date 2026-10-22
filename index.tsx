/**
 * @license
 * SPDX-License-Identifier: MIT
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import 'react-image-crop/dist/ReactCrop.css';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { ErrorBoundary } from './components/ErrorBoundary';
import I18nErrorBoundary from './components/I18nErrorBoundary';
import { LanguageProvider } from './contexts/LanguageContext';
import { SettingsProvider } from './contexts/SettingsContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { useBackgroundMotionPause } from './hooks/useBackgroundMotionPause';
import PwaUpdatePrompt from './components/PwaUpdatePrompt';
import { migratePixshopToBloomKeys } from './utils/storageMigration';

// Rename legacy pixshop_* keys before any provider reads storage.
migratePixshopToBloomKeys();

function AppWithMotionPause() {
  useBackgroundMotionPause();
  return (
    <>
      <App />
      <PwaUpdatePrompt />
    </>
  );
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Could not find root element to mount to');
}

const basename = (import.meta.env.BASE_URL || '/').replace(/\/$/, '') || '/';

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter basename={basename}>
        <ThemeProvider>
          <SettingsProvider>
            <LanguageProvider>
              <I18nErrorBoundary>
                <AppWithMotionPause />
              </I18nErrorBoundary>
            </LanguageProvider>
          </SettingsProvider>
        </ThemeProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>,
);
