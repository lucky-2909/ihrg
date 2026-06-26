class Projetil {
    constructor(x, y, alvo, tipo, nivelTorre, indexTiro = 0) {
        this.x = x;
        this.y = y;
        this.alvo = alvo;
        this.tipo = tipo;
        this.indexTiro = indexTiro;
        this.nivelTorre = nivelTorre;
        this.ativo = true;

        // Configuração de Dano Base por Tipo
        let danoBase = 15;
        if (tipo === 'caneta') danoBase = 8;
        if (tipo === 'bola_pingpong' || tipo === 'bola_smash' || tipo === 'bola_spin') danoBase = 12;

        this.dano = danoBase * (1 + (nivelTorre - 1) * 0.3);

        // Ajustes e mecânicas específicas para o Especial da Caneta Gigante
        if (tipo === 'caneta_gigante') {
            this.velocidade = 4;
            this.duracao = 300; // 5 segundos ativos a 60 FPS
            this.dano = 50 * (1 + (nivelTorre - 1) * 0.3);

            // Calcula trajetória fixa em linha reta baseado na posição inicial do alvo
            let dx = (alvo.x + 10) - x;
            let dy = (alvo.y + 10) - y;
            let dist = Math.sqrt(dx * dx + dy * dy);
            this.vx = (dx / dist) * this.velocidade;
            this.vy = (dy / dist) * this.velocidade;

            this.inimigosAtingidos = new Set(); // Evita dar dano múltiplo no mesmo frame
        } else {
            this.velocidade = 8; // Velocidade padrão dos tiros teleguiados
        }
    }

    atualizar() {
        // --- CASO A: Caneta Gigante Perfurante ---
        if (this.tipo === 'caneta_gigante') {
            this.duracao--;
            if (this.duracao <= 0) return false;

            this.x += this.vx;
            this.y += this.vy;

            if (this.duracao % 10 === 0) {
                pocosTinta.push(new PocaTinta(this.x, this.y));
            }

            for (let inimigo of inimigos) {
                if (this.inimigosAtingidos.has(inimigo)) continue;

                let dx = (inimigo.x + 10) - this.x;
                let dy = (inimigo.y + 10) - this.y;
                let dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < 25) {
                    inimigo.vida -= this.dano * 1.5;
                    this.inimigosAtingidos.add(inimigo);
                }
            }

            if (this.x < -50 || this.x > canvas.width + 50 || this.y < -50 || this.y > canvas.height + 50) {
                return false;
            }
            return true;
        }

        // --- CASO B: Projéteis Guiados Normais ---
        if (!inimigos.includes(this.alvo)) return false;

        let dx = (this.alvo.x + 10) - this.x;
        let dy = (this.alvo.y + 10) - this.y;
        let dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < this.velocidade) {
            let danoFinal = this.dano;

            if (this.tipo === 'bola_smash') {
                if (this.alvo.vida / this.alvo.vidaMax > 0.5) danoFinal *= 2.0;
            } else if (this.tipo === 'bola_spin') {
                this.alvo.velocidadeBase *= 0.5;
                this.alvo.lento = true;
            }

            this.alvo.vida -= danoFinal;

            if (this.tipo === 'caneta') {
                pocosTinta.push(new PocaTinta(this.alvo.x + 10, this.alvo.y + 10));
            }

            return false; // Impactou, deleta o projétil
        }

        this.x += (dx / dist) * this.velocidade;
        this.y += (dy / dist) * this.velocidade;
        return true;
    }

    desenhar() {
        ctx.save();
        ctx.beginPath();

        if (this.tipo === 'caneta_gigante') {
            ctx.translate(this.x, this.y);
            let angulo = Math.atan2(this.vy, this.vx);
            ctx.rotate(angulo);

            ctx.fillStyle = "#0022ff"; // Corpo azul
            ctx.fillRect(-25, -6, 40, 12);
            ctx.fillStyle = "#001166"; // Tampa
            ctx.fillRect(15, -6, 10, 12);
            ctx.fillStyle = "#ffffff"; // Brilho
            ctx.fillRect(25, -3, 4, 6);
        } else if (this.tipo === 'caneta') {
            ctx.rect(this.x - 2, this.y - 6, 4, 12);
            ctx.fillStyle = "#00bfff";
            ctx.fill();
        } else if (this.tipo === 'bola_pingpong' || this.tipo === 'bola_smash' || this.tipo === 'bola_spin') {
            ctx.arc(this.x, this.y, 4, 0, Math.PI * 2);
            if (this.tipo === 'bola_smash') ctx.fillStyle = "#ff1744";
            else if (this.tipo === 'bola_spin') ctx.fillStyle = "#00e5ff";
            else ctx.fillStyle = "#ffffff";
            ctx.fill();
            ctx.strokeStyle = "#000";
            ctx.lineWidth = 0.5;
            ctx.stroke();
        } else if (this.tipo === 'nota_espectral') {
            ctx.fillStyle = "#00ff88"; // Cor verde fantasma brilhante
            // Desenha uma nota musical simples em pixels
            ctx.fillRect(this.x - 2, this.y - 6, 4, 10);
            ctx.fillRect(this.x - 2, this.y - 6, 8, 3);
            ctx.beginPath();
            ctx.arc(this.x - 3, this.y + 4, 3, 0, Math.PI * 2);
            ctx.fill();
        } else { // Laser Padrão
            if (this.indexTiro === 1) {
                ctx.arc(this.x + 4, this.y + 4, 3, 0, Math.PI * 2);
                ctx.fillStyle = "#ffcc00";
            } else {
                ctx.arc(this.x, this.y, 4, 0, Math.PI * 2);
                ctx.fillStyle = "#ffff00";
            }
            ctx.fill();
        }
        ctx.restore();
    }

}
