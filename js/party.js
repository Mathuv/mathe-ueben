// Star celebration. It uses the global function confetti of vendor/canvas-confetti.js, which index.html loads before the modules.
import { t, pick, shuffle } from "./common.js";
import { storage, S, L } from "./state.js";
import { SKILLS } from "./topics.js";

// ---------- star celebration ----------
// canvas-confetti (vendor/canvas-confetti.js) draws the effects. Each new star gets an effect,
// a theme, a buddy, a dance and a praise. Effects, themes and buddies come from shuffled
// bags that the browser saves, so the child sees all of them before one of them repeats.

const PARTY_THEMES = {
  animals: { emojis: ["🦄", "🐶", "🐱", "🦊", "🐼"], colors: ["#ff8fab", "#ffc6ff", "#bdb2ff", "#a0c4ff", "#fdffb6"] },
  space: { emojis: ["🚀", "🪐", "🌟", "☄️", "👽"], colors: ["#3a0ca3", "#4361ee", "#4cc9f0", "#f72585", "#ffd60a"] },
  sea: { emojis: ["🐠", "🐙", "🐬", "🦀", "🐳"], colors: ["#0077b6", "#00b4d8", "#90e0ef", "#48cae4", "#ffb703"] },
  sweets: { emojis: ["🍦", "🍩", "🍭", "🧁", "🍓"], colors: ["#ff595e", "#ffca3a", "#8ac926", "#1982c4", "#6a4c93"] },
  garden: { emojis: ["🌸", "🌈", "🍀", "🌻", "🦋"], colors: ["#ff99c8", "#fcf6bd", "#d0f4de", "#a9def9", "#e4c1f9"] },
  party: { emojis: ["🎈", "🏆", "🎉", "🥇", "⚽"], colors: ["#e63946", "#f1c40f", "#2a9d8f", "#264653", "#f4a261"] },
};
const PARTY_BUDDIES = ["🦁", "🐯", "🐸", "🐵", "🦖", "🐧", "🐨", "🦉", "🐙", "🤖", "👾", "🧚", "🦸", "🐲", "🦒", "🐢", "🐝", "🦩", "🐹", "🐻"];
const PARTY_DANCES = ["bounce", "spin", "wiggle", "pulse"];
const PARTY_PRAISE = [
  t("Super! Du hast einen Stern!", "Super! You got a star!"),
  t("Wow, du bist ein Zahlen-Profi!", "Wow, you are a numbers pro!"),
  t("Fantastisch! Weiter so!", "Fantastic! Keep going!"),
  t("Hurra! Das hast du toll gemacht!", "Hooray! You did that really well!"),
  t("Mega! Ein neuer Stern für dich!", "Awesome! A new star for you!"),
  t("Bravo! Du rechnest wie der Blitz!", "Bravo! You calculate like lightning!"),
];
const EMOJI_SCALE = 3;

