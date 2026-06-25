const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Variáveis do Estado do Jogo
let vida = 20;
let moedas = 150;
let onda = 1;
let gameOver = false;
let torreSelecionada = 'padrao'; // 'padrao' ou 'caneta'

// Configuração dos Botões de Seleção
const btnPadrao = document.getElementById('btn-padrao');
const btnCaneta = document.getElementById('btn-caneta');

btnPadrao.addEventListener('click', () => mudarTorre('padrao'));
btnCaneta.addEventListener('click', () => mudarTorre('caneta'));

function mudarTorre(tipo) {
    torreSelecionada = tipo;
    btnPadrao.classList.toggle('ativo', tipo === 'padrao');
    btnCaneta.classList.toggle('ativo', tipo === 'caneta');
}

// Configuração do Caminho dos Inimigos
const caminho = [
    {x: 0, y: 300},
    {x: 200, y: 300},
    {x: 200, y: 100},
    {x: 500, y: 100},
    {x: 500, y: 500},
    {x: 700, y: 500},
    {x: 700, y: 300},
    {x: 800, y: 300}
];

// Listas de Entidades do Jogo
let torres = [];
let inimigos = [];
let projeteis = [];
let pocosTinta = [];

// Temporizadores de Spawn
let contadorSpawn = 0;
let inimigosParaSpawnar = 5;
let spawnIntervalo = 60;

// Classe da Poça de Tinta Grudenta
class PocaTinta {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.raio = 35;
        this.duracao = 180; // 3 segundos a 60fps
    }

    atualizar() {
        this.duracao--;
        return this.duracao > 0;
    }

    desenhar() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.raio, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(0, 102, 204, 0.4)";
        ctx.fill();
    }
}

// Classe do Inimigo
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
    }

    atualizar() {
        this.lento = false;
        for (let poca of pocosTinta) {
            let dx = (this.x + 10) - poca.x;
            let dy = (this.y + 10) - poca.y;
            if (Math.sqrt(dx * dx + dy * dy) < poca.raio) {
                this.lento = true;
                break;
            }
        }

        this.velocidade = this.lento ? this.velocidadeBase * 0.5 : this.velocidadeBase;

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
        } else {
            this.x += (dx / distancia) * this.velocidade;
            this.y += (dy / distancia) * this.velocidade;
        }
        return true;
    }

    desenhar() {
        ctx.fillStyle = this.lento ? "#3399ff" : "#ff3333";
        ctx.fillRect(this.x, this.y, 20, 20);
        
        ctx.fillStyle = "#555";
        ctx.fillRect(this.x, this.y - 8, 20, 4);
        ctx.fillStyle = "#00ff00";
        let larguraVida = (this.vida / this.vidaMax) * 20;
        ctx.fillRect(this.x, this.y - 8, larguraVida, 4);
    }
}

// Classe da Torre com Sistema de Upgrades
class Torre {
    constructor(x, y, tipo) {
        this.x = x;
        this.y = y;
        this.tipo = tipo;
        this.raio = 20;
        this.nivel = 1; 
        
        this.alcanceBase = tipo === 'caneta' ? 150 : 120;
        this.cadenciaBase = tipo === 'caneta' ? 60 : 30;
        this.cooldown = 0;
    }

    get alcance() {
        return this.alcanceBase * (1 + (this.nivel - 1) * 0.2);
    }

    get cadencia() {
        return Math.max(10, Math.round(this.cadenciaBase * (1 - (this.nivel - 1) * 0.1)));
    }

    atualizar() {
        if (this.cooldown > 0) this.cooldown--;

        if (this.cooldown === 0) {
            let alvo = null;
            let menorDistancia = this.alcance;

            for (let inimigo of inimigos) {
                let dx = inimigo.x + 10 - this.x;
                let dy = inimigo.y + 10 - this.y;
                let dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < menorDistancia) {
                    if (this.tipo === 'caneta' && inimigo.lento) continue;
                    menorDistancia = dist;
                    alvo = inimigo;
                }
            }

            if (!alvo && this.tipo === 'caneta') {
                for (let inimigo of inimigos) {
                    let dx = inimigo.x + 10 - this.x;
                    let dy = inimigo.y + 10 - this.y;
                    let dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < this.alcance) {
                        alvo = inimigo;
                        break;
                    }
                }
            }

