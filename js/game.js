// Game logic and saved state. Everything stays in this browser (localStorage). Nothing is sent anywhere.
const KEY = "cupiddesk_v3";

function freshGame() {
  return {
    cupid: null,               // { name, id }
    shiftIndex: 0,             // story shift (0-based). Past the end = Overtime
    overtime: 0,
    shift: null,               // the current shift's progress
    notes: [], counter: NUMBER_START,
    mails: [],                 // delivered mails
    history: [],               // past shift reports
    clock: 0,                  // game time in ms. Only moves while the game is open and not paused
    paused: false,
    sound: true,
    totals: { points: 0, mended: 0, broken: 0 }
  };
}
function loadGame() {
  try { const raw = localStorage.getItem(KEY); return raw ? Object.assign(freshGame(), JSON.parse(raw)) : freshGame(); }
  catch (e) { return freshGame(); }
}
let game = loadGame();
function save() { try { localStorage.setItem(KEY, JSON.stringify(game)); } catch (e) { /* storage blocked */ } }
function wipeGame() { try { localStorage.removeItem(KEY); } catch (e) {} game = freshGame(); }

const rnd = (a, b) => Math.floor(a + Math.random() * (b - a + 1));
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const shuffle = (arr) => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const sec = (s) => s * 1000;

// Little event queue so the UI can react (sounds, pigeons, popups)
let events = [];
function emit(type, data) { events.push({ type, data }); }
function takeEvents() { const e = events; events = []; return e; }

/* ---------- Cupid badge ---------- */
function clockIn(name) {
  game.cupid = { name: (name || "").trim() || "Rookie Cupid", id: "CPD-" + rnd(1000, 9999) };
  save();
}

/* ---------- shifts ---------- */
function shiftDef() {
  if (game.shiftIndex < SHIFTS.length) return SHIFTS[game.shiftIndex];
  const n = game.overtime;
  return Object.assign({}, OVERTIME, {
    title: "Overtime #" + (n + 1),
    notes: OVERTIME.notes + n,
    every: Math.max(7, OVERTIME.every - n),
    goal: OVERTIME.goal + n * 100
  });
}
function isStory() { return game.shiftIndex < SHIFTS.length; }

function startShift() {
  const d = shiftDef();
  game.notes = game.notes.filter((n) => n.state === "Closed").slice(-40);
  game.notes.forEach((n) => { n.old = true; });
  game.shift = { status: "running", delivered: 0, nextAt: game.clock + sec(d.first), points: 0, closed: 0, started: game.clock };
  game.paused = false;
  deliverMails("start");
  save();
}
function introShift() { game.shift = { status: "intro" }; save(); }

function deliverMails(on) {
  const d = shiftDef();
  (d.mails || []).forEach((m, i) => {
    const key = game.shiftIndex + ":" + i;
    if (m.on === on && !game.mails.some((x) => x.key === key)) {
      const mail = { key, from: m.from, subject: m.subject, body: m.body, read: false };
      game.mails.push(mail);
      emit("mail", mail);
    }
  });
}

function shiftNotes() { return game.notes.filter((n) => !n.old); }

function endShift() {
  const d = shiftDef(), s = game.shift, list = shiftNotes();
  const ratio = s.points / d.goal;
  const grade = ratio >= 1.5 ? "S" : ratio >= 1.2 ? "A" : ratio >= 1 ? "B" : ratio >= 0.7 ? "C" : "D";
  s.status = "report";
  s.report = {
    title: d.title, points: s.points, goal: d.goal, grade, passed: s.points >= d.goal,
    rows: list.map((n) => ({ num: n.num, title: n.title, res: n.resolution, points: n.points }))
  };
  game.history.push({ title: d.title, points: s.points, grade });
  deliverMails("end");
  emit("shiftEnd", s.report);
  save();
}

function nextShift(retry) {
  if (!retry) { if (isStory()) game.shiftIndex++; else game.overtime++; }
  introShift();
}

/* ---------- making LoveNotes ---------- */
let recent = [];
function fill(s, p) { return s.replace(/\{p\}/g, p); }

function makeNote(src) {
  game.counter++;
  const partner = pick(PARTNERS);
  const n = {
    id: game.counter,
    num: PREFIX[src.type] + String(game.counter).padStart(7, "0"),
    type: src.type, cat: src.cat, sev: src.sev, fulfil: !!src.fulfil, reason: src.reason || "",
    from: src.from || pick(FIRST) + " " + pick(LAST), place: src.place || pick(TOWNS),
    title: src.title, text: fill(src.text, partner), detail: fill(src.detail, partner),
    asked: false, triage: { cat: null, sev: null },
    calm: rnd(22, 40), chat: [{ who: "person", text: fill(src.text, partner) }],
    state: "New", arrived: game.clock, due: null, total: null, l2At: null, l2Mode: null, options: [],
    resolution: null, points: 0, story: !!src.story
  };
  game.notes.push(n);
  return n;
}

