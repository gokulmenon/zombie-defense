// @ts-check
import { test, expect } from '@playwright/test';

test('player moves when keys are pressed', async ({ page }) => {
  // Playwright requires a full URL or configured baseURL for relative paths.
  // We construct an absolute file:// URL to ensure it works locally without extra config.
  const filePath = 'file://' + process.cwd().replace(/\\/g, '/') + '/index.html';
  await page.goto(filePath);

  const initialPos = await page.evaluate(() => window.getPlayerPos());
  
  // Press 'w' (up) and 'd' (right) simultaneously for 500ms
  await page.keyboard.down('w');
  await page.keyboard.down('d');
  await new Promise(resolve => setTimeout(resolve, 500));
  await page.keyboard.up('w');
  await page.keyboard.up('d');

  const finalPos = await page.evaluate(() => window.getPlayerPos());

  // 'w' decreases Y coordinate (moves up), 'd' increases X coordinate (moves right)
  expect(finalPos.x).toBeGreaterThan(initialPos.x);
  expect(finalPos.y).toBeLessThan(initialPos.y);

  // Explicitly close the page to prevent Playwright worker hangs caused by requestAnimationFrame in game.js
  await page.close();
});
