// Entry module: practice, timer, views and events. Only the tests import newQuestion, startSkill, doCheck, doNext, render and openResetDialog.
import { pick, fmt } from "./common.js";
import { numberLineSvg } from "./units/zahlenstrahl.js";
import { skillsOfBlock, generate, isAnswered, check, nextMastery, timeLimit, SECTIONS, SKILLS, BLOCKS, SPEED_FACTOR } from "./topics.js";
import { earnsGame, newGame, GAME_COLS, GAME_ROWS, GAME_MINUTES, gameMove, gameTurn, gameDown, gameDrop, dropInterval } from "./game.js";
import { storage, UI, S, app, L, plainText, save } from "./state.js";
import { play } from "./sounds.js";
import { party, celebrate, closeParty } from "./party.js";

function dots(id) {
  const p = S.progress[id] || 0;
  return `<b>${"●".repeat(p)}</b>${"○".repeat(5 - p)} ${p >= 5 ? "⭐" : ""}`;
}

export function newQuestion(skillId) {
  S.skill = skillId;
  S.q = generate(skillId);
  S.input = S.q.type === "number" ? S.q.fields.map(() => "") : S.q.type === "order" || S.q.type === "multi" ? [] : null;
  S.attempts = 0; S.hintsShown = 0; S.done = false; S.result = null; S.firstTry = true; S.marks = null; S.msg = null; S.starNow = false;
  // The test practice always measures the time, also with the timer off, so the summary can show it.
  S.timer = S.mix ? { start: performance.now(), limit: timeLimit(S.q.level, S.speed), used: null, over: false } : null;
}

export function startSkill(id) { S.mix = null; S.view = "practice"; newQuestion(id); render(); }
function startMix() {
  S.mix = { i: 1, n: 15, correct: 0, missed: {}, last: null, log: [] };
  S.view = "practice"; newQuestion(pickMixSkill()); render();
}
function pickMixSkill() {
  const ids = skillsOfBlock(S.block).map(s => s.id);
  let id;
  do { id = pick(ids); } while (S.mix.last === id);
  S.mix.last = id;
  return id;
}

function syncInputs() {
  if (S.q && S.q.type === "number" && !S.done) {
    S.input = S.q.fields.map((_, i) => { const el = document.getElementById("f" + i); return el ? el.value : ""; });
  }
}

export function doCheck() {
  syncInputs();
  const q = S.q;
  if (!isAnswered(q, S.input)) { S.msg = "answerFirst"; render(); return; }
  const r = check(q, S.input);
  S.marks = r.fields || null;
  if (r.ok) {
    S.done = true;
    S.result = S.firstTry ? "first" : "later";
    S.okMsg = pick(UI.ok);
  } else {
    S.attempts++; S.firstTry = false;
    if (S.attempts >= 3) { S.done = true; S.result = "shown"; }
    else { S.hintsShown = Math.min(q.hints.length, S.hintsShown + 1); S.msg = "wrong"; }
  }
  if (S.done) {
    S.msg = null;
    if (S.timer) S.timer.used = (performance.now() - S.timer.start) / 1000;
    const before = S.progress[S.skill] || 0;
    S.progress[S.skill] = nextMastery(before, S.result);
    S.starNow = before < 5 && S.progress[S.skill] >= 5;
    save();
    if (S.mix) {
      if (S.result === "first") S.mix.correct++;
      else S.mix.missed[S.skill] = (S.mix.missed[S.skill] || 0) + 1;
      S.mix.log.push({ skill: S.skill, level: S.q.level, limit: S.timer.limit, used: S.timer.used, result: S.result });
    }
  }
  if (!r.ok) play(S.result === "shown" ? "fail" : "wrong");
  else if (S.starNow) play("star");
  else play("right");
  render();
  if (S.starNow) celebrate();
}

export function doNext() {
  if (S.mix) {
    if (S.mix.i >= S.mix.n) { S.view = "summary"; render(); return; }
    S.mix.i++;
    newQuestion(pickMixSkill());
  } else {
    newQuestion(S.skill);
  }
  render();
}

