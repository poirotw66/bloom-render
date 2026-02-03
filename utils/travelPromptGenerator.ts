/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Randomized variations to make photos feel unique and realistic
const LIGHTING_CONDITIONS = [
    'soft natural lighting, morning atmosphere',
    'golden hour sunlight, warm tones, cinematic lighting',
    'bright sunny day, harsh shadows, high contrast',
    'soft overcast lighting, diffused light, even tones',
    'dramatic sunset lighting, rim light, atmospheric',
    'moody cinematic lighting, slightly dim, emotional atmosphere'
];

const CAMERA_ANGLES = [
    'eye level shot, medium shot',
    'low angle shot, looking up, empowering angle',
    'wide angle shot, capturing the vast scenery',
    'slightly from above, flattering angle',
    'portrait photography, focusing on the person with background bokeh'
];

const POSES_AND_ACTIONS = [
    'looking naturally at the camera, slight smile',
    'looking away at the scenery, candid moment, side profile',
    'walking naturally through the scene, motion blur',
    'standing confidently, fashion pose',
    'adjusting hair, candid snapshot',
    'holding a coffee or drink, casual vibe',
    'smiling brightly, enjoying the travel',
    'looking back over shoulder, alluring pose'
];

const VISUAL_STYLES = [
    'photorealistic, 8k, highly detailed, sharp focus',
    'shot on 35mm film, kodak portra 400, grainy texture, vintage feel',
    'modern travel photography, instagram style, vibrant colors',
    'editorial fashion photography, clean look, professional color grading',
    'documentary style, raw and authentic, storytelling'
];

/**
 * Generates a dynamic, high-quality prompt for a travel scene
 * @param baseScenePrompt The core description of the location (e.g., "in front of Taipei 101")
 * @param stylePrompt Optional explicit style description (e.g., "golden hour")
 * @returns A fully constructed prompt with randomized modifiers
 */
export function generateDynamicTravelPrompt(baseScenePrompt: string, stylePrompt?: string): string {
    const lighting = stylePrompt ? '' : getRandomElement(LIGHTING_CONDITIONS);
    const angle = getRandomElement(CAMERA_ANGLES);
    const action = getRandomElement(POSES_AND_ACTIONS);
    const style = stylePrompt || getRandomElement(VISUAL_STYLES);

    // Construct the "Positive" prompt
    // Structure: Subject + Action + Scene + Lighting + Camera + Style
    return `a travel photo of the same person, preserve identity, same face,
    ${action},
    ${baseScenePrompt},
    ${lighting ? lighting + ',' : ''}
    ${angle},
    ${style},
    high quality, masterpiece, detailed face`;
}

function getRandomElement<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)];
}
