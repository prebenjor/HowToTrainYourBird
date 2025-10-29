export class PrestigeSystem {
  constructor(stats) {
    this.stats = stats;
  }

  canPrestige() {
    return this.stats.getPrestigeEggs() > 0;
  }

  prestige() {
    const eggsEarned = this.stats.getPrestigeEggs();
    this.stats.eggs += eggsEarned;
    this.stats.recordEggsLaid(eggsEarned);
    this.stats.resetForPrestige();
    return eggsEarned;
  }
}
