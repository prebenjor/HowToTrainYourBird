const DEFAULT_COMBO = {
  streak: 0,
  best: 0,
  multiplier: 1,
  timeRemaining: 0,
  decayWindow: 6,
  lastBreakReason: null,
};

function formatSeconds(seconds) {
  if (seconds == null || Number.isNaN(seconds)) {
    return "0s";
  }
  const clamped = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(clamped / 60);
  const secs = clamped % 60;
  if (minutes > 0) {
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  }
  return `${secs}s`;
}

export class HudViewModel {
  constructor(stats) {
    this.stats = stats;
  }

  getSnapshot() {
    const hudSnapshot = this.stats.getHudSnapshot();
    const combo = hudSnapshot.combo ?? { ...DEFAULT_COMBO };
    const modifiers = (hudSnapshot.modifiers ?? []).map((modifier) => {
      const remainingSeconds = Math.max(0, modifier.timeRemaining ?? 0);
      const durationSeconds = modifier.duration ?? remainingSeconds;
      const progress = durationSeconds > 0 ? remainingSeconds / durationSeconds : 0;
      return {
        id: modifier.id,
        name: modifier.name,
        description: modifier.description,
        icon: modifier.icon,
        stacks: modifier.stacks ?? 1,
        maxStacks: modifier.maxStacks ?? modifier.stacks ?? 1,
        remainingSeconds,
        formattedRemaining: formatSeconds(remainingSeconds),
        durationSeconds,
        progress: Math.max(0, Math.min(1, progress)),
      };
    });

    const event = hudSnapshot.event
      ? {
          ...hudSnapshot.event,
          timeRemaining: Math.max(0, hudSnapshot.event.timeRemaining ?? 0),
          totalDuration: hudSnapshot.event.totalDuration ?? hudSnapshot.event.timeRemaining ?? 0,
          formattedRemaining: formatSeconds(hudSnapshot.event.timeRemaining ?? 0),
          progress:
            hudSnapshot.event.totalDuration && hudSnapshot.event.totalDuration > 0
              ? Math.max(
                  0,
                  Math.min(
                    1,
                    (hudSnapshot.event.totalDuration - (hudSnapshot.event.timeRemaining ?? 0)) /
                      hudSnapshot.event.totalDuration
                  )
                )
              : 0,
        }
      : null;

    const comboProgress = combo.decayWindow > 0 ? combo.timeRemaining / combo.decayWindow : 0;

    return {
      modifiers,
      combo: {
        ...combo,
        formattedRemaining: formatSeconds(combo.timeRemaining ?? 0),
        progress: Math.max(0, Math.min(1, comboProgress || 0)),
      },
      event,
    };
  }
}
