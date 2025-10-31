import { formatNumber } from "../systems/gamble.js";

const STAGE_BREAKPOINTS = [
  {
    id: "hatchling",
    maxSize: 40,
    label: "Hatchling Hustler",
    description: "Fresh out of the egg and already flexing tiny wings.",
    image: "./assets/images/bird-chick.svg",
  },
  {
    id: "rookie",
    maxSize: 75,
    label: "Gym Rookie",
    description: "Putting on feathers and confidence in equal measure.",
    image: "./assets/images/bird-teen.svg",
  },
  {
    id: "legend",
    maxSize: Infinity,
    label: "Aviary Legend",
    description: "Every flap shakes the rafters. Welcome to swole nirvana.",
    image: "./assets/images/bird-hero.svg",
  },
];

export class BirdDisplay {
  constructor(root, stats) {
    this.root = root;
    this.stats = stats;
    this.resting = false;
    this.build();
  }

  build() {
    this.root.innerHTML = `
      <div class="bird-stage" data-stage>
        <img class="bird-stage-bg" src="./assets/images/gym-bg.svg" alt="Gym background" />
        <img class="bird-stage-actor" data-role="actor" src="" alt="Training bird" />
        <div class="bird-stage-status" data-role="status">Training hard</div>
      </div>
      <div class="bird-stage-details">
        <div class="bird-stage-heading">
          <h2 data-role="stage-title"></h2>
          <span class="bird-stage-size" data-role="size"></span>
        </div>
        <p class="bird-stage-description" data-role="stage-description"></p>
        <div class="bird-stage-activity">
          <div>
            <div class="stat-label">Current Focus</div>
            <div class="stat-value" data-role="activity-name"></div>
          </div>
          <div>
            <div class="stat-label">Payout</div>
            <div class="stat-value" data-role="activity-payout"></div>
          </div>
          <div>
            <div class="stat-label">Stamina Cost</div>
            <div class="stat-value" data-role="activity-cost"></div>
          </div>
        </div>
      </div>
    `;

    this.actorNode = this.root.querySelector('[data-role="actor"]');
    this.statusNode = this.root.querySelector('[data-role="status"]');
    this.stageTitleNode = this.root.querySelector('[data-role="stage-title"]');
    this.stageSizeNode = this.root.querySelector('[data-role="size"]');
    this.stageDescriptionNode = this.root.querySelector('[data-role="stage-description"]');
    this.activityNameNode = this.root.querySelector('[data-role="activity-name"]');
    this.activityPayoutNode = this.root.querySelector('[data-role="activity-payout"]');
    this.activityCostNode = this.root.querySelector('[data-role="activity-cost"]');

    this.update();
  }

  setResting(resting) {
    this.resting = resting;
    this.statusNode.textContent = resting ? "Taking a power nap" : "Training hard";
    this.root.classList.toggle("is-resting", resting);
  }

  update() {
    const size = this.stats.getSize();
    const stage =
      STAGE_BREAKPOINTS.find((entry) => size < entry.maxSize) ||
      STAGE_BREAKPOINTS[STAGE_BREAKPOINTS.length - 1];

    if (stage) {
      this.stageTitleNode.textContent = stage.label;
      this.stageDescriptionNode.textContent = stage.description;
      this.actorNode.src = stage.image;
      this.actorNode.alt = stage.label;
      this.root.dataset.stage = stage.id;
    }

    this.stageSizeNode.textContent = `${size.toFixed(1)} cm`;

    const activityKey = this.stats.getSelectedActivity();
    const catalog = this.stats.getActivityCatalog();
    const activity = catalog[activityKey];
    if (activity) {
      this.activityNameNode.textContent = activity.name;
      const payout = this.stats.getActivityPayout(activityKey);
      this.activityPayoutNode.textContent = `${formatNumber(payout.gains)} gains/tick`;
      this.activityCostNode.textContent = `${this.stats.getStaminaCostForActivity(activityKey)} stamina`;
    } else {
      this.activityNameNode.textContent = "No activity";
      this.activityPayoutNode.textContent = "--";
      this.activityCostNode.textContent = "--";
    }

    this.setResting(this.resting);
  }
}
