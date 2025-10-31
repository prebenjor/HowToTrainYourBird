export class EventTimer {
  constructor(root) {
    this.root = root;
    this.root.classList.add("hud-event");
    this.build();
  }

  build() {
    this.root.innerHTML = `
      <div class="hud-section-title">Next Event</div>
      <div class="hud-event-body">
        <div class="hud-event-header">
          <div class="hud-event-icon" data-role="icon"></div>
          <div class="hud-event-name" data-role="name">Unknown Event</div>
        </div>
        <div class="hud-event-timer" data-role="timer">No events scheduled</div>
        <div class="hud-event-progress">
          <div class="hud-event-progress-fill" data-role="fill"></div>
        </div>
        <div class="hud-event-reward" data-role="reward"></div>
      </div>
    `;

    this.iconNode = this.root.querySelector('[data-role="icon"]');
    this.nameNode = this.root.querySelector('[data-role="name"]');
    this.timerNode = this.root.querySelector('[data-role="timer"]');
    this.fillNode = this.root.querySelector('[data-role="fill"]');
    this.rewardNode = this.root.querySelector('[data-role="reward"]');
  }

  update(event) {
    if (!event) {
      this.root.classList.add("is-idle");
      this.iconNode.innerHTML = "";
      this.nameNode.textContent = "No event scheduled";
      this.timerNode.textContent = "-";
      this.fillNode.style.width = "0%";
      this.rewardNode.textContent = "";
      return;
    }

    this.root.classList.remove("is-idle");
    this.root.dataset.eventId = event.id ?? "";
    this.nameNode.textContent = event.name ?? "Upcoming Event";
    this.timerNode.textContent = `Starts in ${event.formattedRemaining ?? "0s"}`;
    this.rewardNode.textContent = event.reward ? `Reward: ${event.reward}` : "";

    this.iconNode.innerHTML = "";
    if (event.icon) {
      const img = document.createElement("img");
      img.src = event.icon;
      img.alt = `${event.name ?? "Event"} icon`;
      this.iconNode.appendChild(img);
    }

    const progress = Math.max(0, Math.min(1, event.progress ?? 0));
    this.fillNode.style.width = `${progress * 100}%`;
  }
}
