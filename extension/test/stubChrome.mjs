export function installChromeStub({ tabs: initial = [[7, 'about:blank']] } = {}) {
  const store = {};
  const updated = [];
  const removed = [];
  const tabs = new Map(initial.map(([id, url]) => [id, { id, url }]));
  let nextId = 100;

  function fireUpdated(tabId, url) {
    for (const fn of updated) fn(tabId, { url });
  }

  globalThis.chrome = {
    storage: {
      session: {
        get: async (key) => (key in store ? { [key]: store[key] } : {}),
        set: async (obj) => void Object.assign(store, obj),
        remove: async (key) => void delete store[key],
      },
    },
    tabs: {
      onUpdated: { addListener: (fn) => updated.push(fn) },
      onRemoved: { addListener: (fn) => removed.push(fn) },
      query: async () => [tabs.values().next().value],
      get: async (id) => {
        if (!tabs.has(id)) throw new Error('No tab with id: ' + id);
        return tabs.get(id);
      },
      update: async (id, { url }) => {
        tabs.get(id).url = url;
        fireUpdated(id, url);
      },
      create: async ({ url }) => {
        const tab = { id: nextId++, url };
        tabs.set(tab.id, tab);
        fireUpdated(tab.id, url);
        return tab;
      },
    },
  };

  return { store, tabs, fireUpdated, closeTab: (id) => tabs.delete(id) };
}

export const settle = (ms = 400) => new Promise((r) => setTimeout(r, ms));
