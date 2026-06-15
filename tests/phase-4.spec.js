// @ts-check
import { test, expect } from '@playwright/test';

test('pressing spacebar spawns a projectile', async ({ page }) => {
  const filePath = 'file://' + process.cwd().replace(/\\/g, '/') + '/index.html';
  await page.goto(filePath);

  // Wait for game to initialize and spawn an enemy
  await page.evaluate(() => window.tickGame(1600));

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
  await page.evaluate(() => window.tickGame(1600));

  // Get initial positions
  const playerPos = await page.evaluate(() => window.getPlayerPos());
  const enemyPositions = await page.evaluate(() => window.getEnemies().map(e => ({ x: e.x, y: e.y })));
  
  expect(enemyPositions.length).toBeGreaterThan(0);

  // Fire synchronously and tick 2 frames
  await page.evaluate(() => {
      window.fireProjectile();
      window.tickGame(16);
      window.tickGame(16);
  });
  
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
  await page.evaluate(() => window.tickGame(1600));

  let enemyCountBefore = await page.evaluate(() => window.getEnemies().length);
  expect(enemyCountBefore).toBeGreaterThan(0);

  // Group physics setup, action, and ticks into a single synchronous thread block
  await page.evaluate(() => {
    const enemies = window.getEnemies();
    if (enemies.length > 0) {
      enemies[0].x = window.player.x + 30; 
      enemies[0].y = window.player.y;
    }
    window.fireProjectile();
    for(let i=0; i<30; i++) window.tickGame(16);
  });

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
  await page.evaluate(() => window.tickGame(1600));

  let initialXP = await page.evaluate(() => window.getPlayerXP());
  
  // Group physics setup, action, and ticks into a single synchronous thread block
  await page.evaluate(() => {
    const enemies = window.getEnemies();
    if (enemies.length > 0) {
      enemies[0].x = window.player.x + 30; 
      enemies[0].y = window.player.y;
    }
    window.fireProjectile();
    for(let i=0; i<30; i++) window.tickGame(16);
  });

  const finalXP = await page.evaluate(() => window.getPlayerXP());
  
  expect(finalXP).toBeGreaterThan(initialXP);
  
  await page.close();
});
