// Number line problems. Only the tests import nlHints.
import { MAX, t, rnd, pick, fmt } from "../common.js";

// ---------- number line ----------

const NL_SCALES = [[1, 10], [10, 10], [100, 10], [1000, 10], [10000, 10], [50, 10], [500, 10], [5000, 10],
  [200, 5], [2000, 5], [20000, 5], [250, 4], [2500, 4], [25000, 4]];

function nlConfig() {
  const [unit, perSeg] = pick(NL_SCALES);
  const ticks = perSeg * 2, labelStep = unit * perSeg, span = unit * ticks;
  const limit = unit >= 1000 ? MAX : 100000;
  const start = rnd(0, Math.floor((limit - span) / labelStep)) * labelStep;
  return { start, unit, perSeg, ticks, labelStep };
}

function marker(x, y, color, label) {
  return `<line x1="${x}" y1="${y - 50}" x2="${x}" y2="${y - 22}" stroke="${color}" stroke-width="3"/>` +
    `<polygon points="${x - 7},${y - 26} ${x + 7},${y - 26} ${x},${y - 15}" fill="${color}"/>` +
    `<text x="${x}" y="${y - 56}" text-anchor="middle" font-size="18" font-weight="bold" fill="${color}">${label}</text>`;
}

export function numberLineSvg(c, o = {}) {
  const L = 40, R = 640, y = 78, step = (R - L) / c.ticks;
  const x = i => (L + i * step).toFixed(1);
  let s = `<svg class="nl" viewBox="0 0 700 120" xmlns="http://www.w3.org/2000/svg" font-family="Helvetica, Arial">`;
  s += `<line x1="${L - 15}" y1="${y}" x2="${R + 30}" y2="${y}" stroke="#222" stroke-width="2.5"/>`;
  s += `<polygon points="${R + 30},${y - 6} ${R + 42},${y} ${R + 30},${y + 6}" fill="#222"/>`;
  for (let i = 0; i <= c.ticks; i++) {
    const major = i % c.perSeg === 0, h = major ? 14 : 8;
    s += `<line x1="${x(i)}" y1="${y - h}" x2="${x(i)}" y2="${y + h}" stroke="#222" stroke-width="${major ? 2.2 : 1.4}"/>`;
    if (major) s += `<text x="${x(i)}" y="${y + 36}" text-anchor="middle" font-size="17">${fmt(c.start + i * c.unit)}</text>`;
  }
  for (const m of o.marks || []) s += marker(x(m.i), y, m.color, m.label);
  if (o.clickable) {
    for (let i = 0; i <= c.ticks; i++) {
      s += `<rect data-tick="${i}" x="${(L + i * step - step / 2).toFixed(1)}" y="${y - 60}" width="${step.toFixed(1)}" height="80" fill="transparent" style="cursor:pointer"/>`;
    }
  }
  return s + "</svg>";
}

export function nlHints(c, k) {
  const li = Math.round(k / c.perSeg) * c.perSeg;
  const lv = c.start + li * c.unit;
  const d = k - li, ad = Math.abs(d), sign = d > 0 ? "+" : "−";
  return [
    t(`Von ${fmt(c.start)} bis ${fmt(c.start + c.labelStep)} sind es ${c.perSeg} kleine Schritte. Wie viel ist <b>ein</b> Schritt wert?`,
      `From ${fmt(c.start)} to ${fmt(c.start + c.labelStep)} there are ${c.perSeg} small steps. How much is <b>one</b> step worth?`),
    t(`${fmt(c.labelStep)} : ${c.perSeg} = ${fmt(c.unit)}. Ein kleiner Schritt ist ${fmt(c.unit)} wert.`,
      `${fmt(c.labelStep)} : ${c.perSeg} = ${fmt(c.unit)}. One small step is worth ${fmt(c.unit)}.`),
    t(`Die Stelle ist ${ad} ${ad === 1 ? "Schritt" : "Schritte"} ${d > 0 ? "nach" : "vor"} ${fmt(lv)}: ${fmt(lv)} ${sign} ${ad} · ${fmt(c.unit)} = ${fmt(lv + d * c.unit)}`,
      `The place is ${ad} ${ad === 1 ? "step" : "steps"} ${d > 0 ? "after" : "before"} ${fmt(lv)}: ${fmt(lv)} ${sign} ${ad} · ${fmt(c.unit)} = ${fmt(lv + d * c.unit)}`),
  ];
}

function innerTicks(c) {
  const ks = [];
  for (let i = 1; i < c.ticks; i++) if (i % c.perSeg) ks.push(i);
  return ks;
}

