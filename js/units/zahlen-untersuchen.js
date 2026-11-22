// Problems that investigate numbers.
import { NNBSP, t, rnd, pick, shuffle, perms, digitSum, fmt, PLACES, STELLE, SHORT, NEIGH } from "../common.js";

// ---------- investigating numbers ----------

export function genEvenOdd() {
  const nums = [];
  while (nums.length < 6) { const n = rnd(1000, 999999); if (!nums.includes(n)) nums.push(n); }
  const even = Math.random() < 0.6;
  const answer = nums.map((n, i) => ((n % 2 === 0) === even ? i : -1)).filter(i => i >= 0);
  if (answer.length === 0 || answer.length === 6) return null;
  return {
    type: "multi",
    options: nums.map(fmt), answer,
    level: 2,
    prompt: even ? t("Klicke alle <b>geraden</b> Zahlen an.", "Click all the <b>even</b> numbers.")
      : t("Klicke alle <b>ungeraden</b> Zahlen an.", "Click all the <b>odd</b> numbers."),
    hints: [t("Schau nur auf die letzte Ziffer (die Einer).", "Look only at the last digit (the ones)."),
      t("Gerade Zahlen enden auf 0, 2, 4, 6 oder 8. Ungerade Zahlen enden auf 1, 3, 5, 7 oder 9.", "Even numbers end in 0, 2, 4, 6 or 8. Odd numbers end in 1, 3, 5, 7 or 9.")],
    solution: t(`${even ? "Gerade" : "Ungerade"}: <b>${answer.map(i => fmt(nums[i])).join(", ")}</b>`, `${even ? "Even" : "Odd"}: <b>${answer.map(i => fmt(nums[i])).join(", ")}</b>`),
  };
}

function highlightDigit(n, idx) {
  const s = String(n);
  let out = "";
  for (let i = 0; i < s.length; i++) {
    if (i > 0 && s.length >= 5 && (s.length - i) % 3 === 0) out += NNBSP;
    out += i === idx ? `<span class="hl">${s[i]}</span>` : s[i];
  }
  return out;
}

export function genDigitValue() {
  const n = rnd(10000, 999999), s = String(n);
  const idxs = [...s].map((d, i) => (d !== "0" ? i : -1)).filter(i => i >= 0);
  const idx = pick(idxs), p = s.length - 1 - idx, d = Number(s[idx]), v = d * 10 ** p;
  return {
    type: "number",
    level: 2,
    prompt: t("Welchen Wert hat die rote Ziffer?", "What is the value of the red digit?"),
    visual: `<div class="bigtext">${highlightDigit(n, idx)}</div>`,
    fields: [{ label: null, answer: v }],
    hints: [t(`Die rote Ziffer steht an der ${STELLE[p].de}.`, `The red digit is in the ${STELLE[p].en}.`),
      t(`${d} ${PLACES[p].de} = ?`, `${d} ${PLACES[p].en} = ?`)],
    solution: t(`${d} ${PLACES[p].de} = <b>${fmt(v)}</b>`, `${d} ${PLACES[p].en} = <b>${fmt(v)}</b>`),
  };
}

function placeTable(n) {
  const s = String(n).padStart(6, " ");
  return `<table class="pt"><tr>${["HT", "ZT", "T", "H", "Z", "E"].map(h => `<td><b>${h}</b></td>`).join("")}</tr>` +
    `<tr>${[...s].map(c => `<td>${c.trim()}</td>`).join("")}</tr></table>`;
}

