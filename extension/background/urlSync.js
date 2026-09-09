import { T, TUNING } from '../shared/protocol.js';

const GUARD_MS = 1500;
const remoteNav = new Map();

function markRemote(tabId) {
  remoteNav.set(tabId, Date.now() + GUARD_MS);
}

function wasRemote(tabId) {
  const until = remoteNav.get(tabId);
  if (until === undefined) return false;
  if (Date.now() > until) {
    remoteNav.delete(tabId);
    return false;
  }
  return true;
}

async function syncedTabId() {
  const { dcTabId } = await chrome.storage.session.get('dcTabId');
  return dcTabId ?? null;
}

async function setSyncedTab(tabId) {
  await chrome.storage.session.set({ dcTabId: tabId });
}

export async function adoptActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  if (tab?.id !== undefined) await setSyncedTab(tab.id);
  return tab?.id ?? null;
}

let debounceTimer = null;
let pending = null;

export function install({ live, sendToPeer }) {
  chrome.tabs.onUpdated.addListener(async (tabId, changeInfo) => {
    if (!changeInfo.url) return;
    if (wasRemote(tabId)) return;
    if (!live.paired || !live.amController) return;
    if (tabId !== (await syncedTabId())) return;

    pending = changeInfo.url;
    clearTimeout(debounceTimer);

    debounceTimer = setTimeout(() => {
      if (pending) sendToPeer({ t: T.URL, url: pending });
      pending = null;
    }, TUNING.URL_DEBOUNCE_MS);
  });

  chrome.tabs.onRemoved.addListener(async (tabId) => {
    remoteNav.delete(tabId);
    if (tabId === (await syncedTabId())) {
      await chrome.storage.session.remove('dcTabId');
    }
  });
}

export async function applyRemoteUrl(url) {
  const tabId = await syncedTabId();

  if (tabId !== null) {
    try {
      await chrome.tabs.get(tabId);
      markRemote(tabId);
      await chrome.tabs.update(tabId, { url });
      return tabId;
    } catch {
    }
  }

  const tab = await chrome.tabs.create({ url, active: false });
  markRemote(tab.id);
  await setSyncedTab(tab.id);
  return tab.id;
}

export { syncedTabId };

export async function ensureSyncedTab() {
  if ((await syncedTabId()) !== null) return;
  await adoptActiveTab();
}