function doHint() {
  syncInputs();
  S.hintsShown = Math.min(S.q.hints.length, S.hintsShown + 1);
  // A hint after the answer does not change the points.
  if (!S.done) S.firstTry = false;
  play("hint");
  render();
}

// ---------- timer ----------
// A soft timer: when the time is up, the child can still finish the problem, and the points do not change.

function mmss(seconds) {
  const s = Math.round(seconds);
  return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0");
}

function timerHtml() {
  const tm = S.timer;
  const used = tm.used === null ? (performance.now() - tm.start) / 1000 : tm.used;
  const left = Math.max(0, tm.limit - used);
  const cls = tm.over ? "over" : left < tm.limit * 0.3 ? "low" : "";
  const word = S.lang === "en" ? UI.level.en : UI.level.de;
  const text = tm.over ? L(UI.timeUp) : `⏱️ ${mmss(left)} · ${word} ${S.q.level}`;
  return `<div id="timer" class="timer ${cls}"><div class="timer-track"><div class="timer-bar" style="width:${(100 * left / tm.limit).toFixed(1)}%"></div></div><span>${text}</span></div>`;
}

// Updates only the timer element, so the other parts of the page (and typed answers) stay as they are.
function tickTimer() {
  const tm = S.timer;
  if (!tm || !S.timerOn || S.view !== "practice" || tm.used !== null) return;
  if (!tm.over && (performance.now() - tm.start) / 1000 >= tm.limit) {
    tm.over = true;
    play("timeup");
  }
  const el = document.getElementById("timer");
  if (el) el.outerHTML = timerHtml();
}
setInterval(tickTimer, 250);

// A <dialog>, not confirm(): a sandbox can block confirm(), but not a dialog of the page.
// Focus "Nein" first so that Enter does not delete points by mistake.
export function openResetDialog() {
  const dialog = document.getElementById("reset-dialog");
  dialog.innerHTML = `<p class="dialog-title">⚠️ ${L(UI.resetAsk)}</p><p>${L(UI.resetWarn)}</p>
    <div class="dialog-buttons"><button class="btn light" data-act="resetno" autofocus>${L(UI.resetNo)}</button>
    <button class="btn danger" data-act="resetyes"><span aria-hidden="true">🗑️</span><span>${L(UI.resetYes)}</span></button></div>`;
  dialog.setAttribute("aria-label", plainText(UI.resetAsk));
  dialog.showModal();
}
// ---------- views ----------

function viewHome() {
  let h = `<div class="blocks">${BLOCKS.map(b => `<button class="block-btn ${S.block === b.id ? "on" : ""}" data-block="${b.id}">${L(b.name)}</button>`).join("")}</div>`;
  h += `<p>${L(UI.intro)}</p><p><button class="big-btn" data-act="mix">${L(UI.mix)}</button></p>`;
  if (S.timerOn) {
    h += `<div class="speed"><span class="speed-label">${L(UI.speed)}</span>${Object.keys(SPEED_FACTOR).map(k =>
      `<button class="chip ${S.speed === k ? "sel" : ""}" data-speed="${k}">${L(UI.speeds[k])}</button>`).join("")}</div>`;
  }
  if (S.lang !== "de") h += parentNote();
  const block = BLOCKS.find(b => b.id === S.block);
  for (const sec of SECTIONS.filter(s => block.sections.includes(s.id))) {
    h += `<h2>${L(sec.name)}</h2><div class="grid">`;
    for (const sk of SKILLS.filter(s => s.sec === sec.id)) {
      h += `<button class="skill" data-skill="${sk.id}">${L(sk.name)}<div class="dots">${dots(sk.id)}</div></button>`;
    }
    h += "</div>";
  }
  h += `<p style="margin-top:30px"><button class="btn danger" data-act="resetall"><span aria-hidden="true">🗑️</span><span>${L(UI.resetAll)}</span></button></p>`;
  return h;
}

