// STORY MODE. The game is played in shifts. Each shift is one chapter of the story.
//
// This is a stand-in story so the game is playable. Rewrite any text here with your
// own plot: mails, shift names, intros and the scripted "story" LoveNotes.
//
// Shift fields:
//   title, intro      shown on the shift card before it starts
//   notes             how many LoveNotes arrive during the shift
//   first, every      seconds until the first pigeon, then seconds between pigeons
//   goal              points needed to pass the shift
//   unlock            which features are on: triage (set type/priority), requests, l2 (escalation)
//   types             which LoveNotes can be generated: "incident", "request"
//   maxSev            lowest priority number allowed (3 = only Minor, 2 = Cracking and Minor, 1 = anything)
//   story             scripted LoveNotes that arrive as note number "at" in the shift
//   mails             { on: "start" | "closed:N" | "end", from, subject, body }

const SHIFTS = [
  {
    title: "Shift 1: First Flight",
    intro: "Your first day at the Cupiddesk. Pick up LoveNotes, chat with the sender, and calm them down before the Heartbreak Timer runs out.",
    notes: 3, first: 3, every: 22, goal: 220,
    unlock: { triage: false, requests: false, l2: false }, types: ["incident"], maxSev: 2,
    mails: [
      { on: "start", from: "Senior Cupid", subject: "Welcome to the desk",
        body: "Welcome, rookie.\n\nHeartbreak never sleeps, and neither do the pigeons. When a LoveNote lands, pick it up, ask for details, and pick replies that fit the problem.\n\nGet their Calm high enough and you can mend the heart. Let the timer hit zero and... well. Don't let the timer hit zero.\n\n- Senior Cupid" },
      { on: "closed:2", from: "Heart Resources", subject: "Reminder: wings must be worn",
        body: "A friendly reminder that wings are part of the dress code.\n\nWe have received three complaints about Cupids working 'wingless'. You know who you are.\n\n- Heart Resources" }
    ]
  },
  {
    title: "Shift 2: Triage Tuesday",
    intro: "New today: triage. Before you close a LoveNote, set its Category and Heart condition. Getting them right earns bonus points.",
    notes: 4, first: 3, every: 20, goal: 380,
    unlock: { triage: true, requests: false, l2: false }, types: ["incident"], maxSev: 1,
    mails: [
      { on: "start", from: "Senior Cupid", subject: "About those priorities",
        body: "Not every LoveNote is on fire. Some are just smouldering.\n\nNear-break = the heart is in danger RIGHT NOW.\nCracking = upset, but stable.\nMinor = a small grumble.\n\nRead carefully. Words like 'right now' and 'leaving' are clues.\n\nFor the Category, ask for details. People always say more than they mean to.\n\n- Senior Cupid" }
    ]
  },
  {
    title: "Shift 3: Requests Welcome",
    intro: "Now you'll get Requests (LNR numbers) too. Fair ones go to Cupid L2 Fulfilment. Impossible ones get politely declined.",
    notes: 5, first: 3, every: 18, goal: 450,
    unlock: { triage: true, requests: true, l2: false }, types: ["incident", "request"], maxSev: 1,
    story: [
      { at: 3, type: "request", cat: "jealous", sev: 2, fulfil: false, from: "Totally Not Senior Cupid", place: "The Desk Next Door",
        title: "Asking for a friend", text: "Hypothetically, could a Cupid use an arrow on someone they like? For a friend.",
        detail: "The friend is very handsome and has a very large bow. Not me. A friend.",
        reason: "Even Senior Cupids don't force feelings. Declined, 'friend'." }
    ],
    mails: [
      { on: "start", from: "Cupid L2 Fulfilment", subject: "We deliver (mostly)",
        body: "Hi L1!\n\nCakes, flowers, serenades, pigeon letters: send them our way and we'll handle it.\n\nWe do NOT do: love potions, cloning, memory wiping, or delivering people. Please stop sending us those.\n\n- L2 Fulfilment" },
      { on: "end", from: "???", subject: "They are watching the desk",
        body: "Something strange is happening in the pigeon coop.\n\nThey've started meeting at night. There are tiny clipboards.\n\nDon't tell Senior Cupid I told you." }
    ]
  },
  {
    title: "Shift 4: Call for Backup",
    intro: "You can now escalate incidents to Cupid L2. They're good, but slower, and you get fewer points. You still own the LoveNote.",
    notes: 5, first: 3, every: 16, goal: 520,
    unlock: { triage: true, requests: true, l2: true }, types: ["incident", "request"], maxSev: 1,
    mails: [
      { on: "start", from: "Senior Cupid", subject: "Use L2 wisely",
        body: "Some hearts are too heavy for one Cupid.\n\nIf a LoveNote is going badly, escalate it. L2 will do a (fictional) site visit. They usually fix it. Usually.\n\n- Senior Cupid" },
      { on: "closed:3", from: "Heart Resources", subject: "Pigeon crumb budget",
        body: "Due to rising crumb prices, each pigeon will now receive 4 crumbs per delivery instead of 5.\n\nWe do not expect any problems from this decision.\n\n- Heart Resources" }
    ]
  },
  {
    title: "Shift 5: Pigeon Storm",
    intro: "The pigeons are unhappy and the LoveNotes are piling up. Stay calm. Keep hearts mended. Survive the storm.",
    notes: 7, first: 2, every: 11, goal: 680,
    unlock: { triage: true, requests: true, l2: true }, types: ["incident", "request"], maxSev: 1,
    story: [
      { at: 4, type: "request", cat: "food", sev: 1, fulfil: true, from: "Coo Coo, Pigeon Union Rep", place: "The Coop",
        title: "Crumb demands", text: "WE WANT OUR FIFTH CRUMB BACK. No crumb, no deliveries. Coo.",
        detail: "One crumb. That's all. One. Send it with L2 and the strike ends. Coo coo." }
    ],
    mails: [
      { on: "start", from: "???", subject: "I warned you",
        body: "The pigeons are on strike.\n\nSome are still flying, but they're dropping LoveNotes faster than ever to make a point.\n\nIf a union rep writes in... be nice." },
      { on: "end", from: "Senior Cupid", subject: "You did it",
        body: "The storm has passed. The pigeons have their fifth crumb. Hearts are (mostly) mended.\n\nYou're not a rookie anymore.\n\nThe story continues soon. Until then, the desk is open for Overtime.\n\n- Senior Cupid" }
    ]
  }
];

// After the last story shift, Overtime shifts repeat forever with everything unlocked.
const OVERTIME = {
  title: "Overtime",
  intro: "Endless shifts. Every Overtime shift is a bit busier than the last. How long can you keep hearts mended?",
  notes: 6, first: 2, every: 12, goal: 560,
  unlock: { triage: true, requests: true, l2: true }, types: ["incident", "request"], maxSev: 1, mails: []
};
