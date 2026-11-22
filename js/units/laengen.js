// Length problems.
import { t, rnd, pick, shuffle, fmt, NBSP, SLOT, unitText, pairText, clamp, convertProblem } from "../common.js";

// ---------- lengths ----------
// A length is a whole number of millimetres. LEN gives the size of each unit in mm.

const LEN = { mm: 1, cm: 10, dm: 100, m: 1000, km: 1000000 };

function lenText(mm, big, small) {
  return pairText(Math.floor(mm / LEN[big]), big, (mm % LEN[big]) / LEN[small], small);
}

// One answer field for each unit. An empty field counts as 0, so for "10 m" the cm field can stay empty.
function lenFields(mm, big, small) {
  return [{ label: null, unit: big, answer: Math.floor(mm / LEN[big]) }, { label: null, unit: small, answer: (mm % LEN[big]) / LEN[small] }];
}

function arrowSvg(x1, x2, y) {
  return `<line x1="${x1}" y1="${y}" x2="${x2}" y2="${y}" stroke="#333" stroke-width="1.5"/>` +
    `<polygon points="${x1},${y} ${x1 + 9},${y - 5} ${x1 + 9},${y + 5}" fill="#333"/>` +
    `<polygon points="${x2},${y} ${x2 - 9},${y - 5} ${x2 - 9},${y + 5}" fill="#333"/>`;
}

// top: the text over the whole ribbon. cuts: the places of the cuts (0 to 1).
// dashed: a cut with scissors (red), otherwise a glued joint. labels: the texts under parts of the ribbon.
function ribbonSvg(o) {
  const x = f => Math.round(30 + 540 * f);
  let s = `<svg class="band" viewBox="0 0 600 112" xmlns="http://www.w3.org/2000/svg" font-family="Helvetica, Arial" font-size="17" font-weight="bold" text-anchor="middle">`;
  s += `<text x="300" y="14">${o.top}</text>` + arrowSvg(30, 570, 22);
  s += `<rect x="30" y="40" width="540" height="22" fill="#b8bfc7" stroke="#6b7682"/>`;
  for (const c of o.cuts) {
    s += o.dashed
      ? `<line x1="${x(c)}" y1="36" x2="${x(c)}" y2="70" stroke="#c0392b" stroke-width="2" stroke-dasharray="5 4"/><text x="${x(c)}" y="35" font-size="14" fill="#c0392b">✂</text>`
      : `<line x1="${x(c)}" y1="40" x2="${x(c)}" y2="62" stroke="#333" stroke-width="2"/>`;
  }
  for (const g of o.labels) s += arrowSvg(x(g.from), x(g.to), 82) + `<text x="${x((g.from + g.to) / 2)}" y="104">${g.text}</text>`;
  return s + "</svg>";
}

