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
  { t: "Treino D", s: "Empurrar leve: peito, ombros e tríceps", c: "D" },
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
  cargas: cargasPadrao(),
  feitos: {},
  ultimoBackup: null,
  medidasBase: { peso: 100, cintura: 108, peito: 114, quadril: 108, ombro: 54, biceps: 41.5, braco: 144, coxa: 66 },
  metaCintura: 90,
  avatar: { pele: 2, semCamiseta: false, ampliar: true, gorro: true, fone: true, barba: true, tatuagem: true, relogio: true, cabelo: 0, camisa: 0, gorroCor: 0 },
  humor: {},
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
let abaAtual = "Hoje";
let fichaSel = FICHA_DO_DIA[sel];
let simCintura = null; // prévia do boneco, não é salva

function ehObj(x) { return !!x && typeof x === "object" && !Array.isArray(x); }
function normalizarAvatar(a) {
  const b = ehObj(a) ? a : {};
  const idx = (v, n, pad) => clampNum(num(v, pad) | 0, 0, n - 1);
  return {
    pele: idx(b.pele, PELES.length, 2), cabelo: idx(b.cabelo, CABELOS.length, 0),
    camisa: idx(b.camisa, CAMISAS.length, 0), gorroCor: idx(b.gorroCor, GORROS.length, 0),
    semCamiseta: !!b.semCamiseta, ampliar: b.ampliar !== false,
    gorro: b.gorro !== false, fone: b.fone !== false, barba: b.barba !== false,
    tatuagem: b.tatuagem !== false, relogio: b.relogio !== false,
  };
}
function clampNum(v, a, b) { return Math.max(a, Math.min(b, v)); }
function num(x, pad) { return typeof x === "number" && isFinite(x) ? x : pad; }

// aceita dados do localStorage ou de um backup: valida, completa o que faltar e descarta lixo
function normalizar(d) {
  const base = PADRAO();
  if (!ehObj(d) || !Array.isArray(d.habitos)) return base;
  const out = {
    semana: typeof d.semana === "string" ? d.semana : base.semana,
    habitos: d.habitos
      .filter((h) => ehObj(h) && typeof h.nome === "string" && h.nome.trim())
      .slice(0, 60)
      .map((h, i) => ({
        id: num(h.id, i + 1),
        nome: h.nome.trim().slice(0, 80),
        checks: Array.from({ length: 7 }, (_, k) => !!(Array.isArray(h.checks) && h.checks[k])),
      })),
    log: {},
    proximaMedicao: /^\d{4}-\d{2}-\d{2}$/.test(d.proximaMedicao) ? d.proximaMedicao : base.proximaMedicao,
    medidas: {},
    historico: [],
    cargas: {},
    feitos: {},
    ultimoBackup: typeof d.ultimoBackup === "string" ? d.ultimoBackup : null,
    medidasBase: {},
    metaCintura: clampNum(num(d.metaCintura, base.metaCintura), 50, 200),
    avatar: normalizarAvatar(d.avatar),
    humor: {},
  };
  Object.keys(base.medidasBase).forEach((k) => { out.medidasBase[k] = num(ehObj(d.medidasBase) ? d.medidasBase[k] : undefined, base.medidasBase[k]); });
  if (ehObj(d.log)) Object.keys(d.log).forEach((k) => { if (/^\d{4}-\d{2}-\d{2}$/.test(k)) out.log[k] = Math.max(0, Math.min(100, num(d.log[k], 0))); });
  Object.keys(base.medidas).forEach((k) => { out.medidas[k] = num(ehObj(d.medidas) ? d.medidas[k] : undefined, base.medidas[k]); });
  if (Array.isArray(d.historico)) {
    out.historico = d.historico
      .filter((r) => ehObj(r) && /^\d{4}-\d{2}-\d{2}$/.test(r.data))
      .slice(-200)
      .map((r) => {
        const o = { data: r.data, cintura: num(r.cintura, 0), peso: num(r.peso, 0) };
        ["peito", "quadril", "ombro", "biceps", "braco", "coxa"].forEach((k) => { if (typeof r[k] === "number" && isFinite(r[k])) o[k] = r[k]; });
        return o;
      });
  } else out.historico = base.historico;
  out.cargas = ehObj(d.cargas) ? {} : base.cargas;
  if (ehObj(d.cargas)) Object.keys(d.cargas).forEach((k) => { if (typeof d.cargas[k] === "string" || typeof d.cargas[k] === "number") out.cargas[k] = String(d.cargas[k]).slice(0, 12); });
  if (ehObj(d.humor)) {
    Object.keys(d.humor).sort().slice(-120).forEach((k) => { if (/^\d{4}-\d{2}-\d{2}$/.test(k) && HUMORES[d.humor[k]]) out.humor[k] = d.humor[k]; });
  }
  if (ehObj(d.feitos)) Object.keys(d.feitos).forEach((k) => { if (d.feitos[k] === true) out.feitos[k] = true; });
  // virou a semana: marcações zeram, o log de % continua guardando a sequência
  const atual = chaveSemana(new Date());
  if (out.semana !== atual) {
    out.habitos.forEach((h) => { h.checks = [false, false, false, false, false, false, false]; });
    out.feitos = {};
    out.semana = atual;
  }
  return out;
}

