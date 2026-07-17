/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it } from 'vitest';
import { enMessages } from '../locales/en';
import { zhTWMessages } from '../locales/zh-TW';

const HISTORY_RESULT_TYPES = [
  'idphoto',
  'portrait',
  'themed',
  'travel',
  'couple',
  'group',
  'tryon',
] as const;

describe('history type i18n coverage', () => {
  it('defines labels for every history result type in en and zh-TW', () => {
    for (const type of HISTORY_RESULT_TYPES) {
      const key = `history.type.${type}`;
      expect(enMessages[key], `missing en key ${key}`).toBeTruthy();
      expect(zhTWMessages[key], `missing zh-TW key ${key}`).toBeTruthy();
    }
  });
});
