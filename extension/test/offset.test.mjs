import test from 'node:test';
import assert from 'node:assert/strict';
import { expectedTime, decide, DEAD_ZONE_S } from '../content/drift.js';

function targetFor(msg, now, offsetMs, duration = Infinity) {
  const shifted = expectedTime(msg, now) + offsetMs / 1000;
  return Math.max(0, Math.min(shifted, duration));
}

test('the dead zone sits above frame-grained measurement noise', () => {
  const FRAME = 1 / 60;
  assert.ok(DEAD_ZONE_S > 3 * FRAME, 'below ~3 frames it chases currentTime quantisation');
  assert.ok(DEAD_ZONE_S < 0.1, 'and it should not mask a tenth of a second');
});

test('a 90ms relay offset now falls inside the correcting range', () => {
  assert.ok(0.09 > DEAD_ZONE_S, 'this was silently ignored at a 0.15s dead zone');
  assert.equal(decide(0.09, 1).action, 'nudge');
});

test('a positive offset runs this device ahead', () => {
  const msg = { mediaTime: 100, rate: 1, paused: true, ts: 1_000_000 };
  assert.equal(targetFor(msg, 1_000_000, 0), 100);
  assert.equal(targetFor(msg, 1_000_000, 250), 100.25);
  assert.equal(targetFor(msg, 1_000_000, -250), 99.75);
});

test('offset composes with transit projection', () => {
  const msg = { mediaTime: 100, rate: 1, paused: false, ts: 1_000_000 };
  assert.ok(Math.abs(targetFor(msg, 1_000_090, 100) - 100.19) < 1e-9);
});

test('the target is clamped to the media', () => {
  const near = { mediaTime: 0.1, rate: 1, paused: true, ts: 0 };
  assert.equal(targetFor(near, 0, -2000), 0);

  const end = { mediaTime: 59.9, rate: 1, paused: true, ts: 0 };
  assert.equal(targetFor(end, 0, 2000, 60), 60);
});
