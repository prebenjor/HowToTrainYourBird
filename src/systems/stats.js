import { ACTIVITY_CATALOG } from "./training.js";

const BASE_GAIN = 1;

const STAT_CONFIG = {
  strength: {
    baseCost: 100,
    growth: 1.12,
    description: "+1 power per tick",
  },
  stamina: {
    baseCost: 250,
    growth: 1.1,
    description: "+1 stamina capacity",
  },
  recovery: {
    baseCost: 500,
    growth: 1.14,
    description: "+2% recovery rate",
  },
  speed: {
    baseCost: 1000,
    growth: 1.16,
    description: "+0.05 ticks/sec",
  },
};

const EGG_UPGRADES = {
  baseGain: {
    label: "+5% base Gains per tick",
    cost: 1,
    apply: (stats) => {
      stats.multipliers.gain *= 1.05;
    },
  },
  recoveryBoost: {
    label: "+10% recovery speed",
    cost: 1,
    apply: (stats) => {
      stats.multipliers.recovery *= 1.1;
    },
  },
  passiveStamina: {
    label: "+1 passive stamina regen",
    cost: 2,
    apply: (stats) => {
      stats.passiveStaminaRegen += 1;
    },
  },
};

export class Stats {
  constructor() {
    this.levels = {
      strength: 0,
      stamina: 0,
      recovery: 0,
      speed: 0,
    };

    this.gains = 0;
    this.totalGains = 0;
    this.runGains = 0;
    this.eggs = 0;
    this.spentEggs = 0;

    this.trainingActions = 0;
    this.totalEggsLaid = 0;

    this.multipliers = {
      gain: 1,
      recovery: 1,
      strength: 1,
      stamina: 1,
      speed: 1,
    };

    this.passiveStaminaRegen = 0;
    this.stamina = this.getMaxStamina();
    this.cosmetics = new Set();

    this.activePowerUps = [];
    this.powerUpModifiers = {
      gainMultiplier: 1,
      restRateMultiplier: 1,
      staminaCostMultiplier: 1,
      tickRateMultiplier: 1,
      flatGains: 0,
    };

    this.activityMastery = {};
    Object.keys(ACTIVITY_CATALOG).forEach((key) => {
      this.activityMastery[key] = { level: 0, progress: 0 };
    });
    const defaultActivity = Object.keys(ACTIVITY_CATALOG)[0] || null;
    this.selectedActivity = defaultActivity;
  }

  static get STAT_CONFIG() {
    return STAT_CONFIG;
  }

  static get EGG_UPGRADES() {
    return EGG_UPGRADES;
  }

  resetForPrestige() {
    this.levels = {
      strength: 0,
      stamina: 0,
      recovery: 0,
      speed: 0,
    };
    this.gains = 0;
    this.runGains = 0;
    this.stamina = this.getMaxStamina();
    this.clearPowerUps();
    Object.keys(this.activityMastery).forEach((key) => {
      this.activityMastery[key] = { level: 0, progress: 0 };
    });
    this.selectedActivity = Object.keys(ACTIVITY_CATALOG)[0] || this.selectedActivity;
  }

  getStrengthValue() {
    return (1 + this.levels.strength) * this.multipliers.strength;
  }

  getStaminaCapacity() {
    return Math.round((10 + this.levels.stamina) * this.multipliers.stamina);
  }

  getRecoveryValue() {
    return (1 + this.levels.recovery * 0.02) * this.multipliers.recovery;
  }

  getSpeedValue() {
    return (1 + this.levels.speed * 0.5) * this.multipliers.speed;
  }

  getGainsPerTick() {
    const base = BASE_GAIN * this.getStrengthValue() * this.multipliers.gain;
    const modifiers = this.powerUpModifiers ?? {};
    const multiplier = modifiers.gainMultiplier ?? 1;
    const flatBonus = modifiers.flatGains ?? 0;
    return base * multiplier + flatBonus;
  }

  getActivityCatalog() {
    return ACTIVITY_CATALOG;
  }

