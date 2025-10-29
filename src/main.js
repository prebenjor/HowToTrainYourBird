import { Stats } from "./systems/stats.js";
import { TrainingSystem } from "./systems/training.js";
import { GambleSystem } from "./systems/gamble.js";
import { PrestigeSystem } from "./systems/prestige.js";
import { StatsPanel, ProgressPanel } from "./ui/StatsPanel.js";
import { UpgradeMenu } from "./ui/UpgradeMenu.js";
import { GamblePanel } from "./ui/GambleModal.js";
import { PrestigePanel } from "./ui/PrestigePanel.js";

const stats = new Stats();
const trainingSystem = new TrainingSystem(stats, {
  onTick: () => updateUI(),
  onRestChange: (resting) => progressPanel.setResting(resting),
});
const gambleSystem = new GambleSystem(stats);
const prestigeSystem = new PrestigeSystem(stats);

const statsPanel = new StatsPanel(document.getElementById("stats-panel"), stats);
const progressPanel = new ProgressPanel(document.getElementById("progress-panel"), stats);
const upgradesPanel = new UpgradeMenu(document.getElementById("upgrades-panel"), stats, updateUI);
const gamblePanel = new GamblePanel(document.getElementById("gamble-panel"), gambleSystem, stats, updateUI);
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

trainingSystem.start();

function updateUI() {
  statsPanel.update();
  progressPanel.update();
  upgradesPanel.update();
  prestigePanel.update();
}

updateUI();
