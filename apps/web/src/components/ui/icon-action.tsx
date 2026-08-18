'use client';

import type { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface IconActionProps {
  icon: LucideIcon;
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  destructive?: boolean;
  className?: string;
}

export function IconAction({ icon: Icon, label, onClick, disabled, destructive, className }: IconActionProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          size="icon"
          variant="outline"
          className={cn(
            'size-8 shrink-0 rounded-md border-border bg-background',
            destructive
              ? 'text-destructive hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive'
              : 'hover:bg-muted',
            className,
          )}
          aria-label={label}
          disabled={disabled}
          onClick={onClick}
        >
          <Icon className="size-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

export function IconActions({ children, className }: Readonly<{ children: React.ReactNode; className?: string }>) {
  return <div className={cn('flex items-center justify-end gap-2', className)}>{children}</div>;
}
