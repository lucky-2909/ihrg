// ==========================================
// 1. INICIALIZAÇÃO DO CANVAS E SISTEMA TELA CHEIA RESPONSIVO
// ==========================================
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

function redimensionarTela() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', redimensionarTela);
redimensionarTela(); // Roda na inicialização imediata

// ESTADO GLOBAL DO JOGO AND CONTROLE DE TEMPO
let vida = 20;
let moedas = 150;
let onda = 1;
let gameOver = false;
let jogoPausado = false;
let multiplicadorVelocidade = 1; // 1 = normal, 2 = acelerado
let torreSelecionada = 'padrao';

// ARRAYS GLOBAIS DE ENTIDADES
let torres = [];
let inimigos = [];
let projeteis = [];
let pocosTinta = [];

let contadorSpawn = 0;
let inimigosParaSpawnar = 5;
let spawnIntervalo = 60;

// ESTRUTURA DO CAMINHO (Escala de forma fixa em proporções de tela)
const caminho = [
    { x: 0, y: 350 }, { x: 250, y: 350 }, { x: 250, y: 150 }, { x: 600, y: 150 },
    { x: 600, y: 600 }, { x: 900, y: 600 }, { x: 900, y: 350 }, { x: 2000, y: 350 }
];
// ==========================================
// 2. CONFIGURAÇÃO DOS BOTÕES E CONTROLADORES DE TEMPO
// ==========================================
const botoes = {
    'padrao': document.getElementById('btn-padrao'),
    'caneta': document.getElementById('btn-caneta'),
    'carimbo': document.getElementById('btn-carimbo'),
    'ronin': document.getElementById('btn-ronin'),
    'ping_pong': document.getElementById('btn-pingpong'),
    'dj_necromante': document.getElementById('btn-djnecromante')
};

Object.keys(botoes).forEach(tipo => {
    if (botoes[tipo]) botoes[tipo].addEventListener('click', () => mudarTorre(tipo));
});

function mudarTorre(tipo) {
    torreSelecionada = tipo;
    Object.keys(botoes).forEach(t => {
        if (botoes[t]) botoes[t].classList.toggle('ativo', t === tipo);
    });
}

// CONTROLES DE PAUSA E ACELERAÇÃO
const btnPausa = document.getElementById('btn-pausa');
const btnVelocidade = document.getElementById('btn-velocidade');

if (btnPausa) {
    btnPausa.addEventListener('click', () => {
        jogoPausado = !jogoPausado;
        btnPausa.innerText = jogoPausado ? "▶️ Retomar" : "⏸️ Pausar";
        btnPausa.classList.toggle('ativo', jogoPausado);
    });
}

