# Game Development Roadmap

## Phase 1: Scaffolding
- [x] Create HTML structure with full-screen canvas element.
- [x] Apply CSS to remove default margins/padding and handle overflow.
- [x] Initialize JavaScript module for game loop using `requestAnimationFrame`.
- [x] Implement canvas resizing logic so it always fills the viewport.
- [x] Clear canvas each frame with a solid background color.

## Phase 2: Player Entity & Movement
- [x] Create Player class/object with position, velocity, and dimensions.
- [x] Draw player as a simple geometric shape on canvas.
- [x] Implement WASD keyboard event listeners to update player velocity.
- [x] Update player position based on velocity each frame.
- [x] Add boundary checks to keep player within canvas bounds.

## Phase 3: Enemy Spawning Logic
- [x] Create Enemy class with properties for position, speed, and health.
- [x] Implement spawn timer that creates enemies at random positions outside the canvas edges.
- [x] Update enemy movement logic to calculate vector towards player and move accordingly.
- [x] Manage an array of active enemies and remove them when they leave the screen or die.

## Phase 4: Combat System & XP Collection
- [x] Implement nearest-neighbor search to find the closest enemy to the player.
- [x] Create Projectile class with properties for position, velocity, speed, and size.
- [x] Implement a keyboard listener for the spacebar to spawn a projectile targeting the closest enemy.
- [x] Manage an array of active projectiles, updating their trajectory each frame via deltaTime and removing them when off-screen.
- [x] Implement Circle-Circle collision detection between projectiles and enemies.
- [x] Handle enemy death: remove enemy and projectile, and drop an XP gem entity at the point of death.
- [x] Update player XP collection when overlapping with XP gems.

## Phase 4.5: Code Abstraction & Refactoring
- [x] Extract `Enemy` class and spawn logic into `enemy.js`.
- [x] Extract `Projectile` class into `projectile.js`.
- [x] Extract `XPGem` class into `gem.js`.
- [x] Extract `Player` object and keyboard input tracking into `player.js`.
- [x] Update `index.html` to load all new script files in the correct dependency order before `game.js`.
- [x] Clean up `game.js` to strictly handle the game loop, canvas rendering, and collision orchestration.

## Phase 4.7: Player HUD, Pause State & Gem Magnetism
- [x] Create a DOM-based HUD overlay (`#hud`) positioned absolutely over the canvas to display Player Health, Lives, and XP.
- [x] Add a clickable "Pause" button to the HUD.
- [x] Implement an `updateHUD()` function to dynamically sync the DOM text with player stats.
- [x] Implement an `isPaused` state in the game loop to freeze physics, spawning, and timers when active.
- [x] Add a `magnetRadius` property to the Player.
- [x] Update the `XPGem` logic: if the distance between the gem and the player is within `magnetRadius`, move the gem toward the player.
- [x] Write Playwright tests to verify the HUD updates, the pause button stops movement, and gems move toward the player.

## Phase 4.8: Fixed Pathing & Map Architecture
### Phase 4.8.1: Structural Canyon Rendering & Player Physics
- [x] Create `obstacle.js` with an `Obstacle` class (x, y, width, height).
- [x] Implement a `generateMap()` function that builds a specific winding tunnel (S-curve) from the top, opening into a wide delta in the bottom-center. The tunnel can start offscreen but the opening at the bottom should be roughly in the center of the screen where the blue player circle is rendered at the start of the game.
- [x] Use proportional sizing (e.g., `window.innerWidth * 0.7`) to ensure the map scales with the window.
- [x] Implement Circle vs AABB collision math using coordinate clamping.
- [x] Update player logic to slide along walls by canceling the specific axis of movement. 
- [x] Ensure projectiles DO NOT collide with walls (they shoot over them).

### Phase 4.8.2: Level Encapsulation & AI Line-of-Sight
- [x] Create `level.js` to define a `Level` class encapsulating map layout and `baseSpawnRate`.
- [x] Refactor the S-curve generation out of `obstacle.js` and into a `Level 1` configuration object.
- [x] Update the spawner timer to obey the active level's `baseSpawnRate` while keeping the global 360-degree off-screen spawn logic.
- [x] Update enemy logic to apply the exact same AABB collision clamping used for the player so they respect both interior and exterior walls.
- [x] Implement a Line-of-Sight (LoS) check: cast a direct vector from the enemy to the player to detect if any obstacle intersects the path.

### Phase 4.8.3: AI Steering & Avoidance
- [ ] Add an "Avoidance" state to the enemy logic that triggers when their LoS to the player is obstructed.
- [ ] Calculate the normal of the specific wall the enemy is colliding with.
- [ ] Apply a perpendicular force (steering behavior) so the enemy slides along the canyon walls until LoS is regained.

### Phase 4.8.4: Playwright Integration Tests
- [ ] Write test: Verify player movement is clamped and sliding occurs upon intersecting an obstacle.
- [ ] Write test: Verify enemy Line-of-Sight is correctly blocked by obstacles.
- [ ] Write test: Verify enemy "Avoidance" state steering behavior forces them to navigate perpendicularly around an obstacle rather than passing through.

## Phase 4.9: Symmetrical Tower Defense Layout & Waypoint AI
### Phase 4.9.1: Map Architecture (Hairpins & T-Drop)
- [ ] In `obstacle.js`, rewrite `generateMap()` to replace the S-curve with a symmetrical dual-tunnel system.
- [ ] Create a central top divider to separate the left and right tunnels.
- [ ] Implement three interlocking horizontal walls on both sides to create hairpin turns.
- [ ] Create a "T-Drop" floor at 45% height with a central gap.
- [ ] Construct a U-shaped enclosed defensive base in the bottom 55% of the screen.
- [ ] In `player.js`, update the player's initial `y` coordinate to spawn exactly at the mouth of the T-Drop funnel.

### Phase 4.9.2: Directed Top-Spawning
- [ ] In `enemy.js`, update `spawnEnemy()` to restrict enemy spawning exclusively to the top edge of the canvas.
- [ ] Implement logic to randomly determine if an enemy spawns on the left side or right side of the central divider.
- [ ] Pass an `isLeft` boolean flag into the `Enemy` constructor.

### Phase 4.9.3: AI Waypoint Navigation
- [ ] In `enemy.js`, update the `Enemy` constructor to accept the `isLeft` flag.
- [ ] Assign an array of specific `waypoints` based on the `isLeft` flag to guide the enemy through the hairpin gaps.
- [ ] Initialize a `currentWaypoint` tracker.
- [ ] Update the `update(dt)` movement logic: if the enemy has not reached all waypoints, calculate the movement vector towards the current waypoint instead of the player.
- [ ] Advance `currentWaypoint` when the enemy gets within a small distance threshold (e.g., 30px) of the active waypoint.

## Phase 5: Leveling & Wave State Machine
- [ ] Define XP thresholds for leveling up.
- [ ] Pause game loop (or slow time) when XP threshold is reached.
- [ ] Render HTML overlay menu with 3 random upgrade choices.
- [ ] Handle player selection to apply stat boosts or new weapons.
- [ ] Implement Wave Manager that increases enemy spawn rate and health over time.

## Phase 6: Game Over & Restart States
- [ ] Detect when player health reaches zero.
- [ ] Trigger Game Over state: stop game loop, show final score/stats overlay.
- [ ] Provide "Restart" button to reset all game variables and restart the loop.
