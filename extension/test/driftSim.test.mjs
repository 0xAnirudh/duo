import test from 'node:test';
import assert from 'node:assert/strict';
import { decide, expectedTime } from '../content/drift.js';

function simulate({
  minutes = 30,
  decodeError = 0.002,
  latencyMs = 90,
  heartbeatMs = 3000,
  resetMs = 4500,
  stalls = [],
}) {
  const stepMs = 50;
  const totalMs = minutes * 60 * 1000;

  let now = 0;
  let controller = 0;
  let follower = 0;
  let followerRate = 1;
  let resetAt = null;
  let nextHeartbeat = 0;
  const inFlight = [];

  let worst = 0;
  let nudges = 0;
  const seekTimes = [];

  const stalled = () =>
    stalls.some((s) => now >= s.atS * 1000 && now < (s.atS + s.forS) * 1000);

  while (now < totalMs) {
    const dt = stepMs / 1000;
    controller += dt;
    if (!stalled()) follower += dt * followerRate * (1 + decodeError);

    if (now >= nextHeartbeat) {
      inFlight.push({
        arriveAt: now + latencyMs,
        msg: { mediaTime: controller, rate: 1, paused: false, ts: now },
      });
      nextHeartbeat += heartbeatMs;
    }

    while (inFlight.length && inFlight[0].arriveAt <= now) {
      const { msg } = inFlight.shift();
      const expected = expectedTime(msg, now);
      const plan = decide(follower - expected, msg.rate);

      if (plan.action === 'seek') {
        follower = expected;
        followerRate = msg.rate;
        resetAt = null;
        seekTimes.push(now / 1000);
      } else if (plan.action === 'nudge') {
        followerRate = plan.playbackRate;
        resetAt = now + resetMs;
        nudges += 1;
      }
    }

    if (resetAt !== null && now >= resetAt) {
      followerRate = 1;
      resetAt = null;
    }

    if (now > 10_000) worst = Math.max(worst, Math.abs(follower - controller));
    now += stepMs;
  }

  return {
    worst,
    nudges,
    seekTimes,
    seeks: seekTimes.length,
    finalGap: Math.abs(follower - controller),
  };
}

test('30 minutes of imperfect decoding stays inside 0.2s', () => {
  const { worst, seeks, finalGap } = simulate({ minutes: 30 });
  assert.ok(worst < 0.2, `worst gap was ${worst.toFixed(3)}s`);
  assert.equal(seeks, 0, 'steady-state drift must never need a hard seek');
  assert.ok(finalGap < 0.2, `ended ${finalGap.toFixed(3)}s apart`);
});

test('a buffer stall is what the hard seek is for, and it settles after', () => {
  const stallEnd = 130;
  const { seeks, seekTimes, finalGap } = simulate({
    minutes: 10,
    stalls: [{ atS: 120, forS: 10 }],
  });

  assert.ok(seeks >= 1, 'the stall must be corrected');

  const after = seekTimes.filter((t) => t > stallEnd + 5);
  assert.deepEqual(after, [], `kept seeking after recovery at ${after}`);
  assert.ok(finalGap < 0.2, `ended ${finalGap.toFixed(3)}s apart`);
});

test('a worse decoder still converges without seeking', () => {
  const { worst, seeks } = simulate({ minutes: 30, decodeError: 0.01 });
  assert.ok(worst < 0.5, `worst gap was ${worst.toFixed(3)}s`);
  assert.equal(seeks, 0);
});

test('a slow relay does not induce false corrections', () => {
  const { worst, seeks } = simulate({ minutes: 10, latencyMs: 250, decodeError: 0 });
  assert.equal(seeks, 0);
  assert.ok(worst < 0.15, `worst gap was ${worst.toFixed(3)}s`);
});
