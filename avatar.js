"use strict";

// Boneco que muda de proporção conforme as medidas. Funções puras: recebem dados e devolvem SVG/números.
const PELES = ["#f1c9a5", "#d9a577", "#b97d52", "#8d5a3b", "#5e3b26"];
const CAMPOS_MEDIDA = [
  ["cintura", "Cintura", "cm"], ["peso", "Peso", "kg"], ["peito", "Peito", "cm"], ["quadril", "Quadril", "cm"],
  ["ombro", "Ombro", "cm"], ["biceps", "Bíceps", "cm"], ["braco", "Braço inteiro", "cm"], ["coxa", "Coxa", "cm"],
];

const f1 = (n) => Math.round(n * 10) / 10;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

// pontos → curva suave (Catmull-Rom → Bézier); assume que o ponto inicial já é o atual
function curva(pts) {
  let s = "";
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
    s += "C" + f1(p1[0] + (p2[0] - p0[0]) / 6) + " " + f1(p1[1] + (p2[1] - p0[1]) / 6) + " " +
      f1(p2[0] - (p3[0] - p1[0]) / 6) + " " + f1(p2[1] - (p3[1] - p1[1]) / 6) + " " + f1(p2[0]) + " " + f1(p2[1]);
  }
  return s;
}

// proporções em px por medida (cintura 108 e peito 114 → quase retos, corpo largo)
function proporcoes(m, base, amp) {
  const k = (v, b) => clamp(1 + (v / b - 1) * amp, 0.6, 1.5);
  return {
    sh: 70 * k(m.ombro, base.ombro), ch: 62 * k(m.peito, base.peito), wa: 58 * k(m.cintura, base.cintura),
    hp: 59 * k(m.quadril, base.quadril), arm: 27 * k(m.biceps, base.biceps), th: 25 * k(m.coxa, base.coxa),
  };
}

function caminhoTorso(cx, P, extra, yBase) {
  const R = [[cx + P.sh + extra, 150], [cx + P.ch + extra, 205], [cx + P.wa + extra, 268], [cx + P.hp + extra, yBase]];
  const L = R.map(([x, y]) => [2 * cx - x, y]).reverse();
  return "M" + f1(L[3][0]) + " 150 Q" + f1(L[3][0]) + " 136 " + f1(L[3][0] + 16) + " 134 L" + f1(R[0][0] - 16) + " 134 Q" +
    f1(R[0][0]) + " 136 " + f1(R[0][0]) + " 150" + curva(R) + "L" + f1(L[0][0]) + " " + yBase + curva(L) + "Z";
}

