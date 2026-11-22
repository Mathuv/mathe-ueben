// Time problems. Only the tests import fmtTime, numDe and clockWordsDe.
import { t, rnd, pick, shuffle, NBSP, SLOT, unitText, plural, convertProblem } from "../common.js";

// ---------- time ----------
// A time of day is a whole number of seconds after midnight (0 to 86 399).

const DAY = 86400;

export function fmtTime(sec, withSec) {
  const p = n => String(n).padStart(2, "0");
  const s = `${p(Math.floor(sec / 3600))}:${p(Math.floor(sec % 3600 / 60))}`;
  return withSec ? `${s}:${p(sec % 60)}` : s;
}

// Reads a typed time: 08:25, 8:25, 08.25 or 8.25, with seconds 18:33:25. 24:00 is midnight, the same as 00:00.
// 8,25 is also correct, because the number keyboard of a phone can have only "," as the separator key.
// Gives the seconds after midnight, or NaN for a time that does not exist.
export function parseTime(text, withSec) {
  const pattern = withSec ? /^(\d{1,2})[:.,](\d{2})[:.,](\d{2})$/ : /^(\d{1,2})[:.,](\d{2})$/;
  const m = String(text ?? "").trim().match(pattern);
  if (!m) return NaN;
  const h = Number(m[1]), min = Number(m[2]), s = withSec ? Number(m[3]) : 0;
  if (h === 24 && min === 0 && s === 0) return 0;
  if (h > 23 || min > 59 || s > 59) return NaN;
  return h * 3600 + min * 60 + s;
}

// A duration as the book writes it: 2 h 14 min, 1 min 35 s, 2 d 3 h.
function durText(sec) {
  const parts = [[Math.floor(sec / DAY), "d"], [Math.floor(sec % DAY / 3600), "h"], [Math.floor(sec % 3600 / 60), "min"], [sec % 60, "s"]].filter(p => p[0]);
  return parts.length ? parts.map(p => unitText(p[0], p[1])).join(" ") : unitText(0, "min");
}

// Use hours and minutes only, even for more than one day.
function hoursText(sec) {
  const h = unitText(Math.floor(sec / 3600), "h"), m = (sec % 3600) / 60;
  return m ? `${h} ${unitText(m, "min")}` : h;
}

const ONES_DE = ["null", "eins", "zwei", "drei", "vier", "fünf", "sechs", "sieben", "acht", "neun", "zehn", "elf", "zwölf",
  "dreizehn", "vierzehn", "fünfzehn", "sechzehn", "siebzehn", "achtzehn", "neunzehn"];
const TENS_DE = ["", "", "zwanzig", "dreissig", "vierzig", "fünfzig"];

export function numDe(n) {
  if (n < 20) return ONES_DE[n];
  const ones = n % 10, tens = TENS_DE[Math.floor(n / 10)];
  return ones ? `${ones === 1 ? "ein" : ONES_DE[ones]}und${tens}` : tens;
}

// The German words for a time on a 12-hour clock, as the book writes them. h is 1 to 12.
// The page uses only minutes with clear words: 0, 2–10, 15, 20, 25, 30, 35, 40, 45, 50–58.
export function clockWordsDe(h, m) {
  const next = ONES_DE[h % 12 + 1];
  if (m === 0) return `${h === 1 ? "ein" : ONES_DE[h]} Uhr`;
  if (m === 15) return `Viertel nach ${ONES_DE[h]}`;
  if (m === 30) return `halb ${next}`;
  if (m === 45) return `Viertel vor ${next}`;
  if (m === 25) return `fünf vor halb ${next}`;
  if (m === 35) return `fünf nach halb ${next}`;
  if (m < 30) return `${numDe(m)} nach ${ONES_DE[h]}`;
  return `${numDe(60 - m)} vor ${next}`;
}

const WORD_MINUTES = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 2, 3, 4, 6, 7, 8, 9, 51, 52, 53, 54, 56, 57, 58];

// Explains the German words of one clock time.
function wordsHint(h, m) {
  const words = `„${clockWordsDe(h, m)}“`, next = h % 12 + 1, time = `${h}:${String(m).padStart(2, "0")}`;
  if (m === 0) return t(`${words} heisst genau ${time}.`, `${words} means exactly ${time}.`);
  if (m === 30) return t(`${words} heisst: eine halbe Stunde vor ${next} Uhr, also ${time}.`, `${words} means half an hour before ${next} o'clock, so ${time}. It is not ${next}:30!`);
  if (m === 25 || m === 35) {
    const half = `„halb ${ONES_DE[next]}“`;
    return t(`${half} ist ${h}:30. ${words} ist 5 Minuten ${m === 25 ? "früher" : "später"}: ${time}.`,
      `${half} is ${h}:30 (half an hour before ${next}). ${words} is 5 minutes ${m === 25 ? "earlier" : "later"}: ${time}.`);
  }
  if (m < 30) return t(`${words} heisst ${m} Minuten nach ${h} Uhr: ${time}.`, `${words} means ${m} minutes after ${h} o'clock: ${time}.`);
  return t(`${words} heisst ${60 - m} Minuten vor ${next} Uhr: ${time}.`, `${words} means ${60 - m} minutes before ${next} o'clock: ${time}.`);
}

