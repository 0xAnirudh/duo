export const T = {
  HELLO: 'HELLO',
  ROOM: 'ROOM',
  PEER_JOIN: 'PEER_JOIN',
  PEER_LEAVE: 'PEER_LEAVE',
  CLOCK_REQ: 'CLOCK_REQ',
  TAKE_CONTROL: 'TAKE_CONTROL',
  CONTROLLER: 'CONTROLLER',
  SIGNAL: 'SIGNAL',
  URL: 'URL',
  PLAY: 'PLAY',
  PAUSE: 'PAUSE',
  SEEK: 'SEEK',
  RATE: 'RATE',
  HEARTBEAT: 'HEARTBEAT',
  NAME: 'NAME',
};

export const RELAYED = new Set([
  T.NAME,
  T.URL,
  T.PLAY,
  T.PAUSE,
  T.SEEK,
  T.RATE,
  T.HEARTBEAT,
]);

export const UNRELIABLE = new Set([T.HEARTBEAT]);

export const CH = {
  TO_OFFSCREEN: 'dc:to-offscreen',
  FROM_OFFSCREEN: 'dc:from-offscreen',
  TO_CONTENT: 'dc:to-content',
  FROM_CONTENT: 'dc:from-content',
  POPUP_QUERY: 'dc:popup-query',
  POPUP_EVENT: 'dc:popup-event',
  KEEPALIVE: 'dc:keepalive',
  OFFSCREEN_QUERY: 'dc:offscreen-query',
};

export const TUNING = {
  URL_DEBOUNCE_MS: 250,
  SEEK_THROTTLE_MS: 100,
  HEARTBEAT_MS: 3000,
  SUPPRESS_MS: 300,
  KEEPALIVE_MS: 20000,
};
