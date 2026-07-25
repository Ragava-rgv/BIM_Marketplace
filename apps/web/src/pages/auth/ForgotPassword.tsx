import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserRole } from '@machinebazaar/shared';
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
      setError(apiErrorMessage(err, 'Could not find an account with that mobile number.'));
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
      setError(apiErrorMessage(err, 'Could not resend the code. Please try again shortly.'));
    } finally {
      setResending(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
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
      setError(apiErrorMessage(err, "That code didn't match or has expired. Please check it and try again."));
    } finally {
      setResetting(false);
    }
  };

  if (step === 'phone') {
    return (
      <div>
        <MonoLabel className="text-copper">— Forgot password</MonoLabel>
        <h1 className="mt-2 font-display text-[32px] font-medium tracking-[-0.6px] text-ink">Reset your password</h1>
        <p className="mt-2 text-[14px] text-muted">
          Enter your registered mobile number and we&apos;ll send a one-time code to reset your password.
        </p>

        <form onSubmit={handleSendOtp} className="mt-8 space-y-5">
          {error && <ErrorBanner message={error} />}
          <Field label="Mobile number" hint="10-digit Indian mobile number">
            <Input
              inputMode="numeric"
              placeholder="98765 43210"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
              required
            />
          </Field>
          <Button type="submit" disabled={sending || phone.length !== 10} className="w-full">
            {sending ? 'Sending...' : 'Send OTP'}
            <ChevronRightIcon className="h-4 w-4" />
          </Button>
        </form>

        <p className="mt-6 text-[14px] text-muted">
          Remembered your password?{' '}
          <Link to="/login" className="font-bold text-forest hover:text-forest-2">
            Back to login
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div>
      <MonoLabel className="text-copper">— Forgot password</MonoLabel>
      <h1 className="mt-2 font-display text-[32px] font-medium tracking-[-0.6px] text-ink">Enter the OTP we sent</h1>
      <p className="mt-2 text-[14px] text-muted">
        We sent a one-time code to <span className="font-bold text-ink">+91 {phone}</span>.
        {import.meta.env.DEV && ' In development, check the API server console for the code.'}
      </p>

      <form onSubmit={handleReset} className="mt-8 space-y-5">
        {error && <ErrorBanner message={error} />}
        {resent && <SuccessBanner message="A new code has been sent." />}
        <Field label="One-time code">
          <Input
            inputMode="numeric"
            placeholder="******"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 8))}
            required
            autoFocus
          />
        </Field>
        <Field label="New password" hint="At least 8 characters">
          <Input
            type="password"
            placeholder="********"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            minLength={8}
          />
        </Field>
        <Field label="Confirm new password">
          <Input
            type="password"
            placeholder="********"
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
          {resetting ? 'Resetting...' : 'Reset password & sign in'}
          <ChevronRightIcon className="h-4 w-4" />
        </Button>
      </form>

      <button
        type="button"
        onClick={handleResend}
        disabled={resending}
        className="mt-5 text-sm font-bold text-forest transition hover:text-forest-2 disabled:opacity-50"
      >
        {resending ? 'Resending...' : "Didn't get a code? Resend it"}
      </button>
    </div>
  );
}
