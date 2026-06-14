// XP Gem Class (Phase 4)

class XPGem {

    constructor(x, y) {

        this.x = x;

        this.y = y;

        this.radius = 6;

        this.color = 'green';

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