if (btnVelocidade) {
    btnVelocidade.addEventListener('click', () => {
        if (multiplicadorVelocidade === 1) {
            multiplicadorVelocidade = 2;
            btnVelocidade.innerText = "⏩ Velocidade 2x";
            btnVelocidade.classList.add('ativo');
        } else {
            multiplicadorVelocidade = 1;
            btnVelocidade.innerText = "⏩ Velocidade 1x";
            btnVelocidade.classList.remove('ativo');
        }
    });
}
// ==========================================
// 3. DETECTOR DE CLIQUES DO CANVAS (Parte de Upgrade)
// ==========================================
canvas.addEventListener("click", (evento) => {
    if (gameOver || jogoPausado) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = evento.clientX - rect.left;
    const mouseY = evento.clientY - rect.top;

    // A. Tenta fazer UPGRADE ou EVOLUÇÃO se clicou em uma torre existente
    for (let torre of torres) {
        let dist = Math.sqrt((mouseX - torre.x) ** 2 + (mouseY - torre.y) ** 2);
        if (dist <= torre.raio) {
            if (torre.nivel >= 7) return;

            if (torre.nivel === 4 && !torre.caminhoEvolucao) {
                if (torre.tipo === 'padrao') {
                    let escolha = prompt("Evolua seu Laser:\n1 - Canhão Retransmissor\n2 - Raio Concentrado\n3 - Carga Dupla");
                    if (escolha === "1") torre.caminhoEvolucao = 'chain';
                    else if (escolha === "2") torre.caminhoEvolucao = 'focus';
                    else if (escolha === "3") torre.caminhoEvolucao = 'burst';
                    else return;
                } else if (torre.tipo === 'caneta') {
                    let escolha = prompt("Evolua a Caneta:\n1 - Caneta Presidencial\n2 - Tinteiro Ácido\n3 - Caneta de Ouro");
                    if (escolha === "1") torre.caminhoEvolucao = 'presidencial';
                    else if (escolha === "2") torre.caminhoEvolucao = 'tinteiro';
                    else if (escolha === "3") torre.caminhoEvolucao = 'ouro';
                    else return;
                } else if (torre.tipo === 'carimbo') {
                    let escolha = prompt("Evolua seu Carimbo:\n1 - Prensa Hidráulica\n2 - Carimbo Rejeitado\n3 - Tinta Volátil");
                    if (escolha === "1") torre.caminhoEvolucao = 'prensa';
                    else if (escolha === "2") torre.caminhoEvolucao = 'rejeitado';
                    else if (escolha === "3") torre.caminhoEvolucao = 'explosivo';
                    else return;
                } else if (torre.tipo === 'ronin') {
                    let escolha = prompt("Evolua o Ronin:\n1 - Dança das Lâminas\n2 - Shogun Imovível\n3 - Espírito do Muramasa");
                    if (escolha === "1") torre.caminhoEvolucao = 'velocidade';
                    else if (escolha === "2") torre.caminhoEvolucao = 'bloqueio';
                    else if (escolha === "3") torre.caminhoEvolucao = 'critico';
                    else return;
                } else if (torre.tipo === 'ping_pong') {
                    let escolha = prompt("Evolua a raquete:\n1 - Smash Devastador\n2 - Efeito Spin\n3 - Multi-Bolas");
                    if (escolha === "1") torre.caminhoEvolucao = 'smash';
                    else if (escolha === "2") torre.caminhoEvolucao = 'spin';
                    else if (escolha === "3") torre.caminhoEvolucao = 'multi_bolas';
                    else return;
                } else if (torre.tipo === 'dj_necromante') {
                    let escolha = prompt("Evolua o DJ:\n1 - Techno Espectral\n2 - Batida Sinistra\n3 - Dubstep do Submundo");
                    if (escolha === "1") torre.caminhoEvolucao = 'espectral';
                    else if (escolha === "2") torre.caminhoEvolucao = 'sinistra';
                    else if (escolha === "3") torre.caminhoEvolucao = 'submundo';
                    else return;
                }
                torre.nivel += 1;
                return;
            }

            let custoUpgrade = torre.nivel * 40;
            if (moedas >= custoUpgrade) {
                moedas -= custoUpgrade;
                torre.nivel += 1;
                document.getElementById("moedas").innerText = moedas;
            }
            return;
        }
    }
    // B. Tenta CONSTRUIR se clicou em espaço vazio (Continuação do Clique)
    let custoConstrucao = 50;
    if (torreSelecionada === 'caneta') custoConstrucao = 75;
    else if (torreSelecionada === 'ronin' || torreSelecionada === 'ping_pong') custoConstrucao = 85;
    else if (torreSelecionada === 'dj_necromante') custoConstrucao = 110;
    else if (torreSelecionada === 'carimbo') custoConstrucao = 120;

    if (moedas >= custoConstrucao) {
        let colisao = false;
        for (let t of torres) {
            if (Math.sqrt((mouseX - t.x) ** 2 + (mouseY - t.y) ** 2) < 40) { colisao = true; break; }
        }

        if (!colisao) {
            for (let i = 0; i < caminho.length - 1; i++) {
                let x1 = caminho[i].x, y1 = caminho[i].y, x2 = caminho[i + 1].x, y2 = caminho[i + 1].y;
                let dot = (mouseX - x1) * (x2 - x1) + (mouseY - y1) * (y2 - y1);
                let len_sq = (x2 - x1) ** 2 + (y2 - y1) ** 2;
                let param = len_sq !== 0 ? dot / len_sq : -1;
                let xx = param < 0 ? x1 : (param > 1 ? x2 : x1 + param * (x2 - x1));
                let yy = param < 0 ? y1 : (param > 1 ? y2 : y1 + param * (y2 - y1));
                if (Math.sqrt((mouseX - xx) ** 2 + (mouseY - yy) ** 2) < 38) { colisao = true; break; }
            }
        }

        if (!colisao) {
            if (torreSelecionada === 'padrao') torres.push(new TorreLaser(mouseX, mouseY));
            else if (torreSelecionada === 'caneta') torres.push(new TorreCaneta(mouseX, mouseY));
            else if (torreSelecionada === 'carimbo') torres.push(new TorreCarimbo(mouseX, mouseY));
            else if (torreSelecionada === 'ronin') torres.push(new TorreRonin(mouseX, mouseY));
            else if (torreSelecionada === 'ping_pong') torres.push(new TorrePingPong(mouseX, mouseY));
            else if (torreSelecionada === 'dj_necromante') torres.push(new TorreDJNecromante(mouseX, mouseY));

            moedas -= custoConstrucao;
            document.getElementById("moedas").innerText = moedas;
        }
    }
});

