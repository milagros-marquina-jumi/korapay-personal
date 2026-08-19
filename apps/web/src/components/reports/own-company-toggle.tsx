'use client';

import { Eye, EyeOff } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

export const OWN_COMPANY = 'MIMOTECH';

const STORAGE_KEY = 'korapay.showOwnCompany';

export function useOwnCompanyVisibility(ownName?: string) {
  const [show, setShow] = useState(false);
  const name = ownName ?? OWN_COMPANY;

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

  const isHidden = useCallback((n?: string | null) => !show && n === name, [show, name]);

  return { show, toggle, isHidden, ownName: name };
}

interface Props {
  show: boolean;
  onToggle: () => void;
  className?: string;
  name?: string;
}

export function OwnCompanyToggle({ show, onToggle, className, name = OWN_COMPANY }: Readonly<Props>) {
  const Icon = show ? Eye : EyeOff;
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={show}
      title={show ? `Ocultar ${name} de los cálculos` : `Incluir ${name} en los cálculos`}
      className={cn(
        'inline-flex h-10 shrink-0 items-center gap-2 rounded-lg border px-3 text-sm font-medium transition-colors',
        show
          ? 'border-brand/40 bg-brand/10 text-brand-strong dark:text-brand'
          : 'border-border/70 bg-card text-muted-foreground hover:bg-muted/50',
        className,
      )}
    >
      <Icon className="size-4" aria-hidden />
      {show ? `Con ${name}` : `Sin ${name}`}
    </button>
  );
}
