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
            const moveX = (dx / dist) * this.speed * dt;
            const moveY = (dy / dist) * this.speed * dt;

            // Check if enemy is outside the visible viewport bounds
            const isOutsideViewport = this.x < 0 || this.x > window.innerWidth || 
                                      this.y < 0 || this.y > window.innerHeight;

            if (!isOutsideViewport) {
                const proposedX = this.x + moveX;
                if (!isCollidingWithObstacles(proposedX, this.y, this.radius)) {
                    this.x += moveX;
                }

                const proposedY = this.y + moveY;
                if (!isCollidingWithObstacles(this.x, proposedY, this.radius)) {
                    this.y += moveY;
                }
            } else {
                // Allow free movement towards player when outside viewport bounds
                this.x += moveX;
                this.y += moveY;
            }
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
