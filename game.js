import { xpGems } from './gem.js'; // Import xpGems from gem.js
import { enemies, spawnTimer, SPAWN_INTERVAL, spawnEnemy } from './enemy.js'; // Import enemy-related exports

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let isPaused = false;
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

  if (isPaused) return requestAnimationFrame(gameLoop); // Skip updates/draws when paused

  if (deltaTime > 50) deltaTime = 50; // Cap physics to prevent tunneling
  
  // Spawn timer check
  spawnTimer += deltaTime;
  if (spawnTimer >= SPAWN_INTERVAL) {
    spawnEnemy();
    spawnTimer = 0;
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

function update(dt) {
  let dx = 0;
  let dy = 0;
  if (keys.w) dy -= 1;
  if (keys.s) dy += 1;
  if (keys.a) dx -= 1;
  if (keys.d) dx += 1;

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

  // Update projectiles and check collisions with enemies (Phase 4)
  for (let i = projectiles.length - 1; i >= 0; i--) {
    const proj = projectiles[i];
    const alive = proj.update(dt);
    if (!alive) {
      projectiles.splice(i, 1);
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
      // Spawn XP gem at enemy's last coordinates
      xpGems.push(new XPGem(enemies[hitEnemyIndex].x, enemies[hitEnemyIndex].y));
      // Remove enemy and projectile
      enemies.splice(hitEnemyIndex, 1);
      projectiles.splice(i, 1);
    }
  }

  // Update XP gems and check collision with player (Phase 4)
  for (let i = xpGems.length - 1; i >= 0; i--) {
    const gem = xpGems[i];
    gem.update(dt); // Call update before checking collection

    // Circle-Circle collision between player and gem
    const dist = Math.hypot(player.x - gem.x, player.y - gem.y);
    if (dist < player.radius + gem.radius) {
      player.xp += 10; // Increase XP
      xpGems.splice(i, 1);
    }
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
  for (const proj of projectiles) {
    proj.draw(ctx);
  }

  // Draw XP gems
  for (const gem of xpGems) {
    gem.draw(ctx);
  }
}

// Start the game loop
requestAnimationFrame(gameLoop);

// Expose player position and enemy state for testing purposes
window.getPlayerPos = () => ({ x: player.x, y: player.y });
window.getEnemies = () => enemies.map(e => ({ x: e.x, y: e.y }));
window.getProjectiles = () => projectiles.map(p => ({ x: p.x, y: p.y }));
window.getXPGems = () => xpGems.map(g => ({ x: g.x, y: g.y }));
window.getPlayerXP = () => player.xp;

// Deterministic test interface to bypass requestAnimationFrame pausing in headless mode
window.tickGame = (ms) => {
  if (isPaused) return; // Skip updates when paused
  spawnTimer += ms;
  if (spawnTimer >= SPAWN_INTERVAL) {
    spawnEnemy();
    spawnTimer = 0;
  }
  update(ms);
};

// Test helper to directly set enemy position for deterministic testing
window.setEnemyPosition = (index, x, y) => { if (enemies[index]) { enemies[index].x = x; enemies[index].y = y; } };
