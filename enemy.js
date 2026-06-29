// Enemy Spawning Logic (Phase 3)
import { XPGem } from './gem.js'; // Import XPGem class
import { getLevel } from './spawner.js'; // Import level formula from spawner

export const enemies = [];
export let spawnTimer = 0;
export const SPAWN_INTERVAL = 1500; // ms between spawns (legacy default, game.js uses dynamic interval)
const HEALTH_GEM_DROP_CHANCE = 0.1; // 10% chance for a health gem to drop

class Enemy {

  constructor(x, y, isLeft = false, type = 'red') {
        this.x = x;
        this.y = y;
        this.isLeft = isLeft;
        this.type = type; // 'red' (normal), 'orange' (level 5+), 'purple' (level 10+), 'boss' (every 5 levels)

        if (type === 'boss') {
            this.radius = 30;
            this.speed = 0.06;
            this.health = 20;
            this.color = 'darkred';
            this.contactDamage = 10;
        } else if (type === 'purple') {
            this.radius = 22;
            this.speed = 0.08 + Math.random() * 0.05;
            this.health = 5;
            this.color = 'purple';
            this.contactDamage = 5;
        } else if (type === 'orange') {
            this.radius = 16;
            this.speed = 0.15 + Math.random() * 0.1;
            this.health = 2;
            this.color = 'orange';
            this.contactDamage = 2;
        } else {
            this.radius = 12;
            this.speed = 0.1 + Math.random() * 0.1;
            this.health = 3;
            this.color = 'red';
            this.contactDamage = 1;
        }

        this.waypointIndex = 0;
        this.waypoints = [];
        this.initWaypoints();
    }

    initWaypoints() {
        const W = window.innerWidth;
        const H = window.innerHeight;

        // Each enemy picks a random lane offset within the tunnel corridors.
        // This creates a swarm effect — enemies fan out instead of single-filing.
        const laneOffset = (Math.random() - 0.5) * W * 0.10; // ±5% of screen width

        // Final approach: fan out across the central opening (W*0.30 to W*0.70)
        const approachX = this.isLeft
            ? W * (0.32 + Math.random() * 0.18)  // left side: 0.32–0.50
            : W * (0.50 + Math.random() * 0.18); // right side: 0.50–0.68

        // Corridor Y midpoints — centered between wall bottoms and next wall tops.
        // Walls at H*0.12, H*0.24, H*0.36, H*0.48 (each 40px thick).
        // C0=H*0.06, C1=H*0.213, C2=H*0.333, C3=H*0.453, C4=H*0.573
        const c0 = H * 0.06;
        const c1 = H * 0.213;
        const c2 = H * 0.333;
        const c3 = H * 0.453;
        const c4 = H * 0.573;

        if (this.isLeft) {
            this.waypoints = [
                // Corridor 0: enter top-left, sweep right toward divider gap
                { x: W * 0.20 + laneOffset, y: c0 },
                { x: W * 0.44 + laneOffset * 0.5, y: c0 },
                // Corridor 1: passed through l1 gap (x>W*0.38), sweep left
                { x: W * 0.44 + laneOffset * 0.5, y: c1 },
                { x: W * 0.06 + Math.abs(laneOffset), y: c1 },
                // Corridor 2: passed through l2 gap (x<W*0.12), sweep right
                { x: W * 0.06 + Math.abs(laneOffset), y: c2 },
                { x: W * 0.44 + laneOffset * 0.3, y: c2 },
                // Corridor 3: passed through l3 gap (x>W*0.38), sweep left
                { x: W * 0.44 + laneOffset * 0.3, y: c3 },
                { x: W * 0.06 + Math.abs(laneOffset * 0.5), y: c3 },
                // Corridor 4: passed through ll4 gap (x<W*0.12), approach base
                { x: W * 0.06 + Math.abs(laneOffset * 0.5), y: c4 },
                { x: approachX, y: c4 },
                { x: approachX, y: H * 0.65 }
            ];
        } else {
            this.waypoints = [
                // Corridor 0: enter top-right, sweep left toward divider gap
                { x: W * 0.80 + laneOffset, y: c0 },
                { x: W * 0.56 + laneOffset * 0.5, y: c0 },
                // Corridor 1: passed through r1 gap (x<W*0.62), sweep right
                { x: W * 0.56 + laneOffset * 0.5, y: c1 },
                { x: W * 0.94 - Math.abs(laneOffset), y: c1 },
                // Corridor 2: passed through r2 gap (x>W*0.88), sweep left
                { x: W * 0.94 - Math.abs(laneOffset), y: c2 },
                { x: W * 0.56 + laneOffset * 0.3, y: c2 },
                // Corridor 3: passed through r3 gap (x<W*0.62), sweep right
                { x: W * 0.56 + laneOffset * 0.3, y: c3 },
                { x: W * 0.94 - Math.abs(laneOffset * 0.5), y: c3 },
                // Corridor 4: passed through rl4 gap (x>W*0.88), approach base
                { x: W * 0.94 - Math.abs(laneOffset * 0.5), y: c4 },
                { x: approachX, y: c4 },
                { x: approachX, y: H * 0.65 }
            ];
        }
    }