const ROMAN = ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];

// A clock face. style: "arabic" (1 to 12), "roman" (I to XII) or "none" (only marks, as on a station clock).
function clockSvg(sec, withSec, style) {
  const h = Math.floor(sec / 3600) % 12, m = Math.floor(sec / 60) % 60, s = sec % 60;
  const at = (deg, r) => {
    const a = deg * Math.PI / 180;
    return [(100 + r * Math.sin(a)).toFixed(2), (100 - r * Math.cos(a)).toFixed(2)];
  };
  const hand = (cls, deg, len, width, color) => {
    const [x, y] = at(deg, len);
    return `<line class="${cls}" x1="100" y1="100" x2="${x}" y2="${y}" stroke="${color}" stroke-width="${width}" stroke-linecap="round"/>`;
  };
  let svg = `<svg class="clock" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" font-family="Helvetica, Arial">`;
  svg += `<circle cx="100" cy="100" r="95" fill="#fff" stroke="#222" stroke-width="4"/>`;
  for (let i = 0; i < 60; i++) {
    const [x1, y1] = at(i * 6, i % 5 ? 85 : 76), [x2, y2] = at(i * 6, 91);
    svg += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#222" stroke-width="${i % 5 ? 1.2 : 3.5}"/>`;
  }
  if (style !== "none") {
    for (let n = 1; n <= 12; n++) {
      const [x, y] = at(n * 30, 63);
      const label = style === "roman" ? ROMAN[n] : n;
      svg += `<text x="${x}" y="${(Number(y) + 6).toFixed(2)}" text-anchor="middle" font-size="${style === "roman" ? 14 : 18}" font-weight="bold">${label}</text>`;
    }
  }
  // The minute hand jumps from minute to minute, as on a Swiss station clock. The hour hand moves with the minutes.
  svg += hand("hh", (h + m / 60) * 30, 46, 7, "#222") + hand("hm", m * 6, 76, 4, "#222");
  if (withSec) svg += hand("hs", s * 6, 82, 1.6, "#c0392b");
  return svg + `<circle cx="100" cy="100" r="5" fill="#222"/></svg>`;
}

const CLOCK_ORIENTATION = t("Oben ist die 12, rechts die 3, unten die 6, links die 9.", "At the top is 12, on the right 3, at the bottom 6, on the left 9.");

export function genClockRead() {
  const kind = pick(["five", "five", "any", "any", "sec"]);
  const style = pick(["arabic", "arabic", "roman", "none"]);
  const h = rnd(1, 12), m = kind === "five" ? rnd(0, 11) * 5 : rnd(0, 59), s = kind === "sec" ? rnd(1, 59) : 0;
  const withSec = kind === "sec", next = h % 12 + 1;
  const am = (h % 12) * 3600 + m * 60 + s, pm = am + 12 * 3600;
  const format = withSec ? "hms" : "hm";
  const parts = [];
  if (m) parts.push(plural(m, "Minute", "Minuten", "minute", "minutes"));
  if (s) parts.push(plural(s, "Sekunde", "Sekunden", "second", "seconds"));
  const nowDe = parts.length ? `${h} Uhr und ${parts.map(p => p.de).join(" und ")}` : `genau ${h} Uhr`;
  const nowEn = parts.length ? `${h} o'clock and ${parts.map(p => p.en).join(" and ")}` : `exactly ${h} o'clock`;
  const hints = [withSec
    ? t("Der kurze Zeiger zeigt die Stunden, der lange Zeiger die Minuten, der rote Zeiger die Sekunden. Von einem dicken Strich zum nächsten sind es 5 Minuten.",
      "The short hand shows the hours, the long hand the minutes, the red hand the seconds. From one thick mark to the next is 5 minutes.")
    : t("Der kurze Zeiger zeigt die Stunden, der lange Zeiger die Minuten. Von einem dicken Strich zum nächsten sind es 5 Minuten.",
      "The short hand shows the hours, the long hand the minutes. From one thick mark to the next is 5 minutes.")];
  if (style !== "arabic") hints.push(CLOCK_ORIENTATION);
  hints.push(t(`Der kurze Zeiger ist ${m ? `zwischen der ${h} und der ${next}` : `bei der ${h}`}. Es ist ${nowDe}.`,
    `The short hand is ${m ? `between ${h} and ${next}` : `at ${h}`}. It is ${nowEn}.`));
  hints.push(t(`Vor dem Mittag: ${fmtTime(am, withSec)}. Nach dem Mittag zählst du 12 Stunden dazu: ${fmtTime(pm, withSec)}.`,
    `Before noon: ${fmtTime(am, withSec)}. After noon, add 12 hours: ${fmtTime(pm, withSec)}.`));
  return {
    type: "number",
    level: { five: 2, any: 3, sec: 4 }[kind],
    prompt: withSec
      ? t("Lies die Zeiger ab. Gib die frühere und die spätere Uhrzeit an. Gib auch die Sekunden an.", "Read the clock hands. Give the earlier time and the later time. Include the seconds.")
      : t("Lies die Zeiger ab. Gib die frühere und die spätere Uhrzeit an.", "Read the clock hands. Give the earlier time and the later time."),
    visual: clockSvg(am, withSec, style),
    fields: [{ label: t("vor dem Mittag", "before noon"), time: format, answer: am }, { label: t("nach dem Mittag", "after noon"), time: format, answer: pm }],
    hints,
    solution: t(`Es ist <b>${fmtTime(am, withSec)}</b> oder <b>${fmtTime(pm, withSec)}</b>.`, `It is <b>${fmtTime(am, withSec)}</b> or <b>${fmtTime(pm, withSec)}</b>.`),
  };
}

