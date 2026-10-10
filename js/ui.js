const $ = (s) => document.querySelector(s);
const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const FOOT = "Cupiddesk is a fictional parody game made for fun. Not real advice, not a serious tool, and not affiliated with any company.";
const WIN = {
  cupiddesk: { t: "Cupiddesk", i: "💘", x: 120, y: 14, w: 680 },
  browser: { t: "Cloudy Search", i: "🌐", x: 150, y: 40, w: 520 },
  mailbox: { t: "Mailbox", i: "📬", x: 170, y: 60, w: 560 },
  trash: { t: "Trash", i: "🗑️", x: 200, y: 80, w: 360 },
  chart: { t: "Heart status", i: "🥧", x: null, y: 60, w: 290 },
  about: { t: "About Cupid OS", i: "ℹ️", x: 160, y: 50, w: 520 }
};
let ui = { open: [], pos: {}, z: 10, selCupid: null, selMine: null, mailSel: null, search: null, start: Date.now(), chartAuto: false };

function toast(msg) {
  const t = document.createElement("div"); t.className = "toast"; t.textContent = msg;
  document.body.appendChild(t); setTimeout(() => t.remove(), 2800);
}
function mailPop(m) {
  const p = document.createElement("div"); p.className = "pop";
  p.textContent = "📬 New mail from " + m.from + ": " + m.subject;
  p.onclick = () => { ui.mailSel = m.id; readMail(m.id); openWin("mailbox"); render(); p.remove(); };
  document.body.appendChild(p); setTimeout(() => p.remove(), 9000);
}
function fmt(ms) { const s = Math.max(0, Math.ceil(ms / 1000)); return String(Math.floor(s / 60)).padStart(2, "0") + ":" + String(s % 60).padStart(2, "0"); }

/* ---------- windows ---------- */
function openWin(id) {
  const w = WIN[id];
  if (!ui.open.includes(id)) ui.open.push(id);
  if (!ui.pos[id]) {
    const dw = $("#desktop") ? $("#desktop").clientWidth : 900;
    ui.pos[id] = { x: w.x == null ? Math.max(8, dw - w.w - 14) : w.x, y: w.y, z: 0 };
  }
  ui.pos[id].z = ++ui.z;
  if (id === "cupiddesk" && game.profile && game.profile.role === "cupid" && !ui.chartAuto) { ui.chartAuto = true; openWin("chart"); ui.pos.cupiddesk.z = ++ui.z; }
}
function closeWin(id) { ui.open = ui.open.filter((x) => x !== id); }
function winHtml(id, body) {
  const w = WIN[id], p = ui.pos[id];
  return `<div class="win" data-win="${id}" style="left:${p.x}px;top:${p.y}px;width:${w.w}px;z-index:${p.z}">
    <div class="tb" data-drag="${id}"><span>${w.i} ${esc(w.t)}</span><button class="x" data-act="close" data-id="${id}" aria-label="Close">&#10005;</button></div>
    <div class="wb">${body}</div></div>`;
}

/* ---------- Cupiddesk app ---------- */
const CHIP = { Sending: "Pigeon in flight", New: "Waiting for a Cupid", LoveEscalated: "LoveEscalated", LovePending: "LovePending", Mended: "Heart mended", Heartbroken: "Heartbroken" };
function chip(s) { return `<span class="chip ${s === "Mended" ? "ok" : s === "Heartbroken" ? "bad" : ""}">${esc(CHIP[s] || s)}</span>`; }

function accountView() {
  return `<div class="page"><h2>Welcome to Cupiddesk 💘</h2>
    <p>Create your Cupiddesk account (it only exists on this device). Then pick your role.</p>
    <label class="note-s">Nickname</label><input id="a-name" maxlength="20" placeholder="Pick a silly nickname" data-keep>
    <p>Are you a Cupid or a customer?</p>
    <div class="row"><button class="primary" data-act="setrole" data-r="cupid">I'm a Cupid 💘</button><button data-act="setrole" data-r="customer">I'm a customer 💌</button></div>
    <p class="note-s">Cupids resolve LoveNotes. Customers send them. No real details, please. Everything is fictional.</p></div>`;
}

