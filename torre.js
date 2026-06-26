class Torre {
    constructor(x, y, tipo, alcanceBase, cadenciaBase) {
        this.x = x;
        this.y = y;
        this.tipo = tipo;
        this.raio = 20;
        this.nivel = 1;
        this.alcanceBase = alcanceBase;
        this.cadenciaBase = cadenciaBase;
        this.cooldown = 0;
        this.desacelerada = false;
    }

    get alcance() {
        return this.alcanceBase * (1 + (this.nivel - 1) * 0.18);
    }

    get cadencia() {
        let cadenciaAtual = Math.max(8, Math.round(this.cadenciaBase * (1 - (this.nivel - 1) * 0.12)));
        return this.desacelerada ? cadenciaAtual * 2 : cadenciaAtual;
    }

    checarDebuff() {
        this.desacelerada = false;
        for (let inimigo of inimigos) {
            if (inimigo.tipo === 'debuff') {
                let dist = Math.sqrt((inimigo.x + 10 - this.x)**2 + (inimigo.y + 10 - this.y)**2);
                if (dist < inimigo.raioDebuff) {
                    this.desacelerada = true;
                    break;
                }
            }
        }
        if (this.cooldown > 0) this.cooldown--;
    }

    desenharAlcance() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.alcance, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255, 255, 255, 0.02)";
        ctx.fill();
    }

    desenharTextoNivel() {
        ctx.fillStyle = this.nivel >= 7 ? "#ffffff" : "#000000";
        ctx.font = "bold 11px Arial";
        ctx.textAlign = "center";
        ctx.fillText(this.nivel >= 7 ? "MAX" : "Lvl " + this.nivel, this.x, this.y + 4);
    }
}