export function genPlaceBuild() {
  const k = rnd(2, 4);
  const places = shuffle([0, 1, 2, 3, 4, 5]).slice(0, k);
  const parts = places.map(p => ({ p, d: rnd(1, 9) }));
  const sorted = Math.random() < 0.6;
  const ordered = sorted ? parts.slice().sort((a, b) => b.p - a.p) : parts;
  const ans = parts.reduce((s, x) => s + x.d * 10 ** x.p, 0);
  const expr = ordered.map(x => `${x.d} ${SHORT[x.p]}`).join(" + ");
  return {
    type: "number",
    level: sorted && k === 2 ? 2 : 3,
    prompt: t("Schreibe als Zahl.", "Write as a number."),
    visual: `<div class="bigtext">${expr} = <span class="slot">?</span></div>`,
    fields: [{ label: null, answer: ans }],
    hints: [t("Denke an die Stellenwerttafel: HT | ZT | T | H | Z | E. Schreibe jede Ziffer an ihren Platz.",
      "Think of the place value chart: HT | ZT | T | H | Z | E (hundred thousands, ten thousands, thousands, hundreds, tens, ones). Write each digit in its place."),
    t("Leere Stellen bekommen eine 0. Achtung auf die Reihenfolge!", "Empty places get a 0. Watch the order!")],
    solution: t(`${expr} = <b>${fmt(ans)}</b>${placeTable(ans)}`, `${expr} = <b>${fmt(ans)}</b>${placeTable(ans)}`),
  };
}

export function genDigitSum() {
  if (Math.random() < 0.65) {
    const n = rnd(1000, 999999), q = digitSum(n);
    return {
      type: "number",
      level: String(n).length <= 4 ? 2 : 3,
      prompt: t(`Wie gross ist die Quersumme von <b>${fmt(n)}</b>?`, `What is the digit sum (Quersumme) of <b>${fmt(n)}</b>?`),
      fields: [{ label: null, answer: q }],
      hints: [t("Die Quersumme ist die Summe aller Ziffern. Beispiel: 2031 → 2 + 0 + 3 + 1 = 6.", "The digit sum is the sum of all digits. Example: 2031 → 2 + 0 + 3 + 1 = 6."),
        t(`Rechne: ${String(n).split("").join(" + ")}`, `Calculate: ${String(n).split("").join(" + ")}`)],
      solution: t(`${String(n).split("").join(" + ")} = <b>${q}</b>`, `${String(n).split("").join(" + ")} = <b>${q}</b>`),
    };
  }
  const s = rnd(2, 30), smallest = Math.random() < 0.5;
  const found = [];
  for (let n = 1000; n <= 9999; n++) if (digitSum(n) === s) found.push(n);
  const ans = smallest ? found[0] : found[found.length - 1];
  return {
    type: "number",
    level: 4,
    prompt: t(`Finde die <b>${smallest ? "kleinste" : "grösste"}</b> vierstellige Zahl mit der Quersumme ${s}.`,
      `Find the <b>${smallest ? "smallest" : "largest"}</b> four-digit number with the digit sum ${s}.`),
    fields: [{ label: null, answer: ans }],
    hints: smallest
      ? [t("Vorne möglichst kleine Ziffern (die erste Ziffer mindestens 1). Hinten möglichst grosse Ziffern (höchstens 9).", "Put the smallest possible digits at the front (the first digit at least 1). Put the largest possible digits at the end (at most 9).")]
      : [t("Vorne möglichst grosse Ziffern (höchstens 9). Hinten bleiben Nullen.", "Put the largest possible digits at the front (at most 9). Zeros go at the end.")],
    solution: t(`<b>${ans}</b>, denn ${String(ans).split("").join(" + ")} = ${s}`, `<b>${ans}</b>, because ${String(ans).split("").join(" + ")} = ${s}`),
  };
}