function accountBar() {
  const p = game.profile;
  return `<div class="accountbar"><span>${esc(p.name)} <span class="num">${esc(p.id)}</span> · ${p.role === "cupid" ? "Cupid" : "Customer"}</span>
    <span class="row"><button data-act="switchrole">Switch role</button><button data-act="signout">Sign out</button></span></div>`;
}

function chatHtml(list, meWho, nameOf) {
  return list.map((m) => {
    const me = m.who === meWho;
    return `<div class="who"${me ? ' style="text-align:right"' : ""}>${esc(me ? "You" : nameOf(m))}</div><div class="msg${me ? " me" : ""}">${esc(m.text)}</div>`;
  }).join("");
}

function card(n, sel, act) {
  return `<div class="note${sel ? " sel" : ""}" data-act="${act}" data-id="${n.id}"><div class="num">${esc(n.num)}</div><div><b>${esc(n.title || n.text.slice(0, 28))}</b></div></div>`;
}

function cupidView() {
  const by = (s) => game.notes.filter((n) => n.state === s).reverse();
  const done = game.notes.filter((n) => n.state === "Mended" || n.state === "Heartbroken").reverse();
  const g = (t, l) => `<h4>${t} (${l.length})</h4>${l.map((n) => card(n, ui.selCupid === n.id, "select")).join("") || '<div class="note-s">Nothing here</div>'}`;
  const side = g("New LoveNotes", by("New")) + g("LovePending", by("LovePending")) + g("LoveEscalated", by("LoveEscalated")) + g("Finished", done);
  const n = ui.selCupid ? getNote(ui.selCupid) : null;
  let main = `<div class="empty">Select a LoveNote from the list. 💌</div>`;
  if (n) {
    let body = "";
    const nameOf = (m) => m.who === "l2" ? "Cupid L2" : n.from;
    if (n.state === "New") body = `<p>${esc(n.from)} is waiting. Pick this LoveNote up to start the Heartbreak Timer.</p><button class="primary" data-act="pickup">Pick up LoveNote</button>`;
    else if (n.state === "LovePending") body = `<div class="row" style="justify-content:space-between"><span>Heartbreak Timer</span><span class="timer" data-timer="${n.id}"></span></div>
      <div class="meter"><i data-tbar="${n.id}" style="background:var(--red)"></i></div>
      <div class="row" style="justify-content:space-between"><span>Calm</span><span>${n.calm}%</span></div>
      <div class="meter"><i style="background:var(--green);width:${n.calm}%"></i></div>
      <div class="chat" id="chat">${chatHtml(n.chat, "cupid", nameOf)}</div>
      <div class="row">${REPLIES.map((r, i) => `<button data-act="reply" data-i="${i}">${esc(r.text)}</button>`).join("")}</div>
      <p class="row"><button class="primary" data-act="mend"${n.calm < CALM_TO_MEND ? " disabled" : ""}>Mend the heart${n.calm < CALM_TO_MEND ? " (needs " + CALM_TO_MEND + "% calm)" : ""}</button>
      <button data-act="escalate">Escalate to Cupid L2</button></p>`;
    else body = `<div class="chat" id="chat">${chatHtml(n.chat, "cupid", nameOf)}</div><p class="note-s">${n.state === "LoveEscalated" ? "Cupid L2 is handling this one..." : n.state === "Mended" ? "This heart was mended. Well done!" : "This heart broke. Better luck next time."}</p>`;
    main = `<div class="row" style="justify-content:space-between"><span class="num">LoveNote ${esc(n.num)}</span>${chip(n.state)}</div><h2>${esc(n.title)}</h2><div class="note-s">from ${esc(n.from)}</div>${body}`;
  }
  return `<div class="desk"><div class="side">${side}</div><div class="main">${main}</div></div>`;
}

