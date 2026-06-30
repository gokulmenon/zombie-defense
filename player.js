// Player object

const player = {

    x: window.innerWidth / 2,

    y: window.innerHeight * 0.75,

    radius: Math.round(15 * Math.min(1, window.innerWidth / 800)),

    speed: 0.2, // pixels per ms

    color: 'blue',

    xp: 0, // XP tracking — experience only, never decremented

    gems: 0, // Gem currency — used for purchases (towers, etc.)

    lives: 3,
    health: 100, // Initialize health to maxHealth
    maxHealth: 100, // Max health for the player
    magnetRadius: 150

};



// Keyboard state tracker

const keys = { w: false, a: false, s: false, d: false };



window.fireProjectile = () => {

    const closestEnemy = getClosestEnemy();

    if (closestEnemy) {

        const dx = closestEnemy.x - player.x;

        const dy = closestEnemy.y - player.y;

        const dist = Math.hypot(dx, dy);



        let nx = 1;

        let ny = 0;

        if (dist > 0) {

            nx = dx / dist;

            ny = dy / dist;

        }



        window.projectiles.push(new Projectile(player.x, player.y, nx, ny));

    }

};

// Fire a projectile toward specific canvas coordinates (used by touch controls)
window.fireProjectileAt = (targetX, targetY) => {
    const dx = targetX - player.x;
    const dy = targetY - player.y;
    const dist = Math.hypot(dx, dy);

    let nx = 1;
    let ny = 0;
    if (dist > 0) {
        nx = dx / dist;
        ny = dy / dist;
    }

    window.projectiles.push(new Projectile(player.x, player.y, nx, ny));
};



window.addEventListener('keydown', (e) => {

    const key = e.key.toLowerCase();

    if (keys.hasOwnProperty(key)) {

        keys[key] = true;

    }



    // Spacebar to fire projectile (Phase 4)

    if (key === ' ') {

        window.fireProjectile();

    }

    // 'f' to build or upgrade a defense tower on a nearby foundation
    if (key === 'f') {
        if (window.buildOrUpgradeTowerNearPlayer) window.buildOrUpgradeTowerNearPlayer();
    }

    // Pause toggle via 'p' or Escape key
    if (key === 'p' || e.key === 'Escape') {
        // Toggle the pause button via its click event, which is handled in game.js
        const pauseButton = document.getElementById('pause-btn');
        if (pauseButton) {
            pauseButton.click();
        }
    }

});



window.addEventListener('keyup', (e) => {

    const key = e.key.toLowerCase();

    if (keys.hasOwnProperty(key)) {

        keys[key] = false;

    }

});



window.updateHUD = () => {
    const healthSpan = document.getElementById('hud-health');
    const livesSpan = document.getElementById('hud-lives');
    const levelSpan = document.getElementById('hud-level');
    const xpSpan = document.getElementById('hud-xp');
    const gemsSpan = document.getElementById('hud-gems');
    const pauseBtn = document.getElementById('pause-btn');

    if (healthSpan) healthSpan.textContent = player.health;
    if (livesSpan) livesSpan.textContent = player.lives;
    if (levelSpan) levelSpan.textContent = window.getLevel ? window.getLevel() : Math.floor(Math.log2(player.xp / 10 + 1)) + 1;
    if (xpSpan) xpSpan.textContent = player.xp;
    if (gemsSpan) gemsSpan.textContent = player.gems;
    if (pauseBtn) {
        // Get the current pause state from the game module's exposed function
        pauseBtn.textContent = window.getIsPaused() ? 'Resume' : 'Pause';
    }
};

window.player = player; // Expose for direct manipulation in tests

// Function to handle gem collection (Phase 5.2)
window.collectGems = () => {
    // We directly modify the xpGems array in place by marking collected gems as isCollected = true.
    // No need to create a new array or reassign window.xpGems.
    // Access xpGems from the window object since player.js is not a module.
    for (const gem of window.xpGems) {
        if (gem.isCollected) {
            continue; // Skip already collected gems
        }

        const dist = Math.hypot(player.x - gem.x, player.y - gem.y);

        // Check for physical collection (player body touching gem)
        if (dist < player.radius + gem.radius) {
            if (gem.type === 'xp') {
                // Boss gem: gold gem (value=100, color='#ffd700') upgrades all existing towers
                if (gem.value === 100 && gem.color === '#ffd700') {
                    // Upgrade all existing towers by +1 level
                    for (const f of (window.foundations || [])) {
                        if (f.tower) {
                            f.tower.level += 1;
                        }
                    }
                }
                // Add to gem currency and XP equally
                player.gems += gem.value;
                player.xp += gem.value;
            } else if (gem.type === 'health') {
                player.health = Math.min(player.maxHealth, player.health + gem.value);
            }
            gem.isCollected = true;
            window.updateHUD(); // Update HUD to reflect changes
        }
    }
    // The gameLoop function filters out collected gems when drawing.
    // We don't need to modify the xpGems array directly here after collection.
};

window.keys = keys;

// Initial HUD render so values are visible before the game loop starts
window.updateHUD();