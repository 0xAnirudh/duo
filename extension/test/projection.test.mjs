import test from 'node:test';
import assert from 'node:assert/strict';
import { expectedTime, DEAD_ZONE_S } from '../content/drift.js';

const FRAME_S = 1 / 60;

function applyRaw(msg) {
  return msg.mediaTime;
}

function applyProjected(msg, now) {
  return expectedTime(msg, now);
}

test('projection removes the offset a slow relay leaves on PLAY', () => {
  for (const latencyMs of [4, 40, 90, 200]) {
    const sentAt = 1_000_000;
    const msg = { t: 'PLAY', mediaTime: 120, rate: 1, paused: false, ts: sentAt };
    const arrivedAt = sentAt + latencyMs;
    const controllerNow = 120 + latencyMs / 1000;

    const rawGap = Math.abs(applyRaw(msg) - controllerNow);
    const projGap = Math.abs(applyProjected(msg, arrivedAt) - controllerNow);

    assert.ok(
      Math.abs(rawGap - latencyMs / 1000) < 1e-9,
      `raw apply should be exactly one transit behind at ${latencyMs}ms`,
    );
    assert.ok(projGap < 1e-9, `projected apply should land dead on at ${latencyMs}ms`);
  }
});

test('an uncompensated offset under the dead zone is permanent', () => {
  const latencyMs = (DEAD_ZONE_S * 1000) / 2;
  assert.ok(latencyMs / 1000 < DEAD_ZONE_S);
  assert.ok(latencyMs / 1000 > FRAME_S, 'and it is still more than a frame at 60Hz');
});

test('a paused controller is never projected forward', () => {
  const msg = { t: 'PAUSE', mediaTime: 120, rate: 1, paused: true, ts: 1_000_000 };
  assert.equal(expectedTime(msg, 1_000_000 + 500), 120);
});

test('seeking while paused lands exactly where the controller let go', () => {
  const msg = { t: 'SEEK', mediaTime: 55.5, rate: 1, paused: true, ts: 1_000_000 };
  assert.equal(expectedTime(msg, 1_000_090), 55.5);
});

test('seeking while playing accounts for transit', () => {
  const msg = { t: 'SEEK', mediaTime: 55.5, rate: 1, paused: false, ts: 1_000_000 };
  assert.ok(Math.abs(expectedTime(msg, 1_000_090) - 55.59) < 1e-9);
});
