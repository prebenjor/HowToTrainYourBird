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

const UI_BOOTSTRAP_MAX_ATTEMPTS = 40;
const UI_BOOTSTRAP_RETRY_DELAY_MS = 50;

let achievementsPanel;
let trainingSystem;
let hud;
let statsPanel;
let progressPanel;
let birdDisplayPanel;
let upgradesPanel;
let prestigePanel;
let uiReady = false;
let bootstrapAttempts = 0;
let bootstrapTimeoutId = null;

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

function collectUIRoots() {
  return {
    topNav: document.getElementById("top-nav"),
    statsPanel: document.getElementById("stats-panel"),
    progressPanel: document.getElementById("progress-panel"),
    birdDisplay: document.getElementById("bird-display"),
    upgradesPanel: document.getElementById("upgrades-panel"),
    gamblePanel: document.getElementById("gamble-panel"),
    prestigePanel: document.getElementById("prestige-panel"),
    achievementsPanel: document.getElementById("achievements-panel"),
    hudRoot: document.getElementById("hud-root"),
  };
}

function setupUI() {
  if (uiReady) {
    return true;
  }

  const roots = collectUIRoots();

  if (!roots.topNav) {
    if (bootstrapAttempts === 0) {
      console.warn("UI bootstrap waiting for navigation container (#top-nav).");
    }
    return false;
  }

  const missingRootEntries = Object.entries(roots)
    .filter(([key, element]) => key !== "topNav" && !element)
    .map(([key]) => key);

  if (missingRootEntries.length > 0) {
    if (bootstrapAttempts === 0) {
      console.warn(
        "UI bootstrap waiting for root panel containers:",
        missingRootEntries.join(", ")
      );
    }
    return false;
  }

  new TopNavTabs(roots.topNav, router, [
    { id: "dashboard", label: "Overview", panelId: "screen-dashboard" },
    { id: "development", label: "Training & Gamble", panelId: "screen-development" },
    { id: "legacy", label: "Legacy Progress", panelId: "screen-legacy" },
  ]);

  statsPanel = new StatsPanel(roots.statsPanel, stats);
  progressPanel = new ProgressPanel(roots.progressPanel, stats);
  birdDisplayPanel = new BirdDisplay(roots.birdDisplay, stats);
  upgradesPanel = new UpgradeMenu(roots.upgradesPanel, stats, updateUI);

  new GamblePanel(roots.gamblePanel, gambleSystem, stats, {
    onChange: updateUI,
    onAttempt: (result) => {
      if (result.success) {
        achievementSystem.recordGamble(result.multiplier, result.won);
        updateUI();
      }
    },
  });

  prestigePanel = new PrestigePanel(
    roots.prestigePanel,
    stats,
    prestigeSystem,
    (eggs) => {
      gambleSystem.pushLog(`Laid ${eggs} egg(s)! New generation unlocked.`);
      updateUI();
    },
    updateUI
  );

  achievementsPanel = new AchievementsPanel(
    roots.achievementsPanel,
    achievementSystem
  );
  hud = new Hud(roots.hudRoot, stats);

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
  return true;
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

function scheduleUIBootstrap() {
  if (uiReady) {
    return;
  }

  if (setupUI()) {
    return;
  }

  if (bootstrapAttempts >= UI_BOOTSTRAP_MAX_ATTEMPTS) {
    console.error(
      "Unable to initialize UI: required elements were not found after waiting."
    );
    return;
  }

  if (bootstrapTimeoutId !== null) {
    return;
  }

  bootstrapTimeoutId = window.setTimeout(() => {
    bootstrapTimeoutId = null;
    bootstrapAttempts += 1;
    scheduleUIBootstrap();
  }, UI_BOOTSTRAP_RETRY_DELAY_MS);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", scheduleUIBootstrap, {
    once: true,
  });
} else {
  scheduleUIBootstrap();
}
