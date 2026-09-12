import { WebSocket } from 'k6/websockets';
import { Trend, Counter, Rate } from 'k6/metrics';

const relayRtt = new Trend('relay_rtt', true);
const pairTime = new Trend('pair_time', true);
const paired = new Counter('rooms_paired');
const failures = new Rate('room_failures');

const TARGET = __ENV.TARGET || 'ws://localhost:8787';
const ROOMS = Number(__ENV.ROOMS || 50);
const PINGS = Number(__ENV.PINGS || 40);

export const options = {
  scenarios: {
    rooms: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '10s', target: ROOMS },
        { duration: '30s', target: ROOMS },
        { duration: '5s', target: 0 },
      ],
      gracefulRampDown: '10s',
    },
  },
  thresholds: {
    relay_rtt: ['p(95)<25'],
    room_failures: ['rate<0.01'],
  },
};

const URL = `${TARGET}/socket.io/?EIO=4&transport=websocket`;

function open(onEvent, onReady) {
  const ws = new WebSocket(URL);
  ws.ackId = 1;
  ws.acks = {};

  ws.onmessage = (e) => {
    const data = String(e.data);

    if (data[0] === '0') {
      ws.send('40');
      return;
    }
    if (data === '2') {
      ws.send('3');
      return;
    }
    if (data.startsWith('40')) {
      onReady(ws);
      return;
    }
    if (data.startsWith('43')) {
      const idEnd = data.indexOf('[');
      const id = data.slice(2, idEnd);
      const [payload] = JSON.parse(data.slice(idEnd));
      const fn = ws.acks[id];
      delete ws.acks[id];
      if (fn) fn(payload);
      return;
    }
    if (data.startsWith('42')) {
      const [name, payload] = JSON.parse(data.slice(2));
      onEvent(name, payload);
    }
  };

  return ws;
}

function emit(ws, name, payload) {
  ws.send(`42${JSON.stringify([name, payload])}`);
}

function emitWithAck(ws, name, payload, cb) {
  const id = ws.ackId++;
  ws.acks[id] = cb;
  ws.send(`42${id}${JSON.stringify([name, payload])}`);
}

export default function () {
  const startedAt = Date.now();
  let host = null;
  let joiner = null;
  let sentAt = 0;
  let count = 0;
  let done = false;

  const finish = (ok) => {
    if (done) return;
    done = true;
    failures.add(!ok);
    try { host && host.close(); } catch (e) {  }
    try { joiner && joiner.close(); } catch (e) {  }
  };

  const ping = () => {
    if (count >= PINGS) {
      finish(true);
      return;
    }
    count += 1;
    sentAt = Date.now();
    emit(host, 'relay', { t: 'SEEK', mediaTime: count, ts: sentAt });
  };

  host = open(
    (name) => {
      if (name === 'relay') {
        relayRtt.add(Date.now() - sentAt);
        ping();
      }
    },
    (ws) => {
      emitWithAck(ws, 'HELLO', {}, (res) => {
        if (!res || !res.room) return finish(false);

        joiner = open(
          (name, payload) => {
            if (name === 'relay') emit(joiner, 'relay', payload);
          },
          (jws) => {
            emitWithAck(jws, 'HELLO', { code: res.room.code }, (joined) => {
              if (!joined || !joined.room) return finish(false);
              paired.add(1);
              pairTime.add(Date.now() - startedAt);
              ping();
            });
          },
        );
      });
    },
  );
}
