export class ActiveModifierBadge {
  constructor(initialModifier) {
    this.element = document.createElement("div");
    this.element.className = "hud-modifier";

    this.iconNode = document.createElement("div");
    this.iconNode.className = "hud-modifier-icon";
    this.iconImage = document.createElement("img");
    this.iconImage.alt = "Modifier icon";
    this.iconNode.appendChild(this.iconImage);

    this.stackNode = document.createElement("span");
    this.stackNode.className = "hud-modifier-stack";
    this.iconNode.appendChild(this.stackNode);

    this.bodyNode = document.createElement("div");
    this.bodyNode.className = "hud-modifier-body";

    this.titleNode = document.createElement("div");
    this.titleNode.className = "hud-modifier-name";

    this.descNode = document.createElement("div");
    this.descNode.className = "hud-modifier-desc";

    this.timerNode = document.createElement("div");
    this.timerNode.className = "hud-modifier-timer";

    this.timerLabel = document.createElement("span");
    this.timerLabel.className = "hud-modifier-timer-label";

    this.progressTrack = document.createElement("div");
    this.progressTrack.className = "hud-modifier-progress";
    this.progressFill = document.createElement("div");
    this.progressFill.className = "hud-modifier-progress-fill";
    this.progressTrack.appendChild(this.progressFill);

    this.timerNode.appendChild(this.timerLabel);
    this.timerNode.appendChild(this.progressTrack);

    this.bodyNode.appendChild(this.titleNode);
    this.bodyNode.appendChild(this.descNode);
    this.bodyNode.appendChild(this.timerNode);

    this.element.appendChild(this.iconNode);
    this.element.appendChild(this.bodyNode);

    if (initialModifier) {
      this.update(initialModifier);
    }
  }

  update(modifier) {
    if (!modifier) {
      return;
    }
    this.element.dataset.modifierId = modifier.id;
    this.iconImage.src = modifier.icon || "";
    this.iconImage.alt = modifier.name || "Modifier icon";
    this.titleNode.textContent = modifier.name ?? "Unknown Modifier";
    this.descNode.textContent = modifier.description ?? "";

    const stackValue = modifier.stacks ?? 1;
    const maxStacks = modifier.maxStacks ?? stackValue;
    this.stackNode.textContent = `x${stackValue}`;
    this.stackNode.classList.toggle("is-cap", maxStacks === stackValue);

    const remainingLabel = modifier.formattedRemaining ?? "";
    this.timerNode.dataset.remaining = remainingLabel;
    this.timerNode.setAttribute("aria-label", `${remainingLabel} remaining`);
    this.timerLabel.textContent = remainingLabel;

    const progress = modifier.progress ?? 0;
    this.progressFill.style.width = `${Math.max(0, Math.min(1, progress)) * 100}%`;
  }
}
