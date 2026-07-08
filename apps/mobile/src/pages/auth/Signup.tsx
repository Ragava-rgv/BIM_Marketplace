import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserRole } from '@machinebazaar/shared';
import { api, apiErrorMessage } from '../../lib/api';
import { INDIA_STATES, INDIA_STATES_AND_CITIES } from '../../lib/india-locations';
import { ChevronRightIcon } from '../../components/icons';

const inputCls = 'w-full h-[50px] bg-gray-50 border border-gray-200 rounded-[12px] px-4 text-[14px] text-ink font-medium placeholder-gray-400 outline-none focus:border-forest focus:bg-white transition';
const selectCls = inputCls + ' appearance-none pr-8';

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div>
      <label className="block text-[11.5px] font-semibold text-gray-600 mb-1">{label}</label>
      {children}
      {hint && <p className="mt-1 text-[11px] text-gray-400">{hint}</p>}
    </div>
  );
}

type Role = 'BUYER' | 'SELLER';

const ROLES: { role: Role; title: string; body: string; emoji: string }[] = [
  { role: 'SELLER', title: 'I want to sell machinery', body: 'List your machines with verified media and admin review.', emoji: 'ðŸ­' },
  { role: 'BUYER', title: 'I want to buy machinery', body: 'Browse listings, enquire safely, and apply for financing.', emoji: 'ðŸš›' },
];

