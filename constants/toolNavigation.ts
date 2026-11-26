import { ROUTES } from './routes';

export type ToolNavigationItem = { path: string; labelKey: string; detailKey?: string };
export type ToolNavigationGroup = {
  id: 'create' | 'photo' | 'library';
  label: { 'zh-TW': string; en: string };
  items: readonly ToolNavigationItem[];
};

export const TOOL_NAVIGATION: readonly ToolNavigationGroup[] = [
  {
    id: 'create',
    label: { 'zh-TW': '創作工作台', en: 'Create' },
    items: [
      { path: ROUTES.TRY_ON, labelKey: 'start.tab_tryon' },
      { path: ROUTES.HOME, labelKey: 'start.tab_upload' },
      { path: ROUTES.GENERATE, labelKey: 'start.tab_generate' },
      { path: ROUTES.PHOTOGRAPHY_SERVICE, labelKey: 'start.tab_service' },
    ],
  },
  {
    id: 'photo',
    label: { 'zh-TW': '照片工具', en: 'Photo tools' },
    items: [
      { path: ROUTES.ID_PHOTO, labelKey: 'start.tab_idphoto' },
      { path: ROUTES.ID_PHOTO_BATCH, labelKey: 'start.tab_idphoto', detailKey: 'batch.title' },
      { path: ROUTES.PORTRAIT, labelKey: 'start.tab_portrait' },
      { path: ROUTES.TRAVEL, labelKey: 'start.tab_travel' },
      { path: ROUTES.THEMED, labelKey: 'start.tab_themed' },
      { path: ROUTES.COUPLE_GROUP, labelKey: 'start.tab_couple_group' },
      { path: ROUTES.MULTI_PERSON, labelKey: 'viral.open_multi_person' },
      { path: ROUTES.STYLE_COLLAGE, labelKey: 'viral.open_collage' },
      { path: ROUTES.ENHANCE, labelKey: 'start.tab_enhance' },
      { path: ROUTES.RESTORE, labelKey: 'start.tab_restore' },
    ],
  },
  {
    id: 'library',
    label: { 'zh-TW': '素材與作品', en: 'Your library' },
    items: [
      { path: ROUTES.MATERIALS, labelKey: 'materials.title' },
      { path: ROUTES.PROMPT_GALLERY, labelKey: 'prompt_gallery.title' },
      { path: ROUTES.HISTORY, labelKey: 'history.title' },
    ],
  },
];
