// @ts-check
import { test, expect } from '@playwright/test';

test('Player movement is clamped and sliding occurs', async ({ page }) => {
  const filePath = 'file://' + process.cwd().replace(/\\/g, '/') + '/index.html';
  await page.goto(filePath);

  // Wait for initial spawn
  await page.evaluate(() => window.tickGame(1600));

  const initialPlayerPos = await page.evaluate(() => {
    // Clear live engine arrays via global handles
    if (window.enemies) window.enemies.length = 0;
    if (window.projectiles) window.projectiles.length = 0;
    if (window.obstacles) window.obstacles.length = 0;

    // Reset player position explicitly to center
    player.x = 400;
    player.y = 300;
    
    // Inject using the actual engine constructor to guarantee structural compliance
    window.obstacles.push(new Obstacle(300, 240, 200, 40));
    if (window.obstacles[0]) window.obstacles[0].isPerimeter = false;
    
    return { x: player.x, y: player.y };
  });

  // Simulate pressing 'w' (up) and 'd' (right), then tick physics
  await page.evaluate(() => {
    keys.w = true;
    keys.d = true;
    for(let i = 0; i < 15; i++) window.tickGame(16);
  });

  const finalPlayerPos = await page.evaluate(() => ({ x: player.x, y: player.y }));

  // Assert sliding occurred on X axis (moved right)
  expect(finalPlayerPos.x).toBeGreaterThan(initialPlayerPos.x);
  
  // Assert clamping occurred on Y axis (blocked by the wall)
  expect(Math.abs(finalPlayerPos.y - initialPlayerPos.y)).toBeLessThan(25);

  await page.close();
});

test('Enemy Line-of-Sight is correctly blocked', async ({ page }) => {
  const filePath = 'file://' + process.cwd().replace(/\\/g, '/') + '/index.html';
  await page.goto(filePath);

  await page.evaluate(() => window.tickGame(1600));

  const hasLoS = await page.evaluate(() => {
    if (window.obstacles) window.obstacles.length = 0;
    window.obstacles.push(new Obstacle(200, 200, 400, 200));
    if (window.obstacles[0]) window.obstacles[0].isPerimeter = false;

    // Place player 20px above the wall structure
    player.x = 400;
    player.y = 180;

    // Place enemy 20px below the wall structure
    const enemyX = 400;
    const enemyY = 420;

    return checkLineOfSight(player.x, player.y, enemyX, enemyY);
  });

  expect(hasLoS).toBe(false);
});

test('Enemy Avoidance steering forces perpendicular navigation', async ({ page }) => {
  const filePath = 'file://' + process.cwd().replace(/\\/g, '/') + '/index.html';
  await page.goto(filePath);

  await page.evaluate(() => window.tickGame(1600));

  const { initialPos, finalPos } = await page.evaluate(() => {
    if (window.obstacles) window.obstacles.length = 0;
    if (window.enemies) window.enemies.length = 0;

    // Push test obstacle
    window.obstacles.push(new Obstacle(300, 250, 200, 50));
    if (window.obstacles[0]) window.obstacles[0].isPerimeter = false;

    // Construct an actual live Enemy instance via the engine class
    const testEnemy = new Enemy(400, 305);
    
    // Explicitly override random speed to a fixed high number for deterministic testing
    testEnemy.speed = 1.5; 
    
    window.enemies.push(testEnemy);

    // Position player far above the wall and slightly right to form an angle
    player.x = 450; 
    player.y = 150;

    const startX = testEnemy.x;
    const startY = testEnemy.y;

    // Run physics clock 25 times to accumulate horizontal vector pathing changes
    for(let i = 0; i < 25; i++) window.tickGame(16);

    return {
        initialPos: { x: startX, y: startY },
        finalPos: { x: testEnemy.x, y: testEnemy.y }
    };
  });

  // Assert that the enemy successfully steered horizontally around the obstacle wall
  const distanceMovedX = Math.abs(finalPos.x - initialPos.x);
  expect(distanceMovedX).toBeGreaterThan(0.1); // Expect a distinct measurable change
});