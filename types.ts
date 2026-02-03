/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Central type definitions for the application.
 * ID photo and domain types are defined here; constants remain in constants/idPhoto.ts.
 */

/** Retouch level: Premium 極致完顏® / Standard 完顏® / SELF 妝髮自理 */
export type RetouchLevel = 'premium' | 'standard' | 'self';

/** ID / passport photo document type */
export type IdPhotoType =
  | 'domestic'
  | 'passport'
  | 'taiwan_compatriot'
  | 'student'
  | 'work'
  | 'military_police_medical'
  | 'cabin_crew'
  | 'graduation';

/** Output framing: head & shoulders vs half body vs full body */
export type OutputSpec = 'head_shoulders' | 'half_body' | 'full_body';

/** Clothing option: original / scene default / business / casual / graduation gown / suit / custom */
export type ClothingOption =
  | 'original'
  | 'scene_default'
  | 'business'
  | 'casual'
  | 'graduation_gown'
  | 'suit'
  | 'custom';
/** Portrait / Corporate photo style type */
export type PortraitType =
  | 'premium_leader'
  | 'corporate_mag'
  | 'graduation'
  | 'business'
  | 'cabin_crew'
  | 'model_card';
