'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('demo@korapay.local');
  const [password, setPassword] = useState('KoraPay123!');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await new Promise((r) => setTimeout(r, 500));
      router.push('/dashboard');
    } catch {
      setError('Error al iniciar sesion');
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      {' '}
      <div className="w-full max-w-sm">
        {' '}
        <div className="mb-8 text-center">
          {' '}
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
            {' '}
            <span className="font-display text-xl font-bold text-primary-foreground">K</span>{' '}
          </div>{' '}
          <h1 className="font-display text-2xl font-bold">KoraPay</h1>{' '}
          <p className="mt-2 text-sm text-muted-foreground">Inicia sesion en tu cuenta</p>{' '}
        </div>{' '}
        <form onSubmit={handleLogin} className="space-y-4">
          {' '}
          <div>
            {' '}
            <label htmlFor="email" className="block text-sm font-medium">
              {' '}
              Email{' '}
            </label>{' '}
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm"
              required
            />{' '}
          </div>{' '}
          <div>
            {' '}
            <label htmlFor="password" className="block text-sm font-medium">
              {' '}
              Contrasena{' '}
            </label>{' '}
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm"
              required
            />{' '}
          </div>{' '}
          {error && <div className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive"> {error} </div>}{' '}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {' '}
            {loading ? 'Iniciando sesion...' : 'Iniciar Sesion'}{' '}
          </button>{' '}
        </form>{' '}
        <p className="mt-6 text-center text-xs text-muted-foreground"> Demo: demo@korapay.local / KoraPay123! </p>{' '}
      </div>{' '}
    </div>
  );
}
