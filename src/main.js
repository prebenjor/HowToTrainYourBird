import { Stats } from "./systems/stats.js";
import { TrainingSystem } from "./systems/training.js";
import { GambleSystem } from "./systems/gamble.js";
import { PrestigeSystem } from "./systems/prestige.js";
import { AchievementSystem } from "./systems/achievements.js";
import { StatsPanel, ProgressPanel } from "./ui/StatsPanel.js";
import { UpgradeMenu } from "./ui/UpgradeMenu.js";
import { GamblePanel } from "./ui/GambleModal.js";
import { PrestigePanel } from "./ui/PrestigePanel.js";
import { AchievementsPanel } from "./ui/screens/AchievementsPanel.js";
import { BirdDisplay } from "./ui/BirdDisplay.js";
import { Hud } from "./ui/hud/Hud.js";

import { TopNavTabs } from "./ui/components/top_nav.js";
import { Router } from "./ui/navigation/router.js";

const stats = new Stats();
const router = new Router({
  routes: ["dashboard", "development", "legacy"],
  defaultRoute: "dashboard",
});

let achievementsPanel;
let trainingSystem;
let hud;
let statsPanel;
let progressPanel;
let birdDisplayPanel;
let upgradesPanel;
let prestigePanel;
let uiReady = false;

const gambleSystem = new GambleSystem(stats);
const prestigeSystem = new PrestigeSystem(stats);
const achievementSystem = new AchievementSystem(stats, (achievement) => {
  gambleSystem.pushLog(`Achievement unlocked: ${achievement.name}!`);
  if (achievementsPanel) {
    achievementsPanel.notifyUnlock(achievement);
  }
  if (uiReady) {
    updateUI();
  }
});

function initializeUI() {
  const topNavElement = document.getElementById("top-nav");
  const statsPanelElement = document.getElementById("stats-panel");
  const progressPanelElement = document.getElementById("progress-panel");
  const birdDisplayElement = document.getElementById("bird-display");
  const upgradesPanelElement = document.getElementById("upgrades-panel");
  const gamblePanelElement = document.getElementById("gamble-panel");
  const prestigePanelElement = document.getElementById("prestige-panel");
  const achievementsPanelElement = document.getElementById("achievements-panel");
  const hudRootElement = document.getElementById("hud-root");

  if (!topNavElement) {
    console.error("Unable to initialize navigation: #top-nav was not found.");
    return;
  }

  new TopNavTabs(topNavElement, router, [
    { id: "dashboard", label: "Overview", panelId: "screen-dashboard" },
    { id: "development", label: "Training & Gamble", panelId: "screen-development" },
    { id: "legacy", label: "Legacy Progress", panelId: "screen-legacy" },
  ]);

  if (
    !statsPanelElement ||
    !progressPanelElement ||
    !birdDisplayElement ||
    !upgradesPanelElement ||
    !gamblePanelElement ||
    !prestigePanelElement ||
    !achievementsPanelElement ||
    !hudRootElement
  ) {
    console.error("Unable to initialize UI: one or more root elements are missing.");
    return;
  }

  statsPanel = new StatsPanel(statsPanelElement, stats);
  progressPanel = new ProgressPanel(progressPanelElement, stats);
  birdDisplayPanel = new BirdDisplay(birdDisplayElement, stats);
  upgradesPanel = new UpgradeMenu(upgradesPanelElement, stats, updateUI);

  new GamblePanel(gamblePanelElement, gambleSystem, stats, {
    onChange: updateUI,
    onAttempt: (result) => {
      if (result.success) {
        achievementSystem.recordGamble(result.multiplier, result.won);
        updateUI();
      }
    },
  });

  prestigePanel = new PrestigePanel(
    prestigePanelElement,
    stats,
    prestigeSystem,
    (eggs) => {
      gambleSystem.pushLog(`Laid ${eggs} egg(s)! New generation unlocked.`);
      updateUI();
    },
    updateUI
  );

  achievementsPanel = new AchievementsPanel(achievementsPanelElement, achievementSystem);
  hud = new Hud(hudRootElement, stats);

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
  uiReady = true;
  updateUI();
}

function updateUI() {
  if (!uiReady) {
    return;
  }
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

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeUI, { once: true });
} else {
  initializeUI();
}
