export const ICE_SERVERS = [{ urls: 'stun:stun.l.google.com:19302' }];

const DEAD_STATES = new Set(['failed', 'closed']);

export function createDirectLink({
  selfId,
  peerId,
  sendSignal,
  onMessage,
  onStatus,
  createPeerConnection = (config) => new RTCPeerConnection(config),
}) {
  const initiator = String(selfId) < String(peerId);

  let pc = null;
  let ctrl = null;
  let sync = null;
  let pendingIce = [];
  let disposed = false;

  function report() {
    onStatus?.({ open: isOpen(), state: pc?.iceConnectionState ?? 'new', initiator });
  }

  function wire(channel) {
    if (channel.label === 'ctrl') ctrl = channel;
    else sync = channel;

    channel.onopen = report;
    channel.onclose = report;
    channel.onerror = report;
    channel.onmessage = (event) => {
      let msg;
      try {
        msg = JSON.parse(event.data);
      } catch {
        return;
      }
      onMessage?.(msg, channel.label);
    };
  }

  async function start() {
    if (pc || disposed) return;
    pc = createPeerConnection({ iceServers: ICE_SERVERS });

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        sendSignal({ kind: 'ice', candidate: event.candidate.toJSON?.() ?? event.candidate });
      }
    };

    pc.oniceconnectionstatechange = report;
    pc.onconnectionstatechange = report;

    if (initiator) {
      wire(pc.createDataChannel('ctrl', { ordered: true }));
      wire(pc.createDataChannel('sync', { ordered: false, maxRetransmits: 0 }));

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      sendSignal({ kind: 'sdp', sdp: pc.localDescription });
    } else {
      pc.ondatachannel = (event) => wire(event.channel);
    }
  }

  async function handleSignal(msg) {
    if (disposed) return;
    if (!pc) await start();

    if (msg.kind === 'sdp') {
      await pc.setRemoteDescription(msg.sdp);

      for (const candidate of pendingIce) {
        await pc.addIceCandidate(candidate).catch(() => {});
      }
      pendingIce = [];

      if (msg.sdp.type === 'offer') {
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        sendSignal({ kind: 'sdp', sdp: pc.localDescription });
      }
      return;
    }

    if (msg.kind === 'ice') {
      if (!pc.remoteDescription) {
        pendingIce.push(msg.candidate);
        return;
      }
      await pc.addIceCandidate(msg.candidate).catch(() => {});
    }
  }

  function isOpen() {
    return ctrl?.readyState === 'open' && !DEAD_STATES.has(pc?.iceConnectionState);
  }

  function send(message, unreliable = false) {
    const channel = unreliable && sync?.readyState === 'open' ? sync : ctrl;
    if (channel?.readyState !== 'open') return false;
    channel.send(JSON.stringify(message));
    return true;
  }

  function close() {
    disposed = true;
    try {
      ctrl?.close();
      sync?.close();
      pc?.close();
    } catch {
    }
    ctrl = sync = pc = null;
    report();
  }

  return { start, handleSignal, send, isOpen, close, initiator };
}
