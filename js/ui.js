// Desktop, windows and screens.
const $ = (s) => document.querySelector(s);
const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const NOTICE = "Fictional parody game · not real advice · not affiliated with any company";

const WIN = {
  cupiddesk: { t: "Cupiddesk", i: "💘", w: 940, h: 620 },
  chart:     { t: "Heart status", i: "🥧", w: 270, h: null, right: true },
  mailbox:   { t: "NoFlight Mail", i: "✉️", w: 700, h: 580 },
  browser:   { t: "Browser", i: "🌐", w: 580, h: 520 },
  shop:      { t: "Cupid Shop", i: "🛍️", w: 420, h: null },
  trash:     { t: "Trash", i: "🗑️", w: 340, h: null },
  about:     { t: "About Cupid OS", i: "ℹ️", w: 520, h: null }
};
let ui = { open: [], pos: {}, z: 10, sel: null, tab: "queue", mailSel: null, search: null, booted: false, last: Date.now(), page: null, article: 0, job: null };

/* ---------- small helpers ---------- */
function fmt(ms) { const s = Math.max(0, Math.ceil(ms / 1000)); return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0"); }
const AVATARS = ["🐰", "🐻", "🦊", "🐱", "🐸", "🐼", "🐨", "🐯", "🐹", "🦄", "🐧", "🦔"];
function avatar(name) { let h = 0; for (const c of name) h = (h * 31 + c.charCodeAt(0)) >>> 0; return name.startsWith("Coo") ? "🐦" : AVATARS[h % AVATARS.length]; }
function stars(r) { const full = Math.round(r); return "★".repeat(full) + "☆".repeat(5 - full); }

function toast(msg, kind) {
  const t = document.createElement("div"); t.className = "toast " + (kind || ""); t.textContent = msg;
  document.body.appendChild(t); setTimeout(() => t.classList.add("out"), 2400); setTimeout(() => t.remove(), 2800);
}
function mailPop(m) {
  const p = document.createElement("button"); p.className = "pop";
  p.innerHTML = `<span class="pop-i">${(PARTIES[m.party] || PARTIES.other).e}</span><span><b>${esc(m.from)}</b><br>${esc(m.subject)}</span>`;
  p.onclick = () => { ui.mailSel = m.key; readMail(m.key); openWin("mailbox"); render(); p.remove(); };
  document.body.appendChild(p); setTimeout(() => p.remove(), 9000);
}
function flyPigeon(n) {
  const p = document.createElement("div"); p.className = "pigeon"; p.innerHTML = `<span>🕊️</span><span class="env">💌</span>`;
  p.style.top = (60 + Math.random() * 120) + "px";
  document.body.appendChild(p);
  setTimeout(() => { p.remove(); toast("💌 " + n.num + " landed: " + n.title); }, PIGEON_SECONDS * 1000);
}

/* ---------- tiny sound effects (Web Audio, no files) ---------- */
let actx = null;
function beep(notes, type) {
  if (!game.sound) return;
  try {
    actx = actx || new (window.AudioContext || window.webkitAudioContext)();
    let t = actx.currentTime;
    notes.forEach(([f, d]) => {
      const o = actx.createOscillator(), g = actx.createGain();
      o.type = type || "sine"; o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.12, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
      o.connect(g); g.connect(actx.destination); o.start(t); o.stop(t + d + 0.02); t += d * 0.8;
    });
  } catch (e) { /* no audio */ }
}
const SFX = {
  arrive: () => beep([[660, .12], [880, .14]], "triangle"),
  good: () => beep([[784, .1], [1047, .16]]),
  bad: () => beep([[220, .18], [180, .22]], "square"),
  closed: () => beep([[523, .1], [659, .1], [784, .1], [1047, .25]], "triangle"),
  broken: () => beep([[392, .2], [330, .2], [262, .35]], "sawtooth"),
  mail: () => beep([[988, .08], [1319, .12]]),
  ending: () => beep([[392, .3], [523, .3], [659, .3], [784, .6]], "triangle"),
  shiftEnd: () => beep([[523, .15], [659, .15], [784, .15], [1047, .4]], "triangle")
};

function flushEvents() {
  takeEvents().forEach((e) => {
    if (SFX[e.type]) SFX[e.type]();
    if (e.type === "arrive") flyPigeon(e.data);
    if (e.type === "mail") mailPop(e.data);
    if (e.type === "closed") toast(RESOLUTION[e.data.resolution].e + " " + e.data.num + ": " + RESOLUTION[e.data.resolution].label + " (" + (e.data.points >= 0 ? "+" : "") + e.data.points + ")", "ok");
    if (e.type === "broken") toast(RESOLUTION[e.data.resolution].e + " " + e.data.num + ": " + RESOLUTION[e.data.resolution].label + " (" + e.data.points + ")", "bad");
  });
}

/* ---------- windows ---------- */
function openWin(id) {
  const w = WIN[id], desk = $("#desktop");
  const dw = desk ? desk.clientWidth : window.innerWidth, dh = desk ? desk.clientHeight : window.innerHeight - 48;
  if (!ui.open.includes(id)) ui.open.push(id);
  if (!ui.pos[id]) {
    const n = ui.open.length;
    const width = Math.min(w.w, dw - 20);
    const x = w.right ? Math.max(10, dw - width - 14) : Math.max(10, Math.min(100 + n * 18, dw - width - 10));
    const height = id === "cupiddesk" ? Math.min(780, dh - 28) : w.h ? Math.min(w.h, dh - 40) : null;
    ui.pos[id] = { x, y: id === "cupiddesk" ? 12 : 14 + (w.right ? 0 : n * 10), w: width, h: height, z: 0 };
  }
  ui.pos[id].z = ++ui.z;
}
function closeWin(id) { ui.open = ui.open.filter((x) => x !== id); }
function winHtml(id, body) {
  const w = WIN[id], p = ui.pos[id], top = p.z === ui.z;
  return `<section class="win${top ? " top" : ""}${p.max ? " max" : ""}" data-win="${id}" style="left:${p.x}px;top:${p.y}px;width:${p.w}px;${p.h ? "height:" + p.h + "px;" : ""}z-index:${p.z}">
    <header class="tb" data-drag="${id}"><span class="tb-t"><span class="tb-i">${w.i}</span>${esc(w.t)}</span>
      <span class="tb-b">${id === "cupiddesk" ? `<button class="tbb" data-act="max" data-id="${id}" aria-label="Maximise">${p.max ? "❐" : "□"}</button>` : ""}<button class="tbb x" data-act="close" data-id="${id}" aria-label="Close">✕</button></span></header>
    <div class="wb" data-scroll="${id}">${body}</div></section>`;
}

/* ---------- Cupiddesk app ---------- */
const STATE_LABEL = { New: "New", Pending: "In progress", Escalated: "With Cupid L2", Closed: "Closed" };

function head() {
  const d = shiftDef(), s = game.shift, running = s && s.status === "running";
  const pts = s && s.points != null ? s.points : 0, pct = Math.max(0, Math.min(100, pts / d.goal * 100));
  const r = rating();
  return `<div class="cd-head">
    <div class="brand"><span class="logo">💘</span><div><b>Cupiddesk</b><small>${esc(game.cupid.name)} · ${esc(game.cupid.id)}</small></div></div>
    <div class="hd-shift"><small>Day ${Math.min(game.day, DAYS.length)} of ${DAYS.length}</small><b>${running ? `🕘 <span data-hour>${gameHour()}</span>` : esc(d.title.split(": ")[1] || d.title)}</b></div>
    ${running ? `<div class="hd-goal"><div class="row sb"><small>Today's points</small><small><b>${pts}</b> / ${d.goal}</small></div><div class="bar goal"><i style="width:${pct}%"></i></div><div class="bar day"><i data-daybar></i></div></div>` : '<div class="hd-goal"></div>'}
    <div class="hd-rate" title="Cupid rating (last 20 LoveNotes)"><small>🪙 ${game.coins} · Rating</small><span class="stars">${r ? stars(r) : "☆☆☆☆☆"}</span></div>
    ${running ? `<button class="btn ghost sm" data-act="pause">${game.paused ? "▶ Resume" : "⏸ Pause"}</button>` : ""}
  </div>`;
}

function welcomeView() {
  return `<div class="center-screen"><div class="badge-card">
    <div class="bc-top"><span>CUPIDDESK</span><span>STAFF BADGE</span></div>
    <div class="bc-photo">🏹</div>
    <h2>Welcome, new Cupid</h2>
    <p class="muted">The Love Goddess needs more Cupids. Seven days, 9 to 5, mending hearts. Write a name for your badge (or don't, Rookie).</p>
    <input id="w-name" maxlength="20" placeholder="Rookie Cupid" data-keep autocomplete="off">
    <button class="btn primary big" data-act="clockin">Clock in 💘</button>
    <p class="tiny">${esc(NOTICE)}. Saved only in this browser.</p>
  </div></div>`;
}

function shiftCard() {
  const d = shiftDef(), u = d.unlock;
  const feat = (on, t) => `<span class="feat${on ? " on" : ""}">${on ? "✓" : "🔒"} ${t}</span>`;
  return `<div class="center-screen"><div class="shift-card">
    <div class="kicker">Day ${game.day} of ${DAYS.length}</div>
    <h1>${esc(d.title)}</h1>
    <p>${esc(d.intro)}</p>
    <div class="sc-stats"><div><b>9–5</b><small>${DAY_MINUTES} real minutes</small></div><div><b>${d.goal}</b><small>points for a good day</small></div><div><b>🪙 ${game.coins}</b><small>Heartcoins</small></div></div>
    <div class="feats">${feat(true, "Chat & mend")}${feat(u.triage, "Triage")}${feat(u.requests, "Requests")}${feat(u.l2, "Escalate to L2")}</div>
    <button class="btn primary big" data-act="start">Clock in for Day ${game.day}</button>
    <details class="howto"><summary>How to play</summary><ol>
      <li>Pigeons drop LoveNotes in your queue all day. <b>LNI</b> = Incident (something went wrong), <b>LNR</b> = Request (someone wants something).</li>
      <li>Pick one up. Its Heartbreak Timer starts. Near-break notes have the least time.</li>
      <li>Ask for details, then choose replies that fit the problem. Good replies raise <b>Calm</b>. Patch at ${CALM_TO_PATCH}%, mend at ${CALM_TO_MEND}%.</li>
      ${u.triage ? "<li>Set the Category and Heart condition before closing for bonus points.</li>" : ""}
      ${u.requests ? "<li>Requests: send fair ones to L2 Fulfilment, decline impossible ones.</li>" : ""}
      ${u.l2 ? "<li>Stuck? Escalate an incident to Cupid L2.</li>" : ""}
      <li>Check your <b>NoFlight</b> mail. You can reply, and you can <b>forward</b> mail to people. What you forward, and to whom, decides how your week ends. Don't spam.</li>
      <li>Keys 1 to 4 send replies. D asks for details.</li>
    </ol></details>
  </div></div>`;
}

function reportView() {
  const r = game.shift.report, last = isLastDay();
  return `<div class="center-screen"><div class="shift-card report">
    <div class="kicker">Clocked out · Day ${game.day} report</div>
    <h1>${esc(r.title)}</h1>
    <div class="grade g-${r.grade}">${r.grade}</div>
    <p class="big-num"><b>${r.points}</b> / ${r.goal} points · earned 🪙 ${r.earned}</p>
    <table class="rtable"><tr><th>LoveNote</th><th>Result</th><th>Pts</th></tr>
      ${r.rows.map((x) => `<tr><td><span class="num">${esc(x.num)}</span> ${esc(x.title)}</td><td>${RESOLUTION[x.res].e} ${esc(RESOLUTION[x.res].label)}</td><td class="${x.points < 0 ? "neg" : "pos"}">${x.points > 0 ? "+" : ""}${x.points}</td></tr>`).join("")}
    </table>
    <p class="muted tiny">You can still read and forward NoFlight mail before the next day.</p>
    <div class="row center"><button class="btn primary big" data-act="next">${last ? "Clock out for good…" : "Go home, sleep, Day " + (game.day + 1) + " →"}</button></div>
  </div></div>`;
}

function endingView() {
  const e = ENDINGS[game.ending], st = game.story.stats;
  return `<div class="center-screen"><div class="shift-card ending">
    <div class="kicker">The end</div>
    <div class="ending-e">${e.e}</div>
    <h1>${esc(e.title)}</h1>
    <p>${esc(e.body)}</p>
    <div class="sc-stats"><div><b>${game.totals.mended}</b><small>hearts mended</small></div><div><b>${game.totals.points}</b><small>total points</small></div><div><b>${game.history.length}</b><small>days worked</small></div></div>
    <p class="muted tiny">Evidence to the angel: ${st.evidence} · Help to the pigeons: ${st.support} · Reports to the Goddess: ${st.loyal}</p>
    <p class="muted tiny">There are ${Object.keys(ENDINGS).length} endings. Can you find them all?</p>
    <button class="btn primary big" data-act="newgame">Start a new week</button>
  </div></div>`;
}

function listCard(n) {
  const sel = ui.sel === n.id, pr = n.special ? "🐦 ???" : n.triage.sev ? PRIORITY[n.triage.sev].short : "?";
  return `<button class="lcard st-${n.state}${sel ? " sel" : ""}${n.story ? " story" : ""}" data-act="select" data-id="${n.id}">
    <div class="row sb"><span class="num">${esc(n.num)}</span><span class="pchip p${n.special ? 0 : n.triage.sev || 0}">${pr}</span></div>
    <div class="lc-title">${esc(n.title)}</div>
    <div class="row sb lc-meta"><span>${n.special ? "🐦" : avatar(n.from)} ${esc(n.from.split(" ")[0])}</span>
      ${n.state === "Pending" && !n.special ? `<span class="mini-timer" data-timer="${n.id}"></span>` : n.state === "Closed" ? `<span>${RESOLUTION[n.resolution].e}</span>` : n.state === "Escalated" ? "<span>🏹</span>" : '<span class="dot-new"></span>'}</div>
  </button>`;
}

function listPane() {
  const all = shiftNotes().slice().reverse();
  const tabs = [["queue", "New", (n) => n.state === "New"], ["mine", "Mine", (n) => n.state === "Pending"], ["l2", "L2", (n) => n.state === "Escalated"], ["done", "Done", (n) => n.state === "Closed"]];
  const cur = tabs.find((t) => t[0] === ui.tab) || tabs[0];
  const list = all.filter(cur[2]);
  return `<div class="cd-list">
    <div class="tabs">${tabs.map((t) => { const c = all.filter(t[2]).length; return `<button class="tab${t[0] === cur[0] ? " on" : ""}" data-act="tab" data-t="${t[0]}">${t[1]}${c ? `<span class="tc">${c}</span>` : ""}</button>`; }).join("")}</div>
    <div class="lscroll" data-scroll="list">${list.map(listCard).join("") || `<div class="empty-s">${cur[0] === "queue" ? "🕊️ Waiting for pigeons..." : "Nothing here"}</div>`}</div>
    <div class="incoming">${deskOpen() ? "🕊️ Pigeons are flying in all day" : "🌙 No more LoveNotes today. Almost 5 PM!"}</div>
  </div>`;
}

function chatHtml(n) {
  return n.chat.map((m) => {
    const me = m.who === "cupid", l2 = m.who === "l2";
    const name = me ? "You" : l2 ? "Cupid L2" : n.from;
    const av = me ? "💘" : l2 ? "🏹" : n.special ? "🐦" : avatar(n.from);
    return `<div class="msg-row${me ? " me" : ""}${l2 ? " l2" : ""}"><span class="av">${av}</span><div><div class="who">${esc(name)}</div><div class="bubble">${esc(m.text)}</div></div></div>`;
  }).join("");
}

function fieldsHtml(n) {
  if (n.special) return `<div class="fields"><label><small>Type</small><span>❓ Unknown</span></label><label><small>Category</small><span class="muted">Doesn't fit any</span></label><label><small>Heart condition</small><span class="muted">???</span></label><label><small>Sender</small><span>🐦 ${esc(n.from)}</span></label></div>`;
  const editable = n.state === "Pending" && feature("triage");
  const catSel = editable ? `<select data-act-change="cat" data-id="${n.id}"><option value="">Choose...</option>${Object.keys(CATS).map((k) => `<option value="${k}"${n.triage.cat === k ? " selected" : ""}>${CATS[k].e} ${CATS[k].label}</option>`).join("")}</select>`
    : n.triage.cat ? `<span>${CATS[n.triage.cat].e} ${CATS[n.triage.cat].label}</span>` : `<span class="muted">Not set</span>`;
  const sevSel = editable ? `<select data-act-change="sev" data-id="${n.id}"><option value="">Choose...</option>${[1, 2, 3].map((p) => `<option value="${p}"${n.triage.sev === p ? " selected" : ""}>${PRIORITY[p].e} ${PRIORITY[p].label}</option>`).join("")}</select>`
    : n.triage.sev ? `<span>${PRIORITY[n.triage.sev].e} ${PRIORITY[n.triage.sev].label}</span>` : `<span class="muted">Not set</span>`;
  return `<div class="fields">
    <label><small>Type</small><span>${n.type === "incident" ? "🔧 Incident" : "📦 Request"}</span></label>
    <label><small>Category</small>${catSel}</label>
    <label><small>Heart condition</small>${sevSel}</label>
    <label><small>Sender</small><span>${avatar(n.from)} ${esc(n.from)}</span></label>
  </div>`;
}

function detailPane() {
  const n = ui.sel ? getNote(ui.sel) : null;
  if (!n || n.old) {
    const c = countStates();
    return `<div class="cd-detail empty-detail"><div class="big-e">💌</div><h3>Select a LoveNote</h3><p class="muted">${c.New ? `${c.New} waiting in the queue.` : "The pigeons are on their way."}</p></div>`;
  }
  let body = "";
  if (n.state === "New") {
    body = `<div class="preview"><div class="bubble big">${esc(n.text)}</div></div>
      <button class="btn primary big" data-act="pickup">Pick up LoveNote</button>
      <p class="muted tiny center">${n.special ? "This one looks... different." : "Picking up starts the Heartbreak Timer."}</p>`;
  } else if (n.state === "Pending" && n.special === "pigeon") {
    const c = PIGEON_NOTE.choices;
    body = `<div class="chat" id="chat">${chatHtml(n)}</div>
      <div class="composer story-choices"><small class="muted">How do you answer?</small><div class="opts one">
        <button class="opt" data-act="pchoice" data-c="accept">🤝 ${esc(c.accept)}</button>
        ${n.askedWhy ? "" : `<button class="opt" data-act="pchoice" data-c="why">❓ ${esc(c.why)}</button>`}
        <button class="opt" data-act="pchoice" data-c="refuse">🙅 ${esc(c.refuse)}</button></div></div>`;
  } else if (n.state === "Pending") {
    const req = n.type === "request", u = shiftDef().unlock;
    const triageMissing = feature("triage") && !triageDone(n);
    body = `<div class="meters">
        <div class="meter-box"><div class="row sb"><small>💔 Heartbreak Timer</small><b class="timer" data-timer="${n.id}"></b></div><div class="bar time"><i data-tbar="${n.id}"></i></div></div>
        <div class="meter-box"><div class="row sb"><small>😌 Calm</small><b>${n.calm}%</b></div><div class="bar calm"><i style="width:${n.calm}%"></i><span class="mark" style="left:${CALM_TO_PATCH}%" title="Patch"></span><span class="mark" style="left:${CALM_TO_MEND}%" title="Mend"></span></div></div>
      </div>
      <div class="chat" id="chat">${chatHtml(n)}</div>
      <div class="composer">
        <div class="row sb"><small class="muted">Choose a reply</small>${n.asked ? "" : `<button class="btn soft sm" data-act="ask">🔎 Ask for details <kbd>D</kbd></button>`}</div>
        <div class="opts">${n.options.map((o, i) => `<button class="opt" data-act="reply" data-i="${i}"><kbd>${i + 1}</kbd>${esc(o.text)}</button>`).join("")}</div>
      </div>
      ${triageMissing ? `<p class="hint">Set Category and Heart condition above before closing.</p>` : ""}
      <div class="actions">
        ${req ? "" : `<button class="btn primary" data-act="close" data-how="mend"${n.calm < CALM_TO_MEND ? " disabled" : ""}>💘 Mend heart${n.calm < CALM_TO_MEND ? ` <small>${CALM_TO_MEND}%</small>` : ""}</button>
        <button class="btn soft" data-act="close" data-how="patch"${n.calm < CALM_TO_PATCH ? " disabled" : ""}>🩹 Patch${n.calm < CALM_TO_PATCH ? ` <small>${CALM_TO_PATCH}%</small>` : ""}</button>`}
        ${req ? `<button class="btn primary" data-act="close" data-how="l2">🎁 Send to L2 Fulfilment</button>` : u.l2 ? `<button class="btn soft" data-act="close" data-how="l2">🏹 Escalate to L2</button>` : ""}
        ${u.requests ? `<button class="btn danger" data-act="close" data-how="decline">🚫 Decline</button>` : ""}
      </div>`;
  } else if (n.state === "Escalated") {
    body = `<div class="meter-box"><div class="row sb"><small>🏹 Cupid L2 ${n.l2Mode === "fulfil" ? "is fulfilling this request" : "is on a (fictional) site visit"}</small></div><div class="bar l2"><i data-l2bar="${n.id}"></i></div></div>
      <div class="chat" id="chat">${chatHtml(n)}</div>`;
  } else {
    const R = RESOLUTION[n.resolution];
    const right = (a, b) => a === b ? "✓" : "✗";
    body = `<div class="res-card ${n.points < 0 ? "bad" : "ok"}"><span class="res-e">${R.e}</span><div><b>${esc(R.label)}</b>${R.special ? "" : `<div class="muted">${n.points >= 0 ? "+" : ""}${n.points} points · ${stars(n.stars)}</div>`}
      ${feature("triage") && !R.special ? `<div class="tiny">Category: ${CATS[n.cat].e} ${CATS[n.cat].label} ${right(n.triage.cat, n.cat)} · Condition: ${PRIORITY[n.sev].e} ${PRIORITY[n.sev].label} ${right(n.triage.sev, n.sev)}</div>` : ""}</div></div>
      <div class="chat" id="chat">${chatHtml(n)}</div>`;
  }
  return `<div class="cd-detail">
    <div class="dt-head"><button class="btn ghost sm back" data-act="back">← Back</button><span class="num">${esc(n.num)}</span><span class="state s-${n.state}">${STATE_LABEL[n.state]}</span>${n.story ? '<span class="state s-story">⭐ Story</span>' : ""}</div>
    <h2>${esc(n.title)}</h2>
    <div class="muted from">${esc(n.from)} · ${esc(n.place)}</div>
    ${fieldsHtml(n)}
    ${body}
  </div>`;
}

function deskApp() {
  if (!game.cupid) return welcomeView();
  if (!game.shift) introShift();
  const s = game.shift;
  const inner = s.status === "ending" ? endingView() : s.status === "intro" ? shiftCard() : s.status === "report" ? reportView()
    : `<div class="cd-work${ui.sel ? " has-sel" : ""}">${listPane()}${detailPane()}</div>${game.paused ? `<div class="paused"><div><div class="big-e">⏸</div><b>Paused</b><p class="muted">The pigeons are taking a nap.</p><button class="btn primary" data-act="pause">Resume</button></div></div>` : ""}`;
  return `<div class="cd">${head()}<div class="cd-body">${inner}</div></div>`;
}

/* ---------- other windows ---------- */
function chartWin() {
  const c = countStates(), segs = [["New", c.New, "#ED93B1"], ["In progress", c.Pending, "#EF9F27"], ["With L2", c.Escalated, "#7F77DD"]];
  const total = c.New + c.Pending + c.Escalated;
  let acc = 0;
  const grad = total ? segs.map((s) => { const a = acc; acc += s[1] / total * 360; return `${s[2]} ${a}deg ${acc}deg`; }).join(",") : "var(--soft) 0deg 360deg";
  const s = game.shift, done = shiftNotes().filter((n) => n.state === "Closed" && !RESOLUTION[n.resolution].special);
  const good = done.filter((n) => n.points > 0).length, bad = done.length - good;
  return `<div class="page chart">
    <div class="donut" style="background:conic-gradient(${grad})"><div><b>${total}</b><small>open</small></div></div>
    ${segs.map((x) => `<div class="legend"><span class="dot" style="background:${x[2]}"></span>${x[0]}<b>${x[1]}</b></div>`).join("")}
    <hr><div class="legend">💘 Mended today<b>${good}</b></div><div class="legend">💔 Broken today<b>${bad}</b></div>
    <div class="legend">⭐ Points today<b>${s && s.points != null ? s.points : 0}</b></div>
    <hr><div class="legend tiny">All-time hearts mended<b>${game.totals.mended}</b></div>
  </div>`;
}

function mailWin() {
  const list = game.mails.slice().reverse(), m = game.mails.find((x) => x.key === ui.mailSel);
  let read = '<div class="empty-s">Pick a mail to read</div>';
  if (m) {
    const p = PARTIES[m.party] || PARTIES.other;
    const replies = m.replies && m.replies.length ? (m.replied == null
      ? `<div class="mail-actions"><small class="muted">Reply</small><div class="row">${m.replies.map((r, i) => `<button class="btn soft sm" data-act="mreply" data-i="${i}">↩ ${esc(r.text)}</button>`).join("")}</div></div>`
      : `<div class="sent">↩ You replied: “${esc(m.replies[m.replied].text)}”</div>`) : "";
    const fwdBtn = (party, label) => canForwardTo(party)
      ? `<button class="btn sm ${m.fwd.includes(party) ? "ghost" : "soft"}" data-act="fwd" data-p="${party}"${m.fwd.includes(party) || game.ending ? " disabled" : ""}>${PARTIES[party].e} ${label}${m.fwd.includes(party) ? " ✓" : ""}</button>` : "";
    read = `<div class="mail-head"><span class="mail-av">${p.e}</span><div><h3>${esc(m.subject)}</h3><div class="muted tiny">From: ${esc(m.from)} · Day ${m.day}</div></div></div>
      <div class="mail-body">${esc(m.body)}</div>${replies}
      <div class="mail-actions"><small class="muted">Forward to</small><div class="row">${fwdBtn("angel", "Angel")}${fwdBtn("goddess", "Goddess")}${fwdBtn("pigeons", "Pigeons")}</div></div>`;
  }
  return `<div class="mailwrap"><div class="mail-list" data-scroll="mail"><div class="nf-logo">✉️ NoFlight <small>mail without wings</small></div>${list.map((x) => `<button class="mail${x.read ? "" : " unread"}${ui.mailSel === x.key ? " sel" : ""}" data-act="mail" data-k="${x.key}"><b>${(PARTIES[x.party] || PARTIES.other).e} ${esc(x.from)}</b><span>${esc(x.subject)}</span></button>`).join("") || '<div class="empty-s">No mail yet</div>'}</div>
    <div class="mail-read" data-scroll="mailread">${read}</div></div>`;
}

function findHidden(q) {
  const s = q.toLowerCase().trim();
  return HIDDEN_PAGES.find((p) => p.keys.some((k) => s === k || s.includes(k)));
}
function browserWin() {
  const bar = (addr) => `<div class="addr"><button class="btn ghost sm" data-act="home" title="Home">🏠</button><input id="q" maxlength="60" placeholder="Search WorldArticlez" value="${esc(ui.search || "")}" data-keep><button class="btn primary sm" data-act="search">Search</button></div><div class="tiny muted url">${esc(addr)}</div>`;
  if (ui.page === "article") {
    const a = ARTICLES[ui.article];
    return `<div class="page">${bar("worldarticlez://news/" + ui.article)}<div class="wa-art"><div class="kicker">WorldArticlez</div><h2>${esc(a.title)}</h2><p>${esc(a.body)}</p><button class="btn ghost sm" data-act="home">← All articles</button></div></div>`;
  }
  if (ui.page === "search") {
    const h = findHidden(ui.search || "");
    if (!h) return `<div class="page">${bar("worldarticlez://search?q=" + (ui.search || ""))}<div class="restricted"><div class="big-e">🔒</div><h3>Restricted access</h3><p class="muted">Your Cupid clearance doesn't allow this search. This attempt has (not really) been reported to the Goddess.</p></div></div>`;
    const ptw = h.paytowork ? `<div class="ptw"><p>Cost: 🪙 ${PAYTOWORK_COST}. You have 🪙 ${game.coins}.</p><button class="btn primary" data-act="ptw"${game.coins < PAYTOWORK_COST ? " disabled" : ""}>🎰 Pay and spin for a job</button>${ui.job ? `<div class="job">Your new job: <b>${esc(ui.job)}</b></div>` : ""}${game.jobs.length ? `<p class="tiny muted">Jobs won so far: ${game.jobs.map(esc).join(", ")}</p>` : ""}</div>` : "";
    return `<div class="page">${bar("worldarticlez://hidden/" + h.keys[0].replace(/ /g, "-"))}<div class="wa-art hidden-page"><div class="kicker">🔓 Hidden page</div><h2>${esc(h.title)}</h2><p>${esc(h.body)}</p>${h.link ? `<button class="btn soft sm" data-act="goto" data-q="${h.link}">Open ${esc(h.link)} →</button>` : ""}${ptw}</div></div>`;
  }
  const list = ARTICLES.map((a, i) => [a, i]).filter(([a]) => a.day <= game.day).reverse();
  return `<div class="page">${bar("worldarticlez://home")}<div class="wa-logo">🌍 World<b>Articlez</b></div>
    ${list.map(([a, i]) => `<button class="hl" data-act="article" data-i="${i}"><a>${esc(a.title)}</a><small>WorldArticlez · Day ${a.day}</small></button>`).join("")}</div>`;
}

function shopWin() {
  return `<div class="page"><div class="row sb"><h3>🛍️ Cupid Shop</h3><b>🪙 ${game.coins}</b></div>
    <p class="muted tiny">Earn Heartcoins by mending hearts. The shop opens soon!</p>
    <div class="shop">${SHOP_ITEMS.map((s) => `<div class="shop-item"><span class="big-e">${s.e}</span><b>${esc(s.name)}</b><small>🪙 ${s.price}</small><button class="btn soft sm" disabled>Coming soon</button></div>`).join("")}</div></div>`;
}

function trashWin() {
  return `<div class="page">${TRASH_ITEMS.map((t) => `<div class="hl">📄 ${esc(t)}</div>`).join("")}<p><button class="btn soft" data-act="emptytrash">Empty trash</button></p></div>`;
}

function aboutWin() {
  return `<div class="page"><h3>About Cupid OS & Cupiddesk</h3><p>${esc(DISCLAIMER)}</p><p>${esc(INSPIRED)}</p>
    <p>The code of this game was made with the help of generative AI. No external libraries, fonts or images. Emoji are drawn by your device.</p>
    <p class="muted tiny">Your progress is saved only in this browser.</p><button class="btn danger" data-act="reset">Clear game data on this device</button></div>`;
}

const BODY = { cupiddesk: deskApp, browser: browserWin, mailbox: mailWin, trash: trashWin, chart: chartWin, about: aboutWin, shop: shopWin };

/* ---------- boot screen ---------- */
function bootHtml() {
  return `<div class="boot" data-act="skipboot"><div class="boot-logo">💘</div><div class="boot-t">Cupid OS</div>
    <div class="boot-bar"><i></i></div><div class="boot-line">Polishing arrows... feeding pigeons... checking hearts...</div><div class="tiny boot-n">${esc(NOTICE)}</div></div>`;
}

/* ---------- render ---------- */
function render() {
  if (!ui.booted) { $("#app").innerHTML = bootHtml(); return; }
  const keep = {}, scroll = {}, a = document.activeElement;
  const activeId = a && a.dataset && a.dataset.keep !== undefined ? a.id : null;
  document.querySelectorAll("[data-keep]").forEach((el) => { keep[el.id] = el.value; });
  document.querySelectorAll("[data-scroll]").forEach((el) => { scroll[el.dataset.scroll] = el.scrollTop; });
  const unread = unreadCount();
  const icon = (id, e, l, b) => `<button class="icon" data-act="open" data-id="${id}"><span class="e">${e}</span><span class="l">${l}</span>${b ? `<span class="badge">${b}</span>` : ""}</button>`;
  const s = game.shift;
  $("#app").innerHTML = `<div class="screen"><div class="desktop" id="desktop">
      <div class="deco" aria-hidden="true"><span>♥</span><span>♥</span><span>♥</span><span>♥</span><span>♥</span><span>☁</span><span>☁</span></div>
      <div class="icons">${icon("cupiddesk", "💘", "Cupiddesk")}${icon("mailbox", "✉️", "NoFlight", unread)}${icon("chart", "🥧", "Heart status")}${icon("browser", "🌐", "Browser")}${icon("shop", "🛍️", "Shop")}${icon("trash", "🗑️", "Trash")}${icon("about", "ℹ️", "About")}</div>
      <div class="watermark">${esc(NOTICE)}</div>
      ${ui.open.map((id) => winHtml(id, BODY[id]())).join("")}
    </div>
    <nav class="taskbar"><span class="start">💘 Cupid OS</span>
      <span class="tasks">${ui.open.map((id) => `<button class="task${ui.pos[id].z === ui.z ? " on" : ""}" data-act="focus" data-id="${id}">${WIN[id].i}<span> ${esc(WIN[id].t)}</span></button>`).join("")}</span>
      <span class="sp"></span>
      ${s && s.status === "running" ? `<span class="tray-pill">Day ${game.day} · <span data-hour>${gameHour()}</span></span>` : ""}
      <button class="tray" data-act="sound" title="Sound">${game.sound ? "🔊" : "🔇"}</button>
      <span id="clock" class="tray"></span></nav></div>`;
  Object.keys(keep).forEach((id) => { const el = document.getElementById(id); if (el) el.value = keep[id]; });
  document.querySelectorAll("[data-scroll]").forEach((el) => { if (scroll[el.dataset.scroll] != null) el.scrollTop = scroll[el.dataset.scroll]; });
  if (activeId) { const el = document.getElementById(activeId); if (el) { el.focus(); try { el.setSelectionRange(el.value.length, el.value.length); } catch (e) {} } }
  const c = $("#chat"); if (c) c.scrollTop = c.scrollHeight;
  paintTimers();
}

function paintTimers() {
  const now = game.clock;
  const clock = $("#clock"); if (clock) clock.textContent = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  document.querySelectorAll("[data-hour]").forEach((el) => { el.textContent = gameHour(); });
  const db = $("[data-daybar]"); if (db) db.style.width = Math.min(100, dayTime() / dayLength() * 100) + "%";
  document.querySelectorAll("[data-timer]").forEach((el) => {
    const n = getNote(+el.dataset.timer); if (!n || !n.due) return;
    const l = n.due - now; el.textContent = fmt(l); el.classList.toggle("low", l < 20000);
  });
  document.querySelectorAll("[data-tbar]").forEach((el) => {
    const n = getNote(+el.dataset.tbar); if (!n) return;
    const p = Math.max(0, Math.min(100, ((n.due - now) / n.total) * 100));
    el.style.width = p + "%"; el.parentNode.classList.toggle("low", p < 25);
  });
  document.querySelectorAll("[data-l2bar]").forEach((el) => {
    const n = getNote(+el.dataset.l2bar); if (!n) return;
    el.style.width = Math.max(0, Math.min(100, 100 - ((n.l2At - now) / sec(L2_DELAY_SECONDS)) * 100)) + "%";
  });
}

function tick() {
  const now = Date.now(), delta = now - ui.last; ui.last = now;
  if (!ui.booted) return;
  if (advance(delta)) render();
  flushEvents();
  paintTimers();
}

/* ---------- actions ---------- */
const val = (id) => { const el = document.getElementById(id); return el ? el.value.trim() : ""; };
const CLOSE_MSG = { triage: "Set the Category and Heart condition first.", calm: "They're not calm enough yet.", request: "It's a request, nothing to mend. Fulfil or decline it.", nope: "Can't do that right now." };
const acts = {
  skipboot() { finishBoot(); },
  open(el) { openWin(el.dataset.id); render(); },
  close(el) {
    if (el.dataset.how) { const r = close(ui.sel, el.dataset.how); if (r !== "ok") toast(CLOSE_MSG[r] || CLOSE_MSG.nope); render(); flushEvents(); return; }
    closeWin(el.dataset.id); render();
  },
  max(el) { const p = ui.pos[el.dataset.id]; p.max = !p.max; render(); },
  focus(el) { ui.pos[el.dataset.id].z = ++ui.z; render(); },
  clockin() { clockIn(val("w-name")); introShift(); render(); },
  start() { startShift(); ui.sel = null; ui.tab = "queue"; ui.last = Date.now(); openWin("chart"); openWin("cupiddesk"); render(); flushEvents(); },
  next() { nextShift(); ui.sel = null; render(); flushEvents(); },
  newgame() { const name = game.cupid && game.cupid.name; wipeGame(); clockIn(name); introShift(); ui.sel = null; ui.mailSel = null; ui.page = null; render(); },
  pause() { togglePause(); ui.last = Date.now(); render(); },
  tab(el) { ui.tab = el.dataset.t; render(); },
  select(el) { ui.sel = +el.dataset.id; render(); },
  back() { ui.sel = null; render(); },
  pickup() { pickUp(ui.sel); ui.tab = "mine"; render(); },
  ask() { askDetails(ui.sel); render(); },
  reply(el) { reply(ui.sel, +el.dataset.i); render(); flushEvents(); },
  pchoice(el) { pigeonChoice(ui.sel, el.dataset.c); render(); flushEvents(); },
  sound() { game.sound = !game.sound; save(); render(); },
  search() { ui.search = val("q") || ""; ui.page = ui.search ? "search" : null; ui.job = null; render(); },
  goto(el) { ui.search = el.dataset.q; ui.page = "search"; ui.job = null; render(); },
  home() { ui.page = null; ui.search = ""; render(); },
  article(el) { ui.page = "article"; ui.article = +el.dataset.i; render(); },
  ptw() { const j = payToWork(); if (j) { ui.job = j; SFX.closed(); } render(); },
  mail(el) { ui.mailSel = el.dataset.k; readMail(ui.mailSel); render(); },
  mreply(el) { replyMail(ui.mailSel, +el.dataset.i); toast("↩ Reply sent"); render(); },
  fwd(el) { if (forwardMail(ui.mailSel, el.dataset.p) === "ok") toast("📨 Forwarded to " + PARTIES[el.dataset.p].name); render(); },
  emptytrash() { toast("The pigeons took the trash away. 🕊️"); },
  reset() { if (!confirm("Clear all game data on this device?")) return; wipeGame(); ui.sel = null; ui.mailSel = null; ui.page = null; ui.open = []; openWin("cupiddesk"); render(); }
};

document.addEventListener("click", (e) => { const el = e.target.closest("[data-act]"); if (el && !el.disabled && acts[el.dataset.act]) acts[el.dataset.act](el); });
document.addEventListener("change", (e) => {
  const el = e.target.closest("[data-act-change]"); if (!el) return;
  setTriage(+el.dataset.id, el.dataset.actChange, el.value); render();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Enter") { if (e.target.id === "q") acts.search(); else if (e.target.id === "w-name") acts.clockin(); return; }
  if (/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
  const n = ui.sel && getNote(ui.sel);
  if (!n || n.state !== "Pending" || n.special || game.paused || !ui.open.includes("cupiddesk")) return;
  if (/^[1-4]$/.test(e.key)) acts.reply({ dataset: { i: +e.key - 1 } });
  else if (e.key.toLowerCase() === "d") acts.ask();
});

/* drag windows by their title bar, raise on click */
let drag = null;
document.addEventListener("pointerdown", (e) => {
  const w = e.target.closest(".win"); if (!w) return;
  const id = w.dataset.win;
  if (ui.pos[id].z !== ui.z) { ui.pos[id].z = ++ui.z; w.style.zIndex = ui.pos[id].z; document.querySelectorAll(".win.top").forEach((x) => x.classList.remove("top")); w.classList.add("top"); }
  const h = e.target.closest("[data-drag]");
  if (h && !e.target.closest("button") && !ui.pos[id].max && window.innerWidth > 760) drag = { id, el: w, sx: e.clientX, sy: e.clientY, l: w.offsetLeft, t: w.offsetTop };
});
document.addEventListener("pointermove", (e) => {
  if (!drag) return;
  const desk = $("#desktop");
  drag.el.style.left = Math.max(-drag.el.offsetWidth + 80, Math.min(desk.clientWidth - 80, drag.l + e.clientX - drag.sx)) + "px";
  drag.el.style.top = Math.max(0, Math.min(desk.clientHeight - 40, drag.t + e.clientY - drag.sy)) + "px";
});
document.addEventListener("pointerup", () => { if (drag) { ui.pos[drag.id].x = drag.el.offsetLeft; ui.pos[drag.id].y = drag.el.offsetTop; drag = null; } });
document.addEventListener("visibilitychange", () => { ui.last = Date.now(); });

function finishBoot() {
  if (ui.booted) return;
  ui.booted = true; ui.last = Date.now();
  render(); // build the desktop first so windows can measure it
  if (game.shift && game.shift.status === "running") { openWin("chart"); game.paused = true; save(); } // resume where you left off
  openWin("cupiddesk");
  render();
}

render();
setTimeout(finishBoot, 2200);
setInterval(tick, 250);
