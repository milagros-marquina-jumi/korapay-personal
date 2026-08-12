'use client';

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="es">
      <body
        style={{
          minHeight: '100vh',
          margin: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
          background: '#FCFAF7',
          color: '#1F2430',
          fontFamily: 'system-ui, -apple-system, Segoe UI, sans-serif',
        }}
      >
        <div style={{ maxWidth: '24rem', textAlign: 'center' }}>
          <p style={{ fontSize: '3rem', fontWeight: 700, color: '#F97316', margin: 0 }}>500</p>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0.5rem 0 0' }}>Error del servidor</h1>
          <p style={{ fontSize: '0.875rem', color: '#5C6478', margin: '0.5rem 0 0', lineHeight: 1.5 }}>
            No pudimos cargar la aplicación. Vuelve a intentarlo en unos segundos.
          </p>
          {error.digest && (
            <p style={{ fontSize: '0.75rem', color: '#8A91A3', margin: '0.75rem 0 0' }}>Ref: {error.digest}</p>
          )}
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: '1.5rem',
              padding: '0.625rem 1.25rem',
              fontSize: '0.875rem',
              fontWeight: 600,
              color: '#1F2430',
              background: '#F9A03F',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: 'pointer',
            }}
          >
            Reintentar
          </button>
        </div>
      </body>
    </html>
  );
}
