const { test, expect } = require('@playwright/test');

test.describe('Duration Selector', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        // Clear localStorage to start fresh
        await page.evaluate(() => localStorage.clear());
        await page.reload();
    });

    test('should have 16h selected by default', async ({ page }) => {
        const btn16h = page.locator('[data-hours="16"]');
        await expect(btn16h).toHaveClass(/active/);
    });

    test('should select 12h preset and update remaining time', async ({ page }) => {
        const btn12h = page.locator('[data-hours="12"]');
        await btn12h.click();

        await expect(btn12h).toHaveClass(/active/);

        // Check that remaining time shows 12:00:00
        const remaining = page.locator('#remaining');
        await expect(remaining).toHaveText('12:00:00');
    });

    test('should select 18h preset and deselect others', async ({ page }) => {
        const btn18h = page.locator('[data-hours="18"]');
        const btn16h = page.locator('[data-hours="16"]');

        await btn18h.click();

        await expect(btn18h).toHaveClass(/active/);
        await expect(btn16h).not.toHaveClass(/active/);

        const remaining = page.locator('#remaining');
        await expect(remaining).toHaveText('18:00:00');
    });

    test('should select 20h preset', async ({ page }) => {
        const btn20h = page.locator('[data-hours="20"]');
        await btn20h.click();

        await expect(btn20h).toHaveClass(/active/);

        const remaining = page.locator('#remaining');
        await expect(remaining).toHaveText('20:00:00');
    });

    test('should select 24h preset', async ({ page }) => {
        const btn24h = page.locator('[data-hours="24"]');
        await btn24h.click();

        await expect(btn24h).toHaveClass(/active/);

        const remaining = page.locator('#remaining');
        await expect(remaining).toHaveText('24:00:00');
    });

    test('should open custom input when clicking custom button', async ({ page }) => {
        const customBtn = page.locator('#custom-btn');
        const customInput = page.locator('#custom-input-wrapper');

        await expect(customInput).not.toHaveClass(/show/);
        await customBtn.click();
        await expect(customInput).toHaveClass(/show/);
    });

    test('should set custom hours duration', async ({ page }) => {
        const customBtn = page.locator('#custom-btn');
        const hoursInput = page.locator('#custom-hours');
        const setBtn = page.locator('#custom-set-btn');

        await customBtn.click();
        await hoursInput.fill('14');
        await setBtn.click();

        await expect(customBtn).toHaveClass(/active/);
        await expect(customBtn).toContainText('14h');

        const remaining = page.locator('#remaining');
        await expect(remaining).toHaveText('14:00:00');
    });

    test('should set custom days and hours duration', async ({ page }) => {
        const customBtn = page.locator('#custom-btn');
        const daysInput = page.locator('#custom-days');
        const hoursInput = page.locator('#custom-hours');
        const setBtn = page.locator('#custom-set-btn');

        await customBtn.click();
        await daysInput.fill('2');
        await hoursInput.fill('6');
        await setBtn.click();

        await expect(customBtn).toHaveClass(/active/);
        await expect(customBtn).toContainText('2d 6h');

        const remaining = page.locator('#remaining');
        await expect(remaining).toHaveText('54:00:00');
    });

    test('should set custom days only duration', async ({ page }) => {
        const customBtn = page.locator('#custom-btn');
        const daysInput = page.locator('#custom-days');
        const setBtn = page.locator('#custom-set-btn');

        await customBtn.click();
        await daysInput.fill('3');
        await setBtn.click();

        await expect(customBtn).toHaveClass(/active/);
        await expect(customBtn).toContainText('3d');

        const remaining = page.locator('#remaining');
        await expect(remaining).toHaveText('72:00:00');
    });

    test('should deselect custom when selecting preset', async ({ page }) => {
        const customBtn = page.locator('#custom-btn');
        const hoursInput = page.locator('#custom-hours');
        const setBtn = page.locator('#custom-set-btn');
        const btn16h = page.locator('[data-hours="16"]');

        // Set custom first
        await customBtn.click();
        await hoursInput.fill('14');
        await setBtn.click();
        await expect(customBtn).toHaveClass(/active/);

        // Click preset
        await btn16h.click();
        await expect(btn16h).toHaveClass(/active/);
        await expect(customBtn).not.toHaveClass(/active/);
    });

    test('should persist duration selection after reload', async ({ page }) => {
        const btn24h = page.locator('[data-hours="24"]');
        await btn24h.click();

        await page.reload();

        await expect(btn24h).toHaveClass(/active/);
        const remaining = page.locator('#remaining');
        await expect(remaining).toHaveText('24:00:00');
    });

    test('should persist custom duration after reload', async ({ page }) => {
        const customBtn = page.locator('#custom-btn');
        const daysInput = page.locator('#custom-days');
        const hoursInput = page.locator('#custom-hours');
        const setBtn = page.locator('#custom-set-btn');

        await customBtn.click();
        await daysInput.fill('1');
        await hoursInput.fill('8');
        await setBtn.click();

        await page.reload();

        await expect(customBtn).toHaveClass(/active/);
        await expect(customBtn).toContainText('1d 8h');
    });
});
