# Number Game

A polished multiplayer Number Game built with React, Vite, Tailwind CSS v4, and Lucide icons. The app uses a glossy glassmorphism interface, a scalable home page for future games, and a turn-based card-and-grid ruleset designed for desktop, iPad, and mobile screens.

## Features

- Home page designed as a game hub so more games can be added later.
- Responsive game layout with the deck at the top and the player panel pinned on the right on larger screens.
- 10x10 numbered board from 1 to 100.
- Alphabetically sorted multiplayer scoreboard with active-turn highlighting.
- Historical undo support for the last 5 draw actions.
- In-app How to Play modal.
- Winner modal with confetti celebration.
- Animated deck draw and card reveal experience.

## Deck Composition

The deck contains 125 total cards:

- 100 number cards: 1 through 100
- 10 special `+1` cards
- 10 special `+2` cards
- 3 special `+3` cards
- 2 special `+5` cards

Every draw removes exactly one card from the deck for the remainder of the game.

## How To Play

### Setup

- Add between 2 and 30 players.
- Every player must have a unique name and unique color.
- Players are sorted alphabetically, and turn order follows that sorted list.

### Turn Rules

- The active player clicks the Cards Deck to draw one card.
- A normal number card claims the matching board cell in that player's color and gives that player 1 point.
- A `+1` card gives the player 1 point and 1 extra consecutive turn.
- A `+2` card gives the player 1 point and 2 extra consecutive turns.
- A `+3` card gives the player 1 point and 3 extra consecutive turns.
- A `+5` card gives the player 1 point and 5 extra consecutive turns.
- After bonus turns are exhausted, play passes to the next player alphabetically.

### Shuffle Rules

- Shuffle is allowed only before the first draw of the game.
- After the game starts, shuffle is disabled.

### Undo Rules

- Undo steps back exactly one draw action at a time.
- It restores the deck, card reveal, score, board claim, active player, and remaining bonus-turn state.
- Up to 5 previous actions are stored in history.

### Winning

- The game ends when all 125 cards are drawn or the board is fully claimed.
- The player with the highest score wins.
- If players are tied for highest score, the game shows a tie result.

## Local Development

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Run linting:

```bash
npm run lint
```

Create a production build:

```bash
npm run build
```
