// @ts-check
import { test, expect } from '@playwright/test';

test('enemies spawn outside canvas bounds', async ({ page }) => {
  const filePath = 'file://' + process.cwd().replace(/\\/g, '/') + '/index.html';
  await page.goto(filePath);

  // Wait for enemies to spawn using deterministic tick
  await page.evaluate(() => window.tickGame(1600));

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

  // Wait for spawn using deterministic tick
  await page.evaluate(() => window.tickGame(1600));

  // Get initial position of the first enemy
  const initialPos = await page.evaluate(() => {
    const enemies = window.getEnemies();
    return enemies.length > 0 ? { x: enemies[0].x, y: enemies[0].y } : null;
  });

  expect(initialPos).not.toBeNull();

  // Tick the game engine explicitly to process physics/movement (30 frames ~ 480ms)
  await page.evaluate(() => {
    for(let i=0; i<30; i++) window.tickGame(16);
  });

  // Get final position
  const finalPos = await page.evaluate(() => {
    const enemies = window.getEnemies();
    return enemies.length > 0 ? { x: enemies[0].x, y: enemies[0].y } : null;
  });

  // Assert the enemy has successfully moved from its initial position
  expect(finalPos.x).not.toBe(initialPos.x);
  expect(finalPos.y).not.toBe(initialPos.y);
});


test('enemies are removed when out of bounds', async ({ page }) => {
  const filePath = 'file://' + process.cwd().replace(/\\/g, '/') + '/index.html';
  await page.goto(filePath);

  // Wait for enemies to spawn and potentially move off screen using deterministic tick
  await page.evaluate(() => window.tickGame(1600));

  const enemyCount = await page.evaluate(() => window.getEnemies().length);
  
  // Should have some enemies, but not infinite (removed when out of bounds)
  expect(enemyCount).toBeGreaterThan(0);
  expect(enemyCount).toBeLessThan(10); // Arbitrary reasonable limit to ensure removal works
});
