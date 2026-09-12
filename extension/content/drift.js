export const DEAD_ZONE_S = 0.08;
export const HARD_SEEK_S = 0.5;
export const NUDGE = 0.03;

export function expectedTime(msg, nowMs) {
  const transit = (nowMs - msg.ts) / 1000;
  return msg.paused ? msg.mediaTime : msg.mediaTime + transit * msg.rate;
}

export function decide(drift, rate) {
  const magnitude = Math.abs(drift);

  if (magnitude < DEAD_ZONE_S) return { action: 'hold' };

  if (magnitude < HARD_SEEK_S) {
    return { action: 'nudge', playbackRate: rate * (drift > 0 ? 1 - NUDGE : 1 + NUDGE) };
  }

  return { action: 'seek' };
}

export function createRateController({
  setRate,
  delayMs,
  schedule = setTimeout,
  cancel = clearTimeout,
}) {
  let pendingReset = null;

  function armReset(baseRate) {
    cancel(pendingReset);
    pendingReset = schedule(() => {
      pendingReset = null;
      setRate(baseRate);
    }, delayMs);
  }

  return {
    nudge(targetRate, baseRate) {
      setRate(targetRate);
      armReset(baseRate);
    },
    forget() {
      cancel(pendingReset);
      pendingReset = null;
    },
    isPending: () => pendingReset !== null,
  };
}
