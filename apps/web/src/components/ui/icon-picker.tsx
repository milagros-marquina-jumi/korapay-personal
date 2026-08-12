'use client';

import { WorkspaceIcon } from '@/components/layout/workspace-icon';

export const PICKER_ICONS = [
  'Home',
  'Briefcase',
  'Building2',
  'PiggyBank',
  'Users',
  'Wallet',
  'Star',
  'Heart',
  'Zap',
  'Globe',
  'Rocket',
  'Gem',
  'Coffee',
  'BookOpen',
  'Palette',
  'GraduationCap',
  'Boxes',
  'Code',
  'Smartphone',
  'Cloud',
  'Database',
  'ShoppingCart',
  'Megaphone',
  'Wrench',
] as const;

interface IconPickerProps {
  readonly value?: string | null;
  readonly onChange: (icon: string) => void;
  readonly icons?: readonly string[];
}

export function IconPicker({ value, onChange, icons = PICKER_ICONS }: IconPickerProps) {
  return (
    <div className="grid grid-cols-8 gap-2">
      {icons.map((name) => (
        <button
          key={name}
          type="button"
          onClick={() => onChange(name)}
          title={name}
          aria-pressed={value === name}
          className={`flex h-10 w-10 items-center justify-center rounded-lg border transition-colors ${
            value === name
              ? 'border-brand bg-brand/10 text-brand'
              : 'border-border text-muted-foreground hover:border-muted-foreground'
          }`}
        >
          <WorkspaceIcon name={name} className="h-5 w-5" />
        </button>
      ))}
    </div>
  );
}
