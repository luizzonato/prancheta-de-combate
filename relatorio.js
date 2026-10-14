"use strict";

// Gera o relatório em PDF (arquivo de verdade, não a janela de impressão) com a biblioteca jsPDF.
const COR = {
  bg: [10, 13, 11], card: [20, 26, 21], card2: [17, 22, 18], line: [36, 48, 38],
  txt: [242, 246, 240], mut: [138, 154, 140], lime: [198, 255, 61], org: [255, 90, 31], amb: [255, 176, 32], pur: [180, 140, 255],
};

// a fonte padrão do PDF só tem Latin-1: tira emoji e símbolos que sairiam quebrados
function limparTexto(t) {
  return String(t).replace(/[^ -ÿ–—•‘’“”]/g, "").trim();
}
const virgula = (n) => String(n).replace(".", ",");
const dm = (d) => String(d.getDate()).padStart(2, "0") + "/" + String(d.getMonth() + 1).padStart(2, "0");

function carregarImagem(src) {
  return new Promise((ok, erro) => {
    const i = new Image();
    i.onload = () => ok(i);
    i.onerror = () => erro(new Error("Não consegui carregar uma imagem do relatório"));
    i.src = src;
  });
}
async function rasterizar(src, w, h) {
  const img = await carregarImagem(src);
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  c.getContext("2d").drawImage(img, 0, 0, w, h);
  return c.toDataURL("image/png");
}

