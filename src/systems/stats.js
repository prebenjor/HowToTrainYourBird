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

    this.multipliers = {
      gain: 1,
      recovery: 1,
    };

    this.passiveStaminaRegen = 0;
    this.stamina = this.getMaxStamina();
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
  }

  getStrengthValue() {
    return 1 + this.levels.strength;
  }

  getStaminaCapacity() {
    return 10 + this.levels.stamina;
  }

  getRecoveryValue() {
    return 1 + this.levels.recovery * 0.1;
  }

  getSpeedValue() {
    return 1 + this.levels.speed * 0.5;
  }

  getGainsPerTick() {
    return BASE_GAIN * this.getStrengthValue() * this.multipliers.gain;
  }

  getTicksPerSecond() {
    return 1 + this.getSpeedValue() / 10;
  }

  getRestRatePerSecond() {
    return this.getRecoveryValue() * 0.5 * this.multipliers.recovery;
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
