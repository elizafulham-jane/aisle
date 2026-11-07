import { expect, test } from '@playwright/test';

test.describe('sign-in', () => {
  test('signed-out visitors are sent from the app to sign-in, keeping where they were going', async ({
    page,
  }) => {
    await page.goto('/app');
    await expect(page).toHaveURL(/\/sign-in\?next=%2Fapp$/);
    await expect(page.getByRole('heading', { level: 1, name: 'Sign in' })).toBeVisible();
  });

  test('offers magic link, Apple and Google', async ({ page }) => {
    await page.goto('/sign-in');
    await expect(page.getByLabel('Email address')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Email me a sign-in link' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Continue with Apple' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Continue with Google' })).toBeVisible();
  });

  test('explains an invalid email next to the field', async ({ page }) => {
    await page.goto('/sign-in');
    await page.getByLabel('Email address').fill('not-an-email');
    await page.getByRole('button', { name: 'Email me a sign-in link' }).click();
    await expect(
      page.getByRole('alert').filter({ hasText: 'Enter a valid email address' }),
    ).toBeVisible();
    await expect(page.getByLabel('Email address')).toHaveAttribute('aria-invalid', 'true');
  });

  test('ignores off-site redirect targets', async ({ page }) => {
    await page.goto('/sign-in?next=//evil.example');
    await expect(page.locator('input[name="next"]').first()).toHaveValue('/app');
  });

  test('is keyboard reachable', async ({ page }) => {
    await page.goto('/sign-in');
    await page.keyboard.press('Tab');
    await expect(page.getByLabel('Email address')).toBeFocused();
  });
});
