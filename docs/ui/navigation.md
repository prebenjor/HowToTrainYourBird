# Top Navigation Tabs

The primary application views are now exposed through a top tab bar rendered by `TopNavTabs` (`src/ui/components/top_nav.js`). The component drives the lightweight hash router in `src/ui/navigation/router.js`, allowing screens to switch without reloading the page.

## Available routes

| Route id      | Tab label            | Panel id            | Contents                                      |
| ------------- | -------------------- | ------------------- | --------------------------------------------- |
| `dashboard`   | Overview             | `screen-dashboard`  | Bird display, stats, and training progress.   |
| `development` | Training & Gamble    | `screen-development`| Upgrade shop and gamble modal controls.       |
| `legacy`      | Legacy Progress      | `screen-legacy`     | Achievement tracker and prestige actions.     |

## Interaction patterns

* Tabs expose `role="tab"` semantics with `aria-selected`, `aria-controls`, and `aria-current="page"` attributes so assistive tech announces the active view.
* Arrow keys cycle focus between tabs, while `Home`/`End` jump to the first or last tab. `Enter` and `Space` select the focused tab.
* Panels implement `role="tabpanel"` and toggle `hidden`, `aria-hidden`, and `tabindex` values when their tab selection changes.

To add an additional tab, append a route id to the router configuration in `src/main.js` and extend the tab definition array passed to `TopNavTabs` with the new label and panel id.
