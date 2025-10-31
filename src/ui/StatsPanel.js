import { formatNumber } from "../systems/gamble.js";
import { getRestState, getRestSummary } from "../systems/rest.js";

export class StatsPanel {
  constructor(root, stats) {
    this.root = root;
    this.stats = stats;
    this.build();
  }

  build() {
    this.root.innerHTML = `
      <h2>Bird Stats</h2>
      <div class="stats-grid">
        <div class="stat-item"><span class="stat-label">Gains</span><span class="stat-value" data-stat="gains">0</span></div>
        <div class="stat-item"><span class="stat-label">Gains/hour</span><span class="stat-value" data-stat="gph">0</span></div>
        <div class="stat-item"><span class="stat-label">Eggs</span><span class="stat-value" data-stat="eggs">0</span></div>
        <div class="stat-item"><span class="stat-label">Size</span><span class="stat-value" data-stat="size">10 cm</span></div>
        <div class="stat-item"><span class="stat-label">Strength</span><span class="stat-value" data-stat="strength">1</span></div>
        <div class="stat-item"><span class="stat-label">Stamina</span><span class="stat-value" data-stat="stamina">10</span></div>
        <div class="stat-item"><span class="stat-label">Recovery</span><span class="stat-value" data-stat="recovery">1</span></div>
        <div class="stat-item"><span class="stat-label">Speed</span><span class="stat-value" data-stat="speed">1</span></div>
      </div>
      <h3>Training Activities</h3>
      <div class="activity-list" data-activity-list></div>
    `;
    this.gainsNode = this.root.querySelector('[data-stat="gains"]');
    this.gphNode = this.root.querySelector('[data-stat="gph"]');
    this.eggsNode = this.root.querySelector('[data-stat="eggs"]');
    this.sizeNode = this.root.querySelector('[data-stat="size"]');
    this.strengthNode = this.root.querySelector('[data-stat="strength"]');
    this.staminaNode = this.root.querySelector('[data-stat="stamina"]');
    this.recoveryNode = this.root.querySelector('[data-stat="recovery"]');
    this.speedNode = this.root.querySelector('[data-stat="speed"]');

    this.activityContainer = this.root.querySelector("[data-activity-list]");
    this.activityRows = {};
    this.renderActivities();
  }

  update() {
    this.gainsNode.textContent = formatNumber(this.stats.gains);
    this.gphNode.textContent = formatNumber(this.stats.getGainsPerHourEstimate());
    this.eggsNode.textContent = `${formatNumber(this.stats.eggs)} (next: ${formatNumber(
      this.stats.getPrestigeEggs()
    )})`;
    this.sizeNode.textContent = `${this.stats.getSize().toFixed(1)} cm`;
    this.strengthNode.textContent = this.stats.getStrengthValue().toFixed(0);
    this.staminaNode.textContent = `${this.stats.stamina}/${this.stats.getMaxStamina()}`;
    this.recoveryNode.textContent = this.stats.getRecoveryValue().toFixed(2);
    this.speedNode.textContent = this.stats.getSpeedValue().toFixed(2);

    this.updateActivities();
  }

  renderActivities() {
    this.activityContainer.innerHTML = "";
    this.activityRows = {};
    const fragment = document.createDocumentFragment();
    const snapshots = this.stats.getActivitySnapshots();
    snapshots.forEach((snapshot) => {
      const row = document.createElement("div");
      row.className = "activity-card";
      row.dataset.activity = snapshot.key;
      row.innerHTML = `
        <div class="activity-header">
          <div>
            <div class="activity-name" data-field="name"></div>
            <div class="activity-description" data-field="description"></div>
          </div>
          <button data-action="select">Select</button>
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
      `;

      const refs = {
        row,
        button: row.querySelector('button[data-action="select"]'),
        name: row.querySelector('[data-field="name"]'),
        description: row.querySelector('[data-field="description"]'),
        cost: row.querySelector('[data-field="cost"]'),
        payout: row.querySelector('[data-field="payout"]'),
        bonus: row.querySelector('[data-field="bonus"]'),
        progressFill: row.querySelector('[data-field="progress-fill"]'),
        progressText: row.querySelector('[data-field="progress"]'),
        level: row.querySelector('[data-field="level"]'),
        requirement: row.querySelector('[data-field="requirement"]'),
      };

      refs.button.addEventListener("click", () => {
        if (this.stats.setSelectedActivity(snapshot.key)) {
          this.update();
        }
      });

      this.activityRows[snapshot.key] = refs;
      fragment.appendChild(row);
    });
    this.activityContainer.appendChild(fragment);
    this.updateActivities();
  }

  updateActivities() {
    const snapshots = this.stats.getActivitySnapshots();
    snapshots.forEach((snapshot) => {
      const refs = this.activityRows[snapshot.key];
      if (!refs) {
        return;
      }
      refs.row.classList.toggle("is-selected", snapshot.selected);
      refs.row.classList.toggle("is-locked", !snapshot.unlocked);
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

export class ProgressPanel {
  constructor(root, stats) {
    this.root = root;
    this.stats = stats;
    this.build();
  }

  build() {
    this.root.innerHTML = `
      <h2>Training Progress</h2>
      <div class="stats-grid">
        <div>
          <div class="stat-label">Stamina</div>
          <div class="progress-bar"><div class="progress-bar-fill" data-progress="stamina"></div></div>
        </div>
        <div>
          <div class="stat-label">Status</div>
          <div class="stat-value" data-progress="status">Training</div>
        </div>
        <div>
          <div class="stat-label">Next egg payout</div>
          <div class="stat-value" data-progress="eggs">0</div>
        </div>
        <div>
          <div class="stat-label">Cycle timing</div>
          <div class="stat-value" data-progress="cycle">0s train / 0s rest</div>
        </div>
      </div>
    `;
    this.staminaBar = this.root.querySelector('[data-progress="stamina"]');
    this.statusNode = this.root.querySelector('[data-progress="status"]');
    this.eggsNode = this.root.querySelector('[data-progress="eggs"]');
    this.cycleNode = this.root.querySelector('[data-progress="cycle"]');
  }

  setResting(resting) {
    this.statusNode.textContent = resting ? "Resting" : "Training";
  }

  update() {
    const restState = getRestState(this.stats);
    const percent = restState.percent * 100;
    this.staminaBar.style.width = `${percent}%`;
    this.eggsNode.textContent = `${formatNumber(this.stats.getPrestigeEggs())} eggs ready`;

    const summary = getRestSummary(this.stats);
    const formatTime = (seconds) => {
      if (!isFinite(seconds)) {
        return "∞";
      }
      if (seconds < 60) {
        return `${seconds.toFixed(1)}s`;
      }
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      return `${minutes}m ${remainingSeconds.toFixed(0)}s`;
    };

    this.cycleNode.textContent = `${formatTime(summary.trainingDuration)} train / ${formatTime(
      summary.restDuration
    )} rest`;
  }
}