function desenharAvatar(m, base, o) {
  const cx = 150;
  const P = proporcoes(m, base, o.ampliar ? 2 : 1);
  const G = proporcoes(base, base, 1);
  const pele = PELES[clamp(o.pele | 0, 0, PELES.length - 1)];
  const peleSombra = "#00000022";
  const prog = clamp(o.progresso, 0, 1);
  let s = '<svg viewBox="0 0 300 500" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Boneco com as suas proporções atuais">';

  // contorno da linha de base (12/10) para comparar
  const lado = (Q, sinal) => {
    const xa = cx + sinal * (Q.sh + Q.arm / 2 - 6);
    return '<rect x="' + f1(xa - Q.arm / 2) + '" y="142" width="' + f1(Q.arm) + '" height="150" rx="' + f1(Q.arm / 2) + '"/>';
  };
  s += '<g fill="none" stroke="#c6ff3d" stroke-width="1.5" stroke-dasharray="5 4" opacity=".55">' +
    '<path d="' + caminhoTorso(cx, G, 0, 305) + '"/>' + lado(G, -1) + lado(G, 1) +
    '<rect x="' + f1(cx - 27 - G.th) + '" y="300" width="' + f1(G.th * 2) + '" height="180" rx="14"/>' +
    '<rect x="' + f1(cx + 27 - G.th) + '" y="300" width="' + f1(G.th * 2) + '" height="180" rx="14"/></g>';

  // pernas e bermuda
  [-1, 1].forEach((sg) => {
    const x = cx + sg * 27;
    s += '<path d="M' + f1(x - P.th * 0.78) + " 360 Q" + f1(x - P.th * 0.6) + " 420 " + f1(x - 12) + " 478 L" + f1(x + 12) + " 478 Q" + f1(x + P.th * 0.6) + " 420 " + f1(x + P.th * 0.78) + ' 360Z" fill="' + pele + '"/>';
    s += '<rect x="' + f1(x - 17) + '" y="474" width="34" height="16" rx="8" fill="#1d1f1e"/>';
    s += '<path d="M' + f1(x - P.th - 3) + " 298 L" + f1(x + P.th + 3) + " 298 L" + f1(x + P.th + 5) + " 372 L" + f1(x - P.th - 5) + ' 372Z" fill="#3a3d3b"/>';
  });
  s += '<path d="M' + f1(cx - P.hp - 4) + " 294 L" + f1(cx + P.hp + 4) + " 294 L" + f1(cx + P.hp + 4) + " 312 L" + f1(cx - P.hp - 4) + ' 312Z" fill="#33362f"/>';

  // braços (esquerda da tela: tatuagem e relógio, como na foto)
  [-1, 1].forEach((sg) => {
    const xa = cx + sg * (P.sh + P.arm / 2 - 6);
    const fw = P.arm * 0.78;
    s += '<rect x="' + f1(xa - fw / 2) + '" y="206" width="' + f1(fw) + '" height="84" rx="' + f1(fw / 2) + '" fill="' + pele + '"/>';
    s += '<circle cx="' + f1(xa) + '" cy="296" r="' + f1(fw * 0.58) + '" fill="' + pele + '"/>';
    s += '<rect x="' + f1(xa - P.arm / 2) + '" y="142" width="' + f1(P.arm) + '" height="82" rx="' + f1(P.arm / 2) + '" fill="' + pele + '"/>';
    if (sg === -1) {
      s += '<g><rect x="' + f1(xa - fw / 2) + '" y="236" width="' + f1(fw) + '" height="13" fill="#1b1b1b" opacity=".88"/>' +
        '<path d="M' + f1(xa - fw / 2 + 2) + " 242.5 h" + f1(fw - 4) + '" stroke="' + pele + '" stroke-width="1.5" stroke-dasharray="3 3" opacity=".7"/>' +
        '<rect x="' + f1(xa - fw / 2 - 1) + '" y="268" width="' + f1(fw + 2) + '" height="14" rx="4" fill="#202322"/>' +
        '<rect x="' + f1(xa - 4) + '" y="271" width="8" height="8" rx="2" fill="#54605a"/></g>';
    }
  });

  // tronco
  if (o.semCamiseta) {
    s += '<path d="' + caminhoTorso(cx, P, 0, 305) + '" fill="' + pele + '"/>';
    // peitoral e abdômen: as linhas ficam mais fortes conforme a cintura chega na meta
    const op = f1(0.1 + 0.75 * prog);
    s += '<g stroke="#00000055" fill="none" stroke-linecap="round" opacity="' + op + '" stroke-width="2">' +
      '<path d="M' + cx + ' 215 V292"/>' +
      '<path d="M' + f1(cx - P.wa * 0.34) + " 236 Q" + cx + " 242 " + f1(cx + P.wa * 0.34) + ' 236"/>' +
      '<path d="M' + f1(cx - P.wa * 0.36) + " 255 Q" + cx + " 261 " + f1(cx + P.wa * 0.36) + ' 255"/>' +
      '<path d="M' + f1(cx - P.wa * 0.34) + " 274 Q" + cx + " 280 " + f1(cx + P.wa * 0.34) + ' 274"/>' +
      '<path d="M' + f1(cx - P.ch * 0.8) + " 196 Q" + f1(cx - P.ch * 0.3) + " 214 " + cx + ' 198"/>' +
      '<path d="M' + f1(cx + P.ch * 0.8) + " 196 Q" + f1(cx + P.ch * 0.3) + " 214 " + cx + ' 198"/></g>';
    s += '<ellipse cx="' + cx + '" cy="262" rx="' + f1(P.wa * 0.92) + '" ry="34" fill="#000" opacity="' + f1((1 - prog) * 0.16) + '"/>';
    s += '<circle cx="' + cx + '" cy="286" r="2.2" fill="#00000066"/>';
  } else {
    s += '<path d="' + caminhoTorso(cx, P, 5, 318) + '" fill="#f4f2ec" stroke="#d8d4c8" stroke-width="1.5"/>';
    [-1, 1].forEach((sg) => {
      const xa = cx + sg * (P.sh + P.arm / 2 - 6);
      s += '<rect x="' + f1(xa - P.arm / 2 - 4) + '" y="138" width="' + f1(P.arm + 8) + '" height="54" rx="' + f1((P.arm + 8) / 2.4) + '" fill="#f4f2ec" stroke="#d8d4c8" stroke-width="1.5"/>';
    });
    // estampa de carinha no peito (lado esquerdo da tela)
    const ex = cx - P.ch * 0.46;
    s += '<g stroke="#2a2724" stroke-width="1.6" fill="none" stroke-linecap="round"><circle cx="' + f1(ex) + '" cy="188" r="11"/>' +
      '<path d="M' + f1(ex - 6) + " 183 l3 3 m0 -3 l-3 3 M" + f1(ex + 3) + " 183 l3 3 m0 -3 l-3 3 M" + f1(ex - 5) + " 194 h10" + '"/>' +
      '<path d="M' + f1(ex - 4) + " 200 v8 M" + f1(ex + 2) + " 200 v6" + '"/></g>';
  }

  // cabeça
  s += '<rect x="' + (cx - 13) + '" y="118" width="26" height="26" fill="' + pele + '"/><rect x="' + (cx - 13) + '" y="118" width="26" height="26" fill="' + peleSombra + '"/>';
  s += '<circle cx="' + cx + '" cy="92" r="34" fill="' + pele + '"/>';
  s += '<path d="M' + (cx - 16) + " 104 Q" + cx + " 100 " + (cx + 16) + " 104 L" + (cx + 13) + " 122 Q" + cx + " 136 " + (cx - 13) + ' 122Z" fill="#2a211c"/>';
  s += '<path d="M' + (cx - 11) + " 107 Q" + cx + " 112 " + (cx + 11) + ' 107" stroke="' + pele + '" stroke-width="3.2" fill="none" stroke-linecap="round"/>';
  s += '<g stroke="#2a211c" stroke-linecap="round" fill="none"><path d="M' + (cx - 19) + " 90 q7 4 14 0 M" + (cx + 5) + " 90 q7 4 14 0" + '" stroke-width="2.4"/>' +
    '<path d="M' + (cx - 20) + " 84 q8 -4 15 -1 M" + (cx + 5) + " 83 q7 -3 15 1" + '" stroke-width="2.2"/></g>';
  // gorro + fone
  s += '<path d="M' + (cx - 37) + " 84 Q" + (cx - 40) + " 44 " + cx + " 42 Q" + (cx + 40) + " 44 " + (cx + 37) + ' 84Z" fill="#efe6d4" stroke="#d6cbb4" stroke-width="1.5"/>';
  s += '<rect x="' + (cx - 38) + '" y="70" width="76" height="16" rx="6" fill="#e6dcc7" stroke="#d6cbb4" stroke-width="1.5"/>';
  s += '<rect x="' + (cx - 13) + '" y="73" width="26" height="10" rx="2" fill="#26292a"/><rect x="' + (cx - 9) + '" y="76" width="18" height="2.4" fill="#e8e8e8" opacity=".8"/>';
  s += '<path d="M' + (cx - 43) + " 92 C" + (cx - 46) + " 26 " + (cx + 46) + " 26 " + (cx + 43) + ' 92" fill="none" stroke="#f6f3ea" stroke-width="6" stroke-linecap="round"/>';
  s += '<path d="M' + (cx - 43) + " 92 C" + (cx - 46) + " 26 " + (cx + 46) + " 26 " + (cx + 43) + ' 92" fill="none" stroke="#cfc9b8" stroke-width="1" opacity=".7"/>';
  [-1, 1].forEach((sg) => { s += '<ellipse cx="' + (cx + sg * 43) + '" cy="98" rx="9" ry="17" fill="#f6f3ea" stroke="#cfc9b8" stroke-width="1.5"/>'; });
  return s + "</svg>";
}

