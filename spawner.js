// Spawner Module — consolidated spawn/level/wave/cooldown logic
import { enemies, spawnEnemy, spawnBoss } from './enemy.js';

// --- LEVEL FORMULA ---
// Level = floor(log2(xp/10 + 1)) + 1  (logarithmic XP scaling)
export function getLevel() {
  return Math.floor(Math.log2(player.xp / 10 + 1)) + 1;
}

// Spawn rate: level zombies per second → interval = 1000/level ms
export function getSpawnInterval() {
  return 1000 / getLevel();
}

// Wave size: level × 100 zombies before a cooldown
export function getWaveSize() {
  return getLevel() * 100;
}

// Cooldown: 10s × 2^(level-1), capped at 60s
export function getCooldownDuration() {
  const level = getLevel();
  return Math.min(10000 * Math.pow(2, level - 1), 60000);
}

// Expose spawn rate (zombies per second) for tests — same as getLevel()
export function getSpawnRate() {
  return getLevel();
}

// Legacy compatibility: getSpawnRateForXP(xp) used by enemy.js for zombie type selection
export function getSpawnRateForXP(xp) {
  return Math.floor(Math.log2(xp / 10 + 1)) + 1;
}

// --- SPAWN TIMER / WAVE / COOLDOWN STATE ---
let spawnTimer = 0;
let waveSpawnCount = 0;
let cooldownTimer = 0;

// --- BOSS STATE ---
let bossActive = false;
let lastBossLevel = 0;

export function isBossActive() {
  return bossActive;
}

export function onBossDied() {
  bossActive = false;
  // Resume normal spawning after boss dies
}

// --- WAVE STATE ---
export function getWaveState() {
  return {
    level: getLevel(),
    spawnCount: waveSpawnCount,
    waveSize: getWaveSize(),
    cooldownRemaining: cooldownTimer,
    cooldownDuration: getCooldownDuration(),
    inCooldown: cooldownTimer > 0
  };
}

// --- TICK SPAWNER ---
// Handles spawn timer/wave/cooldown logic each frame
export function tickSpawner(dt) {
  // If boss is alive, block all normal spawning
  if (bossActive) return;

  if (cooldownTimer > 0) {
    cooldownTimer -= dt;
    if (cooldownTimer < 0) cooldownTimer = 0;
    // When cooldown ends, check for boss spawn
    if (cooldownTimer <= 0) {
      const level = getLevel();
      if (level % 5 === 0 && level > 0 && lastBossLevel !== level) {
        // Spawn boss instead of starting next wave
        lastBossLevel = level;
        bossActive = true;
        spawnBoss();
        return;
      }
    }
  } else {
    spawnTimer += dt;
    const currentSpawnInterval = getSpawnInterval();
    while (spawnTimer >= currentSpawnInterval && cooldownTimer <= 0) {
      spawnEnemy();
      spawnTimer -= currentSpawnInterval;
      waveSpawnCount++;
      if (waveSpawnCount >= getWaveSize()) {
        waveSpawnCount = 0;
        cooldownTimer = getCooldownDuration();
        spawnTimer = 0;
        break;
      }
    }
  }
}

// --- RESET ---
export function resetSpawner() {
  spawnTimer = 0;
  waveSpawnCount = 0;
  cooldownTimer = 0;
  bossActive = false;
  lastBossLevel = 0;
}

// --- EXPOSE TO WINDOW FOR TESTS ---
window.getSpawnRate = getSpawnRate;
window.getLevel = getLevel;
window.getWaveState = getWaveState;
window.getSpawnRateForXP = getSpawnRateForXP;
window.isBossActive = isBossActive;
