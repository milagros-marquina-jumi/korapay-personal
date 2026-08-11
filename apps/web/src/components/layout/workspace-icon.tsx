import * as Icons from 'lucide-react';
import type { ComponentType } from 'react';

interface Props {
  name?: string | null;
  className?: string;
}

/**
 * Los workspaces guardan el nombre de un icono de Lucide en `emoji`.
 * Si el valor no coincide con ninguno se muestra tal cual (soporta emojis reales).
 */
export function WorkspaceIcon({ name, className }: Readonly<Props>) {
  if (!name) return null;
  const IconComponent = (Icons as unknown as Record<string, ComponentType<{ className?: string }>>)[name];
  if (IconComponent) return <IconComponent className={className} aria-hidden />;
  return <span className={className}>{name}</span>;
}