export function Signup() {
  const navigate = useNavigate();
  const [role, setRole] = useState<Role | null>(null);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [locationState, setLocationState] = useState('');
  const [locationCity, setLocationCity] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cities = locationState ? (INDIA_STATES_AND_CITIES[locationState] ?? []) : [];

  const isValid =
    !loading &&
    fullName.trim().length >= 2 &&
    phone.length === 10 &&
    password.length >= 8 &&
    email.trim().length > 0 &&
    locationState !== '' &&
    locationCity !== '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!role || !isValid) return;
    setLoading(true);
    setError(null);
    try {
      await api.post('/auth/signup', {
        role,
        fullName: fullName.trim(),
        phone,
        password,
        email: email.trim(),
        locationCity,
        locationState,
      });
      navigate('/verify-otp', { state: { phone, purpose: 'SIGNUP' } });
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not create account. Please check your details.'));
    } finally {
      setLoading(false);
    }
  };

  if (!role) {
    return (
      <div className="min-h-screen bg-forest flex flex-col">
        <div className="flex-1 flex flex-col items-center justify-center px-6 pb-6">
          <h1 className="text-[26px] font-extrabold text-white tracking-[-0.5px] text-center mb-1">
            Create account
          </h1>
          <p className="text-[13px] text-white/65 text-center">How will you use BIM?</p>
        </div>

        <div className="bg-white rounded-t-[24px] px-6 pt-6" style={{ paddingBottom: `calc(env(safe-area-inset-bottom) + 24px)` }}>
          <div className="space-y-3 mb-4">
            {ROLES.map((opt) => (
              <button key={opt.role} onClick={() => setRole(opt.role)}
                className="w-full flex items-start gap-4 rounded-[14px] border border-gray-200 bg-white p-4 text-left active:bg-gray-50 transition">
                <span className="w-11 h-11 rounded-[10px] bg-forest flex items-center justify-center text-[22px] flex-shrink-0">
                  {opt.emoji}
                </span>
                <span>
                  <span className="block text-[14.5px] font-bold text-ink tracking-[-0.2px]">{opt.title}</span>
                  <span className="mt-0.5 block text-[12px] text-gray-500 leading-relaxed">{opt.body}</span>
                </span>
                <ChevronRightIcon className="w-4 h-4 text-gray-400 flex-shrink-0 mt-1.5" />
              </button>
            ))}
          </div>

          <p className="text-center text-[12.5px] text-gray-500">
            Already have an account?{' '}
            <button onClick={() => navigate('/login')} className="font-bold text-forest">Sign in</button>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-forest flex flex-col">
      <div className="flex-1 flex flex-col justify-center px-6 pb-6 pt-8">
        <button onClick={() => setRole(null)} className="text-[13px] text-white/65 font-semibold mb-4 text-left">
          <- Change account type
        </button>
        <h1 className="text-[24px] font-extrabold text-white tracking-[-0.5px]">
          {role === UserRole.SELLER ? 'Seller account' : 'Buyer account'}
        </h1>
        <p className="text-[13px] text-white/65 mt-1">Fill in your details to get started.</p>
      </div>

      <div className="bg-white rounded-t-[24px] px-6 pt-6" style={{ paddingBottom: `calc(env(safe-area-inset-bottom) + 24px)` }}>
        <form onSubmit={handleSubmit} className="space-y-3">
          <Field label="Full name">
            <input value={fullName} onChange={(e) => setFullName(e.target.value)}
              placeholder="Your full name" className={inputCls} minLength={2} required />
          </Field>

          <Field label="Mobile number" hint="10-digit Indian mobile number">
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-[12px] h-[50px] px-4 focus-within:border-forest focus-within:bg-white transition">
              <span className="text-[14px] font-bold text-ink flex-shrink-0">+91</span>
              <span className="w-px h-5 bg-gray-200 flex-shrink-0" />
              <input type="tel" inputMode="numeric" maxLength={10} placeholder="98765 43210"
                value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                className="flex-1 bg-transparent text-[14px] font-medium text-ink placeholder-gray-400 outline-none" />
            </div>
            {phone.length > 0 && phone.length < 10 && (
              <p className="mt-1 text-[11px] text-red-500">Enter a valid 10-digit number</p>
            )}
          </Field>

          <Field label="Password" hint="At least 8 characters">
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-[12px] h-[50px] px-4 focus-within:border-forest focus-within:bg-white transition">
              <input type={showPassword ? 'text' : 'password'} placeholder=""¢"¢"¢"¢"¢"¢"¢"¢"
                value={password} onChange={(e) => setPassword(e.target.value)}
                minLength={8}
                className="flex-1 bg-transparent text-[14px] font-medium text-ink placeholder-gray-400 outline-none" />
              <button type="button" onClick={() => setShowPassword((v) => !v)} className="text-gray-400 flex-shrink-0">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24">
                  {showPassword
                    ? <><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" /><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" /><line x1="1" y1="1" x2="23" y2="23" /></>
                    : <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></>
                  }
                </svg>
              </button>
            </div>
          </Field>

          <Field label="Email address">
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="you@business.com" className={inputCls} required />
          </Field>

          <Field label="State" hint="Select state first, then city">
            <div className="relative">
              <select value={locationState}
                onChange={(e) => { setLocationState(e.target.value); setLocationCity(''); }}
                className={selectCls} required>
                <option value="">"” Select state "”</option>
                {INDIA_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <ChevronRightIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 rotate-90 pointer-events-none" />
            </div>
          </Field>

          <Field label="City">
            <div className="relative">
              <select value={locationCity} onChange={(e) => setLocationCity(e.target.value)}
                className={selectCls} required disabled={!locationState}>
                <option value="">"” Select city "”</option>
                {cities.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <ChevronRightIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 rotate-90 pointer-events-none" />
            </div>
          </Field>

          {error && (
            <p className="text-[12.5px] text-red-600 font-medium bg-red-50 border border-red-200 rounded-[10px] px-3 py-2">
              {error}
            </p>
          )}

          <button type="submit" disabled={!isValid}
            className="w-full h-[52px] bg-forest text-white rounded-[13px] text-[15px] font-bold disabled:opacity-50 !mt-4">
            {loading ? 'Creating account...' : 'Create account & verify <-’'}
          </button>
        </form>

        <p className="mt-4 text-center text-[12.5px] text-gray-500">
          Already have an account?{' '}
          <button onClick={() => navigate('/login')} className="font-bold text-forest">Sign in</button>
        </p>
      </div>
    </div>
  );
}


