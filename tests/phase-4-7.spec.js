// @ts-check
import { test, expect } from '@playwright/test';

test('HUD updates when XP is collected', async ({ page }) => {
  const filePath = 'file://' + process.cwd().replace(/\\/g, '/') + '/index.html';
  await page.goto(filePath);

  // Wait for spawn
  await page.evaluate(() => window.tickGame(1600));

  let initialXP = await page.evaluate(() => window.getPlayerXP());

  // Group physics setup, action, and ticks into a single synchronous thread block
  await page.evaluate(() => {
    const enemies = window.getEnemies();
    if (enemies.length > 0) {
      window.player.x = enemies[0].x - 10;
      window.player.y = enemies[0].y;
    }
    window.fireProjectile();
    for (let i = 0; i < 5; i++) window.tickGame(16);
  });

  const finalXP = await page.evaluate(() => window.getPlayerXP());

  expect(finalXP).toBeGreaterThan(initialXP);

  // Check HUD text contains the new XP value
  const hudText = await page.$eval('#hud', el => el.innerText);
  expect(hudText).toContain(String(finalXP));

  await page.close();
});

test('Gems within magnet radius move toward player', async ({ page }) => {
  const filePath = 'file://' + process.cwd().replace(/\\/g, '/') + '/index.html';
  await page.goto(filePath);

  // Manually push a new gem 100 pixels away from the player
  await page.evaluate(() => {
    xpGems.push(new XPGem(window.player.x + 100, window.player.y));
  });

  const initialDist = await page.evaluate(() => {
    const gem = xpGems[0];
    return Math.hypot(gem.x - window.player.x, gem.y - window.player.y);
  });

  expect(initialDist).toBeCloseTo(100, 0);

  // Tick the game by 16ms (5 ticks of 16ms = 80ms total)
  await page.evaluate(() => {
    for (let i = 0; i < 5; i++) window.tickGame(16);
  });

  const finalDist = await page.evaluate(() => {
    const gem = xpGems[0];
    return Math.hypot(gem.x - window.player.x, gem.y - window.player.y);
  });

  expect(finalDist).toBeLessThan(initialDist); // Should be less than 100

  await page.close();
});

test('Pause stops physics and spawning', async ({ page }) => {
  const filePath = 'file://' + process.cwd().replace(/\\/g, '/') + '/index.html';
  await page.goto(filePath);

  // Toggle the pause state via 'p' key
  await page.keyboard.press('p');

  expect(await page.evaluate(() => window.getIsPaused())).toBe(true);

  const initialPlayerPos = await page.evaluate(() => ({ x: window.player.x, y: window.player.y }));

  // Tick the game by 2000ms (125 ticks of 16ms) while paused
  await page.evaluate(() => {
    for (let i = 0; i < 125; i++) window.tickGame(16);
  });

  const finalPlayerPos = await page.evaluate(() => ({ x: window.player.x, y: window.player.y }));

  expect(finalPlayerPos).toEqual(initialPlayerPos); // Player position unchanged

  // Expect no enemies to have spawned since the game was paused from the start
  const enemyCount = await page.evaluate(() => window.getEnemies().length);
  expect(enemyCount).toBe(0);

  await page.close();
});