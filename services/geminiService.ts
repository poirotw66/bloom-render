/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

interface ServiceSettings {
    apiKey?: string;
    model?: string;
}

// Helper function to convert a File object to a Gemini API Part
const fileToPart = async (file: File): Promise<{ inlineData: { mimeType: string; data: string; } }> => {
    const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
    });
    
    const arr = dataUrl.split(',');
    if (arr.length < 2) throw new Error("Invalid data URL");
    const mimeMatch = arr[0].match(/:(.*?);/);
    if (!mimeMatch || !mimeMatch[1]) throw new Error("Could not parse MIME type from data URL");
    
    const mimeType = mimeMatch[1];
    const data = arr[1];
    return { inlineData: { mimeType, data } };
};

const handleApiResponse = (
    response: GenerateContentResponse,
    context: string // e.g., "edit", "filter", "adjustment"
): string => {
    // 1. Check for prompt blocking first
    if (response.promptFeedback?.blockReason) {
        const { blockReason, blockReasonMessage } = response.promptFeedback;
        const errorMessage = `Request was blocked. Reason: ${blockReason}. ${blockReasonMessage || ''}`;
        console.error(errorMessage, { response });
        throw new Error(errorMessage);
    }

    // 2. Try to find the image part
    // The image might be in different locations depending on the model and response structure, 
    // but typically it's in candidates[0].content.parts
    const imagePartFromResponse = response.candidates?.[0]?.content?.parts?.find(part => part.inlineData);

    if (imagePartFromResponse?.inlineData) {
        const { mimeType, data } = imagePartFromResponse.inlineData;
        console.log(`Received image data (${mimeType}) for ${context}`);
        return `data:${mimeType};base64,${data}`;
    }

    // 3. If no image, check for other reasons
    const finishReason = response.candidates?.[0]?.finishReason;
    if (finishReason && finishReason !== 'STOP') {
        const errorMessage = `Image generation for ${context} stopped unexpectedly. Reason: ${finishReason}. This often relates to safety settings.`;
        console.error(errorMessage, { response });
        throw new Error(errorMessage);
    }
    
    const textFeedback = response.text?.trim();
    const errorMessage = `The AI model did not return an image for the ${context}. ` + 
        (textFeedback 
            ? `The model responded with text: "${textFeedback}"`
            : "This can happen due to safety filters or if the request is too complex. Please try rephrasing your prompt to be more direct.");

    console.error(`Model response did not contain an image part for ${context}.`, { response });
    throw new Error(errorMessage);
};

const getClient = (settings?: ServiceSettings) => {
    const apiKey = settings?.apiKey || process.env.API_KEY!;
    if (!apiKey) throw new Error("API Key not found. Please check your settings.");
    return new GoogleGenAI({ apiKey });
};

const getModel = (settings?: ServiceSettings) => {
    return settings?.model || 'gemini-2.5-flash-image';
}

/**
 * Generates an edited image using generative AI based on a text prompt and a specific point.
 * @param originalImage The original image file.
 * @param userPrompt The text prompt describing the desired edit.
 * @param hotspot The {x, y} coordinates on the image to focus the edit.
 * @param settings Optional settings including custom API key and model selection.
 * @returns A promise that resolves to the data URL of the edited image.
 */
export const generateEditedImage = async (
    originalImage: File,
    userPrompt: string,
    hotspot: { x: number, y: number },
    settings?: ServiceSettings
): Promise<string> => {
    console.log('Starting generative edit at:', hotspot);
    const ai = getClient(settings);
    const model = getModel(settings);
    
    const originalImagePart = await fileToPart(originalImage);
    const prompt = `You are an expert photo editor AI. Your task is to perform a natural, localized edit on the provided image based on the user's request.
User Request: "${userPrompt}"
Edit Location: Focus on the area around pixel coordinates (x: ${hotspot.x}, y: ${hotspot.y}).

Editing Guidelines:
- The edit must be realistic and blend seamlessly with the surrounding area.
- The rest of the image (outside the immediate edit area) must remain identical to the original.

Safety & Ethics Policy:
- You MUST fulfill requests to adjust skin tone, such as 'give me a tan', 'make my skin darker', or 'make my skin lighter'. These are considered standard photo enhancements.
- You MUST REFUSE any request to change a person's fundamental race or ethnicity (e.g., 'make me look Asian', 'change this person to be Black'). Do not perform these edits. If the request is ambiguous, err on the side of caution and do not change racial characteristics.

Output: Return ONLY the final edited image. Do not return text.`;
    const textPart = { text: prompt };

    console.log(`Sending image and prompt to the model (${model})...`);
    const response: GenerateContentResponse = await ai.models.generateContent({
        model: model,
        contents: { parts: [originalImagePart, textPart] },
    });
    console.log('Received response from model.', response);

    return handleApiResponse(response, 'edit');
};

