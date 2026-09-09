import { io } from 'socket.io-client';
import { T, UNRELIABLE } from '../shared/protocol.js';
import { serverUrl } from '../shared/config.js';
import {
  syncClock,
  probe,
  latency,
  serverNow,
  clockOffset,
  reset as resetClock,
} from './clock.js';

let socket = null;
let session = null;

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
    path: 'relay',
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
    if (!socket?.connected) return;
    await probe(socket);
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

  socket.on(T.PEER_JOIN, () => {
    if (!session) return;
    session.peerCount = 2;
    session.code = null;
    announce('status');
    announce('peer', { present: true });
  });

  socket.on(T.PEER_LEAVE, () => {
    if (!session) return;
    session.peerCount = 1;
    announce('status');
    announce('peer', { present: false });
  });

  socket.on(T.CONTROLLER, ({ controllerId }) => {
    if (!session) return;
    session.controllerId = controllerId;
    announce('status');
  });

  socket.on('relay', (msg) => announce('peer-message', { msg }));

  return socket;
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
  if (!session || !socket?.connected) return null;

  const stamped = { ...msg, ts: msg.ts ?? serverNow() };
  const channel = UNRELIABLE.has(msg.t) ? 'relay:volatile' : 'relay';
  socket.emit(channel, stamped);
  return 'relay';
}
