import { readFileSync } from 'node:fs';
import * as z from 'zod/v4';
import { CLOTHING_CATEGORIES, isValidMaterialClothing } from '../constants/clothingMetadata.mjs';
import {
  POSE_METADATA_FIELDS,
  isValidMaterialPose,
  getPoseSearchText,
  getMaterialPrompt,
  matchesPoseFilters,
} from '../constants/poseMetadata.mjs';

import {
  POSE_REPRESENTATIONS,
  parsePoseReference,
  validatePoseReferences,
  getPoseAlternatives,
  getPairedPoseReference,
} from '../constants/poseReferences.mjs';

export const DEFAULT_SITE_URL = 'https://www.bloss0m.com/bloom-render/';
const roles = ['clothing', 'pose', 'expression', 'scene', 'lighting'];
const language = z.enum(['en', 'zh-TW']).default('zh-TW');
const id = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  .max(64);
const poseShape = {
  groupId: id,
  ...Object.fromEntries(
    Object.entries(POSE_METADATA_FIELDS).map(([field, values]) => [field, z.enum(values)]),
  ),
};
const poseSchema = z.object(poseShape).strict();
const clothingSchema = z.object({ category: z.enum(CLOTHING_CATEGORIES) }).strict();
const poseReferenceSchema = z
  .object({ pairId: id, representation: z.enum(POSE_REPRESENTATIONS) })
  .strict();
function validatePoseRole(material, context) {
  if (
    material.license === 'LicenseRef-AI-Generated' &&
    (material.role !== 'clothing' ||
      (material.image !== undefined
        ? !material.image.endsWith('.png')
        : material.mimeType !== 'image/png' || material.requiresRasterization !== false))
  )
    context.addIssue({
      code: 'custom',
      path: ['license'],
      message: 'AI-generated references must be clothing PNGs with generation provenance.',
    });
  if (!isValidMaterialClothing(material))
    context.addIssue({
      code: 'custom',
      path: ['clothing'],
      message: 'Clothing materials require a category; other roles must omit clothing metadata.',
    });
  if (
    material.poseReference !== undefined &&
    (material.role !== 'pose' || !parsePoseReference(material.poseReference))
  )
    context.addIssue({
      code: 'custom',
      path: ['poseReference'],
      message: 'Paired references require a pose, pair ID and valid representation.',
    });
  if (!isValidMaterialPose(material))
    context.addIssue({
      code: 'custom',
      path: ['pose'],
      message: 'Pose materials require valid pose metadata; other roles must omit it.',
    });
}
export const materialSchema = z
  .object({
    id,
    role: z.enum(roles),
    pose: poseSchema.optional(),
    clothing: clothingSchema.optional(),
    poseReference: poseReferenceSchema.optional(),
    title: z.string(),
    titleZh: z.string(),
    description: z.string(),
    descriptionZh: z.string(),
    image: z.string().regex(/^images\/tryon-materials\/[a-z0-9-]+\.(svg|png|jpe?g|webp)$/),
    prompt: z.string(),
    license: z.enum(['CC0-1.0', 'LicenseRef-AI-Generated']),
    source: z.url(),
  })
  .strict()
  .superRefine(validatePoseRole);
const materials = z
  .array(materialSchema)
  .parse(
    JSON.parse(readFileSync(new URL('../constants/tryOnMaterials.json', import.meta.url), 'utf8')),
  );
const byId = new Map(materials.map((material) => [material.id, material]));
if (byId.size !== materials.length) throw new Error('The material catalog contains duplicate IDs.');
const pairErrors = validatePoseReferences(materials);
if (pairErrors.length) throw new Error(pairErrors.join('\n'));

export const inputSchemas = {
  listCollections: z.object({ language }).strict(),
  searchReferences: z
    .object({
      query: z.string().max(200).default(''),
      role: z.enum(roles).optional(),
      groupId: id.optional(),
      representation: z.enum(POSE_REPRESENTATIONS).optional(),
      ...Object.fromEntries(
        Object.entries(POSE_METADATA_FIELDS).map(([field, values]) => [
          field,
          z.enum(values).optional(),
        ]),
      ),
      offset: z.number().int().min(0).max(Number.MAX_SAFE_INTEGER).default(0),
      limit: z.number().int().min(1).max(50).default(20),
      language,
    })
    .strict(),
  getReference: z.object({ id, language }).strict(),
  composeBrief: z
    .object({
      materialIds: z.array(id).min(1).max(9),
      prompt: z
        .string()
        .max(8000)
        .refine((value) => value.trim().length > 0, 'Prompt cannot be blank.')
        .optional(),
      language,
    })
    .strict(),
};