function customerView() {
  const list = game.mine.slice().reverse();
  const side = `<h4>Send a LoveNote</h4><textarea id="s-text" rows="3" maxlength="300" placeholder="My partner keeps hiding my socks..." data-keep></textarea>
    <p class="note-s">Keep it silly and fictional. Stays on this device.</p><button class="primary" data-act="submit">Send with a pigeon 🕊️</button>
    <h4>My LoveNotes (${list.length})</h4>${list.map((m) => card(m, ui.selMine === m.id, "mselect")).join("") || '<div class="note-s">None yet</div>'}`;
  const m = ui.selMine ? getMine(ui.selMine) : null;
  let main = `<div class="empty">Send a LoveNote, or pick one from the list. 💌</div>`;
  if (m) {
    const nameOf = (x) => m.bot || "Cupid";
    main = `<div class="row" style="justify-content:space-between"><span class="num">${esc(m.num)}</span>${chip(m.state)}</div>
      <div class="chat" id="chat">${chatHtml(m.chat, "you", nameOf)}</div>` +
      (m.state === "LovePending" ? `<div class="row"><input id="c-text" maxlength="200" placeholder="Reply to your Cupid" style="flex:1" data-keep><button class="primary" data-act="csend">Send</button></div>`
        : m.state === "Sending" ? `<p class="note-s">A pigeon is carrying your LoveNote to the desk... 🕊️</p>`
        : m.state === "New" ? `<p class="note-s">Waiting for a Cupid to pick it up...</p>`
        : `<p class="note-s">${m.state === "Mended" ? "Your heart was mended. 💘" : "Your heart broke. Send another LoveNote to try again."}</p>`);
  }
  return `<div class="desk"><div class="side">${side}</div><div class="main">${main}</div></div>`;
}

function cupidWin() {
  if (!game.profile) return accountView();
  return accountBar() + (game.profile.role === "cupid" ? cupidView() : customerView());
}

/* ---------- other windows ---------- */
function browserWin() {
  const q = ui.search;
  const res = q ? `<h2>Results for "${esc(q)}"</h2>${SEARCH_TEMPLATES.map((t) => `<div class="hl">${esc(t.replace("%q%", q))}</div>`).join("")}`
    : `<h2>Today's top stories</h2>${HEADLINES.map((h) => `<div class="hl">${esc(h)}</div>`).join("")}`;
  return `<div class="page"><div class="row"><input id="q" maxlength="60" placeholder="Search the Cloud" style="flex:1" value="${esc(q || "")}" data-keep><button class="primary" data-act="search">Search</button></div>
    <p class="note-s">cupid://search (a fictional, pretend internet)</p>${res}</div>`;
}

function mailWin() {
  const got = MAILS.filter((m) => game.mailState[m.id]);
  const sel = MAILS.find((m) => m.id === ui.mailSel);
  const list = got.slice().reverse().map((m) => `<div class="mail${game.mailState[m.id].read ? "" : " unread"}${ui.mailSel === m.id ? " sel" : ""}" data-act="mail" data-id="${m.id}">${esc(m.from)}<br><span class="note-s">${esc(m.subject)}</span></div>`).join("");
  return `<div class="desk"><div class="side" style="padding:0">${list || '<div class="empty">No mail yet.</div>'}</div>
    <div class="main">${sel && game.mailState[sel.id] ? `<h2>${esc(sel.subject)}</h2><div class="note-s">From: ${esc(sel.from)}</div><p style="white-space:pre-wrap">${esc(sel.body)}</p>` : '<div class="empty">Select a mail to read it. 📬</div>'}</div></div>`;
}

function trashWin() {
  return `<div class="page"><h2>Trash</h2>${TRASH_ITEMS.map((t) => `<div class="hl">🗑️ ${esc(t)}</div>`).join("")}
    <p><button data-act="emptytrash">Empty trash</button></p></div>`;
}

