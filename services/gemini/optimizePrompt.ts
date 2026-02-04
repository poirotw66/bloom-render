/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Prompt optimization for image generation.
 */

import { fileToPartAuto, getClient, type ServiceSettings } from './shared';

/**
 * Uses Gemini (text mode) to optimize a user's short prompt into a detailed image generation prompt.
 */
export const generateOptimizedPrompt = async (
  userText: string,
  referenceImage?: File,
  settings?: ServiceSettings
): Promise<string> => {
  console.log('Optimizing prompt for:', userText, referenceImage ? '(with image)' : '(text only)');
  const ai = getClient(settings);
  const modelName = settings?.model || 'gemini-2.5-flash-image';

  const instructions = `You are an expert prompt engineer for AI image generation.
Task: Create a detailed, high-quality image generation prompt based on the user's input.
User Input: "${userText}"
${referenceImage ? "Reference Image: I have attached an image. Extract its key visual elements (lighting, style, atmosphere, location details) and incorporate them into the text prompt." : ''}

Requirements:
1. Expansion: Expand the short description into a full scene description.
2. Lighting & Atmosphere: Add specific details about lighting (e.g., golden hour, cinematic lighting) and atmosphere.
3. Photorealism: Ensure the prompt targets a realistic travel photo style.
4. Output: Return ONLY the optimized prompt text. Do not add explanations.`;

  const parts: Array<
    { inlineData?: { mimeType: string; data: string } } | { text: string }
  > = [];

  if (referenceImage) {
    parts.push(await fileToPartAuto(referenceImage));
  }
  parts.push({ text: instructions });

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: { parts },
    });

    const optimizedText = response.text?.trim();
    if (!optimizedText) throw new Error('No text returned from optimization');
    return optimizedText;
  } catch (e) {
    console.warn('Prompt optimization failed, executing fallback.', e);
    return userText;
  }
};