const referenceSchema = z
  .object({
    id,
    role: z.enum(roles),
    pose: poseSchema.optional(),
    clothing: clothingSchema.optional(),
    poseReference: poseReferenceSchema.optional(),
    title: z.string(),
    description: z.string(),
    prompt: z.string(),
    license: z.enum(['CC0-1.0', 'LicenseRef-AI-Generated']),
    source: z.url(),
    imageUrl: z.url(),
    pageUrl: z.url(),
    mimeType: z.enum(['image/svg+xml', 'image/png', 'image/jpeg', 'image/webp']),
    requiresRasterization: z.boolean(),
    poseAlternatives: z
      .array(
        z
          .object({
            id,
            view: z.enum(POSE_METADATA_FIELDS.view),
            representation: z.enum(POSE_REPRESENTATIONS).optional(),
            imageUrl: z.url(),
            pageUrl: z.url(),
          })
          .strict(),
      )
      .optional(),
    pairedReference: z
      .object({
        id,
        representation: z.enum(POSE_REPRESENTATIONS),
        imageUrl: z.url(),
        pageUrl: z.url(),
      })
      .strict()
      .optional(),
  })
  .strict()
  .superRefine(validatePoseRole);
const recipeSchema = z
  .object({
    v: z.literal(1),
    kind: z.literal('tryon'),
    materialIds: z.array(id).min(1).max(9),
    settings: z
      .object({
        background: z.literal('studio'),
        style: z.literal('editorial_high'),
        outputSize: z.literal('1K'),
        aspectRatio: z.literal('9:16'),
        quantity: z.literal(1),
        keepBackground: z.literal(false),
        keepPose: z.literal(true),
      })
      .strict(),
  })
  .strict();
export const outputSchemas = {
  listCollections: z
    .object({
      collections: z.array(
        z
          .object({ role: z.enum(roles), title: z.string(), count: z.number().int().positive() })
          .strict(),
      ),
      total: z.number().int().nonnegative(),
    })
    .strict(),
  searchReferences: z
    .object({
      items: z.array(referenceSchema),
      total: z.number().int().nonnegative(),
      offset: z.number().int().nonnegative(),
      limit: z.number().int().positive(),
      nextOffset: z.number().int().nonnegative().nullable(),
    })
    .strict(),
  getReference: referenceSchema,
  composeBrief: z
    .object({
      prompt: z.string(),
      brief: z.string(),
      references: z.array(referenceSchema.safeExtend({ slot: z.number().int().positive() })),
      recipe: recipeSchema,
      recipeUrl: z.url(),
      notes: z.array(z.string()),
    })
    .strict(),
};

const roleTitles = {
  clothing: ['Clothing', '服裝'],
  pose: ['Pose', '姿勢'],
  expression: ['Expression', '表情'],
  scene: ['Scene', '場景'],
  lighting: ['Lighting', '光線'],
};
const normalize = (value) => value.normalize('NFKC').toLocaleLowerCase('en');

export function normalizeSiteUrl(value) {
  try {
    if (typeof value !== 'string' || !value.trim()) throw new Error();
    const url = new URL(value);
    if (
      !['https:', 'http:'].includes(url.protocol) ||
      url.username ||
      url.password ||
      url.search ||
      url.hash
    )
      throw new Error();
    if (!url.pathname.endsWith('/')) url.pathname += '/';
    return url.href;
  } catch {
    throw new Error(
      'Invalid BLOOMRENDER_SITE_URL. Use an HTTP(S) base URL without credentials, query, or fragment.',
    );
  }
}

