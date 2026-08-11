import Image from 'next/image';
import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
  size?: number;
  withWordmark?: boolean;
}

export function Logo({ className, size = 32, withWordmark = true }: Readonly<LogoProps>) {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <Image
        src="/brand/logo-mark-128.png"
        alt="KoraPay"
        width={size}
        height={size}
        priority
        className="shrink-0"
        style={{ width: size, height: size }}
      />
      {withWordmark && (
        <span className="font-display text-lg font-bold tracking-tight">
          Kora<span className="text-brand">Pay</span>
        </span>
      )}
    </div>
  );
}
