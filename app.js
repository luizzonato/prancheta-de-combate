"use strict";

const STORAGE_KEY = "prancheta_combate_v2";
const DIAS = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"];
const DIAS_CURTOS = ["SEG", "TER", "QUA", "QUI", "SEX", "SÁB", "DOM"];
const TREINOS = [
  { t: "Treino A", s: "Peito, ombros e tríceps · supino 90 kg", c: "A" },
  { t: "Cardio + Core", s: "Zona 2 (45 min) + core pesado na polia", c: "Core" },
  { t: "Treino B", s: "Dorsais, posterior e bíceps", c: "B" },
  { t: "Cardio Zona 2", s: "1000 degraus ou 45 min em zona 2", c: "Cardio" },
  { t: "Treino C", s: "Pernas completo · leg press e extensora", c: "C" },
  { t: "Treino B", s: "Dorsais, posterior e bíceps", c: "B" },
  { t: "Cardio Ativo", s: "Regenerativo + core isométrico", c: "Ativo" },
];
const META_CORTE = 80;

const PADRAO = () => ({
  semana: chaveSemana(new Date()),
  habitos: [
    "Stomach vacuum em jejum (5x 15-20s)",
    "Pré-treino (Nutren + leite desnatado + banana)",
    "Treino do dia concluído",
    "Cardio zona 2 (escada ou esteira inclinada)",
    "Dieta em déficit (matriz PTS + ovos)",
    "Hidratação (meta de água)",
  ].map((nome, i) => ({ id: i + 1, nome, checks: [false, false, false, false, false, false, false] })),
  log: {},
  proximaMedicao: "2026-10-27",
  medidas: { peso: 100, cintura: 108, cinturaBase: 108, peito: 114, quadril: 108, ombro: 54, biceps: 41.5, braco: 144, coxa: 66 },
  historico: [{ data: "2026-10-12", cintura: 108, peso: 100 }],
});

/* ---------- datas ---------- */
function iso(d) {
  const p = (n) => String(n).padStart(2, "0");
  return d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate());
}
function indiceDia(d) { return (d.getDay() + 6) % 7; }
function segundaDe(d) {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  x.setDate(x.getDate() - indiceDia(x));
  return x;
}
function chaveSemana(d) { return iso(segundaDe(d)); }
function dataDoIndice(i) {
  const s = segundaDe(new Date());
  s.setDate(s.getDate() + i);
  return s;
}

/* ---------- estado ---------- */
let dados = carregar();
let sel = indiceDia(new Date());

function carregar() {
  let d = null;
  try { d = JSON.parse(localStorage.getItem(STORAGE_KEY)); } catch (e) { d = null; }
  if (!d || !Array.isArray(d.habitos)) d = PADRAO();
  d.log = d.log || {};
  d.historico = d.historico || [];
  d.medidas = Object.assign(PADRAO().medidas, d.medidas);
  d.proximaMedicao = d.proximaMedicao || "2026-10-27";
  // virou a semana: as marcações zeram, o log de % continua guardando a sequência
  const atual = chaveSemana(new Date());
  if (d.semana !== atual) {
    d.habitos.forEach((h) => { h.checks = [false, false, false, false, false, false, false]; });
    d.semana = atual;
  }
  return d;
}
function salvar() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(dados)); } catch (e) { /* armazenamento indisponível */ }
}

/* ---------- métricas ---------- */
function pctDia(d) {
  const n = dados.habitos.length;
  if (!n) return 0;
  let c = 0;
  dados.habitos.forEach((h) => { if (h.checks[d]) c++; });
  return Math.round((c / n) * 100);
}
function contDia(d) { return dados.habitos.filter((h) => h.checks[d]).length; }
function registrarLog() {
  for (let i = 0; i < 7; i++) {
    const data = dataDoIndice(i);
    if (data <= new Date()) dados.log[iso(data)] = pctDia(i);
  }
}
function sequencia() {
  const d = new Date();
  let n = 0;
  // se hoje ainda não bateu a meta, a sequência conta a partir de ontem
  if ((dados.log[iso(d)] || 0) < META_CORTE) d.setDate(d.getDate() - 1);
  while ((dados.log[iso(d)] || 0) >= META_CORTE) { n++; d.setDate(d.getDate() - 1); }
  return n;
}
function mediaSemana() {
  const n = dados.habitos.length * 7;
  if (!n) return 0;
  let c = 0;
  for (let i = 0; i < 7; i++) c += contDia(i);
  return Math.round((c / n) * 100);
}

