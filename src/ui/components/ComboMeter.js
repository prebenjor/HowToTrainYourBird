export class ComboMeter {
  constructor(root) {
    this.root = root;
    this.root.classList.add("hud-combo");
    this.build();
  }

  build() {
    this.root.innerHTML = `
      <div class="hud-section-title">Combo Meter</div>
      <div class="hud-combo-value" data-role="value">0</div>
      <div class="hud-combo-meter">
        <div class="hud-combo-meter-fill" data-role="fill"></div>
      </div>
      <div class="hud-combo-footer">
        <span class="hud-combo-multiplier" data-role="multiplier">x1.00</span>
        <span class="hud-combo-timer" data-role="timer">Ready</span>
      </div>
      <div class="hud-combo-best" data-role="best">Best: 0</div>
    `;

    this.valueNode = this.root.querySelector('[data-role="value"]');
    this.fillNode = this.root.querySelector('[data-role="fill"]');
    this.multiplierNode = this.root.querySelector('[data-role="multiplier"]');
    this.timerNode = this.root.querySelector('[data-role="timer"]');
    this.bestNode = this.root.querySelector('[data-role="best"]');
  }

  update(combo) {
    if (!combo) {
      return;
    }
    this.valueNode.textContent = combo.streak ?? 0;
    this.bestNode.textContent = `Best: ${combo.best ?? 0}`;
    const multiplier = combo.multiplier ?? 1;
    this.multiplierNode.textContent = `x${Number(multiplier).toFixed(2)}`;
    this.timerNode.textContent =
      combo.streak > 0 ? `${combo.formattedRemaining ?? ""} to decay` : "Ready";

    const progress = Math.max(0, Math.min(1, combo.progress ?? 0));
    this.fillNode.style.width = `${progress * 100}%`;
    this.root.classList.toggle("is-active", (combo.streak ?? 0) > 0);
  }
}
