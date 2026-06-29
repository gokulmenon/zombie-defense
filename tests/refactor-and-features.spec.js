// @ts-check
import { test, expect } from '@playwright/test';

const PAGE = () => 'file://' + process.cwd().replace(/\\/g, '/') + '/index.html';

// ---------------------------------------------------------------------------
// Requirement 1: Spawn refactor — level/wave/spawn-rate APIs
// ---------------------------------------------------------------------------

test('R1.1: spawner module exposes level and wave APIs with correct initial values', async ({ page }) => {
  await page.goto(PAGE());
  await page.evaluate(() => window.tickGame(16)); // warm up

  const state = await page.evaluate(() => {
    window.player.xp = 0;
    return {
      level: window.getLevel(),
      spawnRate: window.getSpawnRate(),
      wave: window.getWaveState(),
    };
  });

  expect(state.level).toBe(1);
  expect(state.spawnRate).toBe(1);
  expect(state.wave).toBeDefined();
  expect(state.wave.level).toBe(1);
  expect(state.wave.waveSize).toBe(100); // level * 100
  expect(state.wave.spawnCount).toBeGreaterThanOrEqual(0);
  expect(typeof state.wave.cooldownRemaining).toBe('number');
  expect(typeof state.wave.inCooldown).toBe('boolean');
});

test('R1.2: spawn rate scales with level — xp 0/10/30/70 → rate 1/2/3/4', async ({ page }) => {
  await page.goto(PAGE());
  await page.evaluate(() => window.tickGame(16));

  const rates = await page.evaluate(() => {
    const results = [];
    for (const xp of [0, 10, 30, 70]) {
      window.player.xp = xp;
      results.push({ xp, level: window.getLevel(), rate: window.getSpawnRate() });
    }
    return results;
  });

  expect(rates[0]).toEqual({ xp: 0, level: 1, rate: 1 });
  expect(rates[1]).toEqual({ xp: 10, level: 2, rate: 2 });
  expect(rates[2]).toEqual({ xp: 30, level: 3, rate: 3 });
  expect(rates[3]).toEqual({ xp: 70, level: 4, rate: 4 });
});

test('R1.3: wave state tracks cooldown after wave completes', async ({ page }) => {
  await page.goto(PAGE());
  await page.evaluate(() => window.tickGame(16));

  const result = await page.evaluate(() => {
    // At level 1: wave size = 100, spawn interval = 1000ms (1/sec)
    // We need 100 spawns at 1000ms each = 100,000ms total
    window.player.xp = 0;
    window.enemies.length = 0;

    // Tick in large chunks to complete the wave quickly
    // Each 1000ms tick spawns 1 enemy; do 100 ticks of 1000ms
    for (let i = 0; i < 105; i++) {
      window.tickGame(1000);
      // Clear enemies to prevent collision / performance issues
      window.enemies.length = 0;
    }

    const ws = window.getWaveState();
    return {
      inCooldown: ws.inCooldown,
      cooldownRemaining: ws.cooldownRemaining,
      cooldownDuration: ws.cooldownDuration,
    };
  });

  // After 100+ spawns at level 1, cooldown should have kicked in
  // Cooldown at level 1 = min(10000 * 2^0, 60000) = 10000ms
  expect(result.inCooldown).toBe(true);
  expect(result.cooldownRemaining).toBeGreaterThan(0);
  expect(result.cooldownDuration).toBe(10000);
});

// ---------------------------------------------------------------------------
// Requirement 2: Tower persistence across lives
// ---------------------------------------------------------------------------

