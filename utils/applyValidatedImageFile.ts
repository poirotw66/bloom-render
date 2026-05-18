/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { validateImageUploadMessage } from './imageValidation';

export async function applyValidatedImageFile(
  file: File | undefined,
  t: (key: string) => string,
  onValid: (file: File) => void,
  setError: (message: string | null) => void,
): Promise<void> {
  if (!file) {
    return;
  }
  const message = await validateImageUploadMessage(file, t);
  if (message) {
    setError(message);
    return;
  }
  setError(null);
  onValid(file);
}
