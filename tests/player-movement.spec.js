// @ts-check
import { test, expect } from '@playwright/test';

test('player moves when keys are pressed', async ({ page }) => {
  await page.goto('./index.html');

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
});
