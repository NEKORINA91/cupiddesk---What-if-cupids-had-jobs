// Cupiddesk game data. All names, scenarios and lines are fictional and original.
// Tweak anything here: it's all just text and numbers.

/* ---------- LoveNote numbers ----------
   Every LoveNote gets a system-generated number with a prefix:
   LNI = LoveNote Incident (something broke: a fight, a forgotten date...)
   LNR = LoveNote Request  (someone wants something: a cake, a serenade...)  */
const PREFIX = { incident: "LNI", request: "LNR" };
const NUMBER_START = 1040;

/* ---------- generated senders ---------- */
const FIRST = ["Pip", "Mochi", "Juniper", "Basil", "Clover", "Poppy", "Waffles", "Mint", "Ziggy", "Olive",
  "Biscuit", "Tofu", "Marigold", "Pickles", "Sunny", "Bean", "Hazel", "Noodle", "Peaches", "Remy"];
const LAST = ["Puddleton", "McFluff", "Sprinkle", "Honeybun", "Wobbleworth", "Crumbs", "Featherby",
  "Moonpie", "Snugglesby", "Teacup", "Butterfield", "Lollop"];
const PARTNERS = ["Kiwi", "Sprout", "Muffin", "Dash", "Echo", "Tulip", "Rocket", "Button", "Maple", "Jelly"];
const TOWNS = ["Puddingham", "Little Snugford", "Marshmallow Bay", "Upper Cuddleton", "Sweetpea Hollow", "Rosewick"];

/* ---------- categories ----------
   Each LoveNote has a category. Asking for details reveals it, and replies that
   match the category calm the sender down the most. */
const CATS = {
  talk:    { label: "Communication",       e: "💬", color: "#7F77DD" },
  forgot:  { label: "Forgetfulness",       e: "📅", color: "#EF9F27" },
  food:    { label: "Food crimes",         e: "🍕", color: "#D85A30" },
  tech:    { label: "Phone mishaps",       e: "📱", color: "#378ADD" },
  jealous: { label: "Jealousy",            e: "👀", color: "#1D9E75" },
  home:    { label: "Home life",           e: "🛋️", color: "#D4537E" }
};

/* ---------- heart condition (priority) ----------
   Cupiddesk uses its own heart scale instead of P1/P2/P3:
   Near-break = heart in danger right now, Cracking = upset but stable, Minor = a small grumble.
   The Heartbreak Timer is shorter for worse conditions. Rename them here if you like. */
const PRIORITY = {
  1: { label: "Near-break", short: "Near-break", e: "💔", seconds: 75, hint: "Heart in danger right now" },
  2: { label: "Cracking", short: "Cracking", e: "❤️‍🩹", seconds: 105, hint: "Upset, but stable" },
  3: { label: "Minor", short: "Minor", e: "💗", seconds: 140, hint: "A small grumble" }
};

/* ---------- incident templates ----------
   {p} = partner name. sev = true priority (1, 2 or 3).
   detail = what the sender says when the Cupid asks for more information. */
