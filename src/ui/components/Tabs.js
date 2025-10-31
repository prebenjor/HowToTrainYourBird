const DEFAULT_PERSIST_KEY = null;

function safeGetStorage(storage) {
  if (!storage) {
    return null;
  }
  try {
    // Access length to ensure storage is usable.
    void storage.length;
    return storage;
  } catch (error) {
    return null;
  }
}

export class Tabs {
  constructor(root, options) {
    const {
      tabs = [],
      persistKey = DEFAULT_PERSIST_KEY,
      storage = typeof window !== "undefined" ? window.localStorage : null,
      onChange = null,
    } = options ?? {};

    this.root = root;
    this.storage = safeGetStorage(storage);
    this.persistKey = persistKey;
    this.onChange = onChange;
    this.tabs = tabs.map((tab) => ({ ...tab }));
    this.tabLookup = new Map();
    this.panels = new Map();
    this.activeTabId = null;

    this.build();
  }

  build() {
    this.root.classList.add("tabs");

    const nav = document.createElement("div");
    nav.className = "tabs-nav";
    const panelsContainer = document.createElement("div");
    panelsContainer.className = "tabs-panels";

    this.tabs.forEach((tab, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "tab";
      button.textContent = tab.label ?? tab.id;
      button.dataset.tab = tab.id;
      button.addEventListener("click", () => this.select(tab.id));
      nav.appendChild(button);

      const panel = document.createElement("div");
      panel.className = "tab-panel";
      panel.dataset.tabPanel = tab.id;
      panelsContainer.appendChild(panel);

      this.tabLookup.set(tab.id, {
        button,
        panel,
        render: tab.render,
        rendered: false,
      });
      this.panels.set(tab.id, panel);

      if (index === 0 && !this.activeTabId) {
        this.activeTabId = tab.id;
      }
    });

    this.root.append(nav, panelsContainer);

    const persisted = this.getPersistedTab();
    if (persisted && this.tabLookup.has(persisted)) {
      this.activeTabId = persisted;
    }

    if (this.activeTabId) {
      this.select(this.activeTabId, { force: true });
    }
  }

  getPersistedTab() {
    if (!this.storage || !this.persistKey) {
      return null;
    }
    try {
      return this.storage.getItem(this.persistKey);
    } catch (error) {
      return null;
    }
  }

  persistTab(tabId) {
    if (!this.storage || !this.persistKey) {
      return;
    }
    try {
      this.storage.setItem(this.persistKey, tabId);
    } catch (error) {
      // Ignore persistence failures.
    }
  }

  select(tabId, { force = false } = {}) {
    if (!force && this.activeTabId === tabId) {
      return;
    }
    const target = this.tabLookup.get(tabId);
    if (!target) {
      return;
    }

    if (this.activeTabId && this.tabLookup.has(this.activeTabId)) {
      const current = this.tabLookup.get(this.activeTabId);
      current.button.classList.remove("is-active");
      current.panel.classList.remove("is-active");
    }

    this.activeTabId = tabId;
    target.button.classList.add("is-active");
    target.panel.classList.add("is-active");

    if (!target.rendered && typeof target.render === "function") {
      target.render(target.panel);
      target.rendered = true;
    }

    this.persistTab(tabId);
    if (typeof this.onChange === "function") {
      this.onChange(tabId);
    }
  }

  getActiveTab() {
    return this.activeTabId;
  }
}
