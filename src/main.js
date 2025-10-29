import { Stats } from "./systems/stats.js";
import { TrainingSystem } from "./systems/training.js";
import { GambleSystem } from "./systems/gamble.js";
import { PrestigeSystem } from "./systems/prestige.js";
import { AchievementSystem } from "./systems/achievements.js";
import { StatsPanel, ProgressPanel } from "./ui/StatsPanel.js";
import { UpgradeMenu } from "./ui/UpgradeMenu.js";
import { GamblePanel } from "./ui/GambleModal.js";
import { PrestigePanel } from "./ui/PrestigePanel.js";
import { AchievementsPanel } from "./ui/AchievementsPanel.js";

const stats = new Stats();
let achievementsPanel;

const trainingSystem = new TrainingSystem(stats, {
  onTick: () => updateUI(),
  onRestChange: (resting) => progressPanel.setResting(resting),
});
const gambleSystem = new GambleSystem(stats);
const prestigeSystem = new PrestigeSystem(stats);
const achievementSystem = new AchievementSystem(stats, (achievement) => {
  gambleSystem.pushLog(`Achievement unlocked: ${achievement.name}!`);
  if (achievementsPanel) {
    achievementsPanel.notifyUnlock(achievement);
  }
});

const statsPanel = new StatsPanel(document.getElementById("stats-panel"), stats);
const progressPanel = new ProgressPanel(document.getElementById("progress-panel"), stats);
const upgradesPanel = new UpgradeMenu(document.getElementById("upgrades-panel"), stats, updateUI);
new GamblePanel(document.getElementById("gamble-panel"), gambleSystem, stats, {
  onChange: updateUI,
  onAttempt: (result) => {
    if (result.success) {
      achievementSystem.recordGamble(result.multiplier, result.won);
      updateUI();
    }
  },
});
const prestigePanel = new PrestigePanel(
  document.getElementById("prestige-panel"),
  stats,
  prestigeSystem,
  (eggs) => {
    gambleSystem.pushLog(`Laid ${eggs} egg(s)! New generation unlocked.`);
    updateUI();
  },
  updateUI
);
achievementsPanel = new AchievementsPanel(
  document.getElementById("achievements-panel"),
  achievementSystem
);

trainingSystem.start();

function updateUI() {
  achievementSystem.update();
  statsPanel.update();
  progressPanel.update();
  upgradesPanel.update();
  prestigePanel.update();
  achievementsPanel.update();
}

updateUI();
