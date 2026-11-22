// Problems that put numbers in order.
import { MAX, t, rnd, pick, shuffle, perms, fmt, PLACES, STELLE, NEIGH } from "../common.js";

// ---------- ordering numbers ----------

function compareHint(a, b) {
  const sa = String(a), sb = String(b);
  if (sa.length !== sb.length) {
    return t(`${fmt(a)} hat ${sa.length} Stellen, ${fmt(b)} hat ${sb.length} Stellen. Die Zahl mit mehr Stellen ist grösser.`,
      `${fmt(a)} has ${sa.length} digits, ${fmt(b)} has ${sb.length} digits. The number with more digits is larger.`);
  }
  if (a === b) return t("Beide Zahlen sind gleich gross.", "Both numbers are the same.");
  let i = 0;
  while (sa[i] === sb[i]) i++;
  const place = sa.length - 1 - i;
  return t(`Beide Zahlen haben ${sa.length} Stellen. Vergleiche von links. Der erste Unterschied ist bei den ${PLACES[place].de}n: ${sa[i]} und ${sb[i]}.`,
    `Both numbers have ${sa.length} digits. Compare from the left. The first difference is in the ${PLACES[place].en}: ${sa[i]} and ${sb[i]}.`);
}

export function genCompare() {
  const kind = pick(["perm", "perm", "len", "close", "expr"]);
  let a, b, right;
  if (kind === "perm") {
    const len = rnd(4, 6);
    const digs = [rnd(1, 9)];
    while (digs.length < len) digs.push(rnd(0, 9));
    a = Number(digs.join(""));
    const p = shuffle(digs);
    if (p[0] === 0) return null;
    b = Number(p.join(""));
    if (a === b) return null;
  } else if (kind === "len") {
    const L = rnd(3, 5);
    a = rnd(8 * 10 ** (L - 1), 10 ** L - 1);
    b = rnd(10 ** L, 2 * 10 ** L - 1);
    if (Math.random() < 0.5) [a, b] = [b, a];
  } else if (kind === "close") {
    a = rnd(1000, 999000);
    b = a + pick([1, -1, 10, -10, 100, -100, 1000, -1000, 9, -9]);
  } else {
    const m = rnd(3, 5), n = rnd(1, m - 1);
    const x = rnd(1, 9) * 10 ** m, y = rnd(1, 9) * 10 ** n;
    b = x + y;
    a = pick([b, b, b + 10 ** n, b - 10 ** n, b + 10 ** m]);
    right = `${fmt(x)} + ${fmt(y)}`;
  }
  if (a < 0 || b < 0 || a > MAX || b > MAX) return null;
  const answer = a < b ? "<" : a > b ? ">" : "=";
  const hints = [];
  if (right) hints.push(t(`Rechne zuerst die rechte Seite aus: ${right} = ${fmt(b)}.`, `First calculate the right side: ${right} = ${fmt(b)}.`));
  hints.push(compareHint(a, b));
  hints.push(t("Die Spitze des Zeichens zeigt immer zur kleineren Zahl: 3 &lt; 5 und 5 &gt; 3.",
    "The point of the sign always points to the smaller number: 3 &lt; 5 and 5 &gt; 3."));
  const sym = { "<": "&lt;", ">": "&gt;", "=": "=" }[answer];
  return {
    type: "choice",
    level: { len: 1, perm: 2, close: 2, expr: 3 }[kind],
    prompt: t("Welches Zeichen passt: &lt;, &gt; oder =?", "Which sign is right: &lt;, &gt; or =?"),
    visual: `<div class="bigtext">${fmt(a)} <span class="slot">?</span> ${right || fmt(b)}</div>`,
    options: [{ label: "&lt;", value: "<" }, { label: "&gt;", value: ">" }, { label: "=", value: "=" }],
    answer,
    hints,
    solution: t(`<b>${fmt(a)} ${sym} ${right || fmt(b)}</b>`, `<b>${fmt(a)} ${sym} ${right || fmt(b)}</b>`),
  };
}