function parentNote() {
  const rows = S.block === "lz" ? [["length / width / height / thickness / perimeter", "Länge / Breite / Höhe / Dicke / Umfang"],
    ["measuring tool", "Messinstrument"], ["ribbon / piece", "Band / Stück"], ["to cut off / to glue together", "abschneiden / aneinanderkleben"],
    ["word problem", "Sachaufgabe"], ["time of day / point in time", "Uhrzeit / Zeitpunkt"], ["duration", "Zeitdauer"],
    ["in digital form (08:25)", "in digitaler Schreibweise"], ["quarter past four / quarter to four", "Viertel nach vier / Viertel vor vier"],
    ["half past eight (8:30)", "halb neun (!)"], ["twenty-five past eight (8:25)", "fünf vor halb neun"],
    ["noon (12:00) / midnight (00:00)", "Mittag / Mitternacht"], ["before noon / after noon", "vor dem Mittag / nach dem Mittag"],
    ["in the morning / in the afternoon / in the evening", "morgens / nachmittags / abends"], ["delay", "Verspätung"],
    ["mm, cm, dm, m, km · s, min, h, d (day)", "the same symbols"]]
    : [["number line", "Zahlenstrahl"], ["number before / after", "Vorgänger / Nachfolger"],
    ["neighbouring tens / hundreds / thousands", "Nachbarzehner / -hunderter / -tausender"], ["is less than / greater than", "ist kleiner als / grösser als"],
    ["to put in order", "ordnen"], ["even / odd", "gerade / ungerade"], ["digit / number", "Ziffer / Zahl"], ["place value chart", "Stellenwerttafel"],
    ["digit sum", "Quersumme"], ["Who am I?", "Wer bin ich?"],
    ["ones, tens, hundreds, thousands, ten thousands, hundred thousands", "E, Z, H, T, ZT, HT"]];
  const timeWords = S.block === "lz"
    ? "In English mode, the German time words (for example „fünf vor halb neun“) stay in German, because your child reads them in the test. The hints explain them in English. "
    : "";
  return `<div class="note"><b>For the parent.</b> Choose <b>DE + EN</b> at the top to see the German text and the English text together. ${timeWords}
    The problems are new every time, so your child can practise as long as they want. A wrong answer shows a hint. After 3 wrong tries the solution appears.
    Use the German words below when you explain, because the test uses them.
    The 🔊 button at the top turns the sounds on and off.
    The ⏱️ button turns the timer of the test practice on and off. Each problem has a difficulty level from 1 to 5,
    and the level gives its time: 20, 30, 45, 60 or 90 seconds. The speed below the green button multiplies these times
    (relaxed × 1.5, fast × 0.75). When the time is up, your child can still finish the problem, and the points do not change.
    At the end, the test practice shows the planned time and the used time of each problem.
    On an iPhone or iPad, add this page to the Home Screen and always open it there, so that the points stay.</div>
    <table class="gl"><tr><th>English</th><th>German (school word)</th></tr>${rows.map(r => `<tr><td>${r[0]}</td><td>${r[1]}</td></tr>`).join("")}</table>`;
}

function viewInput(q) {
  const dis = S.done ? "disabled" : "";
  if (q.type === "number") {
    return `<div class="fields">${q.fields.map((f, i) => {
      const cls = S.marks ? (S.marks[i] ? "right" : "wrong") : "";
      // A time field opens the number keyboard with a separator key. The key is "." or "," by the region of the phone.
      const kind = f.time
        ? `class="${cls} time" inputmode="decimal" placeholder="${f.time === "hms" ? "hh:mm:ss" : "hh:mm"}"`
        : `class="${cls}${f.unit ? " short" : ""}" inputmode="numeric"`;
      const input = `<input id="f${i}" ${kind} autocomplete="off" value="${S.input[i] || ""}" ${dis}>`;
      return `<label>${L(f.label)}${f.unit ? `<span class="inrow">${input}<span class="unit">${f.unit}</span></span>` : input}</label>`;
    }).join("")}</div>`;
  }
  if (q.type === "choice") {
    return `<div class="chips">${q.options.map(o => `<button class="chip ${S.input === o.value ? "sel" : ""}" data-choice="${o.value}" ${dis}>${L(o.label)}</button>`).join("")}</div>`;
  }
  if (q.type === "multi") {
    return `<div class="chips">${q.options.map((o, i) => `<button class="chip ${S.input.includes(i) ? "sel" : ""}" data-multi="${i}" ${dis}>${o}</button>`).join("")}</div>`;
  }
  if (q.type === "order") {
    const chosen = S.input.map((idx, k) => `${k ? `<span class="sym">${q.sym}</span>` : ""}<button class="chip sel" data-unpick="${k}" ${dis}>${fmt(q.items[idx])}</button>`).join("");
    const left = q.items.map((v, idx) => (S.input.includes(idx) ? "" : `<button class="chip" data-pick="${idx}" ${dis}>${fmt(v)}</button>`)).join("");
    return `<div class="chips">${left}</div><div class="orderrow">${chosen}</div>` +
      (S.done ? "" : `<button class="btn light" data-act="clearorder">${L(UI.reset)}</button>`);
  }
  if (q.type === "line") {
    const marks = [];
    if (S.input !== null && !(S.done && S.input === q.answer)) marks.push({ i: S.input, color: S.done ? "#c0392b" : "#1f5a96", label: S.done ? "✗" : "" });
    if (S.done) marks.push({ i: q.answer, color: "#1e8a4c", label: fmt(q.line.start + q.answer * q.line.unit) });
    return `<div class="visual">${numberLineSvg(q.line, { marks, clickable: !S.done })}</div>`;
  }
  return "";
}

