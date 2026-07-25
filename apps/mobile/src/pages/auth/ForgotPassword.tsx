import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserRole } from '@machinebazaar/shared';
import { api, apiErrorMessage } from '../../lib/api';
import { useAuth } from '../../lib/auth-context';

function dashboardPath(role: UserRole): string {
  return role === UserRole.SELLER ? '/seller/dashboard' : '/';
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
      setError(apiErrorMessage(err, 'Could not resend the code. Please try again.'));
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
      const { data } = await api.post<{ accessToken: string; refreshToken: string }>(
        '/auth/password/reset',
        { phone, code, newPassword },
      );
      const profile = await authenticate(data);
      navigate(dashboardPath(profile.role), { replace: true });
    } catch (err) {
      setError(apiErrorMessage(err, "That code didn't match or has expired. Please try again."));
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="min-h-screen bg-forest flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-8">
        <div className="w-12 h-12 rounded-xl bg-white/15 flex items-center justify-center mb-3">
          <svg className="w-6 h-6" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24">
            <path d="M19 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2z" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>
        <p className="text-[13px] text-white/65 text-center">
          {step === 'phone' ? 'Reset your password' : `OTP sent to +91 ${phone}`}
        </p>
        {step === 'reset' && import.meta.env.DEV && (
          <p className="text-[11px] text-white/45 text-center mt-1">Check the API console for the code.</p>
        )}
      </div>

      <div className="bg-white rounded-t-[24px] px-6 pt-6" style={{ paddingBottom: `calc(env(safe-area-inset-bottom) + 24px)` }}>
        {step === 'phone' ? (
          <>
            <h2 className="text-[20px] font-extrabold text-ink tracking-[-0.4px] mb-1">Forgot password</h2>
            <p className="text-[13px] text-gray-500 mb-6">
              Enter your registered mobile number and we&apos;ll send a one-time code.
            </p>

            <form onSubmit={handleSendOtp} className="space-y-3">
              <div>
                <label className="block text-[11.5px] font-semibold text-gray-600 mb-1">Mobile number</label>
                <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-[12px] h-[52px] px-4 focus-within:border-forest focus-within:bg-white transition">
                  <span className="text-[14px] font-bold text-ink flex-shrink-0">+91</span>
                  <span className="w-px h-5 bg-gray-200 flex-shrink-0" />
                  <input
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    placeholder="98765 43210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    className="flex-1 bg-transparent text-[15px] font-medium text-ink placeholder-gray-400 outline-none"
                  />
                </div>
              </div>

              {error && (
                <p className="text-[12.5px] text-red-600 font-medium bg-red-50 border border-red-200 rounded-[10px] px-3 py-2">
                  {error}
                </p>
              )}

              <button type="submit" disabled={sending || phone.length !== 10}
                className="w-full h-[52px] bg-forest text-white rounded-[13px] text-[15px] font-bold disabled:opacity-50 mt-1">
                {sending ? 'Sending…' : 'Send OTP →'}
              </button>
            </form>

            <button onClick={() => navigate('/login')}
              className="mt-4 w-full text-center text-[12.5px] text-gray-500 font-medium">
              ← Back to sign in
            </button>
          </>
        ) : (
          <>
            <h2 className="text-[20px] font-extrabold text-ink tracking-[-0.4px] mb-1">Enter OTP & new password</h2>
            <p className="text-[13px] text-gray-500 mb-6">6-digit code sent to your mobile number.</p>

            <form onSubmit={handleReset} className="space-y-3">
              <div>
                <label className="block text-[11.5px] font-semibold text-gray-600 mb-1">One-time code</label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={8}
                  placeholder="******"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 8))}
                  className="w-full h-[52px] bg-gray-50 border border-gray-200 rounded-[12px] px-4 text-[15px] font-medium text-ink placeholder-gray-400 outline-none focus:border-forest focus:bg-white transition"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-[11.5px] font-semibold text-gray-600 mb-1">New password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  minLength={8}
                  className="w-full h-[52px] bg-gray-50 border border-gray-200 rounded-[12px] px-4 text-[15px] font-medium text-ink placeholder-gray-400 outline-none focus:border-forest focus:bg-white transition"
                />
              </div>

              <div>
                <label className="block text-[11.5px] font-semibold text-gray-600 mb-1">Confirm new password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  minLength={8}
                  className="w-full h-[52px] bg-gray-50 border border-gray-200 rounded-[12px] px-4 text-[15px] font-medium text-ink placeholder-gray-400 outline-none focus:border-forest focus:bg-white transition"
                />
              </div>

              {resent && (
                <p className="text-[12px] text-green-txt font-medium text-center bg-green-bg border border-green-bdr rounded-[9px] px-3 py-2">
                  A new code has been sent.
                </p>
              )}
              {error && (
                <p className="text-[12.5px] text-red-600 font-medium bg-red-50 border border-red-200 rounded-[10px] px-3 py-2">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={resetting || code.length < 4 || newPassword.length < 8 || confirmPassword.length < 8}
                className="w-full h-[52px] bg-forest text-white rounded-[13px] text-[15px] font-bold disabled:opacity-50 mt-1"
              >
                {resetting ? 'Resetting…' : 'Reset password & sign in →'}
              </button>
            </form>

            <button onClick={handleResend} disabled={resending}
              className="mt-4 w-full text-center text-[12px] text-forest font-bold disabled:opacity-50">
              {resending ? 'Resending…' : "Didn't get a code? Resend"}
            </button>

            <button onClick={() => setStep('phone')}
              className="mt-2 w-full text-center text-[12px] text-gray-500 font-medium">
              ← Change mobile number
            </button>
          </>
        )}
      </div>
    </div>
  );
}
