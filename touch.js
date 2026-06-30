// Touch controls for mobile support
// Provides: virtual joystick (left side), tap-to-shoot (right side),
// tap-near-foundation to build/upgrade towers.

(function () {
  'use strict';

  const JOYSTICK_MAX_RADIUS = 50;
  const JOYSTICK_OUTER_RADIUS = 50;
  const JOYSTICK_INNER_RADIUS = 20;

  // Expose touch state for tests and external inspection
  const touchState = {
    joystickActive: false,
    joystickTouchId: null,
    joystickCenter: null,  // {x, y} — where the touch started
    joystickPos: null,     // {x, y} — current touch position (clamped)
    lastTapPos: null       // {x, y} — last right-side tap position
  };
  window.touchState = touchState;

  // Smooth direction vector for diagonal movement (set by joystick)
  window.touchDirection = null;

  // Wait for canvas to exist
  function init() {
    const canvas = document.getElementById('gameCanvas');
    if (!canvas) {
      // Retry if canvas not yet in DOM
      setTimeout(init, 50);
      return;
    }

    // Prevent browser gestures on the canvas
    canvas.style.touchAction = 'none';

    canvas.addEventListener('touchstart', onTouchStart, { passive: false });
    canvas.addEventListener('touchmove', onTouchMove, { passive: false });
    canvas.addEventListener('touchend', onTouchEnd, { passive: false });
    canvas.addEventListener('touchcancel', onTouchEnd, { passive: false });
  }

  function onTouchStart(e) {
    e.preventDefault();

    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      const x = touch.clientX;
      const y = touch.clientY;
      const halfWidth = window.innerWidth / 2;

      // Check if tap is near a foundation (build/upgrade tower) — any side
      if (tryBuildAtTap(x, y)) {
        continue; // Handled as a build action
      }

      if (x < halfWidth) {
        // LEFT SIDE — Virtual joystick
        if (!touchState.joystickActive) {
          touchState.joystickActive = true;
          touchState.joystickTouchId = touch.identifier;
          touchState.joystickCenter = { x: x, y: y };
          touchState.joystickPos = { x: x, y: y };
          // No movement yet — touch just started at center
          clearJoystickKeys();
          window.touchDirection = { x: 0, y: 0 };
        }
      } else {
        // RIGHT SIDE — Tap to shoot
        touchState.lastTapPos = { x: x, y: y };
        if (window.fireProjectileAt) {
          window.fireProjectileAt(x, y);
        }
      }
    }
  }

  function onTouchMove(e) {
    e.preventDefault();

    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];

      if (touchState.joystickActive && touch.identifier === touchState.joystickTouchId) {
        const dx = touch.clientX - touchState.joystickCenter.x;
        const dy = touch.clientY - touchState.joystickCenter.y;
        const dist = Math.hypot(dx, dy);

        // Clamp position to max radius
        let clampedX, clampedY;
        if (dist > JOYSTICK_MAX_RADIUS) {
          clampedX = touchState.joystickCenter.x + (dx / dist) * JOYSTICK_MAX_RADIUS;
          clampedY = touchState.joystickCenter.y + (dy / dist) * JOYSTICK_MAX_RADIUS;
        } else {
          clampedX = touch.clientX;
          clampedY = touch.clientY;
        }
        touchState.joystickPos = { x: clampedX, y: clampedY };

        // Normalize direction
        const normDist = Math.min(dist, JOYSTICK_MAX_RADIUS);
        if (normDist > 5) { // Dead zone of 5px
          const nx = dx / dist;
          const ny = dy / dist;
          window.touchDirection = { x: nx, y: ny };
          updateJoystickKeys(nx, ny);
        } else {
          window.touchDirection = { x: 0, y: 0 };
          clearJoystickKeys();
        }
      }
    }
  }

  function onTouchEnd(e) {
    e.preventDefault();

    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];

      if (touchState.joystickActive && touch.identifier === touchState.joystickTouchId) {
        touchState.joystickActive = false;
        touchState.joystickTouchId = null;
        touchState.joystickCenter = null;
        touchState.joystickPos = null;
        clearJoystickKeys();
        window.touchDirection = null;
      }
    }
  }

  // Map joystick direction to WASD key states so existing movement code works
  function updateJoystickKeys(nx, ny) {
    if (!window.keys) return;
    // Use thresholds to determine which keys are "pressed"
    const threshold = 0.3;
    window.keys.w = ny < -threshold;
    window.keys.s = ny > threshold;
    window.keys.a = nx < -threshold;
    window.keys.d = nx > threshold;
  }

  function clearJoystickKeys() {
    if (!window.keys) return;
    window.keys.w = false;
    window.keys.s = false;
    window.keys.a = false;
    window.keys.d = false;
  }

  // Try to build or upgrade a tower at the tap position
  function tryBuildAtTap(x, y) {
    if (window.buildOrUpgradeTowerAt) {
      return window.buildOrUpgradeTowerAt(x, y);
    }
    return false;
  }

  // Draw the joystick overlay — called from the game's draw loop
  window.drawTouchControls = function (ctx) {
    if (!touchState.joystickActive || !touchState.joystickCenter || !touchState.joystickPos) {
      return;
    }

    const cx = touchState.joystickCenter.x;
    const cy = touchState.joystickCenter.y;
    const px = touchState.joystickPos.x;
    const py = touchState.joystickPos.y;

    // Outer ring (touch origin)
    ctx.beginPath();
    ctx.arc(cx, cy, JOYSTICK_OUTER_RADIUS, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.closePath();

    // Inner filled circle (current touch position)
    ctx.beginPath();
    ctx.arc(px, py, JOYSTICK_INNER_RADIUS, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.fill();
    ctx.closePath();
  };

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