            if (alvo) {
                projeteis.push(new Projetil(this.x, this.y, alvo, this.tipo, this.nivel));
                this.cooldown = this.cadencia;
            }
        }
    }

    desenhar() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.alcance, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255, 255, 255, 0.02)";
        ctx.fill();

        ctx.beginPath();
        ctx.arc(this.x, this.y, this.raio, 0, Math.PI * 2);
        
        if (this.tipo === 'caneta') {
            ctx.fillStyle = "#0044ff";
            ctx.fill();
            ctx.strokeStyle = "#fff";
            ctx.stroke();
            ctx.fillStyle = "#fff";
            ctx.fillRect(this.x - 4, this.y - 15, 8, 12);
        } else {
            ctx.fillStyle = "#3399ff";
            ctx.fill();
            ctx.strokeStyle = "#fff";
            ctx.stroke();
        }

        ctx.fillStyle = "#000000ff";
        ctx.font = "bold 12px Arial";
        ctx.textAlign = "center";
        ctx.fillText("Lvl " + this.nivel, this.x, this.y + 5);
    }
}

// Classe do Projétil
class Projetil {
    constructor(x, y, alvo, tipo, nivelTorre) {
        this.x = x;
        this.y = y;
        this.alvo = alvo;
        this.tipo = tipo;
        this.velocidade = 8;
        
        let danoBase = tipo === 'caneta' ? 8 : 15;
        this.dano = danoBase * (1 + (nivelTorre - 1) * 0.3);
    }

    atualizar() {
        if (!inimigos.includes(this.alvo)) return false;

        let dx = (this.alvo.x + 10) - this.x;
        let dy = (this.alvo.y + 10) - this.y;
        let dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < this.velocidade) {
            this.alvo.vida -= this.dano;

            if (this.tipo === 'caneta') {
                pocosTinta.push(new PocaTinta(this.alvo.x + 10, this.alvo.y + 10));
            }

            if (this.alvo.vida <= 0) {
                let index = inimigos.indexOf(this.alvo);
                if (index > -1) {
                    moedas += this.alvo.recompensa;
                    document.getElementById("moedas").innerText = moedas;
                    inimigos.splice(index, 1);
                }
            }
            return false;
        }

        this.x += (dx / dist) * this.velocidade;
        this.y += (dy / dist) * this.velocidade;
        return true;
    }

    desenhar() {
        ctx.beginPath();
        if (this.tipo === 'caneta') {
            ctx.rect(this.x - 2, this.y - 6, 4, 12);
            ctx.fillStyle = "#00bfff";
        } else {
            ctx.arc(this.x, this.y, 4, 0, Math.PI * 2);
            ctx.fillStyle = "#ffff00";
        }
        ctx.fill();
    }
}

// Desenho do Cenário
function desenharCenario() {
    ctx.fillStyle = "#2e7d32";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = "#8d6e63";
    ctx.lineWidth = 40;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(caminho[0].x, caminho[0].y);
    for (let i = 1; i < caminho.length; i++) {
        ctx.lineTo(caminho[i].x, caminho[i].y);
    }
    ctx.stroke();
}

