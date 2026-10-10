// Cupiddesk game data. All names, scenarios and lines are fictional and original.
const PEOPLE = ["Pip", "Mochi", "Juniper", "Basil", "Clover", "Poppy", "Waffles", "Mint", "Ziggy", "Olive"];

const NOTES = [
  { title: "Left on read", text: "I sent a heart and they replied with 'k'. Is this the end?" },
  { title: "Forgot the anniversary", text: "I forgot our anniversary and now dinner is very quiet." },
  { title: "Two dates, one evening", text: "I accidentally booked two dates on Friday at the same restaurant." },
  { title: "The cold shoulder", text: "My partner is talking to the houseplant instead of me." },
  { title: "Pizza betrayal", text: "They ate the last slice I was saving for movie night." },
  { title: "Wrong group chat", text: "I sent my love poem to the work group chat." },
  { title: "Cuddle dispute", text: "We both want to be the little spoon. Neither will budge." },
  { title: "Playlist war", text: "They deleted my favorite song from our shared playlist." }
];

// Quick replies the Cupid can send. Effect on the person's calm is random between min and max.
const REPLIES = [
  { text: "Take a deep breath and say sorry sincerely.", min: 8, max: 20 },
  { text: "Send a pigeon with a handwritten poem.", min: -5, max: 22 },
  { text: "Suggest a snack peace treaty.", min: 5, max: 15 },
  { text: "Tell them to just ignore it.", min: -20, max: 2 },
  { text: "Recommend a dramatic grand gesture.", min: -15, max: 25 },
  { text: "Scatter rose petals (imaginary ones).", min: 0, max: 12 }
];
const GOOD = ["That actually helps. Thank you.", "Okay... I feel a little better.", "Aww, that is sweet."];
const BAD = ["That made it worse!", "Why would you say that?", "I'm even more upset now."];

const HEARTBREAK_SECONDS = 90;   // Heartbreak Timer length once a LoveNote is picked up
const CALM_TO_MEND = 70;         // calm needed before a heart can be mended
const DISCLAIMER = "Cupiddesk is a fictional parody game created for entertainment and humor. Its characters, scenarios, conversations, and resolutions are fictional and are not intended to provide real relationship, psychological, legal, medical, or professional advice. Do not use the game's fictional responses as guidance for real-world decisions.";

// ---------- Desktop world (all fictional) ----------
const BOT_CUPIDS = ["Cupid Biscuit", "Cupid Noodle", "Cupid Pickle", "Cupid Marsh"];
const BOT_CUPID_LINES = [
  "Thank you for your LoveNote. Have you tried a nice cup of tea?",
  "I am consulting the Big Book of Hearts. Please hold.",
  "Have you considered sending a pigeon with a snack?",
  "I understand. That sounds very dramatic. Tell me more.",
  "Noted! I am passing your feelings to the right department."
];
const BOT_GREETING = "Hi, I'm your Cupid for today. I've read your LoveNote. Tell me more!";
const BOT_DONE_GOOD = "Good news! My wings say your heart is mended. Case closed!";
const BOT_DONE_BAD = "Oh no, the pigeon got lost and the heart cracked. So sorry about that.";
const L2_GOOD = "Cupid L2 here. Calmed everyone down with a very large teddy bear. Heart mended!";
const L2_BAD = "Cupid L2 here. The pigeons stole the teddy bear. Heart broken. We apologise.";
const L2_DELAY_SECONDS = 12;      // how long the automated L2 takes
const PIGEON_SECONDS = 3;         // pigeon delivery time
const CUSTOMER_PICKUP_SECONDS = 4; // how long until a bot Cupid picks up your LoveNote
const CUSTOMER_REPLIES_TO_FINISH = 3;

const HEADLINES = [
  "Cupid job ratings are down, say hearts everywhere",
  "Pigeon union asks for better crumbs",
  "Local heart declared 'mostly fine'",
  "Study: 9 out of 10 hearts prefer snacks",
  "Rose petals now sold by the pound",
  "Senior Cupid denies owning a very large bow"
];
const SEARCH_TEMPLATES = [
  "%q%: 5 things Cupids will not tell you",
  "Is %q% a pigeon? Experts disagree",
  "How to fix %q% with only a snack",
  "%q% (page not found, the pigeons ate it)"
];
const TRASH_ITEMS = ["apology_final_FINAL_v3.txt", "broken_heart (2).png", "pigeon_complaints.doc", "unsent_poem_draft.txt"];

// STORY MAIL. Replace the placeholder text with your own plot. Each mail pops up
// "after" seconds from the start of a play session (only once).
const MAILS = [
  { id: 1, after: 12, from: "Senior Cupid", subject: "Welcome to the desk",
    body: "[PLACEHOLDER: Stoy is still being adjusted im not sure sorry]\n\nWelcome, rookie. Heartbreak never sleeps. Watch the timers, and do not trust the pigeons too much." },
  { id: 2, after: 60, from: "Heart Resources", subject: "Reminder: wings must be worn",
    body: "[PLACEHOLDER: Stoy is still being adjusted im not sure sorry]\n\nA friendly reminder that wings are part of the dress code." },
  { id: 3, after: 130, from: "???", subject: "They are watching the desk",
    body: "[PLACEHOLDER: Stoy is still being adjusted im not sure sorry]\n\nSomething strange is happening in the pigeon coop..." }
];