// Steps of 1, 10, 100, ... with 10 ticks are easy to count. Steps such as 200, 250 or 50 need a calculation first.
function nlLevel(c) {
  return c.perSeg === 10 && [1, 10, 100, 1000, 10000].includes(c.unit) ? 2 : 3;
}

export function genNlRead() {
  const c = nlConfig(), k = pick(innerTicks(c)), v = c.start + k * c.unit;
  return {
    type: "number",
    level: nlLevel(c),
    prompt: t("Welche Zahl zeigt der Pfeil?", "Which number does the arrow show?"),
    visual: numberLineSvg(c, { marks: [{ i: k, color: "#c0392b", label: "?" }] }),
    fields: [{ label: null, answer: v }],
    hints: nlHints(c, k),
    solution: t(`Der Pfeil zeigt <b>${fmt(v)}</b>.`, `The arrow shows <b>${fmt(v)}</b>.`),
  };
}

export function genNlPlace() {
  const c = nlConfig(), k = pick(innerTicks(c)), v = c.start + k * c.unit;
  return {
    type: "line", line: c, answer: k,
    level: nlLevel(c),
    prompt: t(`Klicke auf die Stelle von <b>${fmt(v)}</b>.`, `Click on the place of <b>${fmt(v)}</b>.`),
    hints: nlHints(c, k),
    solution: t(`${fmt(v)} ist beim grünen Pfeil.`, `${fmt(v)} is at the green arrow.`),
  };
}

export function genNlMiddle() {
  const p = pick([10, 100, 1000, 10000]);
  const d = pick([1, 2, 4, 6, 8, 10, 20]) * p;
  const a = rnd(0, 99) * p, b = a + d, mid = a + d / 2;
  if (b > MAX) return null;
  return {
    type: "number",
    level: 3,
    prompt: t("Welche Zahl liegt genau in der Mitte?", "Which number is exactly in the middle?"),
    visual: `<div class="bigtext">${fmt(a)} <span class="slot">?</span> ${fmt(b)}</div>`,
    fields: [{ label: null, answer: mid }],
    hints: [
      t(`Wie gross ist der Abstand? ${fmt(b)} − ${fmt(a)} = ?`, `How big is the distance? ${fmt(b)} − ${fmt(a)} = ?`),
      t(`Der Abstand ist ${fmt(d)}. Die Hälfte davon ist ${fmt(d / 2)}.`, `The distance is ${fmt(d)}. Half of it is ${fmt(d / 2)}.`),
      t(`${fmt(a)} + ${fmt(d / 2)} = ${fmt(mid)}`, `${fmt(a)} + ${fmt(d / 2)} = ${fmt(mid)}`),
    ],
    solution: t(`Die Mitte ist <b>${fmt(mid)}</b>.`, `The middle is <b>${fmt(mid)}</b>.`),
  };
}

export function genNlSteps() {
  const s = pick([5, 10, 50, 100, 250, 500, 1000, 2000, 5000, 10000, 20000, 25000]);
  const step = pick([s, s, -s]);
  let pow = 10;
  while (pow < s * 4) pow *= 10;
  const base = rnd(1, 9) * pow + rnd(0, 9) * pow * 10;
  const k = rnd(1, 3);
  const start = step > 0 ? base - k * s : base + k * s;
  const terms = [0, 1, 2, 3, 4].map(i => start + i * step);
  if (terms.some(x => x < 0 || x > MAX)) return null;
  const sign = step > 0 ? "+" : "−";
  return {
    type: "number",
    level: 3,
    prompt: t("Zähle in Schritten weiter.", "Continue counting in steps."),
    visual: `<div class="bigtext">${terms.slice(0, 3).map(fmt).join(", ")}, <span class="slot">?</span>, <span class="slot">?</span></div>`,
    fields: [{ label: t("nächste Zahl", "next number"), answer: terms[3] }, { label: t("übernächste Zahl", "the number after that"), answer: terms[4] }],
    hints: [
      t(`Wie gross ist der Schritt? Vergleiche ${fmt(terms[0])} und ${fmt(terms[1])}.`, `How big is the step? Compare ${fmt(terms[0])} and ${fmt(terms[1])}.`),
      t(`Jeder Schritt ist ${sign} ${fmt(s)}.`, `Each step is ${sign} ${fmt(s)}.`),
      t(`${fmt(terms[2])} ${sign} ${fmt(s)} = ${fmt(terms[3])}`, `${fmt(terms[2])} ${sign} ${fmt(s)} = ${fmt(terms[3])}`),
    ],
    solution: t(`Es geht weiter mit <b>${fmt(terms[3])}</b> und <b>${fmt(terms[4])}</b>.`, `It continues with <b>${fmt(terms[3])}</b> and <b>${fmt(terms[4])}</b>.`),
  };
}