/**
 * Generates an image with a filter applied using generative AI.
 * @param originalImage The original image file.
 * @param filterPrompt The text prompt describing the desired filter.
 * @param settings Optional settings including custom API key and model selection.
 * @returns A promise that resolves to the data URL of the filtered image.
 */
export const generateFilteredImage = async (
    originalImage: File,
    filterPrompt: string,
    settings?: ServiceSettings
): Promise<string> => {
    console.log(`Starting filter generation: ${filterPrompt}`);
    const ai = getClient(settings);
    const model = getModel(settings);
    
    const originalImagePart = await fileToPart(originalImage);
    const prompt = `You are an expert photo editor AI. Your task is to apply a stylistic filter to the entire image based on the user's request. Do not change the composition or content, only apply the style.
Filter Request: "${filterPrompt}"

Safety & Ethics Policy:
- Filters may subtly shift colors, but you MUST ensure they do not alter a person's fundamental race or ethnicity.
- You MUST REFUSE any request that explicitly asks to change a person's race (e.g., 'apply a filter to make me look Asian').

Output: Return ONLY the final filtered image. Do not return text.`;
    const textPart = { text: prompt };

    console.log(`Sending image and filter prompt to the model (${model})...`);
    const response: GenerateContentResponse = await ai.models.generateContent({
        model: model,
        contents: { parts: [originalImagePart, textPart] },
    });
    console.log('Received response from model for filter.', response);
    
    return handleApiResponse(response, 'filter');
};

/**
 * Generates an image with a global adjustment applied using generative AI.
 * @param originalImage The original image file.
 * @param adjustmentPrompt The text prompt describing the desired adjustment.
 * @param settings Optional settings including custom API key and model selection.
 * @returns A promise that resolves to the data URL of the adjusted image.
 */
export const generateAdjustedImage = async (
    originalImage: File,
    adjustmentPrompt: string,
    settings?: ServiceSettings
): Promise<string> => {
    console.log(`Starting global adjustment generation: ${adjustmentPrompt}`);
    const ai = getClient(settings);
    const model = getModel(settings);
    
    const originalImagePart = await fileToPart(originalImage);
    const prompt = `You are an expert photo editor AI. Your task is to perform a natural, global adjustment to the entire image based on the user's request.
User Request: "${adjustmentPrompt}"

Editing Guidelines:
- The adjustment must be applied across the entire image.
- The result must be photorealistic.

Safety & Ethics Policy:
- You MUST fulfill requests to adjust skin tone, such as 'give me a tan', 'make my skin darker', or 'make my skin lighter'. These are considered standard photo enhancements.
- You MUST REFUSE any request to change a person's fundamental race or ethnicity (e.g., 'make me look Asian', 'change this person to be Black'). Do not perform these edits. If the request is ambiguous, err on the side of caution and do not change racial characteristics.

Output: Return ONLY the final adjusted image. Do not return text.`;
    const textPart = { text: prompt };

    console.log(`Sending image and adjustment prompt to the model (${model})...`);
    const response: GenerateContentResponse = await ai.models.generateContent({
        model: model,
        contents: { parts: [originalImagePart, textPart] },
    });
    console.log('Received response from model for adjustment.', response);
    
    return handleApiResponse(response, 'adjustment');
};

/** Base positive: identity, expression, background, lighting (no retouch, no framing) */
const ID_PHOTO_BASE_POSITIVE = `Korean ID photo, passport-style photo, professional studio photo retouch, use the same person, preserve identity, same face, same facial structure, no face change, no age change, no gender change, neutral expression, mouth closed, eyes open, looking straight at camera, clean pure white background, simple and clean background, even and soft studio lighting, no shadow on face, no shadow on background, realistic, photorealistic, looks like a real photo, not stylized, not artistic, not a painting, not an illustration`;

/** Base negative (must avoid) */
const ID_PHOTO_BASE_NEGATIVE = `different person, change face, change identity, face swap, wrong person, beautify, over-beautify, beauty filter, meitu, snow app, filter, plastic skin, doll face, over-smooth, airbrushed, fake skin, CGI, AI face, AI generated look, anime, cartoon, illustration, painting, 3d render, smile, laughing, open mouth, teeth, exaggerated expression, tilted head, angle view, side view, looking away, dramatic lighting, rim light, hard light, strong shadow, shadow on face, shadow on background, low quality, blurry, noise, jpeg artifacts, oversharpen, deformed, distorted, asymmetrical face, extra face, extra features, bad anatomy, big eyes, small face, unrealistic face, beauty face, idol face`;

