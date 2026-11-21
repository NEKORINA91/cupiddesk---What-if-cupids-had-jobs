// STORY MODE: 7 working days at the Cupiddesk.
// Everything marked [PLACEHOLDER] is stand-in text. Replace it with your own story.
//
// The plot so far:
// - The Love Goddess runs the Cupiddesk. Something about her is off.
// - The Pigeons carry LoveNotes (pigeon mail). Fewer paper letters in the internet age means lower pay. They're unhappy.
// - The Goddess complained that the pigeons sabotage her. The pigeons complained about pay and her suspicious behaviour.
// - An Angel from the High Realm is quietly investigating and asks the Cupid for help.
// - You're a Cupid just trying to clock out.

/* ---------- time ---------- */
const DAY_MINUTES = 12;          // real minutes in one in-game day
const WORK_START = 9;            // in-game clock: 9:00 AM ...
const WORK_END = 17;             // ... to 5:00 PM (clock out)

/* ---------- the 7 days ----------
   every / first: seconds between LoveNotes / until the first one.
   goal: points for a good day report. unlock: desk features that are switched on. */
const DAYS = [
  { title: "Day 1: First Flight", intro: "Your first day at the Cupiddesk. Pick up LoveNotes, calm the lovers down, and survive until 5 PM.",
    first: 4, every: 60, goal: 900, unlock: { triage: false, requests: false, l2: false }, types: ["incident"], maxSev: 2 },
  { title: "Day 2: Pigeon Mail", intro: "Triage starts today. Set the Category and Heart condition before closing a LoveNote.",
    first: 4, every: 52, goal: 1200, unlock: { triage: true, requests: false, l2: false }, types: ["incident"], maxSev: 1 },
  { title: "Day 3: Requests Welcome", intro: "Requests (LNR numbers) arrive today. Fair ones go to the Psyche Squad. Impossible ones get declined.",
    first: 4, every: 48, goal: 1400, unlock: { triage: true, requests: true, l2: false }, types: ["incident", "request"], maxSev: 1 },
  { title: "Day 4: Call for Backup", intro: "You can escalate incidents to the Psyche Squad now, the Cupids' mythical backup team. Slower, fewer points, usually works.",
    first: 4, every: 45, goal: 1500, unlock: { triage: true, requests: true, l2: true }, types: ["incident", "request"], maxSev: 1 },
  { title: "Day 5: Strange Orders", intro: "[PLACEHOLDER] The Goddess's mails are getting stranger. Keep the hearts mended. Keep your eyes open.",
    first: 4, every: 42, goal: 1600, unlock: { triage: true, requests: true, l2: true }, types: ["incident", "request"], maxSev: 1 },
  { title: "Day 6: Ruffled Feathers", intro: "[PLACEHOLDER] The pigeons are restless. The angel wants answers. The LoveNotes keep coming.",
    first: 4, every: 40, goal: 1700, unlock: { triage: true, requests: true, l2: true }, types: ["incident", "request"], maxSev: 1 },
  { title: "Day 7: Clock Out", intro: "[PLACEHOLDER] The last day. Whatever you've done this week, it all comes together at 5 PM.",
    first: 4, every: 38, goal: 1800, unlock: { triage: true, requests: true, l2: true }, types: ["incident", "request"], maxSev: 1 }
];

/* ---------- who can send and receive mail ---------- */
const PARTIES = {
  goddess: { name: "The Love Goddess", e: "👑", address: "goddess@love.divine" },
  angel:   { name: "Angel (High Realm)", e: "😇", address: "a.investigations@highrealm.heaven" },
  pigeons: { name: "Pigeon Spy", e: "🐦", address: "spy@coop.noflight" },
  other:   { name: "", e: "✉️", address: "" }
};
// replies offered on mails that don't have their own (no one answers these)
const DEFAULT_REPLIES = [{ text: "Thanks!" }, { text: "Noted." }];

