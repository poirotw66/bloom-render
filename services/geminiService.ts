/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { TRAVEL_POSITIVE_TEMPLATE, TRAVEL_NEGATIVE } from "../constants/travel";

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
    // For 'generation' with Gemini 3 Pro (Thinking model): the model may return multiple
    // inlineData parts (interim "thought" images). The LAST one is the final image.
    const parts = response.candidates?.[0]?.content?.parts ?? [];
    const withInline = parts.filter(p => p.inlineData);
    const imagePartFromResponse = context === 'generation' && withInline.length > 0
        ? withInline[withInline.length - 1]
        : parts.find(part => part.inlineData);

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

export type { RetouchLevel, IdPhotoType, OutputSpec, ClothingOption } from '../constants/idPhoto';
import {
    RETOUCH_LEVELS,
    ID_PHOTO_TYPES,
    OUTPUT_SPECS,
    CLOTHING_OPTIONS,
    DEFAULT_ID_TYPE,
    DEFAULT_RETOUCH_LEVEL,
    DEFAULT_OUTPUT_SPEC,
    DEFAULT_CLOTHING_OPTION,
    type RetouchLevel,
    type IdPhotoType,
    type OutputSpec,
    type ClothingOption,
} from '../constants/idPhoto';

export interface GenerateIdPhotoOptions {
    retouchLevel?: RetouchLevel;
    idType?: IdPhotoType;
    outputSpec?: OutputSpec;
    clothingOption?: ClothingOption;
    /** 當 clothingOption === 'custom' 時使用；其餘忽略 */
    clothingCustomText?: string;
    /** 當 clothingOption === 'custom' 時可選；上傳服裝參考圖，以該圖服飾產生證件照 */
    clothingReferenceImage?: File;
    settings?: ServiceSettings;
}

/**
 * Generates a professional ID / passport-style photo from a portrait.
 * 韓式證件照：支援修圖等級、證件類型、輸出規格。
 * @param originalImage The uploaded portrait (clear, front-facing).
 * @param options retouchLevel, idType, outputSpec, settings.
 * @returns A promise that resolves to the data URL of the generated ID photo.
 */
export const generateIdPhoto = async (
    originalImage: File,
    options?: GenerateIdPhotoOptions | ServiceSettings
): Promise<string> => {
    const isNewFormat = options && typeof options === 'object' && ('retouchLevel' in options || 'idType' in options || 'outputSpec' in options || 'clothingOption' in options);
    const opts: GenerateIdPhotoOptions = isNewFormat ? (options as GenerateIdPhotoOptions) : { settings: options as ServiceSettings };
    const retouchLevel = opts.retouchLevel ?? DEFAULT_RETOUCH_LEVEL;
    const idType = opts.idType ?? DEFAULT_ID_TYPE;
    const outputSpec = opts.outputSpec ?? DEFAULT_OUTPUT_SPEC;
    const clothingOption = opts.clothingOption ?? DEFAULT_CLOTHING_OPTION;
    const clothingCustomText = opts.clothingCustomText?.trim() ?? '';
    const clothingReferenceImage = opts.clothingReferenceImage ?? null;
    const serviceSettings = opts.settings;

    const level = RETOUCH_LEVELS.find((l) => l.id === retouchLevel) || RETOUCH_LEVELS[1];
    const type = ID_PHOTO_TYPES.find((t) => t.id === idType) || ID_PHOTO_TYPES[0];
    const spec = OUTPUT_SPECS.find((s) => s.id === outputSpec) || OUTPUT_SPECS[0];
    const clothingEntry = CLOTHING_OPTIONS.find((c) => c.id === clothingOption) || CLOTHING_OPTIONS[0];
    let clothingHint: string;
    if (clothingOption !== 'custom') {
        clothingHint = clothingEntry.promptHint ?? '';
    } else if (clothingReferenceImage && clothingCustomText) {
        clothingHint = `Dress the person in the first image in the same or similar outfit as shown in the second (reference) image. Additional instructions: ${clothingCustomText}.`;
    } else if (clothingReferenceImage) {
        clothingHint = 'Dress the person in the first image in the same or similar outfit as shown in the second (reference) image.';
    } else if (clothingCustomText) {
        clothingHint = `Dress the person in the following attire: ${clothingCustomText}.`;
    } else {
        clothingHint = 'Use appropriate professional attire suitable for an ID photo.';
    }

    const positive = [
        ID_PHOTO_BASE_POSITIVE,
        spec.cropHint,
        level.positiveModifier,
        type.promptHint,
        clothingHint,
    ].filter(Boolean).join(' ');
    const negative = [ID_PHOTO_BASE_NEGATIVE, level.negativeExtra].filter(Boolean).join(' ');

    const introTwoImages = clothingReferenceImage
        ? 'Note: You are given TWO images. The first image is the portrait to transform. The second image is a reference for the desired clothing/outfit.\n\n'
        : '';

    const prompt = `${introTwoImages}You are an expert ID and passport photo retouching AI. Transform the provided portrait into a professional, compliant ID/passport-style photo.

Requirements (MUST follow):
${positive}

Never do (MUST avoid):
${negative}

Output: Return ONLY the final ID/passport-style image. Do not return any text.`;
    const textPart = { text: prompt };

    console.log('Starting ID photo generation', { retouchLevel, idType, outputSpec, clothingOption, hasClothingRefImage: !!clothingReferenceImage });
    const ai = getClient(serviceSettings);
    const model = getModel(serviceSettings);
    const originalImagePart = await fileToPart(originalImage);
    const parts: Array<{ inlineData?: { mimeType: string; data: string } } | { text: string }> = [originalImagePart];
    if (clothingReferenceImage) {
        parts.push(await fileToPart(clothingReferenceImage));
    }
    parts.push(textPart);

    console.log(`Sending image(s) to model (${model}) for ID photo...`);
    const response: GenerateContentResponse = await ai.models.generateContent({
        model,
        contents: { parts },
    });
    console.log('Received response from model for ID photo.', response);
    return handleApiResponse(response, 'id-photo');
};

