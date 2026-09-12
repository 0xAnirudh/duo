import { useCallback, useEffect, useState } from 'react';
import { CH } from '../shared/protocol.js';

function query(cmd, args) {
  return chrome.runtime.sendMessage({ channel: CH.POPUP_QUERY, cmd, args });
}

export function useConnection() {
  const [status, setStatus] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    try {
      setStatus(await query('status'));
    } catch {
      setStatus(null);
    }
  }, []);

  useEffect(() => {
    refresh();

    const onMessage = (message) => {
      if (message?.channel === CH.POPUP_EVENT) refresh();
    };
    chrome.runtime.onMessage.addListener(onMessage);
    return () => chrome.runtime.onMessage.removeListener(onMessage);
  }, [refresh]);

  const run = useCallback(
    async (cmd, args) => {
      setBusy(true);
      setError(null);
      try {
        const res = await query(cmd, args);
        if (res?.error) setError(res.error);
        await refresh();
        return res;
      } finally {
        setBusy(false);
      }
    },
    [refresh],
  );

  return {
    status,
    error,
    busy,
    host: () => run('host'),
    join: (code) => run('join', { code }),
    takeControl: () => run('takeControl'),
    setOffset: (ms) => run('setOffset', { ms }),
    setName: (name) => run('setName', { name }),
    syncActiveTab: () => run('syncActiveTab'),
    leave: () => run('leave'),
  };
}
