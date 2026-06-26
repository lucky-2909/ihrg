class PocaTinta {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.raio = 35;
        this.duracao = 180; // 3 segundos ativos a 60 FPS
    }

    atualizar() {
        this.duracao--;
        return this.duracao > 0;
    }

    desenhar() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.raio, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(0, 102, 204, 0.4)"; // Tinta azul transparente
        ctx.fill();
    }
}
