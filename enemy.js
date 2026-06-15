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
        const dist = Math.hypot(dx, dy);

        if (dist > 0) {
            let moveX = 0;
            let moveY = 0;

            // Check Line of Sight (Phase 4.8.3)
            const hasLoS = window.checkLineOfSight && window.checkLineOfSight(this.x, this.y, player.x, player.y);

            if (hasLoS || !window.checkLineOfSight) {
                // Standard Pathing (Direct to player)
                moveX = (dx / dist) * this.speed * dt;
                moveY = (dy / dist) * this.speed * dt;
            } else {
                // Avoidance State: Steer along the closest obstacle
                let closestObs = null;
                let minDist = Infinity;

                for (const obs of obstacles) {
                    if (obs.isPerimeter) continue;
                    // Find closest point on obstacle AABB to enemy center
                    const cx = Math.max(obs.x, Math.min(this.x, obs.x + obs.width));
                    const cy = Math.max(obs.y, Math.min(this.y, obs.y + obs.height));
                    const d = Math.hypot(this.x - cx, this.y - cy);
                    
                    if (d < minDist) {
                        minDist = d;
                        closestObs = obs;
                    }
                }

               // Only slide if we are physically bumping into the wall (10px bumper)
                if (closestObs && minDist < this.radius + 10) {
                    // Determine surface normal based on the closest edge
                    const dl = Math.abs(this.x - closestObs.x);
                    const dr = Math.abs(this.x - (closestObs.x + closestObs.width));
                    const dt_edge = Math.abs(this.y - closestObs.y);
                    const db = Math.abs(this.y - (closestObs.y + closestObs.height));
                    
                    const minEdge = Math.min(dl, dr, dt_edge, db);
                    
                    let nx = 0, ny = 0;
                    if (minEdge === dl) nx = -1;
                    else if (minEdge === dr) nx = 1;
                    else if (minEdge === dt_edge) ny = -1;
                    else if (minEdge === db) ny = 1;

                    // Calculate two possible perpendicular tangents along the wall
                    const t1x = -ny, t1y = nx;
                    const t2x = ny, t2y = -nx;

                    // Pick the tangent that aligns best with the direction to the player (dot product)
                    const dot1 = t1x * dx + t1y * dy;
                    const dot2 = t2x * dx + t2y * dy;

                    const chosenTx = dot1 > dot2 ? t1x : t2x;
                    const chosenTy = dot1 > dot2 ? t1y : t2y;

                    // Blend the chosen tangent with the wall normal (outward push) to prevent corner snagging
                    const repulsionWeight = 0.5; // Pushes them away from the wall at a slight angle
                    const avoidDx = chosenTx + (nx * repulsionWeight);
                    const avoidDy = chosenTy + (ny * repulsionWeight);
                    
                    // Normalize the blended vector to maintain consistent speed
                    const avoidDist = Math.hypot(avoidDx, avoidDy);

                    moveX = (avoidDx / avoidDist) * this.speed * dt;
                    moveY = (avoidDy / avoidDist) * this.speed * dt;
                } else {
                    // Fallback: Even if LoS is blocked, walk straight until we hit the wall
                    moveX = (dx / dist) * this.speed * dt;
                    moveY = (dy / dist) * this.speed * dt;
                }
            }

            // Apply movement with collision clamping
            const proposedX = this.x + moveX;
            if (!isCollidingWithObstacles(proposedX, this.y, this.radius, true)) {
                this.x += moveX;
            }

            const proposedY = this.y + moveY;
            if (!isCollidingWithObstacles(this.x, proposedY, this.radius, true)) {
                this.y += moveY;
            }
        }

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
window.enemies = enemies;