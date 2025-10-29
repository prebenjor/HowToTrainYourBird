export function getRestState(stats) {
  const stamina = stats.stamina;
  const maxStamina = stats.getMaxStamina();
  return {
    stamina,
    maxStamina,
    percent: maxStamina > 0 ? Math.min(stamina / maxStamina, 1) : 0,
  };
}

export function getRestSummary(stats) {
  const maxStamina = stats.getMaxStamina();
  const restRate = stats.getRestRatePerSecond() + stats.getPassiveStaminaRegen();
  if (restRate === 0) {
    return {
      restDuration: Infinity,
      trainingDuration: Infinity,
    };
  }
  const ticksPerSecond = stats.getTicksPerSecond();
  const trainingDuration = maxStamina / ticksPerSecond;
  const restDuration = maxStamina / restRate;
  return {
    restDuration,
    trainingDuration,
  };
}
