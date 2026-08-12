import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/seo';

const PRIVADO = [
  '/dashboard',
  '/movimientos',
  '/ahorros',
  '/deudas',
  '/pendientes',
  '/reportes',
  '/ingresos',
  '/contratos',
  '/renta',
  '/empresas',
  '/proyectos',
  '/aplicaciones',
  '/calendario',
  '/mimotech',
  '/mimotalents',
  '/configuracion',
  '/perfil',
  '/login',
  '/t/',
  '/offline',
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: PRIVADO }],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
