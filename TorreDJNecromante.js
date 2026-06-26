class TorreDJNecromante extends Torre {
    constructor(x, y) {
        super(x, y, 'dj_necromante', 140, 70);
        this.caminhoEvolucao = null; // 'espectral', 'sinistra', 'submundo'
        this.energiaDrop = 0;        
        this.fendaX = 0;
        this.fendaY = 0;
        this.exibirFenda = false;
        this.tempoFenda = 0;
        this.raioPulsoSom = 0;
    }

    get dano() {
        return 12 * (1 + (this.nivel - 1) * 0.4);
    }

    atualizar() {
        this.checarDebuff();

        // Expansão visual do pulso sônico AoE
        this.raioPulsoSom += 3;
        if (this.raioPulsoSom >= this.alcance) {
            this.raioPulsoSom = 0; 
        }

        // Controle da fenda espiritual (Caminho 3 - Submundo)
        if (this.exibirFenda) {
            this.tempoFenda--;
            if (this.tempoFenda <= 0) this.exibirFenda = false;

            for (let inimigo of inimigos) {
                let dx = this.fendaX - (inimigo.x + 10);
                let dy = this.fendaY - (inimigo.y + 10);
                let distfenda = Math.sqrt(dx * dx + dy * dy);

                if (distfenda < 80 && distfenda > 5) {
                    inimigo.x += (dx / distfenda) * 1.2;
                    inimigo.y += (dy / distfenda) * 1.2;
                }
            }
        }

        // --- MECÂNICA DE ATAQUE FULL AoE ---
        if (this.cooldown === 0) {
            let inimigosNoAlcance = inimigos.filter(i => Math.sqrt((i.x + 10 - this.x) ** 2 + (i.y + 10 - this.y) ** 2) < this.alcance);

            if (inimigosNoAlcance.length > 0) {
                this.raioPulsoSom = 0; // Sincroniza o pulso com a batida

                for (let i = inimigosNoAlcance.length - 1; i >= 0; i--) {
                    let inimigo = inimigosNoAlcance[i];

                    if (this.caminhoEvolucao === 'sinistra') {
                        inimigo.vida -= this.dano;
                        inimigo.sangramentoFrames = 120; 
                        inimigo.amaldiçoado = true; // Corrigido para não usar caracteres especiais escondidos
                    }
                    else if (this.caminhoEvolucao === 'submundo') {
                        this.energiaDrop++;
                        if (this.energiaDrop >= 4) {
                            this.fendaX = inimigo.x + 10;
                            this.fendaY = inimigo.y + 10;
                            this.exibirFenda = true;
                            this.tempoFenda = 120;
                            this.energiaDrop = 0;
                            inimigo.vida -= this.dano * 1.8; 
                        } else {
                            inimigo.vida -= this.dano;
                        }
                    }
                    else {
                        inimigo.vida -= this.dano; // Pulso sônico espiritual padrão
                    }
                }
                this.cooldown = this.cadencia;
            }
        }
    }

    desenhar() {
        this.desenharAlcance();

        // Onda sonora dinâmica se expandindo
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.raioPulsoSom, 0, Math.PI * 2);
        ctx.strokeStyle = this.caminhoEvolucao === 'espectral' ? "rgba(0, 230, 118, 0.2)" : "rgba(153, 51, 255, 0.15)";
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Fenda espiritual do Submundo
        if (this.exibirFenda && this.caminhoEvolucao === 'submundo') {
            ctx.beginPath();
            ctx.arc(this.fendaX, this.fendaY, 60, 0, Math.PI * 2);
            ctx.fillStyle = "rgba(0, 230, 118, 0.12)";
            ctx.fill();
            ctx.strokeStyle = "rgba(0, 191, 165, 0.5)";
            ctx.lineWidth = 2;
            ctx.stroke();
            
            ctx.beginPath();
            ctx.arc(this.fendaX, this.fendaY, 12, 0, Math.PI * 2);
            ctx.fillStyle = "#151515";
            ctx.fill();
        }

        // Base Física do DJ
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.raio, 0, Math.PI * 2);
        
        if (this.caminhoEvolucao === 'espectral') ctx.fillStyle = "#00e676";   
        else if (this.caminhoEvolucao === 'sinistra') ctx.fillStyle = "#311b92";    
        else if (this.caminhoEvolucao === 'submundo') ctx.fillStyle = "#004d40";    
        else ctx.fillStyle = "#263238";                                             
        ctx.fill();

        ctx.strokeStyle = this.desacelerada ? "#9933ff" : (this.nivel >= 5 ? "#00ff88" : "#cfd8dc");
        ctx.lineWidth = (this.desacelerada || this.nivel >= 5) ? 3 : 1;
        ctx.stroke();

        // Pratos de vinil brilhantes da mesa de som
        ctx.fillStyle = this.nivel >= 5 ? "#00ff88" : "#90a4ae";
        ctx.fillRect(this.x - 11, this.y - 4, 5, 5);
        ctx.fillRect(this.x + 6, this.y - 4, 5, 5);

        this.desenharTextoNivel();
    }
}
