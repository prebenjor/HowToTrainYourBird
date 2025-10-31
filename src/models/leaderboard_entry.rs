#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum LeaderboardCategory {
    Global,
    Friends,
    PersonalBest,
}

impl LeaderboardCategory {
    pub fn label(&self) -> &'static str {
        match self {
            Self::Global => "Global",
            Self::Friends => "Friends",
            Self::PersonalBest => "Personal Best",
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum HighlightKind {
    None,
    Player,
    Friend,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct LeaderboardEntryMetadata {
    pub streak_days: u32,
    pub last_played: String,
}

impl LeaderboardEntryMetadata {
    pub fn new(streak_days: u32, last_played: impl Into<String>) -> Self {
        Self {
            streak_days,
            last_played: last_played.into(),
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct LeaderboardEntry {
    pub position: u32,
    pub player_name: String,
    pub score: u64,
    pub is_friend: bool,
    pub is_self: bool,
    pub metadata: LeaderboardEntryMetadata,
}

impl LeaderboardEntry {
    pub fn new(
        position: u32,
        player_name: impl Into<String>,
        score: u64,
        is_friend: bool,
        is_self: bool,
        metadata: LeaderboardEntryMetadata,
    ) -> Self {
        Self {
            position,
            player_name: player_name.into(),
            score,
            is_friend,
            is_self,
            metadata,
        }
    }

    pub fn highlight_kind(&self) -> HighlightKind {
        if self.is_self {
            HighlightKind::Player
        } else if self.is_friend {
            HighlightKind::Friend
        } else {
            HighlightKind::None
        }
    }
}
