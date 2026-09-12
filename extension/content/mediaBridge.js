import { CH, T, TUNING } from '../shared/protocol.js';
import { createSuppressor } from './echo.js';
import { watchForVideo } from './videoTarget.js';
import { expectedTime, decide, createRateController } from './drift.js';

const suppress = createSuppressor({ windowMs: TUNING.SUPPRESS_MS });

const live = { paired: false, amController: false, clockOffset: 0, syncOffsetMs: 0 };
const serverNow = () => Date.now() + live.clockOffset;

function targetFor(msg) {
  const shifted = expectedTime(msg, serverNow()) + (live.syncOffsetMs || 0) / 1000;
  const limit = Number.isFinite(video?.duration) ? video.duration : Infinity;
  return Math.max(0, Math.min(shifted, limit));
}

let video = null;
let detachListeners = null;

const RATE_RESET_MS = TUNING.HEARTBEAT_MS * 1.5;

const rateController = createRateController({
  delayMs: RATE_RESET_MS,
  setRate: (rate) => {
    if (!video || video.playbackRate === rate) return;

    suppress.apply(() => {
      video.playbackRate = rate;
    });
  },
});

function post(msg) {
  chrome.runtime.sendMessage({ channel: CH.FROM_CONTENT, msg }).catch(() => {});
}

function outbound(msg) {
  if (!live.paired || !live.amController) return;
  if (suppress.active()) return;
  post({ ...msg, ts: serverNow() });
}

function stateOf(element, t) {
  return {
    t,
    mediaTime: element.currentTime,
    rate: element.playbackRate,
    paused: element.paused,
  };
}

let seekTimer = null;

function attach(element) {
  detachListeners?.();
  detachListeners = null;
  video = element;
  if (!element) return;

  const off = [];
  const on = (type, handler) => {
    element.addEventListener(type, handler);
    off.push(() => element.removeEventListener(type, handler));
  };

  on('play', () => outbound(stateOf(element, T.PLAY)));
  on('pause', () => outbound(stateOf(element, T.PAUSE)));
  on('ratechange', () => outbound({ t: T.RATE, rate: element.playbackRate }));

  on('seeking', () => {
    if (seekTimer) return;
    seekTimer = setTimeout(() => {
      seekTimer = null;
      outbound(stateOf(element, T.SEEK));
    }, TUNING.SEEK_THROTTLE_MS);
  });

  on('seeked', () => {
    clearTimeout(seekTimer);
    seekTimer = null;
    outbound(stateOf(element, T.SEEK));
  });

  detachListeners = () => off.forEach((fn) => fn());
}

function applyInbound(msg) {
  if (!video) return;

  switch (msg.t) {
    case T.PLAY: {
      const target = targetFor(msg);
      if (!video.paused && Math.abs(video.currentTime - target) < 0.05) return;
      suppress.apply(() => {
        if (Math.abs(video.currentTime - target) > 0.05) {
          video.currentTime = target;
        }
        video.play().catch((err) => post({ t: 'BLOCKED', reason: String(err?.name ?? err) }));
      });
      break;
    }

    case T.PAUSE: {
      const target = targetFor(msg);
      if (video.paused && Math.abs(video.currentTime - target) < 0.05) return;
      suppress.apply(() => {
        video.pause();
        video.currentTime = target;
      });
      break;
    }

    case T.SEEK: {
      const target = targetFor(msg);
      if (Math.abs(video.currentTime - target) < 0.05) return;
      suppress.apply(() => {
        video.currentTime = target;
      });
      break;
    }

    case T.RATE:

      rateController.forget();
      if (video.playbackRate === msg.rate) return;
      suppress.apply(() => {
        video.playbackRate = msg.rate;
      });
      break;

    case T.HEARTBEAT:
      onHeartbeat(msg);
      break;

    default:
      break;
  }
}

function onHeartbeat(msg) {
  if (!video || live.amController) return;

  if (msg.paused && !video.paused) {
    suppress.apply(() => video.pause());
    return;
  }
  if (!msg.paused && video.paused) {
    suppress.apply(() => video.play().catch(() => {}));
  }

  const expected = targetFor(msg);
  const plan = decide(video.currentTime - expected, msg.rate);

  if (plan.action === 'hold') return;

  if (plan.action === 'seek') {
    rateController.forget();
    suppress.apply(() => {
      video.currentTime = expected;
    });
    return;
  }

  rateController.nudge(plan.playbackRate, msg.rate);
}

setInterval(() => {
  if (!video || !live.paired || !live.amController) return;
  post({
    t: T.HEARTBEAT,
    mediaTime: video.currentTime,
    rate: video.playbackRate,
    paused: video.paused,
    ts: serverNow(),
  });
}, TUNING.HEARTBEAT_MS);

chrome.runtime.onMessage.addListener((message) => {
  if (message?.channel !== CH.TO_CONTENT) return undefined;
  if (message.type === 'status') Object.assign(live, message.status);
  else if (message.msg) applyInbound(message.msg);
  return undefined;
});

watchForVideo(attach);
