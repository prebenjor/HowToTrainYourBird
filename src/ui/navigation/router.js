export class Router {
  constructor({ routes = [], defaultRoute = null } = {}) {
    this.routes = Array.isArray(routes) ? [...routes] : [];
    this.routeSet = new Set(this.routes);
    this.defaultRoute = defaultRoute || this.routes[0] || null;
    this.listeners = new Set();
    this.currentRoute = this.normalize(
      window.location.hash.replace(/^#/, "")
    );

    if (!this.currentRoute) {
      this.currentRoute = this.defaultRoute;
    }

    if (this.currentRoute) {
      this.updateHash(this.currentRoute, { replace: true });
    }

    this.handleHashChange = this.handleHashChange.bind(this);
    window.addEventListener("hashchange", this.handleHashChange);
  }

  normalize(route) {
    if (typeof route !== "string" || route.length === 0) {
      return null;
    }
    return this.routeSet.has(route) ? route : null;
  }

  updateHash(route, { replace = false } = {}) {
    const newHash = `#${route}`;
    if (replace) {
      if (window.location.hash !== newHash) {
        window.history.replaceState(null, "", newHash);
      }
      return;
    }

    if (window.location.hash !== newHash) {
      window.location.hash = route;
    } else {
      // When the hash is unchanged, manually trigger listeners.
      this.handleHashChange();
    }
  }

  handleHashChange() {
    const raw = window.location.hash.replace(/^#/, "");
    const normalized = this.normalize(raw);
    const nextRoute = normalized || this.defaultRoute;

    if (!nextRoute) {
      return;
    }

    if (!normalized) {
      this.updateHash(nextRoute, { replace: true });
    }

    if (nextRoute !== this.currentRoute) {
      this.currentRoute = nextRoute;
      this.notify();
    } else if (normalized) {
      // Ensure listeners are notified when navigating to the same hash programmatically.
      this.notify();
    }
  }

  getCurrentRoute() {
    return this.currentRoute;
  }

  navigate(route) {
    const normalized = this.normalize(route);
    if (!normalized) {
      return false;
    }

    if (normalized === this.currentRoute) {
      this.updateHash(normalized, { replace: true });
      this.notify();
      return true;
    }

    this.currentRoute = normalized;
    this.updateHash(normalized);
    return true;
  }

  notify() {
    this.listeners.forEach((listener) => listener(this.currentRoute));
  }

  subscribe(listener, { emitCurrent = true } = {}) {
    if (typeof listener !== "function") {
      return () => {};
    }
    this.listeners.add(listener);
    if (emitCurrent && this.currentRoute) {
      listener(this.currentRoute);
    }
    return () => {
      this.listeners.delete(listener);
    };
  }
}
