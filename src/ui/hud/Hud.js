import { HudViewModel } from "./viewModel.js";
import { ActiveModifierBadge } from "../components/ActiveModifierBadge.js";
import { ComboMeter } from "../components/ComboMeter.js";
import { EventTimer } from "../components/EventTimer.js";

export class Hud {
  constructor(root, stats) {
    this.root = root;
    this.viewModel = new HudViewModel(stats);
    this.modifierContainer = null;
    this.emptyState = null;
    this.modifierBadges = new Map();
    this.comboMeter = null;
    this.eventTimer = null;
    if (this.root) {
      this.build();
    }
  }

  build() {
    if (!this.root) {
      return;
    }
    this.root.innerHTML = `
      <div class="hud-bar">
        <div class="hud-section hud-section--modifiers">
          <div class="hud-section-title">Active Modifiers</div>
          <div class="hud-modifier-list" data-role="modifiers"></div>
          <div class="hud-modifier-empty" data-role="empty">No active modifiers</div>
        </div>
        <div class="hud-section hud-section--combo" data-role="combo"></div>
        <div class="hud-section hud-section--event" data-role="event"></div>
      </div>
    `;

    this.modifierContainer = this.root.querySelector('[data-role="modifiers"]');
    this.emptyState = this.root.querySelector('[data-role="empty"]');

    const comboRoot = this.root.querySelector('[data-role="combo"]');
    this.comboMeter = new ComboMeter(comboRoot);

    const eventRoot = this.root.querySelector('[data-role="event"]');
    this.eventTimer = new EventTimer(eventRoot);
  }

  update() {
    if (!this.root) {
      return;
    }
    const snapshot = this.viewModel.getSnapshot();
    this.updateModifiers(snapshot.modifiers);
    this.comboMeter.update(snapshot.combo);
    this.eventTimer.update(snapshot.event);
  }

  updateModifiers(modifiers) {
    if (!this.modifierContainer) {
      return;
    }
    const activeIds = new Set();
    modifiers.forEach((modifier) => {
      activeIds.add(modifier.id);
      let badge = this.modifierBadges.get(modifier.id);
      if (!badge) {
        badge = new ActiveModifierBadge(modifier);
        this.modifierBadges.set(modifier.id, badge);
        this.modifierContainer.appendChild(badge.element);
      }
      badge.update(modifier);
    });

    Array.from(this.modifierBadges.keys()).forEach((id) => {
      if (!activeIds.has(id)) {
        const badge = this.modifierBadges.get(id);
        if (badge && badge.element.parentElement) {
          badge.element.parentElement.removeChild(badge.element);
        }
        this.modifierBadges.delete(id);
      }
    });

    if (this.emptyState) {
      this.emptyState.classList.toggle("is-hidden", modifiers.length > 0);
    }
  }
}

export function renderHud(root, stats) {
  return new Hud(root, stats);
}