// [German sentence, English sentence, unit]. {u} marks the place of the unit.
const LEN_THINGS = [
  ["Ein Bleistift ist etwa 17 {u} lang.", "A pencil is about 17 {u} long.", "cm"],
  ["Ein Lineal ist 30 {u} lang.", "A ruler is 30 {u} long.", "cm"],
  ["Ein Kinderschuh ist etwa 22 {u} lang.", "A child's shoe is about 22 {u} long.", "cm"],
  ["Ein Tisch ist etwa 75 {u} hoch.", "A table is about 75 {u} high.", "cm"],
  ["Ein Fingernagel ist etwa 1 {u} breit.", "A fingernail is about 1 {u} wide.", "cm"],
  ["Eine Ameise ist etwa 5 {u} lang.", "An ant is about 5 {u} long.", "mm"],
  ["Ein Marienkäfer ist etwa 7 {u} lang.", "A ladybird is about 7 {u} long.", "mm"],
  ["Eine Bankkarte ist etwa 1 {u} dick.", "A bank card is about 1 {u} thick.", "mm"],
  ["Ein Reiskorn ist etwa 6 {u} lang.", "A grain of rice is about 6 {u} long.", "mm"],
  ["Eine Tür ist etwa 2 {u} hoch.", "A door is about 2 {u} high.", "m"],
  ["Ein Bett ist etwa 2 {u} lang.", "A bed is about 2 {u} long.", "m"],
  ["Ein Auto ist etwa 4 {u} lang.", "A car is about 4 {u} long.", "m"],
  ["Ein Bus ist etwa 12 {u} lang.", "A bus is about 12 {u} long.", "m"],
  ["Eine Schwimmbahn ist 25 {u} lang.", "A swimming lane is 25 {u} long.", "m"],
  ["Ein Fussballfeld ist etwa 100 {u} lang.", "A football pitch is about 100 {u} long.", "m"],
  ["Ein Elefant ist etwa 3 {u} hoch.", "An elephant is about 3 {u} tall.", "m"],
  ["Der Prime Tower in Zürich ist etwa 126 {u} hoch.", "The Prime Tower in Zurich is about 126 {u} high.", "m"],
  ["Ein langer Zug ist etwa 400 {u} lang.", "A long train is about 400 {u} long.", "m"],
  ["Der Zürichsee ist etwa 40 {u} lang.", "Lake Zurich is about 40 {u} long.", "km"],
  ["Ein Marathon ist etwa 42 {u} lang.", "A marathon is about 42 {u} long.", "km"],
  ["Von Zürich nach Bern sind es etwa 120 {u}.", "From Zurich to Bern it is about 120 {u}.", "km"],
  ["In 15 Minuten gehst du etwa 1 {u} weit.", "In 15 minutes you walk about 1 {u}.", "km"],
];

// The standard lengths of the book (page 37 and page 39, problem 11).
const LEN_ANCHORS = [
  ["1 mm", t("die Dicke einer Bankkarte", "the thickness of a bank card")],
  ["1 cm", t("die Breite eines Fingernagels", "the width of a fingernail")],
  ["10 cm", t("die Breite einer Hand", "the width of a hand")],
  ["1 m", t("die Breite einer Tür", "the width of a door")],
  ["10 m", t("die Länge eines Schulzimmers", "the length of a classroom")],
  ["100 m", t("die Länge eines Fussballfeldes", "the length of a football pitch")],
  ["1 km", t("ein Weg von 15 Minuten zu Fuss", "a walk of 15 minutes")],
];

const ANCHOR_HINT = t("1 mm: so dick wie eine Bankkarte. 1 cm: so breit wie ein Fingernagel. 10 cm: so breit wie eine Hand. 1 m: so breit wie eine Tür. 1 km: 15 Minuten zu Fuss.",
  "1 mm: as thick as a bank card. 1 cm: as wide as a fingernail. 10 cm: as wide as a hand. 1 m: as wide as a door. 1 km: 15 minutes on foot.");

export function genLenEstimate() {
  if (Math.random() < 0.6) {
    const [de, en, unit] = pick(LEN_THINGS);
    const fill = (s, u) => s.replace("{u}", u);
    return {
      type: "choice",
      level: 1,
      prompt: t("Welche Einheit passt?", "Which unit is right?"),
      visual: t(`<div class="bigtext">${fill(de, SLOT)}</div>`, `<div class="bigtext">${fill(en, SLOT)}</div>`),
      options: ["mm", "cm", "m", "km"].map(u => ({ label: u, value: u })),
      answer: unit,
      hints: [t("Lies den Satz mit jeder Einheit. Welcher Satz passt?", "Read the sentence with each unit. Which sentence makes sense?"), ANCHOR_HINT],
      solution: t(fill(de, `<b>${unit}</b>`), fill(en, `<b>${unit}</b>`)),
    };
  }
  const order = shuffle(LEN_ANCHORS.map((_, i) => i));
  const right = order[0], options = shuffle(order.slice(0, 3));
  const len = LEN_ANCHORS[right][0].replace(" ", NBSP), thing = LEN_ANCHORS[right][1];
  return {
    type: "choice",
    level: 2,
    prompt: t(`Was misst ungefähr <b>${len}</b>?`, `What measures about <b>${len}</b>?`),
    options: options.map(i => ({ label: LEN_ANCHORS[i][1], value: String(i) })),
    answer: String(right),
    hints: [t("Zeige die Länge mit deinen Fingern oder Armen. Welche Antwort ist ungefähr so lang?", "Show the length with your fingers or arms. Which answer is about this long?"), ANCHOR_HINT],
    solution: t(`<b>${len}</b> ist ungefähr ${thing.de}.`, `<b>${len}</b> is about ${thing.en}.`),
  };
}

