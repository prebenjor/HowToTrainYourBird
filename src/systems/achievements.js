const ACHIEVEMENTS = [
  {
    id: "first-flex",
    name: "First Flex",
    description: "Reach 1,000 Gains.",
    reward: "+5% Strength",
    check: (stats) => stats.totalGains >= 1_000,
    applyReward: (stats) => {
      stats.multiplyStatMultiplier("strength", 1.05);
    },
    getProgress: (stats) => ({
      current: stats.totalGains,
      target: 1_000,
      unit: "Gains",
    }),
  },
  {
    id: "no-rest-days",
    name: "No Rest Days",
    description: "Train 10,000 times.",
    reward: "+5% Stamina",
    check: (stats) => stats.trainingActions >= 10_000,
    applyReward: (stats) => {
      stats.multiplyStatMultiplier("stamina", 1.05);
    },
    getProgress: (stats) => ({
      current: stats.trainingActions,
      target: 10_000,
      unit: "Training actions",
    }),
  },
  {
    id: "eggcelent",
    name: "Eggcelent",
    description: "Lay your first egg.",
    reward: "Unlocks the Eggshell Mohawk cosmetic",
    check: (stats) => stats.totalEggsLaid > 0,
    applyReward: (stats) => {
      stats.unlockCosmetic("Eggshell Mohawk");
    },
    getProgress: (stats) => ({
      current: stats.totalEggsLaid,
      target: 1,
      unit: "Eggs laid",
    }),
  },
  {
    id: "fast-feathers",
    name: "Fast Feathers",
    description: "Reach Speed 10.",
    reward: "+10% Gains",
    check: (stats) => stats.getSpeedValue() >= 10,
    applyReward: (stats) => {
      stats.multipliers.gain *= 1.1;
    },
    getProgress: (stats) => ({
      current: stats.getSpeedValue(),
      target: 10,
      unit: "Speed",
      precision: 2,
    }),
  },
  {
    id: "iron-beak",
    name: "Iron Beak",
    description: "Win a x100 gamble.",
    reward: "Unlocks the Iron Beak Trophy cosmetic",
    check: (_, flags) => flags.hundredWin,
    applyReward: (stats) => {
      stats.unlockCosmetic("Iron Beak Trophy");
    },
    getProgress: (_, flags) => ({
      current: flags.hundredWin ? 1 : 0,
      target: 1,
      unit: "x100 wins",
    }),
  },
];

export class AchievementSystem {
  constructor(stats, onUnlock = () => {}) {
    this.stats = stats;
    this.onUnlock = onUnlock;
    this.flags = {
      hundredWin: false,
    };
    this.achievements = ACHIEVEMENTS.map((achievement) => ({
      ...achievement,
      unlocked: false,
    }));
  }

  update() {
    for (const achievement of this.achievements) {
      if (achievement.unlocked) {
        continue;
      }
      if (achievement.check(this.stats, this.flags)) {
        achievement.unlocked = true;
        if (achievement.applyReward) {
          achievement.applyReward(this.stats);
        }
        this.onUnlock(achievement);
      }
    }
  }

  recordGamble(multiplier, won) {
    if (won && multiplier === 100) {
      this.flags.hundredWin = true;
      this.update();
    }
  }

  getAchievements() {
    return this.achievements;
  }

  getFlags() {
    return this.flags;
  }
}