test('R2.1: towers persist when losing a life (respawn)', async ({ page }) => {
  await page.goto(PAGE());
  await page.setViewportSize({ width: 800, height: 600 });
  await page.evaluate(() => window.tickGame(16));

  const result = await page.evaluate(() => {
    // Give player enough gems to build a tower
    window.player.gems = 200;
    window.enemies.length = 0;

    // Move player to first foundation center and build
    const f = window.foundations[0];
    window.player.x = f.x + f.width / 2;
    window.player.y = f.y + f.height / 2;
    window.buildOrUpgradeTowerNearPlayer();

    const towerBeforeRespawn = !!window.foundations[0].tower;
    const towerLevelBefore = window.foundations[0].tower
      ? window.foundations[0].tower.level
      : null;

    // Set up for a death: low health, multiple lives
    window.player.lives = 3;
    window.player.health = 1;

    // Spawn an enemy right on top of the player to trigger collision
    window.spawnEnemy();
    const lastEnemy = window.enemies[window.enemies.length - 1];
    lastEnemy.x = window.player.x;
    lastEnemy.y = window.player.y;

    // Tick to trigger collision → life lost → respawn
    window.tickGame(16);

    const towerAfterRespawn = !!window.foundations[0].tower;
    const towerLevelAfter = window.foundations[0].tower
      ? window.foundations[0].tower.level
      : null;

    return {
      towerBeforeRespawn,
      towerLevelBefore,
      livesAfter: window.player.lives,
      towerAfterRespawn,
      towerLevelAfter,
    };
  });

  expect(result.towerBeforeRespawn).toBe(true);
  expect(result.towerLevelBefore).toBe(1);
  expect(result.livesAfter).toBe(2); // lost one life
  expect(result.towerAfterRespawn).toBe(true); // tower persists
  expect(result.towerLevelAfter).toBe(1); // level unchanged
});

test('R2.2: towers reset on game over restart', async ({ page }) => {
  await page.goto(PAGE());
  await page.setViewportSize({ width: 800, height: 600 });
  await page.evaluate(() => window.tickGame(16));

  // Build a tower
  await page.evaluate(() => {
    window.player.gems = 200;
    window.enemies.length = 0;

    const f = window.foundations[0];
    window.player.x = f.x + f.width / 2;
    window.player.y = f.y + f.height / 2;
    window.buildOrUpgradeTowerNearPlayer();
  });

  // Confirm tower exists
  const towerBefore = await page.evaluate(() => !!window.foundations[0].tower);
  expect(towerBefore).toBe(true);

  // Force game over: 1 life, 1 health, collision with enemy
  await page.evaluate(() => {
    window.player.lives = 1;
    window.player.health = 1;

    window.spawnEnemy();
    const lastEnemy = window.enemies[window.enemies.length - 1];
    lastEnemy.x = window.player.x;
    lastEnemy.y = window.player.y;

    window.tickGame(16);
  });

  // Verify game over
  const gameOver = await page.evaluate(() => window.isGameOver());
  expect(gameOver).toBe(true);

  // Click restart
  await page.evaluate(() => window.restartGame());

  // Verify tower is cleared
  const result = await page.evaluate(() => ({
    towerCleared: window.foundations[0].tower === null,
    isGameOver: window.isGameOver(),
    lives: window.player.lives,
  }));

  expect(result.towerCleared).toBe(true);
  expect(result.isGameOver).toBe(false);
  expect(result.lives).toBe(3);
});

// ---------------------------------------------------------------------------
// Requirement 3: Boss zombie
// ---------------------------------------------------------------------------

test('R3.1: boss spawns at level 5 after wave cooldown completes', async ({ page }) => {
  await page.goto(PAGE());
  await page.setViewportSize({ width: 800, height: 600 });
  await page.evaluate(() => window.tickGame(16));

  const result = await page.evaluate(() => {
    // Set XP to level 5: floor(log2(xp/10+1))+1 = 5 → log2(xp/10+1) = 4 → xp/10+1 = 16 → xp = 150
    window.player.xp = 150;
    window.enemies.length = 0;

    // Move player to bottom-right corner to avoid any boss collision
    window.player.x = 750;
    window.player.y = 550;

    // Verify level is 5
    const levelCheck = window.getLevel();

    // Complete a wave at level 5: waveSize = 5*100 = 500, spawnInterval = 1000/5 = 200ms
    // Need 500 spawns at 200ms each = 100,000ms total
    for (let i = 0; i < 550; i++) {
      window.tickGame(200);
      // Keep clearing enemies to prevent collisions and performance issues
      window.enemies.length = 0;
    }

    // Now we should be in cooldown. Cooldown at level 5 = min(10000 * 2^4, 60000) = 60000ms (capped)
    // Tick through the full cooldown
    for (let i = 0; i < 4000; i++) {
      window.tickGame(16);
      // Keep boss safe from player collision by freezing its position
      for (const e of window.enemies) {
        if (e.type === 'boss') { e.x = 100; e.y = 100; }
      }
      // Clear non-boss enemies but keep boss if spawned
      for (let j = window.enemies.length - 1; j >= 0; j--) {
        if (window.enemies[j].type !== 'boss') {
          window.enemies.splice(j, 1);
        }
      }
    }

    // Check for boss enemy
    const bossEnemies = window.enemies.filter(e => e.type === 'boss');
    const bossData = bossEnemies.length > 0
      ? { type: bossEnemies[0].type, color: bossEnemies[0].color, radius: bossEnemies[0].radius, health: bossEnemies[0].health }
      : null;

    return {
      levelCheck,
      bossActive: window.isBossActive(),
      bossCount: bossEnemies.length,
      bossData,
    };
  });

  expect(result.levelCheck).toBe(5);
  expect(result.bossActive).toBe(true);
  expect(result.bossCount).toBe(1);
  expect(result.bossData).not.toBeNull();
  expect(result.bossData.type).toBe('boss');
  expect(result.bossData.color).toBe('darkred');
  expect(result.bossData.radius).toBe(30);
  expect(result.bossData.health).toBe(20);
});

