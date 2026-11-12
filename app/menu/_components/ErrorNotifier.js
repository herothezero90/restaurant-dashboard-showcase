'use client'

export default function ErrorNotifier({ error, setError }) {
  if (!error) return null;

  return (
    <div className="menu-error" role="alert">
      <span>{error}</span>
      <button type="button" onClick={() => setError(null)} aria-label="Zatvori">×</button>
    </div>
  );
}