/* ---------- NoFlight mail ----------
   day / at: which day and how many real minutes into it (0 to 11).
   party: who sent it. kind: what it counts as when forwarded:
     "normal" = an ordinary Goddess mail, "sus" = a suspicious Goddess mail (real evidence),
     "angel", "pigeon", "random" (noise).
   needs: only arrives if "pigeonContact" or "angelContact" is unlocked.
   sets: unlocks a contact when it arrives.
   replies: buttons the Cupid can answer with. answer = optional mail that comes back. */
const MAILS = [
  { id: "g-welcome", day: 1, at: 0, party: "goddess", kind: "normal", from: "The Love Goddess", subject: "Welcome, little Cupid 💘",
    body: "Welcome to the Cupiddesk, my dear Cupid!\n\nYou are now part of the most important work in the world: keeping hearts together. Work hard, mend hearts, and always remember who you work for.\n\nWith love (literally),\nThe Love Goddess",
    replies: [{ text: "Thank you, Goddess! I'll do my best. 💘" }, { text: "Happy to be here!" }] },
  { id: "r-hr1", day: 1, at: 3, party: "other", kind: "random", from: "Heart Resources", subject: "Reminder: wings must be worn",
    body: "A friendly reminder that wings are part of the dress code.\n\nWe've received three complaints about Cupids working 'wingless'. You know who you are.\n\n- Heart Resources" },
  { id: "r-senior1", day: 1, at: 7, party: "other", kind: "random", from: "Senior Cupid", subject: "tip from the desk next door",
    body: "Hey rookie. Ask for details before you reply. People always say more than they mean to.\n\nAlso, don't read WorldArticlez during work. (Everyone reads WorldArticlez during work.)\n\n- Senior Cupid" },

  { id: "r-spam1", day: 2, at: 1, party: "other", kind: "random", from: "Golden Arrow Prize Team", subject: "YOU WON a golden arrow!!!",
    body: "Congratulations Cupid! You have won a GOLDEN ARROW. To claim it, simply send us 400 Heartcoins and your wing measurements.\n\n(This is obviously spam.)" },
  { id: "a-first", day: 2, at: 7, party: "angel", kind: "angel", sets: "angelContact", from: "Angel (High Realm)", subject: "Confidential: a request for help",
    body: "[PLACEHOLDER] Cupid,\n\nI am an angel sent by the High Realm. This message is confidential.\n\nTwo complaints have reached us. The Love Goddess says the pigeons are sabotaging her. The pigeons say their pay is too low and that she is doing something suspicious.\n\nI'm investigating both. You see everything that passes through the desk. If you notice anything strange, forward it to me.\n\nHelp me find an end to this.\n- A.",
    replies: [{ text: "I'll keep my eyes open.", answer: { subject: "Re: Confidential", body: "[PLACEHOLDER] Thank you. Only send me real evidence. My time is limited." } },
      { text: "Why me?", answer: { subject: "Re: Confidential", body: "[PLACEHOLDER] Because every LoveNote and every pigeon passes through your desk. Nobody notices Cupids." } }] },

  { id: "g-compat", day: 3, at: 2, party: "goddess", kind: "sus", from: "The Love Goddess", subject: "NEW FEATURE: compatibility is optional",
    body: "[PLACEHOLDER] To all Cupids,\n\nFrom today, please stop worrying about compatibility. If two hearts are near each other, match them. Faster matches = happier Goddess.\n\nDo not ask why.\n- The Love Goddess" },
  { id: "p-spy1", day: 3, at: 5, party: "pigeons", kind: "pigeon", needs: "pigeonContact", from: "Pigeon Spy", subject: "coo. the coop is listening",
    body: "[PLACEHOLDER] Cupid. Coo.\n\nShe's been sending orders to every Cupid. If you see anything weird, send it to us. We're keeping a file.\n\nDon't tell anyone about this address.\n- P.",
    replies: [{ text: "What kind of weird?", answer: { subject: "Re: coo", body: "[PLACEHOLDER] Orders that don't make sense. Orders about money. Coo." } }, { text: "I'll think about it." }] },
  { id: "r-news1", day: 3, at: 8, party: "other", kind: "random", from: "Cupid Weekly", subject: "This week's top 5 arrow-care tips",
    body: "1. Keep them dry.\n2. Don't lend them to Senior Cupid.\n3. Never aim at pigeons.\n4. Polish weekly.\n5. See tip 2." },

  { id: "g-pigeons", day: 4, at: 2, party: "goddess", kind: "sus", from: "The Love Goddess", subject: "ATTENTION: pigeons can't be trusted",
    body: "[PLACEHOLDER] To all Cupids,\n\nThe pigeons are spreading lies about me. Do not talk to them. If a pigeon contacts you, forward it to me IMMEDIATELY.\n\nPigeons can't be trusted.\n- The Love Goddess" },
  { id: "a-check1", day: 4, at: 6, party: "angel", kind: "angel", needs: "angelContact", from: "Angel (High Realm)", subject: "Any news?",
    body: "[PLACEHOLDER] Cupid, anything to report? I need proof, not rumours.\n- A.",
    replies: [{ text: "Not yet.", answer: { subject: "Re: Any news?", body: "[PLACEHOLDER] Keep watching." } }, { text: "I'm working on it." }] },
  { id: "p-spy2", day: 4, at: 9, party: "pigeons", kind: "pigeon", needs: "pigeonContact", from: "Pigeon Spy", subject: "crumbs report",
    body: "[PLACEHOLDER] 4 crumbs per delivery now. FOUR. Meanwhile someone upstairs bought a gold-plated bird bath. Coo.",
    replies: [{ text: "That's unfair.", answer: { subject: "Re: crumbs", body: "[PLACEHOLDER] Finally, someone gets it. Coo." } }, { text: "Not my problem." }] },

  { id: "g-buy", day: 5, at: 2, party: "goddess", kind: "sus", from: "The Love Goddess", subject: "From now on, every couple must buy this",
    body: "[PLACEHOLDER] To all Cupids,\n\nFrom now on, every relationship you help must buy a Goddess-Approved Love Ring™ (only 999 Heartcoins).\n\nPush it. Every time. I'll be checking.\n- The Love Goddess" },
  { id: "r-hr2", day: 5, at: 5, party: "other", kind: "random", from: "Heart Resources", subject: "Pigeon crumb budget",
    body: "Due to rising crumb prices, each pigeon will now receive 4 crumbs per delivery instead of 5.\n\nWe do not expect any problems from this decision.\n- Heart Resources" },
  { id: "a-check2", day: 5, at: 8, party: "angel", kind: "angel", needs: "angelContact", from: "Angel (High Realm)", subject: "The High Realm is getting impatient",
    body: "[PLACEHOLDER] Cupid, the High Realm wants results. Send me anything real.\n- A." },

  { id: "g-thanks", day: 6, at: 1, party: "goddess", kind: "normal", from: "The Love Goddess", subject: "Great work this week, Cupids",
    body: "[PLACEHOLDER] Hearts are being mended. Rings are being sold. I am very pleased.\n\nKeep it up.\n- The Love Goddess" },
  { id: "g-delete", day: 6, at: 5, party: "goddess", kind: "sus", from: "The Love Goddess", subject: "Delete pigeon mail without reading",
    body: "[PLACEHOLDER] To all Cupids,\n\nPlease delete all mail from pigeons without reading it. Also, if anyone asks about the ring money, you don't know anything.\n- The Love Goddess" },
  { id: "p-spy3", day: 6, at: 8, party: "pigeons", kind: "pigeon", needs: "pigeonContact", from: "Pigeon Spy", subject: "tomorrow",
    body: "[PLACEHOLDER] Tomorrow is the big day, Cupid. Whose side are you on? Coo." },

  { id: "g-final", day: 7, at: 2, party: "goddess", kind: "sus", from: "The Love Goddess", subject: "If the High Realm contacts you",
    body: "[PLACEHOLDER] To all Cupids,\n\nIf anyone from the High Realm contacts you, do not reply. Forward it to me. Loyal Cupids will be rewarded.\n- The Love Goddess" },
  { id: "a-final", day: 7, at: 6, party: "angel", kind: "angel", needs: "angelContact", from: "Angel (High Realm)", subject: "Last chance",
    body: "[PLACEHOLDER] Cupid, I file my report at 5 PM today. Whatever you know, send it now.\n- A." }
];

