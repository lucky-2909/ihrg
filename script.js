const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Variáveis do Estado do Jogo
let vida = 20;
let moedas = 150;
let onda = 1;
let gameOver = false;
let torreSelecionada = 'padrao'; // 'padrao', 'caneta' ou 'carimbo'

// Configuração dos Botões de Seleção (Adicionado o botão do Carimbo)
const btnPadrao = document.getElementById('btn-padrao');
const btnCaneta = document.getElementById('btn-caneta');
const btnCarimbo = document.getElementById('btn-carimbo');

btnPadrao.addEventListener('click', () => mudarTorre('padrao'));
btnCaneta.addEventListener('click', () => mudarTorre('caneta'));
if (btnCarimbo) btnCarimbo.addEventListener('click', () => mudarTorre('carimbo'));

function mudarTorre(tipo) {
    torreSelecionada = tipo;
    btnPadrao.classList.toggle('ativo', tipo === 'padrao');
    btnCaneta.classList.toggle('ativo', tipo === 'caneta');
    if (btnCarimbo) btnCarimbo.classList.toggle('ativo', tipo === 'carimbo');
}

// Configuração do Caminho dos Inimigos
const caminho = [
    { x: 0, y: 300 },
    { x: 200, y: 300 },
    { x: 200, y: 100 },
    { x: 500, y: 100 },
    { x: 500, y: 500 },
    { x: 700, y: 500 },
    { x: 700, y: 300 },
    { x: 800, y: 300 }
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

// Classe Base do Inimigo Padrão (Vermelho)
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
        this.desenharBarraVida();
    }

    desenharBarraVida() {
        ctx.fillStyle = "#555";
        ctx.fillRect(this.x, this.y - 8, 20, 4);
        ctx.fillStyle = "#00ff00";
        let larguraVida = (this.vida / this.vidaMax) * 20;
        ctx.fillRect(this.x, this.y - 8, larguraVida, 4);
    }
}

// NOVO INIMIGO: Quadrado Roxo que desacelera o carregamento das torres próximas
class InimigoDebuff extends Inimigo {
    constructor(vidaMax) {
        super(vidaMax);
        this.velocidadeBase = 1.3; // Um pouco mais lento por carregar peso técnico
        this.velocidade = 1.3;
        this.recompensa = 25; // Recompensa maior por ser perigoso
        this.raioDebuff = 100; // Distância da aura de lentidão de ataque
        this.tipo = 'debuff';
    }

    desenhar() {
        // Desenha a aura visual do efeito de desaceleração ao redor dele
        ctx.beginPath();
        ctx.arc(this.x + 10, this.y + 10, this.raioDebuff, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(153, 51, 255, 0.07)";
        ctx.fill();

        // Corpo quadrado roxo do inimigo
        ctx.fillStyle = this.lento ? "#6600cc" : "#9933ff";
        ctx.fillRect(this.x, this.y, 20, 20);

        // Bordas marcantes para identificação
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 1;
        ctx.strokeRect(this.x, this.y, 20, 20);

        this.desenharBarraVida();
    }
}

// Classe da Torre com Upgrades, Tiro Duplo (Laser Lvl 5) e Caneta Gigante (Caneta Lvl 5)
class Torre {
    constructor(x, y, tipo) {
        this.x = x;
        this.y = y;
        this.tipo = tipo;
        this.raio = 20;
        this.nivel = 1;

        // Configurações base por tipo de torre
        if (tipo === 'caneta') {
            this.alcanceBase = 150;
            this.cadenciaBase = 60;
        } else if (tipo === 'carimbo') {
            this.alcanceBase = 100; // Menor alcance por ser em área massiva
            this.cadenciaBase = 80;  // Ataque mais lento e pesado
        } else {
            this.alcanceBase = 120; // Padrão / Laser
            this.cadenciaBase = 30;
        }

        this.cooldown = 0;
        this.desacelerada = false;

        // Atributos de controle visual e mecânico do Carimbo
        this.raioExplosaoAnimacao = 0;
        this.exibirExplosao = false;
        this.explosaoX = 0;
        this.explosaoY = 0;

        // Contador exclusivo para a habilidade especial da caneta lvl 5+
        this.contadorTirosCaneta = 0;
    }

    get alcance() {
        // Escala o alcance linearmente com base no nível atual (máximo Lvl 7)
        return this.alcanceBase * (1 + (this.nivel - 1) * 0.18);
    }

    get cadencia() {
        // Melhora a velocidade de ataque a cada upgrade
        let cadenciaAtual = Math.max(8, Math.round(this.cadenciaBase * (1 - (this.nivel - 1) * 0.12)));
        return this.desacelerada ? cadenciaAtual * 2 : cadenciaAtual;
    }