// Evento de Clique: Gerencia Construção, Upgrades e Colisões
canvas.addEventListener("click", (evento) => {
    if (gameOver) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = evento.clientX - rect.left;
    const mouseY = evento.clientY - rect.top;

    // 1. Tenta fazer UPGRADE se clicou em uma torre existente
    for (let torre of torres) {
        let dx = mouseX - torre.x;
        let dy = mouseY - torre.y;
        let distacaoCliqueTorre = Math.sqrt(dx * dx + dy * dy);

        if (distacaoCliqueTorre <= torre.raio) {
            let custoUpgrade = torre.nivel * 40; 
            if (moedas >= custoUpgrade) {
                moedas -= custoUpgrade;
                torre.nivel += 1;
                document.getElementById("moedas").innerText = moedas;
            }
            return; 
        }
    }

    // 2. Tenta CONSTRUIR se clicou em espaço vazio
    let custoConstrucao = torreSelecionada === 'caneta' ? 75 : 50;

    if (moedas >= custoConstrucao) {
        let colisaoDetectada = false;
        const raioTorre = 20;

        // Checar colisão com outras torres
        for (let outraTorre of torres) {
            let dx = mouseX - outraTorre.x;
            let dy = mouseY - outraTorre.y;
            let distanciaEntreTorres = Math.sqrt(dx * dx + dy * dy);
            if (distanciaEntreTorres < (raioTorre * 2)) {
                colisaoDetectada = true;
                break;
            }
        }

        // Checar colisão com o caminho dos inimigos
        if (!colisaoDetectada) {
            for (let i = 0; i < caminho.length - 1; i++) {
                let x1 = caminho[i].x, y1 = caminho[i].y;
                let x2 = caminho[i+1].x, y2 = caminho[i+1].y;
                
                let a = mouseX - x1, b = mouseY - y1, c = x2 - x1, d = y2 - y1;
                let dot = a * c + b * d;
                let len_sq = c * c + d * d;
                let param = len_sq !== 0 ? dot / len_sq : -1;
                let xx, yy;

                if (param < 0) { 
                    xx = x1; 
                    yy = y1; 
                } else if (param > 1) { 
                    xx = x2; 
                    yy = y2; 
                } else { 
                    xx = x1 + param * c; 
                    yy = y1 + param * d; 
                }

                let distAoCaminho = Math.sqrt((mouseX - xx)**2 + (mouseY - yy)**2);
                
                if (distAoCaminho < 38) {
                    colisaoDetectada = true;
                    break;
                }
            }
        }

        // Constrói se o local for válido
        if (!colisaoDetectada) {
            torres.push(new Torre(mouseX, mouseY, torreSelecionada));
            moedas -= custoConstrucao;
            document.getElementById("moedas").innerText = moedas;
        }
    }
});

// Loop Principal do Jogo
function loop() {
    if (vida <= 0) {
        gameOver = true;
        ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "#ff3333";
        ctx.font = "bold 50px Arial";
        ctx.textAlign = "center";
        ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2);
        return;
    }

    desenharCenario();

    // Atualizar Poças de Tinta
    for (let i = pocosTinta.length - 1; i >= 0; i--) {
        let ativa = pocosTinta[i].atualizar();
        if (!ativa) {
            pocosTinta.splice(i, 1);
        } else {
            pocosTinta[i].desenhar();
        }
    }

    // Controle de Ondas (Waves)
    if (inimigosParaSpawnar > 0) {
        contadorSpawn++;
        if (contadorSpawn >= spawnIntervalo) {
            inimigos.push(new Inimigo(30 + onda * 12));
            inimigosParaSpawnar--;
            contadorSpawn = 0;
        }
    } else if (inimigos.length === 0) {
        onda++;
        document.getElementById("onda").innerText = onda;
        inimigosParaSpawnar = 5 + onda * 2;
        moedas += 50;
        document.getElementById("moedas").innerText = moedas;
    }

    // Atualizar Torres
    for (let torre of torres) {
        torre.atualizar();
        torre.desenhar();
    }

    // Atualizar Inimigos
    for (let i = inimigos.length - 1; i >= 0; i--) {
        let ativo = inimigos[i].atualizar();
        if (!ativo) {
            inimigos.splice(i, 1);
        } else {
            inimigos[i].desenhar();
        }
    }

    // Atualizar Projéteis
    for (let i = projeteis.length - 1; i >= 0; i--) {
        let ativo = projeteis[i].atualizar();
        if (!ativo) {
            projeteis.splice(i, 1);
        } else {
            projeteis[i].desenhar();
        }
    }

    requestAnimationFrame(loop);
}

// Inicializar o Jogo de forma contínua
loop();
