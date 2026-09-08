import test from 'node:test';
import assert from 'node:assert/strict';
import { installChromeStub, settle } from './stubChrome.mjs';

const harness = installChromeStub();
const urlSync = await import('../background/urlSync.js');

const sent = [];
const live = { paired: true, amController: true };
urlSync.install({ live, sendToPeer: (msg) => sent.push(msg.url) });
await urlSync.adoptActiveTab();

test('a redirect chain sends one URL, not four', async () => {
  sent.length = 0;
  harness.fireUpdated(7, 'http://a.test/');
  harness.fireUpdated(7, 'http://a.test/redir');
  harness.fireUpdated(7, 'http://b.test/');
  harness.fireUpdated(7, 'http://b.test/final');
  await settle();
  assert.deepEqual(sent, ['http://b.test/final']);
});

test('a follower does not bounce a remote navigation back', async () => {
  sent.length = 0;
  live.amController = false;
  await urlSync.applyRemoteUrl('http://pushed.test/video');
  await settle();
  assert.equal(sent.length, 0);
});

test('the guard holds even while this device is the controller', async () => {
  sent.length = 0;
  live.amController = true;
  await urlSync.applyRemoteUrl('http://pushed.test/second');
  await settle();
  assert.equal(sent.length, 0, 'an applied URL must never be re-sent');
});

test('a human navigation inside the guard window is swallowed', async () => {
  sent.length = 0;
  harness.fireUpdated(7, 'http://human.test/too-soon');
  await settle();
  assert.equal(sent.length, 0);
});

test('a human navigation after the guard window is sent', async () => {
  sent.length = 0;
  await settle(1600);
  harness.fireUpdated(7, 'http://human.test/');
  await settle();
  assert.deepEqual(sent, ['http://human.test/']);
});

test('a closed synced tab is recreated', async () => {
  const before = harness.store.dcTabId;
  harness.closeTab(before);
  const after = await urlSync.applyRemoteUrl('http://pushed.test/third');
  assert.notEqual(after, before);
  assert.equal(harness.store.dcTabId, after);
});