function chartWin() {
  const c = countStates();
  const segs = [["New LoveNotes", c.New, "#D4537E"], ["LovePending", c.LovePending, "#639922"], ["LoveEscalated", c.LoveEscalated, "#BA7517"]];
  const total = segs.reduce((a, s) => a + s[1], 0);
  let off = 25, svg = "";
  if (total) segs.forEach((s) => {
    const pct = (s[1] / total) * 100;
    if (pct) svg += `<circle cx="21" cy="21" r="15.915" fill="none" stroke="${s[2]}" stroke-width="7" stroke-dasharray="${pct} ${100 - pct}" stroke-dashoffset="${off}"/>`;
    off -= pct;
  });
  const pie = total ? `<svg width="150" height="150" viewBox="0 0 42 42" role="img" aria-label="Pie chart of open LoveNotes by state">${svg}<text x="21" y="22.5" text-anchor="middle" font-size="7" font-weight="700" style="fill:var(--text)">${total}</text></svg>` : `<div class="empty">No open LoveNotes</div>`;
  return `<div class="page" style="text-align:center">${pie}<div style="text-align:left;margin-top:8px">
    ${segs.map((s) => `<div class="legend"><span class="dot" style="background:${s[2]}"></span>${s[0]}: ${s[1]}</div>`).join("")}
    <div class="note-s">Mended: ${c.Mended} · Heartbroken: ${c.Heartbroken}</div></div></div>`;
}

function aboutWin() {
  return `<div class="page"><h2>About Cupid OS</h2><p>${esc(DISCLAIMER)}</p>
    <p>Cupiddesk is not affiliated with, endorsed by, or connected to any software company or product. It only borrows the general idea of a service desk workflow for comedy.</p>
    <p>The code of this game was made with the help of generative AI. See CREDITS.md for the free and open-source material used.</p>
    <p class="note-s">Your game is saved only in this browser.</p><button data-act="reset">Clear game data on this device</button></div>`;
}

const BODY = { cupiddesk: cupidWin, browser: browserWin, mailbox: mailWin, trash: trashWin, chart: chartWin, about: aboutWin };

/* ---------- render ---------- */
function render() {
  const keep = {}, a = document.activeElement;
  const activeId = a && a.dataset && a.dataset.keep !== undefined ? a.id : null;
  document.querySelectorAll("[data-keep]").forEach((el) => { keep[el.id] = el.value; });
  const unread = unreadCount();
  const icon = (id, e, l, b) => `<button class="icon" data-act="open" data-id="${id}"><span class="e">${e}</span><span class="l">${l}</span>${b ? `<span class="badge">${b}</span>` : ""}</button>`;
  $("#app").innerHTML = `<div class="monitor"><div class="desktop" id="desktop">
    <div class="icons">${icon("cupiddesk", "💘", "Cupiddesk")}${icon("browser", "🌐", "Browser")}${icon("mailbox", "📬", "Mailbox", unread)}${icon("trash", "🗑️", "Trash")}${icon("about", "ℹ️", "About")}</div>
    ${ui.open.map((id) => winHtml(id, BODY[id]())).join("")}</div>
    <div class="taskbar"><b>💘 Cupid OS</b>${ui.open.map((id) => `<button data-act="focus" data-id="${id}">${WIN[id].i} ${esc(WIN[id].t)}</button>`).join("")}<span class="sp"></span><span id="clock"></span></div></div>
    <div class="foot">${FOOT}</div>`;
  Object.keys(keep).forEach((id) => { const el = document.getElementById(id); if (el) el.value = keep[id]; });
  if (activeId) { const el = document.getElementById(activeId); if (el) { el.focus(); try { el.setSelectionRange(el.value.length, el.value.length); } catch (e) {} } }
  const c = $("#chat"); if (c) c.scrollTop = c.scrollHeight;
  tick(true);
}

function tick(skipCheck) {
  if (!skipCheck && checkTimers()) { render(); return; }
  const fresh = skipCheck ? [] : checkMails(Date.now() - ui.start);
  if (fresh.length) { fresh.forEach(mailPop); render(); return; }
  const now = Date.now();
  const clock = $("#clock"); if (clock) clock.textContent = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  document.querySelectorAll("[data-timer]").forEach((el) => { const n = getNote(+el.dataset.timer); if (!n) return; const l = n.due - now; el.textContent = fmt(l); el.className = "timer" + (l < 20000 ? " low" : ""); });
  document.querySelectorAll("[data-tbar]").forEach((el) => { const n = getNote(+el.dataset.tbar); if (!n) return; el.style.width = Math.max(0, Math.min(100, ((n.due - now) / n.total) * 100)) + "%"; });
}

