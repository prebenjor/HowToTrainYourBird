import { Stats } from "../systems/stats.js";
import { formatNumber } from "../systems/gamble.js";

export class PrestigePanel {
  constructor(root, stats, prestigeSystem, onPrestige = () => {}, onUpgrade = () => {}) {
    this.root = root;
    this.stats = stats;
    this.prestigeSystem = prestigeSystem;
    this.onPrestige = onPrestige;
    this.onUpgrade = onUpgrade;
    this.build();
  }

  build() {
    const eggUpgradeList = Object.entries(Stats.EGG_UPGRADES)
      .map(
        ([key, upgrade]) => `
        <div class="egg-upgrade" data-upgrade="${key}">
          <div>
            <div class="egg-upgrade-title">${upgrade.label}</div>
            <div class="upgrade-subtitle">Cost: ${upgrade.cost} egg(s)</div>
          </div>
          <button data-action="egg-upgrade" data-key="${key}">Buy</button>
        </div>
      `
      )
      .join("");

    this.root.innerHTML = `
      <h2>Prestige Hatchery</h2>
      <div class="prestige-actions">
        <div class="stat-item">
          <span class="stat-label">Eggs Ready</span>
          <span class="stat-value" data-prestige="eggs">0</span>
        </div>
        <button data-action="prestige">Lay Egg &amp; Rebirth</button>
        <h3>Egg Upgrades</h3>
        <div class="egg-upgrades">${eggUpgradeList}</div>
      </div>
    `;

    this.eggsNode = this.root.querySelector('[data-prestige="eggs"]');
    this.prestigeButton = this.root.querySelector('button[data-action="prestige"]');

    this.prestigeButton.addEventListener("click", () => {
      if (!this.prestigeSystem.canPrestige()) {
        return;
      }
      const eggs = this.prestigeSystem.prestige();
      this.onPrestige(eggs);
      this.update();
    });

    this.root.querySelectorAll('button[data-action="egg-upgrade"]').forEach((button) => {
      button.addEventListener("click", () => {
        const key = button.dataset.key;
        if (this.stats.applyEggUpgrade(key)) {
          this.onUpgrade();
          this.update();
        }
      });
    });

    this.update();
  }

  update() {
    const readyEggs = this.stats.getPrestigeEggs();
    this.eggsNode.textContent = `${formatNumber(readyEggs)} ready / ${formatNumber(this.stats.eggs)} banked`;
    this.prestigeButton.disabled = !this.prestigeSystem.canPrestige();

    this.root.querySelectorAll('[data-upgrade]').forEach((row) => {
      const key = row.dataset.upgrade;
      const button = row.querySelector('button[data-action="egg-upgrade"]');
      const cost = Stats.EGG_UPGRADES[key].cost;
      button.disabled = this.stats.eggs < cost;
    });
  }
}
