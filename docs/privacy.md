# DualControl — Privacy Policy

Last updated: 12 September 2026

DualControl pairs two browsers so they show the same page and keep video
playback in sync. This policy describes exactly what the extension handles.

## No accounts, no tracking

There is no sign-up, no login and no user profile. The extension does not use
analytics, does not track browsing, and does not show ads. Nothing is sold or
shared with third parties.

## What is stored on your device

Kept in the browser's own extension storage, on your machine only:

- The name you choose for the device, if you set one.
- The playback offset you choose, if you change it.
- The relay server address, if you override the default.
- The current pairing token and synced tab id, cleared when the browser closes.

Uninstalling the extension removes all of it. None of it is transmitted
anywhere except the pairing token, which is only sent back to the relay server
to rejoin your own room.

## What passes through the relay server

While two devices are paired, these travel between them:

- The address of the page being synced.
- Playback events: play, pause, seek position, playback rate, and a periodic
  position heartbeat.
- The device name you chose, if you set one.

**Please read this part carefully.** When the two devices cannot reach each
other directly, these messages pass through a relay server, which means the
server can see the addresses of pages you push to the other device.

The server does not log, record or store this traffic. It forwards each message
to the paired device and keeps nothing. Room state exists only in memory, holds
no page addresses, and is destroyed when both devices disconnect or after the
room expires.

When the two devices can reach each other directly, the extension upgrades to a
WebRTC data channel. That traffic is encrypted end to end and never reaches the
server at all. The popup shows which path is in use.

## What the server keeps

Only what is needed to connect two devices:

- A randomly generated room id and pairing token.
- Which connections are in a room, and which one is in control.
- For rate limiting, a count of recent join attempts per IP address, discarded
  within minutes.

No page addresses, no playback data, no content. Nothing is written to disk.

## Permissions, and why each is needed

- **tabs** — to open and update the one synced tab on the following device.
- **scripting** and **host access to all sites** — the extension drives the
  standard HTML video element, so it has to work on whichever site you are
  watching rather than a fixed list.
- **storage** — the settings listed above.
- **alarms** — to keep the connection alive in the background.
- **offscreen** — to hold the connection, which a service worker cannot do.

The extension only acts on a tab while you are paired and that tab is the one
being synced.

## Source code

The extension and the relay server are open source at
https://github.com/0xAnirudh/duo — including the server code, so the claims
above can be checked rather than taken on trust.

## Contact

Open an issue at https://github.com/0xAnirudh/duo/issues
