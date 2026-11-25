/**
 * @license
 * SPDX-License-Identifier: MIT
 */
import React, { Suspense, lazy, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import HeaderLoadingDialog from './HeaderLoadingDialog';
import HomeHeader from './HomeHeader';
import ToolHeader from './ToolHeader';
import { ROUTES } from '../constants/routes';
import {
  closeSettingsPanel,
  openSettingsPanel,
  useSettingsPanelOpen,
} from '../utils/settingsPanel';

const SettingsModal = lazy(() => import('./SettingsModal'));
const HistoryPanel = lazy(() => import('./HistoryPanel'));

interface HeaderProps {
  onImageSelected?: (file: File) => void;
}

const Header: React.FC<HeaderProps> = ({ onImageSelected }) => {
  const { t } = useLanguage();
  // Shared store rather than local state: the API-key notice on feature pages
  // opens this dialog too.
  const isSettingsOpen = useSettingsPanelOpen();
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const location = useLocation();

  return (
    <>
      {location.pathname === ROUTES.HOME ? (
        <HomeHeader settingsOpen={isSettingsOpen} onOpenHistory={() => setIsHistoryOpen(true)} />
      ) : (
        <ToolHeader
          settingsOpen={isSettingsOpen}
          historyOpen={isHistoryOpen}
          onOpenHistory={() => setIsHistoryOpen(true)}
          onOpenSettings={openSettingsPanel}
        />
      )}
      {(isSettingsOpen || isHistoryOpen) && (
        <Suspense
          fallback={
            <HeaderLoadingDialog
              label={t(isSettingsOpen ? 'settings.title' : 'history.title')}
              onClose={() => {
                closeSettingsPanel();
                setIsHistoryOpen(false);
              }}
            />
          }
        >
          {isSettingsOpen && <SettingsModal isOpen onClose={closeSettingsPanel} />}
          {isHistoryOpen && (
            <HistoryPanel
              isOpen
              onClose={() => setIsHistoryOpen(false)}
              onImageSelected={onImageSelected}
            />
          )}
        </Suspense>
      )}
    </>
  );
};

export default React.memo(Header);