test('R3.2: boss blocks normal spawning while alive', async ({ page }) => {
  await page.goto(PAGE());
  await page.setViewportSize({ width: 800, height: 600 });
  await page.evaluate(() => window.tickGame(16));

  const result = await page.evaluate(() => {
    window.player.xp = 150; // level 5
    window.enemies.length = 0;

    // Move player to bottom-right corner to avoid boss collision
    window.player.x = 750;
    window.player.y = 550;

    // Complete a wave + cooldown to trigger boss spawn
    for (let i = 0; i < 550; i++) {
      window.tickGame(200);
      window.enemies.length = 0;
    }
    for (let i = 0; i < 4000; i++) {
      window.tickGame(16);
      // Keep boss safe from player collision by freezing its position
      for (const e of window.enemies) {
        if (e.type === 'boss') { e.x = 100; e.y = 100; }
      }
      for (let j = window.enemies.length - 1; j >= 0; j--) {
        if (window.enemies[j].type !== 'boss') {
          window.enemies.splice(j, 1);
        }
      }
    }

    const bossIsActive = window.isBossActive();

    // Now tick more frames — no normal enemies should spawn while boss is alive
    // Keep boss alive by freezing its position away from the player
    for (let i = 0; i < 100; i++) {
      // Move boss away from player each tick to prevent collision
      for (const e of window.enemies) {
        if (e.type === 'boss') { e.x = 100; e.y = 100; }
      }
      window.tickGame(200);
    }

    const normalEnemies = window.enemies.filter(e => e.type !== 'boss');

    return {
      bossIsActive,
      bossExists: window.enemies.some(e => e.type === 'boss'),
      normalEnemyCount: normalEnemies.length,
    };
  });

  expect(result.bossIsActive).toBe(true);
  expect(result.bossExists).toBe(true);
  expect(result.normalEnemyCount).toBe(0); // no normal enemies while boss is alive
});

test('R3.3: boss drops gold upgrade gem (value=100) on death', async ({ page }) => {
  await page.goto(PAGE());
  await page.setViewportSize({ width: 800, height: 600 });
  await page.evaluate(() => window.tickGame(16));

  const result = await page.evaluate(() => {
    window.player.xp = 150;
    window.enemies.length = 0;
    window.xpGems.length = 0;

    // Move player to bottom-right corner to avoid boss collision
    window.player.x = 750;
    window.player.y = 550;

    // Complete wave + cooldown to trigger boss
    for (let i = 0; i < 550; i++) {
      window.tickGame(200);
      window.enemies.length = 0;
    }
    for (let i = 0; i < 4000; i++) {
      window.tickGame(16);
      // Move boss away from player each tick to prevent collision
      for (const e of window.enemies) {
        if (e.type === 'boss') { e.x = 100; e.y = 100; }
      }
      for (let j = window.enemies.length - 1; j >= 0; j--) {
        if (window.enemies[j].type !== 'boss') {
          window.enemies.splice(j, 1);
        }
      }
    }

    // Find the boss
    const boss = window.enemies.find(e => e.type === 'boss');
    if (!boss) return { error: 'no boss found' };

    // Clear any gems from the wave phase
    window.xpGems.length = 0;

    // Kill the boss by depleting its health
    boss.health = 1;
    boss.takeDamage(1); // health → 0

    // Tick to trigger death processing and gem drop
    window.tickGame(16);

    // Find gold gem
    const goldGems = window.xpGems.filter(g => g.value === 100 && g.color === '#ffd700');

    return {
      bossActiveAfterDeath: window.isBossActive(),
      goldGemCount: goldGems.length,
      goldGemValue: goldGems.length > 0 ? goldGems[0].value : null,
      goldGemColor: goldGems.length > 0 ? goldGems[0].color : null,
    };
  });

  expect(result.bossActiveAfterDeath).toBe(false);
  expect(result.goldGemCount).toBe(1);
  expect(result.goldGemValue).toBe(100);
  expect(result.goldGemColor).toBe('#ffd700');
});

