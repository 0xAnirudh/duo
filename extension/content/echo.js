export function createSuppressor({ windowMs = 300, now = () => performance.now() } = {}) {
  let until = 0;

  return {
    apply(fn) {
      until = now() + windowMs;
      return fn();
    },
    active() {
      return now() < until;
    },
    remaining() {
      return Math.max(0, until - now());
    },
  };
}
