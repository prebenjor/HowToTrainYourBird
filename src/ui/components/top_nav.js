const KEY_NEXT = ["ArrowRight", "ArrowDown"];
const KEY_PREV = ["ArrowLeft", "ArrowUp"];

export class TopNavTabs {
  constructor(element, router, tabs, options = {}) {
    if (!element) {
      throw new Error("TopNavTabs requires a valid container element");
    }
    this.element = element;
    this.router = router;
    this.tabs = Array.isArray(tabs) ? [...tabs] : [];
    this.options = options;
    this.buttonMap = new Map();
    this.panels = new Map();

    this.build();
    this.unsubscribe = this.router.subscribe((route) => this.update(route));
  }

  build() {
    this.element.classList.add("top-nav");
    this.element.setAttribute("role", "tablist");
    this.element.setAttribute(
      "aria-label",
      this.options.ariaLabel || "Primary navigation"
    );

    this.tabs.forEach((tab, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.id = tab.buttonId || `tab-${tab.id}`;
      button.className = "top-nav__tab";
      button.dataset.route = tab.id;
      button.setAttribute("role", "tab");
      button.setAttribute("aria-controls", tab.panelId);
      button.textContent = tab.label;

      button.addEventListener("click", () => {
        this.router.navigate(tab.id);
      });

      button.addEventListener("keydown", (event) => {
        this.handleKeydown(event, index);
      });

      this.element.appendChild(button);
      this.buttonMap.set(tab.id, button);

      const panel = document.getElementById(tab.panelId);
      if (panel) {
        if (!panel.hasAttribute("role")) {
          panel.setAttribute("role", "tabpanel");
        }
        panel.setAttribute("aria-labelledby", button.id);
        panel.tabIndex = -1;
        this.panels.set(tab.id, panel);
      }
    });
  }

  handleKeydown(event, index) {
    const key = event.key;
    if (KEY_NEXT.includes(key)) {
      event.preventDefault();
      const nextIndex = (index + 1) % this.tabs.length;
      this.focusTab(nextIndex);
      return;
    }

    if (KEY_PREV.includes(key)) {
      event.preventDefault();
      const prevIndex = (index - 1 + this.tabs.length) % this.tabs.length;
      this.focusTab(prevIndex);
      return;
    }

    if (key === "Home") {
      event.preventDefault();
      this.focusTab(0);
      return;
    }

    if (key === "End") {
      event.preventDefault();
      this.focusTab(this.tabs.length - 1);
      return;
    }

    if (key === " " || key === "Enter") {
      event.preventDefault();
      const tab = this.tabs[index];
      if (tab) {
        this.router.navigate(tab.id);
      }
    }
  }

  focusTab(index) {
    const tab = this.tabs[index];
    if (!tab) {
      return;
    }
    const button = this.buttonMap.get(tab.id);
    if (button) {
      button.focus();
    }
  }

  update(route) {
    const available = this.tabs.map((tab) => tab.id);
    const isValidRoute = available.includes(route);
    const activeRoute = isValidRoute ? route : available[0];

    this.tabs.forEach((tab) => {
      const button = this.buttonMap.get(tab.id);
      const panel = this.panels.get(tab.id);
      const isActive = tab.id === activeRoute;

      if (button) {
        button.classList.toggle("is-active", isActive);
        button.setAttribute("aria-selected", isActive ? "true" : "false");
        button.setAttribute("tabindex", isActive ? "0" : "-1");
        if (isActive) {
          button.setAttribute("aria-current", "page");
        } else {
          button.removeAttribute("aria-current");
        }
      }

      if (panel) {
        panel.hidden = !isActive;
        panel.setAttribute("aria-hidden", isActive ? "false" : "true");
        panel.tabIndex = isActive ? 0 : -1;
      }
    });

    if (!isValidRoute && activeRoute) {
      this.router.navigate(activeRoute);
    }
  }
}
