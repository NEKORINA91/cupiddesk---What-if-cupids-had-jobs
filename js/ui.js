const $ = (s) => document.querySelector(s);
const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const FOOT = "Cupiddesk is a fictional parody game made for fun. Not real advice, not a serious tool, and not affiliated with any company.";
const ADDR = { desk: "cupid://desk", submit: "cupid://send-a-lovenote", about: "cupid://about" };

let ui = { tab: "desk", sel: null };

function toast(msg) {
  const t = document.createElement("div");
  t.className = "toast"; t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2800);
}

function fmt(ms) {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return String(Math.floor(s / 60)).padStart(2, "0") + ":" + String(s % 60).padStart(2, "0");
}

function stateChip(n) {
  const label = { New: "New LoveNote", LovePending: "LovePending", LoveEscalated: "LoveEscalated", Mended: "Heart mended", Heartbroken: "Heartbroken" }[n.state] || n.state;
  const cls = n.state === "Mended" ? "ok" : n.state === "Heartbroken" ? "bad" : "";
  return `<span class="chip ${cls}">${esc(label)}</span>`;
}

function noteCard(n) {
  return `<div class="note${ui.sel === n.id ? " sel" : ""}" data-act="select" data-id="${n.id}">
    <div class="num">LoveNote ${n.num}</div><div><b>${esc(n.title)}</b></div><div class="note-s">from ${esc(n.from)}</div></div>`;
}

function group(title, list) {
  return `<h4>${title} (${list.length})</h4>${list.map(noteCard).join("") || '<div class="note-s">Nothing here</div>'}`;
}

function sideHtml() {
  const by = (s) => game.notes.filter((n) => n.state === s).reverse();
  const done = game.notes.filter((n) => n.state === "Mended" || n.state === "Heartbroken").reverse();
  return group("New LoveNotes", by("New")) + group("LovePending", by("LovePending")) + group("LoveEscalated", by("LoveEscalated")) + group("Finished", done);
}

function chatHtml(n) {
  return n.chat.map((m) => {
    const me = m.who === "cupid";
    return `<div class="who"${me ? ' style="text-align:right"' : ""}>${me ? "You (Cupid L1)" : esc(n.from)}</div><div class="msg${me ? " me" : ""}">${esc(m.text)}</div>`;
  }).join("");
}

function mainHtml() {
  const n = ui.sel ? getNote(ui.sel) : null;
  if (!n) return `<div class="empty">Select a LoveNote from the list. 💌</div>`;
  let body = "";
  if (n.state === "New") {
    body = `<p>${esc(n.from)} is waiting. Pick this LoveNote up to start the Heartbreak Timer.</p>
      <button class="primary" data-act="pickup">Pick up LoveNote</button>`;
  } else if (n.state === "LovePending") {
    body = `<div class="row" style="justify-content:space-between"><span>Heartbreak Timer</span><span class="timer" data-timer="${n.id}"></span></div>
      <div class="meter"><i data-tbar="${n.id}" style="background:var(--red)"></i></div>
      <div class="row" style="justify-content:space-between"><span>Calm</span><span data-calmtxt="${n.id}">${n.calm}%</span></div>
      <div class="meter"><i data-calm="${n.id}" style="background:var(--green);width:${n.calm}%"></i></div>
      <div class="chat" id="chat">${chatHtml(n)}</div>
      <div class="row">${REPLIES.map((r, i) => `<button data-act="reply" data-i="${i}">${esc(r.text)}</button>`).join("")}</div>
      <p><button class="primary" data-act="mend"${n.calm < CALM_TO_MEND ? " disabled" : ""}>Mend the heart${n.calm < CALM_TO_MEND ? " (needs " + CALM_TO_MEND + "% calm)" : ""}</button></p>`;
  } else {
    body = `<div class="chat" id="chat">${chatHtml(n)}</div>
      <p>${n.state === "Mended" ? "This heart was mended. Well done, Cupid!" : "The Heartbreak Timer ran out. Better luck with the next one."}</p>`;
  }
  return `<div class="row" style="justify-content:space-between"><span class="num">LoveNote ${n.num}</span>${stateChip(n)}</div>
    <h2>${esc(n.title)}</h2><div class="note-s">from ${esc(n.from)}</div>${body}`;
}

function deskHtml() {
  return `<div class="desk"><div class="side">${sideHtml()}</div><div class="main">${mainHtml()}</div></div>`;
}

