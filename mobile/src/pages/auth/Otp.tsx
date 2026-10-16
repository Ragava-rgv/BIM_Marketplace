import { useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { api, apiErrorMessage } from '../../lib/api';
import { useAuth } from '../../lib/auth-context';

export function Otp() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { state } = useLocation() as { state: { phone?: string } };
  const { authenticate } = useAuth();
  const phone = state?.phone ?? '';

  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const refs = Array.from({ length: 6 }, () => useRef<HTMLInputElement>(null));

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
      const { data } = await api.post<{ accessToken: string; refreshToken: string }>('/auth/verify-otp', { phone, code });
      await authenticate(data);
      navigate('/', { replace: true });
    } catch (err) {
      setError(apiErrorMessage(err, t('auth.otp.invalidOtp')));
      setDigits(['', '', '', '', '', '']);
      refs[0].current?.focus();
    } finally {
      setLoading(false);
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
            <rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 3l-8 4 8 4" />
          </svg>
        </div>
        <p className="text-[13px] text-white/65 text-center">{t('auth.otp.otpSentTo', { phone })}</p>
      </div>

      <div className="bg-white rounded-t-[24px] px-6 pt-6 pb-8" style={{ paddingBottom: `calc(env(safe-area-inset-bottom) + 24px)` }}>
        <h2 className="text-[20px] font-extrabold text-ink tracking-[-0.4px] mb-1">{t('auth.otp.title')}</h2>
        <p className="text-[13px] text-gray-500 mb-6">{t('auth.otp.subtitle')}</p>

        <form onSubmit={handleSubmit}>
          <div className="flex gap-2.5 justify-center mb-5">
            {digits.map((d, i) => (
              <input key={i} ref={refs[i]} type="text" inputMode="numeric" maxLength={1} value={d}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                className={`w-[44px] h-[52px] text-center text-[22px] font-bold text-ink rounded-[12px] border-2 outline-none transition ${
                  d ? 'border-forest bg-forest-bg' : 'border-gray-200 bg-gray-50'
                }`}
              />
            ))}
          </div>

          {error && <p className="text-[12.5px] text-red-600 font-medium text-center mb-3">{error}</p>}

          <button type="submit" disabled={loading || digits.join('').length < 6}
            className="w-full h-[52px] bg-forest text-white rounded-[13px] text-[15px] font-bold disabled:opacity-50">
            {loading ? t('auth.otp.verifying') : t('auth.otp.verify')}
          </button>
        </form>

        <button onClick={() => navigate('/login')}
          className="mt-4 w-full text-center text-[12px] text-gray-500 font-medium">
          {t('auth.otp.backToPhone')}
        </button>
      </div>
    </div>
  );
}
