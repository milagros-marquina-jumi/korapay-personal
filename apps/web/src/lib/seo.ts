export const SITE_NAME = 'KoraPay';
export const SITE_TAGLINE = 'Gestión financiera inteligente';
export const SITE_DESCRIPTION =
  'KoraPay centraliza tus finanzas personales y de negocio: movimientos, ahorros, deudas, contratos y reportes en un solo lugar.';

// Se lee de env para que canonical y OG apunten al dominio real sin recompilar.
// En local cae a localhost; en produccion se define en Render.
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3060').replace(/\/$/, '');

export const SITE_LOCALE = 'es_PE';

// Origen de la API para preconnect. Solo aporta si es un host distinto al del
// sitio; si la URL no es valida se omite en vez de romper el render.
export const API_ORIGIN = (() => {
  const raw = process.env.NEXT_PUBLIC_API_URL;
  if (!raw) return null;
  try {
    const origin = new URL(raw).origin;
    return origin === SITE_URL ? null : origin;
  } catch {
    return null;
  }
})();
