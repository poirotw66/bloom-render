/**
 * @license
 * SPDX-License-Identifier: MIT
 */

export type PhotographyServiceCategory = {
  id: string;
  labelKey: string;
  order: number;
};

export type PhotographyServiceItem = {
  id: string;
  categoryId: string;
  nameKey: string;
  descriptionKey: string;
  badgeKey?: string;
  actionLabelKey: string;
  targetRoute: string;
  queryParams?: Record<string, string>;
};
