import { CH, TUNING } from '../shared/protocol.js';
import * as conn from './connection.js';

const COMMANDS = {
  host: () => conn.host(),
  join: ({ code }) => conn.join(code),
  status: () => conn.status(),
  takeControl: () => {
    conn.takeControl();
    return { ok: true };
  },
  leave: () => {
    conn.leave();
    return { ok: true };
  },
  send: ({ msg }) => ({ path: conn.send(msg) }),
};

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.channel !== CH.TO_OFFSCREEN) return undefined;
  const fn = COMMANDS[message.cmd];
  if (!fn) {
    sendResponse({ error: `unknown command: ${message.cmd}` });
    return false;
  }
  Promise.resolve(fn(message.args ?? {}))
    .then(sendResponse)
    .catch((err) => sendResponse({ error: String(err?.message ?? err) }));
  return true;
});

conn.subscribe((event) => {
  chrome.runtime
    .sendMessage({ channel: CH.FROM_OFFSCREEN, ...event })
    .catch(() => {
    });
});

setInterval(() => {
  chrome.runtime
    .sendMessage({ channel: CH.KEEPALIVE })
    .catch(() => {});
}, TUNING.KEEPALIVE_MS);

conn.restore();
