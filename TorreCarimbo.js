class TorreCarimbo extends Torre {
    constructor(x, y) {
        super(x, y, 'carimbo', 100, 80);
        this.caminhoEvolucao = null; // 'prensa', 'rejeitado', 'explosivo'
        this.raioExplosaoAnimacao = 0;
        this.exibirExplosao = false;
        this.explosaoX = 0;
        this.explosaoY = 0;
    }

    get dano() {
        return 25 * (1 + (this.nivel - 1) * 0.45);
    }

    atualizar() {
        this.checarDebuff();

        if (this.exibirExplosao) {
            let raioMaximo = this.nivel >= 7 ? 120 : (this.nivel >= 5 ? 90 : 60);
            this.raioExplosaoAnimacao += 5;
            if (this.raioExplosaoAnimacao >= raioMaximo) {
                this.exibirExplosao = false;
                this.raioExplosaoAnimacao = 0;
            }
        }

        if (this.cooldown === 0) {
            let alvoPrincipal = null;
            let menorDistancia = this.alcance;

            for (let inimigo of inimigos) {
                let dist = Math.sqrt((inimigo.x + 10 - this.x) ** 2 + (inimigo.y + 10 - this.y) ** 2);
                if (dist < menorDistancia) {
                    menorDistancia = dist;
                    alvoPrincipal = inimigo;
                }
            }

            if (alvoPrincipal) {
                this.explosaoX = alvoPrincipal.x + 10;
                this.explosaoY = alvoPrincipal.y + 10;
                let raioImpacto = this.nivel >= 7 ? 120 : (this.nivel >= 5 ? 90 : 60);
                this.exibirExplosao = true;
                this.raioExplosaoAnimacao = 0;

                for (let i = inimigos.length - 1; i >= 0; i--) {
                    let inimigo = inimigos[i];
                    let dist = Math.sqrt((inimigo.x + 10 - this.explosaoX) ** 2 + (inimigo.y + 10 - this.explosaoY) ** 2);

                    if (dist < raioImpacto) {
                        let danoAplicado = this.dano;
                        
                        // Modificador do caminho Explosivo
                        if (this.caminhoEvolucao === 'explosivo') danoAplicado *= 1.4;

                        inimigo.vida -= danoAplicado;

                        // Mecânica do caminho Prensa: Stun
                        if (this.caminhoEvolucao === 'prensa' && this.nivel >= 7) {
                            inimigo.velocidade = 0; 
                        }

                        // Mecânica do caminho Rejeitado: Deixa vulnerável marcando uma propriedade
                        if (this.caminhoEvolucao === 'rejeitado') {
                            inimigo.vulneravel = true; // Multiplica dano tomado no main loop
                        }
                    }
                }
                this.cooldown = this.cadencia;
            }
        }
    }

    desenhar() {
        this.desenharAlcance();

        if (this.exibirExplosao) {
            ctx.beginPath();
            ctx.arc(this.explosaoX, this.explosaoY, this.raioExplosaoAnimacao, 0, Math.PI * 2);
            if (this.caminhoEvolucao === 'prensa') ctx.fillStyle = "rgba(123, 31, 162, 0.25)";
            else if (this.caminhoEvolucao === 'rejeitado') ctx.fillStyle = "rgba(255, 23, 68, 0.25)";
            else ctx.fillStyle = "rgba(255, 152, 0, 0.25)";
            ctx.fill();
        }

        ctx.beginPath();
        ctx.arc(this.x, this.y, this.raio, 0, Math.PI * 2);

        if (this.caminhoEvolucao === 'prensa') ctx.fillStyle = "#4a148c";
        else if (this.caminhoEvolucao === 'rejeitado') ctx.fillStyle = "#b71c1c";
        else if (this.caminhoEvolucao === 'explosivo') ctx.fillStyle = "#ef6c00";
        else ctx.fillStyle = "#e53935";
        ctx.fill();

        ctx.strokeStyle = this.desacelerada ? "#9933ff" : (this.nivel >= 5 ? "#ffd700" : "#ffcdd2");
        ctx.lineWidth = (this.desacelerada || this.nivel >= 5) ? 3 : 1;
        ctx.stroke();

        ctx.fillStyle = "#424242";
        ctx.fillRect(this.x - 6, this.y - 15, 12, 6);
        this.desenharTextoNivel();
    }
}
