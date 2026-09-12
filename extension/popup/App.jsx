import React, { useEffect, useState } from 'react';
import { useConnection } from './useConnection.js';

const MESSAGES = {
  bad_code: 'No room with that code. Codes last five minutes.',
  room_full: 'That room already has two devices.',
  room_gone: 'The room closed.',
  bad_token: 'The room closed.',
  rate_limited: 'Too many attempts. Wait a minute.',
  locked_out: 'Too many wrong codes. Try again in five minutes.',
};

function Chip({ status, open, onToggle }) {
  const direct = status?.path === 'direct';
  const rtt = status?.rtt;
  return (
    <button
      className={`dc-chip ${direct ? 'is-direct' : ''} ${open ? 'is-open' : ''}`}
      onClick={onToggle}
      title="Connection detail"
    >
      {direct ? 'DIRECT' : 'RELAY'}
      {rtt ? ` · ${rtt.p50}ms` : ' · –'}
      <span className="dc-chip-caret">▼</span>
    </button>
  );
}

function CodeInput({ onSubmit, busy }) {
  const [value, setValue] = useState('');
  const clean = value.replace(/\D/g, '').slice(0, 6);
  return (
    <form
      className="dc-actions"
      onSubmit={(e) => {
        e.preventDefault();
        if (clean.length === 6) onSubmit(clean);
      }}
    >
      <input
        className="dc-input dc-input-code"
        inputMode="numeric"
        placeholder="000000"
        value={clean}
        onChange={(e) => setValue(e.target.value)}
        autoFocus
      />
      <button className="dc-btn dc-btn-primary" disabled={clean.length !== 6 || busy}>
        Join
      </button>
    </form>
  );
}

function NameField({ value, onSave }) {
  const [draft, setDraft] = useState(value ?? '');
  useEffect(() => setDraft(value ?? ''), [value]);
  return (
    <input
      className="dc-input"
      placeholder="Name this device"
      value={draft}
      maxLength={24}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => draft !== value && onSave(draft)}
      onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
    />
  );
}

function Guide({ onClose }) {
  return (
    <div className="glass dc-guide dc-fade">
      <h2>How to use it</h2>
      <ol className="dc-steps">
        <li>Open the video you want to watch.</li>
        <li>
          Click <b>Host a session</b>. You get six digits.
        </li>
        <li>On the other device, type those digits.</li>
        <li>Play, pause and seek on the driving device. The other follows.</li>
        <li>
          To swap, click <b>Take control</b> on the other device.
        </li>
      </ol>
      <div className="dc-foot" style={{ marginTop: 12 }}>
        <button className="dc-link dc-spacer" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
}

export default function App() {
  const { status, error, busy, host, join, takeControl, leave, setOffset, setName } =
    useConnection();
  const [mode, setMode] = useState(null);
  const [detail, setDetail] = useState(false);
  const [guide, setGuide] = useState(false);

  const paired = Boolean(status?.paired);
  const code = status?.code;
  const offset = status?.syncOffsetMs ?? 0;
  const driver = status?.amController
    ? 'This device'
    : status?.peerName || 'The other device';

  return (
    <div className="dc">
      <div className="glass">
        <div className="dc-head">
          <span className={`dc-dot ${paired ? 'is-on' : ''}`} />
          <h1 className="dc-title">DualControl</h1>
          {paired ? (
            <Chip status={status} open={detail} onToggle={() => setDetail((d) => !d)} />
          ) : (
            <span className="dc-chip">{status?.connected ? 'WAITING' : 'OFFLINE'}</span>
          )}
        </div>

        {paired && (
          <div className={`dc-detail ${detail ? 'is-open' : ''}`}>
            <div className="dc-detail-inner">
              <div className="dc-row">
                <span className="dc-label">Round trip</span>
                <span className="dc-mono">
                  {status.rtt ? `p50 ${status.rtt.p50}ms · p95 ${status.rtt.p95}ms` : 'measuring'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {guide && <Guide onClose={() => setGuide(false)} />}

      {!guide && error && <p className="dc-error dc-fade">{MESSAGES[error] ?? error}</p>}

      {!guide && !paired && !code && mode !== 'join' && (
        <div className="glass dc-body dc-fade">
          <div className="dc-actions">
            <button className="dc-btn dc-btn-primary" onClick={host} disabled={busy}>
              Host a session
            </button>
            <button className="dc-btn" onClick={() => setMode('join')}>
              Enter a code
            </button>
          </div>
        </div>
      )}

      {!guide && !paired && !code && mode === 'join' && (
        <div className="glass dc-body dc-fade">
          <p className="dc-hint">Type the six digits from the other device.</p>
          <CodeInput onSubmit={join} busy={busy} />
          <button className="dc-link" onClick={() => setMode(null)}>
            Back
          </button>
        </div>
      )}

      {!guide && !paired && code && (
        <div className="glass dc-body dc-fade">
          <p className="dc-hint">Enter this on the other device.</p>
          <div className="dc-code">{code}</div>
          <p className="dc-sub">Expires in five minutes.</p>
        </div>
      )}

      {!guide && paired && (
        <div className="glass dc-body dc-fade">
          <div className="dc-row">
            <span className="dc-label">Driving</span>
            <span className="dc-value">{driver}</span>
          </div>

          <div className="dc-row">
            <span className="dc-label">Offset</span>
            <span className="dc-stepper">
              <button className="dc-step" onClick={() => setOffset(offset - 25)} disabled={busy}>
                −
              </button>
              <span className="dc-step-value">{offset > 0 ? `+${offset}` : offset} ms</span>
              <button className="dc-step" onClick={() => setOffset(offset + 25)} disabled={busy}>
                +
              </button>
            </span>
          </div>

          {!status.amController && (
            <button className="dc-btn dc-btn-primary" onClick={takeControl} disabled={busy}>
              Take control
            </button>
          )}
        </div>
      )}

      {!guide && (
        <div className="glass dc-body dc-fade">
          <NameField value={status?.deviceName} onSave={setName} />
          <p className="dc-sub">Shown on the other device instead of “the other device”.</p>
        </div>
      )}

      {!guide && (
        <div className="dc-foot">
          <button className="dc-link" onClick={() => setGuide(true)}>
            Guide
          </button>
          {paired && (
            <button className="dc-link dc-link-danger dc-spacer" onClick={leave}>
              Unpair
            </button>
          )}
        </div>
      )}
    </div>
  );
}
