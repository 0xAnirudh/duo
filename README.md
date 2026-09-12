# DualControl

A Chrome extension that pairs two browsers with a 6-digit code. One device
drives, the other follows: same page, same video, same position.

It uses a WebRTC DataChannel when both machines can reach each other directly,
and a WebSocket relay when they can't. Switching between them is automatic and
doesn't drop commands.

Works on any site with a `<video>` element, since it drives the standard
`HTMLMediaElement` API instead of any specific player.

## Numbers

A 60Hz display refreshes every 16.7ms. Two screens that pause within one frame
of each other look identical to someone watching both, so that's the target.

| What | Result |
|---|---|
| Relay forwarding, idle | one-way p50 0.17ms, p95 0.31ms |
| Relay, 150 concurrent rooms | round trip p50 4ms, p95 9ms |
| Throughput at that load | 19,200 msg/s, 11,866 rooms, 0 failures |
| Pairing handshake, 25 rooms | p50 7ms |
| Clock agreement | under 1ms, with an 8s wall clock skew absorbed |
| Drift, 30 min at 0.2% decode error | worst gap 0.086s, no hard seeks |
| Drift, 30 min at 1% decode error | worst gap 0.110s, no hard seeks |
| Content script bundle | 1.5 KB gzipped |

Relay numbers come from `k6 run server/bench/k6-relay.js` against localhost, so
they measure the server's forwarding cost rather than the network. Drift
numbers come from a simulated player in `npm test`.

Measured against the deployed relay on Render's free tier, from India: one-way
p50 272ms, p95 376ms. That number is almost entirely distance, not the server
-- the same code forwards in 0.17ms on localhost. It is the argument for the
direct path, and for picking a region near the people using it.

Not measured yet: DataChannel latency on a real LAN, which needs two machines.

## Layout

```
server/
  src/
    index.js       express + socket.io
    rooms.js       room registry, code allocation, TTL
    handlers.js    join, relay, signalling, control
    clock.js       clock sync endpoint
    rateLimit.js   join limits and lockout
  bench/k6-relay.js

extension/
  background/      service worker, offscreen lifecycle, url sync
  offscreen/       socket, clock, peer connection
  content/         video discovery, echo suppression, drift
  popup/           react ui
  shared/          protocol constants
```

Outbound messages all leave through one `send()` in
`offscreen/connection.js`. It uses the DataChannel when `ctrl.readyState` is
`open` and the socket otherwise, so nothing upstream knows which was used.

## Why the offscreen document

An MV3 service worker is killed after 30 seconds of inactivity. Extension
events reset that timer but WebSocket frames don't, so a socket opened in the
worker dies silently and takes the pairing with it.

An offscreen document created with reason `WEB_RTC` has no lifetime limit and
is a real DOM context, so it can hold both the socket and an
`RTCPeerConnection`. Neither exists in a service worker at all.

So the connection, clock and peer connection live in the offscreen document,
and `chrome.tabs` stays in the worker. The offscreen document pings the worker
every 20 seconds, which counts as an extension event and keeps it warm.

## Notes on the tricky parts

**Echo suppression.** `video.pause()` queues its event instead of firing it
synchronously, so a flag set and cleared around the call is already back to
`false` by the time the handler runs. The handler then treats a remote command
as a local one and sends it back, and the two devices bounce it forever. A
300ms window cleared by elapsed time fixes it. `test/echo.test.mjs` runs both
versions against a fake element that queues events like a real one, and asserts
the flag version echoes.

**Clock offset.** `Date.now()` on two machines can differ by seconds. Both run
a four-timestamp NTP handshake against the server and keep the lowest-RTT
sample out of seven rather than the average, since a sample delayed by a queued
packet is skewed on one leg only. Once the DataChannel opens the handshake runs
again peer to peer, with one side as the reference.

**Latency compensation.** A command is stale by the time it lands: the
controller kept playing while it was in flight. Every applied position is
projected forward by the measured transit, `mediaTime + (now - ts) * rate`,
using the synced clocks rather than an averaged latency figure. This applies to
play and seek as well as heartbeats. Without it a relay leaves a fixed offset
equal to its one-way latency, and any offset smaller than the dead zone is
permanent, because drift correction is built to ignore exactly that range.

