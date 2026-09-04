import { randomBytes, randomInt } from 'node:crypto';

export const CODE_TTL_MS = 5 * 60 * 1000;
export const ROOM_CAPACITY = 2;

const SWEEP_INTERVAL_MS = 30 * 1000;

const ROOM_MAX_AGE_MS = 6 * 60 * 60 * 1000;

const byCode = new Map();

const byId = new Map();

function allocateCode() {
  for (let attempt = 0; attempt < 64; attempt += 1) {
    const code = String(randomInt(1_000_000)).padStart(6, '0');
    if (!byCode.has(code)) return code;
  }
  throw new Error('pairing code space exhausted');
}

export function createRoom(socketId) {
  const roomId = randomBytes(16).toString('hex');
  const code = allocateCode();
  const room = {
    roomId,
    code,
    token: randomBytes(32).toString('hex'),
    members: new Set([socketId]),
    controllerId: socketId,
    createdAt: Date.now(),
    codeExpiresAt: Date.now() + CODE_TTL_MS,
  };
  byId.set(roomId, room);
  byCode.set(code, roomId);
  return room;
}

export function joinByCode(code, socketId) {
  const roomId = byCode.get(code);
  if (!roomId) return { error: 'bad_code' };

  const room = byId.get(roomId);
  if (!room) {
    byCode.delete(code);
    return { error: 'bad_code' };
  }
  if (room.members.size >= ROOM_CAPACITY) return { error: 'room_full' };

  room.members.add(socketId);

  byCode.delete(code);
  room.code = null;

  return { room };
}

export function rejoinByToken(roomId, token, socketId) {
  const room = byId.get(roomId);
  if (!room) return { error: 'room_gone' };
  if (room.token !== token) return { error: 'bad_token' };
  if (!room.members.has(socketId) && room.members.size >= ROOM_CAPACITY) {
    return { error: 'room_full' };
  }
  room.members.add(socketId);
  return { room };
}

export function getRoom(roomId) {
  return byId.get(roomId);
}

export function setController(roomId, socketId) {
  const room = byId.get(roomId);
  if (!room || !room.members.has(socketId)) return null;
  room.controllerId = socketId;
  return room;
}

export function leaveRoom(roomId, socketId) {
  const room = byId.get(roomId);
  if (!room) return { room: null, empty: true };

  room.members.delete(socketId);

  if (room.members.size === 0) {
    destroy(room);
    return { room: null, empty: true };
  }

  if (room.controllerId === socketId) {
    room.controllerId = room.members.values().next().value;
  }
  return { room, empty: false };
}

function destroy(room) {
  byId.delete(room.roomId);
  if (room.code) byCode.delete(room.code);
}

export function sweep(now = Date.now()) {
  let expiredCodes = 0;
  let staleRooms = 0;

  for (const [code, roomId] of byCode) {
    const room = byId.get(roomId);
    if (!room || room.codeExpiresAt <= now) {
      byCode.delete(code);
      if (room) room.code = null;
      expiredCodes += 1;
    }
  }

  for (const room of byId.values()) {
    if (room.members.size === 0 || now - room.createdAt > ROOM_MAX_AGE_MS) {
      destroy(room);
      staleRooms += 1;
    }
  }

  return { expiredCodes, staleRooms };
}

export function startSweeper() {
  const timer = setInterval(sweep, SWEEP_INTERVAL_MS);

  timer.unref?.();
  return timer;
}

export function stats() {
  return { rooms: byId.size, liveCodes: byCode.size };
}