function viewPractice() {
  const q = S.q, sk = SKILLS.find(s => s.id === S.skill);
  const right = S.mix ? `${L(UI.task)} ${S.mix.i} ${L(UI.of)} ${S.mix.n}` : `<span class="dots">${dots(sk.id)}</span>`;
  let h = `<div class="topbar"><button class="btn light" data-act="home">${L(UI.back)}</button><div><b>${L(sk.name)}</b> &nbsp; ${right}</div></div>`;
  h += `<div class="card">${S.timer && S.timerOn ? timerHtml() : ""}<div class="prompt">${L(q.prompt)}</div>`;
  if (q.visual) h += `<div class="visual">${L(q.visual)}</div>`;
  h += viewInput(q);
  if (S.hintsShown) h += `<div class="hints">${q.hints.slice(0, S.hintsShown).map(x => `<div class="hint">💡 ${L(x)}</div>`).join("")}</div>`;
  if (S.msg) h += `<div class="fb no">${L(UI[S.msg])}</div>`;
  if (S.done) {
    const cls = S.result === "shown" ? "shown" : "ok";
    const head = S.result === "shown" ? L(UI.shown) : L(S.okMsg);
    h += `<div class="fb ${cls}"><b>${head}</b><br>${L(q.solution)}${S.starNow ? `<br><b>${L(UI.star)}</b>` : ""}</div>`;
  }
  h += `<div class="actions">`;
  if (S.done) h += `<button class="btn go" data-act="next">${L(UI.next)}</button>`;
  else h += `<button class="btn go" data-act="check">${L(UI.check)}</button>`;
  // The hint button stays after the answer, because the hints still help the child to learn.
  h += `<button class="btn light" data-act="hint" ${S.hintsShown >= q.hints.length ? "disabled" : ""}>${L(UI.hint)}</button>`;
  return h + "</div></div>";
}