const DAY_PARTS = [
  { de: "morgens", en: "in the morning", from: 6, to: 9, pm: false },
  { de: "vormittags", en: "in the late morning", from: 10, to: 11, pm: false },
  { de: "nachmittags", en: "in the afternoon", from: 13, to: 17, pm: true },
  { de: "abends", en: "in the evening", from: 18, to: 22, pm: true },
];

export function genTimeWords() {
  const kind = pick(["two", "two", "part", "spoken", "midnight", "choose"]);
  const words = w => `<div class="bigtext">„${w}“</div>`;
  const one = (level, w, answer, hints) => ({
    type: "number",
    level,
    prompt: t("Schreibe die angegebene Uhrzeit mit Ziffern.", "Write the time from the German words in digits."),
    visual: words(w),
    fields: [{ label: null, time: "hm", answer }],
    hints,
    solution: t(`„${w}“ ist <b>${fmtTime(answer)}</b>.`, `„${w}“ is <b>${fmtTime(answer)}</b>.`),
  });
  if (kind === "two") {
    const h = rnd(1, 12), m = pick(WORD_MINUTES), am = (h % 12) * 3600 + m * 60, pm = am + 12 * 3600;
    const w = clockWordsDe(h, m);
    return {
      type: "number",
      level: [0, 5, 10, 15, 20, 40, 45, 50, 55].includes(m) ? 2 : 3,
      prompt: t("Schreibe die frühere und die spätere Uhrzeit mit Ziffern.", "Use the German words. Write the earlier time and the later time in digits."),
      visual: words(w),
      fields: [{ label: t("vor dem Mittag", "before noon"), time: "hm", answer: am }, { label: t("nach dem Mittag", "after noon"), time: "hm", answer: pm }],
      hints: [wordsHint(h, m), t(`Vor dem Mittag: ${fmtTime(am)}. Nach dem Mittag zählst du 12 Stunden dazu: ${fmtTime(pm)}.`, `Before noon: ${fmtTime(am)}. After noon, add 12 hours: ${fmtTime(pm)}.`)],
      solution: t(`„${w}“ ist <b>${fmtTime(am)}</b> oder <b>${fmtTime(pm)}</b>.`, `„${w}“ is <b>${fmtTime(am)}</b> or <b>${fmtTime(pm)}</b>.`),
    };
  }
  if (kind === "part") {
    const part = pick(DAY_PARTS), hour = rnd(part.from, part.to), m = pick(WORD_MINUTES);
    const h = hour % 12 || 12, answer = hour * 3600 + m * 60;
    return one(3, `${clockWordsDe(h, m)} ${part.de}`, answer, [wordsHint(h, m),
      part.pm
        ? t(`„${part.de}“ ist nach dem Mittag. Zähle 12 Stunden dazu: ${fmtTime(answer)}.`, `„${part.de}“ means ${part.en}, so after noon. Add 12 hours: ${fmtTime(answer)}.`)
        : t(`„${part.de}“ ist vor dem Mittag: ${fmtTime(answer)}.`, `„${part.de}“ means ${part.en}, so before noon: ${fmtTime(answer)}.`)]);
  }
  if (kind === "spoken") {
    // Use the 24-hour clock for spoken times.
    if (Math.random() < 0.6) {
      const h = rnd(2, 23), m = rnd(1, 59), answer = h * 3600 + m * 60;
      return one(2, `${numDe(h)} Uhr ${numDe(m)}`, answer,
        [t(`„${numDe(h)} Uhr“ ist ${h}:00. Danach kommen die Minuten: „${numDe(m)}“ = ${m}.`, `„${numDe(h)} Uhr“ is ${h}:00. Then come the minutes: „${numDe(m)}“ = ${m}.`)]);
    }
    const h = rnd(3, 23), n = rnd(2, 9), answer = h * 3600 - n * 60;
    return one(3, `${numDe(n)} Minuten vor ${numDe(h)} Uhr`, answer,
      [t(`„${numDe(h)} Uhr“ ist ${h}:00. „${numDe(n)}“ = ${n}.`, `„${numDe(h)} Uhr“ is ${h}:00. „${numDe(n)}“ = ${n}.`),
        t(`${n} Minuten vor ${h}:00 ist ${fmtTime(answer)}.`, `${n} minutes before ${h}:00 is ${fmtTime(answer)}.`)]);
  }
  if (kind === "midnight") {
    const rule = t("„Mittag“ ist 12:00. „Mitternacht“ ist 00:00, der Anfang des Tages.", "„Mittag“ (noon) is 12:00. „Mitternacht“ (midnight) is 00:00, the start of the day.");
    const v = rnd(1, 4);
    if (v === 1) return one(2, "Mittag", 12 * 3600, [rule]);
    if (v === 2) return one(2, "Mitternacht", 0, [rule]);
    if (v === 3) return one(3, "Viertel vor Mitternacht", DAY - 15 * 60, [rule, t("15 Minuten vor 00:00 ist 23:45.", "15 minutes before 00:00 is 23:45.")]);
    const n = rnd(2, 9);
    return one(3, `${numDe(n)} Minuten vor Mitternacht`, DAY - n * 60, [rule, t(`${n} Minuten vor 00:00 ist ${fmtTime(DAY - n * 60)}.`, `${n} minutes before 00:00 is ${fmtTime(DAY - n * 60)}.`)]);
  }
  // Digital time to German words. The wrong words are typical mistakes: one hour off, or "vor" in place of "nach".
  const h = rnd(1, 12), m = pick(WORD_MINUTES.filter(x => x !== 0));
  const before = h === 1 ? 12 : h - 1;
  const wrong = m === 30 ? [[before, m], [h % 12 + 1, m]] : [[pick([before, h % 12 + 1]), m], [h, 60 - m]];
  const options = shuffle([[h, m], ...wrong].map(([x, y], i) => ({ label: `„${clockWordsDe(x, y)}“`, value: String(i) })));
  const shown = fmtTime((h % 12) * 3600 + m * 60 + (Math.random() < 0.5 ? 12 * 3600 : 0));
  return {
    type: "choice",
    level: 3,
    prompt: t(`Welche Worte passen zu <b>${shown}</b>?`, `Which German words match <b>${shown}</b>?`),
    options,
    answer: "0",
    hints: [t("Bei „halb“ denkst du an die nächste Stunde: „halb neun“ ist 8:30.", "With „halb“, think of the next hour: „halb neun“ is 8:30, not 9:30."), wordsHint(h, m)],
    solution: t(`${shown} ist <b>„${clockWordsDe(h, m)}“</b>.`, `${shown} is <b>„${clockWordsDe(h, m)}“</b>.`),
  };
}

