"use strict";

// Boneco que muda de proporção conforme as medidas. Funções puras: recebem dados e devolvem SVG/números.
const PELES = ["#f1c9a5", "#d9a577", "#b97d52", "#8d5a3b", "#5e3b26"];
const CABELOS = ["#1c1714", "#4a3322", "#c9a35b", "#9aa0a6"];
const CAMISAS = [
  { nome: "Branca", fill: "#f4f2ec", stroke: "#d8d4c8", print: "#2a2724" },
  { nome: "Preta", fill: "#24282a", stroke: "#3d4346", print: "#e8e8e8" },
  { nome: "Verde-limão", fill: "#b8f032", stroke: "#8fc21f", print: "#10150a" },
  { nome: "Cinza", fill: "#6b7480", stroke: "#535b66", print: "#f2f2f2" },
];
const GORROS = [
  { nome: "Creme", fill: "#efe6d4", stroke: "#d6cbb4", band: "#e6dcc7", patch: "#26292a" },
  { nome: "Preto", fill: "#2b2e30", stroke: "#1a1c1d", band: "#232628", patch: "#d9d9d9" },
  { nome: "Cinza", fill: "#8a919a", stroke: "#6f7680", band: "#7c848d", patch: "#1f2224" },
  { nome: "Verde", fill: "#2f6b3a", stroke: "#235230", band: "#295e33", patch: "#e8f5d8" },
];
// humores: rótulo, emoji e a cor do brilho atrás do boneco
const HUMORES = {
  foco: { rot: "Focado", emoji: "😤", cor: "rgba(80,160,255,.22)" },
  feliz: { rot: "Feliz", emoji: "😄", cor: "rgba(255,200,40,.22)" },
  motivado: { rot: "Motivado", emoji: "🔥", cor: "rgba(255,90,31,.26)" },
  normal: { rot: "Normal", emoji: "😐", cor: "rgba(198,255,61,.12)" },
  cansado: { rot: "Cansado", emoji: "😴", cor: "rgba(180,140,255,.22)" },
  bravo: { rot: "Bravo", emoji: "😠", cor: "rgba(255,60,60,.24)" },
};
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

function rosto(h, cx, barba) {
  const ink = "#241b16";
  const boca = barba ? "#f4e6d3" : "#5a2f26";
  const L = (x) => cx - x, R = (x) => cx + x;
  const ell = (x, ry, extra) => '<ellipse cx="' + x + '" cy="91" rx="2.7" ry="' + ry + '" fill="' + ink + '"/>' + (extra || "");
  const st = (d, w, c) => '<path d="' + d + '" stroke="' + (c || ink) + '" stroke-width="' + w + '" fill="none" stroke-linecap="round" stroke-linejoin="round"/>';
  let o = "";
  const nariz = st("M" + cx + " 94 q-3 8 0 9", 1.6, "#00000033");
  if (h === "feliz") {
    o += st("M" + L(16) + " 92 q4 -6 8 0 M" + R(8) + " 92 q4 -6 8 0", 2.6);
    o += st("M" + L(19) + " 82 q7 -5 14 -1 M" + R(5) + " 81 q7 -4 14 1", 2.4);
    o += '<path d="M' + L(9) + " 110 Q" + cx + " 123 " + R(9) + ' 110Z" fill="#fff"/>' + st("M" + L(9) + " 110 Q" + cx + " 123 " + R(9) + " 110", 1.4, boca);
  } else if (h === "foco") {
    o += ell(L(12), 2.4) + ell(R(12), 2.4);
    o += st("M" + L(20) + " 82 L" + L(5) + " 86 M" + R(5) + " 86 L" + R(20) + " 82", 2.8);
    o += st("M" + L(5) + " 113 h10", 2.4, boca);
  } else if (h === "motivado") {
    o += ell(L(12), 3.4, '<circle cx="' + (L(12) + 1) + '" cy="89.6" r="1.1" fill="#fff"/>') + ell(R(12), 3.4, '<circle cx="' + (R(12) + 1) + '" cy="89.6" r="1.1" fill="#fff"/>');
    o += st("M" + L(20) + " 83 q7 -6 15 -4 M" + R(5) + " 79 q8 -2 15 4", 2.6);
    o += st("M" + L(7) + " 112 Q" + (cx + 2) + " 118 " + R(10) + " 108", 2.6, boca);
  } else if (h === "cansado") {
    o += st("M" + L(16) + " 91 q4 4 8 0 M" + R(8) + " 91 q4 4 8 0", 2.4);
    o += st("M" + L(17) + " 97 q5 3 10 0 M" + R(7) + " 97 q5 3 10 0", 2, "#7a5a73");
    o += st("M" + L(20) + " 86 L" + L(5) + " 83 M" + R(5) + " 83 L" + R(20) + " 86", 2.4);
    o += st("M" + L(5) + " 114 q5 -3 10 0", 2.2, boca);
  } else if (h === "bravo") {
    o += ell(L(12), 1.9) + ell(R(12), 1.9);
    o += st("M" + L(21) + " 79 L" + L(4) + " 88 M" + R(4) + " 88 L" + R(21) + " 79", 3);
    o += st("M" + L(8) + " 117 Q" + cx + " 109 " + R(8) + " 117", 2.4, boca);
  } else { // normal
    o += ell(L(12), 3) + ell(R(12), 3);
    o += st("M" + L(19) + " 83 q7 -2 14 0 M" + R(5) + " 83 q7 -2 14 0", 2.4);
    o += st("M" + L(6) + " 113 h12", 2.4, boca);
  }
  return nariz + o;
}

