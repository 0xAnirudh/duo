import test from 'node:test';
import assert from 'node:assert/strict';
import { createDirectLink } from '../offscreen/webrtc.js';
import { createFakeRtc } from './fakeRtc.mjs';

const flush = () => new Promise((r) => setTimeout(r, 0));

function pair() {
  const rtc = createFakeRtc();
  const received = { a: [], b: [] };
  const links = {};

  const make = (self, peer, key, otherKey) =>
    createDirectLink({
      selfId: self,
      peerId: peer,
      createPeerConnection: rtc.factory,
      sendSignal: (msg) => queueMicrotask(() => links[otherKey]?.handleSignal(msg)),
      onMessage: (msg, label) => received[key].push({ msg, label }),
      onStatus: () => {},
    });

  links.a = make('aaa', 'zzz', 'a', 'b');
  links.b = make('zzz', 'aaa', 'b', 'a');
  return { links, received, rtc };
}

test('exactly one side offers, decided without a round trip', () => {
  const { links } = pair();
  assert.equal(links.a.initiator, true);
  assert.equal(links.b.initiator, false);
});

test('a full negotiation opens both channels', async () => {
  const { links, rtc } = pair();
  await links.a.start();
  for (let i = 0; i < 12; i += 1) await flush();
  rtc.completeIce();

  assert.equal(links.a.isOpen(), true);
  assert.equal(links.b.isOpen(), true);

  const labels = rtc.bus.offered.map((c) => c.label);
  assert.deepEqual(labels, ['ctrl', 'sync']);
});

test('the sync channel is unordered with no retransmits', async () => {
  const { links, rtc } = pair();
  await links.a.start();
  for (let i = 0; i < 12; i += 1) await flush();

  const sync = rtc.bus.offered.find((c) => c.label === 'sync');
  const ctrl = rtc.bus.offered.find((c) => c.label === 'ctrl');
  assert.equal(sync.ordered, false);
  assert.equal(sync.maxRetransmits, 0, 'a late heartbeat is worse than a lost one');
  assert.equal(ctrl.ordered, true, 'commands must arrive and must not reorder');
});

test('messages cross, and volatile ones take the sync channel', async () => {
  const { links, received, rtc } = pair();
  await links.a.start();
  for (let i = 0; i < 12; i += 1) await flush();
  rtc.completeIce();

  assert.equal(links.a.send({ t: 'PAUSE', mediaTime: 12 }), true);
  assert.equal(links.a.send({ t: 'HEARTBEAT', mediaTime: 12 }, true), true);
  for (let i = 0; i < 4; i += 1) await flush();

  assert.deepEqual(
    received.b.map((r) => [r.msg.t, r.label]),
    [['PAUSE', 'ctrl'], ['HEARTBEAT', 'sync']],
  );
});

test('a closed link stops accepting sends so the caller falls back', async () => {
  const { links, rtc } = pair();
  await links.a.start();
  for (let i = 0; i < 12; i += 1) await flush();
  rtc.completeIce();
  assert.equal(links.a.isOpen(), true);

  links.a.close();
  assert.equal(links.a.isOpen(), false);
  assert.equal(links.a.send({ t: 'PAUSE' }), false, 'send() must report failure, not throw');
});
