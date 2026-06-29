import { enemies, spawnEnemy } from './enemy.js'; // Import enemy-related exports

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let isPaused = false;
let isGameOver = false;
let spawnTimer = 0; // Local spawn timer for game loop

// --- LEVEL-BASED WAVE / COOLDOWN SYSTEM ---
// Level = floor(log2(xp/10 + 1)) + 1  (logarithmic XP scaling)
// Cumulative XP thresholds: 0, 10, 30, 70, 150, 310, 630, ...
// Each level defines:
//   - Spawn rate: level zombies per second (interval = 1000/level ms)
//   - Wave size:  level × 100 zombies before a cooldown
//   - Cooldown:   10s × 2^(level-1), capped at 60s
let waveSpawnCount = 0;           // zombies spawned in the current wave
let cooldownTimer = 0;            // ms remaining in cooldown (0 = spawning)
let extraFoundationsAdded = false; // flag for level 5+ extra tower foundations

function getLevel() {
  return Math.floor(Math.log2(player.xp / 10 + 1)) + 1;
}

function getSpawnInterval() {
  return 1000 / getLevel(); // level 1 = 1000ms, level 2 = 500ms, level 3 = 333ms...
}

function getWaveSize() {
  return getLevel() * 100; // level 1 = 100, level 2 = 200, level 3 = 300...
}

function getCooldownDuration() {
  const level = getLevel();
  return Math.min(10000 * Math.pow(2, level - 1), 60000); // 10s, 20s, 40s, 60s cap
}

// Expose spawn rate (zombies per second) for tests
window.getSpawnRate = () => getLevel();
window.getLevel = getLevel;

// Expose wave/level state for tests
window.getWaveState = () => ({
  level: getLevel(),
  spawnCount: waveSpawnCount,
  waveSize: getWaveSize(),
  cooldownRemaining: cooldownTimer,
  cooldownDuration: getCooldownDuration(),
  inCooldown: cooldownTimer > 0
});

// Ensure global array definitions exist before loop frame processing starts
window.xpGems = window.xpGems || [];
window.enemies = window.enemies || [];
window.projectiles = window.projectiles || [];
window.getIsPaused = () => isPaused;

// Handle window resizing so the canvas always fills the screen
function resize() {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = window.innerWidth * dpr;
  canvas.height = window.innerHeight * dpr;
  canvas.style.width = `${window.innerWidth}px`;
  canvas.style.height = `${window.innerHeight}px`;
  ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset transform to prevent accumulation on resize
  ctx.scale(dpr, dpr);

}

// Call generateMap() right after initialization and add a window resize listener to recall generateMap().
generateMap();
window.addEventListener('resize', () => {
    resize();
    generateMap();
});
resize(); // Initial call to set correct dimensions on load

// Pause button click listener
document.getElementById('pause-btn').addEventListener('click', () => {
    isPaused = !isPaused;
    const pauseBtn = document.getElementById('pause-btn');
    if (pauseBtn) {
        pauseBtn.textContent = isPaused ? 'Play' : 'Pause';
    }
});

let lastTime = 0;

// Main game loop using requestAnimationFrame
function gameLoop(timestamp) {
  if (lastTime === 0) { lastTime = timestamp; }
  let deltaTime = timestamp - lastTime;
  lastTime = timestamp;

  if (isGameOver) return; // Stop loop on game over
  if (isPaused) return requestAnimationFrame(gameLoop);

  if (deltaTime > 50) deltaTime = 50; // Cap physics to prevent tunneling
    
  // Spawn timer check — level-based rate with wave cooldowns
  if (cooldownTimer > 0) {
    cooldownTimer -= deltaTime;
    if (cooldownTimer < 0) cooldownTimer = 0;
  } else {
    spawnTimer += deltaTime;
    const currentSpawnInterval = getSpawnInterval();
    while (spawnTimer >= currentSpawnInterval && cooldownTimer <= 0) {
      spawnEnemy();
      spawnTimer -= currentSpawnInterval;
      waveSpawnCount++;
      if (waveSpawnCount >= getWaveSize()) {
        waveSpawnCount = 0;
        cooldownTimer = getCooldownDuration();
        spawnTimer = 0;
        break;
      }
    }
  }
  
  update(deltaTime);
  draw();
  requestAnimationFrame(gameLoop);

}

