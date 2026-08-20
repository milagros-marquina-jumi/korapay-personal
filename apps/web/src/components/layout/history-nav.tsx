'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

export function HistoryNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [historial, setHistorial] = useState<string[]>([]);
  const [indice, setIndice] = useState(-1);
  const navegando = useRef(false);

  useEffect(() => {
    if (!pathname) return;
    if (navegando.current) {
      navegando.current = false;
      return;
    }
    setHistorial((prev) => {
      if (prev[indice] === pathname) return prev;
      const recortado = prev.slice(0, indice + 1);
      const siguiente = [...recortado, pathname];
      setIndice(siguiente.length - 1);
      return siguiente;
    });
  }, [pathname, indice]);

  const puedeAtras = indice > 0;
  const puedeAdelante = indice >= 0 && indice < historial.length - 1;

  const mover = useCallback(
    (delta: number) => {
      const destino = historial[indice + delta];
      if (!destino) return;
      navegando.current = true;
      setIndice(indice + delta);
      router.push(destino);
    },
    [historial, indice, router],
  );

  return (
    <div className="flex items-center gap-1">
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            disabled={!puedeAtras}
            onClick={() => mover(-1)}
            aria-label="Página anterior"
          >
            <ChevronLeft className="size-4.5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">Atrás</TooltipContent>
      </Tooltip>
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            disabled={!puedeAdelante}
            onClick={() => mover(1)}
            aria-label="Página siguiente"
          >
            <ChevronRight className="size-4.5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">Adelante</TooltipContent>
      </Tooltip>
    </div>
  );
}
