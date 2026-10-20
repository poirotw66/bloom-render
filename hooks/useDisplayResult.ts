/**
 * @license
 * SPDX-License-Identifier: MIT
 *
 * Keep a displayed result in sync with a source, while allowing local enhance
 * (remove-bg / upscale) to override until the source changes.
 */

import { useCallback, useEffect, useState } from 'react';

export function useDisplayResult(source: string): {
  displayResult: string;
  onEnhanced: (dataUrl: string) => void;
  resetEnhanced: () => void;
} {
  const [override, setOverride] = useState<string | null>(null);

  useEffect(() => {
    setOverride(null);
  }, [source]);

  const onEnhanced = useCallback((dataUrl: string) => {
    setOverride(dataUrl);
  }, []);

  const resetEnhanced = useCallback(() => {
    setOverride(null);
  }, []);

  return {
    displayResult: override ?? source,
    onEnhanced,
    resetEnhanced,
  };
}