// ---------------------------------------------------------------------------
// Requirement 4: Tower targeting priority
// ---------------------------------------------------------------------------

test('R4.1: tower targets purple enemy over red enemy', async ({ page }) => {
  await page.goto(PAGE());
  await page.setViewportSize({ width: 800, height: 600 });
  await page.evaluate(() => window.tickGame(16));

  const result = await page.evaluate(() => {
    // Build a tower on the first foundation
    window.player.gems = 200;
    window.enemies.length = 0;
    window.projectiles.length = 0;

    const f = window.foundations[0];
    const towerX = f.x + f.width / 2;
    const towerY = f.y + f.height / 2;
    window.player.x = towerX;
    window.player.y = towerY;
    window.buildOrUpgradeTowerNearPlayer();

    // Move player out of the way
    window.player.x = 400;
    window.player.y = 500;

    // Place a red enemy to the left of the tower
    const redEnemy = new window.Enemy(towerX - 100, towerY, true, 'red');
    redEnemy.health = 999; // keep alive
    window.enemies.push(redEnemy);

    // Place a purple enemy to the right of the tower (same distance)
    const purpleEnemy = new window.Enemy(towerX + 100, towerY, false, 'purple');
    purpleEnemy.health = 999;
    window.enemies.push(purpleEnemy);

    // Force tower to fire
    f.tower.cooldown = f.tower.fireInterval;
    f.tower.update(0);

    // Check projectile direction — should aim toward the purple enemy (to the right)
    if (window.projectiles.length === 0) return { error: 'no projectile fired' };

    const proj = window.projectiles[window.projectiles.length - 1];
    // vx > 0 means aiming right (toward purple), vx < 0 means aiming left (toward red)
    return {
      projectileVx: proj.vx,
      aimedAtPurple: proj.vx > 0, // purple is to the right (+x)
    };
  });

  expect(result.aimedAtPurple).toBe(true);
  expect(result.projectileVx).toBeGreaterThan(0);
});

test('R4.2: tower targets boss enemy over all other types', async ({ page }) => {
  await page.goto(PAGE());
  await page.setViewportSize({ width: 800, height: 600 });
  await page.evaluate(() => window.tickGame(16));

  const result = await page.evaluate(() => {
    window.player.gems = 200;
    window.enemies.length = 0;
    window.projectiles.length = 0;

    // Build a tower on the first foundation
    const f = window.foundations[0];
    const towerX = f.x + f.width / 2;
    const towerY = f.y + f.height / 2;
    window.player.x = towerX;
    window.player.y = towerY;
    window.buildOrUpgradeTowerNearPlayer();

    // Move player away
    window.player.x = 400;
    window.player.y = 500;

    // Place a red enemy above the tower
    const redEnemy = new window.Enemy(towerX, towerY - 100, true, 'red');
    redEnemy.health = 999;
    window.enemies.push(redEnemy);

    // Place a purple enemy to the left
    const purpleEnemy = new window.Enemy(towerX - 100, towerY, true, 'purple');
    purpleEnemy.health = 999;
    window.enemies.push(purpleEnemy);

    // Place a boss enemy below the tower
    const bossEnemy = new window.Enemy(towerX, towerY + 100, false, 'boss');
    bossEnemy.health = 999;
    window.enemies.push(bossEnemy);

    // Force tower to fire
    f.tower.cooldown = f.tower.fireInterval;
    f.tower.update(0);

    if (window.projectiles.length === 0) return { error: 'no projectile fired' };

    const proj = window.projectiles[window.projectiles.length - 1];
    // Boss is below the tower → projectile should aim downward (vy > 0)
    return {
      projectileVx: proj.vx,
      projectileVy: proj.vy,
      aimedAtBoss: proj.vy > 0.9, // nearly straight down since boss is directly below
    };
  });

  expect(result.aimedAtBoss).toBe(true);
  expect(result.projectileVy).toBeGreaterThan(0);
});
