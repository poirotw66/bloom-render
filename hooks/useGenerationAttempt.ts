/**
 * @license
 * SPDX-License-Identifier: MIT
 */

import { useCallback, useEffect, useMemo, useRef } from 'react';

export interface GenerationAttempt {
  signal: AbortSignal;
  isCurrent: () => boolean;
  onCleanup: (cleanup: () => void) => void;
}

type ActiveAttempt = GenerationAttempt & {
  controller: AbortController;
  cleanups: Set<() => void>;
};

/** Own preparation, progress timers and caller-side effects around a generation run. */
export function useGenerationAttempt() {
  const active = useRef<ActiveAttempt | null>(null);
  const mounted = useRef(true);

  const cancel = useCallback(() => {
    const previous = active.current;
    active.current = null;
    if (!previous) return;
    previous.controller.abort();
    for (const cleanup of previous.cleanups) cleanup();
    previous.cleanups.clear();
  }, []);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      cancel();
    };
  }, [cancel]);

  const begin = useCallback((): GenerationAttempt => {
    cancel();
    const controller = new AbortController();
    if (!mounted.current) controller.abort();
    const attempt: ActiveAttempt = {
      controller,
      signal: controller.signal,
      cleanups: new Set(),
      isCurrent: () => mounted.current && active.current === attempt && !controller.signal.aborted,
      onCleanup: (cleanup) => {
        if (attempt.isCurrent()) attempt.cleanups.add(cleanup);
        else cleanup();
      },
    };
    if (mounted.current) active.current = attempt;
    return attempt;
  }, [cancel]);

  const finish = useCallback((attempt: GenerationAttempt) => {
    if (active.current !== attempt) return;
    const current = active.current;
    active.current = null;
    for (const cleanup of current.cleanups) cleanup();
    current.cleanups.clear();
  }, []);

  return useMemo(() => ({ begin, cancel, finish }), [begin, cancel, finish]);
}
