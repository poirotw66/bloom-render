/**
 * @license
 * SPDX-License-Identifier: MIT
 *
 * axe-core WCAG 2 A/AA on travel + try-on (audit Wave N). Critical violations fail the test.
 */

import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('a11y', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('bloom_language', 'en');
      localStorage.setItem('bloom_image_provider', 'demo');
    });
  });

  for (const route of ['/travel', '/try-on'] as const) {
    test(`${route} has no critical axe violations`, async ({ page }) => {
      await page.goto(route);
      await page.waitForLoadState('networkidle');
      const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
      const critical = results.violations.filter((v) => v.impact === 'critical');
      expect(critical, JSON.stringify(critical, null, 2)).toEqual([]);
    });
  }
});