// números que alimentam o painel: variação, progresso até a meta de cintura e previsão de chegada
function calcularInsights(d) {
  const b = d.medidasBase, m = d.medidas, meta = d.metaCintura;
  const dif = (k) => f1(m[k] - b[k]);
  const total = b.cintura - meta;
  const progresso = total > 0 ? clamp((b.cintura - m.cintura) / total, 0, 1) : (m.cintura <= meta ? 1 : 0);
  let previsao = null;
  const h = d.historico.filter((r) => r.cintura > 0).sort((a, c) => (a.data < c.data ? -1 : 1));
  if (m.cintura <= meta) previsao = "Meta de cintura atingida";
  else if (h.length >= 2) {
    const dias = (new Date(h[h.length - 1].data) - new Date(h[0].data)) / 86400000;
    const queda = h[0].cintura - h[h.length - 1].cintura;
    if (dias >= 7 && queda > 0) {
      const semanas = Math.ceil((m.cintura - meta) / (queda / (dias / 7)));
      previsao = "No ritmo atual (" + f1(queda / (dias / 7)) + " cm/semana): cerca de " + semanas + (semanas === 1 ? " semana" : " semanas") + " até a meta";
    } else if (dias >= 7) previsao = "Sua cintura não caiu desde a primeira medição. Revise dieta e cardio.";
  }
  if (!previsao) previsao = "Registre outra medição (com 7+ dias de intervalo) para eu calcular o ritmo.";
  const estagios = ["Começando", "Cintura descendo", "Linhas aparecendo", "Quase lá", "Gominhos à vista"];
  const estagio = estagios[progresso >= 1 ? 4 : Math.min(3, Math.floor(progresso * 4))];
  return {
    dif, progresso, previsao, estagio,
    vTaper: f1(m.peito / m.cintura),
    falta: f1(Math.max(0, m.cintura - meta)),
  };
}
