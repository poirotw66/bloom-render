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
  | 'premium_erya'
  | 'corporate_mag'
  | 'graduation'
  | 'business'
  | 'cabin_crew'
  | 'model_card'
  | 'portrait_resume_grad'
  | 'portrait_resume';

/** Themed photoshoot style (matches photography service themed item ids) */
export type ThemedType =
  | 'themed-birthday'
  | 'themed-magazine'
  | 'themed-grad-polaroid'
  | 'themed-polaroid'
  | 'themed-polaroid-set'
  | 'themed-sport'
  | 'themed-maternity'
  | 'themed-kendall'
  | 'themed-us-college'
  | 'themed-us-sport'
  | 'themed-retro-high'
  | 'themed-music'
  | 'themed-kids'
  | 'themed-pet-owner'
  | 'themed-pet';

// --- Travel domain types (constants live in constants/travel.ts) ---

export type TravelSceneGroup = 'international' | 'taiwan';

export type TravelSceneCategory = 'scenery' | 'food';

export type TravelSceneRegion = 'north' | 'central' | 'south' | 'east' | 'islands';

export type TravelContinent = 'europe' | 'asia' | 'namerica' | 'samerica' | 'oceania' | 'africa';

export type TravelVibe = 'zen' | 'retro' | 'cyberpunk' | 'street' | 'elegant' | 'adventure' | 'cozy' | 'futuristic' | 'romantic';

export interface TravelScene {
  id: string;
  nameKey: string;
  prompt: string;
  group: TravelSceneGroup;
  category?: TravelSceneCategory;
  vibes?: TravelVibe[];
  region?: TravelSceneRegion;
  continent?: TravelContinent;
  x?: number;
  y?: number;
  referenceImagePath?: string;
  descriptionKey?: string;
}

export type TravelAspectRatio = '1:1' | '16:9' | '9:16';

export type TravelImageSize = '1K' | '2K' | '4K';

export type TravelStyle = 'natural' | 'golden_hour' | 'film' | 'vibrant' | 'cinematic';

export type TravelWeather = 'random' | 'sunny' | 'rainy' | 'snowy' | 'cloudy' | 'misty';

export type TravelTimeOfDay = 'random' | 'dawn' | 'noon' | 'sunset' | 'night';

export interface TravelVibeOption {
  id: TravelVibe;
  nameKey: string;
  prompt: string;
  icon: string;
}

export type TravelOutfit = 'default' | 'casual' | 'formal' | 'traditional' | 'winter' | 'summer' | 'hiking' | 'cyberpunk' | 'luxury' | 'vintage' | 'street_chic' | 'preppy' | 'boho' | 'parisian' | 'academic' | 'y2k' | 'custom';

export type TravelRelationship = 'default' | 'couple' | 'family' | 'friends' | 'siblings' | 'parent_child';

export type TravelFraming = 'default' | 'closeup' | 'portrait' | 'full_body' | 'wide_angle' | 'aerial';

export type TravelPose = 'natural' | 'hugging' | 'jumping' | 'hand_in_hand' | 'pointing' | 'looking_at_each_other' | 'peace_sign' | 'walking_away' | 'sitting_relaxed' | 'candid_laugh' | 'leaning' | 'coffee_time' | 'adjusting_shades' | 'cafe_sitting' | 'photographer' | 'heart' | 'custom';
