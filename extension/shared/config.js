export const DEFAULT_SERVER = 'https://dualcontrol.onrender.com';

export async function serverUrl() {
  const { serverUrl } = await chrome.storage.local.get('serverUrl');
  return serverUrl || DEFAULT_SERVER;
}

export async function setServerUrl(url) {
  await chrome.storage.local.set({ serverUrl: url });
}

export const MAX_OFFSET_MS = 2000;

export async function syncOffsetMs() {
  const { syncOffsetMs } = await chrome.storage.local.get('syncOffsetMs');
  return Number(syncOffsetMs) || 0;
}

export async function setSyncOffsetMs(ms) {
  const clamped = Math.max(-MAX_OFFSET_MS, Math.min(MAX_OFFSET_MS, Math.round(ms) || 0));
  await chrome.storage.local.set({ syncOffsetMs: clamped });
  return clamped;
}

export const MAX_NAME_LEN = 24;

export async function deviceName() {
  const { deviceName } = await chrome.storage.local.get('deviceName');
  return deviceName || '';
}

export async function setDeviceName(name) {
  const clean = String(name ?? '').trim().slice(0, MAX_NAME_LEN);
  await chrome.storage.local.set({ deviceName: clean });
  return clean;
}
