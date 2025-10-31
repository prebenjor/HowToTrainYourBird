#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Tab<T> {
    pub label: String,
    pub value: T,
}

impl<T> Tab<T> {
    pub fn new(label: impl Into<String>, value: T) -> Self {
        Self {
            label: label.into(),
            value,
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Tabs<T> {
    tabs: Vec<Tab<T>>,
    active_index: usize,
}

impl<T> Tabs<T> {
    pub fn new(tabs: Vec<Tab<T>>) -> Self {
        let active_index = if tabs.is_empty() { 0 } else { 0 };
        Self { tabs, active_index }
    }

    pub fn tabs(&self) -> &[Tab<T>] {
        &self.tabs
    }

    pub fn labels(&self) -> Vec<&str> {
        self.tabs.iter().map(|tab| tab.label.as_str()).collect()
    }

    pub fn set_active_label(&mut self, label: &str) -> bool {
        if let Some((index, _)) = self
            .tabs
            .iter()
            .enumerate()
            .find(|(_, tab)| tab.label.eq_ignore_ascii_case(label))
        {
            self.active_index = index;
            true
        } else {
            false
        }
    }

    pub fn active_index(&self) -> usize {
        self.active_index
    }

    pub fn set_active_index(&mut self, index: usize) {
        if index < self.tabs.len() {
            self.active_index = index;
        }
    }

    pub fn active(&self) -> Option<&Tab<T>> {
        self.tabs.get(self.active_index)
    }
}

impl<T: Clone> Tabs<T> {
    pub fn active_value(&self) -> Option<T> {
        self.active().map(|tab| tab.value.clone())
    }
}