function generateNote() {
  const d = shiftDef();
  const wantRequest = d.unlock.requests && d.types.includes("request") && Math.random() < 0.32;
  const pool = (wantRequest ? REQUESTS : INCIDENTS).filter((t) => t.sev >= d.maxSev && !recent.includes(t.title));
  const t = pick(pool.length ? pool : wantRequest ? REQUESTS : INCIDENTS);
  recent.push(t.title); if (recent.length > 6) recent.shift();
  return makeNote(Object.assign({ type: wantRequest ? "request" : "incident" }, t));
}

function deliverNote() {
  const d = shiftDef(), s = game.shift;
  s.delivered++;
  const scripted = (d.story || []).find((x) => x.at === s.delivered);
  const n = scripted ? makeNote(Object.assign({ story: true }, scripted)) : generateNote();
  emit("arrive", n);
  return n;
}

/* ---------- working a LoveNote ---------- */
function getNote(id) { return game.notes.find((n) => n.id === id); }
function feature(f) { return !!shiftDef().unlock[f]; }

function makeOptions(n) {
  const others = Object.keys(REPLIES).filter((c) => c !== n.cat);
  const opts = [
    { kind: "match", text: pick(REPLIES[n.cat]) },
    { kind: "other", text: pick(REPLIES[pick(others)]) },
    { kind: "generic", text: pick(GENERIC) },
    { kind: "bad", text: pick(BAD) }
  ];
  n.options = shuffle(opts);
}

function pickUp(id) {
  const n = getNote(id);
  if (!n || n.state !== "New") return;
  n.state = "Pending";
  n.total = sec(PRIORITY[n.sev].seconds);
  n.due = game.clock + n.total;
  if (!feature("triage")) n.triage = { cat: n.cat, sev: n.sev };
  n.chat.push({ who: "cupid", text: "Hi " + n.from.split(" ")[0] + ", I'm " + game.cupid.name + " from the Cupiddesk. I've got your LoveNote. Let's sort this out." });
  makeOptions(n);
  save();
}

function askDetails(id) {
  const n = getNote(id);
  if (!n || n.state !== "Pending" || n.asked) return;
  n.asked = true;
  n.calm = Math.min(100, n.calm + 4);
  n.chat.push({ who: "cupid", text: "Can you tell me a bit more about what happened?" });
  n.chat.push({ who: "person", text: n.detail });
  save();
}

function reply(id, idx) {
  const n = getNote(id);
  if (!n || n.state !== "Pending" || !n.options[idx]) return;
  const o = n.options[idx], [a, b] = EFFECT[o.kind], eff = rnd(a, b);
  n.calm = Math.max(0, Math.min(100, n.calm + eff));
  n.chat.push({ who: "cupid", text: o.text });
  n.chat.push({ who: "person", text: eff >= 10 ? pick(SAYS_GOOD) : eff < 0 ? pick(SAYS_BAD) : pick(SAYS_MEH) });
  emit(eff >= 10 ? "good" : eff < 0 ? "bad" : "meh", eff);
  makeOptions(n);
  save();
}

function setTriage(id, field, value) {
  const n = getNote(id);
  if (!n || n.state !== "Pending") return;
  n.triage[field] = field === "sev" ? (+value || null) : (value || null);
  save();
}
function triageDone(n) { return !!(n.triage.cat && n.triage.sev); }

function triagePoints(n) {
  if (!feature("triage")) return 0;
  let p = 0;
  p += n.triage.cat === n.cat ? POINTS.triageRight : POINTS.triageWrong;
  p += n.triage.sev === n.sev ? POINTS.triageRight : POINTS.triageWrong;
  return p;
}

function finish(n, res, extra) {
  n.state = "Closed"; n.resolution = res;
  n.points = POINTS[res] + (extra || 0) + triagePoints(n);
  n.stars = RESOLUTION[res].stars;
  game.shift.points += n.points; game.shift.closed++;
  game.totals.points += n.points;
  if (res === "mended" || res === "l2mended" || res === "fulfilled") game.totals.mended++;
  if (res === "broken") game.totals.broken++;
  emit(n.points >= 0 ? "closed" : "broken", n);
  deliverMails("closed:" + game.shift.closed);
  checkShiftDone();
}

function checkShiftDone() {
  const d = shiftDef(), s = game.shift;
  if (s.status === "running" && s.delivered >= d.notes && shiftNotes().every((n) => n.state === "Closed")) endShift();
}