// ==========================================
// RENDERIZAÇÃO DO CENÁRIO E GERENCIADOR DE ONDAS
// ==========================================
function desenharCenario() {
    ctx.fillStyle = "#224d20";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = "#6a4632";
    ctx.lineWidth = 40;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(caminho[0].x, caminho[0].y);
    caminho.forEach(p => ctx.lineTo(p.x, p.y));
    ctx.stroke();
}

// ==========================================
// 4. GERENCIADOR DE ONDAS ATUALIZADO (WAVE CONTROLLER)
// ==========================================
function gerenciarOndas() {
    if (inimigosParaSpawnar > 0) {
        contadorSpawn++;
        if (contadorSpawn >= spawnIntervalo) {
            let vidaCalculada = 30 + onda * 14; // Aumenta o ganho de vida por horda
            let chance = Math.random();

            // SORTEIO DE ACORDO COM A ONDA ATUAL
            if (onda >= 4 && chance < 0.15) {
                // Invocação do Xamã Curandeiro (Verde)
                inimigos.push(new InimigoCurandeiro(vidaCalculada));
            } else if (onda >= 3 && chance < 0.35) {
                // Invocação do Goliath Blindado (Cinza)
                inimigos.push(new InimigoBlindado(vidaCalculada));
            } else if (onda >= 2 && chance < 0.55) {
                // Invocação do Corredor Veloz (Laranja)
                inimigos.push(new InimigoVeloz(vidaCalculada));
            } else if (onda >= 2 && chance < 0.70) {
                // Invocação do Inimigo Roxo (Debuff)
                inimigos.push(new InimigoDebuff(vidaCalculada * 1.2));
            } else {
                // Invocação do Inimigo Padrão (Vermelho)
                inimigos.push(new Inimigo(vidaCalculada));
            }

            inimigosParaSpawnar--;
            contadorSpawn = 0;
        }
    } else if (inimigos.length === 0) {
        onda++;
        document.getElementById("onda").innerText = onda;
        inimigosParaSpawnar = 5 + onda * 3; // Adiciona mais monstros a cada rodada

        // O jogo acelera diminuindo o intervalo de spawn conforme as hordas passam
        spawnIntervalo = Math.max(15, 60 - onda * 2);

        moedas += 50; // Bônus de fim de horda
        document.getElementById("moedas").innerText = moedas;
    }
}

// ==========================================
// 4. LOOP PRINCIPAL DO MOTOR DO JOGO (GAME LOOP)
// ==========================================
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

    if (jogoPausado) {
        desenharCenario();
        pocosTinta.forEach(p => p.desenhar());
        torres.forEach(t => t.desenhar());
        inimigos.forEach(i => i.desenhar());
        projeteis.forEach(p => p.desenhar());
        requestAnimationFrame(loop);
        return;
    }

    // MULTIPLICADOR DE VELOCIDADE: Repete os cálculos de física (1x ou 2x)
    for (let ciclo = 0; ciclo < multiplicadorVelocidade; ciclo++) {
        for (let i = pocosTinta.length - 1; i >= 0; i--) {
            if (!pocosTinta[i].atualizar()) pocosTinta.splice(i, 1);
        }

        gerenciarOndas();
        torres.forEach(t => t.atualizar());

        for (let i = inimigos.length - 1; i >= 0; i--) {
            let inimigoVivo = inimigos[i].atualizar();
            if (inimigos[i].vida <= 0) {
                moedas += inimigos[i].recompensa;
                document.getElementById("moedas").innerText = moedas;
                inimigos.splice(i, 1);
            } else if (!inimigoVivo) {
                inimigos.splice(i, 1);
            }
        }

        for (let i = projeteis.length - 1; i >= 0; i--) {
            if (!projeteis[i].atualizar()) projeteis.splice(i, 1);
        }
    }

    // RENDERIZAÇÃO GRÁFICA (Sempre executa uma única vez por frame)
    desenharCenario();
    pocosTinta.forEach(p => p.desenhar());
    torres.forEach(t => t.desenhar());
    inimigos.forEach(i => i.desenhar());
    projeteis.forEach(p => p.desenhar());

    requestAnimationFrame(loop);
}

// INICIA O JOGO IMEDIATAMENTE
loop();
