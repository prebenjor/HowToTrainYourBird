import { formatNumber } from "../systems/gamble.js";

export class GamblePanel {
  constructor(root, gambleSystem, stats, onChange = () => {}) {
    this.root = root;
    this.gambleSystem = gambleSystem;
    this.stats = stats;
    this.onChange = onChange;
    this.selectedMultiplier = 2;
    this.build();
  }

  build() {
    const chips = this.gambleSystem
      .getMultipliers()
      .map((multiplier) => `<div class="chip" data-multiplier="${multiplier}">x${multiplier}</div>`)
      .join("");

    this.root.innerHTML = `
      <h2>The Pounder</h2>
      <p>Risk some Gains for a shot at legendary multipliers.</p>
      <div class="chip-group" data-role="chips">${chips}</div>
      <div class="stats-grid" style="margin-top: 12px;">
        <label>
          <span class="stat-label">Stake (Gains)</span>
          <input type="number" min="1" step="1" value="100" data-role="stake" />
        </label>
        <button data-action="gamble">Roll the dice</button>
      </div>
      <div class="log" data-role="log"></div>
    `;

    this.chipContainer = this.root.querySelector('[data-role="chips"]');
    this.stakeInput = this.root.querySelector('[data-role="stake"]');
    this.logNode = this.root.querySelector('[data-role="log"]');
    this.actionButton = this.root.querySelector('button[data-action="gamble"]');

    this.chipContainer.addEventListener("click", (event) => {
      const chip = event.target.closest('.chip[data-multiplier]');
      if (!chip) {
        return;
      }
      this.selectedMultiplier = Number(chip.dataset.multiplier);
      this.renderChips();
    });

    this.actionButton.addEventListener("click", () => {
      const stake = Number(this.stakeInput.value);
      const result = this.gambleSystem.attempt(this.selectedMultiplier, stake);
      if (!result.success) {
        this.pushLog(result.reason);
        return;
      }
      if (result.won) {
        this.pushLog(`You crushed it! Net +${formatNumber(result.delta)} Gains.`);
      } else {
        this.pushLog(`Ouch! Lost ${formatNumber(-result.delta)} Gains.`);
      }
      this.onChange();
      this.renderLog();
    });

    this.renderChips();
    this.renderLog();
  }

  renderChips() {
    this.chipContainer.querySelectorAll('.chip[data-multiplier]').forEach((chip) => {
      const multiplier = Number(chip.dataset.multiplier);
      chip.classList.toggle("selected", multiplier === this.selectedMultiplier);
    });
  }

  renderLog() {
    const entries = this.gambleSystem.getLog();
    this.logNode.innerHTML = entries
      .map((entry) => `<div class="log-entry">${entry.message}</div>`)
      .join("");
  }

  pushLog(message) {
    this.gambleSystem.pushLog(message);
    this.renderLog();
  }
}