const TIME_CONVERT = [["h", "min", 60, 6], ["min", "s", 60, 9], ["d", "h", 24, 4]];

export function genTimeUnits() {
  if (Math.random() < 0.15) {
    const h = rnd(1, 2), steps = `1${NBSP}h = 60${NBSP}min, 1${NBSP}min = 60${NBSP}s. 60 · 60${NBSP}s = 3600${NBSP}s.`;
    const hints = [t(steps, steps)];
    if (h === 2) hints.push(t(`2 · 3600${NBSP}s = 7200${NBSP}s`, `2 · 3600${NBSP}s = 7200${NBSP}s`));
    return {
      type: "number",
      level: 2,
      prompt: t("Rechne um.", "Convert."),
      visual: `<div class="bigtext">${h}${NBSP}h = ${SLOT} s</div>`,
      fields: [{ label: null, unit: "s", answer: h * 3600 }],
      hints,
      solution: t(`${h}${NBSP}h = <b>${unitText(h * 3600, "s")}</b>`, `${h}${NBSP}h = <b>${unitText(h * 3600, "s")}</b>`),
    };
  }
  const [big, small, f, maxBig] = pick(TIME_CONVERT);
  return convertProblem(big, small, f, maxBig);
}

// Hints for the duration from a to b, in steps: to the next full hour, then whole hours, then the rest.
// big is 3600 (hours and minutes) or 60 (minutes and seconds).
function durationHints(a, b, big) {
  const withSec = big === 60, T = x => fmtTime(x, withSec);
  const up = Math.ceil(a / big) * big, down = Math.floor(b / big) * big;
  const pieces = up > down ? [[a, b]] : [[a, up], [up, down], [down, b]].filter(([x, y]) => y > x);
  const hints = [withSec
    ? t("Rechne in Schritten: zuerst bis zur nächsten vollen Minute, dann ganze Minuten, dann den Rest.", "Calculate in steps: first to the next full minute, then whole minutes, then the rest.")
    : t("Rechne in Schritten: zuerst bis zur nächsten vollen Stunde, dann ganze Stunden, dann den Rest.", "Calculate in steps: first to the next full hour, then whole hours, then the rest.")];
  const steps = pieces.map(([x, y]) => `${T(x)} → ${T(y)}: ${durText(y - x)}`).join(". ");
  hints.push(t(steps, steps));
  if (pieces.length > 1) {
    const sum = `${pieces.map(([x, y]) => durText(y - x)).join(" + ")} = ${durText(b - a)}`;
    hints.push(t(sum, sum));
  }
  return hints;
}

// Hints to add (sign 1) or subtract (sign -1) the duration d: first the whole hours or minutes, then the rest over the full hour or minute.
function calcHints(given, d, sign, withSec) {
  const big = withSec ? 60 : 3600, T = x => fmtTime(x, withSec), op = sign > 0 ? "+" : "−";
  const step = (x, amount, y) => `${T(x)} ${op} ${durText(amount)} = ${T(y)}`;
  const hints = [withSec
    ? t("Rechne zuerst die ganzen Minuten, dann die Sekunden. 1 min = 60 s.", "First calculate the whole minutes, then the seconds. 1 min = 60 s.")
    : t("Rechne zuerst die ganzen Stunden, dann die Minuten. 1 h = 60 min.", "First calculate the whole hours, then the minutes. 1 h = 60 min.")];
  const whole = Math.floor(d / big) * big, rest = d - whole;
  let x = given;
  if (whole) {
    const s = step(x, whole, x + sign * whole);
    hints.push(t(s, s));
    x += sign * whole;
  }
  if (rest) {
    const edge = sign > 0 ? Math.floor(x / big) * big + big : Math.floor(x / big) * big;
    const crosses = sign > 0 ? x + rest > edge : x - rest < edge && x > edge;
    const s = crosses
      ? `${step(x, Math.abs(edge - x), edge)}. ${step(edge, rest - Math.abs(edge - x), x + sign * rest)}`
      : step(x, rest, x + sign * rest);
    hints.push(t(s, s));
  }
  return hints;
}

