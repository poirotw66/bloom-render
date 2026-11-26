import { expect, type Page } from '@playwright/test';

/** Open an action where the user sees it: in the workspace or the compact tools menu. */
export async function openWorkspace(page: Page, name: string) {
  const label = name === 'Material basket' ? /^(?:Basket|Material basket)(?:\s|$)/ : name;
  const direct = page
    .getByRole('button', { name: label, exact: typeof label === 'string' })
    .filter({ visible: true })
    .first();
  const workspaceTools = page.getByText('Workspace tools', { exact: true });
  if (!(await direct.isVisible()) && (await workspaceTools.isVisible())) {
    await workspaceTools.click();
  }
  if (await direct.isVisible()) await direct.click();
  else {
    await page.getByRole('button', { name: 'All photo tools', exact: true }).click();
    await page
      .getByRole('dialog', { name: 'All photo tools', exact: true })
      .getByRole('button', { name: label, exact: typeof label === 'string' })
      .click();
  }
  const dialog = page.getByRole('dialog', { name, exact: true });
  await expect(dialog).toBeVisible();
  return dialog;
}