// Circle-vs-AABB clamping collision helper
function isCollidingWithObstacles(x, y, radius, isEnemy = false) {
    if (!isEnemy) {
        if (x - radius < 0 || x + radius > window.innerWidth ||
            y - radius < 0 || y + radius > window.innerHeight) {
            return true;
        }
    }

    for (const obs of obstacles) {
        if (isEnemy && obs.isPerimeter) continue;
        const closestX = Math.max(obs.x, Math.min(x, obs.x + obs.width));
        const closestY = Math.max(obs.y, Math.min(y, obs.y + obs.height));
        const dx = x - closestX;
        const dy = y - closestY;
        if (dx * dx + dy * dy < radius * radius) {
            return true;
        }
    }
    return false;
}
// EXPOSE TO GLOBAL MODULE BOUNDARIES:
window.isCollidingWithObstacles = isCollidingWithObstacles;

// Helper to check if two line segments (a,b)->(c,d) and (p,q)->(r,s) intersect
function segmentsIntersect(a, b, c, d, p, q, r, s) {
    let det = (c - a) * (s - q) - (r - p) * (d - b);
    if (det === 0) return false;
    let lambda = ((s - q) * (r - a) + (p - r) * (s - b)) / det;
    let gamma = ((b - d) * (r - a) + (c - a) * (s - b)) / det;
    return (0 < lambda && lambda < 1) && (0 < gamma && gamma < 1);
}

// Checks if a line between two points intersects any interior map obstacles
function checkLineOfSight(x1, y1, x2, y2) {
    for (const obs of obstacles) {
        if (obs.isPerimeter) continue;

        const left = obs.x;
        const right = obs.x + obs.width;
        const top = obs.y;
        const bottom = obs.y + obs.height;

        // If either endpoint is physically inside the obstacle block, LoS is instantly broken
        if (x1 >= left && x1 <= right && y1 >= top && y1 <= bottom) return false;
        if (x2 >= left && x2 <= right && y2 >= top && y2 <= bottom) return false;

        // Check if the LoS line segment crosses any of the 4 edges of the obstacle
        if (segmentsIntersect(x1, y1, x2, y2, left, top, left, bottom)) return false;
        if (segmentsIntersect(x1, y1, x2, y2, right, top, right, bottom)) return false;
        if (segmentsIntersect(x1, y1, x2, y2, left, top, right, top)) return false;
        if (segmentsIntersect(x1, y1, x2, y2, left, bottom, right, bottom)) return false;
    }
    return true; 
}
window.checkLineOfSight = checkLineOfSight;

// --- DEFENSE TOWERS (gem-purchased auto-firing structures) ---
const TOWER_COST = 100;        // gems (player.gems) per build and per upgrade
const TOWER_BUILD_RANGE = 60;  // how close the player must be to a foundation

class Tower {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.level = 1;       // projectiles fired per second (basic tower = 1/s)
    this.cooldown = 0;    // ms accumulator toward the next shot
  }

  get fireInterval() { return 1000 / this.level; }

  update(dt) {
    // Nothing to shoot at: stay primed but do not bank unlimited cooldown.
    if (!enemies.length) { this.cooldown = Math.min(this.cooldown, this.fireInterval); return; }
    this.cooldown += dt;
    while (this.cooldown >= this.fireInterval) {
      this.cooldown -= this.fireInterval;
      this.fire();
    }
  }

  fire() {
    // Target the enemy nearest to THIS tower (not the player).
    let closest = null;
    let min = Infinity;
    for (const e of enemies) {
      const d = Math.hypot(this.x - e.x, this.y - e.y);
      if (d < min) { min = d; closest = e; }
    }
    if (!closest) return;
    const dx = closest.x - this.x;
    const dy = closest.y - this.y;
    const dist = Math.hypot(dx, dy) || 1;
    window.projectiles.push(new Projectile(this.x, this.y, dx / dist, dy / dist));
  }
}

// Find the foundation the player is currently standing close enough to use.
function nearestFoundationInRange() {
  let target = null;
  let min = Infinity;
  for (const f of (window.foundations || [])) {
    const cx = f.x + f.width / 2;
    const cy = f.y + f.height / 2;
    const d = Math.hypot(player.x - cx, player.y - cy);
    if (d <= TOWER_BUILD_RANGE && d < min) { min = d; target = f; }
  }
  return target;
}

// Build a basic tower on a nearby foundation, or upgrade the existing one.
// Each action costs TOWER_COST gems. No-op if no foundation is in range or
// the player cannot afford it.
window.buildOrUpgradeTowerNearPlayer = () => {
  const f = nearestFoundationInRange();
  if (!f) return false;
  if (player.gems < TOWER_COST) return false;
  player.gems -= TOWER_COST;
  if (!f.tower) {
    f.tower = new Tower(f.x + f.width / 2, f.y + f.height / 2);
  } else {
    f.tower.level += 1; // each upgrade adds one projectile per second
  }
  if (window.updateHUD) window.updateHUD();
  return true;
};

