import Link from "next/link";
export default function NotFound() {
  return (
    <main className="auth-page">
      <div className="auth-card">
        <span className="eyebrow">404 · UNEXPLORED TERRITORY</span>
        <h1>This chunk hasn’t loaded.</h1>
        <p>The page may have moved or no longer exists.</p>
        <Link className="button" href="/home">
          Back to your world
        </Link>
      </div>
    </main>
  );
}
