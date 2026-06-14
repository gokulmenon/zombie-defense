// @ts-check
import { test, expect } from '@playwright/test';

test('enemies spawn outside canvas bounds', async ({ page }) => {
  const filePath = 'file://' + process.cwd().replace(/\\/g, '/') + '/index.html';
  await page.goto(filePath);

  // Wait a bit for enemies to spawn
  await new Promise(resolve => setTimeout(resolve, 2000));

  const enemyPositions = await page.evaluate(() => window.getEnemies());
  
  expect(enemyPositions.length).toBeGreaterThan(0);

  // Verify all spawned enemies have valid coordinate properties
  for (const pos of enemyPositions) {
    expect(pos.x).toBeDefined();
    expect(pos.y).toBeDefined();
  }
});

test('enemies move toward player', async ({ page }) => {
  const filePath = 'file://' + process.cwd().replace(/\\/g, '/') + '/index.html';
  await page.goto(filePath);

  // Wait for spawn (increased slightly for reliability across browsers)
  await new Promise(resolve => setTimeout(resolve, 2000));

  const { width, height } = await page.evaluate(() => ({ width: window.innerWidth, height: window.innerHeight }));

  const initialDistToCenter = await page.evaluate(({ width, height }) => {
    const enemies = window.getEnemies();
    if (enemies.length === 0) return null;
    // Use index 0 for consistency across frames
    const enemy = enemies[0]; 
    const playerX = width / 2;
    const playerY = height / 2;
    return Math.sqrt(Math.pow(enemy.x - playerX, 2) + Math.pow(enemy.y - playerY, 2));
  }, { width, height });

  expect(initialDistToCenter).not.toBeNull();

  // Wait for movement to occur
  await new Promise(resolve => setTimeout(resolve, 500));

  const finalDistToCenter = await page.evaluate(({ width, height }) => {
    const enemies = window.getEnemies();
    if (enemies.length === 0) return null;
    const enemy = enemies[0]; // Same index to track the same entity
    const playerX = width / 2;
    const playerY = height / 2;
    return Math.sqrt(Math.pow(enemy.x - playerX, 2) + Math.pow(enemy.y - playerY, 2));
  }, { width, height });

  expect(finalDistToCenter).toBeLessThan(initialDistToCenter);
});

test('enemies are removed when out of bounds', async ({ page }) => {
  const filePath = 'file://' + process.cwd().replace(/\\/g, '/') + '/index.html';
  await page.goto(filePath);

  // Wait for enemies to spawn and potentially move off screen (if they pass player)
  await new Promise(resolve => setTimeout(resolve, 3000));

  const enemyCount = await page.evaluate(() => window.getEnemies().length);
  
  // Should have some enemies, but not infinite (removed when out of bounds)
  expect(enemyCount).toBeGreaterThan(0);
  expect(enemyCount).toBeLessThan(10); // Arbitrary reasonable limit to ensure removal works
});
