/** Catalog fields are asset loads. Attribution links are checked separately. */
export const ASSET_CATALOGS = [
  { file: 'constants/tryOnMaterials.json', field: 'image', kind: 'materials', required: true },
  { file: 'gallery', field: 'thumbnail', kind: 'gallery', required: false },
  {
    file: 'constants/travel-data/scenes-taiwan.json',
    field: 'referenceImagePath',
    kind: 'scenes',
    required: false,
  },
  {
    file: 'constants/travel-data/scenes-international.json',
    field: 'referenceImagePath',
    kind: 'scenes',
    required: false,
  },
  {
    file: 'constants/viralTemplateCards.ts',
    field: 'thumbnail',
    kind: 'typescript',
    required: true,
  },
  {
    file: 'constants/examples.ts',
    field: ['src', 'beforeSrc', 'afterSrc'],
    kind: 'examples',
    required: true,
  },
];
