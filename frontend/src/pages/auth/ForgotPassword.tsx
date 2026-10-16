import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { UserRole } from '../../shared';
import { api, apiErrorMessage } from '../../lib/api';
import { useAuth } from '../../lib/auth-context';
import { Button, ErrorBanner, Field, Input, MonoLabel, SuccessBanner } from '../../components/ui';
import { ChevronRightIcon } from '../../components/icons';

function dashboardPathForRole(role: UserRole): string {
  if (role === UserRole.SELLER) return '/seller/dashboard';
  if (role === UserRole.BUYER) return '/buyer/dashboard';
  return '/admin/dashboard';
}

export function ForgotPassword() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { authenticate } = useAuth();

  const [step, setStep] = useState<'phone' | 'reset'>('phone');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [resent, setResent] = useState(false);
  const [sending, setSending] = useState(false);
  const [resending, setResending] = useState(false);
  const [resetting, setResetting] = useState(false);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSending(true);
    try {
      await api.post('/auth/password/forgot', { phone });
      setStep('reset');
    } catch (err) {
      setError(apiErrorMessage(err, t('auth.forgotPassword.notFoundError')));
    } finally {
      setSending(false);
    }
  };

  const handleResend = async () => {
    setError(null);
    setResent(false);
    setResending(true);
    try {
      await api.post('/auth/password/forgot', { phone });
      setResent(true);
    } catch (err) {
      setError(apiErrorMessage(err, t('auth.forgotPassword.resendError')));
    } finally {
      setResending(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (newPassword !== confirmPassword) {
      setError(t('auth.forgotPassword.passwordMismatch'));
      return;
    }
    setResetting(true);
    try {
      const { data } = await api.post<{ accessToken: string; refreshToken: string }>('/auth/password/reset', {
        phone,
        code,
        newPassword,
      });
      const profile = await authenticate(data);
      navigate(dashboardPathForRole(profile.role), { replace: true });
    } catch (err) {
      setError(apiErrorMessage(err, t('auth.forgotPassword.resetError')));
    } finally {
      setResetting(false);
    }
  };

  if (step === 'phone') {
    return (
      <div>
        <MonoLabel className="text-copper">— {t('auth.forgotPassword.eyebrow')}</MonoLabel>
        <h1 className="mt-2 font-display text-[32px] font-medium tracking-[-0.6px] text-ink">{t('auth.forgotPassword.title')}</h1>
        <p className="mt-2 text-[14px] text-muted">
          {t('auth.forgotPassword.subtitle')}
        </p>

        <form onSubmit={handleSendOtp} className="mt-8 space-y-5">
          {error && <ErrorBanner message={error} />}
          <Field label={t('auth.forgotPassword.phoneLabel')} hint={t('auth.forgotPassword.phoneHint')}>
            <Input
              inputMode="numeric"
              placeholder={t('auth.forgotPassword.phonePlaceholder')}
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
              required
            />
          </Field>
          <Button type="submit" disabled={sending || phone.length !== 10} className="w-full">
            {sending ? t('auth.forgotPassword.sending') : t('auth.forgotPassword.sendOtp')}
            <ChevronRightIcon className="h-4 w-4" />
          </Button>
        </form>

        <p className="mt-6 text-[14px] text-muted">
          {t('auth.forgotPassword.rememberedPassword')}{' '}
          <Link to="/login" className="font-bold text-forest hover:text-forest-2">
            {t('auth.forgotPassword.backToLogin')}
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div>
      <MonoLabel className="text-copper">— {t('auth.forgotPassword.eyebrow')}</MonoLabel>
      <h1 className="mt-2 font-display text-[32px] font-medium tracking-[-0.6px] text-ink">{t('auth.forgotPassword.otpTitle')}</h1>
      <p className="mt-2 text-[14px] text-muted">
        {t('auth.forgotPassword.otpSentTo')} <span className="font-bold text-ink">+91 {phone}</span>.
        {import.meta.env.DEV && ` ${t('auth.forgotPassword.devHint')}`}
      </p>

      <form onSubmit={handleReset} className="mt-8 space-y-5">
        {error && <ErrorBanner message={error} />}
        {resent && <SuccessBanner message={t('auth.forgotPassword.resent')} />}
        <Field label={t('auth.forgotPassword.otpLabel')}>
          <Input
            inputMode="numeric"
            placeholder={t('auth.forgotPassword.otpPlaceholder')}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 8))}
            required
            autoFocus
          />
        </Field>
        <Field label={t('auth.forgotPassword.newPasswordLabel')} hint={t('auth.forgotPassword.newPasswordHint')}>
          <Input
            type="password"
            placeholder={t('auth.forgotPassword.newPasswordPlaceholder')}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            minLength={8}
          />
        </Field>
        <Field label={t('auth.forgotPassword.confirmPasswordLabel')}>
          <Input
            type="password"
            placeholder={t('auth.forgotPassword.confirmPasswordPlaceholder')}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={8}
          />
        </Field>
        <Button
          type="submit"
          disabled={resetting || code.length < 4 || newPassword.length < 8 || confirmPassword.length < 8}
          className="w-full"
        >
          {resetting ? t('auth.forgotPassword.resetting') : t('auth.forgotPassword.resetSubmit')}
          <ChevronRightIcon className="h-4 w-4" />
        </Button>
      </form>

      <button
        type="button"
        onClick={handleResend}
        disabled={resending}
        className="mt-5 text-sm font-bold text-forest transition hover:text-forest-2 disabled:opacity-50"
      >
        {resending ? t('auth.forgotPassword.resending') : t('auth.forgotPassword.resendPrompt')}
      </button>
    </div>
  );
}
