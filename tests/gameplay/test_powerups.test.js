import test from "node:test";
import assert from "node:assert/strict";

import { Stats } from "../../src/systems/stats.js";
import {
  PowerUpEvent,
  PowerUpScheduler,
} from "../../src/gameplay/events/powerups.js";

function createScheduler(events, options = {}) {
  return new PowerUpScheduler(events, {
    baseInterval: options.baseInterval ?? 5,
    scoreInterval: options.scoreInterval ?? 1000,
    cooldownSeconds: options.cooldownSeconds ?? 0,
    random: options.random ?? (() => 0.01),
  });
}

test("power-up triggers after base interval and applies modifiers", () => {
  const stats = new Stats();
  const event = new PowerUpEvent({
    id: "test_gain",
    durationSeconds: 10,
    effect: { gainMultiplier: 2 },
  });
  const scheduler = createScheduler([event], { baseInterval: 3 });

  let triggered = null;
  for (let i = 0; i < 3; i += 1) {
    triggered = scheduler.update(1, stats) ?? triggered;
    stats.updatePowerUps(1);
  }

  assert.ok(triggered, "expected an event to trigger after interval");
  const activation = triggered.createActivation();
  const result = stats.activatePowerUp(activation);
  assert.equal(result.applied, true);
  assert.equal(result.type, "new");
  const modifiers = stats.getPowerUpModifiers();
  assert.equal(modifiers.gainMultiplier, 2);
});

test("power-up durations expire and modifiers reset", () => {
  const stats = new Stats();
  const event = new PowerUpEvent({
    id: "temp_boost",
    durationSeconds: 2,
    effect: { gainMultiplier: 1.5 },
  });
  stats.activatePowerUp(event.createActivation());

  stats.updatePowerUps(1);
  let active = stats.getActivePowerUps();
  assert.equal(active.length, 1);
  assert.ok(active[0].remaining <= 1.1 && active[0].remaining >= 0.9);

  stats.updatePowerUps(2);
  active = stats.getActivePowerUps();
  assert.equal(active.length, 0, "expected power-up to expire");
  const modifiers = stats.getPowerUpModifiers();
  assert.equal(modifiers.gainMultiplier, 1);
});

test("stacking power-ups increases multiplier", () => {
  const stats = new Stats();
  const event = new PowerUpEvent({
    id: "stack_me",
    durationSeconds: 5,
    effect: { gainMultiplier: 1.25 },
    stacking: { mode: "stack", maxStacks: 3 },
  });

  const first = stats.activatePowerUp(event.createActivation());
  assert.equal(first.type, "new");
  const second = stats.activatePowerUp(event.createActivation());
  assert.equal(second.type, "stacked");
  const modifiers = stats.getPowerUpModifiers();
  assert.ok(Math.abs(modifiers.gainMultiplier - Math.pow(1.25, 2)) < 1e-6);
});

test("score thresholds trigger events even without time interval", () => {
  const stats = new Stats();
  const event = new PowerUpEvent({
    id: "score_trigger",
    durationSeconds: 5,
    effect: { gainMultiplier: 1.4 },
    minRunGains: 200,
  });
  const scheduler = createScheduler([event], { baseInterval: 100, scoreInterval: 150 });

  stats.addGains(50);
  let triggered = scheduler.update(0, stats);
  assert.equal(triggered, null);

  stats.addGains(200);
  triggered = scheduler.update(0, stats);
  assert.ok(triggered, "expected event after surpassing score threshold");
});

test("stacking mode ignore prevents duplicate applications", () => {
  const stats = new Stats();
  const event = new PowerUpEvent({
    id: "ignore_me",
    durationSeconds: 10,
    effect: { gainMultiplier: 1.1 },
    stacking: { mode: "ignore" },
  });

  const first = stats.activatePowerUp(event.createActivation());
  assert.equal(first.type, "new");
  const second = stats.activatePowerUp(event.createActivation());
  assert.equal(second.applied, false);
  assert.equal(second.reason, "ignored");
  const modifiers = stats.getPowerUpModifiers();
  assert.equal(modifiers.gainMultiplier, 1.1);
});
