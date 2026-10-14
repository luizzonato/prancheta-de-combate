"use strict";

// Ficha de treinos (segunda a sexta). `q` é o termo de busca do YouTube; `un` é a unidade do campo de carga.
const YT = "https://www.youtube.com/results?search_query=";
const CARDIO_POS = (id) => ({ id, nome: "Escada ou passadeira inclinada", series: "15–20 min", nota: "Zona 2, ritmo constante.", un: "min", q: "execucao+correta+escada+stairmaster+cardio" });

const FICHA = {
  A: {
    tab: "A", titulo: "Treino A · Empurrar", sub: "Peito, ombros e tríceps",
    cardio: "15 a 20 min pós-treino (Zona 2)",
    fases: [
      { nome: "Peitoral · força e volume", descanso: "2 min", itens: [
        { id: "a1", nome: "Supino articulado (máquina)", series: "4 × 8–10", nota: "Omoplatas cravadas no banco, peitoral expandido e controle total na descida.", un: "kg", padrao: "90", q: "execucao+correta+supino+articulado+maquina" },
        { id: "a2", nome: "Supino inclinado com halteres", series: "4 × 10–12", nota: "Carga pesada em progressão. Foco na porção superior com amplitude máxima.", un: "kg", q: "execucao+correta+supino+inclinado+halteres" },
        { id: "a3", nome: "Voador (peck deck)", series: "4 × 12–15", nota: "Até a falha. Segure 1 s no pico esmagando o centro do peitoral.", un: "kg", q: "execucao+correta+peck+deck+voador" },
      ] },
      { nome: "Ombros · deltoide anterior e lateral", descanso: "90 s", itens: [
        { id: "a4", nome: "Desenvolvimento articulado (ou halteres)", series: "4 × 8–12", nota: "Core travado, descendo até a linha das orelhas sem arquear a lombar.", un: "kg", q: "execucao+correta+desenvolvimento+ombros+halteres" },
        { id: "a5", nome: "Elevação lateral (halteres ou polia)", series: "4 × 12–15", nota: "Carga moderada, movimento guiado pelos cotovelos, sem balançar o tronco.", un: "kg", q: "execucao+correta+elevacao+lateral" },
      ] },
      { nome: "Tríceps · finalização", descanso: "60 s", itens: [
        { id: "a6", nome: "Tríceps pulley (corda)", series: "4 × 12–15", nota: "Cotovelos fixos ao lado do corpo, abrindo a corda no fim da extensão.", un: "kg", q: "execucao+correta+triceps+corda+polia" },
        { id: "a7", nome: "Tríceps testa (barra W ou halteres)", series: "4 × 10–12", nota: "Foco no alongamento máximo da cabeça longa do tríceps.", un: "kg", q: "execucao+correta+triceps+testa+barra+w" },
      ] },
      { nome: "Cardio pós-treino", descanso: "", itens: [CARDIO_POS("a8")] },
    ],
  },
  CORE: {
    tab: "Core", titulo: "Cardio + Core pesado", sub: "Parede abdominal na polia",
    cardio: "40 a 45 min contínuos (Zona 2)",
    fases: [
      { nome: "Oxidação cardiorrespiratória", descanso: "40–45 min", itens: [
        { id: "c1", nome: "Escada (simulador) ou passadeira inclinada", series: "45 min", nota: "Frequência cardíaca constante na Zona 2. Tronco ereto, sem apoiar o peso nos corrimãos.", un: "min", q: "execucao+correta+escada+stairmaster+cardio" },
      ] },
      { nome: "Hipertrofia e sustentação do core", descanso: "60 s", itens: [
        { id: "c2", nome: "Abdominal supra na polia (cable crunch)", series: "4 × 10–12", nota: "Ajoelhado, enrole a coluna levando o esterno em direção ao umbigo.", un: "kg", q: "execucao+correta+abdominal+na+polia+com+corda" },
        { id: "c3", nome: "Abdominal infra (elevação de pernas)", series: "4 × 12–15", nota: "Peso corporal. Eleve a bacia no topo e controle a descida.", un: "kg", q: "execucao+correta+elevacao+de+pernas+paralela+abs" },
        { id: "c4", nome: "Prancha ventral isométrica", series: "3 × 45–60 s", nota: "Contraia forte o abdômen e os glúteos, coluna alinhada.", un: "s", q: "execucao+correta+prancha+ventral" },
      ] },
    ],
  },
  B: {
    tab: "B", titulo: "Treino B · Puxar", sub: "Dorsais, posterior de ombro e bíceps",
    cardio: "15 a 20 min pós-treino (Zona 2)",
    fases: [
      { nome: "Dorsais · largura e espessura", descanso: "2 min", itens: [
        { id: "b1", nome: "Puxada alta articulada ou na polia (pronada)", series: "4 × 8–10", nota: "Inicie deprimindo as omoplatas e puxando os cotovelos para baixo.", un: "kg", q: "execucao+puxada+alta+frente+musculacao" },
        { id: "b2", nome: "Remada curvada (barra ou halteres)", series: "4 × 8–10", nota: "Coluna neutra, puxando em direção ao umbigo.", un: "kg", q: "execucao+remada+curvada+barra" },
        { id: "b3", nome: "Remada baixa na polia (triângulo)", series: "4 × 10–12", nota: "Alongue a dorsal na ida sem curvar a lombar e feche as omoplatas atrás.", un: "kg", q: "execucao+remada+baixa+triangulo" },
      ] },
      { nome: "Posterior de ombro", descanso: "90 s", itens: [
        { id: "b4", nome: "Crucifixo inverso na polia ou banco inclinado", series: "4 × 12–15", nota: "Carga moderada. Foco estrito no deltoide posterior, sem acionar o trapézio.", un: "kg", q: "execucao+crucifixo+inverso+polia" },
      ] },
      { nome: "Bíceps · finalização", descanso: "60 s", itens: [
        { id: "b5", nome: "Rosca direta (barra W ou halteres)", series: "4 × 8–10", nota: "Cotovelos colados ao tronco e descida controlada.", un: "kg", q: "execucao+rosca+direta+barra+w" },
        { id: "b6", nome: "Rosca Bayesian (polia) ou rosca martelo", series: "4 × 10–12", nota: "Tensão contínua. Alongamento máximo, ou pegada neutra no martelo.", un: "kg", q: "execucao+rosca+bayesian+polia" },
      ] },
      { nome: "Cardio pós-treino", descanso: "", itens: [CARDIO_POS("b7")] },
    ],
  },
  CARDIO: {
    tab: "Cardio", titulo: "Cardio somente", sub: "Oxidação e regeneração",
    cardio: "45 min Zona 2 ou meta de 1000 degraus",
    fases: [
      { nome: "Condicionamento e limpeza metabólica", descanso: "45 min", itens: [
        { id: "k1", nome: "Escada (simulador) ou passadeira inclinada", series: "45 min / 1000 degraus", nota: "Ritmo constante e postura alinhada. Recupera os membros superiores antes do treino de pernas.", un: "min", q: "execucao+correta+escada+stairmaster+cardio" },
      ] },
    ],
  },
  C: {
    tab: "C", titulo: "Treino C · Pernas", sub: "Pernas completo",
    cardio: "15 a 20 min pós-treino (Zona 2)",
    fases: [
      { nome: "Multiarticular · força bruta", descanso: "2 min", itens: [
        { id: "p1", nome: "Leg press 45º", series: "4 × 8–10", nota: "Pés na largura dos ombros, amplitude controlada sem tirar a bacia do encosto, empurrando pelos calcanhares.", un: "kg", q: "execucao+correta+leg+press+45" },
      ] },
      { nome: "Isoladores de quadríceps e posterior", descanso: "90 s", itens: [
        { id: "p2", nome: "Cadeira extensora", series: "4 × 10–12", nota: "Até a falha controlada. Pausa de 1 s no topo e descida cadenciada.", un: "kg", q: "execucao+correta+cadeira+extensora" },
        { id: "p3", nome: "Cadeira flexora (ou mesa flexora)", series: "4 × 10–12", nota: "Quadril fixo no banco, puxando o rolo com força total.", un: "kg", q: "execucao+correta+cadeira+flexora" },
      ] },
      { nome: "Adutores e gêmeos", descanso: "60 s", itens: [
        { id: "p4", nome: "Cadeira adutora", series: "3 × 12–15", nota: "Amplitude controlada sem deixar as placas baterem no retorno.", un: "kg", q: "execucao+correta+cadeira+adutora" },
        { id: "p5", nome: "Gêmeos sentado (panturrilha)", series: "4 × 15–20", nota: "Alongue totalmente na base e segure 1 s na contração máxima.", un: "kg", q: "execucao+correta+gemeos+sentado+panturrilha" },
      ] },
      { nome: "Cardio pós-treino", descanso: "", itens: [CARDIO_POS("p6")] },
    ],
  },
};

const ORDEM_FICHA = ["A", "B", "C", "CORE", "CARDIO"];
// segunda..domingo → ficha do dia
const FICHA_DO_DIA = ["A", "CORE", "B", "CARDIO", "C", "B", "CARDIO"];

const PROTOCOLO_DIARIO = [
  ["Ao acordar (em jejum)", "5 séries de 15 a 20 s de stomach vacuum para ativar o transverso abdominal."],
  ["Pré-treino (30–45 min antes)", "2 colheres de sopa (31,5 g) de Nutren Protein com whey e cafeína, em 180 ml de leite magro ou semidesnatado e 1 banana."],
  ["Dieta e hidratação", "Manter o déficit calórico com a matriz de PTS e ovos e cumprir a meta diária de água."],
];

function cargasPadrao() {
  const c = {};
  ORDEM_FICHA.forEach((k) => FICHA[k].fases.forEach((f) => f.itens.forEach((it) => { if (it.padrao) c[it.id] = it.padrao; })));
  return c;
}
