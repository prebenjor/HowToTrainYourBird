# How to Train Your Bird – Game Design Document (v2.0)

> **Genre:** Idle / Incremental simulation  \
> **Platform:** Browser (desktop & mobile)  \
> **Monetization:** Free-to-play (cosmetics or optional ad-based boosts later)  \
> **Tone:** Absurdly humorous parody of fitness and bodybuilding culture

## 1. Overview

You are a bird determined to become the strongest creature alive. Train automatically using your stats — Strength, Stamina, Recovery, and Speed — to grow your Gains and Size. Prestige by laying Eggs to hatch a new generation of birds with permanent stat multipliers.

## 2. Core Loop

1. **Train** – Your bird automatically performs workouts at a rate based on Speed and Stamina.
2. **Earn Gains** – Each training tick grants Gains, scaled by Strength.
3. **Rest** – Once Stamina depletes, your bird rests to recover it based on Recovery stat.
4. **Upgrade** – Use Gains to increase stats.
5. **Prestige** – Lay Eggs to reset and gain permanent multipliers.
6. **(Optional) Gamble** – Risk a portion of your Gains to potentially multiply them.

## 3. Core Stats

| Stat | Function | Description |
| --- | --- | --- |
| Strength | Power per tick | Increases the amount of Gains earned each training action |
| Stamina | Endurance | Determines how many training actions occur before rest |
| Recovery | Rest speed | Determines how quickly stamina refills |
| Speed | Action rate | Reduces the time between each tick or training action |

## 4. Progression System

### Gains

- Primary currency.
- Earned passively based on Strength, Speed, and Stamina.
- Used to purchase upgrades for all stats.

Example:

```
Gains per tick = Base_Gain * Strength
Ticks per second = 1 + (Speed / 10)
Total_Gains_per_hour = Gains_per_tick * (Ticks_per_second * Stamina / RestCycleTime)
```

### Size

- Cosmetic + milestone metric representing total physical growth.
- Increases logarithmically with total Gains earned.
- Unlocks background/environment changes.

Example:

```
Size (cm) = 10 + log10(Total_Gains) * 10
```

### Eggs (Prestige Currency)

- Earned by “laying an egg” (prestige reset).

Formula:

```
Eggs = floor((Total_Gains / 1,000,000) ^ 0.7)
```

- Used to buy permanent stat multipliers and special cosmetics.

Example upgrades:

- +5% base Gains per tick
- +10% recovery speed
- +1 passive stamina regen

## 5. Systems Breakdown

### 5.1 Training System

Automatic system — no clicking.

- Every tick consumes stamina.
- Each tick yields a fixed amount of Gains.
- Once stamina hits 0, bird rests.

Tick Logic:

```javascript
if (stamina > 0) {
    stamina--;
    gains += strength * gainMultiplier;
} else {
    restTimer += recovery * recoveryRate;
    if (restTimer >= staminaMax) {
        stamina = staminaMax;
        restTimer = 0;
    }
}
```

### 5.2 Upgrades System

- Players spend Gains to improve stats.
- Each stat uses an exponential cost curve.

| Stat | Base Cost | Cost Growth | Example Effect |
| --- | --- | --- | --- |
| Strength | 100 | ×1.12 | +1 power per tick |
| Stamina | 250 | ×1.10 | +1 stamina capacity |
| Recovery | 500 | ×1.14 | +2% recovery rate |
| Speed | 1000 | ×1.16 | +0.05 ticks/sec |

Upgrade Formula:

```
Next_Cost = Base_Cost * (Cost_Growth ^ Level)
```

### 5.3 Resting Mechanic

- Rest triggers automatically when stamina reaches 0.
- Rest progress depends on Recovery.
- Faster recovery → less downtime, higher effective Gains/hour.

### 5.4 Gambling System (“The Pounder”)

A fun, risk-based side activity that adds excitement.

Mechanics:

- Player selects a multiplier (x2, x5, x20, x100).
- Stakes a chosen amount of Gains.
- The system rolls a success chance based on the multiplier.
- Win = Gains × multiplier, Lose = Gains lost.

Example Success Chances:

| Multiplier | Success % | Outcome |
| --- | --- | --- |
| ×2 | 50% | Double or lose all |
| ×5 | 20% | Quintuple or lose all |
| ×20 | 5% | Rare |
| ×100 | 1% | Legendary luck |

