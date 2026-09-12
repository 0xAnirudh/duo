# DualControl

Pairs two browsers with a six-digit code and keeps the open page and its video
playback in sync on both. One device drives, the other follows.

It drives the standard `HTMLMediaElement` API rather than any site's player, so
it works anywhere a `<video>` element does.

## Status

- Free. No account, no sign-in, no payment, no tracking, no ads.
- Open source, including the relay server, at https://github.com/0xAnirudh/duo
- Not listed on any extension store. Installs unpacked from the GitHub Release
  zip. Do not describe it as available in the Chrome Web Store.
- A relay runs at https://dualcontrol.onrender.com on a free Render instance in
  Singapore, shared by everyone who installs it. It is not private to any user.

## Audience

Two people watching the same thing from different places. The install is a
five-step unpacked load, which is a real ask and has to be earned before it is
requested.

## Measured figures, and where each came from

Only these may be quoted as performance numbers. Each was measured during the
build; none is estimated.

| Figure | Value | Method |
|---|---|---|
| Command latency, localhost | p50 0.17ms, p95 0.31ms | 200 round trips, two clients, one machine |
| Command latency, deployed relay | p50 104ms, p95 108ms | Singapore relay, measured from India |
| Relay under load | p50 4ms, p95 9ms | k6, 150 concurrent rooms, 19,200 msg/s, 0 failures |
| Pairing handshake | p50 7ms | 25 concurrent rooms |
| Clock agreement | under 1ms | NTP handshake absorbing an 8s wall-clock skew |
| Drift, 30 min at 0.2% decode error | worst 0.086s, no hard seeks | simulated player |
| Drift, 30 min at 1% decode error | worst 0.110s, no hard seeks | simulated player |
| Content script size | 1.5 KB gzipped | build output |

Command latency means one traversal: device, server, device. The k6 figure is a
round trip, which is two of those.

## The direct-path rule

The WebRTC DataChannel is real and implemented. Its latency has never been
measured across two physical machines on a LAN, so **no figure may be quoted
for it**. Say it should be faster and that it has not been measured. Any
single-digit millisecond number on a surface refers to the relay on localhost,
never to the direct path.

A figure a surface measures live in the visitor's own browser is not a quote and
is exempt, provided the surface says it was measured just now.

## Privacy

On the relay path the server can see the addresses of pages pushed between the
two devices. It forwards them and stores nothing; room state is in memory and
dies with the room. On the direct path the traffic never reaches the server.
Both facts get stated plainly rather than softened. Policy is served at
/privacy from the relay itself.

## Known limits, stated rather than hidden

- An ad on one device only desyncs playback until it finishes, since it plays
  through the same `<video>` element.
- Age-gated or paid content fails on a device that is not signed in.
- Two devices per room. The relay and the server-authoritative controller model
  generalise further; the popup and the WebRTC mesh do not.
- The free relay sleeps after 15 minutes idle unless pinged.

## Voice

Plain and specific. Numbers with their provenance attached, never adjectives
standing in for them. No invented claims: no prices, no user counts, no
benchmarks that were not run.
