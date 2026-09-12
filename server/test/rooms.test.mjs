import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createRoom,
  joinByCode,
  rejoinByToken,
  leaveRoom,
  setController,
  getRoom,
  sweep,
  stats,
  CODE_TTL_MS,
} from '../src/rooms.js';

test('a code is six digits and the host holds control', () => {
  const room = createRoom('host');
  assert.match(room.code, /^\d{6}$/);
  assert.equal(room.controllerId, 'host');
  assert.equal(room.members.size, 1);
  leaveRoom(room.roomId, 'host');
});

test('a code is spent the moment the second device joins', () => {
  const room = createRoom('host');
  const code = room.code;

  assert.ok(joinByCode(code, 'guest').room);
  assert.equal(joinByCode(code, 'third').error, 'bad_code');
  assert.equal(getRoom(room.roomId).code, null);

  leaveRoom(room.roomId, 'host');
  leaveRoom(room.roomId, 'guest');
});

test('a third device cannot join a full room', () => {
  const room = createRoom('host');
  joinByCode(room.code, 'guest');

  assert.equal(rejoinByToken(room.roomId, room.token, 'third').error, 'room_full');
  leaveRoom(room.roomId, 'host');
  leaveRoom(room.roomId, 'guest');
});

test('a member can rejoin with its token but not without', () => {
  const room = createRoom('host');
  joinByCode(room.code, 'guest');

  assert.ok(rejoinByToken(room.roomId, room.token, 'guest').room);
  assert.equal(rejoinByToken(room.roomId, 'not-the-token', 'guest').error, 'bad_token');
  assert.equal(rejoinByToken('no-such-room', room.token, 'guest').error, 'room_gone');

  leaveRoom(room.roomId, 'host');
  leaveRoom(room.roomId, 'guest');
});

test('control passes to the survivor when the controller leaves', () => {
  const room = createRoom('host');
  joinByCode(room.code, 'guest');
  setController(room.roomId, 'host');

  const { room: after } = leaveRoom(room.roomId, 'host');
  assert.equal(after.controllerId, 'guest', 'the survivor must not be left unable to drive');
  leaveRoom(room.roomId, 'guest');
});

test('control cannot be claimed by a non-member', () => {
  const room = createRoom('host');
  assert.equal(setController(room.roomId, 'stranger'), null);
  assert.equal(getRoom(room.roomId).controllerId, 'host');
  leaveRoom(room.roomId, 'host');
});

test('the room is destroyed once both devices leave', () => {
  const before = stats().rooms;
  const room = createRoom('host');
  joinByCode(room.code, 'guest');

  assert.equal(leaveRoom(room.roomId, 'host').empty, false);
  assert.equal(leaveRoom(room.roomId, 'guest').empty, true);
  assert.equal(getRoom(room.roomId), undefined);
  assert.equal(stats().rooms, before);
});

test('an unclaimed code expires but the room survives it', () => {
  const room = createRoom('host');
  const code = room.code;

  sweep(Date.now() + CODE_TTL_MS + 1);

  assert.equal(joinByCode(code, 'guest').error, 'bad_code');
  assert.ok(getRoom(room.roomId), 'the host is still sitting in the popup');
  leaveRoom(room.roomId, 'host');
});
