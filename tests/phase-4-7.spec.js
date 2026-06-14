// @ts-check
import { test, expect } from '@playwright/test';

test('Gems within magnet radius move toward player', async ({ page }) => {
  const filePath = 'file://' + process.cwd().replace(/\\/g, '/') + '/index.html';
  await page.goto(filePath);

  // Pause the real-time background loop immediately so it doesn't interfere
  await page.keyboard.press('p');

  // Manually push a new gem 100 pixels away from the player
  await page.evaluate(() => {
    xpGems.push(new XPGem(window.player.x + 100, window.player.y));
  });

  const initialDist = await page.evaluate(() => {
    const gem = xpGems[0];
    return Math.hypot(gem.x - window.player.x, gem.y - window.player.y);
  });

  expect(initialDist).toBeCloseTo(100, 0);

  // Unpause, tick 5 frames, and repause synchronously
  await page.evaluate(() => {
    window.getIsPaused = () => false; // Mock unpause for tickGame
    let originalPaused = isPaused;
    isPaused = false; 
    for (let i = 0; i < 5; i++) window.tickGame(16);
    isPaused = originalPaused;
  });

  const finalDist = await page.evaluate(() => {
    const gem = xpGems[0];
    return Math.hypot(gem.x - window.player.x, gem.y - window.player.y);
  });

  expect(finalDist).toBeLessThan(initialDist); 

  await page.close();
});
