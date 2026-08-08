import { useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { UserRole } from '@machinebazaar/shared';
import { api, apiErrorMessage } from '../../lib/api';
import { useAuth } from '../../lib/auth-context';

function dashboardPath(role: UserRole): string {
  return role === UserRole.SELLER ? '/seller/dashboard' : '/';
}

interface LocationState {
  phone?: string;
  purpose?: 'SIGNUP';
}

export function VerifyOtp() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { state } = useLocation() as { state: LocationState | null };
  const { authenticate } = useAuth();

  const phone = state?.phone ?? '';
  const purpose = state?.purpose ?? 'SIGNUP';

  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const refs = Array.from({ length: 6 }, () => useRef<HTMLInputElement>(null));

  if (!phone) {
    return (
      <div className="min-h-screen bg-forest flex flex-col">
        <div className="flex-1" />
        <div className="bg-white rounded-t-[24px] px-6 pt-6" style={{ paddingBottom: `calc(env(safe-area-inset-bottom) + 24px)` }}>
          <h2 className="text-[20px] font-extrabold text-ink mb-2">{t('auth.verifyOtp.sessionExpiredTitle')}</h2>
          <p className="text-[13px] text-gray-500 mb-5">{t('auth.verifyOtp.sessionExpiredBody')}</p>
          <button onClick={() => navigate('/login')}
            className="w-full h-[52px] bg-forest text-white rounded-[13px] text-[15px] font-bold">
            {t('auth.verifyOtp.backToSignIn')}
          </button>
        </div>
      </div>
    );
  }

  const handleChange = (i: number, val: string) => {
    const d = val.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[i] = d;
    setDigits(next);
    if (d && i < 5) refs[i + 1].current?.focus();
    if (next.every((x) => x)) verify(next.join(''));
  };

  const handleKeyDown = (i: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !digits[i] && i > 0) refs[i - 1].current?.focus();
  };

  const verify = async (code: string) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.post<{ accessToken: string; refreshToken: string }>(
        '/auth/otp/verify',
        { phone, code, purpose },
      );
      const profile = await authenticate(data);
      navigate(dashboardPath(profile.role), { replace: true });
    } catch (err) {
      setError(apiErrorMessage(err, t('auth.verifyOtp.invalidOtp')));
      setDigits(['', '', '', '', '', '']);
      refs[0].current?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    setError(null);
    setResent(false);
    try {
      await api.post('/auth/otp/send', { phone, purpose });
      setResent(true);
    } catch (err) {
      setError(apiErrorMessage(err, t('auth.verifyOtp.resendError')));
    } finally {
      setResending(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const code = digits.join('');
    if (code.length === 6) verify(code);
  };

  return (
    <div className="min-h-screen bg-forest flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-8">
        <div className="w-12 h-12 rounded-xl bg-white/15 flex items-center justify-center mb-3">
          <svg className="w-6 h-6" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24">
            <rect x="5" y="2" width="14" height="20" rx="2" />
            <line x1="12" y1="18" x2="12.01" y2="18" strokeWidth="2.5" />
          </svg>
        </div>
        <p className="text-[13px] text-white/65 text-center">{t('auth.verifyOtp.otpSentTo', { phone })}</p>
        {import.meta.env.DEV && (
          <p className="text-[11px] text-white/45 text-center mt-1">{t('auth.verifyOtp.devHint')}</p>
        )}
      </div>

      <div className="bg-white rounded-t-[24px] px-6 pt-6" style={{ paddingBottom: `calc(env(safe-area-inset-bottom) + 24px)` }}>
        <h2 className="text-[20px] font-extrabold text-ink tracking-[-0.4px] mb-1">{t('auth.verifyOtp.title')}</h2>
        <p className="text-[13px] text-gray-500 mb-6">{t('auth.verifyOtp.subtitle')}</p>

        <form onSubmit={handleSubmit}>
          <div className="flex gap-2.5 justify-center mb-5">
            {digits.map((d, i) => (
              <input key={i} ref={refs[i]} type="text" inputMode="numeric" maxLength={1} value={d}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                className={`w-[44px] h-[52px] text-center text-[22px] font-bold text-ink rounded-[12px] border-2 outline-none transition ${
                  d ? 'border-forest bg-forest/5' : 'border-gray-200 bg-gray-50'
                }`}
              />
            ))}
          </div>

          {resent && (
            <p className="text-[12px] text-green-txt font-medium text-center mb-3 bg-green-bg border border-green-bdr rounded-[9px] px-3 py-2">
              {t('auth.verifyOtp.resentNotice')}
            </p>
          )}
          {error && (
            <p className="text-[12.5px] text-red-600 font-medium text-center mb-3 bg-red-50 border border-red-200 rounded-[9px] px-3 py-2">
              {error}
            </p>
          )}

          <button type="submit" disabled={loading || digits.join('').length < 6}
            className="w-full h-[52px] bg-forest text-white rounded-[13px] text-[15px] font-bold disabled:opacity-50">
            {loading ? t('auth.verifyOtp.verifying') : t('auth.verifyOtp.submit')}
          </button>
        </form>

        <button onClick={handleResend} disabled={resending}
          className="mt-4 w-full text-center text-[12px] text-forest font-bold disabled:opacity-50">
          {resending ? t('auth.verifyOtp.resendingLabel') : t('auth.verifyOtp.resendLabel')}
        </button>

        <button onClick={() => navigate(-1)}
          className="mt-2 w-full text-center text-[12px] text-gray-500 font-medium">
          {t('auth.verifyOtp.goBack')}
        </button>
      </div>
    </div>
  );
}
