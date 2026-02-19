"use client";

/**
 * Global error boundary — catches errors in the root layout itself.
 * Must provide its own <html>/<body> since the root layout may have crashed.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "system-ui, -apple-system, sans-serif" }}>
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            padding: "2rem",
            backgroundColor: "#fafafa",
            color: "#111",
          }}
        >
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: "50%",
              backgroundColor: "#f0e6ff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 24,
              fontSize: 32,
            }}
          >
            !
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0 }}>
            Something went wrong
          </h1>
          <p style={{ marginTop: 12, color: "#666", maxWidth: 400, lineHeight: 1.6 }}>
            We ran into an unexpected error. Please try refreshing the page.
          </p>
          <button
            onClick={reset}
            style={{
              marginTop: 24,
              padding: "12px 32px",
              fontSize: 14,
              fontWeight: 600,
              border: "none",
              borderRadius: 12,
              backgroundColor: "#111",
              color: "#fff",
              cursor: "pointer",
            }}
          >
            Try Again
          </button>
          {process.env.NODE_ENV === "development" && error.message && (
            <pre
              style={{
                marginTop: 32,
                padding: 16,
                borderRadius: 12,
                backgroundColor: "#f0f0f0",
                fontSize: 12,
                color: "#666",
                maxWidth: 500,
                overflow: "auto",
                textAlign: "left",
              }}
            >
              {error.message}
              {error.digest && `\nDigest: ${error.digest}`}
            </pre>
          )}
        </div>
      </body>
    </html>
  );
}
