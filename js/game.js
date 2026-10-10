// Game logic and saved state. Everything stays in this browser (localStorage), nothing is sent anywhere.
const KEY = "cupiddesk_v1";

function freshGame() { return { notes: [], counter: 0 }; }
function loadGame() {
  try { const raw = localStorage.getItem(KEY); return raw ? JSON.parse(raw) : freshGame(); }
  catch (e) { return freshGame(); }
}
let game = loadGame();
function save() { try { localStorage.setItem(KEY, JSON.stringify(game)); } catch (e) { /* storage blocked */ } }
function wipeGame() { try { localStorage.removeItem(KEY); } catch (e) {} game = freshGame(); }

const rnd = (a, b) => Math.floor(a + Math.random() * (b - a + 1));
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

const lastUsed = {};
function cooldown(key, ms) {
  const now = Date.now();
  if (lastUsed[key] && now - lastUsed[key] < ms) return false;
  lastUsed[key] = now;
  return true;
}

function getNote(id) { return game.notes.find((n) => n.id === id); }

function addNote(o) {
  game.counter++;
  const n = {
    id: game.counter, num: "#" + String(game.counter).padStart(3, "0"),
    from: o.from || pick(PEOPLE), title: o.title, text: o.text,
    state: "New", calm: rnd(25, 45), chat: [{ who: "person", text: o.text }],
    due: null, total: HEARTBREAK_SECONDS * 1000, arrived: Date.now()
  };
  game.notes.push(n);
  save();
  return n;
}

function spawnNote() { const t = pick(NOTES); return addNote({ title: t.title, text: t.text }); }

// Step: the Cupid picks up a LoveNote and the Heartbreak Timer starts.
function pickUp(id) {
  const n = getNote(id);
  if (!n || n.state !== "New") return;
  n.state = "LovePending";
  n.due = Date.now() + n.total;
  save();
}

// Step: the Cupid sends a quick reply, calm goes up or down.
function reply(id, idx) {
  const n = getNote(id);
  if (!n || n.state !== "LovePending" || !REPLIES[idx]) return;
  const r = REPLIES[idx];
  const eff = rnd(r.min, r.max);
  n.calm = Math.max(0, Math.min(100, n.calm + eff));
  n.chat.push({ who: "cupid", text: r.text });
  n.chat.push({ who: "person", text: eff >= 5 ? pick(GOOD) : eff < 0 ? pick(BAD) : "Hmm. I'm not sure that did anything." });
  save();
}

function mend(id) {
  const n = getNote(id);
  if (!n || n.state !== "LovePending" || n.calm < CALM_TO_MEND) return false;
  n.state = "Mended";
  n.chat.push({ who: "person", text: "Thank you, Cupid. Love is back on track." });
  save();
  return true;
}

// Heartbreak Timer: if time runs out, the heart breaks.
function checkTimers() {
  let changed = false;
  const now = Date.now();
  game.notes.forEach((n) => {
    if (n.state === "LovePending" && now > n.due) {
      n.state = "Heartbroken";
      n.chat.push({ who: "person", text: "Too late. My heart is broken." });
      changed = true;
    }
  });
  if (changed) save();
  return changed;
}

function isOpenNote(n) { return n.state === "New" || n.state === "LovePending" || n.state === "LoveEscalated"; }
