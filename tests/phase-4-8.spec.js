// @ts-check
import { test, expect } from '@playwright/test';

test('Player movement is clamped and sliding occurs', async ({ page }) => {
  const filePath = 'file://' + process.cwd().replace(/\\/g, '/') + '/index.html';
  await page.goto(filePath);

  // Wait for initial spawn
  await page.evaluate(() => window.tickGame(1600));

  // Clear existing enemies and projectiles to isolate the test scenario
  await page.evaluate(() => {
    enemies.length = 0;
    projectiles.length = 0;
  });

  const initialPlayerPos = await page.evaluate(() => ({ x: player.x, y: player.y }));

  // Create an obstacle directly in front of the player (above them)
  await page.evaluate((px, py) => {
    obstacles.push(new Obstacle(px - 50, py - 120, 200, 40));
  }, initialPlayerPos.x, initialPlayerPos.y);

  // Simulate pressing 'w' (up) and 'd' (right), then tick physics
  await page.evaluate(() => {
    keys.w = true;
    keys.d = true;
    for(let i = 0; i < 10; i++) window.tickGame(16);
  });

  const finalPlayerPos = await page.evaluate(() => ({ x: player.x, y: player.y }));

  // Assert sliding occurred on X axis (moved right)
  expect(finalPlayerPos.x).toBeGreaterThan(initialPlayerPos.x);
  
  // Assert clamping occurred on Y axis (didn't move up significantly into the wall)
  expect(Math.abs(finalPlayerPos.y - initialPlayerPos.y)).toBeLessThan(5);

  await page.close();
});
