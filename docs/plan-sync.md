# PLAN Sync Notes

This file tracks implementation status against the roadmap in `PLAN.md`.
Use it for detailed audit notes, wording fixes, and line-by-line replacements.

## Summary

- `PLAN.md` should stay high-level and describe milestones/features only.
- This file should hold implementation sync notes and detailed roadmap cleanup.
- Anything marked `[x]` below is implemented in the current codebase.
- Anything marked `[ ]` below is still pending or should be reworded before being marked done.

## Implementation audit

### Implemented

- Phase 1: Canvas scaffold, resize logic, and render loop.
- Phase 2: Player entity, WASD controls, movement, and bounds checks.
- Phase 3: Enemy spawning, movement, and cleanup.
- Phase 4: Projectiles, nearest-enemy targeting, hit detection, and XP gem drops.
- Phase 4.5: Module extraction into `enemy.js`, `projectile.js`, `gem.js`, and `player.js`.
- Phase 4.7: HUD, pause state, gem magnetism, and pause testing.
- Phase 4.8: Obstacle collision, wall sliding, LoS, avoidance, and integration tests.
- Phase 4.9: Symmetric map layout, top-only spawning, and waypoint AI.
- Phase 6.1: Boss zombies, enemy tiers, targeted projectiles, spawner refactor, and maze scaling.
- Phase 8: Game over and restart flow.

### Still pending

- Phase 5: Cleanup, UX polish, and test hardening.
- Phase 6: Architecture and shared-state refactor.
- Phase 6.2: Remaining engine refactor work and helper consolidation.
- Phase 7: Progression and wave tuning.

## Detailed replacements for `PLAN.md`

### Phase 4.8.2

Replace:

```md
- [x] Create `level.js` to define a `Level` class encapsulating map layout and `baseSpawnRate`.
- [x] Refactor the S-curve generation out of `obstacle.js` and into a `Level 1` configuration object.
- [x] Update the spawner timer to obey the active level's `baseSpawnRate` while keeping the global 360-degree off-screen spawn logic.
- [x] Update enemy logic to apply the exact same AABB collision clamping used for the player so they respect both interior and exterior walls.
- [x] Implement a Line-of-Sight (LoS) check: cast a direct vector from the enemy to the player to detect if any obstacle intersects the path.
```

With:

```md
- [ ] Extract wave and level calculations from `game.js` into `level.js` or `wave-manager.js`.
- [ ] Move map/level configuration data out of rendering code and into a dedicated level definition.
- [x] Keep the current spawn timing, wall collision, and line-of-sight behavior in place.
```

### Phase 4.9.3

Replace:

```md
- [x] In `enemy.js`, update the `Enemy` constructor to accept the `isLeft` flag.
- [x] Assign an array of specific `waypoints` based on the `isLeft` flag to guide the enemy through the hairpin gaps.
- [x] Initialize a `currentWaypoint` tracker.
- [x] Update the `update(dt)` movement logic: if the enemy has not reached all waypoints, calculate the movement vector towards the current waypoint instead of the player.
- [x] Advance `currentWaypoint` when the enemy gets within a small distance threshold (e.g., 30px) of the active waypoint.
```

With:

```md
- [x] In `enemy.js`, update the `Enemy` constructor to accept the `isLeft` flag.
- [x] Assign an array of specific `waypoints` based on the `isLeft` flag to guide the enemy through the hairpin gaps.
- [x] Initialize a `waypointIndex` tracker.
- [x] Update the `update(dt)` movement logic so the enemy moves toward the active waypoint before targeting the player.
- [x] Advance `waypointIndex` when the enemy gets within a small distance threshold of the active waypoint.
```

### Phase 5.1

Replace:

```md
- [ ] Lets consolidate all phase-* tests to single test under 300 lines covering one or two core end to end flows , goal is a good integration/smoke test to catch any regressions and easy maintainability with modular and clean separation of test and setup data code
- [ ] When you tap pause button, change button label to "play" and when tap again to play, toggle button label back to "pause"
```

With:

```md
- [ ] Consolidate the phase Playwright specs into one main smoke test plus a small set of focused regression tests.
- [ ] Add shared test setup helpers for page boot, pause control, and deterministic ticking.
- [ ] Standardize the pause button label everywhere so the HUD and click handler always use the same text convention.
- [ ] Fix the `window.getProjectiles()` test helper typo so it returns `window.projectiles`.
```

### Phase 5.2

Replace:

```md
- [ ] randomly 1 in 1000 zombies spawn a filled heart emoji that behaves like a gem but instead of XP gives 25 health (instead of green gem)
= [ ] Increase 25 health when player pulls heart towards them (cap health at 100)
```

With:

```md
- [ ] Finalize health gem behavior as a config-driven enemy drop that heals 25 HP and caps at 100.
```

### Phase 5.3

Replace:

```md
- [ ] Introduce abstraction for levels with level.js which we use for multiplying the zombie spawn counts to show progression (display this current level count on game hud along side health , lives, xp and play/pause button)
= [ ] keep track of zombies spawned over time and when threshold for level 2 reached update game hud level label to 2 and increase rate of zombies
```

With:

```md
- [ ] Make spawn rates, wave size, cooldowns, and enemy health data-driven.
- [ ] Add a visible level or wave label to the HUD.
- [ ] Define XP thresholds and wave transitions as explicit tuning data.
- [ ] Tie future content scaling to the progression system instead of hardcoding values in `game.js`.
```

### Phase 6

Keep these as future work, but consider the wording above as the preferred scope:

- shared state and module boundaries
- wave and level extraction
- geometry helper reuse
- explicit test/debug namespace

### Phase 6.1

Implemented:

- Boss zombies spawn on milestone levels and block normal waves while active.
- Enemy tiers scale by level and influence type, stats, and drops.
- Towers target enemies by priority instead of simple nearest-distance targeting.
- Spawn, wave, cooldown, and boss timing logic moved into `spawner.js`.
- HUD progression hooks and tower-growth balancing were added alongside the refactor.
- The maze was expanded to support later-stage difficulty, with foundation placement adjusted to fit the new flow.

### Phase 6.2

Pending:

- Extract shared wave, geometry, and state helpers into dedicated modules.
- Reduce `game.js` to a thinner orchestration layer.
- Move toward one explicit debug/test namespace for cross-file helpers.

### Phase 7

Keep these as future work, but consider the wording above as the preferred scope:

- data-driven tuning
- HUD level indicator
- XP thresholds and wave transitions
- future scaling rules

## Recommended follow-up

If you want the roadmap to stay clean over time, only update `PLAN.md` with milestones and feature phases.
Put implementation audits, replacement text, and sync notes in this file.