    get dano() {
        // Dano base escalável por nível
        if (this.tipo === 'carimbo') return 25 * (1 + (this.nivel - 1) * 0.45);
        if (this.tipo === 'caneta') return 10 * (1 + (this.nivel - 1) * 0.35);
        return 15 * (1 + (this.nivel - 1) * 0.3); // Laser
    }

    atualizar() {
        this.desacelerada = false;
        for (let inimigo of inimigos) {
            if (inimigo.tipo === 'debuff') {
                let dx = (inimigo.x + 10) - this.x;
                let dy = (inimigo.y + 10) - this.y;
                let dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < inimigo.raioDebuff) {
                    this.desacelerada = true;
                    break;
                }
            }
        }

        if (this.cooldown > 0) this.cooldown--;

        // Atualiza a animação de expansão do impacto do Carimbo
        if (this.exibirExplosao) {
            let raioMaximo = this.nivel >= 7 ? 120 : (this.nivel >= 5 ? 90 : 60);
            this.raioExplosaoAnimacao += 5;
            if (this.raioExplosaoAnimacao >= raioMaximo) {
                this.exibirExplosao = false;
                this.raioExplosaoAnimacao = 0;
            }
        }

        if (this.cooldown === 0) {
            // --- LÓGICA DE ATAQUE DA TORRE DE CARIMBO (AoE - Níveis 1 a 7) ---
            if (this.tipo === 'carimbo') {
                let alvoPrincipal = null;
                let menorDistancia = this.alcance;

                for (let inimigo of inimigos) {
                    let dx = inimigo.x + 10 - this.x;
                    let dy = inimigo.y + 10 - this.y;
                    let dist = Math.sqrt(dx * dx + dy * dy);
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
                        let dx = (inimigo.x + 10) - this.explosaoX;
                        let dy = (inimigo.y + 10) - this.explosaoY;
                        let dist = Math.sqrt(dx * dx + dy * dy);

                        if (dist < raioImpacto) {
                            let danoAplicado = this.dano;
                            
                            if (this.nivel === 5 || this.nivel === 6) danoAplicado *= 1.5; 
                            if (this.nivel >= 7) danoAplicado *= 2.0; // Multiplicador massivo no Lvl 7

                            inimigo.vida -= danoAplicado;

                            // EVOLUÇÃO CARIMBO LVL 7: Efeito de Stun (Paralisação)
                            if (this.nivel >= 7) {
                                inimigo.velocidade = 0; 
                            }

                            if (inimigo.vida <= 0) {
                                moedas += inimigo.recompensa;
                                document.getElementById("moedas").innerText = moedas;
                                inimigos.splice(i, 1);
                            }
                        }
                    }
                    this.cooldown = this.cadencia;
                }
                return;
            }

            // --- LÓGICA DE PROJÉTEIS (LASER E CANETA - Níveis 1 a 7) ---
            let alvos = [];
            
            // EVOLUÇÃO LASER LVL 5 a 7: Alvos simultâneos aumentam
            let maxAlvos = 1;
            if (this.tipo === 'padrao') {
                if (this.nivel >= 7) maxAlvos = 3;      // Lvl 7 foca até 3 alvos ao mesmo tempo
                else if (this.nivel >= 5) maxAlvos = 2; // Lvl 5 e 6 focam 2 alvos
            }

            let inimigosNoAlcance = [];
            for (let inimigo of inimigos) {
                let dx = inimigo.x + 10 - this.x;
                let dy = inimigo.y + 10 - this.y;
                let dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < this.alcance) {
                    if (this.tipo === 'caneta' && inimigo.lento && this.nivel < 5) continue;
                    inimigosNoAlcance.push({ inimigo: inimigo, dist: dist });
                }
            }

            inimigosNoAlcance.sort((a, b) => a.dist - b.dist);

            for (let i = 0; i < Math.min(maxAlvos, inimigosNoAlcance.length); i++) {
                alvos.push(inimigosNoAlcance[i].inimigo);
            }

