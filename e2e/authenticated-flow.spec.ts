import { test, expect } from '@playwright/test';

test.describe('Fluxo autenticado com mocks', () => {
  test.skip(true, 'Fluxo autenticado depende de mock do Supabase em Vite (não disponível no ambiente atual).');

  test('login, planner e hidratação com ambiente simulado', async ({ page }) => {
    await page.goto('/login');
    await page.evaluate(() => {
      const setter = (window as any).__nutrimaisSetMockSession;
      if (typeof setter === 'function') {
        setter('teste@nutrimais.dev');
      }
    });

    await page.fill('input#email', 'teste@nutrimais.dev');
    await page.fill('input#password', '12345678');
    await page.getByRole('button', { name: /Entrar/i }).click();
    await page.waitForTimeout(500);

    await page.goto('/plan');
    await page.waitForURL('**/plan', { timeout: 10_000 });
    await expect(page.locator('input[type="number"]').first()).toBeVisible();

    await page.goto('/hydration');
    await page.waitForURL('**/hydration', { timeout: 10_000 });
    await expect(page.locator('body')).toContainText(/Meta Diária/i);
    await expect(page.locator('body')).toContainText(/Configurações/i);
  });
});
