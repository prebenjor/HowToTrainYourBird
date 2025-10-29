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
      <h2>Upgrade Lab</h2>
      <div class="upgrades">${rows}</div>
    `;

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
    this.root.querySelectorAll('[data-upgrade]').forEach((row) => {
      const key = row.dataset.upgrade;
      const button = row.querySelector('button[data-action="buy"]');
      const cost = this.stats.getStatCost(key);
      button.textContent = `Buy for ${formatNumber(cost)}`;
      button.disabled = !this.stats.canAfford(cost);
    });
  }
}

function capitalize(word) {
  return word.charAt(0).toUpperCase() + word.slice(1);
}