const INCIDENTS = [
  { cat: "tech", sev: 2, title: "Left on read", text: "I sent {p} a heart and they replied 'k'. Is this the end?", detail: "It's been 3 hours. The 'k' didn't even have a full stop. I keep refreshing the chat." },
  { cat: "tech", sev: 1, title: "Wrong group chat", text: "I sent my love poem to the WORK group chat. {p} is in that chat. So is my boss.", detail: "My boss reacted with a thumbs up. {p} hasn't said anything. My phone is face down and I'm scared of it." },
  { cat: "tech", sev: 3, title: "Typo of doom", text: "I meant to text {p} 'love you lots' and it autocorrected to 'love you, Lou'.", detail: "There is no Lou. I don't know a Lou. Now {p} wants to meet Lou." },
  { cat: "forgot", sev: 1, title: "Forgot the anniversary", text: "I forgot our anniversary. {p} is packing a bag RIGHT NOW.", detail: "The bag is small, so maybe it's just for one night? {p} also took the good pillow. That's bad, right?" },
  { cat: "forgot", sev: 3, title: "Wrong birthday", text: "I wished {p} happy birthday. It was not their birthday.", detail: "It's in four months. I even baked a cake. {p} ate the cake but is giving me a look." },
  { cat: "forgot", sev: 2, title: "Double booked", text: "I booked two dates on Friday. Same restaurant. Both with {p}. Different tables.", detail: "I think I panicked when booking. The waiter is confused and so am I." },
  { cat: "food", sev: 2, title: "Pizza betrayal", text: "{p} ate the last slice I was saving for movie night.", detail: "It had my name written on the box in marker. They say they 'didn't see it'. The marker is still on their hand." },
  { cat: "food", sev: 3, title: "Pineapple dispute", text: "{p} put pineapple on OUR shared pizza without asking.", detail: "We agreed on the rules. There were rules. I have them laminated." },
  { cat: "food", sev: 1, title: "Cooking disaster", text: "I cooked dinner to say sorry. The kitchen is now on fire (a little). {p} is NOT impressed.", detail: "The fire is out now. Mostly. {p} is eating cereal and not looking at me." },
  { cat: "jealous", sev: 2, title: "The houseplant", text: "{p} talks to the houseplant more than to me.", detail: "They named it Gerald. They tell Gerald about their day. Gerald gets watered daily. I don't." },
  { cat: "jealous", sev: 1, title: "Suspicious laughing", text: "{p} is laughing at their phone and won't show me why. I'm about to throw the phone in the lake.", detail: "There IS a lake right here. I'm standing next to it. They said it's a cat video but who laughs that much at cats?" },
  { cat: "jealous", sev: 3, title: "Dog is the favourite", text: "{p} greets the dog before me every single time.", detail: "The dog gets a little song. I get 'oh hey'. The dog doesn't even pay rent." },
  { cat: "talk", sev: 2, title: "The cold shoulder", text: "{p} says they're 'fine'. They are not fine.", detail: "They said 'fine' four times. With a full stop each time. I've asked what's wrong and they said 'nothing'." },
  { cat: "talk", sev: 3, title: "Movie spoiler", text: "I spoiled the ending of {p}'s favourite show by accident.", detail: "I said 'wow, I can't believe the dog was the villain'. They were on episode 2." },
  { cat: "talk", sev: 1, title: "Big fight", text: "{p} and I are shouting about whose turn it is. We don't even remember what it's about anymore.", detail: "Right now we're arguing about who started the argument. The neighbours are listening." },
  { cat: "home", sev: 3, title: "Spoon war", text: "We both want to be the little spoon. Neither of us will budge.", detail: "We've been lying back to back for 40 minutes. Nobody is spooning. It's very cold." },
  { cat: "home", sev: 2, title: "Blanket thief", text: "{p} steals the whole blanket every night. I am a frozen burrito-less human.", detail: "I bought a second blanket. They took that one too. They don't even wake up." },
  { cat: "home", sev: 1, title: "Moving-in meltdown", text: "{p} and I moved in together today and they threw out my lucky socks. I'm leaving.", detail: "The socks had holes but they were LUCKY. I wore them to every exam. They're in the outside bin now." }
];

/* ---------- request templates ----------
   fulfil: true  = a fair request, send it to the Psyche Squad to fulfil.
   fulfil: false = Cupids can't do this, so Decline it (reason is shown when declined). */
const REQUESTS = [
  { cat: "food", sev: 3, fulfil: true, title: "Cake delivery", text: "Can a Cupid deliver a cake to {p}? It's a sorry cake.", detail: "Chocolate, please. With 'sorry about the socks' written on it in icing." },
  { cat: "talk", sev: 3, fulfil: true, title: "Serenade booking", text: "I'd like to book a Cupid serenade under {p}'s window.", detail: "Saturday evening. Second floor. Please avoid the bush, it's spiky." },
  { cat: "forgot", sev: 2, fulfil: true, title: "Emergency flowers", text: "I need flowers for {p} by tonight. I forgot. Again.", detail: "Tulips are their favourite. Not roses. If you bring roses I'm done for." },
  { cat: "tech", sev: 3, fulfil: true, title: "Pigeon letter", text: "Please send a pigeon with my handwritten apology to {p}.", detail: "The letter is 7 pages. Is that too many pages for one pigeon?" },
  { cat: "jealous", sev: 2, fulfil: false, title: "Love potion", text: "Can you make my crush fall in love with me? Arrow, potion, whatever works.", detail: "Just a small arrow. A tiny one. They won't notice.", reason: "Cupids don't force feelings. Love has to be a choice. Declined." },
  { cat: "home", sev: 3, fulfil: false, title: "Partner order", text: "I need a girlfriend/boyfriend. Please send one by Friday.", detail: "Tall-ish. Likes pizza. Size medium. Gift wrapped.", reason: "Cupids can't create or deliver people. We only help hearts that already exist. Declined." },
  { cat: "talk", sev: 2, fulfil: false, title: "Erase my ex", text: "Please delete my ex from everyone's memory, including mine.", detail: "Especially the karaoke night. Nobody needs to remember the karaoke night.", reason: "Cupids can't edit memories. Try time and snacks instead. Declined." },
  { cat: "home", sev: 3, fulfil: false, title: "Clone request", text: "Can you clone {p}? One for weekdays, one for weekends.", detail: "The weekend one should like hiking. The current one does not like hiking.", reason: "No cloning. Cupid policy section 4, paragraph 'absolutely not'. Declined." }
];

/* ---------- replies the Cupid can send ----------
   Each category has replies that really help. Each turn you see a shuffled mix of:
   one reply that matches, one that doesn't, a generic one and a bad one. */
