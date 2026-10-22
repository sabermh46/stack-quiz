import { useRegisterSW } from 'virtual:pwa-register/react';

// Registers the service worker and shows a small toast when the app is ready
// offline, or when a new version has been downloaded and is waiting.
export default function UpdatePrompt() {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW();

  if (!offlineReady && !needRefresh) return null;

  function close() {
    setOfflineReady(false);
    setNeedRefresh(false);
  }

  return (
    <div className="toast" role="status">
      <span>{needRefresh ? 'A new version is available.' : 'Ready to work offline.'}</span>
      {needRefresh && (
        <button type="button" className="btn btn--primary btn--small" onClick={() => updateServiceWorker(true)}>
          Reload
        </button>
      )}
      <button type="button" className="btn btn--ghost btn--small" onClick={close} aria-label="Dismiss">
        ✕
      </button>
    </div>
  );
}
