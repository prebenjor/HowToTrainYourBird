use std::collections::HashMap;
use std::fmt;

use crate::models::leaderboard_entry::{LeaderboardCategory, LeaderboardEntry};

#[derive(Debug, Clone)]
pub struct LeaderboardData {
    entries: HashMap<LeaderboardCategory, Vec<LeaderboardEntry>>,
}

impl LeaderboardData {
    pub fn new(entries: HashMap<LeaderboardCategory, Vec<LeaderboardEntry>>) -> Self {
        Self { entries }
    }

    pub fn entries_for(&self, category: LeaderboardCategory) -> &[LeaderboardEntry] {
        self.entries
            .get(&category)
            .map(|vec| vec.as_slice())
            .unwrap_or(&[])
    }
}

#[derive(Debug, Clone)]
pub struct LeaderboardError {
    message: String,
}

impl LeaderboardError {
    pub fn new(message: impl Into<String>) -> Self {
        Self {
            message: message.into(),
        }
    }
}

impl fmt::Display for LeaderboardError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{}", self.message)
    }
}

impl std::error::Error for LeaderboardError {}

pub trait LeaderboardClient {
    fn fetch_category(
        &self,
        category: LeaderboardCategory,
    ) -> Result<Vec<LeaderboardEntry>, LeaderboardError>;

    fn fetch_all(&self) -> Result<LeaderboardData, LeaderboardError> {
        let mut entries = HashMap::new();
        for category in [
            LeaderboardCategory::Global,
            LeaderboardCategory::Friends,
            LeaderboardCategory::PersonalBest,
        ] {
            let data = self.fetch_category(category.clone())?;
            entries.insert(category, data);
        }
        Ok(LeaderboardData::new(entries))
    }
}

pub struct InMemoryLeaderboardClient {
    data: LeaderboardData,
}

impl InMemoryLeaderboardClient {
    pub fn new(data: LeaderboardData) -> Self {
        Self { data }
    }
}

impl LeaderboardClient for InMemoryLeaderboardClient {
    fn fetch_category(
        &self,
        category: LeaderboardCategory,
    ) -> Result<Vec<LeaderboardEntry>, LeaderboardError> {
        Ok(self.data.entries_for(category).iter().cloned().collect())
    }

    fn fetch_all(&self) -> Result<LeaderboardData, LeaderboardError> {
        Ok(self.data.clone())
    }
}