  getSelectedActivity() {
    if (this.selectedActivity && ACTIVITY_CATALOG[this.selectedActivity]) {
      return this.selectedActivity;
    }
    const fallback = Object.keys(ACTIVITY_CATALOG)[0] || null;
    this.selectedActivity = fallback;
    return this.selectedActivity;
  }

  setSelectedActivity(key) {
    if (!ACTIVITY_CATALOG[key]) {
      return false;
    }
    if (!this.isActivityUnlocked(key)) {
      return false;
    }
    this.selectedActivity = key;
    return true;
  }

  isActivityUnlocked(key) {
    const activity = ACTIVITY_CATALOG[key];
    if (!activity) {
      return false;
    }
    if (typeof activity.unlock === "function") {
      return activity.unlock(this);
    }
    return true;
  }

  getActivityMastery(key) {
    if (!this.activityMastery[key]) {
      this.activityMastery[key] = { level: 0, progress: 0 };
    }
    return this.activityMastery[key];
  }

  getActivityMasteryThreshold(key) {
    const activity = ACTIVITY_CATALOG[key];
    const mastery = this.getActivityMastery(key);
    if (!activity) {
      return Infinity;
    }
    const base = activity.masteryThreshold ?? 100;
    const scale = activity.masteryScale ?? 1.5;
    return Math.floor(base * Math.pow(scale, mastery.level));
  }

  getActivityPayoutMultiplier(key) {
    const activity = ACTIVITY_CATALOG[key];
    if (!activity) {
      return 1;
    }
    const mastery = this.getActivityMastery(key);
    const masteryBonus = activity.masteryBonus ?? 0;
    return activity.tickPayout * (1 + mastery.level * masteryBonus);
  }

  getActivityBonusPercent(key) {
    const activity = ACTIVITY_CATALOG[key];
    if (!activity) {
      return 0;
    }
    const multiplier = this.getActivityPayoutMultiplier(key);
    if (!activity.tickPayout) {
      return 0;
    }
    return (multiplier / activity.tickPayout - 1) * 100;
  }

  getActivityGainsPerTick(key = this.getSelectedActivity()) {
    return this.getGainsPerTick() * this.getActivityPayoutMultiplier(key);
  }

  getActivityPayout(key = this.getSelectedActivity()) {
    return {
      gains: this.getActivityGainsPerTick(key),
      multiplier: this.getActivityPayoutMultiplier(key),
    };
  }

  getStaminaCostForActivity(key = this.getSelectedActivity()) {
    const activity = ACTIVITY_CATALOG[key];
    const base = activity ? activity.staminaCost : 1;
    const multiplier = this.powerUpModifiers?.staminaCostMultiplier ?? 1;
    return Math.max(0, base * multiplier);
  }

  getActivitySnapshots() {
    return Object.entries(ACTIVITY_CATALOG).map(([key, activity]) => {
      const mastery = this.getActivityMastery(key);
      const threshold = this.getActivityMasteryThreshold(key);
      return {
        key,
        name: activity.name,
        description: activity.description,
        staminaCost: activity.staminaCost,
        basePayout: activity.tickPayout,
        payoutMultiplier: this.getActivityPayoutMultiplier(key),
        bonusPercent: this.getActivityBonusPercent(key),
        level: mastery.level,
        progress: mastery.progress,
        threshold,
        unlocked: this.isActivityUnlocked(key),
        selected: this.getSelectedActivity() === key,
        unlockDescription: activity.unlockDescription,
      };
    });
  }

  getTicksPerSecond() {
    const base = 1 + this.getSpeedValue() / 10;
    return base * (this.powerUpModifiers?.tickRateMultiplier ?? 1);
  }

  getRestRatePerSecond() {
    const base = this.getRecoveryValue() * 0.5;
    return base * (this.powerUpModifiers?.restRateMultiplier ?? 1);
  }

  getMaxStamina() {
    return this.getStaminaCapacity();
  }

  getSize() {
    if (this.totalGains <= 0) {
      return 10;
    }
    return 10 + Math.log10(this.totalGains) * 10;
  }