export interface GenerateTravelPhotoOptions {
  /** Scene prompt: from a preset or custom text. Replaces {SCENE} in the positive template. Can be empty when sceneReferenceImage is provided. */
  scenePrompt: string;
  /** Optional reference photo of the desired scene. When provided, the model uses it to match setting, lighting, and atmosphere. */
  sceneReferenceImage?: File;
  /** Output aspect ratio: 1:1, 16:9, or 9:16. Default 1:1. */
  aspectRatio?: '1:1' | '16:9' | '9:16';
  /** Output image size. Flash supports 1K only; Pro supports 1K, 2K, 4K. */
  imageSize?: '1K' | '2K' | '4K';
  settings?: ServiceSettings;
}

/**
 * Generates a travel photo: the same person in a selected scene.
 * Uses positive/negative templates from constants/travel.
 * imageSize: Flash only supports 1K; Pro supports 1K/2K/4K. Non‑Pro requests for 2K/4K are forced to 1K.
 * When sceneReferenceImage is provided, parts are [portrait, referenceImage, text]; the prompt instructs to match the reference scene.
 */
export const generateTravelPhoto = async (
  originalImage: File,
  options: GenerateTravelPhotoOptions
): Promise<string> => {
  const { scenePrompt, sceneReferenceImage, aspectRatio = '1:1', imageSize: requestedSize, settings: serviceSettings } = options;

  const sceneForTemplate = sceneReferenceImage
    ? 'in a scene matching the second (reference) image' + (scenePrompt.trim() ? `. ${scenePrompt.trim()}` : '')
    : scenePrompt.trim();
  const positive = TRAVEL_POSITIVE_TEMPLATE.replace('{SCENE}', sceneForTemplate);
  const aspectHint = aspectRatio === '16:9'
    ? 'Output in 16:9 landscape aspect ratio.'
    : aspectRatio === '9:16'
      ? 'Output in 9:16 portrait aspect ratio.'
      : 'Output in 1:1 square aspect ratio.';

  const introRef = sceneReferenceImage
    ? 'Note: You are given TWO images. The first is the portrait to transform. The second is a reference photo of the desired scene/location. Use it to match the setting, lighting, colors, and atmosphere.\n\n'
    : '';

  const prompt = `${introRef}You are an expert travel photo AI. Transform the provided portrait so the person appears in the following scene.

Requirements (MUST follow):
${positive}

Never do (MUST avoid):
${TRAVEL_NEGATIVE}

${aspectHint}

Output: Return ONLY the final travel photo. Do not return any text.`;
  const textPart = { text: prompt };

  const ai = getClient(serviceSettings);
  const model = getModel(serviceSettings);
  /** Flash: 1K only, imageSize not supported in imageConfig; Pro: 1K, 2K, or 4K. */
  const isPro = model === 'gemini-3-pro-image-preview';
  const effectiveImageSize: '1K' | '2K' | '4K' = isPro ? (requestedSize || '1K') : '1K';

  const imageConfig: { aspectRatio: string; imageSize?: '1K' | '2K' | '4K' } = { aspectRatio: aspectRatio || '1:1' };
  if (isPro) imageConfig.imageSize = effectiveImageSize;

  console.log('Starting travel photo generation', { scenePrompt: scenePrompt.slice(0, 60), hasSceneRef: !!sceneReferenceImage, aspectRatio, imageSize: effectiveImageSize });
  const originalImagePart = await fileToPart(originalImage);
  const parts: Array<{ inlineData?: { mimeType: string; data: string } } | { text: string }> = [originalImagePart];
  if (sceneReferenceImage) {
    parts.push(await fileToPart(sceneReferenceImage));
  }
  parts.push(textPart);

  const response: GenerateContentResponse = await ai.models.generateContent({
    model,
    contents: { parts },
    config: {
      responseModalities: ['TEXT', 'IMAGE'],
      imageConfig,
    },
  });
  console.log('Received response from model for travel photo.', response);
  return handleApiResponse(response, 'travel');
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
            contents: { parts: [{ text: prompt }] },
            config: {
                responseModalities: ['TEXT', 'IMAGE'],
                imageConfig: {
                    aspectRatio: aspectRatio,
                    ...(model === 'gemini-3-pro-image-preview' ? { imageSize: '1K' as const } : {}),
                },
            },
        });
        return handleApiResponse(response, 'generation');
    });

    const results = await Promise.all(promises);
    console.log(`Generated ${results.length} images.`);
    
    return results;
};
