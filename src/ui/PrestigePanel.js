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
        <h3>Mentor Network</h3>
        <div class="mentor-list" data-mentor-list></div>
      </div>
    `;

    this.eggsNode = this.root.querySelector('[data-prestige="eggs"]');
    this.prestigeButton = this.root.querySelector('button[data-action="prestige"]');
    this.mentorList = this.root.querySelector('[data-mentor-list]');
    this.mentorRows = new Map();

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

    this.renderMentors();
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

    this.updateMentors();
  }

  renderMentors() {
    if (!this.mentorList) {
      return;
    }
    this.mentorList.innerHTML = "";
    this.mentorRows.clear();
    const fragment = document.createDocumentFragment();
    const mentors = this.stats.getMentorSnapshots();
    mentors.forEach((mentor) => {
      const row = document.createElement("div");
      row.className = "mentor-node";
      row.dataset.mentor = mentor.id;
      row.innerHTML = `
        <div class="mentor-info">
          <div class="mentor-title">${mentor.name}</div>
          <div class="mentor-description" data-field="description"></div>
          <div class="mentor-bonus" data-field="bonus"></div>
          <div class="mentor-cost" data-field="cost"></div>
        </div>
        <button data-action="mentor-unlock" data-mentor="${mentor.id}">Recruit</button>
      `;
      const button = row.querySelector('button[data-action="mentor-unlock"]');
      button.addEventListener("click", () => {
        if (this.stats.unlockMentor(mentor.id)) {
          this.onUpgrade();
          this.update();
        }
      });
      this.mentorRows.set(mentor.id, {
        row,
        description: row.querySelector('[data-field="description"]'),
        bonus: row.querySelector('[data-field="bonus"]'),
        cost: row.querySelector('[data-field="cost"]'),
        button,
      });
      fragment.appendChild(row);
    });
    this.mentorList.appendChild(fragment);
    this.updateMentors();
  }

  updateMentors() {
    if (!this.mentorList) {
      return;
    }
    const mentors = this.stats.getMentorSnapshots();
    mentors.forEach((mentor) => {
      const refs = this.mentorRows.get(mentor.id);
      if (!refs) {
        return;
      }
      refs.description.textContent = mentor.description || "";
      refs.bonus.textContent = formatMentorBonuses(mentor.bonuses);
      refs.cost.textContent = `Cost: ${mentor.cost} egg(s)`;
      refs.row.classList.toggle("is-unlocked", mentor.unlocked);
      refs.button.textContent = mentor.unlocked ? "Unlocked" : "Recruit";
      refs.button.disabled = mentor.unlocked || this.stats.eggs < mentor.cost;
    });
  }
}

function formatMentorBonuses(bonuses) {
  const entries = Object.entries(bonuses ?? {});
  if (entries.length === 0) {
    return "No passive bonus";
  }
  return entries
    .map(([stat, value]) => `+${formatPercent(value)} ${capitalize(stat)}`)
    .join(" · ");
}

function formatPercent(value) {
  if (!Number.isFinite(value)) {
    return "0%";
  }
  const percent = value * 100;
  return percent % 1 === 0 ? percent.toFixed(0) + "%" : percent.toFixed(1) + "%";
}

function capitalize(word) {
  if (!word) {
    return "";
  }
  return word.charAt(0).toUpperCase() + word.slice(1);
}