function carregar() {
  let d = null;
  try { d = JSON.parse(localStorage.getItem(STORAGE_KEY)); } catch (e) { d = null; }
  return normalizar(d);
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
  $("workoutCardio").textContent = "Cardio: " + FICHA[FICHA_DO_DIA[sel]].cardio;
  $("streak").textContent = String(sequencia());
  $("weekAvg").textContent = mediaSemana() + "%";

  renderMissoes();
  renderGrafico();
  renderMatriz();
  renderMedidas();
  if (abaAtual === "Treinos") renderFicha();
  if (abaAtual === "Avatar") renderAvatar();
  if (abaAtual === "Backup") renderBackup();
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
    s += '<line x1="' + padL + '" x2="' + (W - 6) + '" y1="' + y(v) + '" y2="' + y(v) + '" style="stroke:var(--line)" stroke-width="1"/>';
    s += '<text x="' + (padL - 6) + '" y="' + (y(v) + 4) + '" text-anchor="end">' + v + "</text>";
  });
  for (let i = 0; i < 7; i++) {
    const v = pctDia(i);
    const x = padL + i * bw + bw * 0.18;
    const w = bw * 0.64;
    const hh = Math.max(0, (ph * v) / 100);
    const cor = v >= META_CORTE ? "#c6ff3d" : "#4a6b2a";
    s += '<rect class="bar-rect" x="' + x + '" y="' + (y(v)) + '" width="' + w + '" height="' + hh + '" rx="6" fill="' + cor + '"' + (i === sel ? ' style="stroke:var(--text)" stroke-width="1.5"' : "") + "/>";
    if (v > 0) s += '<text x="' + (x + w / 2) + '" y="' + (y(v) - 5) + '" text-anchor="middle" style="fill:var(--text);font-weight:700">' + v + "</text>";
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

/* ---------- abas ---------- */
function irParaAba(nome) {
  abaAtual = nome;
  ["Hoje", "Treinos", "Avatar", "Backup"].forEach((n) => { $("view" + n).hidden = n !== nome; });
  document.querySelectorAll("#tabbar button").forEach((b) => b.classList.toggle("on", b.dataset.tab === nome));
  if (nome === "Treinos") renderFicha();
  if (nome === "Avatar") renderAvatar();
  if (nome === "Backup") renderBackup();
  window.scrollTo({ top: 0, behavior: "smooth" });
}
document.querySelectorAll("#tabbar button").forEach((b) => { b.onclick = () => irParaAba(b.dataset.tab); });
$("btnAbrirFicha").onclick = () => { fichaSel = FICHA_DO_DIA[sel]; irParaAba("Treinos"); };

/* ---------- ficha de treinos ---------- */
function renderFicha() {
  const tabs = $("fichaTabs");
  tabs.innerHTML = "";
  const hojeKey = FICHA_DO_DIA[indiceDia(new Date())];
  ORDEM_FICHA.forEach((k) => {
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = FICHA[k].tab;
    b.className = (k === fichaSel ? "sel" : "") + (k === hojeKey ? " hoje" : "");
    b.onclick = () => { fichaSel = k; renderFicha(); };
    tabs.appendChild(b);
  });

  const f = FICHA[fichaSel];
  const card = $("fichaCard");
  card.innerHTML = "";
  const head = document.createElement("div");
  head.className = "ficha-head";
  head.innerHTML = "<h2></h2><p></p><p class=\"cardio-line\"></p>";
  head.querySelector("h2").textContent = f.titulo;
  head.children[1].textContent = f.sub;
  head.children[2].textContent = "Cardio: " + f.cardio;
  card.appendChild(head);

  f.fases.forEach((fase) => {
    const sec = document.createElement("div");
    sec.className = "fase";
    const h = document.createElement("div");
    h.className = "fase-h";
    h.innerHTML = "<b></b><span></span>";
    h.querySelector("b").textContent = fase.nome;
    h.querySelector("span").textContent = fase.descanso ? "descanso " + fase.descanso : "";
    sec.appendChild(h);
    fase.itens.forEach((it) => sec.appendChild(cartaoExercicio(it)));
    card.appendChild(sec);
  });

  const lim = document.createElement("button");
  lim.type = "button";
  lim.className = "limpar";
  lim.textContent = "Limpar marcações deste treino";
  lim.onclick = () => {
    f.fases.forEach((fase) => fase.itens.forEach((it) => { delete dados.feitos[it.id]; }));
    salvar();
    renderFicha();
  };
  card.appendChild(lim);
  $("protocolo").innerHTML = "";
  PROTOCOLO_DIARIO.forEach(([t, d]) => {
    const div = document.createElement("div");
    div.innerHTML = "<b></b><span></span>";
    div.querySelector("b").textContent = t;
    div.querySelector("span").textContent = d;
    $("protocolo").appendChild(div);
  });
}

function cartaoExercicio(it) {
  const feito = !!dados.feitos[it.id];
  const el = document.createElement("div");
  el.className = "ex" + (feito ? " done" : "");
  el.innerHTML =
    '<div class="ex-top"><button type="button" class="box" aria-label="Marcar como feito">✓</button><span class="ex-name"></span><span class="ex-series"></span></div>' +
    '<p class="ex-note"></p>' +
    '<div class="ex-bottom"><div class="carga"><label>CARGA</label><input type="text" inputmode="decimal" maxlength="12" placeholder="—" /><em></em></div><a class="yt" target="_blank" rel="noopener noreferrer">▶ EXECUÇÃO</a></div>';
  el.querySelector(".ex-name").textContent = it.nome;
  el.querySelector(".ex-series").textContent = it.series;
  el.querySelector(".ex-note").textContent = it.nota;
  el.querySelector("em").textContent = it.un;
  el.querySelector(".yt").href = YT + it.q;
  const box = el.querySelector(".box");
  box.setAttribute("aria-pressed", feito ? "true" : "false");
  box.onclick = () => {
    if (dados.feitos[it.id]) delete dados.feitos[it.id]; else dados.feitos[it.id] = true;
    if (navigator.vibrate) navigator.vibrate(12);
    salvar();
    renderFicha();
  };
  const inp = el.querySelector("input");
  inp.value = dados.cargas[it.id] || "";
  inp.oninput = () => {
    // limpa o que não é número, vírgula ou ponto
    const v = inp.value.replace(/[^0-9.,]/g, "");
    if (v !== inp.value) inp.value = v;
    if (v) dados.cargas[it.id] = v; else delete dados.cargas[it.id];
    salvar();
  };
  inp.onchange = () => aviso("Carga salva: " + it.nome.split(" (")[0] + (inp.value ? " · " + inp.value + " " + it.un : ""));
  return el;
}

/* ---------- boneco ---------- */
const PARTES = [["gorro", "Gorro"], ["fone", "Fone"], ["barba", "Barba"], ["tatuagem", "Tatuagem"], ["relogio", "Relógio"]];
let humorDia = null;   // dia (AAAA-MM-DD) em exibição
let humorPrev = null;  // humor escolhido e ainda não salvo

function ultimos7() {
  const out = [];
  for (let k = 6; k >= 0; k--) { const d = new Date(); d.setDate(d.getDate() - k); out.push(d); }
  return out;
}
function humorDoDia() { return humorPrev || dados.humor[humorDia || iso(new Date())] || "normal"; }

function swatches(id, lista, atual, aoEscolher) {
  const box = $(id);
  box.innerHTML = "";
  lista.forEach((cor, i) => {
    const b = document.createElement("button");
    b.type = "button";
    b.style.background = cor;
    b.className = i === atual ? "sel" : "";
    b.setAttribute("aria-label", id.replace("sw", "") + " " + (i + 1));
    b.onclick = () => { aoEscolher(i); salvar(); renderAvatar(); };
    box.appendChild(b);
  });
}

function renderAvatar() {
  if (!humorDia) humorDia = iso(new Date());
  const ins = calcularInsights(dados);
  const m = simCintura === null ? dados.medidas : Object.assign({}, dados.medidas, { cintura: simCintura });
  const prog = simCintura === null ? ins.progresso : calcularInsights(Object.assign({}, dados, { medidas: m })).progresso;
  const hm = humorDoDia();
  $("avSvg").innerHTML = desenharAvatar(m, dados.medidasBase, Object.assign({}, dados.avatar, { progresso: prog, humor: hm }));
  $("avSvg").parentElement.style.setProperty("--glow", HUMORES[hm].cor);
  $("avStage").textContent = ins.estagio;
  $("avShirt").checked = dados.avatar.semCamiseta;
  $("avAmp").checked = dados.avatar.ampliar;

  // humor: sete últimos dias, escolha e salvar
  const dias = $("humorDays");
  dias.innerHTML = "";
  ultimos7().forEach((d) => {
    const k = iso(d);
    const b = document.createElement("button");
    b.type = "button";
    b.className = "hday" + (k === humorDia ? " sel" : "") + (k === iso(new Date()) ? " today" : "");
    const salvo = dados.humor[k];
    b.innerHTML = "<span></span><i></i>";
    b.querySelector("span").textContent = DIAS_CURTOS[indiceDia(d)];
    b.querySelector("i").textContent = salvo ? HUMORES[salvo].emoji : "·";
    b.onclick = () => { humorDia = k; humorPrev = null; renderAvatar(); };
    dias.appendChild(b);
  });
  const pick = $("humorPick");
  pick.innerHTML = "";
  Object.keys(HUMORES).forEach((k) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = k === hm ? "sel" : "";
    b.innerHTML = "<i></i><span></span>";
    b.querySelector("i").textContent = HUMORES[k].emoji;
    b.querySelector("span").textContent = HUMORES[k].rot;
    b.onclick = () => { humorPrev = k; renderAvatar(); };
    pick.appendChild(b);
  });
  const salvoHoje = dados.humor[humorDia];
  const rotDia = humorDia === iso(new Date()) ? "hoje" : humorDia.split("-").reverse().slice(0, 2).join("/");
  $("humorHint").textContent = humorPrev && humorPrev !== salvoHoje ? "não salvo · " + rotDia : salvoHoje ? "salvo · " + rotDia : "sem humor · " + rotDia;
  $("humorSave").textContent = "SALVAR HUMOR (" + rotDia.toUpperCase() + ")";

  // aparência
  const partes = $("avParts");
  partes.innerHTML = "";
  PARTES.forEach(([k, rot]) => {
    const lb = document.createElement("label");
    lb.className = "sw";
    const inp = document.createElement("input");
    inp.type = "checkbox"; inp.checked = dados.avatar[k];
    inp.onchange = () => { dados.avatar[k] = inp.checked; salvar(); renderAvatar(); };
    const sp = document.createElement("span"); sp.textContent = rot;
    lb.appendChild(inp); lb.appendChild(sp);
    partes.appendChild(lb);
  });
  swatches("swPele", PELES, dados.avatar.pele, (i) => { dados.avatar.pele = i; });
  swatches("swCabelo", CABELOS, dados.avatar.cabelo, (i) => { dados.avatar.cabelo = i; });
  swatches("swCamisa", CAMISAS.map((c) => c.fill), dados.avatar.camisa, (i) => { dados.avatar.camisa = i; });
  swatches("swGorro", GORROS.map((c) => c.fill), dados.avatar.gorroCor, (i) => { dados.avatar.gorroCor = i; });

  const sim = $("avSim");
  const mn = Math.floor(Math.min(dados.metaCintura, dados.medidas.cintura) - 5);
  const mx = Math.ceil(Math.max(dados.medidasBase.cintura, dados.medidas.cintura) + 5);
  sim.min = String(mn); sim.max = String(mx);
  sim.value = String(simCintura === null ? dados.medidas.cintura : simCintura);
  $("avSimVal").textContent = (simCintura === null ? dados.medidas.cintura : simCintura) + " cm" + (simCintura === null ? " (real)" : " (prévia)");

  $("avBar").style.width = Math.round(ins.progresso * 100) + "%";
  if (document.activeElement !== $("avMeta")) $("avMeta").value = dados.metaCintura;
  $("avFalta").textContent = ins.falta > 0 ? "Faltam " + ins.falta + " cm para a meta (" + Math.round(ins.progresso * 100) + "% do caminho)" : "Meta atingida";
  $("avForecast").textContent = ins.previsao;

  const dl = $("avDeltas");
  dl.innerHTML = "";
  [["cintura", "Cintura"], ["peso", "Peso"], ["peito", "Peito"], ["biceps", "Bíceps"], ["coxa", "Coxa"], ["ombro", "Ombro"]].forEach(([k, rot]) => {
    const d = ins.dif(k);
    const el = document.createElement("div");
    el.className = "dl";
    el.innerHTML = "<span></span><b></b>";
    el.querySelector("span").textContent = rot;
    const b = el.querySelector("b");
    b.textContent = (d > 0 ? "+" : "") + d + (k === "peso" ? " kg" : " cm");
    // cintura/peso descendo é bom; os demais subindo é bom
    const bom = k === "cintura" || k === "peso" ? d < 0 : d > 0;
    if (d !== 0) b.className = bom ? "neg" : "pos";
    el.appendChild(b);
    dl.appendChild(el);
  });

  const form = $("avForm");
  if (!form.children.length) {
    CAMPOS_MEDIDA.forEach(([k, rot, un]) => {
      const lb = document.createElement("label");
      lb.textContent = rot + " (" + un + ")";
      const inp = document.createElement("input");
      inp.type = "number"; inp.step = "0.1"; inp.inputMode = "decimal"; inp.id = "mf_" + k;
      lb.appendChild(inp);
      form.appendChild(lb);
    });
  }
  CAMPOS_MEDIDA.forEach(([k]) => { const i = $("mf_" + k); if (document.activeElement !== i) i.value = dados.medidas[k]; });
}

