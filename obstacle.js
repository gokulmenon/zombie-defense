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
    const thickness = 10;

    // Clear existing obstacles to prevent duplication on resize
    obstacles.length = 0;

    // Outer Perimeter Walls (Marked as true for perimeter)
    obstacles.push(new Obstacle(-thickness, 0, thickness, H));
    obstacles.push(new Obstacle(W, 0, thickness, H));
    obstacles.push(new Obstacle(0, H, W, thickness));
    obstacles.push(new Obstacle(0, -thickness, W, thickness));

    // Explicitly flag perimeters so integration tests pass
    obstacles.forEach(obs => obs.isPerimeter = true);

    // --- CENTRAL DIVIDER (Top portion to separate Left & Right lanes) ---
    // Extended down to 0.55 to create more winding path
    const divider = new Obstacle(W * 0.5 - thickness / 2, 0, thickness, H * 0.55);
    divider.isPerimeter = false;
    obstacles.push(divider);

    // --- LEFT TUNNEL (3 hairpin bends) ---
    // Bend 1: wall extends from left edge rightward at H*0.12
    const l1 = new Obstacle(0, H * 0.12, W * 0.38, thickness);
    // Bend 2: wall extends from center-divider leftward at H*0.24
    const l2 = new Obstacle(W * 0.12, H * 0.24, W * 0.38, thickness);
    // Bend 3: wall extends from left edge rightward at H*0.36
    const l3 = new Obstacle(0, H * 0.36, W * 0.38, thickness);
    l1.isPerimeter = false; l2.isPerimeter = false; l3.isPerimeter = false;
    obstacles.push(l1, l2, l3);

    // --- RIGHT TUNNEL (3 hairpin bends) ---
    // Bend 1: wall extends from right edge leftward at H*0.12
    const r1 = new Obstacle(W * 0.62, H * 0.12, W * 0.38, thickness);
    // Bend 2: wall extends from center-divider rightward at H*0.24
    const r2 = new Obstacle(W * 0.50, H * 0.24, W * 0.38, thickness);
    // Bend 3: wall extends from right edge leftward at H*0.36
    const r3 = new Obstacle(W * 0.62, H * 0.36, W * 0.38, thickness);
    r1.isPerimeter = false; r2.isPerimeter = false; r3.isPerimeter = false;
    obstacles.push(r1, r2, r3);

    // --- LOWER HAIRPIN (one more bend before the base opening) ---
    // Wall extends from divider on each side at H*0.48, leaving gaps at the outer edges
    const ll4 = new Obstacle(W * 0.12, H * 0.48, W * 0.38, thickness);
    const rl4 = new Obstacle(W * 0.50, H * 0.48, W * 0.38, thickness);
    ll4.isPerimeter = false; rl4.isPerimeter = false;
    obstacles.push(ll4, rl4);

    // --- T-DROP FLOOR (At 60% height with central gap) ---
    // The gap where enemies pour into the player's base
    const leftFloor = new Obstacle(0, H * 0.60, W * 0.30, thickness);
    const rightFloor = new Obstacle(W * 0.70, H * 0.60, W * 0.30, thickness);
    leftFloor.isPerimeter = false; rightFloor.isPerimeter = false;
    obstacles.push(leftFloor, rightFloor);

    // --- COMPACT DEFENSIVE BASE (Bottom 35%) ---
    const baseLeft = new Obstacle(0, H * 0.60, thickness, H * 0.40);
    const baseRight = new Obstacle(W - thickness, H * 0.60, thickness, H * 0.40);
    const baseBottom = new Obstacle(0, H - thickness, W, thickness);

    baseLeft.isPerimeter = false; baseRight.isPerimeter = false; baseBottom.isPerimeter = false;
    obstacles.push(baseLeft, baseRight, baseBottom);

    // --- DEFENSE TOWER FOUNDATIONS ---
    const fSize = 40;
    const foundations = window.foundations || [];
    foundations.length = 0;
    const mkFoundation = (cx, cy) => ({ x: cx - fSize / 2, y: cy - fSize / 2, width: fSize, height: fSize, tower: null });
    // Two towers flanking the central opening (just inside the base)
    foundations.push(mkFoundation(W * 0.38, H * 0.65));
    foundations.push(mkFoundation(W * 0.62, H * 0.65));
    window.foundations = foundations;
}

generateMap();
window.obstacles = obstacles;
