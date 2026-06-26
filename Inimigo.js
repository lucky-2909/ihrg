class Inimigo {
    constructor(vidaMax) {
        this.x = caminho[0].x;
        this.y = caminho[0].y - 10;
        this.vidaMax = vidaMax;
        this.vida = vidaMax;
        this.velocidadeBase = 2;
        this.velocidade = 2;
        this.pontoAlvo = 1;
        this.recompensa = 15;
        this.lento = false;
        this.tipo = 'comum';
        this.sangramentoFrames = 0;
        this.cooldownCura = 0; 
    }

    atualizar() {
        if (this.sangramentoFrames > 0) {
            this.sangramentoFrames--;
            this.vida -= 0.2;
            if (this.vida <= 0) return false;
        }

        if (this.velocidade === 0) {
            this.velocidade = this.velocidadeBase;
            return this.vida > 0;
        }

        this.lento = false;
        this.velocidade = this.velocidadeBase;

        // Apenas o blindado ignora as poças de tinta azuis da caneta
        if (this.tipo !== 'blindado') {
            for (let poca of pocosTinta) {
                let dx = (this.x + 10) - poca.x;
                let dy = (this.y + 10) - poca.y;
                if (Math.sqrt(dx * dx + dy * dy) < poca.raio) {
                    this.lento = true;
                    break;
                }
            }
            if (this.lento) this.velocidade = this.velocidadeBase * 0.5;
        }

        // Habilidade ativa do Curandeiro (Antigo RH)
        if (this.tipo === 'curandeiro') {
            if (this.cooldownCura > 0) this.cooldownCura--;
            if (this.cooldownCura === 0) {
                inimigos.forEach(outro => {
                    let dist = Math.sqrt((outro.x - this.x)**2 + (outro.y - this.y)**2);
                    if (dist < 80 && outro !== this && outro.vida < outro.vidaMax) {
                        outro.vida = Math.min(outro.vidaMax, outro.vida + 15);
                    }
                });
                this.cooldownCura = 90; // A cada 1.5 segundos
            }
        }

        let alvo = caminho[this.pontoAlvo];
        let dx = alvo.x - (this.x + 10);
        let dy = alvo.y - (this.y + 10);
        let distancia = Math.sqrt(dx * dx + dy * dy);

        if (distancia < this.velocidade) {
            this.pontoAlvo++;
            if (this.pontoAlvo >= caminho.length) {
                vida--;
                document.getElementById("vida").innerText = vida;
                return false;
            }
        } else if (this.velocidade > 0) {
            this.x += (dx / distancia) * this.velocidade;
            this.y += (dy / distancia) * this.velocidade;
        }

        return this.vida > 0;
    }

    desenhar() {
        ctx.fillStyle = this.lento ? "#3399ff" : "#ff3333";
        ctx.fillRect(this.x, this.y, 20, 20);
        this.desenharBarraVida();
    }

    desenharBarraVida() {
        ctx.fillStyle = "#555";
        ctx.fillRect(this.x, this.y - 8, 20, 4);
        ctx.fillStyle = "#00ff00";
        let larguraVida = Math.max(0, (this.vida / this.vidaMax) * 20);
        ctx.fillRect(this.x, this.y - 8, larguraVida, 4);
    }
}

// INIMIGO ROXO (Aura que atrasa as torres)
class InimigoDebuff extends Inimigo {
    constructor(vidaMax) {
        super(vidaMax);
        this.velocidadeBase = 1.3;
        this.velocidade = 1.3;
        this.recompensa = 25;
        this.raioDebuff = 100;
        this.tipo = 'debuff';
    }

    desenhar() {
        ctx.beginPath();
        ctx.arc(this.x + 10, this.y + 10, this.raioDebuff, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(153, 51, 255, 0.05)";
        ctx.fill();

        ctx.fillStyle = this.lento ? "#6600cc" : "#9933ff";
        ctx.fillRect(this.x, this.y, 20, 20);
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 1;
        ctx.strokeRect(this.x, this.y, 20, 20);
        this.desenharBarraVida();
    }
}

// INIMIGO VELOZ (Laranja)
class InimigoVeloz extends Inimigo {
    constructor(vidaMax) {
        super(vidaMax * 0.6);
        this.velocidadeBase = 3.5;
        this.velocidade = 3.5;
        this.recompensa = 20;
        this.tipo = 'veloz';
    }

    desenhar() {
        ctx.fillStyle = this.lento ? "#3399ff" : "#ff9800";
        ctx.fillRect(this.x, this.y, 18, 18);
        this.desenharBarraVida();
    }
}

// INIMIGO BLINDADO (Cinza)
class InimigoBlindado extends Inimigo {
    constructor(vidaMax) {
        super(vidaMax * 2.2);
        this.velocidadeBase = 1.0;
        this.velocidade = 1.0;
        this.recompensa = 35;
        this.tipo = 'blindado';
    }

    desenhar() {
        ctx.fillStyle = "#757575";
        ctx.fillRect(this.x - 2, this.y - 2, 24, 24);
        ctx.strokeStyle = "#37474f";
        ctx.lineWidth = 2;
        ctx.strokeRect(this.x - 2, this.y - 2, 24, 24);
        this.desenharBarraVida();
    }
}

// INIMIGO CURANDEIRO (Verde Claro)
class InimigoCurandeiro extends Inimigo {
    constructor(vidaMax) {
        super(vidaMax * 1.3);
        this.velocidadeBase = 1.5;
        this.velocidade = 1.5;
        this.recompensa = 30;
        this.tipo = 'curandeiro';
    }

    desenhar() {
        ctx.beginPath();
        ctx.arc(this.x + 10, this.y + 10, 80, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(0, 230, 118, 0.2)";
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.fillStyle = this.lento ? "#3399ff" : "#00e676";
        ctx.fillRect(this.x, this.y, 20, 20);
        
        ctx.fillStyle = "#fff";
        ctx.fillRect(this.x + 8, this.y + 4, 4, 12);
        ctx.fillRect(this.x + 4, this.y + 8, 12, 4);
        
        this.desenharBarraVida();
    }
}
