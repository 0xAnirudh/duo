export class FakeVideo {
  constructor() {
    this.paused = true;
    this.currentTime = 0;
    this.playbackRate = 1;
    this._listeners = new Map();
  }

  addEventListener(type, fn) {
    if (!this._listeners.has(type)) this._listeners.set(type, []);
    this._listeners.get(type).push(fn);
  }

  _queue(type) {
    queueMicrotask(() => {
      for (const fn of this._listeners.get(type) ?? []) fn();
    });
  }

  pause() {
    if (this.paused) return;
    this.paused = true;
    this._queue('pause');
  }

  play() {
    if (!this.paused) return Promise.resolve();
    this.paused = false;
    this._queue('play');
    return Promise.resolve();
  }

  seek(t) {
    this.currentTime = t;
    this._queue('seeking');
    this._queue('seeked');
  }

  setRate(r) {
    this.playbackRate = r;
    this._queue('ratechange');
  }
}

export const flush = () => new Promise((r) => setTimeout(r, 0));
