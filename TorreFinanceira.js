class TorreFinanceira extends Torre {
    constructor(x, y) {
        super(x, y, 'financeira', 100, 300); // Cadência alta = intervalo maior entre geração
        this.caminhoEvolucao = null; // 'investidor', 'imposto', 'seguro'
        this.vidaAnterior = vida;
    }

    atualizar() {
        this.checarDebuff();

        // Lógica do Caminho 3: Seguro de Crise
        if (this.caminhoEvolucao === 'seguro') {
            if (vida < this.vidaAnterior) {
                let perda = this.vidaAnterior - vida;
                moedas += perda * 40; // Dá 40g por cada ponto de vida perdido
                document.getElementById("moedas").innerText = moedas;
                this.vidaAnterior = vida;
            }
        }

        if (this.cooldown === 0) {
            let lucro = 10 * this.nivel;

            if (this.caminhoEvolucao === 'investidor') {
                lucro *= 2.5; // Investimento com alto retorno
            }

            // Geração ativa de moedas
            if (this.caminhoEvolucao !== 'imposto') {
                moedas += Math.round(lucro);
                document.getElementById("moedas").innerText = moedas;
            }

            // Lógica do Caminho 2: Pulso de Impostos (AoE)
            if (this.caminhoEvolucao === 'imposto') {
                let alvos = inimigos.filter(i => Math.sqrt((i.x + 10 - this.x) ** 2 + (i.y + 10 - this.y) ** 2) < this.alcance);
                alvos.forEach(inimigo => {
                    inimigo.recompensa += 5; // Aumenta permanentemente o drop do monstro
                });
            }

            this.cooldown = this.cadencia;
        }
    }

    desenhar() {
        this.desenharAlcance();
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.raio, 0, Math.PI * 2);

        if (this.caminhoEvolucao === 'investidor') ctx.fillStyle = "#2e7d32"; // Verde Dinheiro
        else if (this.caminhoEvolucao === 'imposto') ctx.fillStyle = "#c62828";    // Vermelho Receita
        else if (this.caminhoEvolucao === 'seguro') ctx.fillStyle = "#0277bd";     // Azul Seguro
        else ctx.fillStyle = "#ffeb3b";                                            // Amarelo Base
        ctx.fill();

        ctx.strokeStyle = this.desacelerada ? "#9933ff" : (this.nivel >= 5 ? "#ffd700" : "#fff");
        ctx.lineWidth = (this.desacelerada || this.nivel >= 5) ? 3 : 1;
        ctx.stroke();

        // Desenha um cifrão de moedas no centro em Pixel Art
        ctx.fillStyle = "#000";
        ctx.font = "bold 14px Arial";
        ctx.textAlign = "center";
        ctx.fillText("$", this.x, this.y + 5);

        this.desenharTextoNivel();
    }
}
