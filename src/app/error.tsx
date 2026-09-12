"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="empty">
      <h1>We hit an unexpected block.</h1>
      <p>Try loading this page again.</p>
      <button className="button" onClick={reset}>
        Try again
      </button>
    </main>
  );
}
