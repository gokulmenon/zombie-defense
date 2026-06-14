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
- [ ] Implement nearest-neighbor search to find the closest enemy to the player.
- [ ] Create Projectile class with properties for position, velocity, speed, and size.
- [ ] Implement a keyboard listener for the spacebar to spawn a projectile targeting the closest enemy.
- [ ] Manage an array of active projectiles, updating their trajectory each frame via deltaTime and removing them when off-screen.
- [ ] Implement Circle-Circle collision detection between projectiles and enemies.
- [ ] Handle enemy death: remove enemy and projectile, and drop an XP gem entity at the point of death.
- [ ] Update player XP collection when overlapping with XP gems.

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