Formula:

```javascript
const roll = Math.random() * 100;
if (roll < successChance) gains += stake * (multiplier - 1);
else gains -= stake;
```

## 6. Player Growth & Meta Loop

- Start with low stats (e.g., Strength 1, Stamina 10, Recovery 1, Speed 1).
- Gains grow exponentially as stats increase.
- The balance between Stamina and Recovery becomes a strategy:
  - High Stamina = longer training sessions.
  - High Recovery = less downtime.
- Strength and Speed create power vs tempo tradeoffs.
- Prestige (Eggs) resets progress but adds compounding permanent boosts.

## 7. Achievements

| Achievement | Requirement | Reward |
| --- | --- | --- |
| “First Flex” | Reach 1,000 Gains | +5% Strength |
| “No Rest Days” | Train 10,000 times | +5% Stamina |
| “Eggcelent” | Lay first Egg | Unlock cosmetic |
| “Fast Feathers” | Reach Speed 10 | +10% Gains/hour |
| “Iron Beak” | Win ×100 gamble | Unique trophy |

## 8. Art & Style Direction

- **Theme:** Cartoonish minimalism — clear outlines, expressive characters.
- **Tone:** Goofy and motivating — half gym bro, half comedy sketch.

Style References:

- The game you provided screenshots from (flat vector + humor)
- Soft pastel color palette (blue backgrounds, warm highlights)
- Exaggerated physiques, expressive animations

UI Design:

- Rounded boxes for stats (like in the screenshots).
- Large, satisfying text for Gains/hour and multipliers.
- Smooth transitions and animated bars for stamina and rest.

## 9. Audio & Feedback

| Type | Example |
| --- | --- |
| Training Loop | Dumbbell clinks, faint “hup!” sounds |
| Resting | Calm breathing / snoring |
| Upgrades | Ding or “power-up” sound |
| Gamble | Arcade punch + cheer/boo |
| Ambient | Light gym music with occasional motivational quotes |

## 10. Formulas Summary

| Mechanic | Formula |
| --- | --- |
| Gains per tick | Base * Strength |
| Ticks per second | 1 + (Speed / 10) |
| Stamina capacity | Base + Stamina |
| Rest rate | Recovery * 0.5 per second |
| Eggs (prestige) | floor((Total_Gains / 1,000,000) ^ 0.7) |
| Upgrade cost | Base * (Growth ^ Level) |

## 11. File / Code Structure

```
/src
  index.html
  main.js
  /systems
    stats.js
    training.js
    rest.js
    gamble.js
    prestige.js
  /ui
    StatsPanel.js
    GambleModal.js
    UpgradeMenu.js
  /assets
    /images (bird, gym, icons)
    /sounds (click, ding, gym)
```

## 12. Development Roadmap

| Phase | Focus | Deliverables |
| --- | --- | --- |
| Phase 1 | Core Loop | Auto-training, stamina, recovery, UI bars |
| Phase 2 | Upgrades | Upgrade menu, scaling, balancing |
| Phase 3 | Gamble | Functional “Pounder” mini-game |
| Phase 4 | Prestige | Egg system + stat multipliers |
| Phase 5 | Cosmetics | Visual size changes, skins, animations |
| Phase 6 | Events & Leaderboards | Optional |

## 13. Example Pseudocode

```javascript
let stats = {
  strength: 1,
  stamina: 50,
  recovery: 1,
  speed: 1,
  staminaMax: 50,
  gains: 0,
  resting: false
};

function tick() {
  if (!stats.resting) {
    if (stats.stamina > 0) {
      stats.gains += stats.strength * gainMultiplier;
      stats.stamina--;
    } else {
      stats.resting = true;
    }
  } else {
    stats.stamina += stats.recovery;
    if (stats.stamina >= stats.staminaMax) stats.resting = false;
  }
}


setInterval(tick, 1000 / (1 + stats.speed / 10));
```

## 14. Vision Summary

**Core Pillars:**

- Comedic and charming idle growth
- Zero stress: everything runs automatically
- Strong feedback loop (growth, rest, rebirth)
- Mix of serious gym stats and absurd bird humor
