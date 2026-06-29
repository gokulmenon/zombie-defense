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
  await page.evaluate(() => window.tickGame(16));

  const result = await page.evaluate(() => {
    // Clear everything and set up a controlled scenario
    window.enemies.length = 0;
    window.projectiles.length = 0;

    // Place a single enemy 80px to the right of the player (far enough to avoid contact collision)
    window.spawnEnemy();
    const enemy = window.enemies[window.enemies.length - 1];
    enemy.x = window.player.x + 80;
    enemy.y = window.player.y;
    enemy.health = 1; // one projectile hit will kill it
    enemy.speed = 0;  // freeze it so it doesn't walk into the player

    // Tag this enemy so we can track it
    enemy._testTarget = true;

    // Fire toward the enemy and tick until the projectile reaches it
    window.fireProjectile();
    for (let i = 0; i < 50; i++) window.tickGame(16);

    // Check if our tagged enemy survived
    const targetAlive = window.enemies.some(e => e._testTarget);
    return {
      targetAlive,
      projectiles: window.projectiles.length,
    };
  });

  expect(result.targetAlive).toBe(false);
  expect(result.projectiles).toBe(0);

  await page.close();
});

test('enemies drop XP gems on death and player collects them', async ({ page }) => {
  const filePath = 'file://' + process.cwd().replace(/\\/g, '/') + '/index.html';
  await page.goto(filePath);
  await page.evaluate(() => window.tickGame(16));

  const result = await page.evaluate(() => {
    // Clear and set up controlled scenario
    window.enemies.length = 0;
    window.projectiles.length = 0;
    window.xpGems.length = 0;
    window.player.xp = 0;
    window.player.gems = 0;

    // Place a single weak enemy close enough for projectile to reach, far enough to avoid contact
    window.spawnEnemy();
    const enemy = window.enemies[0];
    enemy.x = window.player.x + 60;
    enemy.y = window.player.y;
    enemy.health = 1;
    enemy.speed = 0; // freeze

    // Fire and tick until enemy dies and gems are collected
    window.fireProjectile();
    for (let i = 0; i < 100; i++) window.tickGame(16);

    return { xp: window.player.xp, gems: window.player.gems };
  });

  // Killing the enemy should have dropped a gem and collecting it awards XP + gems
  expect(result.xp).toBeGreaterThan(0);
  expect(result.gems).toBeGreaterThan(0);

  await page.close();
});
