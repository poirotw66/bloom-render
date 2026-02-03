/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
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
    originalPrice?: string;
    priceRange?: string;
    badgeKey?: string;
    actionLabelKey: string;
    targetRoute: string;
    queryParams?: Record<string, string>;
};
