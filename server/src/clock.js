import { T } from './protocol.js';

export function registerClock(socket) {
  socket.on(T.CLOCK_REQ, ({ t0 } = {}, ack) => {
    if (typeof ack !== 'function') return;
    const t1 = Date.now();

    ack({ t0, t1, t2: Date.now() });
  });
}