export function createMaterialCatalog({ siteUrl = DEFAULT_SITE_URL } = {}) {
  const base = normalizeSiteUrl(siteUrl);
  function reference(material, language) {
    const english = language === 'en';
    const extension = material.image.split('.').pop();
    const mimeType = {
      svg: 'image/svg+xml',
      png: 'image/png',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      webp: 'image/webp',
    }[extension];
    const paired = getPairedPoseReference(material, materials);
    return {
      id: material.id,
      role: material.role,
      ...(material.pose ? { pose: { ...material.pose } } : {}),
      ...(material.clothing ? { clothing: { ...material.clothing } } : {}),
      ...(material.poseReference ? { poseReference: { ...material.poseReference } } : {}),
      ...(material.pose
        ? {
            poseAlternatives: getPoseAlternatives(material, materials).map((alternative) => ({
              id: alternative.id,
              view: alternative.pose.view,
              ...(alternative.poseReference
                ? { representation: alternative.poseReference.representation }
                : {}),
              imageUrl: new URL(alternative.image, base).href,
              pageUrl: new URL(`materials/${alternative.id}`, base).href,
            })),
          }
        : {}),
      ...(paired
        ? {
            pairedReference: {
              id: paired.id,
              representation: paired.poseReference.representation,
              imageUrl: new URL(paired.image, base).href,
              pageUrl: new URL(`materials/${paired.id}`, base).href,
            },
          }
        : {}),
      title: english ? material.title : material.titleZh,
      description: english ? material.description : material.descriptionZh,
      prompt: getMaterialPrompt(material, language),
      license: material.license,
      source: material.source,
      imageUrl: new URL(material.image, base).href,
      pageUrl: new URL(`materials/${material.id}`, base).href,
      mimeType,
      requiresRasterization: mimeType === 'image/svg+xml',
    };
  }
  function getMaterial(id) {
    const material = byId.get(id);
    if (!material) throw new Error('Unknown material ID. Search the catalog for an available ID.');
    return material;
  }
  return {
    listCollections(input = {}) {
      const { language } = inputSchemas.listCollections.parse(input);
      return {
        collections: roles.flatMap((role) => {
          const count = materials.filter((material) => material.role === role).length;
          return count ? [{ role, title: roleTitles[role][language === 'en' ? 0 : 1], count }] : [];
        }),
        total: materials.length,
      };
    },
    searchReferences(input = {}) {
      const { query, role, offset, limit, language, representation, ...poseFilters } =
        inputSchemas.searchReferences.parse(input);
      const terms = normalize(query).trim().split(/\s+/).filter(Boolean);
      const matching = materials.filter((material) => {
        if (role && material.role !== role) return false;
        if (representation && material.poseReference?.representation !== representation)
          return false;
        if (!matchesPoseFilters(material, poseFilters)) return false;
        const searchable = normalize(
          [
            material.id,
            material.title,
            material.titleZh,
            material.description,
            material.descriptionZh,
            material.prompt,
            getPoseSearchText(material),
          ].join(' '),
        );
        return terms.every((term) => searchable.includes(term));
      });
      const items = matching
        .slice(offset, offset + limit)
        .map((material) => reference(material, language));
      return {
        items,
        total: matching.length,
        offset,
        limit,
        nextOffset: offset + items.length < matching.length ? offset + items.length : null,
      };
    },
    getReference(input) {
      const { id, language } = inputSchemas.getReference.parse(input);
      return reference(getMaterial(id), language);
    },
    composeBrief(input) {
      const {
        materialIds,
        prompt: suppliedPrompt,
        language,
      } = inputSchemas.composeBrief.parse(input);
      if (new Set(materialIds).size !== materialIds.length)
        throw new Error('Choose each material only once.');
      const selected = materialIds.map(getMaterial);
      const counts = new Map();
      for (const material of selected) {
        const count = (counts.get(material.role) ?? 0) + 1;
        if (count > (material.role === 'clothing' ? 5 : 1))
          throw new Error(
            'Choose at most five clothing references and one reference for each other role.',
          );
        counts.set(material.role, count);
      }
      const references = selected.map((material, index) => ({
        ...reference(material, language),
        slot: index + 1,
      }));
      const english = language === 'en';
      const prompt =
        suppliedPrompt ?? references.map((ref) => `${ref.title}: ${ref.prompt}`).join('\n');
      const heading = english ? 'Reference images, in supplied order' : '參考圖，依照選取順序';
      const brief = `${prompt}\n\n${heading}\n${references.map((ref) => `${english ? 'Image' : '圖'} ${ref.slot} · ${roleTitles[ref.role][english ? 0 : 1]} · ${ref.title}\n${ref.imageUrl}`).join('\n')}`;
      const recipe = {
        v: 1,
        kind: 'tryon',
        materialIds: [...materialIds],
        settings: {
          background: 'studio',
          style: 'editorial_high',
          outputSize: '1K',
          aspectRatio: '9:16',
          quantity: 1,
          keepBackground: false,
          keepPose: true,
        },
      };
      const encoded = Buffer.from(JSON.stringify({ v: 1, f: 'tryon', recipe }), 'utf8').toString(
        'base64url',
      );
      if (encoded.length > 1500)
        throw new Error('The recipe is too large for a share link. Choose fewer materials.');
      const notes = english
        ? [
            'The recipe link opens built-in selections and default settings in BloomRender. It does not include this brief prompt, personal photos, uploaded references, or API keys.',
            'Upload your own person photo and any required clothing in BloomRender before generating. The browser rasterizes SVG material references automatically.',
            'SVG references must be rasterized to PNG or JPEG before sending them directly to image models that do not accept SVG. Reference slots above preserve your supplied order; the try-on app groups inputs by role and puts the person photo first.',
          ]
        : [
            '配方連結只在 BloomRender 開啟內建素材與預設設定，不包含這份提示詞、人物照片、上傳參考圖或 API 金鑰。',
            '生成前請在 BloomRender 上傳自己的人物照及所需服裝；瀏覽器會自動將 SVG 參考圖轉成點陣圖。',
            '若直接將 SVG 參考圖交給不支援 SVG 的圖片模型，請先轉成 PNG 或 JPEG。上方編號保留選取順序；試穿介面會依角色排序，並把人物照放在第一張。',
          ];
      return {
        prompt,
        brief,
        references,
        recipe,
        recipeUrl: new URL(`r#${encoded}`, base).href,
        notes,
      };
    },
  };
}
