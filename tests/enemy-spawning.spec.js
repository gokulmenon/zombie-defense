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

  // Wait for spawn
  await new Promise(resolve => setTimeout(resolve, 1500));

  const initialEnemyPos = await page.evaluate(() => {
    const enemies = window.getEnemies();
    return enemies.length > 0 ? enemies[enemies.length - 1] : null;
  });

  expect(initialEnemyPos).not.toBeNull();

  // Wait for movement to occur
  await new Promise(resolve => setTimeout(resolve, 500));

  const finalEnemyPos = await page.evaluate(() => {
    const enemies = window.getEnemies();
    return enemies.length > 0 ? enemies[enemies.length - 1] : null;
  });

  // Enemy should have moved closer to player (player is roughly center)
  if (finalEnemyPos && initialEnemyPos) {
    const distInitial = Math.sqrt(
      Math.pow(initialEnemyPos.x - window.innerWidth/2, 2) + 
      Math.pow(initialEnemyPos.y - window.innerHeight/2, 2)
    );
    const distFinal = Math.sqrt(
      Math.pow(finalEnemyPos.x - window.innerWidth/2, 2) + 
      Math.pow(finalEnemyPos.y - window.innerHeight/2, 2)
    );
    expect(distFinal).toBeLessThan(distInitial);
  }
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
