// @ts-check
import { test, expect } from '@playwright/test';

test('Gems within magnet radius move toward player', async ({ page }) => {
  const filePath = 'file://' + process.cwd().replace(/\\/g, '/') + '/index.html';
  await page.goto(filePath);

  // Wait for modules to load, then tick once to initialize
  await page.evaluate(() => window.tickGame(16));

  // Manually push a new gem 100 pixels away from the player
  await page.evaluate(() => {
    window.xpGems.push(new window.XPGem(window.player.x + 100, window.player.y));
  });

  const initialDist = await page.evaluate(() => {
    const gem = window.xpGems[window.xpGems.length - 1];
    return Math.hypot(gem.x - window.player.x, gem.y - window.player.y);
  });

  expect(initialDist).toBeCloseTo(100, 0);

  // Tick 5 frames — gem should be attracted toward the player by the magnet
  await page.evaluate(() => {
    for (let i = 0; i < 5; i++) window.tickGame(16);
  });

  const finalDist = await page.evaluate(() => {
    const gem = window.xpGems[window.xpGems.length - 1];
    return Math.hypot(gem.x - window.player.x, gem.y - window.player.y);
  });

  expect(finalDist).toBeLessThan(initialDist);

  await page.close();
});
