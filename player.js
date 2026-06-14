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



        projectiles.push(new Projectile(player.x, player.y, nx, ny));

    }

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

});



window.addEventListener('keyup', (e) => {

    const key = e.key.toLowerCase();

    if (keys.hasOwnProperty(key)) {

        keys[key] = false;

    }

});



window.player = player; // Expose for direct manipulation in tests