export function genDivisible() {
  const z = rnd(0, 4);
  let core = rnd(1, 999);
  if (core % 10 === 0) return null;
  const n = core * 10 ** z;
  if (n > 999999 || n < 100) return null;
  const answer = [0, 1, 2].filter(i => z >= i + 1);
  const opts = [": 10", ": 100", ": 1000"];
  return {
    type: "multi", options: opts, answer, allowEmpty: true,
    level: 1,
    prompt: t(`Durch welche Zahlen kannst du <b>${fmt(n)}</b> ohne Rest teilen? Klicke alle richtigen an. Es kann auch keine sein.`,
      `Which numbers can you divide <b>${fmt(n)}</b> by without a remainder? Click all the right ones. It can also be none.`),
    hints: [t("Zähle die Nullen am Ende der Zahl.", "Count the zeros at the end of the number."),
      t("1 Null am Ende → durch 10. 2 Nullen → durch 10 und 100. 3 Nullen → durch 10, 100 und 1000.", "1 zero at the end → by 10. 2 zeros → by 10 and 100. 3 zeros → by 10, 100 and 1000.")],
    solution: answer.length
      ? t(`${fmt(n)} hat ${z} Null(en) am Ende. Teilbar durch <b>${answer.map(i => fmt(10 ** (i + 1))).join(", ")}</b>.`, `${fmt(n)} has ${z} zero(s) at the end. Divisible by <b>${answer.map(i => fmt(10 ** (i + 1))).join(", ")}</b>.`)
      : t(`${fmt(n)} hat keine Null am Ende: <b>keine</b>.`, `${fmt(n)} has no zero at the end: <b>none</b>.`),
  };
}

export function genReverse() {
  const a = rnd(1, 9), b = rnd(1, 9);
  if (a === b) return null;
  const x = 10 * a + b, y = 10 * b + a, big = Math.max(x, y), small = Math.min(x, y), d = big - small;
  return {
    type: "number",
    level: 2,
    prompt: t("Umkehrzahlen: Rechne die grosse Zahl minus die kleine Zahl.", "Reversed numbers: calculate the larger number minus the smaller number."),
    visual: `<div class="bigtext">${big} − ${small} = <span class="slot">?</span></div>`,
    fields: [{ label: null, answer: d }],
    hints: [t(`Rechne in zwei Schritten: ${big} − ${small - (small % 10)} = ${big - (small - (small % 10))}, dann noch − ${small % 10}.`,
      `Calculate in two steps: ${big} − ${small - (small % 10)} = ${big - (small - (small % 10))}, then − ${small % 10}.`)],
    solution: t(`${big} − ${small} = <b>${d}</b>. Das ist ${d / 9} · 9. Bei Umkehrzahlen ist das Ergebnis immer in der 9er-Reihe!`,
      `${big} − ${small} = <b>${d}</b>. That is ${d / 9} · 9. With reversed numbers the answer is always in the 9 times table!`),
  };
}