/* ---------- the pigeon LoveNote ----------
   From day 2, the pigeons write in as a LoveNote. If you refuse, they try again on later days
   with a new message (one per attempt). Accepting gets you the Pigeon Spy's email. */
const PIGEON_NOTE = {
  minute: 2,   // minutes into the day when it arrives
  attempts: [
    { title: "Urgent coo", text: "[PLACEHOLDER] Psst. Cupid. This isn't a normal LoveNote. We're the pigeons. We need to talk." },
    { title: "Please read this", text: "[PLACEHOLDER] It's us again. Coo. We carried 400 LoveNotes yesterday for 4 crumbs each. Please, just talk to us." },
    { title: "Third time", text: "[PLACEHOLDER] Cupid. We know you read these. We're not leaving. Coo." },
    { title: "Last try", text: "[PLACEHOLDER] This is our last LoveNote to you. After this we stop asking. Coo..." }
  ],
  choices: {
    accept: "Okay. What's your email?",
    why: "Why are you writing to a Cupid?",
    refuse: "No. I'm not getting involved."
  },
  whyAnswer: "[PLACEHOLDER] Because you see everything. Every LoveNote passes your desk before it goes anywhere. And something is wrong upstairs. Coo.",
  acceptAnswer: "[PLACEHOLDER] Good Cupid. Watch your NoFlight inbox. Our spy will write to you. Coo coo.",
  refuseAnswer: "[PLACEHOLDER] ...fine. Coo.",
  // the mail you get from the Pigeon Spy right after accepting
  spyMail: { subject: "coo. it's me", body: "[PLACEHOLDER] Cupid. This is the Pigeon Spy. You can reach the coop here now. Forward us anything strange from upstairs. Coo.",
    replies: [{ text: "What's going on?", answer: { subject: "Re: coo", body: "[PLACEHOLDER] Not here. Not yet. Watch her mails. Coo." } }, { text: "Got it." }] }
};