export function genOrder() {
  const digs = shuffle([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]).slice(0, 4);
  const nonZero = digs.filter(d => d !== 0);
  const four = perms(digs).filter(p => p[0] !== 0).map(p => Number(p.join("")));
  const three = perms(digs.slice(0, 3)).filter(p => p[0] !== 0).map(p => Number(p.join("")));
  if (three.length === 0) return null;
  const set = new Set();
  while (set.size < 3) set.add(pick(four));
  while (set.size < 5) set.add(Number(String(pick(nonZero)) + String(pick(four))));
  while (set.size < 6) set.add(pick(three));
  const items = shuffle([...set]);
  const asc = Math.random() < 0.5;
  const answer = items.slice().sort((x, y) => (asc ? x - y : y - x));
  const sym = asc ? " &lt; " : " &gt; ";
  return {
    type: "order", items, answer, sym: asc ? "&lt;" : "&gt;",
    level: 4,
    prompt: asc
      ? t("Ordne die Zahlen. Beginne mit der <b>kleinsten</b> Zahl. Klicke sie der Reihe nach an.", "Put the numbers in order. Start with the <b>smallest</b> number. Click them one after the other.")
      : t("Ordne die Zahlen. Beginne mit der <b>grössten</b> Zahl. Klicke sie der Reihe nach an.", "Put the numbers in order. Start with the <b>largest</b> number. Click them one after the other."),
    hints: [
      t("Sortiere zuerst nach der Anzahl Stellen. Dann vergleiche Zahlen mit gleich vielen Stellen von links.",
        "First sort by the number of digits. Then compare numbers with the same number of digits from the left."),
      t(`Die ${asc ? "kleinste" : "grösste"} Zahl ist ${fmt(answer[0])}.`, `The ${asc ? "smallest" : "largest"} number is ${fmt(answer[0])}.`),
    ],
    solution: t(`<b>${answer.map(fmt).join(sym)}</b>`, `<b>${answer.map(fmt).join(sym)}</b>`),
  };
}

export function genPredSucc() {
  const kind = pick(["round", "nines", "inner", "random"]);
  const m = pick([100, 1000, 10000]);
  let n;
  if (kind === "round") n = rnd(1, 99) * m;
  else if (kind === "nines") n = rnd(1, 99) * m - 1;
  else if (kind === "inner") n = rnd(10, 999) * 1000 + 99;
  else n = rnd(1000, 999998);
  if (n < 1 || n >= MAX) return null;
  const hints = [t("Der Vorgänger ist 1 weniger. Der Nachfolger ist 1 mehr.", "The number before is 1 less. The number after is 1 more.")];
  if (kind === "round") hints.push(t(`${fmt(n)} − 1: Die Nullen am Ende werden zu Neunen.`, `${fmt(n)} − 1: the zeros at the end become nines.`));
  if (kind === "nines" || kind === "inner") hints.push(t(`${fmt(n)} + 1: Die Neunen am Ende werden zu Nullen. Die Ziffer davor wird 1 grösser.`, `${fmt(n)} + 1: the nines at the end become zeros. The digit before them becomes 1 larger.`));
  return {
    type: "number",
    level: kind === "random" ? 2 : 3,
    prompt: t("Schreibe den Vorgänger und den Nachfolger.", "Write the number before (Vorgänger) and the number after (Nachfolger)."),
    visual: `<div class="bigtext"><span class="slot">?</span> ${fmt(n)} <span class="slot">?</span></div>`,
    fields: [{ label: t("Vorgänger", "number before"), answer: n - 1 }, { label: t("Nachfolger", "number after"), answer: n + 1 }],
    hints,
    solution: t(`<b>${fmt(n - 1)}</b> | ${fmt(n)} | <b>${fmt(n + 1)}</b>`, `<b>${fmt(n - 1)}</b> | ${fmt(n)} | <b>${fmt(n + 1)}</b>`),
  };
}

export function genNeighbours() {
  const pi = pick([1, 2, 3, 4]), p = 10 ** pi;
  const n = rnd(1000, 999999);
  if (n % p === 0) return null;
  const lower = Math.floor(n / p) * p, upper = lower + p;
  return {
    type: "number",
    level: 3,
    prompt: t(`Welches sind die ${NEIGH[pi].de} von <b>${fmt(n)}</b>?`, `What are the ${NEIGH[pi].en} of <b>${fmt(n)}</b>?`),
    fields: [{ label: t("kleiner", "smaller"), answer: lower }, { label: t("grösser", "larger"), answer: upper }],
    hints: [
      t(`Schau auf die ${STELLE[pi].de}. Alle Ziffern rechts davon werden 0. Das gibt ${fmt(lower)}.`,
        `Look at the ${STELLE[pi].en}. All digits to the right of it become 0. That gives ${fmt(lower)}.`),
      t(`Der grössere Nachbar ist ${fmt(lower)} + ${fmt(p)} = ${fmt(upper)}.`, `The larger neighbour is ${fmt(lower)} + ${fmt(p)} = ${fmt(upper)}.`),
    ],
    solution: t(`<b>${fmt(lower)}</b> &lt; ${fmt(n)} &lt; <b>${fmt(upper)}</b>`, `<b>${fmt(lower)}</b> &lt; ${fmt(n)} &lt; <b>${fmt(upper)}</b>`),
  };
}

