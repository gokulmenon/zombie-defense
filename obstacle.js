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

    // Outer Perimeter Walls (Marked as true for perimeter)
    obstacles.push(new Obstacle(-thickness, 0, thickness, H)); 
    obstacles.push(new Obstacle(W, 0, thickness, H)); 
    obstacles.push(new Obstacle(0, H, W, thickness)); 
    obstacles.push(new Obstacle(0, -thickness, W, thickness));
    
    // Explicitly flag perimeters so integration tests pass
    obstacles.forEach(obs => obs.isPerimeter = true);

    // --- CENTRAL DIVIDER (Top half to separate Left & Right lanes) ---
    const divider = new Obstacle(W * 0.5 - thickness / 2, 0, thickness, H * 0.45);
    divider.isPerimeter = false;
    obstacles.push(divider);

    // --- LEFT TUNNEL HAIRPINS ---
    const l1 = new Obstacle(0, H * 0.15, W * 0.38, thickness);                 // Extends from left wall
    const l2 = new Obstacle(W * 0.12, H * 0.30, W * 0.38, thickness);            // Extends from divider wall
    l1.isPerimeter = false; l2.isPerimeter = false;
    obstacles.push(l1, l2);

    // --- RIGHT TUNNEL HAIRPINS ---
    const r1 = new Obstacle(W * 0.62, H * 0.15, W * 0.38, thickness);            // Extends from right wall
    const r2 = new Obstacle(W * 0.50, H * 0.30, W * 0.38, thickness);            // Extends from divider wall
    r1.isPerimeter = false; r2.isPerimeter = false;
    obstacles.push(r1, r2);

   // --- THE T-DROP FLOOR (At 45% height with a wide central gap) ---
    // Shortened width to 30% of screen to open up a clear central choke point
    const leftFloor = new Obstacle(0, H * 0.45, W * 0.30, thickness);
    const rightFloor = new Obstacle(W * 0.70, H * 0.45, W * 0.30, thickness);
    leftFloor.isPerimeter = false; rightFloor.isPerimeter = false;
    obstacles.push(leftFloor, rightFloor);

    // --- ENCLOSED DEFENSIVE BASE (Bottom 55% Enclosure) ---
    // 1. Move Left Base Wall to the absolute left edge of the screen
    const baseLeft = new Obstacle(0, H * 0.45, thickness, H * 0.55);
    
    // 2. Move Right Base Wall to the absolute right edge of the screen
    const baseRight = new Obstacle(W - thickness, H * 0.45, thickness, H * 0.55);
    
    // 3. Add a visible bottom base wall sitting slightly above the absolute canvas edge
    const baseBottom = new Obstacle(0, H - thickness, W, thickness);
    
    baseLeft.isPerimeter = false; baseRight.isPerimeter = false; baseBottom.isPerimeter = false;
    obstacles.push(baseLeft, baseRight, baseBottom);
}

generateMap();
window.obstacles = obstacles;