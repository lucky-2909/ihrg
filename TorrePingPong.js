class TorrePingPong extends Torre {
    constructor(x, y) {
        super(x, y, 'ping_pong', 130, 40);
        this.caminhoEvolucao = null; // 'smash', 'spin', 'multi_bolas'
    }

    atualizar() {
        this.checarDebuff();

        if (this.cooldown === 0) {
            let alvos = inimigos.filter(i => Math.sqrt((i.x+10-this.x)**2 + (i.y+10-this.y)**2) < this.alcance);

            if (alvos.length > 0) {
                let principal = alvos[0];

                if (this.caminhoEvolucao === 'multi_bolas') {
                    projeteis.push(new Projetil(this.x, this.y, principal, 'bola_pingpong', this.nivel));
                    if (alvos[1]) projeteis.push(new Projetil(this.x, this.y, alvos[1], 'bola_pingpong', this.nivel));
                } else {
                    let tipoBola = 'bola_pingpong';
                    if (this.caminhoEvolucao === 'smash') tipoBola = 'bola_smash';
                    if (this.caminhoEvolucao === 'spin') tipoBola = 'bola_spin';
                    projeteis.push(new Projetil(this.x, this.y, principal, tipoBola, this.nivel));
                }

                this.cooldown = this.caminhoEvolucao === 'multi_bolas' ? Math.round(this.cadencia * 0.7) : this.cadencia;
            }
        }
    }

    desenhar() {
        this.desenharAlcance();

        ctx.beginPath(); ctx.arc(this.x, this.y, this.raio, 0, Math.PI * 2);
        if (this.caminhoEvolucao === 'smash') ctx.fillStyle = "#d32f2f";
        else if (this.caminhoEvolucao === 'spin') ctx.fillStyle = "#1976d2";
        else if (this.caminhoEvolucao === 'multi_bolas') ctx.fillStyle = "#388e3c";
        else ctx.fillStyle = "#ffb300";
        ctx.fill();

        ctx.strokeStyle = this.desacelerada ? "#9933ff" : (this.nivel >= 5 ? "#ffd700" : "#5d4037");
        ctx.lineWidth = (this.desacelerada || this.nivel >= 5) ? 3 : 1;
        ctx.stroke();

        ctx.fillStyle = "#8d6e63"; ctx.fillRect(this.x - 3, this.y - 15, 6, 8); // Cabo da raquete

        this.desenharTextoNivel();
    }
}