$("humorSave").onclick = () => {
  if (!humorPrev && !dados.humor[humorDia]) { aviso("Escolha um humor primeiro"); return; }
  if (humorPrev) dados.humor[humorDia] = humorPrev;
  humorPrev = null;
  salvar();
  renderAvatar();
  aviso("Humor salvo: " + HUMORES[dados.humor[humorDia]].rot);
};
$("humorClear").onclick = () => { delete dados.humor[humorDia]; humorPrev = null; salvar(); renderAvatar(); aviso("Humor do dia removido"); };

// exporta a aba atual em PDF: o navegador abre a janela de impressão (destino "Salvar como PDF")
function exportarPdf() {
  $("printDate").textContent = "· " + new Date().toLocaleDateString("pt-BR");
  $("printView").textContent = "· " + { Hoje: "Hoje", Treinos: "Treinos", Avatar: "LZ", Backup: "Backup" }[abaAtual];
  aviso("Na janela, escolha “Salvar como PDF”");
  setTimeout(() => window.print(), 350);
}
$("btnPdf").onclick = exportarPdf;
$("btnPdf2").onclick = exportarPdf;
$("avShirt").onchange = (e) => { dados.avatar.semCamiseta = e.target.checked; salvar(); renderAvatar(); };
$("avAmp").onchange = (e) => { dados.avatar.ampliar = e.target.checked; salvar(); renderAvatar(); };
$("avSim").oninput = (e) => { simCintura = parseFloat(e.target.value); renderAvatar(); };
$("avSimReset").onclick = () => { simCintura = null; renderAvatar(); };
$("avMeta").onchange = (e) => {
  const v = parseFloat(e.target.value);
  if (!isNaN(v) && v >= 50 && v <= 200) { dados.metaCintura = v; salvar(); aviso("Meta de cintura: " + v + " cm"); }
  renderAvatar();
};
$("avSave").onclick = () => {
  const novo = Object.assign({}, dados.medidas);
  let erro = null;
  CAMPOS_MEDIDA.forEach(([k, rot]) => {
    const v = parseFloat($("mf_" + k).value);
    if (isNaN(v) || v <= 0 || v > 400) erro = erro || rot;
    else novo[k] = v;
  });
  if (erro) { aviso("Confira o campo: " + erro); return; }
  dados.medidas = novo;
  const hoje = iso(new Date());
  const reg = Object.assign({ data: hoje }, { cintura: novo.cintura, peso: novo.peso, peito: novo.peito, quadril: novo.quadril, ombro: novo.ombro, biceps: novo.biceps, braco: novo.braco, coxa: novo.coxa });
  const ult = dados.historico[dados.historico.length - 1];
  if (ult && ult.data === hoje) dados.historico[dados.historico.length - 1] = reg; else dados.historico.push(reg);
  const prox = new Date(); prox.setDate(prox.getDate() + 15);
  dados.proximaMedicao = iso(prox);
  simCintura = null;
  render();
  aviso("Medidas salvas. O LZ já mudou");
};

