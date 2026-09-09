import test from 'node:test';
import assert from 'node:assert/strict';
import { createSuppressor } from '../content/echo.js';
import { FakeVideo, flush } from './fakeVideo.mjs';

function pair({ suppression }) {
  const sent = [];
  const devices = [0, 1].map(() => ({
    video: new FakeVideo(),
    suppress: createSuppressor({ windowMs: 300 }),
  }));

  devices.forEach((device, index) => {
    const peer = devices[1 - index];

    device.video.addEventListener('pause', () => {
      if (suppression === 'window' && device.suppress.active()) return;
      if (suppression === 'flag' && device.isRemote) return;
      sent.push(index);

      if (suppression === 'window') {
        peer.suppress.apply(() => peer.video.pause());
      } else {
        peer.isRemote = true;
        peer.video.pause();
        peer.isRemote = false;
      }
    });
  });

  return { devices, sent };
}

test('a boolean flag does not stop the echo', async () => {
  const { devices, sent } = pair({ suppression: 'flag' });
  devices[0].video.play();
  devices[1].video.play();
  await flush();

  devices[0].video.pause();
  for (let i = 0; i < 8; i += 1) await flush();

  assert.ok(sent.length > 1, `expected an echo, got ${sent.length} message(s)`);
});

test('a time window stops it', async () => {
  const { devices, sent } = pair({ suppression: 'window' });
  devices[0].video.play();
  devices[1].video.play();
  await flush();

  devices[0].video.pause();
  for (let i = 0; i < 8; i += 1) await flush();

  assert.equal(sent.length, 1, 'one human pause must produce exactly one message');
  assert.equal(devices[1].video.paused, true, 'and the peer must still be paused');
});

test('the window reopens once it elapses', async () => {
  const suppress = createSuppressor({ windowMs: 40 });
  suppress.apply(() => {});
  assert.equal(suppress.active(), true);
  await new Promise((r) => setTimeout(r, 60));
  assert.equal(suppress.active(), false, 'a later human action must not be swallowed');
});
