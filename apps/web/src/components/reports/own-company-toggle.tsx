'use client';

import { Eye, EyeOff } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

export const OWN_COMPANY = 'MIMOTECH';

const STORAGE_KEY = 'korapay.showOwnCompany';

export function useOwnCompanyVisibility() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    setShow(window.localStorage.getItem(STORAGE_KEY) === 'true');
  }, []);

  const toggle = useCallback(() => {
    setShow((prev) => {
      const next = !prev;
      window.localStorage.setItem(STORAGE_KEY, String(next));
      return next;
    });
  }, []);

  const isHidden = useCallback((name?: string | null) => !show && name === OWN_COMPANY, [show]);

  return { show, toggle, isHidden };
}

interface Props {
  show: boolean;
  onToggle: () => void;
  className?: string;
}

export function OwnCompanyToggle({ show, onToggle, className }: Readonly<Props>) {
  const Icon = show ? Eye : EyeOff;
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={show}
      title={show ? `Ocultar ${OWN_COMPANY} de los cálculos` : `Incluir ${OWN_COMPANY} en los cálculos`}
      className={cn(
        'inline-flex h-10 shrink-0 items-center gap-2 rounded-lg border px-3 text-sm font-medium transition-colors',
        show
          ? 'border-brand/40 bg-brand/10 text-brand-strong dark:text-brand'
          : 'border-border/70 bg-card text-muted-foreground hover:bg-muted/50',
        className,
      )}
    >
      <Icon className="size-4" aria-hidden />
      {show ? `Con ${OWN_COMPANY}` : `Sin ${OWN_COMPANY}`}
    </button>
  );
}