export function genRiddle() {
  const kind = pick(["same", "neigh", "mid", "digits", "qs"]);
  let prompt, ans, hints;
  if (kind === "same") {
    const L = rnd(4, 5), d = rnd(1, 9), X = d * 10 ** (L - 1), Y = (d + 1) * 10 ** (L - 1);
    const found = [];
    for (let n = X + 1; n < Y; n++) if (new Set(String(n)).size === 1) found.push(n);
    if (found.length !== 1) return null;
    ans = found[0];
    prompt = t(`Ich bin ${L === 4 ? "vierstellig" : "fünfstellig"} und liege zwischen ${fmt(X)} und ${fmt(Y)}. Alle meine Ziffern sind gleich.`,
      `I have ${L === 4 ? "four" : "five"} digits and I am between ${fmt(X)} and ${fmt(Y)}. All my digits are the same.`);
    hints = [t(`Alle Zahlen zwischen ${fmt(X)} und ${fmt(Y)} beginnen mit ${d}.`, `All numbers between ${fmt(X)} and ${fmt(Y)} start with ${d}.`)];
  } else if (kind === "neigh") {
    const pi = pick([2, 3, 4]), p = 10 ** pi, n = rnd(1000, 999999);
    if (n % p === 0) return null;
    const big = Math.random() < 0.5, lower = Math.floor(n / p) * p;
    ans = big ? lower + p : lower;
    const enName = ["", "", "hundred", "thousand", "ten thousand"][pi];
    prompt = t(`Ich bin der ${big ? "grössere" : "kleinere"} ${NEIGH[pi].de} von ${fmt(n)}.`, `I am the ${big ? "larger" : "smaller"} neighbouring ${enName} of ${fmt(n)}.`);
    hints = [t(`Schau auf die ${STELLE[pi].de}. Alle Ziffern rechts davon werden 0.`, `Look at the ${STELLE[pi].en}. All digits to the right of it become 0.`)];
  } else if (kind === "mid") {
    const p = pick([100, 1000, 10000]), a = rnd(1, 90) * p, b = a + pick([1, 2, 4]) * p;
    ans = (a + b) / 2;
    prompt = t(`Ich liege genau in der Mitte zwischen ${fmt(a)} und ${fmt(b)}.`, `I am exactly in the middle between ${fmt(a)} and ${fmt(b)}.`);
    hints = [t(`Der Abstand ist ${fmt(b - a)}. Die Hälfte davon ist ${fmt((b - a) / 2)}.`, `The distance is ${fmt(b - a)}. Half of it is ${fmt((b - a) / 2)}.`)];
  } else if (kind === "digits") {
    const digs = shuffle([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]).slice(0, 4).sort((x, y) => x - y);
    const even = Math.random() < 0.5, largest = Math.random() < 0.5;
    const cands = perms(digs).filter(p => p[0] !== 0).map(p => Number(p.join(""))).filter(n => (n % 2 === 0) === even);
    if (cands.length === 0) return null;
    ans = largest ? Math.max(...cands) : Math.min(...cands);
    prompt = t(`Meine Ziffern sind ${digs.join(", ")} (jede genau einmal). Ich bin die ${largest ? "grösste" : "kleinste"} ${even ? "gerade" : "ungerade"} Zahl.`,
      `My digits are ${digs.join(", ")} (each exactly once). I am the ${largest ? "largest" : "smallest"} ${even ? "even" : "odd"} number.`);
    hints = [t(`Wähle zuerst die letzte Ziffer: Eine ${even ? "gerade" : "ungerade"} Zahl endet auf ${even ? "0, 2, 4, 6 oder 8" : "1, 3, 5, 7 oder 9"}.`,
      `First choose the last digit: an ${even ? "even" : "odd"} number ends in ${even ? "0, 2, 4, 6 or 8" : "1, 3, 5, 7 or 9"}.`),
    t(`Ordne dann die anderen Ziffern so ${largest ? "gross" : "klein"} wie möglich. Die 0 darf nicht vorne stehen.`,
      `Then put the other digits in order to make the number as ${largest ? "large" : "small"} as possible. 0 cannot be first.`)];
  } else {
    const X = rnd(100, 99999) * 10, c = X + rnd(1, 9), s = digitSum(c);
    ans = c;
    prompt = t(`Ich liege zwischen ${fmt(X)} und ${fmt(X + 10)}. Meine Quersumme ist ${s}.`, `I am between ${fmt(X)} and ${fmt(X + 10)}. My digit sum is ${s}.`);
    hints = [t(`Zwischen ${fmt(X)} und ${fmt(X + 10)} ändert sich nur die Einerziffer.`, `Between ${fmt(X)} and ${fmt(X + 10)} only the ones digit changes.`),
      t(`Die Quersumme von ${fmt(X)} ist ${digitSum(X)}. Wie viel fehlt bis ${s}?`, `The digit sum of ${fmt(X)} is ${digitSum(X)}. How much is missing to ${s}?`)];
  }
  return {
    type: "number",
    level: { same: 3, neigh: 3, mid: 3, digits: 4, qs: 4 }[kind],
    prompt: t(`Wer bin ich? ${prompt.de}`, `Who am I? ${prompt.en}`),
    fields: [{ label: null, answer: ans }],
    hints,
    solution: t(`Ich bin <b>${fmt(ans)}</b>.`, `I am <b>${fmt(ans)}</b>.`),
  };
}
