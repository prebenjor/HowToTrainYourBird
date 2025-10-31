import test from "node:test";
import assert from "node:assert/strict";

import { Stats } from "../../src/systems/stats.js";

class MemoryStorage {
  constructor() {
    this.store = new Map();
  }

  get length() {
    return this.store.size;
  }

  getItem(key) {
    return this.store.has(key) ? this.store.get(key) : null;
  }

  setItem(key, value) {
    this.store.set(key, String(value));
  }

  removeItem(key) {
    this.store.delete(key);
  }

  clear() {
    this.store.clear();
  }
}

test("mentors can be unlocked with eggs and persist to storage", () => {
  const storage = new MemoryStorage();
  const stats = new Stats({ storage });
  const mentor = Stats.MENTOR_CATALOG[0];
  assert.ok(mentor, "expected at least one mentor definition");

  stats.eggs = mentor.cost;
  const unlocked = stats.unlockMentor(mentor.id);
  assert.equal(unlocked, true);
  assert.equal(stats.isMentorUnlocked(mentor.id), true);
  assert.equal(stats.eggs, 0);
  const payload = JSON.parse(storage.getItem("howtotrainyourbird:mentors"));
  assert.deepEqual(payload, { mentors: [mentor.id] });
});

test("mentor bonuses affect stat calculations", () => {
  const strengthMentor = Stats.MENTOR_CATALOG.find(
    (mentor) => mentor.bonuses?.strength
  );
  assert.ok(strengthMentor, "expected mentor with strength bonus");

  const stats = new Stats();
  const base = stats.getStrengthValue();
  stats.eggs = strengthMentor.cost;
  assert.equal(stats.unlockMentor(strengthMentor.id), true);
  const boosted = stats.getStrengthValue();
  const expected = base * (1 + strengthMentor.bonuses.strength);
  assert.ok(Math.abs(boosted - expected) < 1e-9);
});

test("mentor unlocks load from storage on new session", () => {
  const storage = new MemoryStorage();
  const mentor = Stats.MENTOR_CATALOG[0];
  const first = new Stats({ storage });
  first.eggs = mentor.cost;
  assert.equal(first.unlockMentor(mentor.id), true);

  const second = new Stats({ storage });
  assert.equal(second.isMentorUnlocked(mentor.id), true);
  const snapshot = second.getMentorSnapshots().find((entry) => entry.id === mentor.id);
  assert.ok(snapshot?.unlocked, "mentor should be marked unlocked after reload");
});