function viewSummary() {
  const m = S.mix;
  const missed = Object.keys(m.missed);
  let h = `<div class="card"><h2>${L(UI.done)}</h2><p class="bigtext">${L(UI.score)}: ${m.correct} ${L(UI.of)} ${m.n}</p>`;
  if (S.timerOn) {
    const inTime = m.log.filter(x => x.result !== "shown" && x.used <= x.limit).length;
    h += `<p class="bigtext">⏱️ ${L(UI.inTime)}: ${inTime} ${L(UI.of)} ${m.n}</p>`;
  }
  if (missed.length === 0) h += `<p>${L(UI.allGood)}</p>`;
  else {
    h += `<p>${L(UI.again)}</p><div class="grid">`;
    for (const id of missed) {
      const sk = SKILLS.find(s => s.id === id);
      h += `<button class="skill" data-skill="${id}">${L(sk.name)}<div class="dots">${dots(id)}</div></button>`;
    }
    h += "</div>";
  }
  if (m.gamePlayed) h += `<p>${L(UI.gamePlayed)}</p>`;
  else if (earnsGame(m)) h += `<button class="big-btn" data-act="game">${L(UI.gameReward)}</button>`;
  h += `<div class="actions"><button class="btn go" data-act="mix">${L(UI.mixAgain)}</button><button class="btn light" data-act="home">${L(UI.home)}</button></div>`;
  const used = m.log.reduce((s, x) => s + x.used, 0);
  const planned = m.log.reduce((s, x) => s + x.limit, 0);
  const rows = m.log.map((x, i) => {
    const sk = SKILLS.find(s => s.id === x.skill);
    const late = x.used > x.limit ? ' style="color:var(--red);font-weight:bold"' : "";
    return `<tr><td>${i + 1}</td><td>${L(sk.name)}</td><td>${x.level}</td><td>${mmss(x.limit)}</td><td${late}>${mmss(x.used)}</td><td>${x.result === "shown" ? "✗" : "✓"}</td></tr>`;
  }).join("");
  h += `<h2>⏱️ ${L(UI.times)}</h2><p>${L(UI.timeUsed)}: <b>${mmss(used)}</b> (${L(UI.planned)}: ${mmss(planned)})</p>`;
  h += `<table class="gl"><tr><th>${L(UI.nr)}</th><th>${L(UI.topic)}</th><th>${L(UI.level)}</th><th>${L(UI.planned)}</th><th>${L(UI.used)}</th><th></th></tr>${rows}</table>`;
  return h + "</div>";
}

function viewGame() {
  const game = S.game;
  let h = `<div class="card game-card"><h2>${L(UI.gameTitle)}</h2>`;
  if (S.gameClock.ended) {
    const rows = game.rows;
    h += `<p>${L(UI.gameDone(rows))}</p>`;
    h += `<p>${L(UI.gamePoints)}: ${game.points}</p><button class="btn go" data-act="gameback">${L(UI.gameBack)}</button>`;
  } else {
    const left = Math.max(0, GAME_MINUTES * 60000 - S.gameClock.playedMs);
    h += `<p class="game-stats">${L(UI.gameRows)}: <b id="game-rows">${game.rows}</b> · ${L(UI.gamePoints)}: <b id="game-points">${game.points}</b></p>`;
    h += `<div class="timer"><div class="timer-track"><div id="game-time-bar" class="timer-bar" style="width:${100 * left / (GAME_MINUTES * 60000)}%"></div></div><span id="game-time">${mmss(left / 1000)}</span></div>`;
    h += `<canvas id="game-canvas" aria-label="${plainText(UI.gameTitle)}"></canvas>`;
    h += `<div class="game-controls">
      <button data-act="gleft" aria-label="${plainText(UI.gameLeft)}">◀</button>
      <button data-act="gturn" aria-label="${plainText(UI.gameTurn)}">⟳</button>
      <button data-act="gright" aria-label="${plainText(UI.gameRight)}">▶</button>
      <button data-act="gdrop" aria-label="${plainText(UI.gameDrop)}">⤓</button>
    </div><p class="small game-hint">${L(UI.gameKeys)}</p><button class="btn light" data-act="gameend">${L(UI.gameEnd)}</button>`;
  }
  return h + "</div>";
}

function endGame() {
  if (S.gameClock.ended) return;
  S.gameClock.ended = true;
  play("timeup");
  render();
}

function gameAction(action) {
  if (S.view !== "game" || S.gameClock.ended) return;
  if (action === "gleft") gameMove(S.game, -1);
  else if (action === "gright") gameMove(S.game, 1);
  else if (action === "gturn") gameTurn(S.game);
  else if (action === "gdown") { if (gameDown(S.game) > 0) play("right"); }
  else if (action === "gdrop") { if (gameDrop(S.game) > 0) play("right"); }
  if (S.game.over) endGame();
}

