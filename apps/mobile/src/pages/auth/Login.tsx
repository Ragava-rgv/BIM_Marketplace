import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { UserRole } from '@machinebazaar/shared';
import { api, apiErrorMessage } from '../../lib/api';
import { useAuth } from '../../lib/auth-context';

function dashboardPath(role: UserRole): string {
  return role === UserRole.SELLER ? '/seller/dashboard' : '/';
}

export function Login() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { authenticate } = useAuth();

  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isValid = phone.length === 10 && password.length >= 8;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.post<{ accessToken: string; refreshToken: string }>(
        '/auth/login',
        { phone, password },
      );
      const profile = await authenticate(data);
      navigate(dashboardPath(profile.role), { replace: true });
    } catch (err) {
      setError(apiErrorMessage(err, t('auth.login.invalidCredentials')));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#101828] flex flex-col">
      {/* Branding */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-8">
        <div className="w-[72px] h-[72px] rounded-[20px] bg-white/10 border border-white/15 flex items-center justify-center mb-5">
          {/* Bold copper gear — matches app icon */}
          <svg width="46" height="46" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
            <circle cx="512" cy="512" r="370" fill="#E8820C"/>
            <g fill="#E8820C">
              <rect x="468" y="60" width="88" height="82" rx="6" transform="rotate(0 512 512)"/>
              <rect x="468" y="60" width="88" height="82" rx="6" transform="rotate(40 512 512)"/>
              <rect x="468" y="60" width="88" height="82" rx="6" transform="rotate(80 512 512)"/>
              <rect x="468" y="60" width="88" height="82" rx="6" transform="rotate(120 512 512)"/>
              <rect x="468" y="60" width="88" height="82" rx="6" transform="rotate(160 512 512)"/>
              <rect x="468" y="60" width="88" height="82" rx="6" transform="rotate(200 512 512)"/>
              <rect x="468" y="60" width="88" height="82" rx="6" transform="rotate(240 512 512)"/>
              <rect x="468" y="60" width="88" height="82" rx="6" transform="rotate(280 512 512)"/>
              <rect x="468" y="60" width="88" height="82" rx="6" transform="rotate(320 512 512)"/>
            </g>
            <circle cx="512" cy="512" r="262" fill="#101828"/>
            <circle cx="512" cy="512" r="78" fill="#E8820C"/>
          </svg>
        </div>
        <h1 className="text-[28px] font-extrabold text-white tracking-[-0.5px] mb-1">BIM</h1>
        <p className="text-[13px] text-white/55 text-center">{t('auth.login.tagline')}</p>
      </div>

      {/* Bottom sheet */}
      <div className="bg-white rounded-t-[24px] px-6 pt-6" style={{ paddingBottom: `calc(env(safe-area-inset-bottom) + 24px)` }}>
        <h2 className="text-[20px] font-extrabold text-ink tracking-[-0.4px] mb-1">{t('auth.login.title')}</h2>
        <p className="text-[13px] text-gray-500 mb-5">{t('auth.login.subtitle')}</p>

        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Phone */}
          <div>
            <label className="block text-[11.5px] font-semibold text-gray-600 mb-1">{t('auth.login.mobileNumberLabel')}</label>
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-[12px] h-[52px] px-4 focus-within:border-forest focus-within:bg-white transition">
              <span className="text-[14px] font-bold text-ink flex-shrink-0">+91</span>
              <span className="w-px h-5 bg-gray-200 flex-shrink-0" />
              <input
                type="tel"
                inputMode="numeric"
                maxLength={10}
                placeholder={t('auth.login.phonePlaceholder')}
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                className="flex-1 bg-transparent text-[15px] font-medium text-ink placeholder-gray-400 outline-none"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-[11.5px] font-semibold text-gray-600 mb-1">{t('auth.login.passwordLabel')}</label>
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-[12px] h-[52px] px-4 focus-within:border-forest focus-within:bg-white transition">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="flex-1 bg-transparent text-[15px] font-medium text-ink placeholder-gray-400 outline-none"
                minLength={8}
              />
              <button type="button" onClick={() => setShowPassword((v) => !v)}
                className="text-gray-400 flex-shrink-0">
                {showPassword ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
            <div className="text-right mt-1.5">
              <button type="button" onClick={() => navigate('/forgot-password')} className="text-[12.5px] font-bold text-forest">
                {t('auth.login.forgotPassword')}
              </button>
            </div>
          </div>

          {error && (
            <p className="text-[12.5px] text-red-600 font-medium bg-red-50 border border-red-200 rounded-[10px] px-3 py-2">
              {error}
            </p>
          )}

          <button type="submit" disabled={loading || !isValid}
            className="w-full h-[52px] bg-forest text-white rounded-[13px] text-[15px] font-bold disabled:opacity-50 mt-1">
            {loading ? t('auth.login.signingIn') : t('auth.login.signIn')}
          </button>
        </form>

        <p className="mt-4 text-center text-[12.5px] text-gray-500">
          {t('auth.login.newToBim')}{' '}
          <button onClick={() => navigate('/signup')} className="font-bold text-copper">{t('auth.login.createAccount')}</button>
        </p>
      </div>
    </div>
  );
}
