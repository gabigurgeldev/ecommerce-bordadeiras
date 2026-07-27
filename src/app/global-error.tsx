"use client";

import { useEffect } from "react";

/** Last-resort boundary: replaces the root layout, so it needs html/body. */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[global]", error);
  }, [error]);

  return (
    <html lang="pt-BR">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, sans-serif",
          background: "#faf7f4",
          color: "#3f2d23",
          padding: "1.5rem",
        }}
      >
        <div style={{ maxWidth: "28rem", textAlign: "center" }}>
          <h1 style={{ fontSize: "1.5rem", marginBottom: "0.75rem" }}>
            Algo deu errado
          </h1>
          <p style={{ fontSize: "0.95rem", lineHeight: 1.6, opacity: 0.8 }}>
            Não conseguimos carregar a página. Tente novamente em instantes.
          </p>
          {error.digest && (
            <p style={{ fontSize: "0.75rem", opacity: 0.6, marginTop: "0.5rem" }}>
              Código: {error.digest}
            </p>
          )}
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: "1.5rem",
              padding: "0.65rem 1.4rem",
              borderRadius: "999px",
              border: "none",
              background: "#b4795a",
              color: "#fff",
              fontSize: "0.9rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Tentar novamente
          </button>
        </div>
      </body>
    </html>
  );
}