/* ---------- backup ---------- */
function montarBackup() {
  return JSON.stringify({ app: "prancheta-de-combate", versao: 2, exportadoEm: new Date().toISOString(), dados }, null, 2);
}
function marcarBackup() {
  dados.ultimoBackup = new Date().toISOString();
  salvar();
  renderBackup();
}
function renderBackup() {
  const u = dados.ultimoBackup ? new Date(dados.ultimoBackup).toLocaleString("pt-BR") : null;
  $("bkLast").textContent = u ? "Último backup exportado: " + u : "Nenhum backup exportado ainda neste aparelho.";
}
function importarTexto(txt) {
  let obj;
  try { obj = JSON.parse(txt); } catch (e) { aviso("Arquivo inválido: não é um backup"); return; }
  const payload = ehObj(obj) && obj.app === "prancheta-de-combate" ? obj.dados : null;
  if (!ehObj(payload) || !Array.isArray(payload.habitos)) { aviso("Arquivo inválido: não é um backup da Prancheta"); return; }
  const novo = normalizar(payload);
  if (!confirm("Substituir TODOS os dados deste aparelho pelo backup (" + novo.habitos.length + " metas)? Isso não pode ser desfeito.")) return;
  dados = novo;
  salvar();
  render();
  aviso("Backup importado");
}

$("btnBackupExport").onclick = () => {
  const blob = new Blob([montarBackup()], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = "prancheta-backup-" + iso(new Date()) + ".json";
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  marcarBackup();
  aviso("Backup exportado");
};
$("btnBackupImport").onclick = () => $("fileImport").click();
$("fileImport").onchange = (e) => {
  const f = e.target.files && e.target.files[0];
  e.target.value = "";
  if (!f) return;
  if (f.size > 2 * 1024 * 1024) { aviso("Arquivo grande demais"); return; }
  const r = new FileReader();
  r.onload = () => importarTexto(String(r.result));
  r.onerror = () => aviso("Não consegui ler o arquivo");
  r.readAsText(f);
};
$("btnBackupCopy").onclick = async () => {
  const txt = montarBackup();
  try { await navigator.clipboard.writeText(txt); marcarBackup(); aviso("Código copiado. Cole no outro aparelho"); }
  catch (e) { $("bkPaste").value = txt; $("bkPaste").select(); aviso("Selecione e copie o texto abaixo"); }
};
$("btnBackupPaste").onclick = () => {
  const t = $("bkPaste").value.trim();
  if (!t) { aviso("Cole o código primeiro"); return; }
  importarTexto(t);
  $("bkPaste").value = "";
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
