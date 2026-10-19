/**
 * @license
 * SPDX-License-Identifier: MIT
 *
 * In demo mode, auto-load bundled public/examples sample inputs so visitors
 * never upload their own photos (outputs are pre-made samples).
 */

import { useEffect, useRef } from 'react';
import { useSettings } from '../contexts/SettingsContext';
import { demoAssetsForFeature, type DemoFeatureKey } from '../services/imageProviders/demoCatalog';
import { fetchPublicImageAsFile } from '../services/imageProviders/demoProvider';
import { logger } from '../utils/logger';

export type DemoSampleSetter = (file: File | null) => void;

/**
 * Load the feature's sample "before" image into `setFile` while demo mode is on.
 * Does nothing for features without a before asset (e.g. text-to-image).
 */
export function useDemoSampleInput(
  feature: DemoFeatureKey,
  setFile: DemoSampleSetter,
  options?: { fileName?: string },
): void {
  const { isDemoMode } = useSettings();
  const loadedKey = useRef<string | null>(null);
  const fileName = options?.fileName ?? `demo-${feature}-sample.webp`;
  const key = `${feature}:${fileName}`;

  useEffect(() => {
    if (!isDemoMode) {
      loadedKey.current = null;
      return;
    }
    if (loadedKey.current === key) return;

    const assets = demoAssetsForFeature(feature);
    if (!assets.before) return;

    let cancelled = false;

    void (async () => {
      try {
        const file = await fetchPublicImageAsFile(assets.before!, fileName);
        if (cancelled) return;
        setFile(file);
        loadedKey.current = key;
      } catch (err) {
        logger.error('Failed to load demo sample input', err);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isDemoMode, feature, fileName, key, setFile]);
}

/**
 * Load N copies of the sample before image (couple = 2, group = 3).
 */
export function useDemoSampleFiles(
  feature: DemoFeatureKey,
  setFiles: (files: File[]) => void,
  count: number,
): void {
  const { isDemoMode } = useSettings();
  const loadedKey = useRef<string | null>(null);
  const key = `${feature}:${count}`;

  useEffect(() => {
    if (!isDemoMode) {
      loadedKey.current = null;
      return;
    }
    if (loadedKey.current === key) return;

    const assets = demoAssetsForFeature(feature);
    if (!assets.before) return;

    let cancelled = false;

    void (async () => {
      try {
        const files: File[] = [];
        for (let i = 0; i < count; i++) {
          files.push(
            await fetchPublicImageAsFile(assets.before!, `demo-${feature}-sample-${i + 1}.webp`),
          );
        }
        if (cancelled) return;
        setFiles(files);
        loadedKey.current = key;
      } catch (err) {
        logger.error('Failed to load demo sample inputs', err);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isDemoMode, feature, count, key, setFiles]);
}

/**
 * Try-on needs a person photo plus at least one clothing image.
 * Reuses the try-on before as the person and a second fetch as clothing.
 */
export function useDemoTryOnSamples(
  setPerson: DemoSampleSetter,
  setClothing: (files: File[]) => void,
): void {
  const { isDemoMode } = useSettings();
  const loadedForDemo = useRef(false);

  useEffect(() => {
    if (!isDemoMode) {
      loadedForDemo.current = false;
      return;
    }
    if (loadedForDemo.current) return;

    const assets = demoAssetsForFeature('tryon');
    if (!assets.before) return;

    let cancelled = false;

    void (async () => {
      try {
        const person = await fetchPublicImageAsFile(assets.before!, 'demo-tryon-person.webp');
        // Garment slot also uses a bundled sample (no separate garment asset).
        const clothing = await fetchPublicImageAsFile(assets.before!, 'demo-tryon-clothing.webp');
        if (cancelled) return;
        setPerson(person);
        setClothing([clothing]);
        loadedForDemo.current = true;
      } catch (err) {
        logger.error('Failed to load demo try-on samples', err);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isDemoMode, setPerson, setClothing]);
}