  getStatCost(stat) {
    const config = STAT_CONFIG[stat];
    const level = this.levels[stat];
    return Math.floor(config.baseCost * Math.pow(config.growth, level));
  }

  canAfford(cost) {
    return this.gains >= cost;
  }

  purchaseStat(stat) {
    const cost = this.getStatCost(stat);
    if (!this.canAfford(cost)) {
      return false;
    }
    this.gains -= cost;
    this.levels[stat] += 1;
    if (stat === "stamina") {
      this.stamina = Math.min(this.stamina + 1, this.getMaxStamina());
    }
    return true;
  }

  addGains(amount) {
    this.gains += amount;
    this.totalGains += amount;
    this.runGains += amount;
  }

  spendGains(amount) {
    if (amount > this.gains) {
      return false;
    }
    this.gains -= amount;
    return true;
  }

  spendEggs(amount) {
    if (amount > this.eggs) {
      return false;
    }
    this.eggs -= amount;
    this.spentEggs += amount;
    return true;
  }

  applyEggUpgrade(key) {
    const upgrade = EGG_UPGRADES[key];
    if (!upgrade) {
      return false;
    }
    if (!this.spendEggs(upgrade.cost)) {
      return false;
    }
    upgrade.apply(this);
    return true;
  }

  getPowerUpModifiers() {
    return { ...this.powerUpModifiers };
  }

  getActivePowerUps() {
    return this.activePowerUps.map((entry) => ({
      id: entry.id,
      name: entry.name,
      description: entry.description,
      remaining: entry.remaining,
      stacks: entry.stacks,
      effect: { ...entry.effect },
      presentation: { ...entry.presentation },
    }));
  }

  clearPowerUps() {
    this.activePowerUps = [];
    this.recalculatePowerUpModifiers();
  }

  recalculatePowerUpModifiers() {
    const modifiers = {
      gainMultiplier: 1,
      restRateMultiplier: 1,
      staminaCostMultiplier: 1,
      tickRateMultiplier: 1,
      flatGains: 0,
    };
    this.activePowerUps = this.activePowerUps.filter((entry) => entry.remaining > 0);
    for (const entry of this.activePowerUps) {
      const stacks = Math.max(1, entry.stacks ?? 1);
      const effect = entry.effect ?? {};
      if (effect.gainMultiplier != null) {
        modifiers.gainMultiplier *= Math.pow(effect.gainMultiplier, stacks);
      }
      if (effect.restRateMultiplier != null) {
        modifiers.restRateMultiplier *= Math.pow(effect.restRateMultiplier, stacks);
      }
      if (effect.staminaCostMultiplier != null) {
        modifiers.staminaCostMultiplier *= Math.pow(effect.staminaCostMultiplier, stacks);
      }
      if (effect.tickRateMultiplier != null) {
        modifiers.tickRateMultiplier *= Math.pow(effect.tickRateMultiplier, stacks);
      }
      if (effect.flatGains != null) {
        modifiers.flatGains += effect.flatGains * stacks;
      }
    }
    this.powerUpModifiers = modifiers;
  }

