'use client'

export default function Error({ error, reset }) {
  return (
    <div className="menu-error" role="alert">
      <span>{error?.message || "Nešto je pošlo po krivu."}</span>
      <button type="button" onClick={() => reset()}>Pokušaj ponovno</button>
    </div>
  );
}
