// Projectile Class (Phase 4)

class Projectile {

    constructor(x, y, vx, vy) {

        this.x = x;

        this.y = y;

        this.vx = vx;

        this.vy = vy;

        this.radius = Math.max(2, Math.round(4 * Math.min(1, window.innerWidth / 800)));

        this.speed = 0.5; // pixels per ms

        this.color = 'yellow';

    }



    update(dt) {

        this.x += this.vx * this.speed * dt;

        this.y += this.vy * this.speed * dt;



        const margin = 10;

        return !(this.x < -margin || this.x > window.innerWidth + margin ||

                 this.y < -margin || this.y > window.innerHeight + margin);

    }



    draw(ctx) {

        ctx.beginPath();

        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);

        ctx.fillStyle = this.color;

        ctx.fill();

        ctx.closePath();

    }

}



const projectiles = [];
// EXPOSE GLOBALLY TO ES MODULES:
window.projectiles = projectiles;
window.xpGems = [];