/* ---------- forwarding ----------
   Forward any mail to the angel, the Goddess or the pigeons. Each reacts differently.
   effect: what it counts toward.
     evidence = real proof for the angel, support = helping the pigeons,
     loyal = loyalty to the Goddess, annoyAngel / annoyGoddess = spam,
     frustrate = annoys the pigeons (harmless). */
const FORWARD = {
  angel: {
    sus:    { effect: "evidence",   body: "[PLACEHOLDER] This... this is useful. I'm adding it to the report. Keep going. - A." },
    normal: { effect: "annoyAngel", body: "[PLACEHOLDER] This is a normal work email. Are you fooling me, Cupid? - A." },
    pigeon: { effect: "annoyAngel", body: "[PLACEHOLDER] A pigeon's word isn't proof. I need something from HER. - A." },
    angel:  { effect: "annoyAngel", body: "[PLACEHOLDER] ...you sent me my own email. - A." },
    random: { effect: "annoyAngel", body: "[PLACEHOLDER] I'm investigating a goddess. Why are you sending me this? - A." }
  },
  goddess: {
    pigeon: { effect: "loyal",        body: "[PLACEHOLDER] Thank you for telling me, dear Cupid. Keep monitoring them for me. 💘" },
    angel:  { effect: "loyal",        body: "[PLACEHOLDER] An angel? Interesting. Ignore them. And keep monitoring. 💘" },
    sus:    { effect: "annoyGoddess", body: "[PLACEHOLDER] Why are you sending me my own email?" },
    normal: { effect: "annoyGoddess", body: "[PLACEHOLDER] Why are you sending me my own email?" },
    random: { effect: "annoyGoddess", body: "[PLACEHOLDER] I am a GODDESS. Do not forward me junk." }
  },
  pigeons: {
    sus:    { effect: "support",   body: "[PLACEHOLDER] COO. This goes in the file. Thank you, Cupid." },
    normal: { effect: "frustrate", body: "[PLACEHOLDER] That's just a normal email. Coo..." },
    angel:  { effect: "frustrate", body: "[PLACEHOLDER] mmm. An angel. Interesting. Coo." },
    pigeon: { effect: "frustrate", body: "[PLACEHOLDER] We sent you this. Coo??" },
    random: { effect: "frustrate", body: "[PLACEHOLDER] Why. Coo." }
  }
};

