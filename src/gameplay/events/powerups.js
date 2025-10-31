import { weightedRandomChoice } from "./random.js";

function clone(value) {
  if (typeof structuredClone === "function") {
    return structuredClone(value);
  }
  return JSON.parse(JSON.stringify(value));
}

function normalizeStacking(stacking) {
  const defaults = {
    mode: "refresh",
    maxStacks: 1,
    refreshOnStack: true,
  };
  if (!stacking) {
    return { ...defaults };
  }
  return {
    ...defaults,
    ...stacking,
  };
}

export class PowerUpEvent {
  constructor({
    id,
    name,
    description,
    durationSeconds,
    effect = {},
    presentation = {},
    weight = 1,
    minElapsedSeconds = 0,
    minRunGains = 0,
    condition = null,
    stacking,
  }) {
    if (!id) {
      throw new Error("PowerUpEvent requires an id");
    }
    this.id = id;
    this.name = name ?? id;
    this.description = description ?? "";
    this.durationSeconds = Math.max(0, durationSeconds ?? 0);
    this.effect = effect;
    this.presentation = presentation;
    this.weight = weight;
    this.minElapsedSeconds = Math.max(0, minElapsedSeconds);
    this.minRunGains = Math.max(0, minRunGains);
    this.condition = typeof condition === "function" ? condition : null;
    this.stacking = normalizeStacking(stacking);
  }

  canTrigger(stats, elapsedSeconds) {
    if (elapsedSeconds < this.minElapsedSeconds) {
      return false;
    }
    const runGains = stats?.runGains ?? 0;
    if (runGains < this.minRunGains) {
      return false;
    }
    if (this.condition && !this.condition(stats, elapsedSeconds)) {
      return false;
    }
    return true;
  }

  createActivation() {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      durationSeconds: this.durationSeconds,
      effect: clone(this.effect ?? {}),
      presentation: clone(this.presentation ?? {}),
      stacking: normalizeStacking(this.stacking),
    };
  }
}

export class PowerUpScheduler {
  constructor(
    events = [],
    {
      random = Math.random,
      baseInterval = 75,
      scoreInterval = 600,
      cooldownSeconds = 5,
    } = {}
  ) {
    this.events = Array.from(events);
    this.random = typeof random === "function" ? random : Math.random;
    const resolvedBaseInterval = Number.isFinite(baseInterval) ? baseInterval : 75;
    const resolvedScoreInterval = Number.isFinite(scoreInterval) ? scoreInterval : 600;
    const resolvedCooldown = Number.isFinite(cooldownSeconds) ? cooldownSeconds : 5;
    this.baseInterval = Math.max(1, resolvedBaseInterval);
    this.scoreInterval = Math.max(1, resolvedScoreInterval);
    this.cooldownSeconds = Math.max(0, resolvedCooldown);
    this.elapsedSeconds = 0;
    this.timeSinceLastEvent = this.cooldownSeconds;
    this.scoreSinceLastEvent = 0;
    this.lastRunGains = 0;
  }

  update(deltaSeconds, stats) {
    const safeDelta = Number.isFinite(deltaSeconds) ? Math.max(0, deltaSeconds) : 0;
    this.elapsedSeconds += safeDelta;
    this.timeSinceLastEvent += safeDelta;

    const currentRunGains = stats?.runGains ?? 0;
    if (Number.isFinite(currentRunGains)) {
      const previousRunGains = this.lastRunGains;
      if (currentRunGains < this.lastRunGains) {
        this.lastRunGains = currentRunGains;
      }
      const gainDelta = Math.max(0, currentRunGains - previousRunGains);
      if (gainDelta > 0) {
        this.scoreSinceLastEvent += gainDelta;
      }
      this.lastRunGains = currentRunGains;
    }

    if (this.timeSinceLastEvent < this.baseInterval && this.scoreSinceLastEvent < this.scoreInterval) {
      return null;
    }

    const eligible = this.events.filter((event) => event.canTrigger(stats, this.elapsedSeconds));
    if (eligible.length === 0) {
      return null;
    }

    const selected = weightedRandomChoice(eligible, this.random);
    if (!selected) {
      return null;
    }

    this.timeSinceLastEvent = 0;
    this.scoreSinceLastEvent = 0;
    return selected;
  }
}

export const DEFAULT_POWER_UP_EVENTS = [
  new PowerUpEvent({
    id: "gain_rush",
    name: "Gain Rush",
    description: "Gains increase dramatically for a short burst.",
    durationSeconds: 20,
    effect: { gainMultiplier: 1.5 },
    presentation: { icon: "🔥", color: "#ff7043" },
    weight: 3,
    minElapsedSeconds: 30,
    minRunGains: 120,
  }),
  new PowerUpEvent({
    id: "second_wind",
    name: "Second Wind",
    description: "Recover faster and spend less stamina per action.",
    durationSeconds: 25,
    effect: { restRateMultiplier: 1.6, staminaCostMultiplier: 0.8 },
    presentation: { icon: "💨", color: "#4fc3f7" },
    weight: 2,
    minElapsedSeconds: 60,
    minRunGains: 300,
  }),
  new PowerUpEvent({
    id: "zen_focus",
    name: "Zen Focus",
    description: "Stackable focus boosts training cadence and gains.",
    durationSeconds: 15,
    effect: { tickRateMultiplier: 1.12, gainMultiplier: 1.1 },
    presentation: { icon: "🌀", color: "#9575cd" },
    weight: 1,
    minElapsedSeconds: 120,
    minRunGains: 800,
    stacking: { mode: "stack", maxStacks: 3, refreshOnStack: true },
  }),
];
