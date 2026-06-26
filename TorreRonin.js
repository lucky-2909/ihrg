class TorreRonin extends Torre {
    constructor(x, y) {
        super(x, y, 'ronin', 50, 45);
        this.caminhoEvolucao = null; // 'velocidade', 'bloqueio', 'critico'
        this.anguloEspada = 0;
    }

    atualizar() {
        this.checarDebuff();

        // Especialização: Shogun (Bloqueio)
        if (this.caminhoEvolucao === 'bloqueio') {
            let bloqueados = 0;
            for (let inimigo of inimigos) {
                let dist = Math.sqrt((inimigo.x + 10 - this.x)**2 + (inimigo.y + 10 - this.y)**2);
                if (dist < this.alcance) {
                    inimigo.velocidade = 0;
                    bloqueados++;
                    if (bloqueados >= 3) break;
                }
            }
        }

        if (this.cooldown === 0) {
            let alvos = inimigos.filter(i => Math.sqrt((i.x+10-this.x)**2 + (i.y+10-this.y)**2) < this.alcance);

            if (alvos.length > 0) {
                this.anguloEspada = Math.random() * Math.PI * 2;

                // Especialização: Dança das Lâminas (Ataque em Área)
                if (this.caminhoEvolucao === 'velocidade') {
                    let dano = 15 * (1 + (this.nivel - 1) * 0.3);
                    alvos.forEach(i => i.vida -= dano);
                    this.cooldown = Math.max(5, Math.round(this.cadenciaBase / 3));
                } 
                // Alvo Único (Base, Shogun ou Muramasa)
                else {
                    let inimigo = alvos[0];
                    let danoBase = 25 * (1 + (this.nivel - 1) * 0.4);

                    // Especialização: Muramasa (Crítico por Vida Perdida)
                    if (this.caminhoEvolucao === 'critico') {
                        if (Math.random() < (1 - (inimigo.vida / inimigo.vidaMax))) {
                            danoBase *= 5;
                        }
                        inimigo.sangramentoFrames = 180;
                    }

                    inimigo.vida -= danoBase;
                    if (this.caminhoEvolucao === 'bloqueio') inimigo.velocidadeBase *= 0.4;
                    this.cooldown = this.cadencia;
                }
            }
        }

        // Aplica o sangramento contínuo do Muramasa
        if (this.caminhoEvolucao === 'critico') {
            inimigos.forEach(i => {
                if (i.sangramentoFrames > 0) {
                    i.sangramentoFrames--;
                    i.vida -= 0.3;
                }
            });
        }
    }

    desenhar() {
        this.desenharAlcance();

        // Efeito de Flash do Corte Iaijutsu
        let duration = this.caminhoEvolucao === 'velocidade' ? 5 : 8;
        if (this.cooldown > this.cadencia - duration) {
            ctx.save(); ctx.translate(this.x, this.y); ctx.rotate(this.anguloEspada);
            ctx.beginPath();
            if (this.caminhoEvolucao === 'velocidade') {
                ctx.moveTo(-35, -35); ctx.lineTo(35, 35); ctx.moveTo(35, -35); ctx.lineTo(-35, 35);
                ctx.strokeStyle = "rgba(255, 255, 255, 0.85)"; ctx.lineWidth = 3;
            } else if (this.caminhoEvolucao === 'critico') {
                ctx.moveTo(-40, 0); ctx.lineTo(40, 0);
                ctx.strokeStyle = "rgba(255, 0, 50, 0.9)"; ctx.lineWidth = 4;
            } else {
                ctx.moveTo(-30, 0); ctx.lineTo(30, 0);
                ctx.strokeStyle = "rgba(240, 245, 255, 0.9)"; ctx.lineWidth = 2;
            }
            ctx.stroke(); ctx.restore();
        }

        // Desenho do Corpo
        ctx.beginPath(); ctx.arc(this.x, this.y, this.raio, 0, Math.PI * 2);
        if (this.caminhoEvolucao === 'velocidade') ctx.fillStyle = "#cfd8dc";
        else if (this.caminhoEvolucao === 'bloqueio') ctx.fillStyle = "#3e2723";
        else if (this.caminhoEvolucao === 'critico') ctx.fillStyle = "#212121";
        else ctx.fillStyle = "#8d6e63";
        ctx.fill();

        ctx.strokeStyle = this.desacelerada ? "#9933ff" : (this.nivel >= 5 ? "#ffd700" : "#5d4037");
        ctx.lineWidth = (this.desacelerada || this.nivel >= 5) ? 3 : 1;
        ctx.stroke();

        // Chapéu ou Adereços
        if (!this.caminhoEvolucao) {
            ctx.beginPath(); ctx.arc(this.x, this.y, this.raio + 2, 0, Math.PI * 2);
            ctx.fillStyle = "#f4d03f"; ctx.fill(); ctx.strokeStyle = "#d4ac0d"; ctx.stroke();
        } else if (this.caminhoEvolucao === 'critico') {
            ctx.fillStyle = "#ff1744"; ctx.fillRect(this.x - 5, this.y - 3, 3, 2); ctx.fillRect(this.x + 2, this.y - 3, 3, 2);
        } else if (this.caminhoEvolucao === 'bloqueio') {
            ctx.fillStyle = "#ffd700"; ctx.fillRect(this.x - 4, this.y - 15, 8, 4);
        }

        this.desenharTextoNivel();
    }
}