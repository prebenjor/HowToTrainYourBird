import { Stats } from "../systems/stats.js";
import { formatNumber } from "../systems/gamble.js";

export class UpgradeMenu {
  constructor(root, stats, onPurchase = () => {}) {
    this.root = root;
    this.stats = stats;
    this.onPurchase = onPurchase;
    this.build();
  }

  build() {
    const activityCards = this.stats
      .getActivitySnapshots()
      .map(
        (activity) => `
          <div class="activity-card" data-activity="${activity.key}">
            <div class="activity-header">
              <div>
                <div class="activity-name" data-field="name">${activity.name}</div>
                <div class="activity-description" data-field="description">${activity.description || ""}</div>
              </div>
              <button data-action="select-activity" data-key="${activity.key}">Select</button>
            </div>
            <div class="activity-meta">
              <span data-field="cost"></span>
              <span data-field="payout"></span>
              <span data-field="bonus"></span>
            </div>
            <div class="activity-mastery-bar">
              <div class="activity-mastery-fill" data-field="progress-fill"></div>
            </div>
            <div class="activity-mastery-summary">
              <span data-field="level"></span>
              <span data-field="progress"></span>
            </div>
            <div class="activity-requirement" data-field="requirement"></div>
          </div>
        `
      )
      .join("");

    const rows = Object.entries(Stats.STAT_CONFIG)
      .map(([key, config]) => {
        return `
          <div class="upgrade-row" data-upgrade="${key}">
            <div class="upgrade-info">
              <span class="upgrade-title">${capitalize(key)}</span>
              <span class="upgrade-subtitle">${config.description}</span>
            </div>
            <button data-action="buy" data-key="${key}">Buy for ${config.baseCost}</button>
          </div>
        `;
      })
      .join("");

    this.root.innerHTML = `
      <h2>Training Activities</h2>
      <div class="activity-selection" data-activity-selection>${activityCards}</div>
      <h2>Upgrade Lab</h2>
      <div class="upgrades">${rows}</div>
    `;

    this.activityCards = {};
    this.root
      .querySelectorAll('[data-action="select-activity"]')
      .forEach((button) => {
        const key = button.dataset.key;
        const card = button.closest('[data-activity]');
        if (!card) {
          return;
        }
        this.activityCards[key] = {
          card,
          button,
          name: card.querySelector('[data-field="name"]'),
          description: card.querySelector('[data-field="description"]'),
          cost: card.querySelector('[data-field="cost"]'),
          payout: card.querySelector('[data-field="payout"]'),
          bonus: card.querySelector('[data-field="bonus"]'),
          progressFill: card.querySelector('[data-field="progress-fill"]'),
          progressText: card.querySelector('[data-field="progress"]'),
          level: card.querySelector('[data-field="level"]'),
          requirement: card.querySelector('[data-field="requirement"]'),
        };
        button.addEventListener("click", () => {
          if (this.stats.setSelectedActivity(key)) {
            this.update();
          }
        });
      });

    this.root.querySelectorAll('button[data-action="buy"]').forEach((button) => {
      button.addEventListener("click", () => {
        const key = button.dataset.key;
        if (this.stats.purchaseStat(key)) {
          this.onPurchase();
          this.update();
        }
      });
    });

    this.update();
  }

  update() {
    this.updateActivities();
    this.root.querySelectorAll('[data-upgrade]').forEach((row) => {
      const key = row.dataset.upgrade;
      const button = row.querySelector('button[data-action="buy"]');
      const cost = this.stats.getStatCost(key);
      button.textContent = `Buy for ${formatNumber(cost)}`;
      button.disabled = !this.stats.canAfford(cost);
    });
  }

  updateActivities() {
    const snapshots = this.stats.getActivitySnapshots();
    snapshots.forEach((snapshot) => {
      const refs = this.activityCards[snapshot.key];
      if (!refs) {
        return;
      }
      refs.card.classList.toggle("is-selected", snapshot.selected);
      refs.card.classList.toggle("is-locked", !snapshot.unlocked);
      refs.name.textContent = snapshot.name;
      refs.description.textContent = snapshot.description || "";
      refs.cost.textContent = `${snapshot.staminaCost} stamina/tick`;
      const gainsPerTick = this.stats.getActivityGainsPerTick(snapshot.key);
      refs.payout.textContent = `${formatNumber(gainsPerTick)} gains/tick`;
      refs.bonus.textContent =
        snapshot.bonusPercent > 0
          ? `+${snapshot.bonusPercent.toFixed(0)}% mastery bonus`
          : "No mastery bonus";

      const threshold = snapshot.threshold;
      let percent = 0;
      if (isFinite(threshold) && threshold > 0) {
        percent = Math.min(100, (snapshot.progress / threshold) * 100);
      }
      refs.progressFill.style.width = `${percent}%`;
      refs.level.textContent = `Mastery ${snapshot.level}`;
      if (!isFinite(threshold)) {
        refs.progressText.textContent = "Maxed";
      } else {
        refs.progressText.textContent = `${Math.floor(snapshot.progress)} / ${Math.floor(threshold)}`;
      }

      if (snapshot.unlocked) {
        refs.requirement.textContent = "";
        refs.button.disabled = snapshot.selected;
        refs.button.textContent = snapshot.selected ? "Selected" : "Select";
      } else {
        refs.requirement.textContent = snapshot.unlockDescription || "Locked";
        refs.button.disabled = true;
        refs.button.textContent = "Locked";
      }
    });
  }
}

function capitalize(word) {
  return word.charAt(0).toUpperCase() + word.slice(1);
}