const WEEKDAYS = [t("Montag", "Monday"), t("Dienstag", "Tuesday"), t("Mittwoch", "Wednesday"), t("Donnerstag", "Thursday"),
  t("Freitag", "Friday"), t("Samstag", "Saturday"), t("Sonntag", "Sunday")];
const MONTHS = [t("März", "March"), t("Mai", "May"), t("Juli", "July"), t("Oktober", "October")];

export function genDuration() {
  const kind = pick(["hm", "hm", "ms", "days"]);
  if (kind === "days") {
    const day = rnd(0, 6), a = rnd(0, 23) * 3600, d = rnd(25, 80) * 3600, b = a + d;
    const days = Math.floor(d / DAY), hours = (d % DAY) / 3600;
    const end = (day + Math.floor(b / DAY)) % 7, mid = (day + days) % 7, ta = fmtTime(a), tb = fmtTime(b % DAY);
    const wd = (i, lang) => WEEKDAYS[i][lang];
    const hints = [t("1 Tag (1 d) hat 24 Stunden (24 h).", "1 day (1 d) has 24 hours (24 h)."),
      t(`Von ${wd(day, "de")} ${ta} bis ${wd(mid, "de")} ${ta} ${days === 1 ? "ist es 1 Tag" : `sind es ${days} Tage`}.`,
        `From ${wd(day, "en")} ${ta} to ${wd(mid, "en")} ${ta} it is ${days === 1 ? "1 day" : `${days} days`}.`)];
    if (hours) {
      hints.push(t(`Von ${wd(mid, "de")} ${ta} bis ${wd(end, "de")} ${tb} sind es noch ${hours}${NBSP}h.`, `From ${wd(mid, "en")} ${ta} to ${wd(end, "en")} ${tb} it is ${hours}${NBSP}h more.`));
    }
    return {
      type: "number",
      level: 5,
      prompt: t("Wie lange dauert es? Schreibe die Zeitdauer in Tagen und Stunden.", "How long is it? Write the duration in days and hours."),
      visual: t(`<div class="bigtext">${wd(day, "de")} ${ta} → ${wd(end, "de")} ${tb}</div>`, `<div class="bigtext">${wd(day, "en")} ${ta} → ${wd(end, "en")} ${tb}</div>`),
      fields: [{ label: null, unit: "d", answer: days }, { label: null, unit: "h", answer: hours }],
      hints,
      solution: t(`Es dauert <b>${durText(d)}</b>, also ${d / 3600}${NBSP}h.`, `It takes <b>${durText(d)}</b>, that is ${d / 3600}${NBSP}h.`),
    };
  }
  const withSec = kind === "ms";
  const a = withSec ? rnd(7 * 3600, 21 * 3600) : rnd(6 * 60, 20 * 60) * 60;
  const d = withSec ? rnd(20, 900) : rnd(5, 240) * 60, b = a + d;
  if (b >= DAY) return null;
  const big = withSec ? 60 : 3600;
  return {
    type: "number",
    level: withSec ? 4 : 3,
    prompt: t("Wie lange dauert es von der ersten Uhrzeit bis zur zweiten?", "How long is it from the first time to the second?"),
    visual: `<div class="bigtext">${fmtTime(a, withSec)} → ${fmtTime(b, withSec)}</div>`,
    fields: withSec
      ? [{ label: null, unit: "min", answer: Math.floor(d / 60) }, { label: null, unit: "s", answer: d % 60 }]
      : [{ label: null, unit: "h", answer: Math.floor(d / 3600) }, { label: null, unit: "min", answer: (d % 3600) / 60 }],
    hints: durationHints(a, b, big),
    solution: t(`Es dauert <b>${durText(d)}</b>.`, `It takes <b>${durText(d)}</b>.`),
  };
}

