import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { UserRole } from '@machinebazaar/shared';
import { api, apiErrorMessage } from '../../lib/api';
import { useAuth } from '../../lib/auth-context';
import { Button, ErrorBanner, Field, Input, MonoLabel, SuccessBanner } from '../../components/ui';
import { ChevronRightIcon } from '../../components/icons';

interface LocationState {
  phone?: string;
  purpose?: 'SIGNUP';
  from?: { pathname: string };
}

function dashboardPathForRole(role: UserRole): string {
  if (role === UserRole.SELLER) return '/seller/dashboard';
  if (role === UserRole.BUYER) return '/buyer/dashboard';
  return '/admin/dashboard';
}

export function VerifyOtp() {
  const location = useLocation();
  const navigate = useNavigate();
  const { authenticate } = useAuth();
  const state = (location.state ?? {}) as LocationState;

  const phone = state.phone ?? '';
  const [code, setCode] = useState('');
  const purpose = state.purpose ?? 'SIGNUP';
  const [error, setError] = useState<string | null>(null);
  const [resent, setResent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);

  if (!state.phone) {
    return (
      <div>
        <h1 className="font-display text-[32px] font-medium tracking-[-0.6px] text-ink">Verify your number</h1>
        <p className="mt-3 text-[14px] text-muted">
          We couldn&apos;t find a pending verification. Please log in or sign up again to receive a fresh OTP.
        </p>
        <div className="mt-6 flex gap-3">
          <Link to="/login" className="rounded-lg bg-forest px-5 py-2.5 text-sm font-bold text-white hover:bg-forest-2">
            Go to login
          </Link>
          <Link to="/signup" className="rounded-lg border border-line px-5 py-2.5 text-sm font-bold text-ink hover:border-ink">
            Sign up
          </Link>
        </div>
      </div>
    );
  }

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const { data } = await api.post<{ accessToken: string; refreshToken: string }>('/auth/otp/verify', {
        phone,
        code,
        purpose,
      });
      const profile = await authenticate(data);
      const target = state.from?.pathname ?? dashboardPathForRole(profile.role);
      navigate(target, { replace: true });
    } catch (err) {
      setError(apiErrorMessage(err, "That code didn't match. Please check it and try again."));
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async () => {
    setError(null);
    setResent(false);
    setResending(true);
    try {
      await api.post('/auth/otp/send', { phone, purpose });
      setResent(true);
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not resend the code. Please try again shortly.'));
    } finally {
      setResending(false);
    }
  };

  return (
    <div>
      <MonoLabel className="text-copper">— Verify your number</MonoLabel>
      <h1 className="mt-2 font-display text-[32px] font-medium tracking-[-0.6px] text-ink">Enter the OTP we sent</h1>
      <p className="mt-2 text-[14px] text-muted">
        We sent a one-time code to <span className="font-bold text-ink">+91 {phone}</span>.
        {import.meta.env.DEV && ' In development, check the API server console for the code.'}
      </p>

      <form onSubmit={handleVerify} className="mt-8 space-y-5">
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
        <Button type="submit" disabled={submitting || code.length < 4} className="w-full">
          {submitting ? 'Verifying...' : 'Verify & continue'}
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