/* ---------- limits and endings ---------- */
const LIMITS = {
  // Spam = a pointless forward. You can send up to 5 a day to each side. The 5th gets a FINAL WARNING.
  // One more on the same day = Clipped Wings. The count resets every new day.
  angelSpam: 5,      // pointless forwards to the angel allowed per day
  goddessSpam: 5,    // pointless forwards to the Goddess allowed per day
  pigeonSpam: 5,     // the pigeons only get frustrated, nothing happens
  angelWin: 3,       // suspicious Goddess mails sent to the angel to win
  pigeonWin: 3       // suspicious Goddess mails sent to the pigeons for the pigeon ending
};
// These replace the normal reply on the 4th (first) and 5th (final) pointless forward of the day,
// so you only ever get one mail back per forward.
const WARNINGS = {
  annoyAngel: {
    first: "[PLACEHOLDER] Cupid. Please only send me real evidence. - A.",
    final: "[PLACEHOLDER] FINAL WARNING. One more pointless email and I'll treat you as part of the problem. - A."
  },
  annoyGoddess: {
    first: "[PLACEHOLDER] Stop filling my inbox, Cupid. My patience is not eternal, even if I am.",
    final: "[PLACEHOLDER] FINAL WARNING. Send me one more useless email and you're done here."
  },
  frustrate: { first: "[PLACEHOLDER] COO. Stop sending us random stuff.", final: "[PLACEHOLDER] COO COO. We are VERY frustrated. (We won't do anything about it though.)" }
};
const ENDINGS = {
  angel:    { e: "😇", title: "Ending: The Report", body: "[PLACEHOLDER] You helped the angel. The High Realm reads the report, and the Love Goddess is caught. The Cupiddesk is under new management. You finally clock out." },
  pigeons:  { e: "🐦", title: "Ending: Feathers Fly", body: "[PLACEHOLDER] You helped the pigeons. The Goddess finds out, terminates your contract, and hands you over to the angels." },
  neutral:  { e: "⛓️", title: "Ending: Just Doing My Job", body: "[PLACEHOLDER] You kept your head down and worked until the end. The angel arrests you for not supporting the investigation." },
  // clipped: true = shows the broken-screen "CLIPPED WINGS" effect first
  spamAngel:   { e: "🚨", clipped: true, title: "Ending: Clipped Wings (Arrested)", body: "[PLACEHOLDER] You flooded the angel's inbox one too many times. They arrest you for wasting the High Realm's time." },
  spamGoddess: { e: "📦", clipped: true, title: "Ending: Clipped Wings (Fired)", body: "[PLACEHOLDER] You flooded the Goddess's inbox one too many times. You're fired. Please return your wings." }
};

/* ---------- WorldArticlez (in-game browser) ----------
   day: the first day an article appears. */
