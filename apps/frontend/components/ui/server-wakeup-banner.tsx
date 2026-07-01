'use client';

import { useEffect, useState } from 'react';

/**
 * Pings the backend on mount. If it takes > 3s, shows a banner
 * so users know the server is warming up (Render free tier cold start).
 * Disappears automatically once the backend responds.
 */
export function ServerWakeupBanner() {
  const [show, setShow] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const apiUrl =
      process.env.NEXT_PUBLIC_API_URL ?? 'https://fabric-flow.onrender.com';

    // Show banner after 3 seconds if backend hasn't responded yet
    const showTimer = setTimeout(() => setShow(true), 3000);

    fetch(`${apiUrl}/health`, { signal: AbortSignal.timeout(120_000) })
      .then(() => {
        clearTimeout(showTimer);
        setReady(true);
        // Hide banner after short delay so user sees the "ready" state
        setTimeout(() => setShow(false), 2000);
      })
      .catch(() => {
        clearTimeout(showTimer);
        setShow(false);
      });

    return () => clearTimeout(showTimer);
  }, []);

  if (!show) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '1.25rem',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        padding: '0.75rem 1.25rem',
        borderRadius: '9999px',
        background: 'rgba(8, 12, 20, 0.92)',
        border: '1px solid rgba(79, 142, 247, 0.3)',
        backdropFilter: 'blur(12px)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
        color: '#94a3b8',
        fontSize: '0.875rem',
        fontFamily: 'inherit',
        whiteSpace: 'nowrap',
        transition: 'all 0.3s ease',
      }}
    >
      {ready ? (
        <>
          <span style={{ fontSize: '1rem' }}>✅</span>
          <span style={{ color: '#00d4aa', fontWeight: 500 }}>
            Server ready
          </span>
        </>
      ) : (
        <>
          {/* Spinner */}
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#4f8ef7"
            strokeWidth="2.5"
            strokeLinecap="round"
            style={{
              animation: 'spin 1s linear infinite',
              flexShrink: 0,
            }}
          >
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
          </svg>
          <span>
            Waking up server&hellip;{' '}
            <span style={{ color: '#64748b', fontSize: '0.8rem' }}>
              (first load may take ~30s)
            </span>
          </span>
        </>
      )}
    </div>
  );
}
