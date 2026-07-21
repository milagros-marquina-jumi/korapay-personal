'use client';

import { LogOut, Settings, User } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { profileInitials, useProfile } from '@/lib/use-profile';

export function UserMenu() {
  const router = useRouter();
  const { data: profile } = useProfile();
  const name = profile?.name ?? 'Mi cuenta';

  const logout = () => {
    if (typeof window !== 'undefined') window.localStorage.removeItem('korapay.session');
    router.push('/login');
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="gap-2 px-2">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-brand-soft text-brand text-xs font-semibold">
              {profileInitials(profile?.name) || 'KP'}
            </AvatarFallback>
          </Avatar>
          <span className="hidden text-sm font-medium sm:inline">{name}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="flex flex-col">
          <span>{name}</span>
          {profile?.email && <span className="text-xs font-normal text-muted-foreground">{profile.email}</span>}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push('/perfil')}>
          <User className="mr-2 h-4 w-4" /> Mi perfil
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push('/configuracion')}>
          <Settings className="mr-2 h-4 w-4" /> Configuración
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={logout}>
          <LogOut className="mr-2 h-4 w-4" /> Cerrar sesión
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