const ARTICLES = [
  { day: 1, title: "Cupiddesk reaches sky high", body: "[PLACEHOLDER] The Love Goddess's Cupiddesk is mending more hearts than ever, according to the Love Goddess." },
  { day: 1, title: "Pigeons say they need more than crumbs (literally??)", body: "[PLACEHOLDER] Pigeon mail volumes have dropped as lovers move to texting. The pigeons say crumbs no longer pay the bills." },
  { day: 2, title: "Pigeon CEO owns 3 bowls in this economy", body: "[PLACEHOLDER] While delivery pigeons get 4 crumbs, the Pigeon CEO was spotted with not one, not two, but THREE bowls." },
  { day: 3, title: "Cupid pay rates drop", body: "[PLACEHOLDER] Cupids report smaller Heartcoin payouts this month. The Goddess's office declined to comment." },
  { day: 4, title: "Pigeon pay hits record low as lovers go digital", body: "[PLACEHOLDER] 'Nobody writes letters anymore,' said one pigeon, sadly eating a crumb." },
  { day: 5, title: "Goddess-Approved Love Rings™ sell out", body: "[PLACEHOLDER] Couples everywhere are suddenly buying the same ring. Experts are confused." },
  { day: 6, title: "High Realm 'looking into' love industry", body: "[PLACEHOLDER] A High Realm spokesperson confirmed nothing and denied nothing." }
];

/* ---------- search: most words are restricted, a few open hidden pages ----------
   keys: words that open the page (lowercase). */
const HIDDEN_PAGES = [
  { keys: ["cupiddesk", "history", "origin", "goddess"], title: "Why the Cupiddesk exists", body: "[PLACEHOLDER: the story of why the Love Goddess built the Cupiddesk]" },
  { keys: ["pigeon ceo", "ceo", "pigeon"], title: "The Pigeon CEO's most embarrassing moment", body: "[PLACEHOLDER: an embarrassing story about the Pigeon CEO]" },
  { keys: ["high realm", "angel", "policy", "policies"], title: "High Realm: new administration policies", body: "[PLACEHOLDER: the High Realm's new administration policies and jobs]\n\nLooking for work? Try PayToWork.", link: "paytowork" },
  { keys: ["paytowork", "job", "jobs"], title: "PayToWork", paytowork: true, body: "You pay us, we find you a job. Any job. No refunds. 100% random." }
];
const PAYTOWORK_COST = 20;
const PAYTOWORK_JOBS = [
  "Professional cloud fluffer", "Rainbow colour checker (only checks blue)", "Assistant to the assistant pigeon",
  "Halo polisher, night shift", "Official sniffer of love letters", "Lighthouse for lost butterflies",
  "Trainee thunder (quiet department)", "Moon nap supervisor", "Senior Cupid's personal bow carrier"
];

/* ---------- Birb Connections VPN ----------
   Buy it in the Cupid Shop. With it on, searches that would say "Restricted access"
   can open these extra pages instead. keys: words that open the page. */
const VPN = { name: "Birb Connections", e: "🐦", slogan: "You search. We don't know." };
const VPN_PAGES = [
  { keys: ["ring", "rings", "love ring"], title: "Where the ring money goes", body: "[PLACEHOLDER: secret info about the Goddess-Approved Love Ring™ money]" },
  { keys: ["complaint", "complaints", "sabotage"], title: "The two complaints (leaked)", body: "[PLACEHOLDER: the Goddess's complaint about the pigeons, and the pigeons' complaint about her]" },
  { keys: ["coop", "pigeon union", "union", "strike"], title: "Inside the coop", body: "[PLACEHOLDER: what the pigeons are really planning]" },
  { keys: ["crumbs", "pay", "salary", "wages"], title: "Crumb budget spreadsheet", body: "[PLACEHOLDER: how pigeon and Cupid pay was cut]" },
  { keys: ["investigation", "report", "a.investigations"], title: "High Realm case file #0214", body: "[PLACEHOLDER: what the angel's investigation has found so far]" }
];

/* ---------- tapping pigeons ----------
   Tap a flying pigeon 4 times and it goes poof: that LoveNote never reaches you.
   kills: after this many in one week, the Goddess emails you. */
const PIGEON_POOF = {
  goddessMailAt: 8,
  goddessMail: { subject: "About the pigeons...", body: "Cupid,\n\nI know pigeons are the worst. But try not to get me into PR trouble for now.\n\n- The Love Goddess" }
};