function desenharAvatar(m, base, o) {
  const cx = 150;
  const P = proporcoes(m, base, o.ampliar ? 2 : 1);
  const G = proporcoes(base, base, 1);
  const pele = PELES[clamp(o.pele | 0, 0, PELES.length - 1)];
  const peleSombra = "#00000022";
  const camisa = CAMISAS[clamp(o.camisa | 0, 0, CAMISAS.length - 1)];
  const gorro = GORROS[clamp(o.gorroCor | 0, 0, GORROS.length - 1)];
  const cabelo = CABELOS[clamp(o.cabelo | 0, 0, CABELOS.length - 1)];
  const mostrarGorro = o.gorro !== false, mostrarFone = o.fone !== false, mostrarBarba = o.barba !== false;
  const mostrarTatu = o.tatuagem !== false, mostrarRelogio = o.relogio !== false;
  const prog = clamp(o.progresso, 0, 1);
  let s = '<svg viewBox="0 0 300 500" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="LZ com as suas proporções atuais">';

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
      if (mostrarTatu) {
        s += '<g><rect x="' + f1(xa - fw / 2) + '" y="236" width="' + f1(fw) + '" height="13" fill="#1b1b1b" opacity=".88"/>' +
          '<path d="M' + f1(xa - fw / 2 + 2) + " 242.5 h" + f1(fw - 4) + '" stroke="' + pele + '" stroke-width="1.5" stroke-dasharray="3 3" opacity=".7"/></g>';
      }
      if (mostrarRelogio) {
        s += '<g><rect x="' + f1(xa - fw / 2 - 1) + '" y="268" width="' + f1(fw + 2) + '" height="14" rx="4" fill="#202322"/>' +
          '<rect x="' + f1(xa - 4) + '" y="271" width="8" height="8" rx="2" fill="#54605a"/></g>';
      }
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
    s += '<path d="' + caminhoTorso(cx, P, 5, 318) + '" fill="' + camisa.fill + '" stroke="' + camisa.stroke + '" stroke-width="1.5"/>';
    [-1, 1].forEach((sg) => {
      const xa = cx + sg * (P.sh + P.arm / 2 - 6);
      s += '<rect x="' + f1(xa - P.arm / 2 - 4) + '" y="138" width="' + f1(P.arm + 8) + '" height="54" rx="' + f1((P.arm + 8) / 2.4) + '" fill="' + camisa.fill + '" stroke="' + camisa.stroke + '" stroke-width="1.5"/>';
    });
    // estampa de carinha no peito (lado esquerdo da tela)
    const ex = cx - P.ch * 0.46;
    s += '<g stroke="' + camisa.print + '" stroke-width="1.6" fill="none" stroke-linecap="round"><circle cx="' + f1(ex) + '" cy="188" r="11"/>' +
      '<path d="M' + f1(ex - 6) + " 183 l3 3 m0 -3 l-3 3 M" + f1(ex + 3) + " 183 l3 3 m0 -3 l-3 3 M" + f1(ex - 5) + " 194 h10" + '"/>' +
      '<path d="M' + f1(ex - 4) + " 200 v8 M" + f1(ex + 2) + " 200 v6" + '"/></g>';
  }

  // cabeça
  const hm = HUMORES[o.humor] ? o.humor : "normal";
  s += '<rect x="' + (cx - 13) + '" y="118" width="26" height="26" fill="' + pele + '"/><rect x="' + (cx - 13) + '" y="118" width="26" height="26" fill="' + peleSombra + '"/>';
  s += '<circle cx="' + cx + '" cy="92" r="34" fill="' + pele + '"/>';
  if (!mostrarGorro) {
    s += '<path d="M' + (cx - 34) + " 90 Q" + (cx - 40) + " 50 " + cx + " 48 Q" + (cx + 40) + " 50 " + (cx + 34) + " 90 Q" + (cx + 30) + " 70 " + cx + " 67 Q" + (cx - 30) + " 70 " + (cx - 34) + ' 90Z" fill="' + cabelo + '"/>';
  }
  if (mostrarBarba) {
    s += '<path d="M' + (cx - 17) + " 103 Q" + cx + " 99 " + (cx + 17) + " 103 L" + (cx + 14) + " 123 Q" + cx + " 137 " + (cx - 14) + ' 123Z" fill="' + (mostrarGorro ? "#2a211c" : cabelo) + '"/>';
  }
  s += rosto(hm, cx, mostrarBarba);
  if (mostrarGorro) {
    s += '<path d="M' + (cx - 37) + " 78 Q" + (cx - 40) + " 38 " + cx + " 36 Q" + (cx + 40) + " 38 " + (cx + 37) + ' 78Z" fill="' + gorro.fill + '" stroke="' + gorro.stroke + '" stroke-width="1.5"/>';
    s += '<rect x="' + (cx - 38) + '" y="64" width="76" height="15" rx="6" fill="' + gorro.band + '" stroke="' + gorro.stroke + '" stroke-width="1.5"/>';
    s += '<rect x="' + (cx - 13) + '" y="67" width="26" height="9" rx="2" fill="' + gorro.patch + '"/><rect x="' + (cx - 9) + '" y="70" width="18" height="2.4" fill="' + gorro.fill + '" opacity=".8"/>';
  }
  if (mostrarFone) {
    const topo = mostrarGorro ? 20 : 28;
    s += '<path d="M' + (cx - 43) + " 92 C" + (cx - 46) + " " + topo + " " + (cx + 46) + " " + topo + " " + (cx + 43) + ' 92" fill="none" stroke="#f6f3ea" stroke-width="6" stroke-linecap="round"/>';
    s += '<path d="M' + (cx - 43) + " 92 C" + (cx - 46) + " " + topo + " " + (cx + 46) + " " + topo + " " + (cx + 43) + ' 92" fill="none" stroke="#cfc9b8" stroke-width="1" opacity=".7"/>';
    [-1, 1].forEach((sg) => { s += '<ellipse cx="' + (cx + sg * 43) + '" cy="98" rx="9" ry="17" fill="#f6f3ea" stroke="#cfc9b8" stroke-width="1.5"/>'; });
  }
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
