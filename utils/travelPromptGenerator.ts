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

interface PromptOptions {
    style?: string;
    weather?: string;
    time?: string;
    vibe?: string;
    outfit?: string;
    outfitColor?: string;
    pose?: string;
    relationship?: string;
    framing?: string;
    clearBackground?: boolean;
    isGroup?: boolean;
}

/**
 * Generates a dynamic, high-quality prompt for a travel scene
 * @param baseScenePrompt The core description of the location (e.g., "in front of Taipei 101")
 * @param options Object containing explicit style, weather, time, and vibe descriptions
 * @returns A fully constructed prompt with randomized modifiers
 */
export function generateDynamicTravelPrompt(baseScenePrompt: string, options: PromptOptions | string): string {
    let opt: PromptOptions = {};
    if (typeof options === 'string') {
        opt = { style: options };
    } else {
        opt = options;
    }

    const lighting = opt.style || opt.time || opt.weather ? '' : getRandomElement(LIGHTING_CONDITIONS);
    const angle = opt.framing ? opt.framing : getRandomElement(CAMERA_ANGLES);
    const action = opt.pose ? opt.pose : getRandomElement(POSES_AND_ACTIONS);
    const style = opt.style || getRandomElement(VISUAL_STYLES);
    const weather = opt.weather ? opt.weather + ',' : '';
    const time = opt.time ? opt.time + ',' : '';
    const vibe = opt.vibe ? opt.vibe + ',' : '';

    // Outfit color logic
    let outfit = opt.outfit || 'fashionable outfit';
    if (opt.outfitColor) {
        outfit = `${outfit} in ${opt.outfitColor}`;
    }

    // Relationship logic for groups
    let subject = opt.isGroup
        ? 'an ultra-high-fidelity travel photo of a group of people, strictly maintaining absolute character consistency and exact facial features of ALL individuals from the reference photos'
        : 'an elite-quality travel portrait, maintaining absolute character consistency and exact facial geometry from the reference source, photorealistic rendering of the same person';

    if (opt.isGroup && opt.relationship) {
        subject = `${subject}, they are clearly identified as ${opt.relationship}`;
    } else if (opt.isGroup) {
        subject = `${subject}, they are friends or family traveling together, each with their own distinct and preserved identity`;
    }

    const groupAction = opt.isGroup
        ? (opt.pose ? opt.pose : 'standing together, laughing and interacting naturally with genuine expressions')
        : action;

    const backgroundMod = opt.clearBackground ? 'clean background, exclusive private view, no other tourists or background people,' : '';

    // Construct the "Positive" prompt
    // Structure: Subject + Action + Scene + Outfit + Weather + Time + Vibe + Lighting + Camera + Style
    return `Exquisite ${subject},
    ${groupAction},
    ${baseScenePrompt},
    wearing ${outfit},
    ${backgroundMod}
    ${weather}
    ${time}
    ${vibe}
    ${lighting ? lighting + ',' : ''}
    ${angle},
    ${style},
    high-end fashion aesthetic, masterpiece photography, meticulous facial details, sharp focus on pupils, realistic skin texture with subsurface scattering, 8k resolution, professionally color graded`;
}

function getRandomElement<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)];
}