async function gerarRelatorioPdf(opcoes) {
  if (!window.jspdf || !window.jspdf.jsPDF) throw new Error("Biblioteca de PDF indisponível");
  const { jsPDF } = window.jspdf;
  const d = dados;
  const hojeIdx = indiceDia(new Date());
  const ins = calcularInsights(d);
  const humorKey = (opcoes && opcoes.humor) || d.humor[iso(new Date())] || "normal";

  const [logo, avatarPng] = await Promise.all([
    rasterizar("icons/icon-192.png", 192, 192),
    rasterizar(
      "data:image/svg+xml;charset=utf-8," + encodeURIComponent(desenharAvatar(d.medidas, d.medidasBase, Object.assign({}, d.avatar, { progresso: ins.progresso, humor: humorKey }))),
      600, 1000
    ),
  ]);

  const W = 210, H = 297, M = 14;
  const doc = new jsPDF({ unit: "mm", format: "a4", compress: true });
  const fill = (c) => doc.setFillColor(c[0], c[1], c[2]);
  const ink = (c) => doc.setTextColor(c[0], c[1], c[2]);
  const stroke = (c) => doc.setDrawColor(c[0], c[1], c[2]);
  const txt = (s, x, y, o) => doc.text(limparTexto(s), x, y, o);
  const fonte = (peso, pt, cor) => { doc.setFont("helvetica", peso); doc.setFontSize(pt); ink(cor || COR.txt); };
  const caixa = (x, y, w, h, cor) => { fill(cor || COR.card); doc.roundedRect(x, y, w, h, 2.5, 2.5, "F"); };

  const fundo = () => { fill(COR.bg); doc.rect(0, 0, W, H, "F"); };
  fundo();
  let y = 0;
  const novaPagina = () => {
    doc.addPage(); fundo();
    fonte("bold", 8, COR.lime); txt("LZ · PRANCHETA DE COMBATE", M, 12);
    stroke(COR.line); doc.setLineWidth(0.3); doc.line(M, 15, W - M, 15);
    return 22;
  };

  /* ---------- cabeçalho ---------- */
  doc.addImage(logo, "PNG", M, 9, 22, 22);
  fonte("bold", 24, COR.txt); txt("PRANCHETA", M + 27, 20);
  fonte("bold", 24, COR.lime); txt("DE COMBATE", M + 27, 29);
  fonte("normal", 8, COR.mut);
  txt("Semana de " + dm(dataDoIndice(0)) + " a " + dm(dataDoIndice(6)), W - M, 17, { align: "right" });
  txt("Gerado em " + new Date().toLocaleString("pt-BR"), W - M, 22, { align: "right" });
  fonte("bold", 8, COR.org); txt("PROTOCOLO CUTTING ATIVO", W - M, 12, { align: "right" });
  stroke(COR.lime); doc.setLineWidth(0.6); doc.line(M, 35, W - M, 35);

  /* ---------- KPIs ---------- */
  const kw = (W - 2 * M - 8) / 3;
  const kpis = [
    ["HOJE · " + DIAS[hojeIdx].toUpperCase(), contDia(hojeIdx) + "/" + d.habitos.length, pctDia(hojeIdx) + "% das metas", COR.lime],
    ["SEQUÊNCIA", sequencia() + (sequencia() === 1 ? " dia" : " dias"), "dias seguidos com 80%+", COR.amb],
    ["MÉDIA DA SEMANA", mediaSemana() + "%", DIAS.reduce((s, _, i) => s + contDia(i), 0) + " metas concluídas", COR.pur],
  ];
  kpis.forEach(([rot, val, sub, cor], i) => {
    const x = M + i * (kw + 4);
    caixa(x, 40, kw, 24);
    fonte("bold", 7, COR.mut); txt(rot, x + 4, 46);
    fonte("bold", 18, cor); txt(val, x + 4, 56);
    fonte("normal", 7, COR.mut); txt(sub, x + 4, 61.5);
  });

  /* ---------- LZ + medidas ---------- */
  caixa(M, 69, 82, 124);
  doc.addImage(avatarPng, "PNG", M + 10, 72, 62, 103);
  const hm = HUMORES[humorKey] || HUMORES.normal;
  fonte("bold", 7, COR.mut); txt("HUMOR DE HOJE", M + 41, 181, { align: "center" });
  fonte("bold", 12, COR.lime); txt(hm.rot, M + 41, 188, { align: "center" });

  const rx = M + 88, rw = W - M - rx;
  caixa(rx, 69, rw, 124);
  fonte("bold", 9, COR.lime); txt("MEDIDAS", rx + 5, 77);
  fonte("bold", 7, COR.mut);
  txt("ATUAL", rx + rw - 32, 77, { align: "right" }); txt("VARIAÇÃO", rx + rw - 5, 77, { align: "right" });
  stroke(COR.line); doc.setLineWidth(0.3); doc.line(rx + 5, 80, rx + rw - 5, 80);
  let my = 87;
  CAMPOS_MEDIDA.forEach(([k, rot, un]) => {
    const v = d.medidas[k], dif = ins.dif(k);
    fonte("normal", 9, COR.txt); txt(rot, rx + 5, my);
    fonte("bold", 9, COR.txt); txt(virgula(v) + " " + un, rx + rw - 32, my, { align: "right" });
    const bom = k === "cintura" || k === "peso" ? dif < 0 : dif > 0;
    fonte("bold", 9, dif === 0 ? COR.mut : bom ? COR.lime : COR.org);
    txt((dif > 0 ? "+" : "") + virgula(dif) + (k === "peso" ? " kg" : " cm"), rx + rw - 5, my, { align: "right" });
    my += 7.2;
  });

  // meta de cintura
  const gy = 148;
  stroke(COR.line); doc.line(rx + 5, gy - 6, rx + rw - 5, gy - 6);
  fonte("bold", 8, COR.pur); txt("META DE CINTURA · " + virgula(d.metaCintura) + " cm", rx + 5, gy);
  fonte("bold", 8, COR.txt); txt(Math.round(ins.progresso * 100) + "%", rx + rw - 5, gy, { align: "right" });
  fill(COR.line); doc.roundedRect(rx + 5, gy + 3, rw - 10, 4, 2, 2, "F");
  if (ins.progresso > 0.01) { fill(COR.lime); doc.roundedRect(rx + 5, gy + 3, Math.max(3, (rw - 10) * ins.progresso), 4, 2, 2, "F"); }
  fonte("normal", 8, COR.mut);
  txt(ins.falta > 0 ? "Faltam " + virgula(ins.falta) + " cm para a meta" : "Meta atingida", rx + 5, gy + 13);
  fonte("bold", 8, COR.amb);
  doc.splitTextToSize(limparTexto(ins.previsao), rw - 10).slice(0, 4).forEach((l, i) => doc.text(l, rx + 5, gy + 19 + i * 4.4));
  fonte("normal", 7, COR.mut);
  txt("Estágio: " + ins.estagio + " · base em 12/10/2026", rx + 5, 189);

  /* ---------- gráfico da semana ---------- */
  caixa(M, 198, W - 2 * M, 50);
  fonte("bold", 9, COR.lime); txt("CONSISTÊNCIA DA SEMANA", M + 5, 206);
  fonte("normal", 7, COR.amb); txt("linha tracejada = corte de 80%", W - M - 5, 206, { align: "right" });
  const px = M + 12, pw = W - 2 * M - 20, py = 212, ph = 25;
  const bw = pw / 7;
  fonte("normal", 6.5, COR.mut);
  [0, 50, 100].forEach((v) => { txt(String(v), px - 3, py + ph - (ph * v) / 100 + 1, { align: "right" }); });
  stroke(COR.line); doc.setLineWidth(0.2);
  [0, 50, 100].forEach((v) => doc.line(px, py + ph - (ph * v) / 100, px + pw, py + ph - (ph * v) / 100));
  for (let i = 0; i < 7; i++) {
    const p = pctDia(i), h = (ph * p) / 100, x = px + i * bw + bw * 0.2;
    if (h > 0.4) { fill(p >= 80 ? COR.lime : [74, 107, 42]); doc.roundedRect(x, py + ph - h, bw * 0.6, h, 1, 1, "F"); }
    fonte("bold", 6.5, COR.txt); if (p > 0) txt(p + "%", x + bw * 0.3, py + ph - h - 1.2, { align: "center" });
    fonte(i === hojeIdx ? "bold" : "normal", 7, i === hojeIdx ? COR.lime : COR.mut); txt(DIAS_CURTOS[i], x + bw * 0.3, py + ph + 5, { align: "center" });
  }
  stroke(COR.amb); doc.setLineWidth(0.4); doc.setLineDashPattern([1.6, 1.6], 0);
  doc.line(px, py + ph - ph * 0.8, px + pw, py + ph - ph * 0.8);
  doc.setLineDashPattern([], 0);

  /* ---------- hábitos da semana ---------- */
  y = 254;
  const cabHabitos = () => {
    fonte("bold", 9, COR.lime); txt("HÁBITOS DA SEMANA", M, y);
    fonte("bold", 6.5, COR.mut);
    DIAS_CURTOS.forEach((n, i) => txt(n, M + 94 + i * 11, y, { align: "center" }));
    txt("TOTAL", W - M, y, { align: "right" });
    y += 4;
  };
  cabHabitos();
  d.habitos.forEach((h, idx) => {
    if (y + 8 > H - 14) { y = novaPagina(); cabHabitos(); }
    if (idx % 2 === 0) { fill(COR.card2); doc.rect(M, y - 0.5, W - 2 * M, 6.6, "F"); }
    fonte("normal", 8, COR.txt);
    txt(doc.splitTextToSize(limparTexto(h.nome), 84)[0], M + 2, y + 4);
    let tot = 0;
    for (let i = 0; i < 7; i++) {
      const cx = M + 94 + i * 11;
      if (h.checks[i]) { tot++; fill(COR.lime); doc.roundedRect(cx - 2, y + 0.8, 4, 4, 0.8, 0.8, "F"); }
      else { stroke(COR.line); doc.setLineWidth(0.3); doc.roundedRect(cx - 2, y + 0.8, 4, 4, 0.8, 0.8, "S"); }
    }
    fonte("bold", 8, tot >= 5 ? COR.lime : COR.mut); txt(tot + "/7", W - M - 1, y + 4, { align: "right" });
    y += 6.6;
  });

  /* ---------- fichas de treino e cargas ---------- */
  y += 8;
  if (y + 40 > H - 14) y = novaPagina();
  fonte("bold", 14, COR.lime); txt("FICHAS DE TREINO E CARGAS", M, y + 2);
  fonte("normal", 8, COR.mut); txt("Cargas registradas no app. Quadrado preenchido = exercício marcado como feito.", M, y + 8);
  y += 15;
  ORDEM_FICHA.forEach((k) => {
    const f = FICHA[k];
    const linhas = f.fases.reduce((s, fs) => s + 1 + fs.itens.length, 0);
    if (y + 20 > H - 14) y = novaPagina();
    else if (y + Math.min(linhas, 4) * 6 + 14 > H - 14) y = novaPagina();
    caixa(M, y, W - 2 * M, 10, COR.card);
    fonte("bold", 10, COR.lime); txt(f.titulo, M + 4, y + 6.6);
    fonte("normal", 7, COR.amb); txt("Cardio: " + f.cardio, W - M - 4, y + 6.4, { align: "right" });
    y += 13;
    f.fases.forEach((fase) => {
      if (y + 14 > H - 14) y = novaPagina();
      fonte("bold", 7, COR.mut); txt(fase.nome.toUpperCase() + (fase.descanso ? "  ·  descanso " + fase.descanso : ""), M + 2, y + 3);
      y += 5.5;
      fase.itens.forEach((it, idx) => {
        if (y + 7 > H - 14) y = novaPagina();
        if (idx % 2 === 0) { fill(COR.card2); doc.rect(M, y - 0.6, W - 2 * M, 6.4, "F"); }
        const feito = !!d.feitos[it.id];
        if (feito) { fill(COR.lime); doc.roundedRect(M + 2, y + 0.6, 3.6, 3.6, 0.7, 0.7, "F"); }
        else { stroke(COR.line); doc.setLineWidth(0.3); doc.roundedRect(M + 2, y + 0.6, 3.6, 3.6, 0.7, 0.7, "S"); }
        fonte("normal", 8, COR.txt); txt(doc.splitTextToSize(limparTexto(it.nome), 84)[0], M + 8, y + 3.9);
        fonte("normal", 7.5, COR.mut); txt(it.series, M + 100, y + 3.9);
        const c = d.cargas[it.id];
        if (c) { fonte("bold", 9, COR.lime); txt(virgula(c) + " " + it.un, W - M - 2, y + 3.9, { align: "right" }); }
        else { fonte("normal", 8, COR.mut); txt("—", W - M - 2, y + 3.9, { align: "right" }); }
        y += 6.4;
      });
    });
    y += 4;
  });

  /* ---------- rodapé com numeração ---------- */
  const total = doc.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    fonte("normal", 7, COR.mut);
    txt("LZ · Prancheta de Combate · página " + i + " de " + total, W / 2, H - 7, { align: "center" });
  }
  return doc.output("blob");
}
