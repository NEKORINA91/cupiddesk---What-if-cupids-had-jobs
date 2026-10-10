// Game logic and saved state. Everything stays in this browser (localStorage), nothing is sent anywhere.
const KEY = "cupiddesk_v2";

function freshGame() { return { notes: [], counter: 0, profile: null, mine: [], mineCounter: 0, mailState: {} }; }
function loadGame() {
  try { const raw = localStorage.getItem(KEY); return raw ? Object.assign(freshGame(), JSON.parse(raw)) : freshGame(); }
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

/* ----- account (nickname + role, saved on this device only) ----- */
function setProfile(name, role) {
  game.profile = { id: game.profile ? game.profile.id : "USR-" + rnd(10000, 99999), name: name || "Anonymous Heart", role };
  save();
}

/* ----- Cupid side: LoveNotes coming in from (fictional) customers ----- */
function getNote(id) { return game.notes.find((n) => n.id === id); }

function addNote(o) {
  game.counter++;
  const n = {
    id: game.counter, num: "#" + String(game.counter).padStart(3, "0"),
    from: o.from || pick(PEOPLE), title: o.title, text: o.text,
    state: "New", calm: rnd(25, 45), chat: [{ who: "person", text: o.text }],
    due: null, total: HEARTBREAK_SECONDS * 1000, l2At: null
  };
  game.notes.push(n);
  save();
  return n;
}
function spawnNote() { const t = pick(NOTES); return addNote({ title: t.title, text: t.text }); }

function pickUp(id) {
  const n = getNote(id);
  if (!n || n.state !== "New") return;
  n.state = "LovePending"; n.due = Date.now() + n.total; save();
}

function reply(id, idx) {
  const n = getNote(id);
  if (!n || n.state !== "LovePending" || !REPLIES[idx]) return;
  const r = REPLIES[idx], eff = rnd(r.min, r.max);
  n.calm = Math.max(0, Math.min(100, n.calm + eff));
  n.chat.push({ who: "cupid", text: r.text });
  n.chat.push({ who: "person", text: eff >= 5 ? pick(GOOD) : eff < 0 ? pick(BAD) : "Hmm. I'm not sure that did anything." });
  save();
}

function mend(id) {
  const n = getNote(id);
  if (!n || n.state !== "LovePending" || n.calm < CALM_TO_MEND) return false;
  n.state = "Mended"; n.chat.push({ who: "person", text: "Thank you, Cupid. Love is back on track." }); save();
  return true;
}

// Cupid L1 sends the LoveNote up. Automated Cupid L2 takes over and finishes it after a short delay.
function escalate(id) {
  const n = getNote(id);
  if (!n || n.state !== "LovePending") return;
  n.state = "LoveEscalated"; n.l2At = Date.now() + L2_DELAY_SECONDS * 1000;
  n.chat.push({ who: "l2", text: "Cupid L2 has taken over this LoveNote. Please stand by." });
  save();
}

/* ----- Customer side: your own LoveNotes, handled by bot Cupids ----- */
function getMine(id) { return game.mine.find((m) => m.id === id); }

function submitMine(text) {
  game.mineCounter++;
  const m = {
    id: game.mineCounter, num: "My LoveNote " + String(game.mineCounter).padStart(3, "0"), text,
    state: "Sending", chat: [{ who: "you", text }], replies: 0,
    arriveAt: Date.now() + PIGEON_SECONDS * 1000, pickupAt: null, botAt: null, bot: null
  };
  game.mine.push(m); save();
  return m;
}

function mineReply(id, text) {
  const m = getMine(id);
  if (!m || m.state !== "LovePending") return false;
  m.chat.push({ who: "you", text }); m.replies++; m.botAt = Date.now() + 2500; save();
  return true;
}

/* ----- timers: Heartbreak Timer, automated L2, pigeons, bot Cupids ----- */
function checkTimers() {
  let changed = false;
  const now = Date.now();
  game.notes.forEach((n) => {
    if (n.state === "LovePending" && now > n.due) {
      n.state = "Heartbroken"; n.chat.push({ who: "person", text: "Too late. My heart is broken." }); changed = true;
    } else if (n.state === "LoveEscalated" && now > n.l2At) {
      const good = Math.random() < 0.85;
      n.state = good ? "Mended" : "Heartbroken";
      n.chat.push({ who: "l2", text: good ? L2_GOOD : L2_BAD }); changed = true;
    }
  });
  game.mine.forEach((m) => {
    if (m.state === "Sending" && now > m.arriveAt) { m.state = "New"; m.pickupAt = now + CUSTOMER_PICKUP_SECONDS * 1000; changed = true; }
    else if (m.state === "New" && now > m.pickupAt) {
      m.state = "LovePending"; m.bot = pick(BOT_CUPIDS); m.chat.push({ who: "cupid", text: BOT_GREETING }); changed = true;
    } else if (m.state === "LovePending" && m.botAt && now > m.botAt) {
      m.botAt = null;
      if (m.replies >= CUSTOMER_REPLIES_TO_FINISH) {
        const good = Math.random() < 0.8;
        m.state = good ? "Mended" : "Heartbroken"; m.chat.push({ who: "cupid", text: good ? BOT_DONE_GOOD : BOT_DONE_BAD });
      } else m.chat.push({ who: "cupid", text: pick(BOT_CUPID_LINES) });
      changed = true;
    }
  });
  if (changed) save();
  return changed;
}

function isOpenNote(n) { return n.state === "New" || n.state === "LovePending" || n.state === "LoveEscalated"; }
function countStates() {
  const c = { New: 0, LovePending: 0, LoveEscalated: 0, Mended: 0, Heartbroken: 0 };
  game.notes.forEach((n) => { c[n.state]++; });
  return c;
}

/* ----- mailbox ----- */
function checkMails(sessionMs) {
  const fresh = [];
  MAILS.forEach((m) => {
    if (sessionMs >= m.after * 1000 && !game.mailState[m.id]) { game.mailState[m.id] = { read: false }; fresh.push(m); }
  });
  if (fresh.length) save();
  return fresh;
}
function readMail(id) { if (game.mailState[id] && !game.mailState[id].read) { game.mailState[id].read = true; save(); } }
function unreadCount() { return MAILS.filter((m) => game.mailState[m.id] && !game.mailState[m.id].read).length; }