export function genTimeCalc() {
  const kind = pick(["end", "end", "start", "start", "endSec", "startSec", "date"]);
  if (kind === "date") {
    // The date stays inside one month.
    const mo = pick(MONTHS), day = rnd(1, 20), a = rnd(6, 21) * 3600, days = rnd(1, 3), hours = rnd(1, 20);
    const d = days * DAY + hours * 3600, endDay = day + Math.floor((a + d) / DAY), endTime = (a + d) % DAY;
    const later = a + hours * 3600;
    const daysWords = plural(days, "Tag", "Tagen", "day", "days"), hoursWords = plural(hours, "Stunde", "Stunden", "hour", "hours");
    const hints = [t(`Gehe auf dem Kalender vorwärts: ${day}. ${mo.de} + ${plural(days, "Tag", "Tage", "day", "days").de} = ${day + days}. ${mo.de}. Die Uhrzeit bleibt ${fmtTime(a)}.`,
      `Move forward on the calendar: ${day} ${mo.en} + ${plural(days, "day", "days", "day", "days").en} = ${day + days} ${mo.en}. The time is still ${fmtTime(a)}.`)];
    hints.push(later < DAY
      ? t(`Zähle jetzt die Stunden dazu: ${fmtTime(a)} + ${hours}${NBSP}h = ${fmtTime(later)}.`, `Now add the hours: ${fmtTime(a)} + ${hours}${NBSP}h = ${fmtTime(later)}.`)
      : t(`Wenn du ${hours}${NBSP}h dazuzählst, erreichst du den nächsten Tag: ${endDay}. ${mo.de}, ${fmtTime(later - DAY)} Uhr.`,
        `Add ${hours}${NBSP}h to reach the next day: ${endDay} ${mo.en} at ${fmtTime(later - DAY)}.`));
    return {
      type: "number",
      level: 4,
      prompt: t(`Am ${day}. ${mo.de} um ${fmtTime(a)} Uhr stellt ein Kind beim Töpferkurs eine Tonfigur zum Trocknen hin. Nach ${daysWords.de} und ${hoursWords.de} ist sie trocken. An welchem Tag und um welche Uhrzeit ist das?`,
        `On ${day} ${mo.en} at ${fmtTime(a)}, a child sets a clay figure out to dry in pottery class. It will be dry in ${daysWords.en} and ${hoursWords.en}. On what day and at what time will it be dry?`),
      visual: t(`<div class="bigtext">${day}. ${mo.de} ${fmtTime(a)} + ${durText(d)} = ${SLOT}</div>`, `<div class="bigtext">${day} ${mo.en} ${fmtTime(a)} + ${durText(d)} = ${SLOT}</div>`),
      fields: [{ label: t(`Tag im ${mo.de}`, `day in ${mo.en}`), answer: endDay }, { label: t("Uhrzeit", "time"), time: "hm", answer: endTime }],
      hints,
      solution: t(`Die Tonfigur ist am <b>${endDay}. ${mo.de} um ${fmtTime(endTime)}</b> trocken.`, `The clay figure is dry on <b>${endDay} ${mo.en} at ${fmtTime(endTime)}</b>.`),
    };
  }
  const withSec = kind.endsWith("Sec"), toEnd = kind.startsWith("end");
  const d = withSec ? rnd(20, 600) : rnd(5, 180) * 60;
  const a = withSec ? rnd(7 * 3600, 21 * 3600) : rnd(6 * 60, 20 * 60) * 60, b = a + d;
  if (b >= DAY) return null;
  const given = toEnd ? a : b, answer = toEnd ? b : a, op = toEnd ? "+" : "−";
  const expr = `${fmtTime(given, withSec)} ${op} ${durText(d)}`;
  return {
    type: "number",
    level: withSec ? 4 : 3,
    prompt: toEnd ? t("Wann ist das Ende? Rechne die Uhrzeit aus.", "When is the end? Calculate the time.") : t("Wann war der Anfang? Rechne die Uhrzeit aus.", "When was the start? Calculate the time."),
    visual: `<div class="bigtext">${expr} = ${SLOT}</div>`,
    fields: [{ label: null, time: withSec ? "hms" : "hm", answer }],
    hints: calcHints(given, d, toEnd ? 1 : -1, withSec),
    solution: t(`${expr} = <b>${fmtTime(answer, withSec)}</b>`, `${expr} = <b>${fmtTime(answer, withSec)}</b>`),
  };
}

const ROUTES = [["Uster", "Wetzikon"], ["Meilen", "Rapperswil"], ["Cham", "Baar"], ["Sarnen", "Stans"], ["Wil", "Frauenfeld"], ["Knonau", "Rotkreuz"]];