const REPLIES = {
  talk:    ["Ask them gently what's really bothering them.", "Suggest a 'no shouting, only whispering' talk.", "Try the classic: 'I hear you, and I'm sorry.'"],
  forgot:  ["Plan a surprise make-up day, properly this time.", "Set 14 phone reminders so it never happens again.", "Admit it. Own it. Bring a small gift."],
  food:    ["Propose a snack peace treaty.", "Order a replacement, with extra toppings.", "Cook together (with a fire blanket nearby)."],
  tech:    ["Put the phones down and talk face to face.", "Send a voice note. Tone matters.", "Explain the autocorrect with a funny screenshot."],
  jealous: ["Remind them they're your favourite. Out loud.", "Ask to see the cat video together.", "Plan a date with no phones, plants or dogs."],
  home:    ["Make a fair rota. Laminate it.", "Buy a bigger blanket. Or a smaller partner (joke).", "Agree on a rule together, then hug it out."]
};
const GENERIC = ["Take a deep breath. You've got this.", "Send a pigeon with a nice snack.", "Scatter rose petals (imaginary ones)."];
const BAD = ["Tell them to just ignore it.", "Recommend a VERY dramatic grand gesture.", "Have you tried turning the relationship off and on again?", "Reply 'k' and see how they like it."];

// how much each kind of reply changes Calm (random between min and max)
const EFFECT = { match: [18, 28], other: [-4, 6], generic: [4, 10], bad: [-16, -6] };

const SAYS_GOOD = ["Oh. That actually helps. Thank you.", "Okay... I feel a little better.", "Aww, that's sweet.", "You know what? You're right."];
const SAYS_MEH = ["Hmm. I'm not sure that did anything.", "...okay?", "I guess?"];
const SAYS_BAD = ["That made it WORSE!", "Why would you say that?", "I'm even more upset now.", "Are you even a real Cupid?"];

/* ---------- closing a LoveNote ---------- */
const CALM_TO_MEND = 75;   // full fix
const CALM_TO_PATCH = 45;  // temporary fix
const RESOLUTION = {
  mended:    { label: "Heart mended",          e: "💘", stars: 5 },
  patched:   { label: "Patched with snacks",   e: "🩹", stars: 3 },
  l2mended:  { label: "Mended by the Psyche Squad", e: "🦋", stars: 4 },
  fulfilled: { label: "Fulfilled by the Psyche Squad", e: "🎁", stars: 5 },
  declined:  { label: "Politely declined",     e: "🚫", stars: 4 },
  wrongdecline: { label: "Declined (oops)",    e: "😬", stars: 1 },
  broken:    { label: "Heartbroken",           e: "💔", stars: 1 },
  nightshift:     { label: "Handed to night shift", e: "🌙", stars: 3, special: true },
  pigeonAccepted: { label: "Pigeon contact made",   e: "🐦", stars: 3, special: true },
  pigeonRefused:  { label: "Pigeons refused",       e: "🙅", stars: 3, special: true },
  wingsaved:      { label: "Saved by a spare wing", e: "🪽", stars: 4 }
};
const POINTS = { wingsaved: 60, nightshift: 0, pigeonAccepted: 0, pigeonRefused: 0, mended: 100, patched: 50, l2mended: 45, fulfilled: 80, declined: 70, wrongdecline: -40, broken: -50, triageRight: 15, triageWrong: -10, perSecondLeft: 1 };

/* ---------- the Psyche Squad (automated backup team) ----------
   Named after Psyche, who (in the old myth) married Cupid and survived impossible tasks.
   In the code this team is still called "l2". Rename it here if you like. */
const L2_NAME = "Psyche Squad";
const L2_E = "🦋";
const L2_DELAY_SECONDS = 10;
const L2_SUCCESS = 0.8;
const L2_LINES = {
  start: "Psyche Squad here. We've got this one. You still own the LoveNote, we're just helping.",
  good: ["Calmed everyone down with a very large teddy bear. Heart mended!", "Did a fictional site visit. Brought soup. Everyone is hugging now.", "Ran a group breathing exercise. It worked. Mended."],
  bad: ["The pigeons stole the teddy bear. Heart broken. We apologise.", "I tripped over the spiky bush. It got awkward. Heart broken."],
  fulfilStart: "Psyche Squad here. Request received. On it!",
  fulfilled: ["Delivered! They cried happy tears.", "Done. The pigeon even did a little bow.", "Fulfilled. Nobody got hit by an arrow."]
};

/* ---------- desktop world (all fictional) ---------- */
const PIGEON_SECONDS = 4.5;   // how long a pigeon is flying across the screen (and can be tapped)
const PIGEON_TAPS = 4;        // taps to make a flying pigeon go poof
const TRASH_ITEMS = ["apology_final_FINAL_v3.txt", "broken_heart (2).png", "pigeon_complaints.doc", "unsent_poem_draft.txt", "laminated_pizza_rules.pdf"];

const DISCLAIMER = "Cupiddesk is a fictional parody game created for entertainment and humor. Its characters, scenarios, conversations, and resolutions are fictional and are not intended to provide real relationship, psychological, legal, medical, or professional advice. Do not use the game's fictional responses as guidance for real-world decisions.";
const INSPIRED = "Inspired by a day in the life of a service desk job and the general ITIL way of working. A parody made for fun, not a serious tool, and not affiliated with or connected to ServiceNow, Jira or any other product. No real screens are copied.";
