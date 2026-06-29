// XP Gem Class (Phase 4)

class XPGem {
    constructor(x, y, type = 'xp', value = null, color = null) {
        this.x = x;
        this.y = y;
        this.type = type; // 'xp' or 'health'
        this.isCollected = false;

        if (type === 'health') {
            this.radius = 14;
            this.value = 25;
            this.color = null; // rendered as heart emoji
        } else {
            // Gem tiers: value 10 (green, r=6), value 20 (pink, r=8), value 50 (white, r=10), value 100 (gold boss gem, r=12)
            this.value = value || 10;
            this.radius = this.value >= 100 ? 12 : this.value >= 50 ? 10 : this.value >= 20 ? 8 : 6;
            this.color = color || (this.value >= 50 ? '#ffffff' : this.value >= 20 ? '#ff69b4' : '#00FFCC');
        }
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
            // Gem circle colored by tier
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fillStyle = this.color || '#00FFCC';
            ctx.fill();
            ctx.closePath();
        }
    }
}

// Use the globally initialized array
export const xpGems = window.xpGems;
export { XPGem }; // Export XPGem class

// Expose XPGem globally for tests (page.evaluate needs global access)
window.XPGem = XPGem;
