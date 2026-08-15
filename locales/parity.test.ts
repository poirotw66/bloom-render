/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Keeps en and zh-TW in step.
 *
 * `t()` falls back to returning the key itself when a message is missing, so a
 * locale that has drifted does not throw, log, or fail the build — it silently
 * renders `start.compare_toggle_label` to the user in place of a label. That
 * failure mode is invisible unless someone happens to browse the app in the
 * other language, which is exactly why it needs a test rather than a habit.
 *
 * Every locale change in this repo so far has been checked by hand. This does
 * the same check on every run.
 */

import { describe, expect, it } from 'vitest';
import { enMessages } from './en';
import { zhTWMessages } from './zh-TW';

const LOCALES = {
  en: enMessages,
  'zh-TW': zhTWMessages,
} as const;

const BASE_LOCALE = 'en';

/** Placeholders like {seconds} must survive translation or interpolation breaks. */
function placeholdersOf(message: string): string[] {
  return [...message.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();
}

describe('locale parity', () => {
  const baseKeys = Object.keys(LOCALES[BASE_LOCALE]);

  it.each(Object.keys(LOCALES).filter((name) => name !== BASE_LOCALE))(
    '%s defines exactly the same keys as en',
    (name) => {
      const otherKeys = Object.keys(LOCALES[name as keyof typeof LOCALES]);

      expect(otherKeys.filter((k) => !baseKeys.includes(k))).toEqual([]);
      expect(baseKeys.filter((k) => !otherKeys.includes(k))).toEqual([]);
    },
  );

  it.each(Object.entries(LOCALES))('%s has no empty message', (_name, messages) => {
    const blank = Object.entries(messages)
      .filter(([, value]) => value.trim() === '')
      .map(([key]) => key);

    expect(blank).toEqual([]);
  });

  it.each(Object.keys(LOCALES).filter((name) => name !== BASE_LOCALE))(
    '%s keeps the same interpolation placeholders as en',
    (name) => {
      const messages = LOCALES[name as keyof typeof LOCALES];
      // A translation that drops {seconds} renders a sentence with the number
      // missing entirely, and one that invents {second} renders the literal
      // braces — both look like content bugs, not translation bugs.
      const mismatched = baseKeys
        .filter((key) => messages[key] !== undefined)
        .map((key) => ({
          key,
          base: placeholdersOf(LOCALES[BASE_LOCALE][key]),
          other: placeholdersOf(messages[key]),
        }))
        .filter(({ base, other }) => base.join(',') !== other.join(','));

      expect(mismatched).toEqual([]);
    },
  );
});
