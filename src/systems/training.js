export class TrainingSystem {
  constructor(stats, { onTick = () => {}, onRestChange = () => {} } = {}) {
    this.stats = stats;
    this.onTick = onTick;
    this.onRestChange = onRestChange;

    this.resting = false;
    this.tickAccumulator = 0;
    this.restAccumulator = 0;
    this.passiveAccumulator = 0;
    this.running = false;
    this.lastTimestamp = performance.now();
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

    const ticksPerSecond = this.stats.getTicksPerSecond();
    this.tickAccumulator += deltaSeconds * ticksPerSecond;

    const passiveRate = this.stats.getPassiveStaminaRegen();
    this.passiveAccumulator += deltaSeconds * passiveRate;

    if (!this.resting) {
      while (this.tickAccumulator >= 1) {
        if (this.stats.consumeStamina(1)) {
          const gains = this.stats.getGainsPerTick();
          this.stats.addGains(gains);
          this.onTick({ gains, stamina: this.stats.stamina });
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
