import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, apiErrorMessage } from '../../lib/api';
import { useAuth } from '../../lib/auth-context';
import { Button, ErrorBanner, Field, Input, MonoLabel } from '../../components/ui';
import { ChevronRightIcon, ShieldCheckIcon } from '../../components/icons';

export function AdminLogin() {
  const navigate = useNavigate();
  const { authenticate } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const { data } = await api.post<{ accessToken: string; refreshToken: string }>('/auth/admin/login', { email, password });
      await authenticate(data);
      navigate('/admin/dashboard', { replace: true });
    } catch (err) {
      setError(apiErrorMessage(err, 'Invalid admin credentials.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <span className="relative flex h-11 w-11 items-center justify-center rounded-[10px] bg-ink text-white">
        <span className="pointer-events-none absolute inset-1 rounded-[7px] border border-white/15" />
        <ShieldCheckIcon className="relative h-5 w-5" />
      </span>
      <MonoLabel className="mt-4 text-copper">— Admin console</MonoLabel>
      <h1 className="mt-2 font-display text-[32px] font-medium tracking-[-0.6px] text-ink">Administrator sign-in</h1>
      <p className="mt-2 text-[14px] text-muted">Email and password access for the BIM operations team.</p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        {error && <ErrorBanner message={error} />}
        <Field label="Email address">
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="admin@BIM.in" />
        </Field>
        <Field label="Password">
          <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} placeholder="********" />
        </Field>
        <div className="text-right">
          <Link to="/forgot-password" className="text-[13px] font-bold text-forest hover:text-forest-2">
            Forgot password?
          </Link>
        </div>
        <Button type="submit" disabled={submitting} className="w-full">
          {submitting ? 'Signing in...' : 'Sign in'}
          <ChevronRightIcon className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
