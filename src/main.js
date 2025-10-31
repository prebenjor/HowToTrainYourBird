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
import { BirdDisplay } from "./ui/BirdDisplay.js";
import { Hud } from "./ui/hud/Hud.js";

import { TopNavTabs } from "./ui/components/top_nav.js";
import { Router } from "./ui/navigation/router.js";

const stats = new Stats();
const router = new Router({
  routes: ["dashboard", "development", "legacy"],
  defaultRoute: "dashboard",
});

new TopNavTabs(document.getElementById("top-nav"), router, [
  { id: "dashboard", label: "Overview", panelId: "screen-dashboard" },
  { id: "development", label: "Training & Gamble", panelId: "screen-development" },
  { id: "legacy", label: "Legacy Progress", panelId: "screen-legacy" },
]);

let achievementsPanel;
let trainingSystem;
let hud;
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
const birdDisplayPanel = new BirdDisplay(document.getElementById("bird-display"), stats);
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
hud = new Hud(document.getElementById("hud-root"), stats);

trainingSystem = new TrainingSystem(stats, {
  onTick: () => updateUI(),
  onRestChange: (resting) => {
    progressPanel.setResting(resting);
    birdDisplayPanel.setResting(resting);
  },
  onPowerUpActivated: (result) => {
    if (!result?.applied) {
      return;
    }
    const activation = result.activation ?? {};
    const icon = activation.presentation?.icon ?? "✨";
    const verb =
      result.type === "stacked"
        ? "stacked"
        : result.type === "refreshed"
        ? "refreshed"
        : "activated";
    gambleSystem.pushLog(`${icon} ${activation.name ?? "Power-Up"} ${verb}!`);
    updateUI();
  },
});

trainingSystem.start();

function updateUI() {
  achievementSystem.update();
  statsPanel.update();
  progressPanel.update();
  birdDisplayPanel.update();
  upgradesPanel.update();
  prestigePanel.update();
  achievementsPanel.update();
  if (hud) {
    hud.update();
  }
}

updateUI();