/* ---------- render ---------- */
const $ = (id) => document.getElementById(id);

function render() {
  registrarLog();
  const hoje = indiceDia(new Date());

  // faixa da semana
  const strip = $("weekStrip");
  strip.innerHTML = "";
  for (let i = 0; i < 7; i++) {
    const p = pctDia(i);
    const b = document.createElement("button");
    b.className = "day" + (i === sel ? " sel" : "") + (i === hoje ? " today" : "") + (p >= META_CORTE ? " hit" : "");
    b.innerHTML = '<span class="dn"></span><span class="dp"></span><span class="bar"><i></i></span>';
    b.querySelector(".dn").textContent = DIAS_CURTOS[i];
    b.querySelector(".dp").textContent = p + "%";
    b.querySelector("i").style.width = p + "%";
    b.onclick = () => { sel = i; render(); };
    strip.appendChild(b);
  }

  // hero
  const p = pctDia(sel);
  const circ = 326.7;
  $("ringFg").style.strokeDashoffset = String(circ - (circ * p) / 100);
  $("ringFg").style.stroke = p >= 100 ? "#ffb020" : "#c6ff3d";
  $("ringPct").textContent = p + "%";
  $("ringCount").textContent = contDia(sel) + "/" + dados.habitos.length;
  $("dayName").textContent = DIAS[sel] + (sel === hoje ? " · hoje" : "");
  $("workoutTitle").textContent = TREINOS[sel].t;
  $("workoutSub").textContent = TREINOS[sel].s;
  $("streak").textContent = String(sequencia());
  $("weekAvg").textContent = mediaSemana() + "%";

  renderMissoes();
  renderGrafico();
  renderMatriz();
  renderMedidas();
  salvar();
}

function renderMissoes() {
  const ul = $("missions");
  ul.innerHTML = "";
  if (!dados.habitos.length) {
    const li = document.createElement("li");
    li.className = "empty";
    li.textContent = "Nenhuma meta ainda. Adicione a primeira abaixo.";
    ul.appendChild(li);
    return;
  }
  dados.habitos.forEach((h, idx) => {
    const feito = h.checks[sel];
    const li = document.createElement("li");
    li.className = "mission" + (feito ? " done" : "");
    li.innerHTML = '<span class="box">✓</span><span class="nm"></span><span class="st"></span>';
    li.querySelector(".nm").textContent = h.nome;
    li.querySelector(".st").textContent = feito ? "FEITO" : "PENDENTE";
    li.onclick = () => alternar(idx, sel, li);
    ul.appendChild(li);
  });
}

function renderGrafico() {
  const W = 700, H = 230, padL = 34, padB = 28, padT = 14;
  const ph = H - padB - padT;
  const bw = (W - padL - 10) / 7;
  const y = (v) => padT + ph - (ph * v) / 100;
  let s = '<svg viewBox="0 0 ' + W + " " + H + '" role="img" aria-label="Conclusão diária da semana">';
  [0, 25, 50, 75, 100].forEach((v) => {
    s += '<line x1="' + padL + '" x2="' + (W - 6) + '" y1="' + y(v) + '" y2="' + y(v) + '" stroke="#243026" stroke-width="1"/>';
    s += '<text x="' + (padL - 6) + '" y="' + (y(v) + 4) + '" text-anchor="end">' + v + "</text>";
  });
  for (let i = 0; i < 7; i++) {
    const v = pctDia(i);
    const x = padL + i * bw + bw * 0.18;
    const w = bw * 0.64;
    const hh = Math.max(0, (ph * v) / 100);
    const cor = v >= META_CORTE ? "#c6ff3d" : "#4a6b2a";
    s += '<rect class="bar-rect" x="' + x + '" y="' + (y(v)) + '" width="' + w + '" height="' + hh + '" rx="6" fill="' + cor + '"' + (i === sel ? ' stroke="#fff" stroke-width="1.5"' : "") + "/>";
    if (v > 0) s += '<text x="' + (x + w / 2) + '" y="' + (y(v) - 5) + '" text-anchor="middle" style="fill:#f2f6f0;font-weight:700">' + v + "</text>";
    s += '<text x="' + (x + w / 2) + '" y="' + (H - 8) + '" text-anchor="middle"' + (i === sel ? ' style="fill:#c6ff3d;font-weight:700"' : "") + ">" + DIAS_CURTOS[i] + "</text>";
  }
  s += '<line x1="' + padL + '" x2="' + (W - 6) + '" y1="' + y(META_CORTE) + '" y2="' + y(META_CORTE) + '" stroke="#ffb020" stroke-width="2" stroke-dasharray="6 6"/>';
  s += "</svg>";
  $("chart").innerHTML = s;
}

