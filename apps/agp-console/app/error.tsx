"use client";

import { useEffect } from "react";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html>
      <body>
        <div className="page-shell">
          <div className="panel auth-card stack">
            <div className="h2">Something went wrong</div>
            <p className="muted">{error.message}</p>
            <button className="btn btn-primary" type="button" onClick={() => reset()}>
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