export function genPowers() {
  const kind = pick(["minus", "plus", "cross"]);
  let expr, ans, hint;
  if (kind === "minus" || kind === "plus") {
    const m = rnd(3, 5), p = 10 ** rnd(0, m - 1);
    const base = rnd(1, 99) * 10 ** m;
    if (base > MAX) return null;
    if (kind === "minus") {
      expr = `${fmt(base)} − ${fmt(p)}`; ans = base - p;
      hint = t(`Gehe von ${fmt(base)} einen Schritt von ${fmt(p)} zurück. Die Nullen werden zu Neunen.`, `Go back one step of ${fmt(p)} from ${fmt(base)}. The zeros become nines.`);
    } else {
      expr = `${fmt(base - p)} + ${fmt(p)}`; ans = base;
      hint = t("Die Neunen werden zu Nullen. Die nächste Stelle wird 1 grösser.", "The nines become zeros. The next place becomes 1 larger.");
    }
  } else {
    const m = rnd(2, 4);
    const x = rnd(1, 9) * 10 ** (m + 1) + rnd(1, 9) * 10 ** rnd(0, m - 1);
    expr = `${fmt(x)} − ${fmt(10 ** m)}`; ans = x - 10 ** m;
    hint = t(`Bei den ${PLACES[m].de}n steht eine 0. Du musst bei den ${PLACES[m + 1].de}n 1 wegnehmen.`, `There is a 0 in the ${PLACES[m].en}. You must take 1 from the ${PLACES[m + 1].en}.`);
  }
  return {
    type: "number",
    level: kind === "cross" ? 3 : 2,
    prompt: t("Rechne im Kopf.", "Calculate in your head."),
    visual: `<div class="bigtext">${expr} = <span class="slot">?</span></div>`,
    fields: [{ label: null, answer: ans }],
    hints: [hint, t("Stell dir den Zahlenstrahl vor. Welche Zahl kommt dort?", "Think of the number line. Which number is there?")],
    solution: t(`${expr} = <b>${fmt(ans)}</b>`, `${expr} = <b>${fmt(ans)}</b>`),
  };
}

export function genCards() {
  const withZero = Math.random() < 0.6;
  const digs = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]).slice(0, withZero ? 4 : 5);
  if (withZero) digs.push(0);
  const cards = shuffle(digs);
  const all = perms(cards).filter(p => p[0] !== 0).map(p => Number(p.join("")));
  const task = pick(["max", "min", "near"]);
  let ans, prompt, hints;
  if (task === "max") {
    ans = Math.max(...all);
    prompt = t("Lege die <b>grösste</b> fünfstellige Zahl.", "Make the <b>largest</b> five-digit number.");
    hints = [t("Die grösste Ziffer kommt ganz nach vorne, dann die zweitgrösste, und so weiter.", "The largest digit goes first, then the second largest, and so on.")];
  } else if (task === "min") {
    ans = Math.min(...all);
    prompt = t("Lege die <b>kleinste</b> fünfstellige Zahl.", "Make the <b>smallest</b> five-digit number.");
    hints = [t("Die kleinste Ziffer kommt nach vorne. Achtung: Die 0 darf nicht vorne stehen!", "The smallest digit goes first. Careful: 0 cannot be the first digit!"),
      t("Hast du eine 0? Dann kommt sie an die zweite Stelle.", "Do you have a 0? Then it goes in the second place.")];
  } else {
    const target = rnd(2, 8) * 10000;
    const sorted = all.slice().sort((x, y) => Math.abs(x - target) - Math.abs(y - target));
    if (Math.abs(sorted[0] - target) === Math.abs(sorted[1] - target)) return null;
    ans = sorted[0];
    prompt = t(`Lege die Zahl, die am nächsten bei <b>${fmt(target)}</b> liegt.`, `Make the number that is closest to <b>${fmt(target)}</b>.`);
    hints = [t(`Die erste Ziffer ist am wichtigsten. Nimm eine Ziffer nahe bei ${target / 10000}.`, `The first digit is the most important. Take a digit near ${target / 10000}.`),
      t(`Liegt die Zahl unter ${fmt(target)}: Mach den Rest so gross wie möglich. Liegt sie darüber: Mach den Rest so klein wie möglich. Probiere beides!`,
        `If the number is below ${fmt(target)}, make the rest as large as possible. If it is above, make the rest as small as possible. Try both!`)];
  }
  return {
    type: "number",
    level: { max: 2, min: 3, near: 5 }[task],
    prompt: t(`${prompt.de} Benutze jede Karte genau einmal.`, `${prompt.en} Use each card exactly once.`),
    visual: `<div class="cards">${cards.map(d => `<span>${d}</span>`).join("")}</div>`,
    fields: [{ label: null, answer: ans }],
    hints,
    solution: t(`Die Lösung ist <b>${fmt(ans)}</b>.`, `The answer is <b>${fmt(ans)}</b>.`),
  };
}