function drawGame() {
  const canvas = document.getElementById("game-canvas");
  if (!canvas) return;
  const ratio = window.devicePixelRatio;
  const width = Math.round(canvas.clientWidth * ratio), height = Math.round(canvas.clientHeight * ratio);
  if (canvas.width !== width || canvas.height !== height) { canvas.width = width; canvas.height = height; }
  const ctx = canvas.getContext("2d");
  const cell = canvas.width / GAME_COLS;
  const rowHeight = canvas.height / GAME_ROWS;
  ctx.fillStyle = "#e6f3f8";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = "#ccdee6";
  ctx.lineWidth = ratio;
  for (let col = 1; col < GAME_COLS; col++) {
    ctx.beginPath(); ctx.moveTo(col * cell, 0); ctx.lineTo(col * cell, canvas.height); ctx.stroke();
  }
  for (let row = 1; row < GAME_ROWS; row++) {
    ctx.beginPath(); ctx.moveTo(0, row * rowHeight); ctx.lineTo(canvas.width, row * rowHeight); ctx.stroke();
  }
  const colors = { zweier: "#c95548", dreier: "#edc44e", ecke: "#79533e", wuerfel: "#cfaa78" };
  function block(row, col, id) {
    const x = col * cell + ratio * 2, y = row * rowHeight + ratio * 2;
    const w = cell - ratio * 4, h = rowHeight - ratio * 4;
    ctx.fillStyle = colors[id];
    ctx.strokeStyle = "#765336";
    ctx.beginPath(); ctx.roundRect(x, y, w, h, ratio * 4); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = "rgba(255,255,255,0.3)";
    ctx.beginPath(); ctx.moveTo(x + w * 0.15, y + h * 0.2); ctx.lineTo(x + w * 0.85, y + h * 0.2); ctx.stroke();
    if (id === "zweier") {
      ctx.fillStyle = "#fff";
      ctx.fillRect(x + w * 0.4, y + h * 0.25, w * 0.2, h * 0.5);
      ctx.fillRect(x + w * 0.25, y + h * 0.4, w * 0.5, h * 0.2);
    } else if (id === "dreier") {
      ctx.fillStyle = "#c79b29";
      ctx.beginPath(); ctx.arc(x + w * 0.3, y + h * 0.6, w * 0.1, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(x + w * 0.7, y + h * 0.35, w * 0.08, 0, Math.PI * 2); ctx.fill();
    }
  }
  for (let row = 0; row < GAME_ROWS; row++) {
    for (let col = 0; col < GAME_COLS; col++) {
      const id = S.game.board[row][col];
      if (id) block(row, col, id);
    }
  }
  if (!S.game.over) {
    for (const [row, col] of S.game.piece.cells) block(S.game.piece.row + row, S.game.piece.col + col, S.game.piece.id);
  }
}

function gameFrame(now) {
  if (S.view !== "game" || S.gameClock.ended) return;
  const clock = S.gameClock;
  const elapsed = clock.last === null ? 0 : Math.min(100, now - clock.last);
  clock.last = now;
  clock.playedMs += elapsed;
  clock.fallMs += elapsed;
  if (clock.playedMs >= GAME_MINUTES * 60000 || S.game.over) { endGame(); return; }
  while (clock.fallMs >= dropInterval(S.game.rows) && !S.game.over) {
    clock.fallMs -= dropInterval(S.game.rows);
    if (gameDown(S.game) > 0) play("right");
  }
  if (S.game.over) { endGame(); return; }
  const left = Math.max(0, GAME_MINUTES * 60000 - clock.playedMs);
  document.getElementById("game-time").textContent = mmss(left / 1000);
  document.getElementById("game-time-bar").style.width = 100 * left / (GAME_MINUTES * 60000) + "%";
  document.getElementById("game-rows").textContent = S.game.rows;
  document.getElementById("game-points").textContent = S.game.points;
  drawGame();
  requestAnimationFrame(gameFrame);
}

export function render() {
  const title = BLOCKS.find(b => b.id === S.block).title;
  document.getElementById("title").textContent = document.title = S.lang === "en" ? title.en : title.de;
  document.querySelectorAll("[data-lang]").forEach(b => b.classList.toggle("on", b.dataset.lang === S.lang));
  document.getElementById("snd").textContent = S.sound ? "🔊" : "🔇";
  document.getElementById("tmr").classList.toggle("off", !S.timerOn);
  app.innerHTML = S.view === "home" ? viewHome() : S.view === "summary" ? viewSummary() : S.view === "game" ? viewGame() : viewPractice();
  if (S.view === "practice" && !S.done) {
    const first = document.getElementById("f0");
    if (first) first.focus();
  }
}

// ---------- events ----------

document.addEventListener("click", e => {
  const el = e.target.closest("[data-lang],[data-act],[data-skill],[data-choice],[data-multi],[data-pick],[data-unpick],[data-tick],[data-speed],[data-block]");
  if (!el) return;
  const d = el.dataset;
  if (d.act === "partyclose") { closeParty(); return; }
  if (d.lang) { syncInputs(); S.lang = d.lang; storage.setItem("m4-lang", S.lang); render(); return; }
  if (d.act === "sound") {
    syncInputs();
    S.sound = !S.sound;
    storage.setItem("m4-sound", S.sound ? "on" : "off");
    render();
    play("hint");
    return;
  }
  if (d.act === "timer") {
    syncInputs();
    S.timerOn = !S.timerOn;
    storage.setItem("m4-timer", S.timerOn ? "on" : "off");
    render();
    return;
  }
  if (d.speed) { S.speed = d.speed; storage.setItem("m4-speed", S.speed); render(); return; }
  if (d.block) { S.block = d.block; storage.setItem("m4-block", S.block); render(); return; }
  if (d.skill) { startSkill(d.skill); return; }
  if (d.act === "game") {
    if (!S.mix || !earnsGame(S.mix) || S.mix.gamePlayed) return;
    S.mix.gamePlayed = true;
    S.game = newGame();
    S.gameClock = { playedMs: 0, fallMs: 0, last: null, ended: false };
    S.view = "game";
    render();
    window.scrollTo(0, 0);
    requestAnimationFrame(gameFrame);
    return;
  }
  if (d.act === "gleft" || d.act === "gturn" || d.act === "gright" || d.act === "gdrop") { gameAction(d.act); return; }
  if (d.act === "gameend") { endGame(); return; }
  if (d.act === "gameback") { S.view = "summary"; render(); return; }
  if (d.act === "mix") { startMix(); return; }
  if (d.act === "home") { S.view = "home"; S.mix = null; render(); return; }
  if (d.act === "resetall") { openResetDialog(); return; }
  if (d.act === "resetno") { document.getElementById("reset-dialog").close(); return; }
  if (d.act === "resetyes") {
    document.getElementById("reset-dialog").close();
    S.progress = {};
    save();
    render();
    app.querySelector('[data-act="resetall"]').focus();
    return;
  }
  if (d.act === "check") { doCheck(); return; }
  if (d.act === "next") { doNext(); return; }
  if (d.act === "hint") { doHint(); return; }
  if (S.done) return;
  S.msg = null;
  if (d.act === "clearorder") S.input = [];
  else if (d.choice !== undefined) S.input = d.choice;
  else if (d.multi !== undefined) { const i = Number(d.multi); S.input = S.input.includes(i) ? S.input.filter(x => x !== i) : [...S.input, i]; }
  else if (d.pick !== undefined) S.input = [...S.input, Number(d.pick)];
  else if (d.unpick !== undefined) S.input = S.input.filter((_, k) => k !== Number(d.unpick));
  else if (d.tick !== undefined) S.input = Number(d.tick);
  render();
});

document.addEventListener("keydown", e => {
  if (S.view === "game" && !S.gameClock.ended) {
    if (e.key === "ArrowLeft") { e.preventDefault(); gameAction("gleft"); }
    else if (e.key === "ArrowRight") { e.preventDefault(); gameAction("gright"); }
    else if (e.key === "ArrowUp") { e.preventDefault(); gameAction("gturn"); }
    else if (e.key === "ArrowDown") { e.preventDefault(); gameAction("gdown"); }
    else if (e.key === " ") { e.preventDefault(); if (!e.repeat) gameAction("gdrop"); }
    return;
  }
  if (party) {
    if (e.key === "Enter" || e.key === "Escape") { e.preventDefault(); closeParty(); }
    return;
  }
  if (e.key !== "Enter" || S.view !== "practice") return;
  e.preventDefault();
  if (S.done) doNext(); else doCheck();
});

render();