            if (alvos.length === 0 && this.tipo === 'caneta') {
                for (let inimigo of inimigos) {
                    let dx = inimigo.x + 10 - this.x;
                    let dy = inimigo.y + 10 - this.y;
                    let dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < this.alcance) {
                        alvos.push(inimigo);
                        break;
                    }
                }
            }

            if (alvos.length > 0) {
                if (this.tipo === 'caneta' && this.nivel >= 5) {
                    this.contadorTirosCaneta++;
                    
                    // EVOLUÇÃO CANETA LVL 7: Dispara o especial mais rápido (a cada 4 tiros em vez de 5)
                    let tirosParaEspecial = this.nivel >= 7 ? 4 : 5;

                    if (this.contadorTirosCaneta >= tirosParaEspecial) {
                        projeteis.push(new Projetil(this.x, this.y, alvos[0], 'caneta_gigante', this.nivel));
                        this.contadorTirosCaneta = 0;
                    } else {
                        projeteis.push(new Projetil(this.x, this.y, alvos[0], this.tipo, this.nivel));
                    }
                } else {
                    alvos.forEach((alvo, index) => {
                        projeteis.push(new Projetil(this.x, this.y, alvo, this.tipo, this.nivel, index));
                    });
                }
                this.cooldown = this.cadencia;
            }
        }
    }

    desenhar() {
        // Alcance visual
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.alcance, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255, 255, 255, 0.02)";
        ctx.fill();

        // Explosão do Carimbo
        if (this.exibirExplosao && this.tipo === 'carimbo') {
            ctx.beginPath();
            ctx.arc(this.explosaoX, this.explosaoY, this.raioExplosaoAnimacao, 0, Math.PI * 2);
            if (this.nivel >= 7) {
                ctx.fillStyle = "rgba(123, 31, 162, 0.3)"; // Onda roxa cósmica no Lvl 7
                ctx.strokeStyle = "rgba(123, 31, 162, 0.8)";
            } else {
                ctx.fillStyle = this.nivel >= 5 ? "rgba(255, 0, 0, 0.25)" : "rgba(139, 195, 74, 0.3)";
                ctx.strokeStyle = this.nivel >= 5 ? "rgba(255, 0, 0, 0.6)" : "rgba(139, 195, 74, 0.7)";
            }
            ctx.lineWidth = 2;
            ctx.fill();
            ctx.stroke();
        }

        // Base física da torre
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.raio, 0, Math.PI * 2);

        if (this.tipo === 'caneta') {
            if (this.nivel >= 7) ctx.fillStyle = "#1a237e";      // Azul Escuro Presidencial
            else if (this.nivel >= 5) ctx.fillStyle = "#0011aa"; // Azul Royal
            else ctx.fillStyle = "#0044ff";
            ctx.fill();

            ctx.strokeStyle = this.desacelerada ? "#9933ff" : (this.nivel >= 7 ? "#00e5ff" : (this.nivel >= 5 ? "#ffd700" : "#fff"));
            ctx.lineWidth = (this.desacelerada || this.nivel >= 5) ? 3 : 1;
            ctx.stroke();

            ctx.fillStyle = this.nivel >= 7 ? "#00e5ff" : "#fff";
            ctx.fillRect(this.x - 4, this.y - 16, 8, 12);

        } else if (this.tipo === 'carimbo') {
            if (this.nivel >= 7) ctx.fillStyle = "#4a148c";      // Roxo Prensa Industrial
            else if (this.nivel >= 5) ctx.fillStyle = "#b71c1c"; // Vermelho Escuro
            else ctx.fillStyle = "#e53935";
            ctx.fill();

            ctx.strokeStyle = this.desacelerada ? "#9933ff" : (this.nivel >= 7 ? "#00ff88" : (this.nivel >= 5 ? "#ffd700" : "#ffcdd2"));
            ctx.lineWidth = (this.desacelerada || this.nivel >= 5) ? 3 : 1;
            ctx.stroke();

            ctx.fillStyle = this.nivel >= 7 ? "#00ff88" : "#424242";
            ctx.fillRect(this.x - 6, this.y - 15, 12, 6);

        } else { // Laser / Padrão
            if (this.nivel >= 7) {
                ctx.fillStyle = "#00e676"; // Verde Plasma Radiante
            } else if (this.nivel >= 5) {
                ctx.fillStyle = "#ff9900"; // Laranja Laser
            } else {
                ctx.fillStyle = "#3399ff"; // Azul Base
            }
            ctx.fill();

            ctx.strokeStyle = this.desacelerada ? "#9933ff" : (this.nivel >= 7 ? "#b9f6ca" : (this.nivel >= 5 ? "#ffff00" : "#fff"));
            ctx.lineWidth = (this.desacelerada || this.nivel >= 5) ? 3 : 1;
            ctx.stroke();
        }

        // Texto do Nível adaptado para exibir "MAX" no nível 7
        ctx.fillStyle = this.nivel >= 7 ? "#ffffff" : "#000000";
        ctx.font = "bold 11px Arial";
        ctx.textAlign = "center";
        let textoNivel = this.nivel >= 7 ? "MAX" : "Lvl " + this.nivel;
        ctx.fillText(textoNivel, this.x, this.y + 4);
    }

}

