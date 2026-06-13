const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Handle window resizing so the canvas always fills the screen
function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize(); // Initial call to set correct dimensions on load

// Game state variables
let lastTime = 0;

// Main game loop using requestAnimationFrame
function gameLoop(timestamp) {
    const deltaTime = timestamp - lastTime;
    lastTime = timestamp;

    update(deltaTime);
    draw();

    requestAnimationFrame(gameLoop);
}

function update(dt) {
    // Phase 1 placeholder: No entities or logic implemented yet.
}

function draw() {
    // Clear the screen with a dark grey background every frame
    ctx.fillStyle = '#2a2a2a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

// Start the game loop
requestAnimationFrame(gameLoop);