function renderMatriz() {
  const t = $("matrix");
  t.innerHTML = "";
  const thead = document.createElement("tr");
  thead.innerHTML = "<th></th>";
  DIAS_CURTOS.forEach((d, i) => {
    const th = document.createElement("th");
    th.textContent = d;
    if (i === sel) th.className = "sel";
    thead.appendChild(th);
  });
  thead.appendChild(document.createElement("th")).textContent = "SEM";
  t.appendChild(thead);

  dados.habitos.forEach((h, idx) => {
    const tr = document.createElement("tr");
    const nome = document.createElement("td");
    nome.className = "hn";
    nome.textContent = h.nome;
    const del = document.createElement("button");
    del.textContent = "✕";
    del.setAttribute("aria-label", "Excluir meta");
    del.onclick = () => remover(idx);
    nome.appendChild(del);
    tr.appendChild(nome);
    let tot = 0;
    for (let d = 0; d < 7; d++) {
      const td = document.createElement("td");
      const c = document.createElement("button");
      c.className = "cell" + (h.checks[d] ? " on" : "");
      c.setAttribute("aria-label", h.nome + " " + DIAS[d]);
      c.setAttribute("aria-pressed", h.checks[d] ? "true" : "false");
      if (h.checks[d]) tot++;
      c.onclick = () => alternar(idx, d, null);
      td.appendChild(c);
      tr.appendChild(td);
    }
    const tt = document.createElement("td");
    tt.className = "tot";
    tt.textContent = tot + "/7";
    tr.appendChild(tt);
    t.appendChild(tr);
  });
}

function renderMedidas() {
  const m = dados.medidas;
  const dif = +(m.cintura - m.cinturaBase).toFixed(1);
  const itens = [
    ["Cintura", m.cintura + " cm", true, dif],
    ["Peso", m.peso + " kg", false, null],
    ["Peito", m.peito + " cm", false, null],
    ["Quadril", m.quadril + " cm", false, null],
    ["Ombro", m.ombro + " cm", false, null],
    ["Bíceps", m.biceps + " cm", false, null],
    ["Braço inteiro", m.braco + " cm", false, null],
    ["Coxa", m.coxa + " cm", false, null],
  ];
  const box = $("measures");
  box.innerHTML = "";
  itens.forEach(([rot, val, foco, d]) => {
    const el = document.createElement("div");
    el.className = "m" + (foco ? " focus" : "");
    el.innerHTML = "<span></span><b></b>";
    el.querySelector("span").textContent = rot;
    el.querySelector("b").textContent = val;
    if (d !== null && d !== 0) {
      const sm = document.createElement("small");
      sm.className = d > 0 ? "up" : "";
      sm.textContent = (d > 0 ? "+" : "") + d + " cm";
      el.appendChild(sm);
    }
    box.appendChild(el);
  });

  // contagem regressiva
  const alvo = new Date(dados.proximaMedicao + "T00:00:00");
  const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
  const dias = Math.round((alvo - hoje) / 86400000);
  $("countdown").textContent = dias > 0 ? "faltam " + dias + " dias" : dias === 0 ? "HOJE: dia de medir!" : "medição atrasada";

  const h = $("waistHistory");
  h.innerHTML = "";
  dados.historico.slice(-5).reverse().forEach((r) => {
    const row = document.createElement("div");
    const [a, mth, d] = r.data.split("-");
    const l = document.createElement("span"); l.textContent = d + "/" + mth + "/" + a;
    const rr = document.createElement("span"); rr.textContent = r.cintura + " cm · " + r.peso + " kg";
    row.appendChild(l); row.appendChild(rr);
    h.appendChild(row);
  });
}

