import { io } from 'socket.io-client';
import { T, UNRELIABLE } from '../shared/protocol.js';
import { serverUrl } from '../shared/config.js';
import { createDirectLink } from './webrtc.js';
import {
  syncClock,
  probe,
  latency,
  serverNow,
  clockOffset,
  reset as resetClock,
  adoptOffset,
  anchorToSelf,
  resetSamples,
  record,
  ntp,
} from './clock.js';

let socket = null;
let session = null;

let direct = null;
const pendingClock = new Map();

const listeners = new Set();
export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
function announce(type, detail = {}) {
  const payload = type === 'status' ? { status: status() } : detail;
  for (const fn of listeners) fn({ type, ...payload });
}

export function status() {
  return {
    connected: Boolean(socket?.connected),
    paired: Boolean(session && session.peerCount > 1),
    code: session?.code ?? null,
    roomId: session?.roomId ?? null,
    you: session?.you ?? null,
    controllerId: session?.controllerId ?? null,
    amController: Boolean(session && session.controllerId === session.you),
    path: direct?.isOpen() ? 'direct' : 'relay',
    rtt: latency(),
    clockOffset: clockOffset(),
  };
}

function absorb(room) {
  session = {
    roomId: room.roomId,
    token: room.token,
    code: room.code,
    you: room.you,
    peerId: room.peers?.[0] ?? session?.peerId ?? null,
    peerCount: room.peerCount,
    controllerId: room.controllerId,
  };

  chrome.storage.session.set({ dcSession: session });
  announce('status');
  startClock();
}

let probeTimer = null;

async function startClock() {
  clearInterval(probeTimer);
  await syncClock(socket);
  announce('status');
  probeTimer = setInterval(async () => {
    if (direct?.isOpen()) await probeDirect();
    else if (socket?.connected) await probe(socket);
    else return;
    announce('status');
  }, 10000);
}

export async function connect() {
  if (socket) return socket;

  socket = io(await serverUrl(), {
    transports: ['websocket'],
    upgrade: false,
    reconnectionDelay: 400,
    reconnectionDelayMax: 4000,
  });

  socket.on('connect', async () => {
    if (session?.roomId) {
      const res = await socket.emitWithAck(T.HELLO, {
        roomId: session.roomId,
        token: session.token,
      });
      if (res?.room) {
        absorb(res.room);
      } else {
        session = null;
        chrome.storage.session.remove('dcSession');
        announce('lost', { reason: res?.error ?? 'rejoin_failed' });
      }
    }
    announce('status');
  });

  socket.on('disconnect', () => announce('status'));

  socket.on(T.PEER_JOIN, ({ deviceId }) => {
    if (!session) return;
    session.peerCount = 2;
    session.peerId = deviceId;
    session.code = null;
    announce('status');
    announce('peer', { present: true });
    openDirect();
  });

  socket.on(T.PEER_LEAVE, () => {
    if (!session) return;
    session.peerCount = 1;
    session.peerId = null;
    closeDirect();
    announce('status');
    announce('peer', { present: false });
  });

  socket.on(T.SIGNAL, (msg) => {
    if (!session) return;
    if (!direct) openDirect();
    direct?.handleSignal(msg).catch(() => {});
  });

  socket.on(T.CONTROLLER, ({ controllerId }) => {
    if (!session) return;
    session.controllerId = controllerId;
    announce('status');
  });

  socket.on('relay', (msg) => announce('peer-message', { msg }));

  if (session?.peerId) openDirect();

  return socket;
}

let directWasOpen = false;

function openDirect() {
  if (direct || !session?.peerId || !session?.you) return;

  direct = createDirectLink({
    selfId: session.you,
    peerId: session.peerId,
    sendSignal: (payload) => socket?.emit(T.SIGNAL, payload),
    onMessage: onDirectMessage,
    onStatus: onDirectStatus,
  });

  direct.start().catch(() => closeDirect());
}

function closeDirect() {
  if (!direct) return;

  directWasOpen = false;
  direct.close();
  direct = null;
  pendingClock.clear();

  resetSamples();
  if (socket?.connected) syncClock(socket);
  announce('status');
}

function onDirectStatus({ open }) {
  if (open === directWasOpen) return;
  directWasOpen = open;

  if (open) {
    resetSamples();
    syncToPeer();
  } else {
    closeDirect();
  }
  announce('status');
}

function onDirectMessage(msg) {
  if (msg.t === 'CLK_REQ') {
    const t1 = Date.now();
    direct?.send({ t: 'CLK_RES', id: msg.id, t0: msg.t0, t1, t2: Date.now() });
    return;
  }
  if (msg.t === 'CLK_RES') {
    const resolve = pendingClock.get(msg.id);
    pendingClock.delete(msg.id);
    resolve?.(msg);
    return;
  }
  announce('peer-message', { msg });
}

let clockSeq = 0;

async function directSample() {
  const id = `c${(clockSeq += 1)}`;
  const t0 = Date.now();

  const res = await new Promise((resolve) => {
    const timer = setTimeout(() => {
      pendingClock.delete(id);
      resolve(null);
    }, 1000);
    pendingClock.set(id, (value) => {
      clearTimeout(timer);
      resolve(value);
    });
    if (!direct?.send({ t: 'CLK_REQ', id, t0 })) {
      clearTimeout(timer);
      pendingClock.delete(id);
      resolve(null);
    }
  });

  if (!res) return null;
  return ntp({ t0, t1: res.t1, t2: res.t2, t3: Date.now() });
}

async function probeDirect() {
  const sample = await directSample();
  if (sample) record(sample.rtt);
  return sample?.rtt ?? null;
}

async function syncToPeer(n = 7) {
  const samples = [];

  for (let i = 0; i < n; i += 1) {
    const sample = await directSample();
    if (!sample) break;
    samples.push(sample);
  }

  if (!samples.length) return;
  samples.sort((a, b) => a.rtt - b.rtt);

  if (direct?.initiator) anchorToSelf();
  else adoptOffset(samples[0].offset);

  record(samples[0].rtt);
  announce('status');
}

export async function host() {
  await connect();
  const res = await socket.emitWithAck(T.HELLO, {});
  if (res?.error) return { error: res.error };
  absorb(res.room);
  return { ok: true, code: res.room.code };
}

export async function join(code) {
  await connect();
  const res = await socket.emitWithAck(T.HELLO, { code });
  if (res?.error) return { error: res.error };
  absorb(res.room);
  return { ok: true };
}

export function takeControl() {
  socket?.emit(T.TAKE_CONTROL);
}

export async function restore() {
  const { dcSession } = await chrome.storage.session.get('dcSession');
  if (dcSession) session = dcSession;
  await connect();
}

export function leave() {
  closeDirect();
  clearInterval(probeTimer);
  probeTimer = null;
  resetClock();
  session = null;
  chrome.storage.session.remove('dcSession');
  socket?.disconnect();
  socket = null;
  announce('status');
}

export function send(msg) {
  if (!session) return null;

  const stamped = { ...msg, ts: msg.ts ?? serverNow() };
  const unreliable = UNRELIABLE.has(msg.t);

  if (direct?.send(stamped, unreliable)) return 'direct';

  if (!socket?.connected) return null;
  socket.emit(unreliable ? 'relay:volatile' : 'relay', stamped);
  return 'relay';
}