/* ---------- actions ---------- */
const val = (id) => { const el = document.getElementById(id); return el ? el.value.trim() : ""; };
const acts = {
  open(el) { openWin(el.dataset.id); render(); },
  close(el) { closeWin(el.dataset.id); render(); },
  focus(el) { ui.pos[el.dataset.id].z = ++ui.z; render(); },
  setrole(el) { setProfile(val("a-name"), el.dataset.r); if (el.dataset.r === "cupid" && !ui.chartAuto) { ui.chartAuto = true; openWin("chart"); } render(); },
  switchrole() { game.profile.role = game.profile.role === "cupid" ? "customer" : "cupid"; save(); if (game.profile.role === "cupid" && !ui.chartAuto) { ui.chartAuto = true; openWin("chart"); } render(); },
  signout() { game.profile = null; save(); render(); },
  select(el) { ui.selCupid = +el.dataset.id; render(); },
  pickup() { pickUp(ui.selCupid); render(); },
  reply(el) { reply(ui.selCupid, +el.dataset.i); render(); },
  mend() { if (mend(ui.selCupid)) toast("Heart mended! 💘"); render(); },
  escalate() { escalate(ui.selCupid); render(); },
  mselect(el) { ui.selMine = +el.dataset.id; render(); },
  submit() {
    const t = val("s-text");
    if (!t) return toast("Write a LoveNote first.");
    if (!cooldown("submit", 5000)) return toast("The pigeon needs a short rest. Try again in a few seconds.");
    const m = submitMine(t); ui.selMine = m.id; render();
  },
  csend() {
    const t = val("c-text");
    if (!t) return;
    if (!cooldown("msg", 1500)) return toast("One message at a time, please.");
    if (mineReply(ui.selMine, t)) { const el = document.getElementById("c-text"); if (el) el.value = ""; render(); }
  },
  search() { ui.search = val("q") || null; render(); },
  mail(el) { ui.mailSel = +el.dataset.id; readMail(ui.mailSel); render(); },
  emptytrash() { toast("The pigeons took the trash away. 🕊️"); },
  reset() { if (!confirm("Clear all game data on this device?")) return; wipeGame(); ui.selCupid = null; ui.selMine = null; ui.mailSel = null; seed(); render(); }
};

document.addEventListener("click", (e) => { const el = e.target.closest("[data-act]"); if (el && acts[el.dataset.act]) acts[el.dataset.act](el); });
document.addEventListener("keydown", (e) => {
  if (e.key !== "Enter") return;
  if (e.target.id === "q") acts.search(); else if (e.target.id === "c-text") acts.csend();
});

/* drag windows by their title bar, raise on click */
let drag = null;
document.addEventListener("pointerdown", (e) => {
  const w = e.target.closest(".win"); if (!w) return;
  const id = w.dataset.win; ui.pos[id].z = ++ui.z; w.style.zIndex = ui.pos[id].z;
  const h = e.target.closest("[data-drag]");
  if (h && !e.target.closest("button")) drag = { id, el: w, sx: e.clientX, sy: e.clientY, l: w.offsetLeft, t: w.offsetTop };
});
document.addEventListener("pointermove", (e) => {
  if (!drag) return;
  drag.el.style.left = Math.max(0, drag.l + e.clientX - drag.sx) + "px";
  drag.el.style.top = Math.max(0, drag.t + e.clientY - drag.sy) + "px";
});
document.addEventListener("pointerup", () => { if (drag) { ui.pos[drag.id].x = drag.el.offsetLeft; ui.pos[drag.id].y = drag.el.offsetTop; drag = null; } });

function seed() { if (!game.notes.length) { spawnNote(); spawnNote(); spawnNote(); } }
seed();
setInterval(() => tick(false), 1000);
setInterval(() => { if (game.notes.filter(isOpenNote).length < 6) { spawnNote(); render(); } }, 30000);
render();
