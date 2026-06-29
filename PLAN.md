# Game Development Roadmap

## Phase 1: Core Game Scaffold
### Phase 1.1: Canvas Setup
- [x] Create the full-screen canvas shell and basic page layout.
- [x] Remove default page spacing and prevent scrollbars from interfering with play.

### Phase 1.2: Render Loop
- [x] Initialize the game loop with `requestAnimationFrame`.
- [x] Clear and redraw the canvas on every frame.

### Phase 1.3: Resize Handling
- [x] Keep the canvas synced to the viewport size on load and resize.
- [x] Scale drawing logic correctly when the window dimensions change.

## Phase 2: Player Controls
### Phase 2.1: Player Entity
- [x] Create the player object with position, radius, speed, and stats.
- [x] Spawn the player in a sensible starting position on the map.

### Phase 2.2: Input Handling
- [x] Wire WASD keyboard listeners to a shared key-state object.
- [x] Support direct key-up and key-down tracking for movement.

### Phase 2.3: Movement and Bounds
- [x] Move the player based on normalized directional input.
- [x] Clamp player movement so it stays inside the playable area.

## Phase 3: Enemy Spawning
### Phase 3.1: Enemy Entity
- [x] Create the enemy object with position, speed, radius, and health.
- [x] Keep the enemy representation lightweight enough for mass spawning.

### Phase 3.2: Spawn System
- [x] Spawn enemies offscreen so they enter the play area naturally.
- [x] Randomize spawn positions while keeping them outside the visible arena.

### Phase 3.3: Chase and Cleanup
- [x] Move enemies toward the player each frame.
- [x] Remove enemies when they die or leave the active play space.

## Phase 4: Combat and Rewards
### Phase 4.1: Projectile Combat
- [x] Fire projectiles toward the nearest enemy.
- [x] Track projectile movement and cull shots that leave the screen.
- [x] Detect projectile/enemy collisions with circle-based hit checks.

### Phase 4.2: Rewards and Pickup
- [x] Drop XP gems when enemies die.
- [x] Let the player collect gems by overlapping them.
- [x] Convert reward pickups into XP and gem progress.

### Phase 4.3: Combat Loop Polish
- [x] Keep combat, cleanup, and reward flow stable across frames.

## Phase 4.5: Module Cleanup
### Phase 4.5.1: File Split
- [x] Split core gameplay into `enemy.js`, `projectile.js`, `gem.js`, and `player.js`.

### Phase 4.5.2: Script Order
- [x] Load scripts in dependency order so shared globals are available when needed.
- [x] Keep `game.js` focused on orchestration rather than entity definitions.

## Phase 4.7: HUD and Pause
### Phase 4.7.1: HUD Overlay
- [x] Display health, lives, XP, and gems in a DOM overlay.
- [x] Update the HUD from live game state each frame.

### Phase 4.7.2: Pause and Magnetism
- [x] Add pause/resume behavior for the game loop.
- [x] Pull XP gems toward the player once they enter magnet range.

### Phase 4.7.3: Test Coverage
- [x] Verify HUD updates, pause behavior, and gem magnetism with Playwright.

## Phase 4.8: Pathing and Wall Navigation
### Phase 4.8.1: Wall Physics
- [x] Add obstacle collisions using circle-vs-AABB checks.
- [x] Let the player slide along walls instead of stopping completely.

### Phase 4.8.2: Enemy Vision
- [x] Add line-of-sight checks between enemies and the player.
- [x] Trigger avoidance behavior when walls block direct pursuit.

### Phase 4.8.3: Pathing Tests
- [x] Cover wall collision, line-of-sight, and avoidance with integration tests.

## Phase 4.9: Maze Layout and Waypoint AI
### Phase 4.9.1: Symmetric Maze
- [x] Build a symmetric dual-tunnel maze with a central divider.
- [x] Add hairpin turns, a T-drop, and a protected base area.

### Phase 4.9.2: Directed Spawning
- [x] Spawn enemies from the top lane only.
- [x] Split spawns between the left and right tunnel routes.

### Phase 4.9.3: Waypoint Routing
- [x] Route enemies through waypoint chains before they target the player directly.
- [x] Advance waypoint progress as enemies move through the maze.

## Phase 5: Cleanup and Test Hardening
### Phase 5.1: Test Cleanup
- [ ] Consolidate Playwright coverage into a smaller smoke-test suite.
- [ ] Add shared test helpers for boot, pause control, and deterministic ticking.

### Phase 5.2: UX Polish
- [ ] Normalize pause-label behavior across the HUD and click handler.
- [ ] Keep HUD copy and control labels consistent across the game.

### Phase 5.3: Reward Rules
- [ ] Keep health gem behavior explicit and config-driven.
- [ ] Decide whether health rewards should be tied to drops, tiers, or both.

### Phase 5.4: Documentation and Helpers
- [ ] Fix remaining test helper and documentation mismatches.
- [ ] Keep roadmap notes aligned with the actual implementation state.

## Phase 6: Engine Refactor
### Phase 6.1: Enemy Variety and Combat Priorities
- [x] Boss zombies and boss-state handling.
- [x] Enemy tiers, priority targeting, and spawn refactors.
- [x] Later-stage maze and foundation scaling.

### Phase 6.2: Remaining Refactor Goals
- [ ] Extract shared wave, geometry, and state helpers into dedicated modules.
- [ ] Reduce `game.js` to a thinner orchestration layer.
- [ ] Move toward one explicit debug/test namespace for cross-file helpers.

## Phase 7: Progression and Tuning
### Phase 7.1: Data-Driven Scaling
- [ ] Make spawn rate, wave size, cooldown, and enemy scaling data-driven.
- [ ] Define XP and wave thresholds as tuning data.

### Phase 7.2: HUD Progression
- [ ] Add a visible level or wave indicator to the HUD.
- [ ] Expose progression state clearly during play.

## Phase 8: Game Over and Restart
- [x] Game over state and restart flow.
