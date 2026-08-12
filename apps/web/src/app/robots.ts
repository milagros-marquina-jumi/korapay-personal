import type { MetadataRoute } from 'next';

// Toda la app vive tras login y muestra saldos, deudas y pagos. No hay nada
// publico que rastrear, asi que se bloquea el sitio completo. Cuando exista
// una landing publica, cambiar a allow de esa ruta y disallow del resto.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', disallow: '/' }],
  };
}