  activatePowerUp(activation) {
    if (!activation) {
      return { applied: false, reason: "invalid" };
    }
    const stacking = {
      mode: "refresh",
      maxStacks: 1,
      refreshOnStack: true,
      ...activation.stacking,
    };
    const existingIndex = this.activePowerUps.findIndex((entry) => entry.id === activation.id);
    let resultType = "new";
    let entry;

    if (existingIndex >= 0) {
      entry = this.activePowerUps[existingIndex];
      if (stacking.mode === "ignore") {
        return { applied: false, reason: "ignored", activation };
      }
      if (stacking.mode === "stack") {
        const maxStacks = stacking.maxStacks ?? Number.POSITIVE_INFINITY;
        if ((entry.stacks ?? 1) < maxStacks) {
          entry.stacks = (entry.stacks ?? 1) + 1;
          resultType = "stacked";
        } else {
          resultType = "refreshed";
        }
        if (stacking.refreshOnStack !== false) {
          entry.remaining = Math.max(entry.remaining ?? 0, activation.durationSeconds ?? 0);
        }
      } else {
        entry.remaining = activation.durationSeconds ?? entry.remaining;
        resultType = "refreshed";
      }
    } else {
      entry = {
        id: activation.id,
        name: activation.name,
        description: activation.description,
        remaining: activation.durationSeconds ?? 0,
        effect: activation.effect ?? {},
        presentation: activation.presentation ?? {},
        stacks: 1,
      };
      this.activePowerUps.push(entry);
    }

    this.recalculatePowerUpModifiers();

    return {
      applied: true,
      type: resultType,
      activation,
      entry: {
        id: entry.id,
        name: entry.name,
        description: entry.description,
        remaining: entry.remaining,
        stacks: entry.stacks,
        effect: { ...entry.effect },
        presentation: { ...entry.presentation },
      },
    };
  }

  updatePowerUps(deltaSeconds) {
    if (!Number.isFinite(deltaSeconds) || deltaSeconds <= 0) {
      return this.getActivePowerUps();
    }
    let removed = false;
    for (const entry of this.activePowerUps) {
      entry.remaining = Math.max(0, (entry.remaining ?? 0) - deltaSeconds);
      if (entry.remaining === 0) {
        removed = true;
      }
    }
    if (removed) {
      const before = this.activePowerUps.length;
      this.activePowerUps = this.activePowerUps.filter((entry) => entry.remaining > 0);
      removed = removed || before !== this.activePowerUps.length;
    }
    if (removed) {
      this.recalculatePowerUpModifiers();
    }
    return this.getActivePowerUps();
  }

  consumeStamina(amount = 1) {
    if (this.stamina < amount) {
      return false;
    }
    this.stamina -= amount;
    return true;
  }

  restoreStamina(amount) {
    this.stamina = Math.min(this.getMaxStamina(), this.stamina + amount);
  }

  getPrestigeEggs() {
    if (this.runGains <= 0) {
      return 0;
    }
    return Math.floor(Math.pow(this.runGains / 1_000_000, 0.7));
  }

  getPassiveStaminaRegen() {
    return this.passiveStaminaRegen;
  }

  recordTrainingAction({ count = 1, activityKey = this.getSelectedActivity() } = {}) {
    this.trainingActions += count;
    const mastery = this.getActivityMastery(activityKey);
    mastery.progress += count;
    while (mastery.progress >= this.getActivityMasteryThreshold(activityKey)) {
      mastery.progress -= this.getActivityMasteryThreshold(activityKey);
      mastery.level += 1;
    }
  }

  recordEggsLaid(amount) {
    if (amount > 0) {
      this.totalEggsLaid += amount;
    }
  }

  multiplyStatMultiplier(stat, factor) {
    if (!(stat in this.multipliers)) {
      return;
    }
    this.multipliers[stat] *= factor;
    if (stat === "stamina") {
      this.stamina = Math.min(this.stamina, this.getMaxStamina());
    }
  }

  unlockCosmetic(name) {
    this.cosmetics.add(name);
  }

  getCosmetics() {
    return Array.from(this.cosmetics.values());
  }

  getGainsPerHourEstimate() {
    const gainsPerTick = this.getGainsPerTick();
    const ticksPerSecond = this.getTicksPerSecond();
    const staminaCapacity = this.getMaxStamina();
    const restRate = this.getRestRatePerSecond() + this.getPassiveStaminaRegen();

    const trainingDuration = staminaCapacity / ticksPerSecond;
    const restDuration = restRate > 0 ? staminaCapacity / restRate : Infinity;
    const cycleTime = trainingDuration + restDuration;
    if (!isFinite(cycleTime) || cycleTime <= 0) {
      return gainsPerTick * ticksPerSecond * 3600;
    }
    const gainsPerCycle = gainsPerTick * staminaCapacity;
    const gainsPerSecond = gainsPerCycle / cycleTime;
    return gainsPerSecond * 3600;
  }
}
