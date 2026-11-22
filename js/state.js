// Browser storage, screen texts and page state.
import { t } from "./common.js";

// Some browsers block the storage, for example a sandbox or strict privacy settings. Then the page keeps
// the settings and the points in memory, and they start again after a reload.
export let storage;
try {
  storage = window.localStorage;
  storage.getItem("m4-lang");
} catch {
  const memory = new Map();
  storage = {
    getItem: key => (memory.has(key) ? memory.get(key) : null),
    setItem: (key, value) => memory.set(key, String(value)),
  };
}

export const UI = {
  intro: t("Wähle ein Thema. Für jede richtige Antwort beim ersten Versuch bekommst du einen Punkt. Mit 5 Punkten bekommst du einen Stern ⭐.",
    "Choose a topic. You get one point for each right answer at the first try. With 5 points you get a star ⭐."),
  mix: t("🎯 Prüfungstraining starten (15 Aufgaben aus diesen Themen)", "🎯 Start test practice (15 problems from these topics)"),
  back: t("← Übersicht", "← Overview"),
  check: t("Prüfen", "Check"),
  next: t("Weiter →", "Next →"),
  hint: t("💡 Tipp", "💡 Hint"),
  reset: t("Zurücksetzen", "Reset"),
  resetAll: t("Alle Punkte löschen", "Delete all points"),
  resetAsk: t("Wirklich alle Punkte löschen?", "Really delete all points?"),
  resetWarn: t("Alle Punkte und Sterne sind dann weg. Du kannst sie nicht zurückholen.",
    "All points and stars will be gone. You cannot get them back."),
  resetNo: t("Nein, behalten", "No, keep them"),
  resetYes: t("Ja, löschen", "Yes, delete"),
  answerFirst: t("Gib zuerst eine Antwort ein.", "Enter an answer first."),
  wrong: t("Noch nicht ganz. Lies den Tipp und versuch es nochmal.", "Not quite. Read the hint and try again."),
  shown: t("Schau dir die Lösung genau an. Die nächste Aufgabe schaffst du!", "Look at the solution carefully. You can do the next one!"),
  ok: [t("Richtig! 🎉", "Correct! 🎉"), t("Super gemacht! ⭐", "Well done! ⭐"), t("Genau! 👍", "Exactly! 👍"), t("Toll! 🙌", "Great! 🙌")],
  star: t("Du hast einen Stern für dieses Thema! ⭐", "You have a star for this topic! ⭐"),
  of: t("von", "of"),
  task: t("Aufgabe", "Problem"),
  done: t("Fertig!", "Finished!"),
  score: t("Beim ersten Versuch richtig", "Right at the first try"),
  again: t("Diese Themen nochmals üben:", "Practise these topics again:"),
  allGood: t("Alles beim ersten Versuch richtig. Du bist bereit für die Prüfung! 🏆", "Everything right at the first try. You are ready for the test! 🏆"),
  gameReward: t("🧱 Belohnung: Klötzli-Regen spielen (5 Minuten)", "🧱 Reward: play Block Rain (5 minutes)"),
  gamePlayed: t("Du hast dein Spiel gespielt. Schaffst du nochmals 15 von 15?", "You played your game. Can you get 15 of 15 again?"),
  gameTitle: t("🧱 Klötzli-Regen", "🧱 Block Rain"),
  gameRows: t("Reihen", "Rows"),
  gamePoints: t("Punkte", "Points"),
  gameLeft: t("Nach links", "Move left"),
  gameTurn: t("Drehen", "Turn"),
  gameRight: t("Nach rechts", "Move right"),
  gameDrop: t("Fallen lassen", "Drop"),
  gameKeys: t("← → bewegen, ↑ drehen, ↓ schneller, Leertaste fallen lassen", "← → move, ↑ turn, ↓ faster, space drop"),
  gameEnd: t("Spiel beenden", "End the game"),
  gameBack: t("Zurück zur Zusammenfassung", "Back to the summary"),
  gameDone: rows => t(`Fertig! Du hast ${rows} ${rows === 1 ? "Reihe" : "Reihen"} geschafft.`, `Finished! You cleared ${rows} ${rows === 1 ? "row" : "rows"}.`),
  home: t("Zur Übersicht", "To the overview"),
  mixAgain: t("Noch ein Prüfungstraining", "Another test practice"),
  speed: t("⏱️ Tempo im Prüfungstraining:", "⏱️ Speed in the test practice:"),
  speeds: { slow: t("🐢 gemütlich", "🐢 relaxed"), normal: t("🐇 normal", "🐇 normal"), fast: t("🚀 schnell", "🚀 fast") },
  level: t("Stufe", "Level"),
  timeUp: t("⏰ Die Zeit ist um. Mach in Ruhe fertig!", "⏰ Time is up. Finish calmly!"),
  inTime: t("Richtig und in der Zeit", "Right and in time"),
  times: t("Zeiten", "Times"),
  timeUsed: t("Gebrauchte Zeit", "Time used"),
  planned: t("geplant", "planned"),
  used: t("gebraucht", "used"),
  nr: t("Nr.", "No."),
  topic: t("Thema", "Topic"),
};

export const S = {
  lang: storage.getItem("m4-lang") || "de",
  block: storage.getItem("m4-block") || "lz",
  sound: storage.getItem("m4-sound") !== "off",
  timerOn: storage.getItem("m4-timer") !== "off",
  speed: storage.getItem("m4-speed") || "normal",
  timer: null,
  progress: JSON.parse(storage.getItem("m4-progress") || "{}"),
  view: "home", skill: null, q: null, input: null,
  attempts: 0, hintsShown: 0, done: false, result: null, firstTry: true, marks: null, msg: null, okMsg: null, starNow: false,
  mix: null, game: null, gameClock: null,
};
export const app = document.getElementById("app");

export function L(x) {
  if (x == null) return "";
  if (typeof x === "string") return x;
  if (S.lang === "both") return x.de === x.en ? x.de : `${x.de}<span class="en">${x.en}</span>`;
  return x[S.lang];
}
// Plain text for an attribute such as aria-label. DE + EN gives "Deutsch · English".
export function plainText(x) {
  if (S.lang === "both") return x.de + " · " + x.en;
  return x[S.lang];
}
export function save() { storage.setItem("m4-progress", JSON.stringify(S.progress)); }
