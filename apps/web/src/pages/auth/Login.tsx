import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { UserRole } from '@machinebazaar/shared';
import { api, apiErrorMessage } from '../../lib/api';
import { useAuth } from '../../lib/auth-context';
import { Button, ErrorBanner, Field, Input, MonoLabel } from '../../components/ui';
import { ChevronRightIcon } from '../../components/icons';

interface LocationState {
  from?: { pathname: string };
}

function dashboardPathForRole(role: UserRole): string {
  if (role === UserRole.SELLER) return '/seller/dashboard';
  if (role === UserRole.BUYER) return '/buyer/dashboard';
  return '/admin/dashboard';
}

export function Login() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { authenticate } = useAuth();
  const state = (location.state ?? {}) as LocationState;

  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const { data } = await api.post<{ accessToken: string; refreshToken: string }>('/auth/login', { phone, password });
      const profile = await authenticate(data);
      const target = state.from?.pathname ?? dashboardPathForRole(profile.role);
      navigate(target, { replace: true });
    } catch (err) {
      setError(apiErrorMessage(err, t('auth.login.errorDefault')));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <MonoLabel className="text-copper">— {t('auth.login.eyebrow')}</MonoLabel>
      <h1 className="mt-2 font-display text-[32px] font-medium tracking-[-0.6px] text-ink">{t('auth.login.title')}</h1>
      <p className="mt-2 text-[14px] text-muted">{t('auth.login.subtitle')}</p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        {error && <ErrorBanner message={error} />}
        <Field label={t('auth.login.phoneLabel')} hint={t('auth.login.phoneHint')}>
          <Input
            inputMode="numeric"
            placeholder={t('auth.login.phonePlaceholder')}
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
            required
          />
        </Field>
        <Field label={t('auth.login.passwordLabel')}>
          <Input
            type="password"
            placeholder={t('auth.login.passwordPlaceholder')}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
          />
        </Field>
        <div className="text-right">
          <Link to="/forgot-password" className="text-[13px] font-bold text-forest hover:text-forest-2">
            {t('auth.login.forgotPassword')}
          </Link>
        </div>
        <Button type="submit" disabled={submitting || phone.length !== 10 || password.length < 8} className="w-full">
          {submitting ? t('auth.login.submitting') : t('auth.login.submit')}
          <ChevronRightIcon className="h-4 w-4" />
        </Button>
      </form>

      <p className="mt-6 text-[14px] text-muted">
        {t('auth.login.newToBim')}{' '}
        <Link to="/signup" className="font-bold text-forest hover:text-forest-2">
          {t('auth.login.createAccount')}
        </Link>
      </p>
      <p className="mt-2 text-[14px] text-muted">
        {t('auth.login.areYouAdmin')}{' '}
        <Link to="/admin/login" className="font-bold text-forest hover:text-forest-2">
          {t('auth.login.adminLogin')}
        </Link>
      </p>
    </div>
  );
}
