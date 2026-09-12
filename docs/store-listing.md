==================================================================
STORE LISTING - copy/paste
==================================================================

NAME
DualControl

SHORT DESCRIPTION  (132 char max)
Pair two browsers with a 6-digit code and keep the page and video
playback in sync on both.

CATEGORY
Productivity            (Edge: Productivity)

DETAILED DESCRIPTION
Pair two browsers with a six-digit code. One device drives, the other
follows: same page, same video, same position.

Open a video, click Host a session, and type the six digits on the
other device. Play, pause, seek and change speed on the driving
device and the other one follows. Either side can take control.

Works on any site with a standard HTML video element, because it
drives the browser's own video API rather than a specific player's
controls.

- No account, no sign-in, no tracking, no ads.
- The pairing code is single use and expires after five minutes.
- Connects the two browsers directly when it can, which keeps the
  traffic off any server and the delay to a few milliseconds.
- Falls back automatically to a relay when a direct connection is
  not possible, without dropping a command.
- Corrects drift continuously, so a long video stays in step.
- Adjustable offset if one screen runs ahead of the other.

Open source, including the relay server:
https://github.com/0xAnirudh/duo

SINGLE PURPOSE  (Chrome requires this)
Keep the open page and its video playback synchronised between two
paired browsers.

==================================================================
PERMISSION JUSTIFICATIONS
==================================================================

tabs
Needed to open and update the one tab being synced on the following
device, and to detect when the user navigates on the driving device
so the other can follow.

scripting
Needed to control the page's video element: reading playback
position and applying play, pause, seek and rate changes.

storage
Stores only local settings: the device name, playback offset, relay
address, and the current pairing token. Nothing leaves the device
except the pairing token, used to rejoin the user's own room.

alarms
Keeps the background connection alive so a command sent after an
idle period is not lost.

offscreen
An MV3 service worker is terminated after 30 seconds idle, which
closes any open connection. An offscreen document holds the
WebSocket and WebRTC connection, which a service worker cannot do.

HOST PERMISSION  <all_urls>
The extension synchronises video playback on whatever site the user
is watching. It drives the standard HTML video element, so it cannot
be limited to a fixed list of sites without breaking on every other
site. It only reads or acts on a tab while two devices are paired
and that tab is the one the user chose to sync. No page content is
collected, stored or transmitted anywhere other than the paired
device.

REMOTE CODE
No. All code is bundled in the package.

DATA USE  (tick in dashboard)
- Does NOT collect: PII, health, financial, authentication,
  personal communications, location, web history*, user activity.
- * Page addresses pass between the two paired devices in transit
  and are not collected or stored. See the privacy policy.
- Not sold, not used for ads, not used for creditworthiness.

PRIVACY POLICY URL
https://dualcontrol.onrender.com/privacy
