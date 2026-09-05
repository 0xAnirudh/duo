import { ensureOffscreen } from './offscreenManager.js';
import { CH } from '../shared/protocol.js';

const KEEPALIVE_ALARM = 'dc-keepalive';

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

function toPopup(event) {
  chrome.runtime
    .sendMessage({ channel: CH.POPUP_EVENT, ...event })
    .catch(() => {});
}

function onOffscreenEvent(event) {
  if (event.type === 'status' || event.type === 'peer' || event.type === 'lost') {
    toPopup(event);
  }
}

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
