import test from 'node:test';
import assert from 'node:assert/strict';
import {
  check,
  recordFailure,
  recordSuccess,
  sweep,
  reset,
  MAX_PER_WINDOW,
  LOCKOUT_FAILURES,
  WINDOW_MS,
  LOCKOUT_MS,
} from '../src/rateLimit.js';

test.beforeEach(() => reset());

test('ten attempts a minute, then refused', () => {
  const now = 1_000_000;
  for (let i = 0; i < MAX_PER_WINDOW; i += 1) {
    assert.equal(check('1.2.3.4', now).allowed, true, `attempt ${i + 1} should pass`);
  }
  const blocked = check('1.2.3.4', now);
  assert.equal(blocked.allowed, false);
  assert.equal(blocked.error, 'rate_limited');
});

test('the window rolls', () => {
  const now = 1_000_000;
  for (let i = 0; i < MAX_PER_WINDOW; i += 1) check('1.2.3.4', now);
  assert.equal(check('1.2.3.4', now + WINDOW_MS + 1).allowed, true);
});

test('one address being limited does not affect another', () => {
  const now = 1_000_000;
  for (let i = 0; i < MAX_PER_WINDOW; i += 1) check('1.2.3.4', now);
  assert.equal(check('5.6.7.8', now).allowed, true);
});

test('five wrong codes locks the prober out for five minutes', () => {
  const now = 1_000_000;
  for (let i = 0; i < LOCKOUT_FAILURES; i += 1) recordFailure('9.9.9.9', now);

  const blocked = check('9.9.9.9', now);
  assert.equal(blocked.allowed, false);
  assert.equal(blocked.error, 'locked_out');
  assert.ok(blocked.retryInMs > 0 && blocked.retryInMs <= LOCKOUT_MS);

  assert.equal(check('9.9.9.9', now + LOCKOUT_MS + 1).allowed, true);
});

test('a correct code clears the failure streak', () => {
  const now = 1_000_000;

  for (let i = 0; i < LOCKOUT_FAILURES - 1; i += 1) recordFailure('4.4.4.4', now);
  recordSuccess('4.4.4.4', now);
  for (let i = 0; i < LOCKOUT_FAILURES - 1; i += 1) recordFailure('4.4.4.4', now);
  assert.equal(check('4.4.4.4', now).allowed, true);
});

test('idle buckets are swept but live lockouts are kept', () => {
  const now = 1_000_000;
  check('idle.host', now);
  for (let i = 0; i < LOCKOUT_FAILURES; i += 1) recordFailure('locked.host', now);

  const later = now + LOCKOUT_MS * 2 + 1;
  sweep(later);
  assert.equal(check('idle.host', later).allowed, true);

  const midLockout = now + 60_000;
  reset();
  for (let i = 0; i < LOCKOUT_FAILURES; i += 1) recordFailure('locked.host', now);
  sweep(midLockout);
  assert.equal(check('locked.host', midLockout).error, 'locked_out');
});