function update(dt) {
  let dx = 0;
  let dy = 0;
// FIXED: Read key states explicitly from the shared window global scope
  if (window.keys && window.keys.w) dy -= 1;
  if (window.keys && window.keys.s) dy += 1;
  if (window.keys && window.keys.a) dx -= 1;
  if (window.keys && window.keys.d) dx += 1;

  // Normalize diagonal movement to maintain consistent speed

  if (dx !== 0 || dy !== 0) {
    const length = Math.sqrt(dx * dx + dy * dy);
    dx /= length;
    dy /= length;
  }

  const moveX = dx * player.speed * dt;
  const moveY = dy * player.speed * dt;

  // Evaluate X and Y movement independently. If moving X hits an obstacle, cancel X movement.
  const proposedX = player.x + moveX;
  if (!isCollidingWithObstacles(proposedX, player.y, player.radius)) {
      player.x += moveX;
  }

  // If moving Y hits an obstacle, cancel Y movement.
  const proposedY = player.y + moveY;
  if (!isCollidingWithObstacles(player.x, proposedY, player.radius)) {
      player.y += moveY;
  }

  // Update enemies and remove dead/out-of-bounds ones
  for (let i = enemies.length - 1; i >= 0; i--) {
    const alive = enemies[i].update(dt);
    if (!alive) {
      enemies.splice(i, 1);
    }
  }

  // Enemy-player collision: enemies that touch the player deal type-specific damage and die
  for (let i = enemies.length - 1; i >= 0; i--) {
    const enemy = enemies[i];
    const dist = Math.hypot(player.x - enemy.x, player.y - enemy.y);
    if (dist < player.radius + enemy.radius) {
      const damage = enemy.contactDamage || 1;
      player.health -= damage;
      enemies.splice(i, 1);
      if (player.health <= 0) {
        player.lives -= 1;
        if (player.lives <= 0) {
          isGameOver = true;
          window.updateHUD();
          showGameOver();
          return;
        }
        // Still have lives — reset health for the next life
        player.health = player.maxHealth;
      }
      window.updateHUD();
    }
  }

  // Update projectiles and check collisions with enemies (Phase 4)
  for (let i = window.projectiles.length - 1; i >= 0; i--) {
    const proj = window.projectiles[i];
    const alive = proj.update(dt);
    if (!alive) {
      window.projectiles.splice(i, 1);
      continue;
    }

    let hitEnemyIndex = -1;

    for (let j = enemies.length - 1; j >= 0; j--) {
      const enemy = enemies[j];
      // Circle-Circle collision detection
      const dist = Math.hypot(proj.x - enemy.x, proj.y - enemy.y);
      if (dist < proj.radius + enemy.radius) {
        hitEnemyIndex = j;
        break;
      }
    }

    if (hitEnemyIndex !== -1) {
      // Apply damage to the enemy instead of immediate removal
      enemies[hitEnemyIndex].takeDamage(1); // Assuming 1 damage per projectile
      window.projectiles.splice(i, 1); // Remove projectile
    }
  }

  // Update XP gems
  for (let i = window.xpGems.length - 1; i >= 0; i--) {
    const gem = window.xpGems[i];
    gem.update(dt);
  }

  // Scale magnet radius with level (base 150, +50 per level beyond 1)
  player.magnetRadius = 150 + (getLevel() - 1) * 50;

  // Handle gem collection (Phase 5.2)
  window.collectGems();

  // Update defense towers (auto-fire at the nearest enemy)
  for (const f of (window.foundations || [])) {
    if (f.tower) f.tower.update(dt);
  }

  // At level 5+, add 2 extra tower foundations inside the defensive base
  if (getLevel() >= 5 && !extraFoundationsAdded) {
    const W = window.innerWidth;
    const H = window.innerHeight;
    const fSize = 40;
    const mkFoundation = (cx, cy) => ({ x: cx - fSize / 2, y: cy - fSize / 2, width: fSize, height: fSize, tower: null });
    window.foundations.push(mkFoundation(W * 0.30, H * 0.75));
    window.foundations.push(mkFoundation(W * 0.70, H * 0.75));
    extraFoundationsAdded = true;
  }

  window.updateHUD(); // Call HUD update at the end of each frame
}

