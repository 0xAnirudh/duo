import { ensureOffscreen } from './offscreenManager.js';
import { CH, T } from '../shared/protocol.js';
import { install as installUrlSync, applyRemoteUrl, adoptActiveTab } from './urlSync.js';

const KEEPALIVE_ALARM = 'dc-keepalive';

export const live = { paired: false, amController: false, you: null };

async function boot() {
  await ensureOffscreen();

  chrome.alarms.create(KEEPALIVE_ALARM, { periodInMinutes: 0.5 });
}

chrome.runtime.onInstalled.addListener(boot);
chrome.runtime.onStartup.addListener(boot);

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === KEEPALIVE_ALARM) ensureOffscreen();
});

async function askOffscreen(cmd, args) {
  await ensureOffscreen();
  return chrome.runtime.sendMessage({ channel: CH.TO_OFFSCREEN, cmd, args });
}

export function sendToPeer(msg) {
  return askOffscreen('send', { msg }).catch(() => null);
}

function toPopup(event) {
  chrome.runtime
    .sendMessage({ channel: CH.POPUP_EVENT, ...event })
    .catch(() => {});
}

function onOffscreenEvent(event) {
  if (event.type === 'status' && event.status) {
    const wasDriving = live.amController;
    Object.assign(live, event.status);

    if (live.paired && live.amController && !wasDriving) adoptActiveTab();
  }

  if (event.type === 'peer-message') {
    onPeerMessage(event.msg);
  }
  if (event.type === 'status' || event.type === 'peer' || event.type === 'lost') {
    toPopup(event);
  }
}

function onPeerMessage(msg) {
  if (!msg) return;
  if (msg.t === T.URL) {
    applyRemoteUrl(msg.url);
  }
}

installUrlSync({ live, sendToPeer });

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  switch (message?.channel) {
    case CH.POPUP_QUERY:
      askOffscreen(message.cmd, message.args)
        .then(sendResponse)
        .catch((err) => sendResponse({ error: String(err?.message ?? err) }));
      return true;

    case CH.KEEPALIVE:

      sendResponse({ ok: true });
      return false;

    case CH.FROM_OFFSCREEN:
      onOffscreenEvent(message);
      return false;

    default:
      return undefined;
  }
});

ensureOffscreen();
