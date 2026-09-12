import { T } from './protocol.js';
import { registerClock } from './clock.js';
import { check, recordFailure, recordSuccess, clientIp } from './rateLimit.js';
import {
  createRoom,
  joinByCode,
  rejoinByToken,
  leaveRoom,
  setController,
  getRoom,
} from './rooms.js';

function roomView(room, selfId) {
  return {
    roomId: room.roomId,
    token: room.token,
    code: room.code,
    peerCount: room.members.size,
    peers: [...room.members].filter((id) => id !== selfId),
    controllerId: room.controllerId,
    you: selfId,
  };
}

function attach(socket, room) {
  socket.join(room.roomId);
  socket.data.roomId = room.roomId;
}

export function register(io, socket) {
  registerClock(socket);

  socket.on(T.HELLO, (msg = {}, ack) => {
    const reply = typeof ack === 'function' ? ack : () => {};

    if (msg.roomId && msg.token) {
      const { room, error } = rejoinByToken(msg.roomId, msg.token, socket.id);
      if (error) return reply({ error });
      attach(socket, room);
      socket.to(room.roomId).emit(T.PEER_JOIN, { deviceId: socket.id });

      io.to(room.roomId).emit(T.CONTROLLER, { controllerId: room.controllerId });
      return reply({ room: roomView(room, socket.id) });
    }

    if (msg.code) {
      const ip = clientIp(socket);
      const gate = check(ip);
      if (!gate.allowed) return reply({ error: gate.error, retryInMs: gate.retryInMs });

      const { room, error } = joinByCode(String(msg.code).trim(), socket.id);
      if (error) {
        recordFailure(ip);
        return reply({ error });
      }
      recordSuccess(ip);
      attach(socket, room);
      socket.to(room.roomId).emit(T.PEER_JOIN, { deviceId: socket.id });
      io.to(room.roomId).emit(T.CONTROLLER, { controllerId: room.controllerId });
      return reply({ room: roomView(room, socket.id) });
    }

    const hostGate = check(clientIp(socket));
    if (!hostGate.allowed) {
      return reply({ error: hostGate.error, retryInMs: hostGate.retryInMs });
    }

    const room = createRoom(socket.id);
    attach(socket, room);
    return reply({ room: roomView(room, socket.id) });
  });

  socket.on('relay', (msg) => {
    const roomId = socket.data.roomId;
    if (!roomId) return;
    socket.to(roomId).emit('relay', msg);
  });

  socket.on('relay:volatile', (msg) => {
    const roomId = socket.data.roomId;
    if (!roomId) return;
    socket.volatile.to(roomId).emit('relay', msg);
  });

  socket.on(T.SIGNAL, (msg) => {
    const roomId = socket.data.roomId;
    if (!roomId) return;
    socket.to(roomId).emit(T.SIGNAL, { ...msg, from: socket.id });
  });

  socket.on(T.TAKE_CONTROL, () => {
    const roomId = socket.data.roomId;
    if (!roomId) return;
    const room = setController(roomId, socket.id);
    if (!room) return;
    io.to(roomId).emit(T.CONTROLLER, { controllerId: room.controllerId });
  });

  socket.on('disconnect', () => {
    const roomId = socket.data.roomId;
    if (!roomId) return;
    const { room } = leaveRoom(roomId, socket.id);
    if (!room) return;
    socket.to(roomId).emit(T.PEER_LEAVE, { deviceId: socket.id });
    io.to(roomId).emit(T.CONTROLLER, { controllerId: room.controllerId });
  });
}

export { getRoom };
