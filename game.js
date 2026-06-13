const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Handle window resizing so the canvas always fills the screen
function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize(); // Initial call to set correct dimensions on load

// Player object
const player = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    radius: 15,
    speed: 0.2, // pixels per ms
    color: 'blue'
};

// Keyboard state tracker
const keys = { w: false, a: false, s: false, d: false };

window.addEventListener('keydown', (e) => {
    const key = e.key.toLowerCase();
    if (keys.hasOwnProperty(key)) {
        keys[key] = true;
    }
});

window.addEventListener('keyup', (e) => {
    const key = e.key.toLowerCase();
    if (keys.hasOwnProperty(key)) {
        keys[key] = false;
    }
});

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
    let dx = 0;
    let dy = 0;

    if (keys.w) dy -= 1;
    if (keys.s) dy += 1;
    if (keys.a) dx -= 1;
    if (keys.d) dx += 1;

    // Normalize diagonal movement to maintain consistent speed
    if (dx !== 0 || dy !== 0) {
        const length = Math.sqrt(dx * dx + dy * dy);
        dx /= length;
        dy /= length;
    }

    player.x += dx * player.speed * dt;
    player.y += dy * player.speed * dt;

    // Boundary checks to keep the circle within canvas edges
    if (player.x - player.radius < 0) {
        player.x = player.radius;
    }
    if (player.x + player.radius > canvas.width) {
        player.x = canvas.width - player.radius;
    }
    if (player.y - player.radius < 0) {
        player.y = player.radius;
    }
    if (player.y + player.radius > canvas.height) {
        player.y = canvas.height - player.radius;
    }
}

function draw() {
    // Clear the screen with a dark grey background every frame
    ctx.fillStyle = '#2a2a2a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw player as a filled blue circle
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
    ctx.fillStyle = player.color;
    ctx.fill();
    ctx.closePath();
}

// Start the game loop
requestAnimationFrame(gameLoop);

// Expose player position for testing purposes
window.getPlayerPos = () => ({ x: player.x, y: player.y });