const LEN_CONVERT = [["m", "cm", 100, 20], ["cm", "mm", 10, 30], ["km", "m", 1000, 30], ["m", "dm", 10, 20], ["dm", "cm", 10, 20], ["m", "mm", 1000, 9]];

export function genLenConvert() {
  const [big, small, f, maxBig] = pick(LEN_CONVERT);
  return convertProblem(big, small, f, maxBig);
}

// Shows a length also in the small unit, if the text has another unit: "8 m 80 cm = 880 cm".
function inSmall(n, text, small) {
  return text === unitText(n, small) ? text : `${text} = ${unitText(n, small)}`;
}

export function genLenAddSub() {
  const [big, small] = pick([["m", "cm"], ["m", "cm"], ["m", "cm"], ["cm", "mm"], ["km", "m"]]);
  const f = LEN[big] / LEN[small], u = LEN[small];
  const amount = () => {
    if (Math.random() < 0.2) return rnd(1, 20) * f;
    if (small === "cm") return rnd(2, 400) * 5;
    return small === "mm" ? rnd(20, 300) : rnd(10, 400) * 50;
  };
  const sub = Math.random() < 0.5, a = amount(), b = amount();
  if (sub && b >= a) return null;
  const r = sub ? a - b : a + b;
  const at = lenText(a * u, big, small), bt = lenText(b * u, big, small), rt = lenText(r * u, big, small);
  const carry = sub ? a % f < b % f : a % f + b % f >= f;
  const calc = `${unitText(a, small)} ${sub ? "−" : "+"} ${unitText(b, small)} = ${unitText(r, small)}`;
  const hints = [t(`Schreibe beide Längen in ${small}: ${inSmall(a, at, small)}, ${inSmall(b, bt, small)}.`, `Write both lengths in ${small}: ${inSmall(a, at, small)}, ${inSmall(b, bt, small)}.`), t(calc, calc)];
  if (r >= f) hints.push(t(`${unitText(r, small)} = ${rt}`, `${unitText(r, small)} = ${rt}`));
  const split = sub ? clamp(r / a, 0.25, 0.75) : clamp(a / (a + b), 0.25, 0.75);
  return {
    type: "number",
    level: carry ? 4 : 3,
    prompt: sub
      ? t(`In einer Drahtfabrik ist ein Draht ${at} lang. Eine Maschine schneidet ${bt} davon ab. Wie lang ist der Rest?`, `At a wire factory, a wire is ${at} long. A machine cuts off ${bt}. How long is the rest?`)
      : t(`In einem Kartenprogramm verbindet ein Kind zwei Linien an ihren Enden. Sie sind ${at} und ${bt} lang. Wie lang ist die neue Linie?`, `In a map program, a child joins two lines end to end. They measure ${at} and ${bt}. How long is the new line?`),
    visual: sub
      ? ribbonSvg({ top: at, cuts: [split], dashed: true, labels: [{ from: 0, to: split, text: "?" }, { from: split, to: 1, text: bt }] })
      : ribbonSvg({ top: "?", cuts: [split], dashed: false, labels: [{ from: 0, to: split, text: at }, { from: split, to: 1, text: bt }] }),
    fields: lenFields(r * u, big, small),
    hints,
    solution: sub ? t(`Der restliche Draht misst <b>${rt}</b>.`, `The remaining wire measures <b>${rt}</b>.`) : t(`Die neue Linie misst <b>${rt}</b>.`, `The new line measures <b>${rt}</b>.`),
  };
}

