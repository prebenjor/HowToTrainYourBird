import { formatNumber } from "../systems/gamble.js";

export class AchievementsPanel {
  constructor(root, achievementSystem) {
    this.root = root;
    this.achievementSystem = achievementSystem;
    this.lastUnlockNode = null;
    this.rows = new Map();
    this.build();
  }

  build() {
    const achievements = this.achievementSystem.getAchievements();
    const rowsHtml = achievements
      .map(
        (achievement) => `
          <div class="achievement-row" data-achievement="${achievement.id}">
            <div class="achievement-head">
              <div>
                <div class="achievement-title">${achievement.name}</div>
                <div class="achievement-desc">${achievement.description}</div>
              </div>
              <div class="achievement-reward">${achievement.reward}</div>
            </div>
            <div class="achievement-status" data-role="status"></div>
          </div>
        `
      )
      .join("");

    this.root.innerHTML = `
      <h2>Achievements</h2>
      <div class="achievement-latest" data-role="latest">No achievements unlocked yet.</div>
      <div class="achievement-grid">${rowsHtml}</div>
    `;

    this.lastUnlockNode = this.root.querySelector('[data-role="latest"]');
    this.root.querySelectorAll("[data-achievement]").forEach((row) => {
      const id = row.dataset.achievement;
      const statusNode = row.querySelector('[data-role="status"]');
      this.rows.set(id, {
        row,
        statusNode,
      });
    });
  }

  notifyUnlock(achievement) {
    if (this.lastUnlockNode) {
      this.lastUnlockNode.textContent = `Unlocked: ${achievement.name} — ${achievement.reward}`;
    }
    const rowData = this.rows.get(achievement.id);
    if (rowData) {
      rowData.row.classList.add("unlocked");
    }
    this.root.classList.add("achievement-flash");
    window.setTimeout(() => this.root.classList.remove("achievement-flash"), 400);
  }

  update() {
    const achievements = this.achievementSystem.getAchievements();
    const flags = this.achievementSystem.getFlags();
    achievements.forEach((achievement) => {
      const data = this.rows.get(achievement.id);
      if (!data) {
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
