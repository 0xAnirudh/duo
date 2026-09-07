import React, { useState } from 'react';
import { useConnection } from './useConnection.js';

const MESSAGES = {
  bad_code: 'No room with that code. Codes expire after five minutes.',
  room_full: 'That room already has two devices.',
  room_gone: 'The room closed.',
  bad_token: 'The room closed.',
};

function Dot({ on }) {
  return <span className={`dc-dot ${on ? 'is-on' : ''}`} />;
}

function Latency({ status }) {
  if (!status?.paired) return null;
  const path = status.path === 'direct' ? 'Direct' : 'Relay';
  const rtt = status.rtt;
  return (
    <span className="dc-state">
      {path}
      {rtt ? ` \u00b7 ${rtt.p50}ms` : ' \u00b7 \u2026'}
    </span>
  );
}

function CodeInput({ onSubmit, busy }) {
  const [value, setValue] = useState('');
  const clean = value.replace(/\D/g, '').slice(0, 6);

  return (
    <form
      className="dc-join"
      onSubmit={(e) => {
        e.preventDefault();
        if (clean.length === 6) onSubmit(clean);
      }}
    >
      <input
        className="dc-input"
        inputMode="numeric"
        placeholder="000000"
        value={clean}
        onChange={(e) => setValue(e.target.value)}
        autoFocus
      />
      <button className="dc-btn" disabled={clean.length !== 6 || busy}>
        Join
      </button>
    </form>
  );
}

export default function App() {
  const { status, error, busy, host, join, takeControl, leave } = useConnection();
  const [mode, setMode] = useState(null);

  const paired = status?.paired;
  const code = status?.code;

  return (
    <div className="dc">
      <header className="dc-head">
        <Dot on={paired} />
        <h1>DualControl</h1>
        {paired ? (
          <Latency status={status} />
        ) : (
          <span className="dc-state">{status?.connected ? 'Waiting' : 'Offline'}</span>
        )}
      </header>

      {error && <p className="dc-error">{MESSAGES[error] ?? error}</p>}

      {!paired && !code && mode !== 'join' && (
        <div className="dc-actions">
          <button className="dc-btn dc-btn-primary" onClick={host} disabled={busy}>
            Host a session
          </button>
          <button className="dc-btn" onClick={() => setMode('join')}>
            Enter a code
          </button>
        </div>
      )}

      {!paired && !code && mode === 'join' && (
        <>
          <p className="dc-hint">Type the six digits from the other device.</p>
          <CodeInput onSubmit={join} busy={busy} />
          <button className="dc-link" onClick={() => setMode(null)}>
            Back
          </button>
        </>
      )}

      {!paired && code && (
        <>
          <p className="dc-hint">Enter this on the other device.</p>
          <div className="dc-code">{code}</div>
          <p className="dc-sub">Expires in five minutes.</p>
        </>
      )}

      {paired && (
        <>
          <div className="dc-row">
            <span className="dc-label">Driving</span>
            <span className="dc-value">
              {status.amController ? 'This device' : 'The other device'}
            </span>
          </div>
          {status.rtt && (
            <div className="dc-row dc-row-tight">
              <span className="dc-label">Round trip</span>
              <span className="dc-value dc-mono">
                p50 {status.rtt.p50}ms \u00b7 p95 {status.rtt.p95}ms
              </span>
            </div>
          )}
          {!status.amController && (
            <button className="dc-btn dc-btn-primary" onClick={takeControl} disabled={busy}>
              Take control
            </button>
          )}
          <button className="dc-link" onClick={leave}>
            Unpair
          </button>
        </>
      )}
    </div>
  );
}
