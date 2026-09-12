import React from 'react';

const PATHS = {
  host: (
    <>
      <circle cx="12" cy="12" r="1.7" fill="currentColor" stroke="none" />
      <path d="M8.9 8.9a4.4 4.4 0 0 0 0 6.2" />
      <path d="M15.1 15.1a4.4 4.4 0 0 0 0-6.2" />
      <path d="M6.2 6.2a8.2 8.2 0 0 0 0 11.6" />
      <path d="M17.8 17.8a8.2 8.2 0 0 0 0-11.6" />
    </>
  ),
  join: (
    <>
      <circle cx="12" cy="12" r="8.3" />
      <path d="M8.8 12h6" />
      <path d="M12.4 9.6 14.8 12l-2.4 2.4" />
    </>
  ),
  control: (
    <>
      <path d="M4.6 9.4h11.6" />
      <path d="M13.3 6.5 16.2 9.4l-2.9 2.9" />
      <path d="M19.4 14.6H7.8" />
      <path d="M10.7 11.7 7.8 14.6l2.9 2.9" />
    </>
  ),
  guide: (
    <>
      <circle cx="12" cy="12" r="8.3" />
      <path d="M9.9 9.7a2.2 2.2 0 1 1 3 2.05c-.62.3-.95.8-.95 1.45v.35" />
      <circle cx="12" cy="16.5" r="0.95" fill="currentColor" stroke="none" />
    </>
  ),
  unpair: (
    <>
      <path d="M10.2 13.8 8.3 15.7a3.3 3.3 0 0 1-4.7-4.7l1.9-1.9" />
      <path d="M13.8 10.2l1.9-1.9a3.3 3.3 0 0 1 4.7 4.7l-1.9 1.9" />
      <path d="M9.2 14.8 14.8 9.2" />
    </>
  ),
  tab: (
    <>
      <rect x="3.5" y="5" width="17" height="14" rx="3.5" />
      <path d="M3.5 9.5h17" />
      <path d="M8 7.2h.01" />
    </>
  ),
  back: <path d="M14 7.5 9.5 12l4.5 4.5" />,
  chevron: <path d="M7.5 10 12 14.5 16.5 10" />,
  close: (
    <>
      <path d="M8 8l8 8" />
      <path d="M16 8l-8 8" />
    </>
  ),
};

export default function Icon({ name, size = 16, className = '' }) {
  const glyph = PATHS[name];
  if (!glyph) return null;
  return (
    <svg
      className={`dc-ico ${className}`}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {glyph}
    </svg>
  );
}
