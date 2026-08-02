/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * "Here is what this feature produces", shown on a feature page before the
 * visitor has produced anything themselves.
 *
 * Every image is loading="lazy": the showcase sits below the form, so it must
 * not compete with the form for bandwidth on first paint.
 *
 * Sizing is driven by a shared height cap rather than by width, because the
 * crops range from 1.8:1 landscape to 0.56:1 portrait. Fitting them to a common
 * width makes a landscape example render as a thin strip next to a portrait one
 * three times its height; fitting them to a common height keeps a row readable
 * whatever mix it holds.
 */

import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { publicAssetUrl } from '../utils/publicAsset';
import CompareSlider from './CompareSlider';
import { FEATURE_EXAMPLES, type ExampleFeature, type ExampleItem } from '../constants/examples';

interface ExampleShowcaseProps {
  feature: ExampleFeature;
  className?: string;
}

/**
 * Shrink-wraps its image (`w-fit`) instead of filling its container: a portrait
 * crop in a half-width grid cell would otherwise sit in a wide box with black
 * bars either side, which reads as part of the picture.
 *
 * Centring is deliberately NOT in here. `mx-auto` on a flex child resolves to
 * auto margins that soak up the row's free space, which shoves the two halves
 * of a before/after pair to opposite ends with the arrow marooned between them.
 * Only the single-image case, whose frame is a block in a grid cell, adds it.
 */
const FRAME =
  'rounded-xl overflow-hidden border border-gray-700/60 bg-gray-950 flex items-center justify-center w-fit max-w-full';

const BADGE =
  'absolute top-2 left-2 px-2 py-0.5 rounded-full bg-black/70 text-white text-[10px] font-bold';

const ExampleImage: React.FC<{ src: string; alt: string; heightClass: string }> = ({
  src,
  alt,
  heightClass,
}) => (
  <img
    src={publicAssetUrl(src)}
    alt={alt}
    loading="lazy"
    decoding="async"
    className={`block w-auto max-w-full object-contain ${heightClass}`}
  />
);

const Caption: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <figcaption className="text-xs text-gray-400 text-center">{children}</figcaption>
);

const ShowcaseItem: React.FC<{ item: ExampleItem }> = ({ item }) => {
  const { t } = useLanguage();
  const caption = t(item.captionKey);

  if (item.kind === 'compare') {
    return (
      <figure className="flex flex-col gap-2">
        {/* No overflow-hidden on this frame, unlike the others: the drag handle
            is translated half its width past the divider, so clipping the box
            eats half the handle once the divider reaches either end. */}
        <CompareSlider
          originalUrl={publicAssetUrl(item.beforeSrc)}
          currentUrl={publicAssetUrl(item.afterSrc)}
          className="rounded-xl border border-gray-700/60 bg-gray-950"
          imageClassName="max-h-72 w-auto max-w-full rounded-xl"
        />
        <Caption>{caption}</Caption>
      </figure>
    );
  }

  if (item.kind === 'pair') {
    return (
      <figure className="flex flex-col gap-2">
        <div className="flex items-center justify-center gap-3">
          <div className={`${FRAME} relative`}>
            <ExampleImage
              src={item.beforeSrc}
              alt={`${caption} — ${t('examples.before')}`}
              heightClass="h-56"
            />
            <span className={BADGE}>{t('examples.before')}</span>
          </div>
          <span className="text-gray-500 text-xl shrink-0" aria-hidden="true">
            →
          </span>
          <div className={`${FRAME} relative`}>
            <ExampleImage
              src={item.afterSrc}
              alt={`${caption} — ${t('examples.after')}`}
              heightClass="h-56"
            />
            <span className={BADGE}>{t('examples.after')}</span>
          </div>
        </div>
        <Caption>{caption}</Caption>
      </figure>
    );
  }

  return (
    <figure className="flex flex-col gap-2">
      <div className={`${FRAME} mx-auto`}>
        <ExampleImage src={item.src} alt={caption} heightClass="h-56" />
      </div>
      <Caption>{caption}</Caption>
    </figure>
  );
};

/** A pair or a wipe slider needs the full row; a single crop shares one. */
function spanClass(item: ExampleItem): string {
  return item.kind === 'single' ? '' : 'sm:col-span-2';
}

const ExampleShowcase: React.FC<ExampleShowcaseProps> = ({ feature, className = '' }) => {
  const { t } = useLanguage();
  const set = FEATURE_EXAMPLES[feature];
  if (!set) return null;

  return (
    <section
      className={`w-full max-w-3xl mx-auto mt-10 pt-8 border-t border-gray-700/50 ${className}`}
      aria-labelledby={`examples-${feature}`}
    >
      <h2 id={`examples-${feature}`} className="text-sm font-bold text-gray-300 tracking-wide">
        {t(set.titleKey)}
      </h2>
      <p className="text-xs text-gray-500 mt-1">{t('examples.disclaimer')}</p>
      <div className="mt-5 grid gap-5 sm:grid-cols-2">
        {set.items.map((item, index) => (
          <div key={index} className={spanClass(item)}>
            <ShowcaseItem item={item} />
          </div>
        ))}
      </div>
    </section>
  );
};

export default ExampleShowcase;
