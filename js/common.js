// Shared helpers and units of measure.

export const NNBSP = "\u202F";
export const MAX = 1000000;

export function t(de, en) { return { de, en }; }
export function rnd(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
export function pick(arr) { return arr[rnd(0, arr.length - 1)]; }
export function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = rnd(0, i); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
export function perms(a) {
  if (a.length <= 1) return [a.slice()];
  const out = [];
  a.forEach((v, i) => { for (const p of perms(a.slice(0, i).concat(a.slice(i + 1)))) out.push([v, ...p]); });
  return out;
}
export function digitSum(n) { return String(n).split("").reduce((s, d) => s + Number(d), 0); }

// Swiss school style: 4998 (no gap), 15 188 (gap from five digits).
export function fmt(n) {
  if (n < 10000) return String(n);
  return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, NNBSP);
}
export function parseNum(s) {
  if (s == null) return NaN;
  const c = String(s).replace(/[\s'’.,\u202F\u00A0]/g, "");
  return /^\d+$/.test(c) ? Number(c) : NaN;
}

export const PLACES = [t("Einer", "ones"), t("Zehner", "tens"), t("Hunderter", "hundreds"), t("Tausender", "thousands"),
  t("Zehntausender", "ten thousands"), t("Hunderttausender", "hundred thousands")];
export const STELLE = [t("Einerstelle", "ones place"), t("Zehnerstelle", "tens place"), t("Hunderterstelle", "hundreds place"),
  t("Tausenderstelle", "thousands place"), t("Zehntausenderstelle", "ten thousands place"), t("Hunderttausenderstelle", "hundred thousands place")];
export const SHORT = ["E", "Z", "H", "T", "ZT", "HT"];
export const NEIGH = [null, t("Nachbarzehner", "neighbouring tens"), t("Nachbarhunderter", "neighbouring hundreds"),
  t("Nachbartausender", "neighbouring thousands"), t("Nachbarzehntausender", "neighbouring ten thousands")];

// ---------- units of measure (lengths and times) ----------

export const NBSP = "\u00A0";
export const SLOT = `<span class="slot">?</span>`;

// "5 m", with a space that does not break.
export function unitText(n, unit) { return `${fmt(n)}${NBSP}${unit}`; }

// Two units as the book writes them. A part that is 0 is left out: 8 m 80 cm, 10 m, 45 cm.
export function pairText(big, bigUnit, small, smallUnit) {
  if (big && small) return `${unitText(big, bigUnit)} ${unitText(small, smallUnit)}`;
  return big ? unitText(big, bigUnit) : unitText(small, smallUnit);
}

// The singular after 1: "1 Minute", "5 Minuten".
export function plural(n, de1, de, en1, en) { return t(`${n} ${n === 1 ? de1 : de}`, `${n} ${n === 1 ? en1 : en}`); }

export function clamp(v, lo, hi) { return Math.min(hi, Math.max(lo, v)); }

// A problem that changes the unit, for lengths and for times. f small units make one big unit.
export function convertProblem(big, small, f, maxBig) {
  const kind = pick(["toSmall", "toBig", "mixToSmall", "mixToSmall", "toMix", "toMix"]);
  const b = rnd(1, maxBig);
  let s = 0;
  // A small part below f / 10 is a trap: 2 m 5 cm is 205 cm, not 25 cm.
  if (kind === "mixToSmall" || kind === "toMix") s = f >= 100 && Math.random() < 0.4 ? rnd(1, 9) : rnd(1, f - 1);
  const n = b * f + s;
  const rule = `1${NBSP}${big} = ${unitText(f, small)}`;
  const hints = [t(rule, rule)];
  let left, right, answer, fields;
  if (kind === "toSmall" || kind === "mixToSmall") {
    left = pairText(b, big, s, small);
    right = `${SLOT} ${small}`;
    answer = unitText(n, small);
    fields = [{ label: null, unit: small, answer: n }];
    const step = `${unitText(b, big)} = ${b} · ${unitText(f, small)} = ${unitText(b * f, small)}`;
    hints.push(t(step, step));
    if (s && s < f / 10) {
      hints.push(t(`Achtung: Es sind nur ${unitText(s, small)}. Rechne ${fmt(b * f)} + ${s} = ${fmt(n)}, nicht ${b}${s}.`,
        `Careful: it is only ${unitText(s, small)}. Calculate ${fmt(b * f)} + ${s} = ${fmt(n)}, not ${b}${s}.`));
    } else if (s) {
      const sum = `${unitText(b * f, small)} + ${unitText(s, small)} = ${unitText(n, small)}`;
      hints.push(t(sum, sum));
    }
  } else {
    left = unitText(n, small);
    right = kind === "toBig" ? `${SLOT} ${big}` : `${SLOT} ${big} ${SLOT} ${small}`;
    answer = pairText(b, big, s, small);
    fields = [{ label: null, unit: big, answer: b }];
    if (kind === "toMix") fields.push({ label: null, unit: small, answer: s });
    hints.push(t(`Wie oft passen ${unitText(f, small)} ganz in ${unitText(n, small)}? ${b === 1 ? "Einmal" : `${b}-mal`}. Das gibt ${unitText(b, big)}.`,
      `How many times does ${unitText(f, small)} fit into ${unitText(n, small)}? ${b === 1 ? "Once" : `${b} times`}. That gives ${unitText(b, big)}.`));
    if (s) {
      hints.push(t(`Es bleiben ${unitText(n, small)} − ${unitText(b * f, small)} = ${unitText(s, small)}.`,
        `${unitText(n, small)} − ${unitText(b * f, small)} = ${unitText(s, small)} are left.`));
    }
  }
  return {
    type: "number",
    level: kind === "toSmall" || kind === "toBig" ? 2 : 3,
    prompt: t("Rechne um.", "Convert."),
    visual: `<div class="bigtext">${left} = ${right}</div>`,
    fields,
    hints,
    solution: t(`${left} = <b>${answer}</b>`, `${left} = <b>${answer}</b>`),
  };
}
