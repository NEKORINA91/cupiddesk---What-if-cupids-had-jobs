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
