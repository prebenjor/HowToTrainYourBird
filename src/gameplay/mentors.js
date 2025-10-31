const BONUS_STATS = ["strength", "recovery", "speed"];

export const MENTOR_CATALOG = [
  {
    id: "mentor-ironclaw",
    name: "Ironclaw Coach",
    description: "Veteran bruiser who teaches impeccable form for heavier lifts.",
    cost: 3,
    bonuses: {
      strength: 0.15,
    },
  },
  {
    id: "mentor-windwhisper",
    name: "Wind Whisperer",
    description: "Track tactician that shaves precious seconds off every sprint.",
    cost: 3,
    bonuses: {
      speed: 0.12,
    },
  },
  {
    id: "mentor-sunfeather",
    name: "Sunfeather Sage",
    description: "Meditative healer who optimises recovery breaths between sets.",
    cost: 2,
    bonuses: {
      recovery: 0.18,
    },
  },
  {
    id: "mentor-tempest-twins",
    name: "Tempest Twins",
    description: "Dynamic duo whose drills blend explosive power with agile footing.",
    cost: 5,
    bonuses: {
      strength: 0.06,
      speed: 0.06,
    },
  },
];

export const MENTOR_INDEX = new Map(
  MENTOR_CATALOG.map((mentor) => [mentor.id, mentor])
);

export function getMentorById(id) {
  return MENTOR_INDEX.get(id) ?? null;
}

export function getMentorBonusStats() {
  return [...BONUS_STATS];
}
