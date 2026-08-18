export const SITE_NAME = 'KoraPay';
export const SITE_TAGLINE = 'Gestión financiera inteligente';
export const SITE_DESCRIPTION =
  'KoraPay centraliza tus finanzas personales y de negocio: movimientos, ahorros, deudas, contratos y reportes en un solo lugar.';

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3060').replace(/\/$/, '');

export const SITE_LOCALE = 'es_PE';

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
