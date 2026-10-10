# Cupiddesk

A fictional parody game where relationship problems arrive as LoveNotes and a Cupid has to calm everyone down before their Heartbreak Timer runs out.

> **Parody notice:** Cupiddesk is a fictional parody game created for entertainment and humor. Its characters, scenarios, conversations, and resolutions are fictional and are not intended to provide real relationship, psychological, legal, medical, or professional advice. Do not use the game's fictional responses as guidance for real-world decisions. Cupiddesk is not affiliated with, endorsed by, or connected to any software company or product. It only borrows the general idea of a service desk workflow for comedy.

> **AI disclosure:** The code of this game was made with the help of generative AI.

## Run it

1. Unzip and open the folder in VS Code.
2. Double-click `index.html`, or use the "Live Server" extension and click "Go Live".

No install or build step. Everything is saved only in your browser (localStorage). Nothing is sent anywhere.

## How to play

1. Pick a LoveNote from the list (the fictional "Cupid OS" desktop).
2. Press **Pick up LoveNote**. The Heartbreak Timer starts.
3. Send quick replies to raise the person's **Calm**. Some replies are risky and can make things worse.
4. When Calm reaches 70%, press **Mend the heart**.
5. If the timer runs out, the heart breaks.

You can also open the **Send a LoveNote** tab, write your own silly (fictional) problem, and a pigeon delivers it to the desk.

## Built so far (build order steps 1 to 8)

1. Fictional computer and browser
2. Cupiddesk app
3. LoveNote submission page
4. LoveNote generation and arrival
5. LoveNote list
6. LoveNote selection
7. Chat-style conversation
8. Heartbreak Timer

## Next (steps 9 to 15)

Cupid L1 behaviour, automated Cupid L2 escalation, LovePending and LoveEscalated states, pie-chart status display, pigeon delivery visuals, optional configuration or service elements, story events and more comedy.

## Files

- `index.html` page shell
- `css/styles.css` pink theme (dark mode supported)
- `js/data.js` LoveNote scenarios, replies, timer settings, disclaimer text
- `js/game.js` game logic and saved state
- `js/ui.js` screens and interactions
- `CREDITS.md` credits and licenses
