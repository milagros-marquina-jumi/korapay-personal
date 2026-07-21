import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
  size?: number;
  withWordmark?: boolean;
}

export function Logo({ className, size = 32, withWordmark = true }: LogoProps) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label="KoraPay"
      >
        <defs>
          <linearGradient id="kp-logo" x1="4" y1="4" x2="60" y2="60" gradientUnits="userSpaceOnUse">
            <stop stopColor="#00B389" />
            <stop offset="1" stopColor="#12A5B8" />
          </linearGradient>
        </defs>
        <rect x="2" y="2" width="60" height="60" rx="16" fill="url(#kp-logo)" />
        <path d="M24 18v28" stroke="#FFFFFF" strokeWidth="5.5" strokeLinecap="round" />
        <path
          d="M44 18 27 32l17 14"
          stroke="#FFFFFF"
          strokeWidth="5.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <circle cx="44" cy="18" r="4.5" fill="#FFFFFF" />
      </svg>
      {withWordmark && (
        <span className="font-display text-lg font-bold tracking-tight">
          Kora<span className="text-brand">Pay</span>
        </span>
      )}
    </div>
  );
}
