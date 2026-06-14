// XP Gem Class (Phase 4)

// XP Gem Class (Phase 4)

class XPGem {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 6;
        this.color = 'green';

    }


    update(dt) {
        const dx = window.player.x - this.x;
        const dy = window.player.y - this.y;
        const dist = Math.hypot(dx, dy);

        if (dist > 0 && dist < window.player.magnetRadius) {
            const nx = dx / dist;
            const ny = dy / dist;
            this.x += nx * 0.3 * dt;
            this.y += ny * 0.3 * dt;
        }
    }


    draw(ctx) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.closePath();
    }
}

const xpGems = [];