export function genLenMulDiv() {
  const [big, small] = pick([["m", "cm"], ["m", "cm"], ["cm", "mm"]]);
  const f = LEN[big] / LEN[small], u = LEN[small];
  const kind = pick(["mul", "div", "count"]);
  const n = kind === "count" ? pick([2, 3, 4, 5, 6, 8, 10, 12, 20]) : pick([2, 3, 4, 5, 6, 8, 10]);
  const p = small === "cm" ? pick([rnd(1, 20) * 5, rnd(2, 40) * 5, rnd(1, 3) * 100 + rnd(0, 19) * 5]) : pick([rnd(2, 9), rnd(1, 9) * 5, rnd(1, 9) * 10 + 5]);
  const total = n * p;
  const pt = lenText(p * u, big, small), tt = lenText(total * u, big, small);
  const cuts = Array.from({ length: n - 1 }, (_, i) => (i + 1) / n);
  const back = x => (x >= f ? [t(`${unitText(x, small)} = ${lenText(x * u, big, small)}`, `${unitText(x, small)} = ${lenText(x * u, big, small)}`)] : []);
  if (kind === "mul") {
    const calc = `${n} · ${unitText(p, small)} = ${unitText(total, small)}`;
    return {
      type: "number",
      level: 3,
      prompt: t(`Eine Künstlerin klebt ${n} Stücke Karton von je ${pt} zu einem Streifen zusammen. Wie lang ist der Streifen?`, `An artist glues ${n} pieces of cardboard end to end. Each piece is ${pt} long. How long is the strip?`),
      visual: ribbonSvg({ top: "?", cuts, dashed: false, labels: [{ from: 0, to: 1 / n, text: pt }] }),
      fields: lenFields(total * u, big, small),
      hints: [t(`Gib die Länge eines Kartonstücks in ${small} an: ${inSmall(p, pt, small)}.`, `Write the length of one piece of cardboard in ${small}: ${inSmall(p, pt, small)}.`), t(calc, calc), ...back(total)],
      solution: t(`Der Streifen misst <b>${tt}</b>.`, `The strip measures <b>${tt}</b>.`),
    };
  }
  if (kind === "div") {
    const calc = `${unitText(total, small)} : ${n} = ${unitText(p, small)}`;
    return {
      type: "number",
      level: 4,
      prompt: t(`In einem Zeichenprogramm teilt ein Kind eine Linie von ${tt} in ${n} gleich lange Abschnitte. Wie lang ist jeder Abschnitt?`, `In a drawing program, a child divides a line of ${tt} into ${n} equal sections. How long is each section?`),
      visual: ribbonSvg({ top: tt, cuts, dashed: true, labels: [{ from: 0, to: 1 / n, text: "?" }] }),
      fields: lenFields(p * u, big, small),
      hints: [t(`Schreibe die Länge der ganzen Linie in ${small}: ${inSmall(total, tt, small)}.`, `Write the length of the whole line in ${small}: ${inSmall(total, tt, small)}.`), t(calc, calc), ...back(p)],
      solution: t(`Jeder Abschnitt misst <b>${pt}</b>.`, `Each section measures <b>${pt}</b>.`),
    };
  }
  const first = clamp(p / total, 0.1, 0.3);
  return {
    type: "number",
    level: 4,
    prompt: t(`Eine Maschine hat ${tt} Draht. Sie schneidet ihn in Stücke von je ${pt}. Wie viele Stücke entstehen?`, `A machine has ${tt} of wire. It cuts the wire into pieces of ${pt} each. How many pieces does it cut?`),
    visual: ribbonSvg({ top: tt, cuts: [first], dashed: true, labels: [{ from: 0, to: first, text: pt }] }),
    fields: [{ label: t("Anzahl Stücke", "number of pieces"), answer: n }],
    hints: [t(`Schreibe beide Längen in ${small}: ${inSmall(total, tt, small)}, ${inSmall(p, pt, small)}.`, `Write both lengths in ${small}: ${inSmall(total, tt, small)}, ${inSmall(p, pt, small)}.`),
      t(`Teile die Drahtlänge durch die Länge eines Stücks: ${fmt(total)} : ${p} = ${n}.`, `Divide the wire length by the length of one piece: ${fmt(total)} ÷ ${p} = ${n}.`)],
    solution: t(`Die Maschine schneidet <b>${n}</b> Stücke.`, `The machine cuts <b>${n}</b> pieces.`),
  };
}

