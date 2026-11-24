/** @license SPDX-License-Identifier: MIT */
import { useLayoutEffect } from 'react';
import { publicAssetUrl } from '../utils/publicAsset';

interface MotionKit {
  refresh: () => void;
}
interface MomentsKit {
  mountAll: (root: HTMLElement) => Promise<unknown>;
  unmountAll: (root: HTMLElement) => void;
}

interface HomeDesignKit {
  motion: MotionKit;
  moments: MomentsKit;
}

declare global {
  interface Window {
    bloomHomeDesign?: HomeDesignKit;
  }
}

let kitPromise: Promise<HomeDesignKit> | undefined;

function loadHomeDesign(): Promise<HomeDesignKit> {
  if (kitPromise) return kitPromise;
  const script = document.createElement('script');
  script.type = 'module';
  script.src = publicAssetUrl('assets/home-design.js');
  kitPromise = new Promise<HomeDesignKit>((resolve, reject) => {
    script.onload = () => {
      if (window.bloomHomeDesign) resolve(window.bloomHomeDesign);
      else reject(new Error('Homepage design kit did not initialize'));
    };
    script.onerror = () => reject(new Error('Homepage design kit failed to load'));
    document.head.append(script);
  }).catch((error: unknown) => {
    script.remove();
    kitPromise = undefined;
    throw error;
  });
  return kitPromise;
}

/** Keep the design kit scoped to the landing page and release its canvas on navigation. */
export function useHomeDesign() {
  useLayoutEffect(() => {
    const html = document.documentElement;
    const hadEntrance = html.classList.contains('m-enter');
    const hadEntranceFallback = html.classList.contains('m-enter-done');
    html.classList.add('m-enter');
    const entranceFallback = window.setTimeout(() => html.classList.add('m-enter-done'), 700);
    const attributes = {
      'data-type': 'software',
      'data-radius': 'soft',
      'data-buttons': 'arrow',
      'data-motion': '',
      'data-home': '',
    };
    const previous = Object.keys(attributes).map(
      (name) => [name, html.getAttribute(name)] as const,
    );
    for (const [name, value] of Object.entries(attributes)) html.setAttribute(name, value);
    const stylesheet = document.createElement('link');
    stylesheet.rel = 'stylesheet';
    stylesheet.href = publicAssetUrl('assets/taste/motion/motion.css');
    document.head.append(stylesheet);
    let cancelled = false;
    let moments: MomentsKit | undefined;
    const root = document.querySelector<HTMLElement>('.home-main');
    void loadHomeDesign()
      .then(async ({ motion, moments: kit }) => {
        if (cancelled || !root) return;
        motion.refresh();
        moments = kit;
        await kit.mountAll(root);
        if (cancelled) kit.unmountAll(root);
      })
      .catch(() => {
        /* The original photograph is the static fallback. */
      });
    return () => {
      cancelled = true;
      window.clearTimeout(entranceFallback);
      if (!hadEntrance) html.classList.remove('m-enter');
      if (!hadEntranceFallback) html.classList.remove('m-enter-done');
      if (root) moments?.unmountAll(root);
      stylesheet.remove();
      for (const [name, value] of previous) {
        if (value === null) html.removeAttribute(name);
        else html.setAttribute(name, value);
      }
    };
  }, []);
}
