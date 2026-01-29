const { test, expect } = require('@playwright/test');

test.describe('Fasting Stats', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        await page.evaluate(() => localStorage.clear());
        await page.reload();
    });

    test('should start with zero stats', async ({ page }) => {
        const streak = page.locator('#streak');
        const totalFasts = page.locator('#total-fasts');
        const longest = page.locator('#longest');

        await expect(streak).toHaveText('0');
        await expect(totalFasts).toHaveText('0');
        await expect(longest).toHaveText('0h');
    });

    test('should start a fast and show fasting state', async ({ page }) => {
        const startBtn = page.locator('#start-btn');
        const stopBtn = page.locator('#stop-btn');
        const statusText = page.locator('.status-text');

        await startBtn.click();

        await expect(startBtn).toBeHidden();
        await expect(stopBtn).toBeVisible();
        await expect(statusText).toHaveText('Fasting');
    });

    test('should show elapsed time when fasting', async ({ page }) => {
        const startBtn = page.locator('#start-btn');
        const elapsed = page.locator('#elapsed');

        await expect(elapsed).toHaveText('00:00:00');
        await startBtn.click();

        // Wait a moment and check elapsed is updating
        await page.waitForTimeout(1100);
        await expect(elapsed).not.toHaveText('00:00:00');
    });

    test('should show start and end times when fasting', async ({ page }) => {
        const startBtn = page.locator('#start-btn');
        const startTime = page.locator('#start-time');
        const endTime = page.locator('#end-time');

        await expect(startTime).toHaveText('-');
        await expect(endTime).toHaveText('-');

        await startBtn.click();

        await expect(startTime).not.toHaveText('-');
        await expect(endTime).not.toHaveText('-');
    });

    test('should increment total fasts when completing 50%+ of fast', async ({ page }) => {
        // Set a very short duration for testing by manipulating state
        await page.evaluate(() => {
            const state = {
                isFasting: true,
                startTime: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(), // 10 hours ago
                duration: 16 * 60 * 60 * 1000, // 16 hour fast (10h is >50%)
                stats: { streak: 0, totalFasts: 0, longestFast: 0, lastFastDate: null }
            };
            localStorage.setItem('fasttrack_data', JSON.stringify(state));
        });
        await page.reload();

        const stopBtn = page.locator('#stop-btn');
        const totalFasts = page.locator('#total-fasts');

        await stopBtn.click();
        await page.locator('#modal-confirm').click();

        await expect(totalFasts).toHaveText('1');
    });

    test('should not increment total fasts when completing less than 50%', async ({ page }) => {
        await page.evaluate(() => {
            const state = {
                isFasting: true,
                startTime: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
                duration: 16 * 60 * 60 * 1000, // 16 hour fast (2h is <50%)
                stats: { streak: 0, totalFasts: 0, longestFast: 0, lastFastDate: null }
            };
            localStorage.setItem('fasttrack_data', JSON.stringify(state));
        });
        await page.reload();

        const stopBtn = page.locator('#stop-btn');
        const totalFasts = page.locator('#total-fasts');

        await stopBtn.click();
        await page.locator('#modal-confirm').click();

        await expect(totalFasts).toHaveText('0');
    });

    test('should update longest fast when beating previous record', async ({ page }) => {
        await page.evaluate(() => {
            const state = {
                isFasting: true,
                startTime: new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString(), // 20 hours ago
                duration: 24 * 60 * 60 * 1000,
                stats: { streak: 0, totalFasts: 5, longestFast: 16, lastFastDate: null }
            };
            localStorage.setItem('fasttrack_data', JSON.stringify(state));
        });
        await page.reload();

        const stopBtn = page.locator('#stop-btn');
        const longest = page.locator('#longest');

        await expect(longest).toHaveText('16h');

        await stopBtn.click();
        await page.locator('#modal-confirm').click();

        await expect(longest).toHaveText('20h');
    });

    test('should not update longest fast when shorter than record', async ({ page }) => {
        await page.evaluate(() => {
            const state = {
                isFasting: true,
                startTime: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(), // 10 hours ago
                duration: 16 * 60 * 60 * 1000,
                stats: { streak: 0, totalFasts: 5, longestFast: 24, lastFastDate: null }
            };
            localStorage.setItem('fasttrack_data', JSON.stringify(state));
        });
        await page.reload();

        const stopBtn = page.locator('#stop-btn');
        const longest = page.locator('#longest');

        await expect(longest).toHaveText('24h');

        await stopBtn.click();
        await page.locator('#modal-confirm').click();

        await expect(longest).toHaveText('24h');
    });

    test('should start streak at 1 on first completed fast', async ({ page }) => {
        await page.evaluate(() => {
            const state = {
                isFasting: true,
                startTime: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(),
                duration: 16 * 60 * 60 * 1000,
                stats: { streak: 0, totalFasts: 0, longestFast: 0, lastFastDate: null }
            };
            localStorage.setItem('fasttrack_data', JSON.stringify(state));
        });
        await page.reload();

        const stopBtn = page.locator('#stop-btn');
        const streak = page.locator('#streak');

        await stopBtn.click();
        await page.locator('#modal-confirm').click();

        await expect(streak).toHaveText('1');
    });

    test('should increment streak when fasting on consecutive days', async ({ page }) => {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);

        await page.evaluate((yesterdayStr) => {
            const state = {
                isFasting: true,
                startTime: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(),
                duration: 16 * 60 * 60 * 1000,
                stats: { streak: 5, totalFasts: 10, longestFast: 24, lastFastDate: yesterdayStr }
            };
            localStorage.setItem('fasttrack_data', JSON.stringify(state));
        }, yesterday.toDateString());
        await page.reload();

        const stopBtn = page.locator('#stop-btn');
        const streak = page.locator('#streak');

        await expect(streak).toHaveText('5');

        await stopBtn.click();
        await page.locator('#modal-confirm').click();

        await expect(streak).toHaveText('6');
    });

    test('should reset streak when missing a day', async ({ page }) => {
        const twoDaysAgo = new Date();
        twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

        await page.evaluate((twoDaysAgoStr) => {
            const state = {
                isFasting: true,
                startTime: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(),
                duration: 16 * 60 * 60 * 1000,
                stats: { streak: 10, totalFasts: 20, longestFast: 24, lastFastDate: twoDaysAgoStr }
            };
            localStorage.setItem('fasttrack_data', JSON.stringify(state));
        }, twoDaysAgo.toDateString());
        await page.reload();

        const stopBtn = page.locator('#stop-btn');
        const streak = page.locator('#streak');

        await expect(streak).toHaveText('10');

        await stopBtn.click();
        await page.locator('#modal-confirm').click();

        await expect(streak).toHaveText('1');
    });

    test('should persist fasting state after reload', async ({ page }) => {
        const startBtn = page.locator('#start-btn');
        const stopBtn = page.locator('#stop-btn');

        await startBtn.click();
        await expect(stopBtn).toBeVisible();

        await page.reload();

        await expect(stopBtn).toBeVisible();
        await expect(startBtn).toBeHidden();
    });

    test('should show phase indicator when fasting', async ({ page }) => {
        const startBtn = page.locator('#start-btn');
        const phaseIndicator = page.locator('#phase-indicator');

        await expect(phaseIndicator).toHaveClass(/hidden/);

        await startBtn.click();

        await expect(phaseIndicator).not.toHaveClass(/hidden/);
    });

    test('should disable duration selector when fasting', async ({ page }) => {
        const startBtn = page.locator('#start-btn');
        const durationSelector = page.locator('#duration-selector');

        await startBtn.click();

        await expect(durationSelector).toHaveCSS('pointer-events', 'none');
    });
});
