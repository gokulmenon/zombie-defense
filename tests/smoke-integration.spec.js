// @ts-check
import { test, expect } from '@playwright/test';

test('E2E Flow - Player Controls, Sliding, and Spawning Distribution', async ({ page }) => {
  const filePath = 'file://' + process.cwd().replace(/\\/g, '/') + '/index.html';
  await page.goto(filePath);
  await page.setViewportSize({ width: 800, height: 600 });

  // Clear map array collections
  await page.evaluate(() => {
    window.obstacles.length = 0;
    window.enemies.length = 0;
    window.projectiles.length = 0;
    
    // Spawn an obstacle natively above the player
    window.obstacles.push(new Obstacle(350, 240, 100, 40));
    if (window.obstacles[0]) window.obstacles[0].isPerimeter = false;

    keys.w = true;
    keys.d = true;
  });

  // Run tickGame for 15 frames
  await page.evaluate(() => {
    for(let i = 0; i < 15; i++) window.tickGame(16);
  });

  const finalPlayerPos = await page.evaluate(() => ({ x: player.x, y: player.y }));

  // Assert sliding horizontally (X moves right) and Y clamping restricts vertical clipping
  expect(finalPlayerPos.x).toBeGreaterThan(400);
  expect(Math.abs(finalPlayerPos.y - 312)).toBeLessThan(40); 

  // Clear enemies and spawn one
  await page.evaluate(() => {
    window.enemies.length = 0;
    window.spawnEnemy();
  });

  const enemyData = await page.evaluate(() => {
    if (window.enemies.length === 0) return null;
    return { x: window.enemies[0].x, y: window.enemies[0].y, isLeft: window.enemies[0].isLeft };
  });

  expect(enemyData).not.toBeNull();
  expect(enemyData.y).toBeLessThanOrEqual(0);
  
  // Assert isLeft matches width layout quadrant (400 is half of 800)
  if (enemyData.x < 400) {
    expect(enemyData.isLeft).toBe(true);
  } else {
    expect(enemyData.isLeft).toBe(false);
  }

  await page.close();
});

test('E2E Flow - Waypoint Tracking AI Route Navigation', async ({ page }) => {
  const filePath = 'file://' + process.cwd().replace(/\\/g, '/') + '/index.html';
  await page.goto(filePath);
  await page.setViewportSize({ width: 800, height: 600 });

  // Clear obstacles and enemies
  await page.evaluate(() => {
    window.obstacles.length = 0;
    window.enemies.length = 0;
    
    // Mock checkLineOfSight to guarantee routing isolation
    window.checkLineOfSight = () => false;

    // Move player far away to prevent collision with the test enemy
    player.x = 750;
    player.y = 550;
  });

  // Spawn dedicated left-lane enemy with moderate speed
  await page.evaluate(() => {
    const testEnemy = new window.Enemy(window.innerWidth * 0.20, -50, true);
    testEnemy.speed = 0.5;
    window.enemies.push(testEnemy);
  });

  // Run clock for 3000 frames to allow full maze traversal at moderate speed
  await page.evaluate(() => {
    for(let i = 0; i < 3000; i++) window.tickGame(16);
  });

  const state = await page.evaluate(() => {
    if (window.enemies.length === 0) return null;
    const testEnemy = window.enemies[0];
    return {
      waypointIdx: testEnemy.waypointIndex,
      totalWaypoints: testEnemy.waypoints.length,
      finalY: testEnemy.y
    };
  });

  expect(state).not.toBeNull();
  // Assert path sequence ran to completion and entered defensive zone boundary
  expect(state.waypointIdx).toBeGreaterThanOrEqual(state.totalWaypoints);
  expect(state.finalY).toBeGreaterThan(600 * 0.45);

  await page.close();
});
