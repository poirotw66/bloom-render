/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Real output from this app, shown to visitors who have not generated anything.
 *
 * Without a key (and before the first run with one) every feature page was an
 * empty upload box: the site claimed to showcase image generation but showed
 * none. These are crops of actual runs — the same images the manual documents —
 * so the page has something to show on first paint.
 *
 * Files live in public/examples/ as WebP. See that folder's README for how they
 * were produced.
 */

import { ROUTES } from './routes';

export type ExampleFeature = 'generate' | 'editor' | 'idphoto' | 'portrait' | 'travel' | 'tryon';

interface ExampleBase {
  /** i18n key for the caption under the item; also used as the alt text. */
  captionKey: string;
}

/** One generated image. */
export interface SingleExample extends ExampleBase {
  kind: 'single';
  src: string;
}

/**
 * Input and output at the same aspect ratio, so a wipe between them lines up.
 * Anything else has to be a `pair` — a slider over mismatched images crops one
 * of them and quietly misrepresents the result.
 */
export interface CompareExample extends ExampleBase {
  kind: 'compare';
  beforeSrc: string;
  afterSrc: string;
}

/** Input and output side by side, for before/after at different shapes. */
export interface PairExample extends ExampleBase {
  kind: 'pair';
  beforeSrc: string;
  afterSrc: string;
}

export type ExampleItem = SingleExample | CompareExample | PairExample;

export interface FeatureExampleSet {
  /** i18n key for the section heading. */
  titleKey: string;
  items: ExampleItem[];
}

const url = (name: string) => `examples/${name}.webp`;

export const FEATURE_EXAMPLES: Record<ExampleFeature, FeatureExampleSet> = {
  generate: {
    titleKey: 'examples.generate_title',
    items: [
      { kind: 'single', src: url('generate-1'), captionKey: 'examples.generate_1' },
      { kind: 'single', src: url('generate-2'), captionKey: 'examples.generate_2' },
    ],
  },
  editor: {
    titleKey: 'examples.editor_title',
    items: [
      {
        kind: 'compare',
        beforeSrc: url('editor-before'),
        afterSrc: url('editor-after'),
        captionKey: 'examples.editor_1',
      },
    ],
  },
  idphoto: {
    titleKey: 'examples.idphoto_title',
    items: [
      {
        kind: 'pair',
        beforeSrc: url('idphoto-before'),
        afterSrc: url('idphoto-after'),
        captionKey: 'examples.idphoto_1',
      },
      { kind: 'single', src: url('idphoto-after-2'), captionKey: 'examples.idphoto_2' },
    ],
  },
  portrait: {
    titleKey: 'examples.portrait_title',
    items: [
      { kind: 'single', src: url('portrait-1'), captionKey: 'examples.portrait_1' },
      { kind: 'single', src: url('portrait-2'), captionKey: 'examples.portrait_2' },
    ],
  },
  travel: {
    titleKey: 'examples.travel_title',
    items: [
      { kind: 'single', src: url('travel-1'), captionKey: 'examples.travel_1' },
      { kind: 'single', src: url('travel-2'), captionKey: 'examples.travel_2' },
    ],
  },
  tryon: {
    titleKey: 'examples.tryon_title',
    items: [
      {
        kind: 'pair',
        beforeSrc: url('tryon-before'),
        afterSrc: url('tryon-after'),
        captionKey: 'examples.tryon_1',
      },
      { kind: 'single', src: url('tryon-after-2'), captionKey: 'examples.tryon_2' },
    ],
  },
};

/** A gallery tile on the home page. */
export interface GalleryExample {
  src: string;
  captionKey: string;
  /** i18n key for the feature badge. */
  featureKey: string;
  /** Where the badge sends the visitor. */
  route: string;
}

/**
 * The home page gallery, ordered to alternate shapes rather than to group by
 * feature — a run of five landscape crops reads as one banner, not five results.
 */
export const HOME_GALLERY: GalleryExample[] = [
  {
    src: url('travel-1'),
    captionKey: 'examples.travel_1',
    featureKey: 'start.tab_travel',
    route: ROUTES.TRAVEL,
  },
  {
    src: url('idphoto-after'),
    captionKey: 'examples.idphoto_1',
    featureKey: 'start.tab_idphoto',
    route: ROUTES.ID_PHOTO,
  },
  {
    src: url('portrait-1'),
    captionKey: 'examples.portrait_1',
    featureKey: 'start.tab_portrait',
    route: ROUTES.PORTRAIT,
  },
  {
    src: url('tryon-after'),
    captionKey: 'examples.tryon_1',
    featureKey: 'start.tab_tryon',
    route: ROUTES.TRY_ON,
  },
  {
    src: url('editor-after'),
    captionKey: 'examples.editor_1',
    featureKey: 'start.tab_upload',
    route: ROUTES.HOME,
  },
  {
    src: url('idphoto-after-2'),
    captionKey: 'examples.idphoto_2',
    featureKey: 'start.tab_idphoto',
    route: ROUTES.ID_PHOTO,
  },
  {
    src: url('generate-1'),
    captionKey: 'examples.generate_1',
    featureKey: 'start.tab_generate',
    route: ROUTES.GENERATE,
  },
  {
    src: url('tryon-after-2'),
    captionKey: 'examples.tryon_2',
    featureKey: 'start.tab_tryon',
    route: ROUTES.TRY_ON,
  },
  {
    src: url('travel-2'),
    captionKey: 'examples.travel_2',
    featureKey: 'start.tab_travel',
    route: ROUTES.TRAVEL,
  },
  {
    src: url('portrait-2'),
    captionKey: 'examples.portrait_2',
    featureKey: 'start.tab_portrait',
    route: ROUTES.PORTRAIT,
  },
];
