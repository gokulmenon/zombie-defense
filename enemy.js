// Enemy Spawning Logic (Phase 3)
import { XPGem } from './gem.js'; // Import XPGem class

export const enemies = [];
export let spawnTimer = 0;
export const SPAWN_INTERVAL = 1500; // ms between spawns initially
const HEALTH_GEM_DROP_CHANCE = 0.1; // 10% chance for a health gem to drop

class Enemy {

  constructor(x, y, isLeft = false) {
        this.x = x;
        this.y = y;
        this.isLeft = isLeft;
        this.radius = 12;
        this.speed = 0.1 + Math.random() * 0.1;
        this.health = 3; // Initial health
        this.color = 'red';
        
        this.waypointIndex = 0;
        this.waypoints = [];
        this.initWaypoints();
    }

    initWaypoints() {
        const W = window.innerWidth;
        const H = window.innerHeight;

        if (this.isLeft) {
            this.waypoints = [
                { x: W * 0.20, y: H * 0.10 }, // Move down into first lane pocket
                { x: W * 0.44, y: H * 0.10 }, // Round the first hairpin (center)
                { x: W * 0.44, y: H * 0.23 }, // Move down past divider
                { x: W * 0.06, y: H * 0.23 }, // Round the second hairpin (left wall)
                { x: W * 0.06, y: H * 0.38 }, // Move down past second wall
                // FIXED: Shifted slightly left (W * 0.46) to clear the divider column edge cleanly
                { x: W * 0.46, y: H * 0.38 }, 
                { x: W * 0.46, y: H * 0.52 }  // Drop cleanly into the left mouth of the base
            ];
        } else {
            this.waypoints = [
                { x: W * 0.80, y: H * 0.10 }, // Move down into first lane pocket
                { x: W * 0.56, y: H * 0.10 }, // Round the first hairpin (center)
                { x: W * 0.56, y: H * 0.23 }, // Move down past divider
                { x: W * 0.94, y: H * 0.23 }, // Round the second hairpin (right wall)
                { x: W * 0.94, y: H * 0.38 }, // Move down past second wall
                // FIXED: Shifted slightly right (W * 0.54) to clear the divider column edge cleanly
                { x: W * 0.54, y: H * 0.38 }, 
                { x: W * 0.54, y: H * 0.52 }  // Drop cleanly into the right mouth of the base
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

  takeDamage(amount) {
    this.health -= amount;
    // The update loop will check this.health <= 0 and trigger drops/removal
  }

  dropGems() {
    window.xpGems.push(new XPGem(this.x, this.y, 'xp'));
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

  enemies.push(new Enemy(x, y, isLeft));
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
