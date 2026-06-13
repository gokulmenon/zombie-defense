# Game Development Roadmap

## Phase 1: Scaffolding
- [ ] Create HTML structure with full-screen canvas element.
- [ ] Apply CSS to remove default margins/padding and handle overflow.
- [ ] Initialize JavaScript module for game loop using `requestAnimationFrame`.
- [ ] Implement canvas resizing logic so it always fills the viewport.
- [ ] Clear canvas each frame with a solid background color.

## Phase 2: Player Entity & Movement
- [ ] Create Player class/object with position, velocity, and dimensions.
- [ ] Draw player as a simple geometric shape on canvas.
- [ ] Implement WASD keyboard event listeners to update player velocity.
- [ ] Update player position based on velocity each frame.
- [ ] Add boundary checks to keep player within canvas bounds.

## Phase 3: Enemy Spawning Logic
- [ ] Create Enemy class with properties for position, speed, and health.
- [ ] Implement spawn timer that creates enemies at random positions outside the canvas edges.
- [ ] Update enemy movement logic to calculate vector towards player and move accordingly.
- [ ] Manage an array of active enemies and remove them when they leave the screen or die.

## Phase 4: Auto-Combat System
- [ ] Implement nearest-neighbor search to find closest enemy to player.
- [ ] Create Projectile class for auto-fired weapons.
- [ ] Draw projectiles on canvas and update their trajectory towards target.
- [ ] Implement collision detection between projectiles and enemies (AABB or Circle-Circle).
- [ ] Handle enemy death: remove from array, play sound/effect, drop XP gem entity.
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