// Classe do Projétil adaptada para a Caneta Gigante com tempo de vida de 5 segundos
class Projetil {
    constructor(x, y, alvo, tipo, nivelTorre, indexTiro = 0) {
        this.x = x;
        this.y = y;
        this.alvo = alvo;
        this.tipo = tipo;
        this.indexTiro = indexTiro;
        this.nivelTorre = nivelTorre;

        let danoBase = (tipo === 'caneta' || tipo === 'caneta_gigante') ? 8 : 15;
        this.dano = danoBase * (1 + (nivelTorre - 1) * 0.3);

        if (tipo === 'caneta_gigante') {
            this.velocidade = 4; // Move-se um pouco mais devagar para cobrir a área deixando tinta
            this.duracao = 300;  // 5 segundos exatos ativos em campo rodando a 60 FPS

            // Salva a direção inicial para continuar avançando em linha reta mesmo se o alvo morrer
            let dx = (alvo.x + 10) - x;
            let dy = (alvo.y + 10) - y;
            let dist = Math.sqrt(dx * dx + dy * dy);
            this.vx = (dx / dist) * this.velocidade;
            this.vy = (dy / dist) * this.velocidade;

            // Lista para registrar quais inimigos já foram atingidos (evita dar dano em todo frame)
            this.inimigosAtingidos = new Set();
        } else {
            this.velocidade = 8;
        }
    }

    atualizar() {
        // Lógica de Atualização da Caneta Gigante Especial (Baseada em tempo e perfuração)
        if (this.tipo === 'caneta_gigante') {
            this.duracao--;
            if (this.duracao <= 0) return false;

            // Move-se continuamente na trajetória calculada
            this.x += this.vx;
            this.y += this.vy;

            // Deixa um rastro contínuo de poças grudentas a cada 10 frames de deslocamento
            if (this.duracao % 10 === 0) {
                pocosTinta.push(new PocaTinta(this.x, this.y));
            }

            // Varre colisões com múltiplos inimigos (Atravessa alvos causando dano único)
            for (let inimigo of inimigos) {
                if (this.inimigosAtingidos.has(inimigo)) continue;

                let dx = (inimigo.x + 10) - this.x;
                let dy = (inimigo.y + 10) - this.y;
                let dist = Math.sqrt(dx * dx + dy * dy);

                // Colisão baseada em área maior por ser um projétil gigante
                if (dist < 25) {
                    inimigo.vida -= this.dano * 1.5; // Dano extra por impacto maciço
                    this.inimigosAtingidos.add(inimigo);

                    if (inimigo.vida <= 0) {
                        let index = inimigos.indexOf(inimigo);
                        if (index > -1) {
                            moedas += inimigo.recompensa;
                            document.getElementById("moedas").innerText = moedas;
                            inimigos.splice(index, 1);
                        }
                    }
                }
            }

            // Apaga o projétil se ele sair totalmente das bordas visíveis do canvas
            if (this.x < -50 || this.x > canvas.width + 50 || this.y < -50 || this.y > canvas.height + 50) {
                return false;
            }
            return true;
        }

        // Lógica Padrão de Projéteis Guiados de Alvo Único
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
        ctx.save();
        ctx.beginPath();

        if (this.tipo === 'caneta_gigante') {
            // Desenho estilizado de uma Caneta enorme cruzando a tela
            ctx.translate(this.x, this.y);
            // Rotaciona o desenho na direção do movimento vetorial
            let angulo = Math.atan2(this.vy, this.vx);
            ctx.rotate(angulo);

            // Corpo da caneta azul gigante
            ctx.fillStyle = "#0022ff";
            ctx.fillRect(-25, -6, 40, 12);
            // Tampa/Ponta da caneta
            // Tampa/Ponta da caneta
            ctx.fillStyle = "#001166";
            ctx.fillRect(15, -6, 10, 12);

            // Brilho metálico da ponta
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(25, -3, 4, 6);
        } else if (this.tipo === 'caneta') {
            ctx.rect(this.x - 2, this.y - 6, 4, 12);
            ctx.fillStyle = "#00bfff";
            ctx.fill();
        } else {
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
            // Trava o upgrade se a torre já atingiu o patamar MAX (Lvl 7)
            if (torre.nivel >= 7) return; 

            let custoUpgrade = torre.nivel * 40;
            if (moedas >= custoUpgrade) {
                moedas -= custoUpgrade;
                torre.nivel += 1;
                document.getElementById("moedas").innerText = moedas;
            }
            return; 
        }
    }

    // 2. Tenta CONSTRUIR se clicou em espaço vazio (Preços: Laser 50, Caneta 75, Carimbo 120)
    let custoConstrucao = 50;
    if (torreSelecionada === 'caneta') custoConstrucao = 75;
    else if (torreSelecionada === 'carimbo') custoConstrucao = 120;

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

    // Controle de Ondas (Waves) e Sorteio de Tipo de Inimigo
    if (inimigosParaSpawnar > 0) {
        contadorSpawn++;
        if (contadorSpawn >= spawnIntervalo) {
            let vidaCalculada = 30 + onda * 12;
            if (onda >= 2 && Math.random() < 0.30) {
                inimigos.push(new InimigoDebuff(vidaCalculada * 1.2));
            } else {
                inimigos.push(new Inimigo(vidaCalculada));
            }
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
