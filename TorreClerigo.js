class TorreClerigo extends Torre {
    constructor(x, y) {
        super(x, y, 'clerigo', 120, 480); // Recarga longa para balancear a cura
        this.caminhoEvolucao = null; // 'cura_maxima', 'purificacao', 'inspiracao'
    }

    atualizar() {
        this.checarDebuff();

        // Lógica do Caminho 3: Inspiração (Limpa debuffs das torres vizinhas continuamente)
        if (this.caminhoEvolucao === 'inspiracao') {
            for (let outraTorre of torres) {
                let dist = Math.sqrt((outraTorre.x - this.x)**2 + (outraTorre.y - this.y)**2);
                if (dist < this.alcance) {
                    outraTorre.desacelerada = false; // Anula o debuff do Inimigo Roxo
                }
            }
        }

        if (this.cooldown === 0) {
            // LÓGICA DE REGENERAÇÃO (Caminho 1 e Base)
            if (this.caminhoEvolucao === 'cura_maxima' || !this.caminhoEvolucao) {
                if (vida < 20) { // Só cura se o jogador não estiver com a vida cheia
                    let pontosCura = this.caminhoEvolucao === 'cura_maxima' ? 3 : 1;
                    vida = Math.min(20, vida + pontosCura);
                    document.getElementById("vida").innerText = vida;
                }
            }

            // LÓGICA DE COMBATE (Caminho 2: Inquisidor)
            if (this.caminhoEvolucao === 'purificacao') {
                let alvos = inimigos.filter(i => Math.sqrt((i.x + 10 - this.x) ** 2 + (i.y + 10 - this.y) ** 2) < this.alcance);
                alvos.forEach(inimigo => {
                    inimigo.vida -= 40 * (1 + (this.nivel - 1) * 0.3); // Dano mágico alto
                    if (inimigo.tipo === 'debuff') inimigo.raioDebuff = 0; // Desliga a aura do monstro roxo!
                });
            }

            this.cooldown = this.cadencia;
        }
    }

    desenhar() {
        this.desenharAlcance();
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.raio, 0, Math.PI * 2);

        if (this.caminhoEvolucao === 'cura_maxima') ctx.fillStyle = "#e3f2fd";    // Branco Sagrado
        else if (this.caminhoEvolucao === 'purificacao') ctx.fillStyle = "#ffea00"; // Amarelo Inquisição
        else if (this.caminhoEvolucao === 'inspiracao') ctx.fillStyle = "#00e5ff";  // Ciano Protetor
        else ctx.fillStyle = "#e0e0e0";                                             // Cinza Clericato
        ctx.fill();

        ctx.strokeStyle = this.desacelerada ? "#9933ff" : (this.nivel >= 5 ? "#ffd700" : "#b0bec5");
        ctx.lineWidth = (this.desacelerada || this.nivel >= 5) ? 3 : 1;
        ctx.stroke();

        // Cruz sagrada no centro do Clerigo
        ctx.fillStyle = "#ff1744";
        ctx.fillRect(this.x - 2, this.y - 8, 4, 16);
        ctx.fillRect(this.x - 8, this.y - 2, 16, 4);

        this.desenharTextoNivel();
    }
}
