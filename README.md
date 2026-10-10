# Cupiddesk

A fictional parody game. You switch on a pretend PC, open the Cupiddesk app, and handle relationship problems that arrive as LoveNotes before their Heartbreak Timers run out.

> **Parody notice:** Cupiddesk is a fictional parody game created for entertainment and humor. Its characters, scenarios, conversations, and resolutions are fictional and are not intended to provide real relationship, psychological, legal, medical, or professional advice. Do not use the game's fictional responses as guidance for real-world decisions. Cupiddesk is not affiliated with, endorsed by, or connected to any software company or product. It only borrows the general idea of a service desk workflow for comedy.

> **AI disclosure:** The code of this game was made with the help of generative AI.

## Run it

1. Unzip and open the folder in VS Code.
2. Double-click `index.html`, or use the "Live Server" extension and click "Go Live".

No install or build step. Everything is saved only in your browser (localStorage). Nothing is sent anywhere.

## What's on the desktop

- **Cupiddesk**: opens the app window. Create a nickname and choose **Cupid** or **customer** (you can switch roles any time).
  - *Cupid*: pick up a LoveNote, start the Heartbreak Timer, send quick replies to raise Calm, then **Mend the heart**, or **Escalate to Cupid L2** (automated, finishes by itself).
  - *Customer*: send your own silly LoveNote with a pigeon, then chat with the bot Cupid who picks it up.
- **Heart status**: a pie chart window that pops up on the side for Cupids (New, LovePending, LoveEscalated).
- **Browser**: a pretend search page with silly headlines.
- **Mailbox**: story mails pop up over time ("Senior Cupid" and others).
- **Trash**: just for fun.
- **About**: disclaimer, AI disclosure, and a button to clear game data.

Windows can be dragged by their title bars.

## Writing your own story mails

Open `js/data.js` and find `MAILS`. Replace the `[PLACEHOLDER]` text with your own plot. Each mail has:

- `after`: seconds from the start of a play session before it pops up
- `from`, `subject`, `body`: what the player reads

Add as many as you like. Each mail is delivered only once per save.

## Tweak the game

All in `js/data.js`: LoveNote scenarios, quick replies and how they affect Calm, timer length, L2 delay, bot lines, headlines, trash items.

## Files

- `index.html` page shell
- `css/styles.css` pink theme (dark mode supported)
- `js/data.js` all the writing and settings
- `js/game.js` game logic and saved state
- `js/ui.js` desktop, windows and screens
- `CREDITS.md` credits and licenses

## Next ideas

Pigeon delivery visuals, story events tied to mail, more scenarios, sound, configuration/service elements only if they add comedy.
