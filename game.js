const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

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
window.addEventListener('resize', resize);
resize(); // Initial call to set correct dimensions on load

// Player object
const player = {
    x: window.innerWidth / 2,
    y: window.innerHeight / 2,
    radius: 15,
    speed: 0.2, // pixels per ms
    color: 'blue',
    xp: 0 // XP tracking for Phase 4
};

// Keyboard state tracker
const keys = { w: false, a: false, s: false, d: false };

window.addEventListener('keydown', (e) => {
    const key = e.key.toLowerCase();
    if (keys.hasOwnProperty(key)) {
        keys[key] = true;
    }
    
    // Spacebar to fire projectile (Phase 4)
    if (key === ' ') {
        const closestEnemy = getClosestEnemy();
        if (closestEnemy) {
            const dx = closestEnemy.x - player.x;
            const dy = closestEnemy.y - player.y;
            const dist = Math.hypot(dx, dy);
            
            // Normalize directional vector, default to right if distance is 0
            let nx = 1;
            let ny = 0;
            if (dist > 0) {
                nx = dx / dist;
                ny = dy / dist;
            }
            
            projectiles.push(new Projectile(player.x, player.y, nx, ny));
        }
    }
});

window.addEventListener('keyup', (e) => {
    const key = e.key.toLowerCase();
    if (keys.hasOwnProperty(key)) {
        keys[key] = false;
    }
});

// Game state variables
let lastTime = 0;
const projectiles = [];
const xpGems = [];

// Enemy Spawning Logic (Phase 3)
const enemies = [];
let spawnTimer = 0;
const SPAWN_INTERVAL = 1500; // ms between spawns initially

class Enemy {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 12;
        this.speed = 0.1 + Math.random() * 0.1;
        this.health = 3;
        this.color = 'red';
    }

    update(dt) {
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist > 0) {
            this.x += (dx / dist) * this.speed * dt;
            this.y += (dy / dist) * this.speed * dt;
        }

        // Remove if completely out of bounds
        const margin = 100;
        return !(this.x < -margin || this.x > window.innerWidth + margin || 
                 this.y < -margin || this.y > window.innerHeight + margin);
    }

    draw(ctx) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.closePath();
    }
}

function spawnEnemy() {
    const margin = 50;
    let x, y;
    const side = Math.floor(Math.random() * 4); 
    
    switch(side) {
        case 0: // Top
            x = Math.random() * window.innerWidth;
            y = -margin;
            break;
        case 1: // Right
            x = window.innerWidth + margin;
            y = Math.random() * window.innerHeight;
            break;
        case 2: // Bottom
            x = Math.random() * window.innerWidth;
            y = window.innerHeight + margin;
            break;
        case 3: // Left
            x = -margin;
            y = Math.random() * window.innerHeight;
            break;
    }
    enemies.push(new Enemy(x, y));
}

// Nearest-neighbor search using Math.hypot (Phase 4)
function getClosestEnemy() {
    let closest = null;
    let minDist = Infinity;
    
    for (const enemy of enemies) {
        const dist = Math.hypot(player.x - enemy.x, player.y - enemy.y);
        if (dist < minDist) {
            minDist = dist;
            closest = enemy;
        }
    }
    return closest;
}

// Projectile Class (Phase 4)
class Projectile {
    constructor(x, y, vx, vy) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.radius = 4;
        this.speed = 0.5; // pixels per ms
        this.color = 'yellow';
    }

    update(dt) {
        this.x += this.vx * this.speed * dt;
        this.y += this.vy * this.speed * dt;

        const margin = 10;
        return !(this.x < -margin || this.x > window.innerWidth + margin || 
                 this.y < -margin || this.y > window.innerHeight + margin);
    }

    draw(ctx) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.closePath();
    }
}

// XP Gem Class (Phase 4)
class XPGem {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 6;
        this.color = 'green';
    }

    draw(ctx) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.closePath();
    }
}

// Main game loop using requestAnimationFrame
function gameLoop(timestamp) {
    if (lastTime === 0) { lastTime = timestamp; }
    
    const deltaTime = timestamp - lastTime;
    lastTime = timestamp;

    // Spawn timer
    spawnTimer += deltaTime;
    if (spawnTimer >= SPAWN_INTERVAL) {
        spawnEnemy();
        spawnTimer = 0;
    }

    update(deltaTime);
    draw();

    requestAnimationFrame(gameLoop);
}

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

    player.x += dx * player.speed * dt;
    player.y += dy * player.speed * dt;

    // Boundary checks to keep the circle within canvas edges (using CSS pixels)
    if (player.x - player.radius < 0) {
        player.x = player.radius;
    }
    if (player.x + player.radius > window.innerWidth) {
        player.x = window.innerWidth - player.radius;
    }
    if (player.y - player.radius < 0) {
        player.y = player.radius;
    }
    if (player.y + player.radius > window.innerHeight) {
        player.y = window.innerHeight - player.radius;
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
        
        // Circle-Circle collision between player and gem
        const dist = Math.hypot(player.x - gem.x, player.y - gem.y);
        if (dist < player.radius + gem.radius) {
            player.xp += 10; // Increase XP
            xpGems.splice(i, 1);
        }
    }
}

function draw() {
    // Clear the screen with a dark grey background every frame
    ctx.fillStyle = '#2a2a2a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

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
window.player = player; // Expose for direct manipulation in tests
