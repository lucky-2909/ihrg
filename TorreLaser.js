class TorreLaser extends Torre {
    constructor(x, y) {
        super(x, y, 'padrao', 120, 30);
        this.caminhoEvolucao = null; // 'chain', 'focus', 'burst'
    }

    get dano() {
        let base = 15 * (1 + (this.nivel - 1) * 0.3);
        if (this.caminhoEvolucao === 'focus') return base * 2.5; // Dano massivo focado
        return base;
    }

    get cadencia() {
        let base = super.cadencia;
        if (this.caminhoEvolucao === 'burst') return Math.max(4, Math.round(base * 0.5)); // Metade do tempo de recarga
        return base;
    }

    atualizar() {
        this.checarDebuff();

        if (this.cooldown === 0) {
            let alvos = [];
            let maxAlvos = 1;

            if (this.caminhoEvolucao === 'chain') maxAlvos = this.nivel >= 7 ? 3 : 2;
            else if (this.caminhoEvolucao === 'burst') maxAlvos = 1;

            let inimigosNoAlcance = inimigos.filter(i => Math.sqrt((i.x + 10 - this.x) ** 2 + (i.y + 10 - this.y) ** 2) < this.alcance);
            inimigosNoAlcance.sort((a, b) => Math.sqrt((a.x + 10 - this.x) ** 2 + (a.y + 10 - this.y) ** 2) - Math.sqrt((b.x + 10 - this.x) ** 2 + (b.y + 10 - this.y) ** 2));

            for (let i = 0; i < Math.min(maxAlvos, inimigosNoAlcance.length); i++) {
                alvos.push(inimigosNoAlcance[i]);
            }

            if (alvos.length > 0) {
                alvos.forEach((alvo, index) => {
                    let tipoProjetil = this.caminhoEvolucao === 'chain' ? 'bola_chain' : this.tipo;
                    projeteis.push(new Projetil(this.x, this.y, alvo, tipoProjetil, this.nivel, index));
                });
                this.cooldown = this.cadencia;
            }
        }
    }

    desenhar() {
        this.desenharAlcance();
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.raio, 0, Math.PI * 2);
        
        if (this.caminhoEvolucao === 'chain') ctx.fillStyle = "#00e676"; // Verde Plasma
        else if (this.caminhoEvolucao === 'focus') ctx.fillStyle = "#ff1744"; // Vermelho Concentrado
        else if (this.caminhoEvolucao === 'burst') ctx.fillStyle = "#ff9900"; // Laranja Metralhadora
        else ctx.fillStyle = "#3399ff"; // Azul Base
        ctx.fill();

        ctx.strokeStyle = this.desacelerada ? "#9933ff" : (this.nivel >= 5 ? "#ffff00" : "#fff");
        ctx.lineWidth = (this.desacelerada || this.nivel >= 5) ? 3 : 1;
        ctx.stroke();

        this.desenharTextoNivel();
    }
}
