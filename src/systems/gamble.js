const MULTIPLIERS = {
  2: { chance: 0.5 },
  5: { chance: 0.2 },
  20: { chance: 0.05 },
  100: { chance: 0.01 },
};

export class GambleSystem {
  constructor(stats) {
    this.stats = stats;
    this.log = [];
    this.maxLogEntries = 20;
  }

  getMultipliers() {
    return Object.keys(MULTIPLIERS).map((key) => Number(key));
  }

  attempt(multiplier, stake) {
    const config = MULTIPLIERS[multiplier];
    if (!config) {
      return { success: false, reason: "Invalid multiplier." };
    }

    if (stake <= 0) {
      return { success: false, reason: "Stake must be positive." };
    }

    if (!this.stats.spendGains(stake)) {
      return { success: false, reason: "Not enough gains to stake." };
    }

    const roll = Math.random();
    const success = roll < config.chance;

    let delta = -stake;
    if (success) {
      const winnings = stake * multiplier;
      this.stats.addGains(winnings);
      delta = winnings - stake;
    }

    const entry = success
      ? `Won x${multiplier}! +${formatNumber(delta)} Gains`
      : `Lost ${formatNumber(stake)} Gains on x${multiplier}`;
    this.pushLog(entry);

    return { success: true, won: success, delta };
  }

  pushLog(message) {
    this.log.unshift({ message, timestamp: new Date() });
    if (this.log.length > this.maxLogEntries) {
      this.log.pop();
    }
  }

  getLog() {
    return this.log;
  }
}

export function formatNumber(value) {
  if (value >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toFixed(2)}B`;
  }
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(2)}M`;
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(2)}K`;
  }
  return Math.round(value).toString();
}
