import test from 'node:test';
import assert from 'node:assert/strict';
import {
  decide,
  expectedTime,
  createRateController,
  DEAD_ZONE_S,
  HARD_SEEK_S,
  NUDGE,
} from '../content/drift.js';

test('transit time is projected forward while playing', () => {
  const msg = { mediaTime: 100, rate: 1, paused: false, ts: 1_000_000 };

  assert.equal(expectedTime(msg, 1_000_250), 100.25);
});

test('a paused controller is not projected forward', () => {
  const msg = { mediaTime: 100, rate: 1, paused: true, ts: 1_000_000 };
  assert.equal(expectedTime(msg, 1_005_000), 100);
});

test('transit is scaled by playback rate', () => {
  const msg = { mediaTime: 100, rate: 2, paused: false, ts: 1_000_000 };
  assert.equal(expectedTime(msg, 1_000_500), 101);
});

test('drift under the dead zone is ignored', () => {
  assert.equal(decide(DEAD_ZONE_S / 2, 1).action, 'hold');
  assert.equal(decide(-DEAD_ZONE_S / 2, 1).action, 'hold');
  assert.equal(decide(DEAD_ZONE_S - 0.001, 1).action, 'hold');
  assert.equal(decide(DEAD_ZONE_S + 0.001, 1).action, 'nudge');
});

test('middling drift nudges the rate in the right direction', () => {
  const ahead = decide(0.3, 1);
  assert.equal(ahead.action, 'nudge');
  assert.ok(ahead.playbackRate < 1, 'ahead of the controller means slow down');

  const behind = decide(-0.3, 1);
  assert.equal(behind.action, 'nudge');
  assert.ok(behind.playbackRate > 1, 'behind means speed up');

  assert.equal(ahead.playbackRate, 1 - NUDGE);
});

test('the nudge is relative to the current rate, not absolute', () => {
  assert.equal(decide(0.3, 2).playbackRate, 2 * (1 - NUDGE));
});

test('large drift hard seeks', () => {
  assert.equal(decide(HARD_SEEK_S + 0.01, 1).action, 'seek');
  assert.equal(decide(-3, 1).action, 'seek');
});

test('a run of nudges leaves exactly one pending reset', () => {
  const rates = [];
  const timers = new Map();
  let nextId = 1;
  const rc = createRateController({
    setRate: (r) => rates.push(r),
    delayMs: 4500,
    schedule: (fn) => {
      const id = nextId++;
      timers.set(id, fn);
      return id;
    },
    cancel: (id) => timers.delete(id),
  });

  rc.nudge(0.97, 1);
  rc.nudge(0.97, 1);
  rc.nudge(0.97, 1);
  assert.equal(timers.size, 1, 'each nudge must clear the last pending reset');

  [...timers.values()][0]();
  assert.equal(rates.at(-1), 1);
  assert.equal(rc.isPending(), false);
});

test('an explicit rate change cancels a pending restore', () => {
  const timers = new Map();
  let nextId = 1;
  const rc = createRateController({
    setRate: () => {},
    delayMs: 4500,
    schedule: (fn) => {
      const id = nextId++;
      timers.set(id, fn);
      return id;
    },
    cancel: (id) => timers.delete(id),
  });

  rc.nudge(0.97, 1);
  rc.forget();
  assert.equal(timers.size, 0, 'a deliberate speed change must not be undone later');
  assert.equal(rc.isPending(), false);
});
