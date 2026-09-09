import { ensureOffscreen } from './offscreenManager.js';
import { CH, T } from '../shared/protocol.js';
import {
  install as installUrlSync,
  applyRemoteUrl,
  adoptActiveTab,
  ensureSyncedTab,
  syncedTabId,
} from './urlSync.js';

const MEDIA = new Set([T.PLAY, T.PAUSE, T.SEEK, T.RATE, T.HEARTBEAT]);

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

async function toContent(payload) {
  const tabId = await syncedTabId();
  if (tabId === null) return;

  chrome.tabs.sendMessage(tabId, { channel: CH.TO_CONTENT, ...payload }).catch(() => {});
}

function onOffscreenEvent(event) {
  if (event.type === 'status' && event.status) {
    const wasDriving = live.amController;
    const wasPaired = live.paired;
    Object.assign(live, event.status);

    if (live.paired && live.amController && !wasDriving) {
      adoptActiveTab().then(() => toContent({ type: 'status', status: live }));
    } else if (live.paired && !wasPaired) {
      ensureSyncedTab().then(() => toContent({ type: 'status', status: live }));
    } else {
      toContent({ type: 'status', status: live });
    }
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
    return;
  }
  if (MEDIA.has(msg.t)) toContent({ msg });
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

    case CH.FROM_CONTENT:

      sendToPeer(message.msg);
      return false;

    default:
      return undefined;
  }
});

ensureOffscreen();
