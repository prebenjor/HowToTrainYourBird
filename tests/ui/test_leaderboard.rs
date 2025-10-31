use std::collections::HashMap;

use howtotrainyourbird::models::leaderboard_entry::{
    LeaderboardCategory, LeaderboardEntry, LeaderboardEntryMetadata,
};
use howtotrainyourbird::services::leaderboard_client::{
    InMemoryLeaderboardClient, LeaderboardData,
};
use howtotrainyourbird::ui::screens::leaderboard::LeaderboardScreen;
use howtotrainyourbird::ui::theme::Theme;

fn build_entry(
    position: u32,
    name: &str,
    score: u64,
    is_friend: bool,
    is_self: bool,
    streak: u32,
    last_played: &str,
) -> LeaderboardEntry {
    let metadata = LeaderboardEntryMetadata::new(streak, last_played.to_string());
    LeaderboardEntry::new(
        position,
        name.to_string(),
        score,
        is_friend,
        is_self,
        metadata,
    )
}

fn build_dataset() -> LeaderboardData {
    let mut map = HashMap::new();

    let global = vec![
        build_entry(
            1,
            "SkyTalons",
            1_240_000,
            false,
            false,
            42,
            "2024-05-01 12:00 UTC",
        ),
        build_entry(
            2,
            "PlayerZero",
            1_030_500,
            true,
            true,
            60,
            "2024-05-02 12:00 UTC",
        ),
        build_entry(
            3,
            "WingsMcGraw",
            980_000,
            true,
            false,
            28,
            "2024-04-28 12:00 UTC",
        ),
        build_entry(
            4,
            "Chonkster",
            870_500,
            false,
            false,
            7,
            "2024-04-25 12:00 UTC",
        ),
    ];

    let friends = vec![
        build_entry(
            1,
            "PlayerZero",
            1_030_500,
            true,
            true,
            60,
            "2024-05-02 12:00 UTC",
        ),
        build_entry(
            2,
            "WingsMcGraw",
            980_000,
            true,
            false,
            28,
            "2024-04-28 12:00 UTC",
        ),
    ];

    let personal_best = vec![build_entry(
        12,
        "PlayerZero",
        1_030_500,
        true,
        true,
        60,
        "2024-05-02 12:00 UTC",
    )];

    map.insert(LeaderboardCategory::Global, global);
    map.insert(LeaderboardCategory::Friends, friends);
    map.insert(LeaderboardCategory::PersonalBest, personal_best);

    LeaderboardData::new(map)
}

#[test]
fn default_tab_renders_global_scores() {
    let data = build_dataset();
    let client = InMemoryLeaderboardClient::new(data.clone());
    let screen = LeaderboardScreen::new(client, Theme::default());

    let rendered = screen.render_active().expect("global tab renders");

    assert_eq!(rendered.active_tab, "Global");
    assert_eq!(
        rendered.headers,
        vec!["Rank", "Player", "Score", "Streak", "Last Played"]
    );
    assert_eq!(
        rendered.rows.len(),
        data.entries_for(LeaderboardCategory::Global).len()
    );
    assert!(rendered
        .rows
        .iter()
        .any(|row| row.player_name == "PlayerZero"
            && row.highlight_style == Theme::default().highlight_self));
}

#[test]
fn friends_tab_highlights_social_circle() {
    let data = build_dataset();
    let client = InMemoryLeaderboardClient::new(data);
    let mut screen = LeaderboardScreen::new(client, Theme::default());

    assert!(screen.tabs_mut().set_active_label("Friends"));
    let rendered = screen.render_active().expect("friends tab renders");

    assert_eq!(rendered.active_tab, "Friends");
    assert_eq!(rendered.rows.len(), 2);
    assert!(rendered.rows.iter().all(|row| row.highlight_style
        == Theme::default().highlight_friend
        || row.highlight_style == Theme::default().highlight_self));
}

#[test]
fn personal_best_shows_single_entry_with_metadata() {
    let data = build_dataset();
    let client = InMemoryLeaderboardClient::new(data);
    let mut screen = LeaderboardScreen::new(client, Theme::default());
    assert!(screen.tabs_mut().set_active_label("Personal Best"));

    let rendered = screen.render_active().expect("personal best tab renders");

    assert_eq!(rendered.active_tab, "Personal Best");
    assert_eq!(rendered.rows.len(), 1);
    let row = &rendered.rows[0];
    assert!(row.streak.contains("60 day streak"));
    assert!(row.last_played.contains("2024-05-02"));
    assert_eq!(row.highlight_style, Theme::default().highlight_self);
    assert_eq!(row.metadata_style, Theme::default().subdued_text);
}
