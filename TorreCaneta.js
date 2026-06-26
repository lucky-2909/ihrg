class TorreCaneta extends Torre {
    constructor(x, y) {
        super(x, y, 'caneta', 150, 60);
        this.caminhoEvolucao = null; // 'presidencial', 'tinteiro', 'ouro'
        this.contadorTirosCaneta = 0;
    }

    get dano() {
        return 10 * (1 + (this.nivel - 1) * 0.35);
    }

    atualizar() {
        this.checarDebuff();

        if (this.cooldown === 0) {
            let inimigosNoAlcance = inimigos.filter(i => Math.sqrt((i.x + 10 - this.x) ** 2 + (i.y + 10 - this.y) ** 2) < this.alcance);
            
            if (!this.caminhoEvolucao) {
                let alvosSemLentidao = inimigosNoAlcance.filter(i => !i.lento);
                if (alvosSemLentidao.length > 0) inimigosNoAlcance = alvosSemLentidao;
            }

            if (inimigosNoAlcance.length > 0) {
                let alvoTarget = inimigosNoAlcance[0]; 

                if (this.caminhoEvolucao === 'presidencial') {
                    this.contadorTirosCaneta++;
                    let tirosParaEspecial = this.nivel >= 7 ? 4 : 5;

                    if (this.contadorTirosCaneta >= tirosParaEspecial) {
                        projeteis.push(new Projetil(this.x, this.y, alvoTarget, 'caneta_gigante', this.nivel));
                        this.contadorTirosCaneta = 0;
                    } else {
                        projeteis.push(new Projetil(this.x, this.y, alvoTarget, this.tipo, this.nivel));
                    }
                } else {
                    // Adiciona bônus de ouro se for o caminho 'ouro' ao disparar
                    if (this.caminhoEvolucao === 'ouro') {
                        moedas += 2;
                        document.getElementById("moedas").innerText = moedas;
                    }
                    
                    let tipoTiro = this.caminhoEvolucao === 'tinteiro' ? 'caneta_tinta' : this.tipo;
                    projeteis.push(new Projetil(this.x, this.y, alvoTarget, tipoTiro, this.nivel, 0));
                }
                this.cooldown = this.cadencia; 
            }
        }
    }

    desenhar() {
        this.desenharAlcance();
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.raio, 0, Math.PI * 2);

        if (this.caminhoEvolucao === 'presidencial') ctx.fillStyle = "#1a237e"; // Azul Imperial
        else if (this.caminhoEvolucao === 'tinteiro') ctx.fillStyle = "#4a148c"; // Roxo Tinteiro
        else if (this.caminhoEvolucao === 'ouro') ctx.fillStyle = "#ffd700"; // Caneta de Ouro
        else ctx.fillStyle = "#0044ff"; // Azul Base
        ctx.fill();

        ctx.strokeStyle = this.desacelerada ? "#9933ff" : (this.nivel >= 5 ? "#ffd700" : "#fff");
        ctx.lineWidth = (this.desacelerada || this.nivel >= 5) ? 3 : 1;
        ctx.stroke();

        ctx.fillStyle = "#fff";
        ctx.fillRect(this.x - 4, this.y - 16, 8, 12);
        this.desenharTextoNivel();
    }
}
