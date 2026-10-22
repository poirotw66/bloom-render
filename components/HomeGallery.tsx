/**
 * @license
 * SPDX-License-Identifier: MIT
 *
 * The home page's proof of work: a wall of real output, each tile linking to
 * the feature that made it.
 *
 * The home page used to open on an empty upload box, which asks the visitor to
 * commit a photo before seeing a single result. Leading with the results
 * inverts that — you look first, and each tile is the way in to the feature.
 *
 * Laid out as CSS columns rather than a grid because the crops are a mix of
 * portrait and landscape; a grid would either letterbox them or crop them
 * again.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { publicAssetUrl } from '../utils/publicAsset';
import { HOME_GALLERY } from '../constants/examples';

interface HomeGalleryProps {
  className?: string;
}

const HomeGallery: React.FC<HomeGalleryProps> = ({ className = '' }) => {
  const { t } = useLanguage();

  return (
    <section className={`w-full ${className}`} aria-labelledby="home-gallery-title">
      <div className="text-center mb-6">
        <h2 id="home-gallery-title" className="text-2xl font-bold text-gray-100">
          {t('gallery.title')}
        </h2>
        <p className="mt-2 text-base text-gray-200 max-w-2xl mx-auto">{t('gallery.subtitle')}</p>
      </div>

      {/* Three columns at most. At four, ten tiles leave two columns visibly
          short, because break-inside-avoid stops the balancer from splitting a
          tile to even them out. */}
      <div className="columns-2 md:columns-3 gap-4">
        {HOME_GALLERY.map((example) => (
          <Link
            key={example.src}
            to={example.route}
            className="group mb-4 block break-inside-avoid rounded-xl overflow-hidden bg-gray-950 relative transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 focus-visible:ring-blue-500"
          >
            <img
              src={publicAssetUrl(example.src)}
              alt={t(example.captionKey)}
              loading="lazy"
              decoding="async"
              className="block w-full h-auto"
            />
            {/* Always-on solid label band (not a hover reveal): on touch there
                is no hover, and the label is what tells you where the tile goes. */}
            <div className="absolute inset-x-0 bottom-0 bg-black/85 px-3 pt-3 pb-2.5">
              <span className="block text-sm font-semibold text-white">
                {t(example.featureKey)}
              </span>
              {/* No `block` alongside line-clamp-2: the clamp needs
                  display:-webkit-box, and a second display utility cancels it,
                  which lets a long caption grow until it covers its own tile. */}
              <span className="text-sm text-gray-200 line-clamp-2">{t(example.captionKey)}</span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
};

export default HomeGallery;
