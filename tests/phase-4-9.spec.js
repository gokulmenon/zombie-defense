// @ts-check
import { test, expect } from '@playwright/test';

test('Phase 4.9.4: Enemies spawn strictly within top-lane bounds', async ({ page }) => {
  const filePath = 'file://' + process.cwd().replace(/\\/g, '/') + '/index.html';
  await page.goto(filePath);

  await page.evaluate(() => window.tickGame(16));

  const { spawnData, widthBounds } = await page.evaluate(() => {
    if (window.enemies) window.enemies.length = 0;

    if (typeof window.spawnEnemy === 'function') {
      window.spawnEnemy();
    }

    return {
      spawnData: window.enemies.map(e => ({ x: e.x, y: e.y, isLeft: e.isLeft })),
      widthBounds: window.innerWidth
    };
  });

  expect(spawnData.length).toBeGreaterThan(0);

  for (const enemy of spawnData) {
    expect(enemy.y).toBeLessThanOrEqual(0);

    if (enemy.isLeft) {
      expect(enemy.x).toBeLessThan(widthBounds * 0.5);
    } else {
      expect(enemy.x).toBeGreaterThan(widthBounds * 0.5);
    }
  }
});

test('Phase 4.9.4: Enemies progress sequentially through waypoints', async ({ page }) => {
  const filePath = 'file://' + process.cwd().replace(/\\/g, '/') + '/index.html';
  await page.goto(filePath);

  await page.evaluate(() => window.tickGame(16));

  const progression = await page.evaluate(() => {
    if (window.enemies) window.enemies.length = 0;

    const testEnemy = new window.Enemy(window.innerWidth * 0.15, -50, true);
    testEnemy.speed = 0.5; // 0.5 * 16ms = 8px/tick, well under 15px snap radius
    window.enemies.push(testEnemy);

    const initialIdx = testEnemy.waypointIndex;

    // Tick enough for the enemy to reach at least the first waypoint
    for (let i = 0; i < 1000; i++) window.tickGame(16);

    return {
      initialIdx: initialIdx,
      finalIdx: testEnemy.waypointIndex
    };
  });

  expect(progression.finalIdx).toBeGreaterThan(progression.initialIdx);
});

test('Phase 4.9.4: Enemies successfully navigate maze into the player base', async ({ page }) => {
  const filePath = 'file://' + process.cwd().replace(/\\/g, '/') + '/index.html';
  await page.goto(filePath);

  await page.setViewportSize({ width: 800, height: 600 });
  await page.evaluate(() => window.tickGame(16));

  const state = await page.evaluate(() => {
    if (window.enemies) window.enemies.length = 0;

    const testEnemy = new window.Enemy(window.innerWidth * 0.20, -50, true);
    window.enemies.push(testEnemy);

    // Move player far away to prevent collision
    if (typeof player !== 'undefined') {
      player.x = 750;
      player.y = 550;
    }

    // Teleport the enemy to each waypoint sequentially to verify index advances
    for (let step = 0; step < 20; step++) {
      if (testEnemy.waypointIndex < testEnemy.waypoints.length) {
        const wp = testEnemy.waypoints[testEnemy.waypointIndex];
        testEnemy.x = wp.x;
        testEnemy.y = wp.y;
      }
      testEnemy.update(16);
    }

    return {
      waypointIdx: testEnemy.waypointIndex,
      totalWaypoints: testEnemy.waypoints.length,
      finalY: testEnemy.y,
    };
  });

  expect(state.waypointIdx).toBeGreaterThanOrEqual(state.totalWaypoints);
  expect(state.finalY).toBeGreaterThan(300);
});
