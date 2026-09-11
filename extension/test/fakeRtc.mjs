class FakeChannel {
  constructor(label, options = {}) {
    this.label = label;
    this.ordered = options.ordered !== false;
    this.maxRetransmits = options.maxRetransmits;
    this.readyState = 'connecting';
    this.peer = null;
    this.sent = [];
  }

  send(data) {
    if (this.readyState !== 'open') throw new Error('channel not open');
    this.sent.push(data);
    queueMicrotask(() => this.peer?.onmessage?.({ data }));
  }

  close() {
    if (this.readyState === 'closed') return;
    this.readyState = 'closed';
    this.onclose?.();
  }

  _open() {
    this.readyState = 'open';
    this.onopen?.();
  }
}

export function createFakeRtc() {
  const bus = { offered: [], connections: [] };

  function factory() {
    const pc = {
      iceConnectionState: 'new',
      connectionState: 'new',
      localDescription: null,
      remoteDescription: null,
      _channels: [],
      createDataChannel(label, options) {
        const ch = new FakeChannel(label, options);
        pc._channels.push(ch);
        bus.offered.push(ch);
        return ch;
      },
      async createOffer() {
        return { type: 'offer', sdp: 'v=0 fake-offer' };
      },
      async createAnswer() {
        return { type: 'answer', sdp: 'v=0 fake-answer' };
      },
      async setLocalDescription(d) {
        pc.localDescription = d;

        queueMicrotask(() =>
          pc.onicecandidate?.({ candidate: { candidate: 'candidate:1 fake', toJSON: () => ({ candidate: 'candidate:1 fake' }) } }),
        );
      },
      async setRemoteDescription(d) {
        pc.remoteDescription = d;
        if (d.type === 'offer') {
          for (const remote of bus.offered) {
            const local = new FakeChannel(remote.label, {
              ordered: remote.ordered,
              maxRetransmits: remote.maxRetransmits,
            });
            local.peer = remote;
            remote.peer = local;
            pc._channels.push(local);
            queueMicrotask(() => pc.ondatachannel?.({ channel: local }));
          }
        }
      },
      async addIceCandidate() {},
      close() {
        pc.iceConnectionState = 'closed';
        for (const ch of pc._channels) ch.close();
      },
    };
    bus.connections.push(pc);
    return pc;
  }

  function completeIce() {
    for (const pc of bus.connections) {
      pc.iceConnectionState = 'connected';
      pc.oniceconnectionstatechange?.();
    }
    for (const pc of bus.connections) {
      for (const ch of pc._channels) if (ch.peer) ch._open();
    }
  }

  return { factory, completeIce, bus };
}
