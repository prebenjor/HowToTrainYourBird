import { Tabs } from "../components/Tabs.js";
import { formatNumber } from "../../systems/gamble.js";

const CATEGORY_LABELS = {
  progression: "Progression",
  prestige: "Prestige",
  gambling: "High Stakes",
};

export class AchievementsPanel {
  constructor(root, achievementSystem, options = {}) {
    this.root = root;
    this.achievementSystem = achievementSystem;
    this.storage = options.storage ?? (typeof window !== "undefined" ? window.localStorage : null);

    this.lastUnlockNode = null;
    this.rowsByAchievement = new Map();
    this.rowsByCategory = new Map();
    this.achievementsById = new Map();
    this.tabs = null;

    this.build();
  }

  build() {
    const categories = this.achievementSystem.getAchievementCategories();
    const sortedCategories = Array.from(categories.entries())
      .map(([category, achievements]) => ({
        key: category ?? "general",
        label: getCategoryLabel(category),
        achievements,
      }))
      .sort((a, b) => a.label.localeCompare(b.label));

    this.root.innerHTML = "";
    const title = document.createElement("h2");
    title.textContent = "Achievements";
    const latest = document.createElement("div");
    latest.className = "achievement-latest";
    latest.textContent = "No achievements unlocked yet.";
    const tabsRoot = document.createElement("div");

    this.root.append(title, latest, tabsRoot);
    this.lastUnlockNode = latest;

    const tabsConfig = sortedCategories.map(({ key, label, achievements }) => ({
      id: key,
      label,
      render: (container) => this.renderCategory(container, key, achievements),
    }));

    if (tabsConfig.length === 0) {
      const emptyState = document.createElement("div");
      emptyState.className = "empty-state";
      emptyState.textContent = "No achievements available.";
      tabsRoot.appendChild(emptyState);
      return;
    }

    this.tabs = new Tabs(tabsRoot, {
      tabs: tabsConfig,
      persistKey: "achievements-panel-tab",
      storage: this.storage,
    });
  }

  renderCategory(container, category, achievements) {
    container.classList.add("achievement-grid");
    const rows = new Map();
    const fragment = document.createDocumentFragment();

    achievements.forEach((achievement) => {
      this.achievementsById.set(achievement.id, achievement);
      const row = document.createElement("div");
      row.className = "achievement-row";
      row.dataset.achievement = achievement.id;

      const head = document.createElement("div");
      head.className = "achievement-head";

      const textWrapper = document.createElement("div");
      const title = document.createElement("div");
      title.className = "achievement-title";
      title.textContent = achievement.name;
      const description = document.createElement("div");
      description.className = "achievement-desc";
      description.textContent = achievement.description;
      textWrapper.append(title, description);

      const reward = document.createElement("div");
      reward.className = "achievement-reward";
      reward.textContent = achievement.reward;

      head.append(textWrapper, reward);

      const statusNode = document.createElement("div");
      statusNode.className = "achievement-status";

      row.append(head, statusNode);

      rows.set(achievement.id, { row, statusNode });
      fragment.appendChild(row);
    });

    container.appendChild(fragment);
    this.rowsByCategory.set(category, rows);
    rows.forEach((data, id) => this.rowsByAchievement.set(id, data));
    this.updateCategory(category);
  }

  notifyUnlock(achievement) {
    if (this.lastUnlockNode) {
      this.lastUnlockNode.textContent = `Unlocked: ${achievement.name} — ${achievement.reward}`;
    }
    const rowData = this.rowsByAchievement.get(achievement.id);
    if (rowData) {
      rowData.row.classList.add("unlocked");
    }
    this.root.classList.add("achievement-flash");
    if (typeof window !== "undefined") {
      window.setTimeout(() => this.root.classList.remove("achievement-flash"), 400);
    }
  }

  update() {
    const activeCategory = this.tabs ? this.tabs.getActiveTab() : null;
    if (activeCategory) {
      this.updateCategory(activeCategory);
    }
  }

  updateCategory(category) {
    const rows = this.rowsByCategory.get(category);
    if (!rows) {
      return;
    }
    const flags = this.achievementSystem.getFlags();

    rows.forEach((data, id) => {
      const achievement = this.achievementsById.get(id);
      if (!achievement) {
        return;
      }

      const progress = achievement.getProgress
        ? achievement.getProgress(this.achievementSystem.stats, flags)
        : null;

      if (achievement.unlocked) {
        data.statusNode.textContent = "Unlocked";
        data.row.classList.add("unlocked");
      } else if (progress) {
        const { current, target, unit, precision } = progress;
        let currentFormatted = typeof current === "number" ? formatNumber(current) : current;
        let targetFormatted = typeof target === "number" ? formatNumber(target) : target;
        if (precision !== undefined && typeof current === "number") {
          currentFormatted = Number(current).toFixed(precision);
        }
        data.statusNode.textContent = `Progress: ${currentFormatted}/${targetFormatted} ${unit}`;
        data.row.classList.remove("unlocked");
      } else {
        data.statusNode.textContent = "In progress";
        data.row.classList.remove("unlocked");
      }
    });
  }
}

function getCategoryLabel(category) {
  if (!category) {
    return "General";
  }
  return CATEGORY_LABELS[category] ?? capitalize(category);
}

function capitalize(word) {
  return word.charAt(0).toUpperCase() + word.slice(1);
}
