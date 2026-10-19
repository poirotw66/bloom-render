/**
 * @license
 * SPDX-License-Identifier: MIT
 *
 * Consume one-shot history "Generate again" navigation state.
 */

import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { readHistoryReplayState } from '../utils/historyReplay';

/**
 * Reads `bloomHistoryReplay` from router state once, invokes `apply`, then
 * clears the state so a refresh does not re-apply.
 */
export function useHistoryReplay(
  apply: (payload: { type: string; options?: Record<string, unknown>; sourceUrl?: string }) => void,
): void {
  const location = useLocation();
  const navigate = useNavigate();
  const appliedRef = useRef(false);

  useEffect(() => {
    if (appliedRef.current) return;
    const payload = readHistoryReplayState(location.state);
    if (!payload) return;
    appliedRef.current = true;
    apply(payload);
    navigate(location.pathname + location.search, { replace: true, state: null });
  }, [apply, location.pathname, location.search, location.state, navigate]);
}

/** Turn a source object/data URL into a File for re-upload fields. */
export async function fileFromSourceUrl(
  sourceUrl: string,
  fileName = 'replay-source.png',
): Promise<File> {
  const res = await fetch(sourceUrl);
  const blob = await res.blob();
  const type = blob.type || 'image/png';
  return new File([blob], fileName, { type });
}