**Drift.** Ignore under 0.08s, adjust `playbackRate` by 3% between 0.08s and
0.5s, hard seek past that. A 3% shift isn't audible and closes the gap without
a visible jump.

The dead zone is 0.08s because that is the knee of the curve. Sweeping it
against a simulated player with frame-grained `currentTime` noise: 0.15s leaves
a 0.090s mean error, 0.08s cuts that to 0.035s for the same number of
corrections, and anything below 0.05s multiplies corrections fifteenfold
chasing measurement noise for no further gain.

**Manual offset.** Displays and audio paths add their own lag, which no amount
of clock sync can see. The popup has a +/- 25ms stepper that shifts this
device's applied position, so a pair that measures in sync but looks off can be
dialled in by eye.

**Control.** The server owns `controllerId` even when the DataChannel is
carrying everything else. It changes once a session so latency doesn't matter,
and a single authority stops both devices from thinking they're driving after a
reconnect.

## Running it

The extension defaults to a deployed relay. To run everything locally, change
`DEFAULT_SERVER` in `extension/shared/config.js` or set `serverUrl` in
`chrome.storage.local`, then:

```bash
cd server && npm install && npm start
```

```bash
cd extension && npm install && npm run build
```

Load `extension/dist` unpacked at `chrome://extensions`. Pair two Chrome
profiles: Host a session on one, type the six digits into the other.

```bash
npm test
k6 run server/bench/k6-relay.js
```

The server URL defaults to the deployed relay. Override it by setting
`serverUrl` in `chrome.storage.local`.

## Protocol

JSON, around 100 bytes per message, shaped `{ t, ...fields, ts }`.

| Type | Direction | Delivery |
|---|---|---|
| `HELLO` / `ROOM` | client, server | join or create, reply carries the token |
| `PEER_JOIN` / `PEER_LEAVE` | server to client | reliable |
| `CLOCK_REQ` | client to server | acked |
| `SIGNAL` | peer to peer via server | SDP and ICE |
| `URL` | peer to peer | reliable, debounced 250ms |
| `PLAY` / `PAUSE` | peer to peer | reliable |
| `SEEK` | peer to peer | reliable, throttled 100ms trailing |
| `RATE` | peer to peer | reliable |
| `HEARTBEAT` | peer to peer | unreliable, every 3s |
| `TAKE_CONTROL` / `CONTROLLER` | client, server | reliable, server owns it |

Commands have to arrive. Heartbeats shouldn't queue behind a slow peer, because
a late one reports a playback position that has already moved. On the relay they
go out volatile; on the DataChannel they use a second channel opened with
`{ ordered: false, maxRetransmits: 0 }`.

## Security

A 6-digit code is a 1,000,000 key space, small enough to walk through if
nothing stops you.

- Codes expire after 5 minutes.
- A code is deleted as soon as the second device joins. The room continues
  under a 128-bit `roomId`.
- After joining, every message including reconnects carries a 32-byte token.
  The code is never sent twice.
- 10 join attempts per minute per IP. Five wrong codes locks that address out
  for 5 minutes, and a correct code clears the streak so a mistyped digit
  doesn't lock out a real user.

Limiting a specific code after N failed guesses doesn't help here, because a
wrong guess never reaches a code in the first place, it just misses the map.
The limit has to apply to the address doing the guessing.

On the relay path the server can see every URL that gets pushed. On the direct
path it can't, since DataChannels are DTLS encrypted and the traffic never
reaches the server. Encrypting relay payloads with a key derived from the
pairing code would close that gap, but it isn't built.

## Not built

- No database. Rooms are ephemeral and a `Map` handles TTL fine.
- No accounts. The code is the auth.
- No site-specific handlers. The point is using the standard media API.
- No TURN server. If ICE fails the relay already works.
- One synced tab per room.

## Known issues

- An ad on one device only will desync playback until it finishes, since it
  plays through the same `<video>` element.
- Age-gated or paid content fails on a device that isn't signed in.
- Two devices per room. The relay and the controller model already generalise
  to more, the popup and the WebRTC mesh don't.