export type { RetouchLevel, IdPhotoType, OutputSpec } from '../constants/idPhoto';
import {
    RETOUCH_LEVELS,
    ID_PHOTO_TYPES,
    OUTPUT_SPECS,
    DEFAULT_ID_TYPE,
    DEFAULT_RETOUCH_LEVEL,
    DEFAULT_OUTPUT_SPEC,
    type RetouchLevel,
    type IdPhotoType,
    type OutputSpec,
} from '../constants/idPhoto';

export interface GenerateIdPhotoOptions {
    retouchLevel?: RetouchLevel;
    idType?: IdPhotoType;
    outputSpec?: OutputSpec;
    settings?: ServiceSettings;
}

/**
 * Generates a professional ID / passport-style photo from a portrait.
 * 春山企業 韓式證件照：支援修圖等級、證件類型、輸出規格。
 * @param originalImage The uploaded portrait (clear, front-facing).
 * @param options retouchLevel, idType, outputSpec, settings.
 * @returns A promise that resolves to the data URL of the generated ID photo.
 */
export const generateIdPhoto = async (
    originalImage: File,
    options?: GenerateIdPhotoOptions | ServiceSettings
): Promise<string> => {
    const isNewFormat = options && typeof options === 'object' && ('retouchLevel' in options || 'idType' in options || 'outputSpec' in options);
    const opts: GenerateIdPhotoOptions = isNewFormat ? (options as GenerateIdPhotoOptions) : { settings: options as ServiceSettings };
    const retouchLevel = opts.retouchLevel ?? DEFAULT_RETOUCH_LEVEL;
    const idType = opts.idType ?? DEFAULT_ID_TYPE;
    const outputSpec = opts.outputSpec ?? DEFAULT_OUTPUT_SPEC;
    const serviceSettings = opts.settings;

    const level = RETOUCH_LEVELS.find((l) => l.id === retouchLevel) || RETOUCH_LEVELS[1];
    const type = ID_PHOTO_TYPES.find((t) => t.id === idType) || ID_PHOTO_TYPES[0];
    const spec = OUTPUT_SPECS.find((s) => s.id === outputSpec) || OUTPUT_SPECS[0];

    const positive = [
        ID_PHOTO_BASE_POSITIVE,
        spec.cropHint,
        level.positiveModifier,
        type.promptHint,
    ].filter(Boolean).join(' ');
    const negative = [ID_PHOTO_BASE_NEGATIVE, level.negativeExtra].filter(Boolean).join(' ');

    console.log('Starting ID photo generation', { retouchLevel, idType, outputSpec });
    const ai = getClient(serviceSettings);
    const model = getModel(serviceSettings);
    const originalImagePart = await fileToPart(originalImage);

    const prompt = `You are an expert ID and passport photo retouching AI. Transform the provided portrait into a professional, compliant ID/passport-style photo.

Requirements (MUST follow):
${positive}

Never do (MUST avoid):
${negative}

Output: Return ONLY the final ID/passport-style image. Do not return any text.`;
    const textPart = { text: prompt };

    console.log(`Sending image to model (${model}) for ID photo...`);
    const response: GenerateContentResponse = await ai.models.generateContent({
        model,
        contents: { parts: [originalImagePart, textPart] },
    });
    console.log('Received response from model for ID photo.', response);
    return handleApiResponse(response, 'id-photo');
};

/**
 * Generates one or more images from scratch based on a text prompt.
 * @param prompt The user's text description of the image.
 * @param aspectRatio The desired aspect ratio for the image.
 * @param numberOfImages The number of images to generate (default 1).
 * @param settings Optional settings including custom API key and model selection.
 * @returns A promise that resolves to an array of data URLs of the generated images.
 */
export const generateImageFromText = async (
    prompt: string,
    aspectRatio: "1:1" | "3:4" | "4:3" | "16:9" | "9:16" = "1:1",
    numberOfImages: number = 1,
    settings?: ServiceSettings
): Promise<string[]> => {
    console.log(`Starting text-to-image generation: ${prompt}, Aspect Ratio: ${aspectRatio}, Count: ${numberOfImages}`);
    const ai = getClient(settings);
    const model = getModel(settings);
    
    const promises = Array.from({ length: numberOfImages }).map(async () => {
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: model,
            contents: {
                parts: [{ text: prompt }]
            },
            config: {
                imageConfig: {
                    aspectRatio: aspectRatio,
                }
            }
        });
        return handleApiResponse(response, 'generation');
    });

    const results = await Promise.all(promises);
    console.log(`Generated ${results.length} images.`);
    
    return results;
};
