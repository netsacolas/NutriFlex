import { test, expect } from '@playwright/test';

test.describe('Fluxos críticos - visão geral', () => {
  test('Landing exibe chamada principal', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('body')).toContainText(/Entrar/i);
    await expect(page.locator('body')).toContainText(/IA/i);
  });

  test('Landing destaca call-to-actions de cadastro', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('body')).toContainText(/Começ/i);
    await expect(page.locator('body')).toContainText(/Grátis|Gratuit/i);
  });
});