function draw() {
  // Clear the screen with a dark grey background every frame
  ctx.fillStyle = '#2a2a2a';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw obstacles before drawing entities
  for (const obs of obstacles) {
    obs.draw(ctx);
  }

  // Draw tower foundations (and any towers built on them)
  for (const f of (window.foundations || [])) {
    ctx.fillStyle = f.tower ? '#555555' : '#3a3a5a';
    ctx.fillRect(f.x, f.y, f.width, f.height);
    if (f.tower) {
      ctx.beginPath();
      ctx.arc(f.tower.x, f.tower.y, 12, 0, Math.PI * 2);
      ctx.fillStyle = '#00aaff';
      ctx.fill();
      ctx.closePath();
      ctx.fillStyle = 'white';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(f.tower.level), f.tower.x, f.tower.y);
    }
  }

  // Draw player as a filled blue circle
   ctx.beginPath();
  ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
  ctx.fillStyle = player.color;
  ctx.fill();
  ctx.closePath();

  // Draw enemies
  for (const enemy of enemies) {
    enemy.draw(ctx);
  }

  // Draw projectiles
  for (const proj of window.projectiles) {
    proj.draw(ctx);
  }

  // Draw XP gems
  for (const gem of window.xpGems) {
    gem.draw(ctx);
  }
}

// --- GAME OVER ---
function showGameOver() {
  // Create overlay if it doesn't already exist
  if (document.getElementById('game-over-overlay')) return;
  const overlay = document.createElement('div');
  overlay.id = 'game-over-overlay';
  overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;' +
    'background:rgba(0,0,0,0.75);display:flex;flex-direction:column;' +
    'align-items:center;justify-content:center;z-index:1000;color:white;font-family:sans-serif;';
  overlay.innerHTML = '<h1 style="font-size:48px;margin-bottom:20px;">Game Over</h1>' +
    '<button id="restart-btn" style="font-size:24px;padding:12px 32px;cursor:pointer;">Restart</button>';
  document.body.appendChild(overlay);

  document.getElementById('restart-btn').addEventListener('click', restartGame);
}

function restartGame() {
  // Remove overlay
  const overlay = document.getElementById('game-over-overlay');
  if (overlay) overlay.remove();

  // Reset player state
  player.x = window.innerWidth / 2;
  player.y = window.innerHeight * 0.52;
  player.health = player.maxHealth;
  player.xp = 0;
  player.gems = 0;
  player.totalGemsCollected = 0;
  player.lives = 3;

  // Clear entities
  enemies.length = 0;
  window.projectiles.length = 0;
  window.xpGems.length = 0;

  // Reset towers on foundations and remove extra level-5 foundations
  if (extraFoundationsAdded && window.foundations && window.foundations.length > 2) {
    window.foundations.length = 2; // keep only the original 2
  }
  for (const f of (window.foundations || [])) {
    f.tower = null;
  }
  extraFoundationsAdded = false;

  // Reset spawn/wave state
  spawnTimer = 0;
  waveSpawnCount = 0;
  cooldownTimer = 0;

  isGameOver = false;
  isPaused = false;
  window.updateHUD();
}
window.restartGame = restartGame;

// Start the game loop
requestAnimationFrame(gameLoop);

// Expose player position and enemy state for testing purposes
window.getPlayerPos = () => ({ x: player.x, y: player.y });
window.getEnemies = () => enemies.map(e => ({ x: e.x, y: e.y, type: e.type || 'red', color: e.color, health: e.health, radius: e.radius, contactDamage: e.contactDamage || 1 }));
window.getProjectiles = () => windowprojectiles.map(p => ({ x: p.x, y: p.y }));
window.getXPGems = () => xpGems.map(g => ({ x: g.x, y: g.y, type: g.type, value: g.value }));
window.getPlayerXP = () => player.xp;
window.getPlayerGems = () => player.gems;
window.isGameOver = () => isGameOver;
window.getFoundationCount = () => (window.foundations || []).length;

// Deterministic test interface to bypass requestAnimationFrame pausing in headless mode
window.tickGame = (ms) => {
  if (isPaused || isGameOver) return;
  if (cooldownTimer > 0) {
    cooldownTimer -= ms;
    if (cooldownTimer < 0) cooldownTimer = 0;
  } else {
    spawnTimer += ms;
    const currentSpawnInterval = getSpawnInterval();
    while (spawnTimer >= currentSpawnInterval && cooldownTimer <= 0) {
      spawnEnemy();
      spawnTimer -= currentSpawnInterval;
      waveSpawnCount++;
      if (waveSpawnCount >= getWaveSize()) {
        waveSpawnCount = 0;
        cooldownTimer = getCooldownDuration();
        spawnTimer = 0;
        break;
      }
    }
  }
  update(ms);
};

// Test helper to directly set enemy position for deterministic testing
window.setEnemyPosition = (index, x, y) => { if (enemies[index]) { enemies[index].x = x; enemies[index].y = y; } };