export function genTimeWord() {
  const kind = pick(["croissants", "birdhouse", "parcelDelivery", "bandDeparture", "cinema", "puzzles", "audioDuration", "boxTimer"]);
  const T = (x, withSec) => fmtTime(x, withSec);
  const timeAnswer = (level, prompt, answer, hints, withSec) => ({
    type: "number",
    level,
    prompt,
    fields: [{ label: null, time: withSec ? "hms" : "hm", answer }],
    hints,
    solution: t(`Die gesuchte Uhrzeit ist <b>${T(answer, withSec)}</b>.`, `The time you need is <b>${T(answer, withSec)}</b>.`),
  });
  if (kind === "croissants") {
    const a = rnd(7 * 60, 7 * 60 + 50) * 60, d = rnd(8, 25) * 60;
    return timeAnswer(3, t(`Um ${T(a)} Uhr stellt die Bäckerin die Gipfeli in den Ofen. Sie brauchen ${d / 60}${NBSP}min im Ofen. Wann sind sie fertig?`,
      `At ${T(a)} the baker puts the croissants in the oven. They need ${d / 60}${NBSP}min in the oven. When are they ready?`), a + d, calcHints(a, d, 1, false));
  }
  if (kind === "birdhouse") {
    const a = rnd(8 * 60, 14 * 60) * 60, d = rnd(40, 200) * 60, b = a + d;
    return {
      type: "number",
      level: 4,
      prompt: t(`Eine Familie baut ein Vogelhaus. Um ${T(a)} Uhr fängt sie an. Um ${T(b)} Uhr ist das Haus fertig. Wie lange arbeitet die Familie daran?`,
        `A family makes a birdhouse. They start at ${T(a)} and finish at ${T(b)}. How long do they work on it?`),
      fields: [{ label: null, unit: "h", answer: Math.floor(d / 3600) }, { label: null, unit: "min", answer: (d % 3600) / 60 }],
      hints: durationHints(a, b, 3600),
      solution: t(`Die Familie arbeitet <b>${durText(d)}</b> am Vogelhaus.`, `The family works on the birdhouse for <b>${durText(d)}</b>.`),
    };
  }
  if (kind === "parcelDelivery" || kind === "bandDeparture") {
    const [from, to] = pick(ROUTES), a = rnd(6 * 60, 20 * 60) * 60, d = rnd(30, 150) * 60, b = a + d;
    if (kind === "parcelDelivery") {
      return timeAnswer(4, t(`Ein Lieferwagen startet in ${from} um ${T(a)} Uhr. Mit allen Stopps dauert die Fahrt ${durText(d)}. Um welche Uhrzeit liefert der Fahrer das letzte Paket in ${to} ab?`,
        `A delivery van sets off from ${from} at ${T(a)}. The trip takes ${durText(d)} with all the stops. At what time does the driver deliver the last parcel in ${to}?`), b, calcHints(a, d, 1, false));
    }
    return timeAnswer(4, t(`Der Musikverein spielt um ${T(b)} Uhr in ${to}. Die Gruppe braucht mit dem Bus ab ${from} genau ${durText(d)} bis zum Auftritt. Um welche Uhrzeit muss sie in ${from} losfahren?`,
      `A band plays in ${to} at ${T(b)}. It takes exactly ${durText(d)} from its bus departure in ${from} to the start of the show. At what time must the band leave ${from}?`), a, calcHints(b, d, -1, false));
  }
  if (kind === "cinema") {
    const now = rnd(13 * 60, 18 * 60) * 60, wait = rnd(2, 25), late = pick([0, 0, 3, 5, 10]), dep = now + wait * 60;
    const city = pick(["Uster", "Wetzikon", "Meilen", "Rapperswil", "Sarnen", "Stans"]);
    const hints = [t(`Lies die Uhr ab und zähle 12 Stunden dazu: Aus ${T(now - 12 * 3600)} wird ${T(now)}.`, `Read the clock and add 12 hours: ${T(now - 12 * 3600)} becomes ${T(now)}.`),
      t(`Bis zum geplanten Beginn vergehen ab ${T(now)} noch ${wait}${NBSP}min.`, `From ${T(now)} there are ${wait}${NBSP}min until the scheduled start.`)];
    if (late) hints.push(t(`Zähle die zusätzlichen Minuten dazu: ${wait}${NBSP}min + ${late}${NBSP}min = ${wait + late}${NBSP}min.`, `Add the extra minutes: ${wait}${NBSP}min + ${late}${NBSP}min = ${wait + late}${NBSP}min.`));
    return {
      type: "number",
      level: 4,
      prompt: t(`Am Nachmittag wartet eine Familie in ${city} vor dem Kino. Die Uhr zeigt, wie spät es jetzt ist. Auf dem Plakat steht als Filmbeginn ${T(dep)} Uhr. ${late ? `Der Film beginnt ${late} Minuten später als geplant. ` : ""}Wie viele Minuten muss die Familie noch warten?`,
        `In the afternoon, a family waits outside the cinema in ${city}. The clock shows the time now. The poster says the film starts at ${T(dep)}. ${late ? `The film starts ${late} minutes later than planned. ` : ""}How many more minutes must the family wait?`),
      visual: clockSvg(now, false, "none"),
      fields: [{ label: null, unit: "min", answer: wait + late }],
      hints,
      solution: t(`Bis zum Filmbeginn sind es noch <b>${wait + late}${NBSP}min</b>.`, `There are <b>${wait + late}${NBSP}min</b> left until the film starts.`),
    };
  }
  if (kind === "puzzles") {
    const a1 = rnd(9 * 60, 15 * 60) * 60, d1 = rnd(40, 90) * 60, a2 = a1 + rnd(5, 40) * 60;
    const d2 = Math.random() < 0.2 ? d1 : d1 + pick([-1, 1]) * rnd(2, 15) * 60;
    const answer = d1 > d2 ? "1" : d2 > d1 ? "2" : "=";
    const result = {
      1: t("Das <b>rote Team</b> braucht länger.", "The <b>red team</b> takes longer."),
      2: t("Das <b>blaue Team</b> braucht länger.", "The <b>blue team</b> takes longer."),
      "=": t("Beide Teams brauchen <b>gleich lang</b>.", "Both teams take <b>the same time</b>."),
    }[answer];
    return {
      type: "choice",
      level: 5,
      prompt: t(`An einem Spieltag lösen zwei Teams je ein Riesenpuzzle. Das rote Team puzzelt von ${T(a1)} bis ${T(a1 + d1)} Uhr. Das blaue Team puzzelt von ${T(a2)} bis ${T(a2 + d2)} Uhr. Wer braucht länger?`,
        `At a games event, each team solves a giant jigsaw puzzle. The red team works from ${T(a1)} to ${T(a1 + d1)}. The blue team works from ${T(a2)} to ${T(a2 + d2)}. Who takes longer?`),
      options: [{ label: t("rotes Team", "red team"), value: "1" }, { label: t("blaues Team", "blue team"), value: "2" }, { label: t("beide gleich lang", "both the same"), value: "=" }],
      answer,
      hints: [t("Ziehe für jedes Team die Startzeit von der Endzeit ab.", "For each team, subtract the start time from the end time."),
        t(`Das rote Team braucht ${durText(d1)}: von ${T(a1)} bis ${T(a1 + d1)}.`, `The red team takes ${durText(d1)}: from ${T(a1)} to ${T(a1 + d1)}.`),
        t(`Das blaue Team braucht ${durText(d2)}: von ${T(a2)} bis ${T(a2 + d2)}.`, `The blue team takes ${durText(d2)}: from ${T(a2)} to ${T(a2 + d2)}.`)],
      solution: t(`Rot: ${durText(d1)}. Blau: ${durText(d2)}. ${result.de}`, `Red: ${durText(d1)}. Blue: ${durText(d2)}. ${result.en}`),
    };
  }
  if (kind === "boxTimer") {
    // The time estimate can be correct or incorrect.
    const mo = pick(MONTHS), day = rnd(1, 20), k = rnd(1, 2);
    const a = rnd(8 * 60, 21 * 60) * 60, b = rnd(8 * 60, 20 * 60) * 60;
    const real = DAY - a + (k - 1) * DAY + b;
    const right = Math.random() < 0.4;
    const said = right ? real : real + pick([-4, -2, -1, 1, 2, 4]) * 3600;
    const hints = [t(`Rechne den Rest des ersten Tages aus: ab ${T(a)} bis Mitternacht sind es ${durText(DAY - a)}.`, `Find the time left on the first day: from ${T(a)} to midnight is ${durText(DAY - a)}.`)];
    if (k === 2) hints.push(t(`Dazwischen liegt ein voller Tag mit 24${NBSP}h.`, `There is a full day of 24${NBSP}h in between.`));
    hints.push(t(`Rechne am ${day + k}. ${mo.de} die Zeit seit Mitternacht dazu: bis ${T(b)} sind es ${durText(b)}.`, `Add the time since midnight on ${day + k} ${mo.en}: until ${T(b)} it is ${durText(b)}.`));
    hints.push(t(`Die Wartezeit beträgt insgesamt ${hoursText(real)}.`, `The total wait is ${hoursText(real)}.`));
    return {
      type: "choice",
      level: 5,
      prompt: t(`Eine Bücherkiste bleibt bis zum ${day + k}. ${mo.de} um ${T(b)} Uhr verschlossen. Am ${day}. ${mo.de} um ${T(a)} Uhr zeigt der Timer noch ${hoursText(said)} an. Zeigt er die richtige Wartezeit an?`,
        `A box of books stays locked until ${day + k} ${mo.en} at ${T(b)}. On ${day} ${mo.en} at ${T(a)}, the timer shows ${hoursText(said)} left. Does it show the correct wait?`),
      options: [{ label: t("Ja, der Timer stimmt.", "Yes, the timer is correct."), value: "yes" }, { label: t("Nein, der Timer stimmt nicht.", "No, the timer is wrong."), value: "no" }],
      answer: right ? "yes" : "no",
      hints,
      solution: right
        ? t(`<b>Ja.</b> Die Kiste öffnet sich in ${hoursText(real)}.`, `<b>Yes.</b> The box opens in ${hoursText(real)}.`)
        : t(`<b>Nein.</b> Die Kiste öffnet sich in ${hoursText(real)}, nicht in ${hoursText(said)}.`, `<b>No.</b> The box opens in ${hoursText(real)}, not ${hoursText(said)}.`),
    };
  }
  const start = rnd(8 * 60, 17 * 60) * 60, w = rnd(60, 600), end = start + w;
  if (Math.random() < 0.5) {
    return timeAnswer(4, t(`Ein Kinderchor beginnt seine Aufnahme um ${T(start, true)}. Die Aufnahme dauert ${durText(w)}. Um welche Uhrzeit endet die Aufnahme?`,
      `A children's choir starts its recording at ${T(start, true)}. The recording lasts ${durText(w)}. At what time does it end?`), end, calcHints(start, w, 1, true), true);
  }
  return {
    type: "number",
    level: 4,
    prompt: t(`Die Erzählerin im Radio beginnt um ${T(start, true)}. Ihr letztes Wort spricht sie um ${T(end, true)}. Wie lange dauert ihre Geschichte?`,
      `The storyteller on the radio starts at ${T(start, true)}. She says her last word at ${T(end, true)}. How long is her story?`),
    fields: [{ label: null, unit: "min", answer: Math.floor(w / 60) }, { label: null, unit: "s", answer: w % 60 }],
    hints: durationHints(start, end, 60),
    solution: t(`Die Geschichte dauert <b>${durText(w)}</b>.`, `The story lasts <b>${durText(w)}</b>.`),
  };
}