const PARTY_EFFECTS = {
  fireworks(fire, emojis, colors) {
    for (let i = 0; i < 8; i++) {
      later(i * 350, () => fire({ particleCount: 70, spread: 360, startVelocity: 30, ticks: 80, colors,
        origin: { x: 0.1 + Math.random() * 0.8, y: 0.1 + Math.random() * 0.4 } }));
    }
  },
  cannons(fire, emojis, colors) {
    for (let i = 0; i < 6; i++) {
      later(i * 250, () => {
        fire({ particleCount: 40, angle: 60, spread: 55, startVelocity: 60, colors, origin: { x: 0, y: 0.9 } });
        fire({ particleCount: 40, angle: 120, spread: 55, startVelocity: 60, colors, origin: { x: 1, y: 0.9 } });
      });
    }
  },
  emojiRain(fire, emojis) {
    for (let i = 0; i < 14; i++) {
      later(i * 180, () => fire({ particleCount: 4, angle: 270, spread: 90, startVelocity: 5, gravity: 0.5, ticks: 400,
        scalar: EMOJI_SCALE, flat: true, shapes: emojis, origin: { x: Math.random(), y: -0.05 } }));
    }
  },
  emojiExplosion(fire, emojis) {
    fire({ particleCount: 40, spread: 360, startVelocity: 45, ticks: 160, scalar: EMOJI_SCALE, flat: true, shapes: emojis, origin: { x: 0.5, y: 0.45 } });
    later(600, () => fire({ particleCount: 25, spread: 360, startVelocity: 30, ticks: 160, scalar: EMOJI_SCALE, flat: true, shapes: emojis, origin: { x: 0.5, y: 0.45 } }));
  },
  starRings(fire, emojis, colors) {
    for (let i = 0; i < 3; i++) {
      later(i * 400, () => fire({ particleCount: 60, spread: 360, startVelocity: 20 + i * 12, gravity: 0.3, decay: 0.94, ticks: 120,
        scalar: 1.4, shapes: ["star"], colors, origin: { x: 0.5, y: 0.45 } }));
    }
  },
  rainbowSpiral(fire, emojis, colors) {
    for (let i = 0; i < 18; i++) {
      later(i * 110, () => fire({ particleCount: 14, angle: i * 40, spread: 20, startVelocity: 40,
        colors: [colors[i % colors.length]], origin: { x: 0.5, y: 0.45 } }));
    }
  },
  snowfall(fire, emojis, colors) {
    for (let i = 0; i < 40; i++) {
      later(i * 60, () => fire({ particleCount: 2, angle: 270, spread: 60, startVelocity: 2, gravity: 0.25, drift: Math.random() - 0.5,
        ticks: 500, scalar: 1.2, shapes: ["circle"], colors, origin: { x: Math.random(), y: -0.05 } }));
    }
  },
  fountain(fire, emojis, colors) {
    for (let i = 0; i < 12; i++) {
      if (i % 2 === 0) {
        later(i * 150, () => fire({ particleCount: 14, angle: 90, spread: 30, startVelocity: 65, gravity: 1.1, ticks: 150,
          colors, origin: { x: 0.5, y: 1 } }));
      } else {
        later(i * 150, () => fire({ particleCount: 5, angle: 90, spread: 30, startVelocity: 65, gravity: 1.1, ticks: 150,
          scalar: EMOJI_SCALE, flat: true, shapes: emojis, origin: { x: 0.5, y: 1 } }));
      }
    }
  },
};

// Takes the next item from a shuffled bag that the browser saves. A new bag never starts
// with the item that came last, so the same item never comes two times in a row.
function nextFromBag(key, items) {
  const saved = JSON.parse(storage.getItem(key) || "{}");
  let bag = (saved.bag || []).filter(x => items.includes(x));
  if (bag.length === 0) {
    bag = shuffle(items);
    if (bag[0] === saved.last) bag.push(bag.shift());
  }
  const item = bag.shift();
  storage.setItem(key, JSON.stringify({ bag, last: item }));
  return item;
}

const emojiShapes = {};
function themeEmojis(name) {
  if (!emojiShapes[name]) {
    emojiShapes[name] = PARTY_THEMES[name].emojis.map(text => confetti.shapeFromText({ text, scalar: EMOJI_SCALE }));
  }
  return emojiShapes[name];
}

export let party = null;
function later(ms, fn) { party.timers.push(setTimeout(fn, ms)); }

export function celebrate() {
  closeParty();
  const effect = nextFromBag("m4-party-effect", Object.keys(PARTY_EFFECTS));
  const theme = nextFromBag("m4-party-theme", Object.keys(PARTY_THEMES));
  const buddy = nextFromBag("m4-party-buddy", PARTY_BUDDIES);
  const sk = SKILLS.find(s => s.id === S.skill);
  const stars = SKILLS.filter(s => (S.progress[s.id] || 0) >= 5).length;
  const el = document.getElementById("party");
  el.dataset.effect = effect;
  el.dataset.theme = theme;
  document.getElementById("party-buddy").textContent = buddy;
  document.getElementById("party-buddy").style.animationName = "party-" + pick(PARTY_DANCES);
  document.getElementById("party-text").innerHTML = L(pick(PARTY_PRAISE));
  document.getElementById("party-sub").innerHTML = L(t(`⭐ ${sk.name.de} – ${stars} von ${SKILLS.length} Sternen`, `⭐ ${sk.name.en} – ${stars} of ${SKILLS.length} stars`));
  document.getElementById("party-close").innerHTML = L(t("Klicke, um weiterzumachen.", "Click to continue."));
  el.hidden = false;
  const fire = confetti.create(document.getElementById("party-canvas"), { resize: true });
  party = { fire, timers: [] };
  PARTY_EFFECTS[effect](fire, themeEmojis(theme), PARTY_THEMES[theme].colors);
  later(7000, closeParty);
}


export function closeParty() {
  if (!party) return;
  party.timers.forEach(clearTimeout);
  party.fire.reset();
  party = null;
  document.getElementById("party").hidden = true;
}
