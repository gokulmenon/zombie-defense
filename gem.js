// XP Gem Class (Phase 4)

class XPGem {
    constructor(x, y, type = 'xp') {
        this.x = x;
        this.y = y;
        this.type = type; // 'xp' or 'health'
        this.radius = type === 'health' ? 14 : 6; // Health hearts are slightly larger targets
        this.value = type === 'health' ? 25 : 10; // 25 HP recovery vs 10 XP points
        this.isCollected = false;
    }

    update(dt) {
        if (this.isCollected) return; // Skip updates for collected gems

        // Use player directly from the module scope, not window.player
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.hypot(dx, dy);

        if (dist > 0 && dist < player.magnetRadius) {
            const nx = dx / dist;
            const ny = dy / dist;
            this.x += nx * 0.3 * dt;
            this.y += ny * 0.3 * dt;
        }
    }

    draw(ctx) {
        if (this.isCollected) return;

        if (this.type === 'health') {
            // Render as a filled heart emoji text anchor centered on coordinates
            ctx.font = "20px Arial";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText("❤️", this.x, this.y);
        } else {
            // Fallback default green XP gem drawing logic
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fillStyle = '#00FFCC';
            ctx.fill();
            ctx.closePath();
        }
    }
}

// Use the globally initialized array
export const xpGems = window.xpGems;
export { XPGem }; // Export XPGem class
