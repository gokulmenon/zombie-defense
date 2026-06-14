// @ts-check
import { test, expect } from '@playwright/test';

test('pressing spacebar spawns a projectile', async ({ page }) => {
  const filePath = 'file://' + process.cwd().replace(/\\/g, '/') + '/index.html';
  await page.goto(filePath);

  // Wait for game to initialize
  await new Promise(resolve => setTimeout(resolve, 1600));

  expect(await page.evaluate(() => window.getProjectiles().length)).toBe(0);

  // Press spacebar
  await page.keyboard.press(' ');

  const projectileCount = await page.evaluate(() => window.getProjectiles().length);
  expect(projectileCount).toBeGreaterThan(0);
  
  await page.close();
});

test('projectile correctly calculates vector toward closest enemy', async ({ page }) => {
  const filePath = 'file://' + process.cwd().replace(/\\/g, '/') + '/index.html';
  await page.goto(filePath);

  // Wait for spawn and initialization
  await new Promise(resolve => setTimeout(resolve, 1500));

  // Get initial positions
  const playerPos = await page.evaluate(() => window.getPlayerPos());
  const enemyPositions = await page.evaluate(() => window.getEnemies().map(e => ({ x: e.x, y: e.y })));
  
  expect(enemyPositions.length).toBeGreaterThan(0);

  // Press spacebar to fire
  await page.keyboard.press(' ');

  // Move for a short time to see if it travels in the right direction
  await new Promise(resolve => setTimeout(resolve, 100));
  
  const projPosAfter = await page.evaluate(() => window.getProjectiles()[0]);
  
  // Calculate expected direction vector towards the closest enemy (index 0)
  const dx = enemyPositions[0].x - playerPos.x;
  const dy = enemyPositions[0].y - playerPos.y;
  const dist = Math.hypot(dx, dy);
  const nx = dx / dist;
  const ny = dy / dist;

  // Calculate actual movement vector from initial player position
  const actualDx = projPosAfter.x - playerPos.x;
  const actualDy = projPosAfter.y - playerPos.y;
  const actualDist = Math.hypot(actualDx, actualDy);

  // Check if the angle is roughly correct using dot product (should be close to 1)
  const dotProduct = (actualDx * nx + actualDy * ny) / actualDist;
  expect(dotProduct).toBeGreaterThan(0.95); // Allow small floating point error
  
  await page.close();
});

test('projectiles and enemies are removed upon collision', async ({ page }) => {
  const filePath = 'file://' + process.cwd().replace(/\\/g, '/') + '/index.html';
  await page.goto(filePath);

  // Wait for spawn
  await new Promise(resolve => setTimeout(resolve, 1500));

  let enemyCountBefore = await page.evaluate(() => window.getEnemies().length);
  expect(enemyCountBefore).toBeGreaterThan(0);

  // Move player close to an enemy to ensure projectile hits it quickly
  await page.evaluate(() => {
    const enemies = window.getEnemies();
    if (enemies.length > 0) {
      window.player.x = enemies[0].x - 30; 
      window.player.y = enemies[0].y;
    }
  });

  // Fire projectile at the first enemy
  await page.keyboard.press(' ');

  // Wait for collision and removal
  await new Promise(resolve => setTimeout(resolve, 500));

  const enemyCountAfter = await page.evaluate(() => window.getEnemies().length);
  const projectileCount = await page.evaluate(() => window.getProjectiles().length);

  expect(enemyCountAfter).toBeLessThan(enemyCountBefore);
  expect(projectileCount).toBe(0); // Projectile should be gone after hitting
  
  await page.close();
});

test('enemies drop XP gems on death and player collects them', async ({ page }) => {
  const filePath = 'file://' + process.cwd().replace(/\\/g, '/') + '/index.html';
  await page.goto(filePath);

  // Wait for spawn
  await new Promise(resolve => setTimeout(resolve, 1500));

  let initialXP = await page.evaluate(() => window.getPlayerXP());
  
  // Move player close to an enemy so projectile hits it and gem spawns near player
  await page.evaluate(() => {
    const enemies = window.getEnemies();
    if (enemies.length > 0) {
      window.player.x = enemies[0].x - 30; 
      window.player.y = enemies[0].y;
    }
  });

  await page.keyboard.press(' ');

  // Wait for collision, gem spawn, and automatic collection by player
  await new Promise(resolve => setTimeout(resolve, 500));

  const finalXP = await page.evaluate(() => window.getPlayerXP());
  
  expect(finalXP).toBeGreaterThan(initialXP);
  
  await page.close();
});
