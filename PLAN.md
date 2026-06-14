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
- [ ] Extract `Enemy` class and spawn logic into `enemy.js`.
- [ ] Extract `Projectile` class into `projectile.js`.
- [ ] Extract `XPGem` class into `gem.js`.
- [ ] Extract `Player` object and keyboard input tracking into `player.js`.
- [ ] Update `index.html` to load all new script files in the correct dependency order before `game.js`.
- [ ] Clean up `game.js` to strictly handle the game loop, canvas rendering, and collision orchestration.

## Phase 4.7: Player HUD, Pause State & Gem Magnetism
- [ ] Create a DOM-based HUD overlay (`#hud`) positioned absolutely over the canvas to display Player Health, Lives, and XP.
- [ ] Add a clickable "Pause" button to the HUD.
- [ ] Implement an `updateHUD()` function to dynamically sync the DOM text with player stats.
- [ ] Implement an `isPaused` state in the game loop to freeze physics, spawning, and timers when active.
- [ ] Add a `magnetRadius` property to the Player.
- [ ] Update the `XPGem` logic: if the distance between the gem and the player is within `magnetRadius`, move the gem toward the player.
- [ ] Write Playwright tests to verify the HUD updates, the pause button stops movement, and gems move toward the player.

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