export function genLenWord() {
  const kind = pick(["cables", "classTrip", "skiTrails", "trackInspection", "lights"]);
  const km = m => lenText(m * 1000, "km", "m");
  if (kind === "cables") {
    const n = rnd(4, 8), d = pick([25, 50]);
    const calc = `${n} · ${d}${NBSP}m = ${n * d}${NBSP}m`;
    return {
      type: "number",
      level: 3,
      prompt: t(`Am Quartierfest brauchen ${n} Stände Strom. Jeder Stand bekommt ein Kabel von ${d}${NBSP}m. Wie viele Meter Kabel braucht das Fest?`, `At a neighbourhood festival, ${n} stalls need power. Each stall gets a cable of ${d}${NBSP}m. How many metres of cable does the festival need?`),
      fields: [{ label: null, unit: "m", answer: n * d }],
      hints: [t(`Multipliziere die Länge eines Kabels mit der Anzahl Stände.`, `Multiply the length of one cable by the number of stalls.`), t(calc, calc)],
      solution: t(`Für die Stände braucht es <b>${n * d}${NBSP}m</b> Kabel.`, `The stalls need <b>${n * d}${NBSP}m</b> of cable.`),
    };
  }
  if (kind === "classTrip") {
    const legs = [rnd(10, 39) * 100, rnd(200, 900) * 100, rnd(50, 420) * 100];
    const sum = legs[0] + legs[1] + legs[2];
    const kms = legs.map(x => Math.floor(x / 1000)), ms = legs.map(x => x % 1000);
    const k = kms[0] + kms[1] + kms[2], m = ms[0] + ms[1] + ms[2];
    const h1 = `${kms.map(x => `${x}${NBSP}km`).join(" + ")} = ${k}${NBSP}km`;
    const h2 = `${ms.map(x => `${x}${NBSP}m`).join(" + ")} = ${unitText(m, "m")}`;
    const h3 = m >= 1000 ? `${unitText(m, "m")} = ${km(m)}. ${k}${NBSP}km + ${km(m)} = ${km(sum)}` : `${k}${NBSP}km + ${m}${NBSP}m = ${km(sum)}`;
    return {
      type: "number",
      level: 4,
      prompt: t(`Eine Schulklasse macht einen Ausflug. Sie fährt ${km(legs[0])} mit dem Bus, ${km(legs[1])} mit dem Zug und ${km(legs[2])} mit dem Schiff. Wie weit fährt die Klasse insgesamt?`,
        `A class goes on a trip. It travels ${km(legs[0])} by bus, ${km(legs[1])} by train and ${km(legs[2])} by boat. How far does the class travel in total?`),
      fields: lenFields(sum * 1000, "km", "m"),
      hints: [t(`Addiere die Kilometer der drei Fahrten: ${h1}.`, `Add the kilometres of the three rides: ${h1}.`), t(`Addiere auch die Meter: ${h2}.`, `Also add the metres: ${h2}.`), t(h3, h3)],
      solution: t(`Die Klasse fährt insgesamt <b>${km(sum)}</b>.`, `The class travels <b>${km(sum)}</b> in total.`),
    };
  }
  if (kind === "skiTrails") {
    const total = 42195, done = rnd(5, 41) * 1000 + rnd(0, 199) * 5, rest = total - done;
    const calc = `${unitText(total, "m")} − ${unitText(done, "m")} = ${unitText(rest, "m")}`;
    const hints = [t(`Gib die ganze Strecke und den fertigen Teil in Metern an: ${inSmall(total, km(total), "m")}, ${inSmall(done, km(done), "m")}.`, `Write the full distance and the part already done in metres: ${inSmall(total, km(total), "m")}, ${inSmall(done, km(done), "m")}.`), t(calc, calc)];
    if (rest >= 1000) hints.push(t(`${unitText(rest, "m")} = ${km(rest)}`, `${unitText(rest, "m")} = ${km(rest)}`));
    return {
      type: "number",
      level: 4,
      prompt: t(`Ein Pistenfahrzeug soll ${km(total)} Loipen für den Langlauf präparieren. Es hat schon ${km(done)} geschafft. Wie viele Kilometer und Meter fehlen noch?`,
        `A snow groomer must prepare ${km(total)} of cross-country ski trails. It has already done ${km(done)}. How many kilometres and metres are left?`),
      fields: lenFields(rest * 1000, "km", "m"),
      hints,
      solution: t(`Das Pistenfahrzeug muss noch <b>${km(rest)}</b> präparieren.`, `The snow groomer still has <b>${km(rest)}</b> to prepare.`),
    };
  }
  if (kind === "trackInspection") {
    const k = pick([2, 3, 4, 5]), part = rnd(2, 15) * 1000 + rnd(0, 9) * 100, total = k * part;
    const calc = `${unitText(total, "m")} : ${k} = ${unitText(part, "m")}`;
    return {
      type: "number",
      level: 4,
      prompt: t(`Bei einer Bahn muss das Team ${km(total)} Gleis prüfen. An jedem der ${k} Arbeitstage prüft es gleich viel. Wie viel Gleis prüft das Team pro Tag?`,
        `A railway team needs to inspect ${km(total)} of track. It inspects the same length on each of ${k} workdays. How much track does the team inspect per day?`),
      fields: lenFields(part * 1000, "km", "m"),
      hints: [t(`Schreibe die Länge des Gleises in Metern: ${inSmall(total, km(total), "m")}.`, `Write the length of the track in metres: ${inSmall(total, km(total), "m")}.`), t(calc, calc), t(`${unitText(part, "m")} = ${km(part)}`, `${unitText(part, "m")} = ${km(part)}`)],
      solution: t(`Pro Tag prüft das Team <b>${km(part)}</b> Gleis.`, `The team inspects <b>${km(part)}</b> of track per day.`),
    };
  }
  const s = rnd(12, 16), d = pick([20, 30, 40, 50, 60, 100, 1000]), times = d / 10;
  const calc = `${times} · ${s} = ${fmt(times * s)}`;
  return {
    type: "number",
    level: 3,
    prompt: t(`Für ein Lichterfest hängen Helferinnen eine Lichterkette auf. Auf jeweils 10${NBSP}m hat es ${s} Lämpchen. Wie viele Lämpchen hat die ganze Kette von ${fmt(d)}${NBSP}m?`, `Helpers hang up a string of lights for a festival. Each 10${NBSP}m has ${s} bulbs. How many bulbs are on the full ${fmt(d)}${NBSP}m string?`),
    fields: [{ label: t("Lämpchen", "bulbs"), answer: times * s }],
    hints: [t(`Die Kette hat ${times} Abschnitte von je 10${NBSP}m. In jedem sind gleich viele Lämpchen.`, `The string has ${times} sections of 10${NBSP}m each. Each section has the same number of bulbs.`), t(calc, calc)],
    solution: t(`An der Kette hängen <b>${fmt(times * s)}</b> Lämpchen.`, `There are <b>${fmt(times * s)}</b> bulbs on the string.`),
  };
}
