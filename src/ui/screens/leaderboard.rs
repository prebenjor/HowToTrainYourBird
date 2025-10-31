use crate::models::leaderboard_entry::{HighlightKind, LeaderboardCategory, LeaderboardEntry};
use crate::services::leaderboard_client::{LeaderboardClient, LeaderboardError};
use crate::ui::components::tabs::{Tab, Tabs};
use crate::ui::theme::Theme;

const HEADERS: [&str; 5] = ["Rank", "Player", "Score", "Streak", "Last Played"];

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct RenderedLeaderboard {
    pub tab_labels: Vec<String>,
    pub active_tab: String,
    pub headers: Vec<&'static str>,
    pub rows: Vec<RenderedLeaderboardRow>,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct RenderedLeaderboardRow {
    pub position: u32,
    pub player_name: String,
    pub score: u64,
    pub streak: String,
    pub last_played: String,
    pub highlight_style: &'static str,
    pub metadata_style: &'static str,
}

impl RenderedLeaderboardRow {
    fn from_entry(entry: LeaderboardEntry, theme: &Theme) -> Self {
        let streak = format!("{} day streak", entry.metadata.streak_days);
        let last_played = entry.metadata.last_played.clone();
        let highlight_style = match entry.highlight_kind() {
            HighlightKind::Player => theme.highlight_self,
            HighlightKind::Friend => theme.highlight_friend,
            HighlightKind::None => theme.table_row,
        };

        Self {
            position: entry.position,
            player_name: entry.player_name,
            score: entry.score,
            streak,
            last_played,
            highlight_style,
            metadata_style: theme.subdued_text,
        }
    }
}

pub struct LeaderboardScreen<C> {
    client: C,
    tabs: Tabs<LeaderboardCategory>,
    theme: Theme,
}

impl<C: LeaderboardClient> LeaderboardScreen<C> {
    pub fn new(client: C, theme: Theme) -> Self {
        let tabs = Tabs::new(vec![
            Tab::new(
                LeaderboardCategory::Global.label(),
                LeaderboardCategory::Global,
            ),
            Tab::new(
                LeaderboardCategory::Friends.label(),
                LeaderboardCategory::Friends,
            ),
            Tab::new(
                LeaderboardCategory::PersonalBest.label(),
                LeaderboardCategory::PersonalBest,
            ),
        ]);

        Self {
            client,
            tabs,
            theme,
        }
    }

    pub fn tabs(&self) -> &Tabs<LeaderboardCategory> {
        &self.tabs
    }

    pub fn tabs_mut(&mut self) -> &mut Tabs<LeaderboardCategory> {
        &mut self.tabs
    }

    pub fn render_active(&self) -> Result<RenderedLeaderboard, LeaderboardError> {
        let category = self
            .tabs
            .active_value()
            .unwrap_or(LeaderboardCategory::Global);
        self.render_for(category)
    }

    pub fn render_for(
        &self,
        category: LeaderboardCategory,
    ) -> Result<RenderedLeaderboard, LeaderboardError> {
        let entries = self.client.fetch_category(category)?;
        let rows = entries
            .into_iter()
            .map(|entry| RenderedLeaderboardRow::from_entry(entry, &self.theme))
            .collect();

        Ok(RenderedLeaderboard {
            tab_labels: self
                .tabs
                .labels()
                .into_iter()
                .map(|label| label.to_string())
                .collect(),
            active_tab: category.label().to_string(),
            headers: HEADERS.to_vec(),
            rows,
        })
    }
}