// action: "mend" | "patch" | "decline" | "l2"
function close(id, action) {
  const n = getNote(id);
  if (!n || n.state !== "Pending") return "nope";
  if (feature("triage") && !triageDone(n)) return "triage";
  const left = Math.max(0, Math.round((n.due - game.clock) / 1000));
  if ((action === "mend" || action === "patch") && n.type === "request") return "request";
  if (action === "mend" && n.calm < CALM_TO_MEND) return "calm";
  if (action === "patch" && n.calm < CALM_TO_PATCH) return "calm";

  if (action === "mend" && n.type === "incident" && n.calm >= CALM_TO_MEND) {
    n.chat.push({ who: "person", text: "Thank you, Cupid. Love is back on track. 💘" });
    finish(n, "mended", left * POINTS.perSecondLeft);
  } else if (action === "patch" && n.type === "incident" && n.calm >= CALM_TO_PATCH) {
    n.chat.push({ who: "person", text: "Okay. It's not perfect, but we're talking again. Thanks for the snacks." });
    finish(n, "patched");
  } else if (action === "decline" && feature("requests")) {
    if (n.type === "request" && !n.fulfil) {
      n.chat.push({ who: "cupid", text: n.reason });
      n.chat.push({ who: "person", text: "...fair enough. Worth a try." });
      finish(n, "declined");
    } else {
      n.chat.push({ who: "cupid", text: "Sorry, we can't help with this one." });
      n.chat.push({ who: "person", text: "WHAT? That was a normal thing to ask! I'm telling Senior Cupid." });
      finish(n, "wrongdecline");
    }
  } else if (action === "l2") {
    if (n.type === "request" && !n.fulfil) {
      // L2 bounces impossible requests straight back
      n.calm = Math.max(0, n.calm - 15);
      n.chat.push({ who: "l2", text: "L2 Fulfilment here. We can't do this one, it's against Cupid policy. Sending it back to you. (Try declining it.)" });
      game.shift.points += POINTS.triageWrong; game.totals.points += POINTS.triageWrong;
      emit("bad");
    } else if (n.type === "request" || feature("l2")) {
      n.state = "Escalated"; n.l2Mode = n.type === "request" ? "fulfil" : "fix";
      n.l2At = game.clock + sec(L2_DELAY_SECONDS);
      n.chat.push({ who: "l2", text: n.l2Mode === "fulfil" ? L2_LINES.fulfilStart : L2_LINES.start });
    } else return "nope";
  } else return "nope";
  save();
  return "ok";
}

/* ---------- the game clock: pigeons, timers, L2 ---------- */
function advance(delta) {
  if (!game.shift || game.shift.status !== "running" || game.paused) return false;
  game.clock += Math.min(delta, 1500);
  const d = shiftDef(), s = game.shift;
  let changed = false;

  if (s.delivered < d.notes && game.clock >= s.nextAt) {
    deliverNote(); s.nextAt = game.clock + sec(d.every); changed = true;
  }
  game.notes.forEach((n) => {
    if (n.state === "Pending" && game.clock >= n.due) {
      n.chat.push({ who: "person", text: "Too late. My heart is broken. 💔" });
      finish(n, "broken"); changed = true;
    } else if (n.state === "Escalated" && game.clock >= n.l2At) {
      if (n.l2Mode === "fulfil") { n.chat.push({ who: "l2", text: pick(L2_LINES.fulfilled) }); finish(n, "fulfilled"); }
      else if (Math.random() < L2_SUCCESS) { n.chat.push({ who: "l2", text: pick(L2_LINES.good) }); finish(n, "l2mended"); }
      else { n.chat.push({ who: "l2", text: pick(L2_LINES.bad) }); finish(n, "broken"); }
      changed = true;
    }
  });
  if (changed) save();
  else if (Math.random() < 0.2) save(); // keep the clock saved now and then
  return changed;
}

function togglePause() { game.paused = !game.paused; save(); }

/* ---------- stats ---------- */
function countStates() {
  const c = { New: 0, Pending: 0, Escalated: 0, Closed: 0 };
  shiftNotes().forEach((n) => { c[n.state]++; });
  return c;
}
function rating() {
  const done = game.notes.filter((n) => n.state === "Closed").slice(-20);
  if (!done.length) return 0;
  return done.reduce((a, n) => a + n.stars, 0) / done.length;
}

/* ---------- mailbox ---------- */
function readMail(key) { const m = game.mails.find((x) => x.key === key); if (m && !m.read) { m.read = true; save(); } }
function unreadCount() { return game.mails.filter((m) => !m.read).length; }
