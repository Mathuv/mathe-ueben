// Topics, answer checks, points and time limits.
import { t, parseNum } from "./common.js";
import { genNlRead, genNlPlace, genNlMiddle, genNlSteps } from "./units/zahlenstrahl.js";
import { genCompare, genOrder, genPredSucc, genNeighbours, genPowers, genCards } from "./units/zahlen-ordnen.js";
import { genEvenOdd, genDigitValue, genPlaceBuild, genDigitSum, genDivisible, genReverse, genRiddle } from "./units/zahlen-untersuchen.js";
import { genLenEstimate, genLenConvert, genLenAddSub, genLenMulDiv, genLenWord } from "./units/laengen.js";
import { parseTime, genClockRead, genTimeWords, genTimeUnits, genDuration, genTimeCalc, genTimeWord } from "./units/zeit.js";

export const SECTIONS = [
  { id: "A", name: t("A · Zahlenstrahl", "A · Number line") },
  { id: "B", name: t("B · Zahlen ordnen", "B · Ordering numbers") },
  { id: "C", name: t("C · Zahlen untersuchen", "C · Investigating numbers") },
  { id: "L", name: t("📏 Längen", "📏 Lengths") },
  { id: "Z", name: t("⏰ Zeit", "⏰ Time") },
];

export const SKILLS = [
  { id: "nl_read", sec: "A", name: t("Zahlen am Zahlenstrahl ablesen", "Read numbers on the number line"), gen: genNlRead },
  { id: "nl_place", sec: "A", name: t("Zahlen am Zahlenstrahl zeigen", "Show numbers on the number line"), gen: genNlPlace },
  { id: "nl_middle", sec: "A", name: t("Genau in der Mitte", "Exactly in the middle"), gen: genNlMiddle },
  { id: "nl_steps", sec: "A", name: t("In Schritten zählen", "Counting in steps"), gen: genNlSteps },
  { id: "cmp", sec: "B", name: t("&lt;, &gt; oder =", "&lt;, &gt; or ="), gen: genCompare },
  { id: "order", sec: "B", name: t("Zahlen ordnen", "Put numbers in order"), gen: genOrder },
  { id: "pred", sec: "B", name: t("Vorgänger und Nachfolger", "Number before and after"), gen: genPredSucc },
  { id: "neigh", sec: "B", name: t("Nachbarzahlen", "Neighbouring tens, hundreds, …"), gen: genNeighbours },
  { id: "powers", sec: "B", name: t("Rechnen über die Stelle", "Calculating across a place"), gen: genPowers },
  { id: "cards", sec: "B", name: t("Ziffernkarten", "Digit cards"), gen: genCards },
  { id: "evenodd", sec: "C", name: t("Gerade und ungerade", "Even and odd"), gen: genEvenOdd },
  { id: "digitval", sec: "C", name: t("Wert einer Ziffer", "Value of a digit"), gen: genDigitValue },
  { id: "build", sec: "C", name: t("Stellenwerte zusammensetzen", "Build numbers from place values"), gen: genPlaceBuild },
  { id: "qs", sec: "C", name: t("Quersumme", "Digit sum"), gen: genDigitSum },
  { id: "div", sec: "C", name: t("Teilbar durch 10, 100, 1000", "Divisible by 10, 100, 1000"), gen: genDivisible },
  { id: "rev", sec: "C", name: t("Umkehrzahlen", "Reversed numbers"), gen: genReverse },
  { id: "riddle", sec: "C", name: t("Wer bin ich?", "Who am I?"), gen: genRiddle },
  { id: "len_est", sec: "L", name: t("Längen schätzen", "Estimate lengths"), gen: genLenEstimate },
  { id: "len_conv", sec: "L", name: t("Masseinheiten umrechnen", "Convert units of length"), gen: genLenConvert },
  { id: "len_addsub", sec: "L", name: t("Bänder abschneiden und zusammenkleben", "Cut and join ribbons"), gen: genLenAddSub },
  { id: "len_muldiv", sec: "L", name: t("Gleich lange Stücke", "Pieces of the same length"), gen: genLenMulDiv },
  { id: "len_word", sec: "L", name: t("Sachaufgaben mit Längen", "Word problems with lengths"), gen: genLenWord },
  { id: "clock_read", sec: "Z", name: t("Uhrzeit ablesen", "Read the clock"), gen: genClockRead },
  { id: "time_words", sec: "Z", name: t("Uhrzeit in Worten", "Time in words"), gen: genTimeWords },
  { id: "time_units", sec: "Z", name: t("Zeiteinheiten umrechnen", "Convert units of time"), gen: genTimeUnits },
  { id: "time_dur", sec: "Z", name: t("Zeitdauer berechnen", "Calculate a duration"), gen: genDuration },
  { id: "time_calc", sec: "Z", name: t("Anfang oder Ende berechnen", "Calculate the start or the end"), gen: genTimeCalc },
  { id: "time_word", sec: "Z", name: t("Sachaufgaben mit Zeit", "Word problems with time"), gen: genTimeWord },
];

