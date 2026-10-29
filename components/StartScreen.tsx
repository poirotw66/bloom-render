/**
 * @license
 * SPDX-License-Identifier: MIT
 */

import React, { Suspense, lazy, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ROUTES } from '../constants/routes';
import { readHistoryReplayState } from '../utils/historyReplay';
import Spinner from './Spinner';
import UploadStartScreen from './UploadStartScreen';

const GenerateStartScreen = lazy(() => import('./GenerateStartScreen'));

export interface StartScreenProps {
  tab: 'upload' | 'generate';
  onImageSelected: (file: File) => void;
  navigate: (path: string) => void;
}

export default function StartScreen(props: StartScreenProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const generateReplay = readHistoryReplayState(location.state)?.type === 'generate';
  const legacyReplay = props.tab === 'upload' && generateReplay;
  const [generation, setGeneration] = useState(() => ({
    visited: props.tab === 'generate',
    replayKey: props.tab === 'generate' && generateReplay ? location.key : null,
  }));

  // Tab switches preserve drafts/results. An explicit replay intentionally starts
  // a fresh generator so its one-shot history consumer can apply the new payload.
  if (
    props.tab === 'generate' &&
    (!generation.visited || (generateReplay && generation.replayKey !== location.key))
  ) {
    setGeneration({
      visited: true,
      replayKey: generateReplay ? location.key : generation.replayKey,
    });
  }

  useEffect(() => {
    if (!legacyReplay) return;
    navigate(ROUTES.GENERATE + location.search, { replace: true, state: location.state });
  }, [legacyReplay, location.search, location.state, navigate]);

  return (
    <>
      <UploadStartScreen
        active={props.tab === 'upload' && !legacyReplay}
        onImageSelected={props.onImageSelected}
      />
      {(props.tab === 'generate' || generation.visited) && !legacyReplay && (
        <Suspense fallback={props.tab === 'generate' ? <Spinner /> : null}>
          <GenerateStartScreen
            key={generation.replayKey ?? 'initial'}
            active={props.tab === 'generate'}
            {...props}
          />
        </Suspense>
      )}
    </>
  );
}
