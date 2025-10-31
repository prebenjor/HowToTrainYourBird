import { PowerUpScheduler, DEFAULT_POWER_UP_EVENTS } from "../gameplay/events/powerups.js";

export const ACTIVITY_CATALOG = {
  forage: {
    name: "Foraging Run",
    description: "Baseline pecking for seeds to build fundamentals.",
    staminaCost: 1,
    tickPayout: 1,
    masteryThreshold: 100,
    masteryScale: 1.6,
    masteryBonus: 0.1,
    unlock: () => true,
    unlockDescription: "Available from the start.",
  },
  sprint: {
    name: "Wind Sprints",
    description: "High-intensity bursts that trade stamina for more gains.",
    staminaCost: 2,
    tickPayout: 1.5,
    masteryThreshold: 150,
    masteryScale: 1.55,
    masteryBonus: 0.12,
    unlock: (stats) => stats.levels.speed >= 5,
    unlockDescription: "Requires Speed level 5.",
  },
  weightlifting: {
    name: "Weight Training",
    description: "Slow, deliberate presses to maximize strength output.",
    staminaCost: 3,
    tickPayout: 2,
    masteryThreshold: 200,
    masteryScale: 1.5,
    masteryBonus: 0.15,
    unlock: (stats) => stats.levels.strength >= 10,
    unlockDescription: "Requires Strength level 10.",
  },
  aerialYoga: {
    name: "Aerial Yoga",
    description: "Graceful ribbon poses to boost recovery and flow.",
    staminaCost: 2,
    tickPayout: 1.75,
    masteryThreshold: 180,
    masteryScale: 1.52,
    masteryBonus: 0.12,
    unlock: (stats) => stats.levels.recovery >= 6,
    unlockDescription: "Requires Recovery level 6.",
  },
  proteinChug: {
    name: "Protein Chug",
    description: "Bulk up fast with questionable shake concoctions.",
    staminaCost: 4,
    tickPayout: 2.6,
    masteryThreshold: 240,
    masteryScale: 1.48,
    masteryBonus: 0.18,
    unlock: (stats) => stats.levels.strength >= 15 && stats.levels.stamina >= 10,
    unlockDescription: "Requires Strength 15 and Stamina 10.",
  },
  meteorSlam: {
    name: "Meteor Slam",
    description: "Defy gravity with planet-cracking elbow drops.",
    staminaCost: 6,
    tickPayout: 3.6,
    masteryThreshold: 320,
    masteryScale: 1.45,
    masteryBonus: 0.22,
    unlock: (stats) => stats.levels.speed >= 12 && stats.totalEggsLaid > 0,
    unlockDescription: "Requires Speed 12 and at least 1 prestige.",
  },
};

function getDefaultActivityKey() {
  const keys = Object.keys(ACTIVITY_CATALOG);
  return keys.length > 0 ? keys[0] : null;
}

export class TrainingSystem {
  constructor(
    stats,
    {
      onTick = () => {},
      onRestChange = () => {},
      onPowerUpActivated = () => {},
      powerUpConfig = {},
    } = {}
  ) {
    this.stats = stats;
    this.onTick = onTick;
    this.onRestChange = onRestChange;
    this.onPowerUpActivated = onPowerUpActivated;

    this.resting = false;
    this.tickAccumulator = 0;
    this.restAccumulator = 0;
    this.passiveAccumulator = 0;
    this.running = false;
    this.lastTimestamp = performance.now();

    const events = powerUpConfig.events ?? DEFAULT_POWER_UP_EVENTS;
    const schedulerOptions = {
      baseInterval: powerUpConfig.baseInterval,
      scoreInterval: powerUpConfig.scoreInterval,
      cooldownSeconds: powerUpConfig.cooldownSeconds,
      random: powerUpConfig.random,
    };
    this.powerUpScheduler = new PowerUpScheduler(events, schedulerOptions);
  }

  start() {
    if (this.running) {
      return;
    }
    this.running = true;
    this.lastTimestamp = performance.now();
    const loop = (timestamp) => {
      if (!this.running) {
        return;
      }
      this.update(timestamp);
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  stop() {
    this.running = false;
  }

  update(timestamp) {
    const deltaSeconds = (timestamp - this.lastTimestamp) / 1000;
    this.lastTimestamp = timestamp;

    this.stats.updatePowerUps(deltaSeconds);
    const scheduledEvent = this.powerUpScheduler.update(deltaSeconds, this.stats);
    if (scheduledEvent) {
      const activation = scheduledEvent.createActivation();
      const result = this.stats.activatePowerUp(activation);
      if (result.applied) {
        this.onPowerUpActivated(result);
      }
    }

    const ticksPerSecond = this.stats.getTicksPerSecond();
    this.tickAccumulator += deltaSeconds * ticksPerSecond;

    const passiveRate = this.stats.getPassiveStaminaRegen();
    this.passiveAccumulator += deltaSeconds * passiveRate;

    let activityKey = this.stats.getSelectedActivity();
    if (!activityKey || !ACTIVITY_CATALOG[activityKey]) {
      activityKey = getDefaultActivityKey();
      if (activityKey) {
        this.stats.setSelectedActivity(activityKey);
      }
    }

    const staminaCost = this.stats.getStaminaCostForActivity(activityKey);

    if (!this.resting) {
      while (this.tickAccumulator >= 1) {
        if (this.stats.consumeStamina(staminaCost)) {
          const tickResult = this.stats.getActivityPayout(activityKey);
          this.stats.recordTrainingAction({ activityKey, count: 1 });
          if (tickResult.gains > 0) {
            this.stats.addGains(tickResult.gains);
          }
          this.onTick({
            gains: tickResult.gains,
            multiplier: tickResult.multiplier,
            stamina: this.stats.stamina,
            activity: activityKey,
          });
          this.tickAccumulator -= 1;
        } else {
          this.resting = true;
          this.onRestChange(true);
          this.tickAccumulator = 0;
          break;
        }
      }
    }

    if (this.resting) {
      const restRate = this.stats.getRestRatePerSecond();
      this.restAccumulator += deltaSeconds * restRate;

      while (this.restAccumulator >= 1 && this.stats.stamina < this.stats.getMaxStamina()) {
        this.stats.restoreStamina(1);
        this.restAccumulator -= 1;
      }

      if (this.stats.stamina >= this.stats.getMaxStamina()) {
        this.resting = false;
        this.onRestChange(false);
      }
    }

    while (this.passiveAccumulator >= 1) {
      this.stats.restoreStamina(1);
      this.passiveAccumulator -= 1;
    }

    if (!this.resting && this.stats.stamina >= this.stats.getMaxStamina()) {
      this.stats.stamina = this.stats.getMaxStamina();
    }
  }
}
