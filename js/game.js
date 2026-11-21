// Game logic and saved state. Everything stays in this browser (localStorage). Nothing is sent anywhere.
const KEY = "cupiddesk_v4";

function freshGame() {
  return {
    cupid: null,               // { name, id }
    day: 1,                    // 1 to 7
    shift: null,               // today's progress: status "intro" | "running" | "report" | "ending"
    notes: [], counter: NUMBER_START,
    mails: [],                 // NoFlight inbox
    queue: [],                 // mails waiting to arrive { at, mail, ending }
    history: [],               // past day reports
    clock: 0,                  // game time in ms. Only moves while a day is running and not paused
    paused: false, sound: true,
    coins: 0, jobs: [],
    totals: { points: 0, mended: 0, broken: 0 },
    story: {
      flags: {},               // pigeonContact, angelContact
      stats: { evidence: 0, support: 0, loyal: 0, annoyAngel: 0, annoyGoddess: 0, frustrate: 0 },
      delivered: {}, warned: {},
      pigeon: { refusals: 0, lastDay: 0 }
    },
    ending: null
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
const MIN = 60000;

// Little event queue so the UI can react (sounds, pigeons, popups)
let events = [];
function emit(type, data) { events.push({ type, data }); }
function takeEvents() { const e = events; events = []; return e; }

/* ---------- Cupid badge ---------- */
function clockIn(name) {
  game.cupid = { name: (name || "").trim() || "Rookie Cupid", id: "CPD-" + rnd(1000, 9999) };
  save();
}

/* ---------- days ---------- */
function shiftDef() { return DAYS[Math.min(game.day, DAYS.length) - 1]; }
function isLastDay() { return game.day >= DAYS.length; }
function dayTime() { return game.shift && game.shift.started != null ? game.clock - game.shift.started : 0; }
function dayLength() { return DAY_MINUTES * MIN; }
function deskOpen() { return dayTime() < dayLength() - MIN; } // no new LoveNotes in the last minute
function gameHour() {
  const h = WORK_START + (Math.min(dayTime(), dayLength()) / dayLength()) * (WORK_END - WORK_START);
  const hh = Math.floor(h), mm = Math.floor((h - hh) * 60 / 5) * 5;
  return ((hh + 11) % 12 + 1) + ":" + String(mm).padStart(2, "0") + (hh < 12 ? " AM" : " PM");
}

function introShift() { game.shift = { status: "intro" }; save(); }
function startShift() {
  const d = shiftDef();
  game.notes = game.notes.filter((n) => n.state === "Closed").slice(-40);
  game.notes.forEach((n) => { n.old = true; });
  game.shift = { status: "running", started: game.clock, nextAt: game.clock + sec(d.first), points: 0, closed: 0 };
  game.paused = false;
  save();
}
function shiftNotes() { return game.notes.filter((n) => !n.old); }

function endShift() {
  const d = shiftDef(), s = game.shift;
  // anything still open goes to the night shift
  shiftNotes().forEach((n) => {
    if (n.state === "Closed") return;
    if (n.special === "pigeon") { game.story.pigeon.refusals++; n.chat.push({ who: "person", text: "...no answer? Coo." }); finish(n, "pigeonRefused"); }
    else { n.chat.push({ who: "l2", text: "Night shift Cupid here. I'll take it from here. 🌙" }); finish(n, "nightshift"); }
  });
  const ratio = s.points / d.goal;
  const grade = ratio >= 1.5 ? "S" : ratio >= 1.2 ? "A" : ratio >= 1 ? "B" : ratio >= 0.7 ? "C" : "D";
  const earned = Math.max(0, Math.round(s.points / 10));
  game.coins += earned;
  s.status = "report";
  s.report = {
    title: d.title, points: s.points, goal: d.goal, grade, earned, passed: s.points >= d.goal,
    rows: shiftNotes().map((n) => ({ num: n.num, title: n.title, res: n.resolution, points: n.points }))
  };
  game.history.push({ title: d.title, points: s.points, grade });
  emit("shiftEnd", s.report);
  save();
}

function nextShift() {
  if (isLastDay()) { triggerEnding(computeEnding()); return; }
  game.day++;
  introShift();
}

/* ---------- endings ---------- */
function computeEnding() {
  const st = game.story.stats;
  if (st.evidence >= LIMITS.angelWin) return "angel";
  if (st.support >= LIMITS.pigeonWin) return "pigeons";
  return "neutral";
}
function triggerEnding(key) {
  game.ending = key;
  if (game.shift) game.shift.status = "ending"; else game.shift = { status: "ending" };
  game.paused = false;
  emit("ending", key);
  save();
}

/* ---------- making LoveNotes ---------- */
let recent = [];
function fill(s, p) { return s.replace(/\{p\}/g, p); }

function makeNote(src) {
  game.counter++;
  const partner = pick(PARTNERS);
  const n = {
    id: game.counter,
    num: (src.special === "pigeon" ? "LNX" : PREFIX[src.type]) + String(game.counter).padStart(7, "0"),
    type: src.type, cat: src.cat, sev: src.sev, fulfil: !!src.fulfil, reason: src.reason || "", special: src.special || null,
    from: src.from || pick(FIRST) + " " + pick(LAST), place: src.place || pick(TOWNS),
    title: src.title, text: fill(src.text, partner), detail: fill(src.detail || "", partner),
    asked: false, triage: { cat: null, sev: null },
    calm: rnd(22, 40), chat: [{ who: "person", text: fill(src.text, partner) }],
    state: "New", arrived: game.clock, due: null, total: null, l2At: null, l2Mode: null, options: [],
    resolution: null, points: 0, story: !!src.story
  };
  game.notes.push(n);
  emit("arrive", n);
  return n;
}

function generateNote() {
  const d = shiftDef();
  const wantRequest = d.unlock.requests && d.types.includes("request") && Math.random() < 0.3;
  const pool = (wantRequest ? REQUESTS : INCIDENTS).filter((t) => t.sev >= d.maxSev && !recent.includes(t.title));
  const t = pick(pool.length ? pool : wantRequest ? REQUESTS : INCIDENTS);
  recent.push(t.title); if (recent.length > 8) recent.shift();
  return makeNote(Object.assign({ type: wantRequest ? "request" : "incident" }, t));
}

function pigeonNoteDue() {
  const p = game.story.pigeon;
  return game.day >= 2 && !game.story.flags.pigeonContact && p.refusals < PIGEON_NOTE.attempts.length &&
    p.lastDay < game.day && dayTime() >= PIGEON_NOTE.minute * MIN;
}
function deliverPigeonNote() {
  const p = game.story.pigeon, a = PIGEON_NOTE.attempts[p.refusals];
  p.lastDay = game.day;
  makeNote({ special: "pigeon", type: "pigeon", cat: "talk", sev: 2, story: true, from: "Unknown Pigeon", place: "The Coop", title: a.title, text: a.text });
}

/* ---------- working a LoveNote ---------- */
function getNote(id) { return game.notes.find((n) => n.id === id); }
function feature(f) { return !!shiftDef().unlock[f]; }

function makeOptions(n) {
  const others = Object.keys(REPLIES).filter((c) => c !== n.cat);
  n.options = shuffle([
    { kind: "match", text: pick(REPLIES[n.cat]) },
    { kind: "other", text: pick(REPLIES[pick(others)]) },
    { kind: "generic", text: pick(GENERIC) },
    { kind: "bad", text: pick(BAD) }
  ]);
}

function pickUp(id) {
  const n = getNote(id);
  if (!n || n.state !== "New") return;
  n.state = "Pending";
  if (n.special) { save(); return; } // the pigeon LoveNote has no timer
  n.total = sec(PRIORITY[n.sev].seconds);
  n.due = game.clock + n.total;
  if (!feature("triage")) n.triage = { cat: n.cat, sev: n.sev };
  n.chat.push({ who: "cupid", text: "Hi " + n.from.split(" ")[0] + ", I'm " + game.cupid.name + " from the Cupiddesk. I've got your LoveNote. Let's sort this out." });
  makeOptions(n);
  save();
}

function askDetails(id) {
  const n = getNote(id);
  if (!n || n.state !== "Pending" || n.asked || n.special) return;
  n.asked = true;
  n.calm = Math.min(100, n.calm + 4);
  n.chat.push({ who: "cupid", text: "Can you tell me a bit more about what happened?" });
  n.chat.push({ who: "person", text: n.detail });
  save();
}

function reply(id, idx) {
  const n = getNote(id);
  if (!n || n.state !== "Pending" || n.special || !n.options[idx]) return;
  const o = n.options[idx], [a, b] = EFFECT[o.kind], eff = rnd(a, b);
  n.calm = Math.max(0, Math.min(100, n.calm + eff));
  n.chat.push({ who: "cupid", text: o.text });
  n.chat.push({ who: "person", text: eff >= 10 ? pick(SAYS_GOOD) : eff < 0 ? pick(SAYS_BAD) : pick(SAYS_MEH) });
  emit(eff >= 10 ? "good" : eff < 0 ? "bad" : "meh", eff);
  makeOptions(n);
  save();
}

// The pigeon LoveNote: "accept" | "why" | "refuse"
function pigeonChoice(id, choice) {
  const n = getNote(id);
  if (!n || n.state !== "Pending" || n.special !== "pigeon") return;
  n.chat.push({ who: "cupid", text: PIGEON_NOTE.choices[choice] });
  if (choice === "why") { n.askedWhy = true; n.chat.push({ who: "person", text: PIGEON_NOTE.whyAnswer }); }
  else if (choice === "accept") {
    n.chat.push({ who: "person", text: PIGEON_NOTE.acceptAnswer });
    game.story.flags.pigeonContact = true;
    queueMail(sec(15), { party: "pigeons", kind: "pigeon", from: PARTIES.pigeons.name, subject: PIGEON_NOTE.spyMail.subject, body: PIGEON_NOTE.spyMail.body, replies: PIGEON_NOTE.spyMail.replies });
    finish(n, "pigeonAccepted");
  } else {
    n.chat.push({ who: "person", text: PIGEON_NOTE.refuseAnswer });
    game.story.pigeon.refusals++;
    finish(n, "pigeonRefused");
  }
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
  if (!feature("triage") || n.special) return 0;
  let p = 0;
  p += n.triage.cat === n.cat ? POINTS.triageRight : POINTS.triageWrong;
  p += n.triage.sev === n.sev ? POINTS.triageRight : POINTS.triageWrong;
  return p;
}

function finish(n, res, extra) {
  n.state = "Closed"; n.resolution = res;
  n.points = POINTS[res] + (extra || 0) + (RESOLUTION[res].special ? 0 : triagePoints(n));
  n.stars = RESOLUTION[res].stars;
  game.shift.points += n.points; game.shift.closed++;
  game.totals.points += n.points;
  if (res === "mended" || res === "l2mended" || res === "fulfilled") game.totals.mended++;
  if (res === "broken") game.totals.broken++;
  if (!RESOLUTION[res].special) emit(n.points >= 0 ? "closed" : "broken", n);
}

// action: "mend" | "patch" | "decline" | "l2"
function close(id, action) {
  const n = getNote(id);
  if (!n || n.state !== "Pending" || n.special) return "nope";
  if (feature("triage") && !triageDone(n)) return "triage";
  const left = Math.max(0, Math.round((n.due - game.clock) / 1000));
  if ((action === "mend" || action === "patch") && n.type === "request") return "request";
  if (action === "mend" && n.calm < CALM_TO_MEND) return "calm";
  if (action === "patch" && n.calm < CALM_TO_PATCH) return "calm";

  if (action === "mend") {
    n.chat.push({ who: "person", text: "Thank you, Cupid. Love is back on track. 💘" });
    finish(n, "mended", left * POINTS.perSecondLeft);
  } else if (action === "patch") {
    n.chat.push({ who: "person", text: "Okay. It's not perfect, but we're talking again. Thanks for the snacks." });
    finish(n, "patched");
  } else if (action === "decline" && feature("requests")) {
    if (n.type === "request" && !n.fulfil) {
      n.chat.push({ who: "cupid", text: n.reason });
      n.chat.push({ who: "person", text: "...fair enough. Worth a try." });
      finish(n, "declined");
    } else {
      n.chat.push({ who: "cupid", text: "Sorry, we can't help with this one." });
      n.chat.push({ who: "person", text: "WHAT? That was a normal thing to ask! I'm telling the Goddess." });
      finish(n, "wrongdecline");
    }
  } else if (action === "l2") {
    if (n.type === "request" && !n.fulfil) {
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

/* ---------- NoFlight mail ---------- */
let mailSeq = 0;
function deliverMail(m) {
  const mail = Object.assign({ key: "m" + Date.now().toString(36) + (mailSeq++), read: false, replied: null, fwd: [], day: game.day }, m);
  game.mails.push(mail);
  if (m.sets) game.story.flags[m.sets] = true;
  emit("mail", mail);
  return mail;
}
function queueMail(delay, mail, ending) { game.queue.push({ at: game.clock + delay, mail, ending: ending || null }); }

function replyMail(key, idx) {
  const m = game.mails.find((x) => x.key === key);
  if (!m || m.replied != null || !m.replies || !m.replies[idx]) return;
  m.replied = idx;
  const a = m.replies[idx].answer;
  if (a) queueMail(sec(12), { party: m.party, kind: m.kind === "sus" ? "normal" : m.kind, from: m.from, subject: a.subject, body: a.body });
  save();
}

function canForwardTo(party) {
  if (party === "goddess") return true;
  if (party === "angel") return !!game.story.flags.angelContact;
  if (party === "pigeons") return !!game.story.flags.pigeonContact;
  return false;
}

function forwardMail(key, party) {
  const m = game.mails.find((x) => x.key === key);
  if (!m || !canForwardTo(party) || m.fwd.includes(party) || game.ending) return "nope";
  m.fwd.push(party);
  const r = FORWARD[party][m.kind] || FORWARD[party].random;
  const st = game.story.stats;
  st[r.effect]++;
  const from = PARTIES[party].name, subject = "Re: Fwd: " + m.subject;
  let ending = null;
  if (r.effect === "annoyAngel" && st.annoyAngel >= LIMITS.angelSpam) ending = "spamAngel";
  if (r.effect === "annoyGoddess" && st.annoyGoddess >= LIMITS.goddessSpam) ending = "spamGoddess";
  queueMail(sec(10), { party, kind: party === "goddess" ? "normal" : party === "angel" ? "angel" : "pigeon", from, subject, body: r.body }, ending);
  // one warning just before the limit
  const near = (r.effect === "annoyAngel" && st.annoyAngel === LIMITS.angelSpam - 1) || (r.effect === "annoyGoddess" && st.annoyGoddess === LIMITS.goddessSpam - 1) || (r.effect === "frustrate" && st.frustrate === 3);
  if (near && !game.story.warned[r.effect]) {
    game.story.warned[r.effect] = true;
    queueMail(sec(20), { party, kind: party === "goddess" ? "normal" : party === "angel" ? "angel" : "pigeon", from, subject: "Warning", body: WARNINGS[r.effect] });
  }
  save();
  return "ok";
}

function readMail(key) { const m = game.mails.find((x) => x.key === key); if (m && !m.read) { m.read = true; save(); } }
function unreadCount() { return game.mails.filter((m) => !m.read).length; }

/* ---------- the game clock: pigeons, mail, timers, L2 ---------- */
function advance(delta) {
  if (!game.shift || game.shift.status !== "running" || game.paused) return false;
  game.clock += Math.min(delta, 1500);
  const d = shiftDef(), s = game.shift, t = dayTime();
  let changed = false;

  if (deskOpen() && game.clock >= s.nextAt) { generateNote(); s.nextAt = game.clock + sec(d.every); changed = true; }
  if (pigeonNoteDue()) { deliverPigeonNote(); changed = true; }

  MAILS.forEach((m) => {
    if (m.day === game.day && !game.story.delivered[m.id] && t >= m.at * MIN && (!m.needs || game.story.flags[m.needs])) {
      game.story.delivered[m.id] = true; deliverMail(m); changed = true;
    }
  });
  for (let i = 0; i < game.queue.length; i++) {
    const q = game.queue[i];
    if (game.clock >= q.at) {
      game.queue.splice(i--, 1); deliverMail(q.mail); changed = true;
      if (q.ending) { triggerEnding(q.ending); save(); return true; }
    }
  }

  game.notes.forEach((n) => {
    if (n.special) return;
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

  if (dayTime() >= dayLength()) { endShift(); changed = true; }
  if (changed) save();
  else if (Math.random() < 0.1) save(); // keep the clock saved now and then
  return changed;
}

function togglePause() { game.paused = !game.paused; save(); }

/* ---------- PayToWork lottery ---------- */
function payToWork() {
  if (game.coins < PAYTOWORK_COST) return null;
  game.coins -= PAYTOWORK_COST;
  const job = pick(PAYTOWORK_JOBS);
  game.jobs.push(job); save();
  return job;
}

/* ---------- stats ---------- */
function countStates() {
  const c = { New: 0, Pending: 0, Escalated: 0, Closed: 0 };
  shiftNotes().forEach((n) => { c[n.state]++; });
  return c;
}
function rating() {
  const done = game.notes.filter((n) => n.state === "Closed" && !RESOLUTION[n.resolution].special).slice(-20);
  if (!done.length) return 0;
  return done.reduce((a, n) => a + n.stars, 0) / done.length;
}