/* ---------- ações ---------- */
function alternar(idx, dia, li) {
  const antes = pctDia(dia);
  const h = dados.habitos[idx];
  h.checks[dia] = !h.checks[dia];
  if (navigator.vibrate) navigator.vibrate(h.checks[dia] ? 18 : 8);
  render();
  const depois = pctDia(dia);
  if (antes < 100 && depois === 100) { confete(); aviso("Dia fechado em 100%. Bora!"); }
  else if (antes < META_CORTE && depois >= META_CORTE) aviso("Meta de corte batida (" + META_CORTE + "%)");
  if (h.checks[dia]) {
    const el = $("missions").children[idx];
    if (el) { const b = el.querySelector(".box"); b.classList.add("pop"); }
  }
}
function remover(idx) {
  if (!confirm('Excluir a meta "' + dados.habitos[idx].nome + '"?')) return;
  dados.habitos.splice(idx, 1);
  render();
}
function zerarSemana() {
  if (!confirm("Zerar todas as marcações desta semana?")) return;
  dados.habitos.forEach((h) => { h.checks = [false, false, false, false, false, false, false]; });
  dados.log = {};
  render();
}

$("addForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const inp = $("newHabit");
  const nome = inp.value.trim();
  if (!nome) return;
  dados.habitos.push({ id: Date.now(), nome, checks: [false, false, false, false, false, false, false] });
  inp.value = "";
  render();
});

$("measureForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const c = parseFloat($("inWaist").value);
  const p = parseFloat($("inWeight").value);
  let mudou = false;
  if (!isNaN(c) && c > 40 && c < 250) { dados.medidas.cintura = c; mudou = true; }
  if (!isNaN(p) && p > 30 && p < 400) { dados.medidas.peso = p; mudou = true; }
  if (!mudou) { aviso("Informe cintura ou peso válidos"); return; }
  const hoje = iso(new Date());
  const ult = dados.historico[dados.historico.length - 1];
  const reg = { data: hoje, cintura: dados.medidas.cintura, peso: dados.medidas.peso };
  if (ult && ult.data === hoje) dados.historico[dados.historico.length - 1] = reg; else dados.historico.push(reg);
  // próximo checkpoint: 15 dias à frente
  const prox = new Date(); prox.setDate(prox.getDate() + 15);
  dados.proximaMedicao = iso(prox);
  $("inWaist").value = ""; $("inWeight").value = "";
  render();
  aviso("Medidas registradas");
});

$("btnReset").onclick = zerarSemana;
$("btnExport").onclick = () => {
  const linhas = ["Habito;Seg;Ter;Qua;Qui;Sex;Sab;Dom;Total_Semana"];
  dados.habitos.forEach((h) => {
    const marca = h.checks.map((c) => (c ? "1" : "0"));
    const nome = /^[=+\-@]/.test(h.nome) ? "'" + h.nome : h.nome; // evita fórmula no Excel
    linhas.push('"' + nome.replace(/"/g, '""') + '";' + marca.join(";") + ";" + marca.filter((x) => x === "1").length);
  });
  const blob = new Blob(["﻿" + linhas.join("\r\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = "habitos_cutting_semanal.csv";
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

/* ---------- toast e confete ---------- */
let toastT;
function aviso(txt) {
  const t = $("toast");
  t.textContent = txt;
  t.classList.add("show");
  clearTimeout(toastT);
  toastT = setTimeout(() => t.classList.remove("show"), 2200);
}

function confete() {
  const cv = $("fx");
  const ctx = cv.getContext("2d");
  const dpr = window.devicePixelRatio || 1;
  cv.width = innerWidth * dpr; cv.height = innerHeight * dpr;
  ctx.scale(dpr, dpr);
  const cores = ["#c6ff3d", "#ffb020", "#ff5a1f", "#f2f6f0"];
  const ps = Array.from({ length: 90 }, () => ({
    x: innerWidth / 2, y: innerHeight * 0.35,
    vx: (Math.random() - 0.5) * 14, vy: -Math.random() * 12 - 4,
    r: Math.random() * 5 + 3, c: cores[(Math.random() * cores.length) | 0], rot: Math.random() * 6,
  }));
  let f = 0;
  (function anim() {
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    ps.forEach((p) => {
      p.x += p.vx; p.y += p.vy; p.vy += 0.4; p.vx *= 0.99; p.rot += 0.2;
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
      ctx.fillStyle = p.c; ctx.fillRect(-p.r, -p.r / 2, p.r * 2, p.r);
      ctx.restore();
    });
    if (++f < 110) requestAnimationFrame(anim); else ctx.clearRect(0, 0, innerWidth, innerHeight);
  })();
}

/* ---------- init ---------- */
render();
// ao voltar para o app em outro dia, recalcula semana e dia atual
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState !== "visible") return;
  const atual = chaveSemana(new Date());
  if (dados.semana !== atual) { dados = carregar(); }
  sel = indiceDia(new Date());
  render();
});
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));
}
