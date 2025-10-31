//! Theme tokens shared across UI components.

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Theme {
    pub table_header: &'static str,
    pub table_row: &'static str,
    pub highlight_self: &'static str,
    pub highlight_friend: &'static str,
    pub subdued_text: &'static str,
}

impl Theme {
    pub const fn default() -> Self {
        Self {
            table_header: "fg:muted bg:surface-strong",
            table_row: "fg:default bg:surface",
            highlight_self: "fg:accent-strong bg:surface-strong",
            highlight_friend: "fg:accent bg:surface",
            subdued_text: "fg:muted",
        }
    }
}
