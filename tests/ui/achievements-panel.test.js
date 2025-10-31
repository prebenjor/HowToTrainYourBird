import test from "node:test";
import assert from "node:assert/strict";
import { AchievementsPanel } from "../../src/ui/screens/AchievementsPanel.js";

class MemoryStorage {
  constructor() {
    this.map = new Map();
  }

  getItem(key) {
    return this.map.has(key) ? this.map.get(key) : null;
  }

  setItem(key, value) {
    this.map.set(key, String(value));
  }
}

class MockAchievementSystem {
  constructor(achievements) {
    this.stats = {};
    this.achievements = achievements.map((achievement) => ({ ...achievement }));
    this.flags = {};
  }

  getAchievementCategories() {
    const categories = new Map();
    for (const achievement of this.achievements) {
      const key = achievement.category ?? "general";
      const bucket = categories.get(key) ?? [];
      bucket.push(achievement);
      categories.set(key, bucket);
    }
    return categories;
  }

  getAchievements() {
    return this.achievements;
  }

  getFlags() {
    return this.flags;
  }
}

class FakeDocumentFragment {
  constructor() {
    this.children = [];
  }

  appendChild(node) {
    this.children.push(node);
    return node;
  }
}

class FakeElement {
  constructor(tagName) {
    this.tagName = tagName.toUpperCase();
    this.children = [];
    this.parentNode = null;
    this.dataset = {};
    this.attributes = new Map();
    this.eventListeners = new Map();
    this._textContent = "";
    this._classes = new Set();
    this.style = {};
  }

  get className() {
    return Array.from(this._classes).join(" ");
  }

  set className(value) {
    this._classes = new Set(
      (value || "")
        .split(/\s+/)
        .map((item) => item.trim())
        .filter(Boolean)
    );
  }

  get classList() {
    const element = this;
    return {
      add(...tokens) {
        tokens.forEach((token) => element._classes.add(token));
      },
      remove(...tokens) {
        tokens.forEach((token) => element._classes.delete(token));
      },
      contains(token) {
        return element._classes.has(token);
      },
      toggle(token, force) {
        if (force === true) {
          element._classes.add(token);
          return true;
        }
        if (force === false) {
          element._classes.delete(token);
          return false;
        }
        if (element._classes.has(token)) {
          element._classes.delete(token);
          return false;
        }
        element._classes.add(token);
        return true;
      },
    };
  }

  set textContent(value) {
    this._textContent = String(value);
  }

  get textContent() {
    return this._textContent;
  }

  appendChild(node) {
    if (node instanceof FakeDocumentFragment) {
      node.children.forEach((child) => this.appendChild(child));
      return node;
    }
    this.children.push(node);
    node.parentNode = this;
    return node;
  }

  append(...nodes) {
    nodes.forEach((node) => this.appendChild(node));
  }

  addEventListener(type, handler) {
    const listeners = this.eventListeners.get(type) ?? [];
    listeners.push(handler);
    this.eventListeners.set(type, listeners);
  }

  click() {
    const listeners = this.eventListeners.get("click") ?? [];
    listeners.forEach((listener) => listener({ type: "click" }));
  }
}

class FakeDocument {
  constructor() {
    this.body = new FakeElement("body");
  }

  createElement(tagName) {
    return new FakeElement(tagName);
  }

  createDocumentFragment() {
    return new FakeDocumentFragment();
  }
}

function withFakeDOM(fn) {
  return async () => {
    const originalDocument = global.document;
    const doc = new FakeDocument();
    global.document = doc;
    try {
      await fn(doc);
    } finally {
      global.document = originalDocument;
    }
  };
}

test(
  "achievements are grouped by category and lazy rendered",
  withFakeDOM(async (document) => {
    const achievements = [
      { id: "a", name: "A", description: "First", reward: "+1", category: "progression" },
      { id: "b", name: "B", description: "Second", reward: "+2", category: "prestige" },
      { id: "c", name: "C", description: "Third", reward: "+3", category: "progression" },
    ];
    const system = new MockAchievementSystem(achievements);
    const storage = new MemoryStorage();
    const root = document.createElement("div");

    const panel = new AchievementsPanel(root, system, { storage });

    assert.equal(panel.tabs.getActiveTab(), "prestige", "tabs sort categories alphabetically by label");
    const prestigePanel = panel.tabs.panels.get("prestige");
    const progressionPanel = panel.tabs.panels.get("progression");

    assert.equal(prestigePanel.children.length, 1, "initial tab renders its achievements");
    assert.equal(progressionPanel.children.length, 0, "inactive tab has not been rendered yet");

    panel.tabs.select("progression");
    assert.equal(progressionPanel.children.length, 2, "activating tab renders achievements once");
  })
);

test(
  "active tab persists via provided storage",
  withFakeDOM(async (document) => {
    const achievements = [
      { id: "a", name: "A", description: "First", reward: "+1", category: "progression" },
      { id: "b", name: "B", description: "Second", reward: "+2", category: "prestige" },
    ];
    const system = new MockAchievementSystem(achievements);
    const storage = new MemoryStorage();

    const firstRoot = document.createElement("div");
    const firstPanel = new AchievementsPanel(firstRoot, system, { storage });
    firstPanel.tabs.select("progression");
    assert.equal(storage.getItem("achievements-panel-tab"), "progression");

    const secondRoot = document.createElement("div");
    const secondPanel = new AchievementsPanel(secondRoot, system, { storage });
    assert.equal(secondPanel.tabs.getActiveTab(), "progression", "persisted tab restored on rebuild");
  })
);

test(
  "progress display handles missing metadata",
  withFakeDOM(async (document) => {
    const achievements = [
      {
        id: "mystery-progress",
        name: "Mystery",
        description: "Discover the unknown.",
        reward: "+1% Curiosity",
        category: "progression",
        getProgress: () => ({ current: 1.2345, target: null, precision: 2 }),
      },
    ];

    const system = new MockAchievementSystem(achievements);
    const root = document.createElement("div");

    const panel = new AchievementsPanel(root, system, { storage: new MemoryStorage() });
    const row = panel.rowsByAchievement.get("mystery-progress");

    assert.ok(row, "row lookup is created for the achievement");
    assert.equal(
      row.statusNode.textContent,
      "Progress: 1.23/?",
      "status omits undefined metadata and formats numbers with precision"
    );
  })
);
