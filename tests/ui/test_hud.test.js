import test from "node:test";
import assert from "node:assert/strict";
import { Stats } from "../../src/systems/stats.js";
import { HudViewModel } from "../../src/ui/hud/viewModel.js";

function createHudSnapshot(stats) {
  const viewModel = new HudViewModel(stats);
  return viewModel.getSnapshot();
}

test("hud view model exposes default layout", () => {
  const stats = new Stats();
  const snapshot = createHudSnapshot(stats);

  assert.equal(snapshot.modifiers.length, 0);
  assert.equal(snapshot.combo.streak, 0);
  assert.equal(snapshot.combo.progress, 0);
  assert.ok(snapshot.event, "event snapshot exists");
  assert.equal(snapshot.event.id, "sky-race");
  assert.equal(snapshot.event.progress, 0);
});

test("combo meter increments with training ticks", () => {
  const stats = new Stats();
  const activity = stats.getSelectedActivity();

  stats.handleTrainingTick({ activityKey: activity, multiplier: 1 });
  stats.tickHudState(0.5);
  stats.handleTrainingTick({ activityKey: activity, multiplier: 1 });

  const snapshot = createHudSnapshot(stats);
  assert.equal(snapshot.combo.streak, 2);
  assert.ok(snapshot.combo.progress > 0);
  assert.ok(snapshot.combo.multiplier > 1);
});

test("combo decay slows while resting", () => {
  const stats = new Stats();
  const activity = stats.getSelectedActivity();

  stats.handleTrainingTick({ activityKey: activity, multiplier: 1 });
  const initialSnapshot = createHudSnapshot(stats);
  assert.equal(initialSnapshot.combo.timeRemaining, initialSnapshot.combo.decayWindow);

  stats.tickHudState(10, { resting: true });
  const restedSnapshot = createHudSnapshot(stats);

  assert.ok(restedSnapshot.combo.streak > 0);
  assert.ok(restedSnapshot.combo.timeRemaining > 0);
  assert.ok(restedSnapshot.combo.timeRemaining < initialSnapshot.combo.timeRemaining);
});

test("combo multiplier gains strength with prestige progress", () => {
  const stats = new Stats();
  const activity = stats.getSelectedActivity();

  for (let i = 0; i < 6; i += 1) {
    stats.handleTrainingTick({ activityKey: activity, multiplier: 1 });
  }

  const baseSnapshot = createHudSnapshot(stats);
  const baseMultiplier = baseSnapshot.combo.multiplier;

  stats.totalEggsLaid = 10;
  const prestigeSnapshot = createHudSnapshot(stats);

  assert.ok(prestigeSnapshot.combo.multiplier > baseMultiplier);
  assert.ok(prestigeSnapshot.combo.rawMultiplier >= baseSnapshot.combo.rawMultiplier);
});

test("modifiers surface in hud snapshot and expire", () => {
  const stats = new Stats();
  stats.grantModifier("test-mod", {
    name: "Test Modifier",
    description: "For testing only",
    icon: "./assets/ui/modifier-focus.svg",
    duration: 10,
    maxStacks: 3,
    stacks: 2,
  });

  let snapshot = createHudSnapshot(stats);
  assert.equal(snapshot.modifiers.length, 1);
  assert.equal(snapshot.modifiers[0].stacks, 2);
  assert.equal(snapshot.modifiers[0].formattedRemaining, "10s");

  stats.tickHudState(12);
  snapshot = createHudSnapshot(stats);
  assert.equal(snapshot.modifiers.length, 0);
});

test("event timer rotates after countdown", () => {
  const stats = new Stats();
  let snapshot = createHudSnapshot(stats);
  const initialId = snapshot.event.id;
  const remaining = snapshot.event.totalDuration;

  stats.tickHudState(remaining + 1);
  snapshot = createHudSnapshot(stats);
  assert.notEqual(snapshot.event.id, initialId);
  assert.equal(snapshot.event.progress, 0);
});

test("activity change breaks combo", () => {
  const stats = new Stats();
  const activity = stats.getSelectedActivity();
  stats.handleTrainingTick({ activityKey: activity, multiplier: 1 });
  stats.tickHudState(1);
  const alternate = Object.keys(stats.getActivityCatalog()).find((key) => key !== activity);
  if (alternate) {
    stats.levels.strength = 20;
    stats.levels.stamina = 20;
    stats.levels.recovery = 20;
    stats.levels.speed = 20;
    stats.setSelectedActivity(alternate);
  }
  const snapshot = createHudSnapshot(stats);
  assert.equal(snapshot.combo.streak, 0);
  assert.equal(snapshot.combo.lastBreakReason, "activity-change");
});
