export const WINDOW_MS = 60_000;
export const MAX_PER_WINDOW = 10;
export const LOCKOUT_FAILURES = 5;
export const LOCKOUT_MS = 5 * 60_000;

const buckets = new Map();

function bucketFor(ip, now) {
  let bucket = buckets.get(ip);
  if (!bucket) {
    bucket = { count: 0, windowStart: now, failures: 0, lockedUntil: 0, seen: now };
    buckets.set(ip, bucket);
  }
  if (now - bucket.windowStart >= WINDOW_MS) {
    bucket.count = 0;
    bucket.windowStart = now;
  }
  bucket.seen = now;
  return bucket;
}

export function check(ip, now = Date.now()) {
  const bucket = bucketFor(ip, now);

  if (bucket.lockedUntil > now) {
    return { allowed: false, error: 'locked_out', retryInMs: bucket.lockedUntil - now };
  }

  if (bucket.count >= MAX_PER_WINDOW) {
    return {
      allowed: false,
      error: 'rate_limited',
      retryInMs: bucket.windowStart + WINDOW_MS - now,
    };
  }

  bucket.count += 1;
  return { allowed: true };
}

export function recordFailure(ip, now = Date.now()) {
  const bucket = bucketFor(ip, now);
  bucket.failures += 1;
  if (bucket.failures >= LOCKOUT_FAILURES) {
    bucket.lockedUntil = now + LOCKOUT_MS;
    bucket.failures = 0;
  }
  return bucket.lockedUntil > now;
}

export function recordSuccess(ip, now = Date.now()) {
  const bucket = bucketFor(ip, now);
  bucket.failures = 0;
}

export function sweep(now = Date.now()) {
  const cutoff = now - Math.max(WINDOW_MS, LOCKOUT_MS) * 2;
  let removed = 0;
  for (const [ip, bucket] of buckets) {
    if (bucket.seen < cutoff && bucket.lockedUntil < now) {
      buckets.delete(ip);
      removed += 1;
    }
  }
  return removed;
}

export function clientIp(socket) {
  const forwarded = socket.handshake?.headers?.['x-forwarded-for'];
  if (forwarded) return String(forwarded).split(',')[0].trim();
  return socket.handshake?.address ?? 'unknown';
}

export function reset() {
  buckets.clear();
}
