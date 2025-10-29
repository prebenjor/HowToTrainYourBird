# How to Train Your Bird

Prototype browser idle game inspired by gym culture and avian absurdity.

## Getting started

Open `src/index.html` in a modern browser to run the prototype. All logic is implemented with ES Modules, so the files must be served from an HTTP server. For local development you can run:

```bash
npx http-server src
```

## Features

- Automatic training loop that balances stamina usage and rest recovery.
- Upgrade lab for Strength, Stamina, Recovery, and Speed with exponential cost scaling.
- Prestige hatchery that awards eggs and permanent bonuses.
- Gamble side activity "The Pounder" with multiple risk/reward multipliers.
- Simple UI panels that surface key metrics like Gains/hour, size, and cycle timings.

## Roadmap

Refer to `docs/GameDesignDocument.md` (coming soon) for the full vision, feature breakdowns, and balancing notes.
