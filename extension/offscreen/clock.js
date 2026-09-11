import { T } from '../shared/protocol.js';

let offset = 0;

const WINDOW = 40;
const rtts = [];

async function sample(socket) {
  const t0 = Date.now();
  const { t1, t2 } = await socket.emitWithAck(T.CLOCK_REQ, { t0 });
  const t3 = Date.now();
  return ntp({ t0, t1, t2, t3 });
}

export async function syncClock(socket, n = 7) {
  const samples = [];
  for (let i = 0; i < n; i += 1) {
    try {
      samples.push(await sample(socket));
    } catch {
      break;
    }
  }
  if (!samples.length) return null;

  samples.sort((a, b) => a.rtt - b.rtt);
  offset = samples[0].offset;
  record(samples[0].rtt);
  return { offset, rtt: samples[0].rtt };
}

export function record(rtt) {
  rtts.push(rtt);
  if (rtts.length > WINDOW) rtts.shift();
}

export async function probe(socket) {
  try {
    const s = await sample(socket);
    record(s.rtt);
    return s.rtt;
  } catch {
    return null;
  }
}

export function latency() {
  if (!rtts.length) return null;
  const sorted = [...rtts].sort((a, b) => a - b);
  const at = (q) => sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * q))];
  return { p50: Math.round(at(0.5)), p95: Math.round(at(0.95)), n: sorted.length };
}

export function reset() {
  offset = 0;
  rtts.length = 0;
}

export const serverNow = () => Date.now() + offset;
export const clockOffset = () => offset;

export function adoptOffset(value) {
  offset = value;
}

export function anchorToSelf() {
  offset = 0;
}

export function resetSamples() {
  rtts.length = 0;
}

export function ntp({ t0, t1, t2, t3 }) {
  return {
    offset: (t1 - t0 + (t2 - t3)) / 2,
    rtt: t3 - t0 - (t2 - t1),
  };
}