  update(dt) {
    // Target current waypoint if available, otherwise target player directly
        let targetX = player.x;
        let targetY = player.y;

        if (this.waypointIndex < this.waypoints.length) {
            const wp = this.waypoints[this.waypointIndex];
            targetX = wp.x;
            targetY = wp.y;

            // Check if close enough to snap/advance to next node target
            if (Math.hypot(targetX - this.x, targetY - this.y) < 15) {
                this.waypointIndex++;
                if (this.waypointIndex < this.waypoints.length) {
                    const nextWp = this.waypoints[this.waypointIndex];
                    targetX = nextWp.x;
                    targetY = nextWp.y;
                } else {
                    targetX = player.x;
                    targetY = player.y;
                }
            }
        }

        const dx = targetX - this.x;
        const dy = targetY - this.y;
        const dist = Math.hypot(dx, dy);

    // If health is depleted, the enemy is considered "defeated"
    if (this.health <= 0) {
        this.dropGems();
        return false; // Signal that this enemy should be removed
    }

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
      if (!window.isCollidingWithObstacles(proposedX, this.y, this.radius, true)) {
        this.x += moveX;
      }

      const proposedY = this.y + moveY;
      if (!window.isCollidingWithObstacles(this.x, proposedY, this.radius, true)) {
        this.y += moveY;
      }
    }

    const margin = 100;
    return !(this.x < -margin || this.x > window.innerWidth + margin ||
      this.y < -margin || this.y > window.innerHeight + margin);
  }

  takeDamage(amount) {
    this.health -= amount;
    // The update loop will check this.health <= 0 and trigger drops/removal
  }

  dropGems() {
    if (this.type === 'boss') {
      // Boss drops a gold upgrade gem (value=100, color='#ffd700', radius=12)
      window.xpGems.push(new XPGem(this.x, this.y, 'xp', 100, '#ffd700'));
      return;
    }
    // Drop gem tier matching zombie type:
    //   red → green gem (value 10), orange → pink gem (value 20), purple → white gem (value 50)
    const gemValue = this.type === 'purple' ? 50 : this.type === 'orange' ? 20 : 10;
    const gemColor = this.type === 'purple' ? '#ffffff' : this.type === 'orange' ? '#ff69b4' : null;
    window.xpGems.push(new XPGem(this.x, this.y, 'xp', gemValue, gemColor));
    if (Math.random() < HEALTH_GEM_DROP_CHANCE) {
      window.xpGems.push(new XPGem(this.x, this.y, 'health'));
    }
  }

  draw(ctx) {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.fill();
    ctx.closePath();
  }
}


export function spawnEnemy() {
  const margin = 50;
  const W = window.innerWidth;

  // Symmetrically determine if the enemy spawns on the left or right entry tunnel
  const isLeft = Math.random() > 0.5;

  let x;
  if (isLeft) {
    // Random position between Left edge and Central Divider boundary
    x = Math.random() * (W * 0.38);
  } else {
    // Random position between Right edge and Central Divider boundary
    x = (W * 0.62) + Math.random() * (W * 0.38);
  }

  // Restrict spawning exclusively to the top margin of the viewport
  const y = -margin;

  // Determine zombie type based on current level
  const currentLevel = getLevel();
  let type = 'red';
  if (currentLevel >= 10) {
    // Level 10+: 20% purple, 30% orange, 50% red
    const roll = Math.random();
    if (roll < 0.2) type = 'purple';
    else if (roll < 0.5) type = 'orange';
  } else if (currentLevel >= 5) {
    // Level 5+: 30% orange, 70% red
    if (Math.random() < 0.3) type = 'orange';
  }

  enemies.push(new Enemy(x, y, isLeft, type));
}



// Spawn a boss enemy at a random top-lane position
export function spawnBoss() {
  const margin = 50;
  const W = window.innerWidth;
  const isLeft = Math.random() > 0.5;
  let x;
  if (isLeft) {
    x = Math.random() * (W * 0.38);
  } else {
    x = (W * 0.62) + Math.random() * (W * 0.38);
  }
  const y = -margin;
  enemies.push(new Enemy(x, y, isLeft, 'boss'));
}


// Nearest-neighbor search using Math.hypot (Phase 4)

// Expose getClosestEnemy globally for player.js (which is not a module)
window.getClosestEnemy = () => {
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
};

// Expose Enemy class and spawnEnemy for tests (page.evaluate needs global access)
window.Enemy = Enemy;
window.spawnEnemy = spawnEnemy;
window.enemies = enemies;