function submitHtml() {
  return `<div class="page"><h2>Send a LoveNote 💌</h2>
    <p>Describe a (silly, made up) relationship problem. A pigeon will deliver it to the Cupid desk.</p>
    <textarea id="s-text" rows="4" maxlength="300" placeholder="My partner keeps hiding my socks..."></textarea>
    <p class="note-s">Please keep it fictional. Don't write real personal details. Everything stays on this device.</p>
    <button class="primary" data-act="submit">Send with a pigeon 🕊️</button></div>`;
}

function aboutHtml() {
  return `<div class="page"><h2>About Cupiddesk</h2>
    <p>${esc(DISCLAIMER)}</p>
    <p>Cupiddesk is not affiliated with, endorsed by, or connected to any software company or product. It only borrows the general idea of a service desk workflow for comedy.</p>
    <p>The code of this game was made with the help of generative AI. See CREDITS.md for the free and open-source material used.</p>
    <p class="note-s">Your game is saved only in this browser.</p>
    <button data-act="reset">Clear game data on this device</button></div>`;
}

function render() {
  const view = ui.tab === "desk" ? deskHtml() : ui.tab === "submit" ? submitHtml() : aboutHtml();
  const tab = (id, label) => `<span class="tab${ui.tab === id ? " on" : ""}" data-act="tab" data-t="${id}">${label}</span>`;
  $("#app").innerHTML = `<div class="monitor">
    <div class="titlebar"><span class="dots"><span></span><span></span><span></span></span>Cupid OS 💘</div>
    <div class="chrome">${tab("desk", "Cupiddesk")}${tab("submit", "Send a LoveNote")}${tab("about", "About")}<span class="addr">${ADDR[ui.tab]}</span></div>
    <div class="content">${view}</div>
    <div class="taskbar"><span>🕊️ Pigeons on standby</span><span id="clock"></span></div></div>
    <div class="foot">${FOOT}</div>`;
  const c = $("#chat"); if (c) c.scrollTop = c.scrollHeight;
  tick();
}

function tick() {
  const changed = checkTimers();
  const now = Date.now();
  const clock = $("#clock"); if (clock) clock.textContent = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  document.querySelectorAll("[data-timer]").forEach((el) => {
    const n = getNote(+el.dataset.timer); if (!n) return;
    const left = n.due - now;
    el.textContent = fmt(left); el.className = "timer" + (left < 20000 ? " low" : "");
  });
  document.querySelectorAll("[data-tbar]").forEach((el) => {
    const n = getNote(+el.dataset.tbar); if (!n) return;
    el.style.width = Math.max(0, Math.min(100, ((n.due - now) / n.total) * 100)) + "%";
  });
  if (changed && ui.tab === "desk") render();
}

const acts = {
  tab(el) { ui.tab = el.dataset.t; render(); },
  select(el) { ui.sel = +el.dataset.id; render(); },
  pickup() { pickUp(ui.sel); render(); },
  reply(el) { reply(ui.sel, +el.dataset.i); render(); },
  mend() { if (mend(ui.sel)) toast("Heart mended! 💘"); render(); },
  submit() {
    const t = $("#s-text").value.trim();
    if (!t) return toast("Write a LoveNote first.");
    if (!cooldown("submit", 5000)) return toast("The pigeon needs a short rest. Try again in a few seconds.");
    $("#s-text").value = "";
    toast("A pigeon is on its way... 🕊️");
    setTimeout(() => {
      addNote({ title: t.length > 30 ? t.slice(0, 30) + "..." : t, text: t, from: "A stranger" });
      toast("A pigeon delivered a new LoveNote! 💌");
      if (ui.tab === "desk") render();
    }, 3000);
  },
  reset() { if (!confirm("Clear all LoveNotes and progress on this device?")) return; wipeGame(); ui.sel = null; seed(); render(); }
};

document.addEventListener("click", (e) => {
  const el = e.target.closest("[data-act]");
  if (el && acts[el.dataset.act]) acts[el.dataset.act](el);
});

function seed() { if (!game.notes.length) { spawnNote(); spawnNote(); spawnNote(); } }

seed();
setInterval(tick, 1000);
setInterval(() => {   // new LoveNotes keep arriving while there is room on the desk
  if (game.notes.filter(isOpenNote).length < 6) { spawnNote(); if (ui.tab === "desk") render(); }
}, 30000);
render();
