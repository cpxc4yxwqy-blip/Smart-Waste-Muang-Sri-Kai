import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
// Sentry & Analytics initialization (optional)
// Provide DSN via VITE_SENTRY_DSN in .env for Sentry activation
import.meta.env.VITE_SENTRY_DSN && (async () => {
  try {
    const SentryMod = await import('@sentry/react');
    const { BrowserTracing } = await import('@sentry/react');
    SentryMod.init({
      dsn: import.meta.env.VITE_SENTRY_DSN,
      integrations: [new BrowserTracing()],
      tracesSampleRate: 0.2
    });
    console.info('Sentry initialized');
  } catch (e) {
    console.warn('Sentry initialization failed', e);
  }
})();

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// PWA auto registration and update handling using `virtual:pwa-register`
// This import is provided by `vite-plugin-pwa` at build time. Avoid top-level await
function registerPWA() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;
  // Dynamically import the virtual module at runtime (no top-level await)
  import('virtual:pwa-register')
    .then(({ registerSW }) => {
      const updateSW = registerSW({
        onRegistered(r) {
          console.log('SW registered:', r);
        },
        onRegisterError(err) {
          console.warn('SW registration error:', err);
        },
            onNeedRefresh() {
              console.log('New content available');
              // expose update function for UI and notify app to show prompt
              try {
                // store reference so UI can trigger update when user confirms
                (window as any).__updateServiceWorker = updateSW;
                window.dispatchEvent(new CustomEvent('swNeedRefresh'));
              } catch (e) {
                console.warn('Could not notify app of SW update', e);
              }
            },
        onOfflineReady() {
          console.log('App ready to work offline');
        }
      });
    })
    .catch((e) => {
      // Virtual module not available in some environments (dev), ignore
      // eslint-disable-next-line no-console
      console.debug('PWA register not available:', e);
    });
}

window.addEventListener('load', registerPWA);