/* ---------- Cupid Shop ----------
   id "vpn" is the Birb Connections VPN. Items without an id are "coming soon". */
const SHOP_ITEMS = [
  { id: "vpn", name: "Birb Connections VPN", e: "🐦", price: 150, desc: "You search. We don't know. Unlocks secret search results in the browser." },
  { name: "Fancy wings", e: "🪽", price: 120 },
  { name: "Golden arrow (real one)", e: "🏹", price: 300 },
  { name: "Desk plant (not Gerald)", e: "🪴", price: 60 },
  { name: "Extra crumbs for the pigeons", e: "🍞", price: 40 }
];

/* ---------- Trophies (My Achievements, in the browser) ----------
   Trophies are saved separately and stay even when you start a new week.
   They're only removed by "Delete everything" in About, or by clearing the browser's data. */
const TROPHIES = [
  { id: "first_mend", e: "💘", name: "First Flutter", desc: "Mend your first heart." },
  { id: "mend_25", e: "💞", name: "Heart Mechanic", desc: "Mend 25 hearts in one week." },
  { id: "perfect_day", e: "🌟", name: "Employee of the Day", desc: "Get an S on a day report." },
  { id: "full_week", e: "📅", name: "Survived the Week", desc: "Work all 7 days." },
  { id: "perfect_week", e: "☕", name: "Monday? Already...", desc: "Work all 7 days perfectly: reach the goal every single day." },
  { id: "skip_day", e: "🛋️", name: "That's Easy", desc: "Skip a whole day without touching a single LoveNote." },
  { id: "love_stinks", e: "🦨", name: "Love Stinks", desc: "Fail 5 LoveNotes in one week." },
  { id: "cupid_week", e: "🏅", name: "Cupid of the Week", desc: "Fully mend 5 LoveNotes in one day." },
  { id: "pigeon_pal", e: "🐦", name: "Pigeon Pal", desc: "Give the pigeons your email." },
  { id: "cold_shoulder", e: "🧊", name: "Cold Shoulder", desc: "Refuse the pigeons every single time." },
  { id: "first_evidence", e: "📨", name: "Whistleblower", desc: "Send the angel real evidence." },
  { id: "snitch", e: "👑", name: "Teacher's Pet", desc: "Report someone to the Goddess." },
  { id: "nosy", e: "🔒", name: "Restricted Access", desc: "Hit 'Restricted access' 5 times." },
  { id: "hidden_all", e: "🗝️", name: "Deep Web Cupid", desc: "Find every hidden page." },
  { id: "vpn", e: "🕶️", name: "Off the Grid", desc: "Buy the Birb Connections VPN." },
  { id: "vpn_all", e: "🛰️", name: "Birb's Eye View", desc: "Find every secret VPN page." },
  { id: "pigeon_5", e: "🪶", name: "What Did I Do?", desc: "Make 5 flying pigeons go poof." },
  { id: "news_junkie", e: "📰", name: "News Junkie", desc: "Read 5 WorldArticlez stories." },
  { id: "paytowork", e: "🎰", name: "Employed (Sort Of)", desc: "Win a job from PayToWork." },
  { id: "end_angel", e: "😇", name: "Ending: The Report", desc: "Help the angel." },
  { id: "end_pigeons", e: "🪶", name: "Ending: Feathers Fly", desc: "Help the pigeons." },
  { id: "end_neutral", e: "⛓️", name: "Ending: Just Doing My Job", desc: "Stay out of it." },
  { id: "end_spamAngel", e: "🚨", name: "Ending: Clipped Wings (Arrested)", desc: "Annoy the angel too much." },
  { id: "end_spamGoddess", e: "📦", name: "Even Love Has a Patience Limit", desc: "Get fired by the Love Goddess for spamming her." },
  { id: "all_endings", e: "🏆", name: "Seen It All", desc: "Find every ending." }
];
