export const DEFAULT_SERVER = 'http://localhost:8787';

export async function serverUrl() {
  const { serverUrl } = await chrome.storage.local.get('serverUrl');
  return serverUrl || DEFAULT_SERVER;
}

export async function setServerUrl(url) {
  await chrome.storage.local.set({ serverUrl: url });
}
