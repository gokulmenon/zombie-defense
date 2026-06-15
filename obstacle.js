class Obstacle {
    constructor(x, y, width, height, isPerimeter = false) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.isPerimeter = isPerimeter;
    }

    draw(ctx) {
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }
}

const obstacles = [];

function generateMap() {
    const W = window.innerWidth;
    const H = window.innerHeight;
    const thickness = 40;

    // Clear existing obstacles to prevent duplication on resize
    obstacles.length = 0;
    // Outer Perimeter Walls (Hidden/Extended)
    obstacles.push(new Obstacle(-thickness, 0, thickness, H, true)); // Left wall
    obstacles.push(new Obstacle(W, 0, thickness, H, true)); // Right wall
    obstacles.push(new Obstacle(0, H, W, thickness, true)); // Bottom wall
    obstacles.push(new Obstacle(0, -thickness, W, thickness, true)); // Top wall
    // Turn 1: Forces enemies to the far Right
    obstacles.push(new Obstacle(0, H * 0.15, W * 0.7, thickness));
    // Turn 2: Forces enemies to the far Left
    obstacles.push(new Obstacle(W * 0.3, H * 0.30, W * 0.7, thickness));
    // Turn 3: Forces enemies to the far Right again
    obstacles.push(new Obstacle(0, H * 0.35, W * 0.7, thickness));
    // Turn 4: Forces enemies to the far Left again
    obstacles.push(new Obstacle(W * 0.3, H * 0.65, W * 0.7, thickness));
    // The Delta: Central opening near the bottom (30% wide gap in the middle)
    obstacles.push(new Obstacle(0, H * 0.75, W * 0.35, thickness));
    obstacles.push(new Obstacle(W * 0.65, H * 0.75, W * 0.35, thickness));
}

generateMap();
window.obstacles = obstacles;