// Each block has its own topics and its own test practice.
export const BLOCKS = [
  { id: "lz", name: t("📏⏰ Längen & Zeit", "📏⏰ Lengths & time"), title: t("Mathe 4 – Längen & Zeit", "Maths 4 – Lengths & time"), sections: ["L", "Z"] },
  { id: "zahlen", name: t("🔢 Zahlen", "🔢 Numbers"), title: t("Mathe 4 – Zahlen", "Maths 4 – Numbers"), sections: ["A", "B", "C"] },
];

export function skillsOfBlock(id) {
  const sections = BLOCKS.find(b => b.id === id).sections;
  return SKILLS.filter(s => sections.includes(s.sec));
}

export function generate(skillId) {
  const skill = SKILLS.find(s => s.id === skillId);
  for (let i = 0; i < 500; i++) {
    const q = skill.gen();
    if (q) { q.skill = skillId; return q; }
  }
  throw new Error("generator failed: " + skillId);
}

function isFilled(v) { return String(v ?? "").trim() !== ""; }

// A field with a unit can stay empty, because it counts as 0. One field must have an answer.
export function isAnswered(q, input) {
  if (q.type === "number") return q.fields.every((f, i) => f.unit || isFilled(input[i])) && input.some(isFilled);
  if (q.type === "choice" || q.type === "line") return input !== null;
  if (q.type === "order") return input.length === q.items.length;
  if (q.type === "multi") return q.allowEmpty || input.length > 0;
  return false;
}

export function check(q, input) {
  if (q.type === "number") {
    const fields = q.fields.map((f, i) => fieldValue(f, input[i]) === f.answer);
    return { ok: fields.every(Boolean), fields };
  }
  if (q.type === "choice" || q.type === "line") return { ok: input === q.answer };
  if (q.type === "order") return { ok: input.length === q.answer.length && input.every((idx, i) => q.items[idx] === q.answer[i]) };
  if (q.type === "multi") {
    const a = input.slice().sort((x, y) => x - y), b = q.answer.slice().sort((x, y) => x - y);
    return { ok: a.length === b.length && a.every((v, i) => v === b[i]) };
  }
  return { ok: false };
}

// The value that the child typed into a field: a time in seconds after midnight, or a number. An empty field with a unit is 0.
function fieldValue(f, v) {
  if (f.time) return parseTime(v, f.time === "hms");
  if (f.unit && !isFilled(v)) return 0;
  return parseNum(v);
}

// Mastery rule: a skill has 0–5 points, and 5 points give a star.
// result is "first" (right at the first try, no hint), "later" (right after a hint or a retry)
// or "shown" (the solution was shown after 3 wrong tries).
export function nextMastery(points, result) {
  if (result === "first") return Math.min(5, points + 1);
  if (result === "shown") return Math.max(0, points - 1);
  return points;
}

// Timer of the test practice: each problem has a difficulty level from 1 to 5.
// The level gives an estimated time in seconds, and the speed setting multiplies it.
const LEVEL_SECONDS = { 1: 20, 2: 30, 3: 45, 4: 60, 5: 90 };
export const SPEED_FACTOR = { slow: 1.5, normal: 1, fast: 0.75 };
export function timeLimit(level, speed) {
  return Math.round(LEVEL_SECONDS[level] * SPEED_FACTOR[speed]);
}
