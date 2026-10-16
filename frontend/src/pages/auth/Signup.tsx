import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { UserRole } from '../../shared';
import { api, apiErrorMessage } from '../../lib/api';
import { INDIA_STATES, INDIA_STATES_AND_CITIES } from '../../lib/india-locations';
import { Button, ErrorBanner, Field, Input, MonoLabel, Select } from '../../components/ui';
import { ChevronRightIcon, MachineIcon, TruckIcon } from '../../components/icons';

const ROLE_OPTIONS: {
  role: 'BUYER' | 'SELLER';
  key: string;
  icon: typeof MachineIcon;
}[] = [
  { role: 'SELLER', key: 'seller', icon: MachineIcon },
  { role: 'BUYER', key: 'buyer', icon: TruckIcon },
];

export function Signup() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [role, setRole] = useState<'BUYER' | 'SELLER' | null>(null);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [locationState, setLocationState] = useState('');
  const [locationCity, setLocationCity] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const cities = locationState ? INDIA_STATES_AND_CITIES[locationState] ?? [] : [];

  const handleStateChange = (newState: string) => {
    setLocationState(newState);
    setLocationCity('');
  };

  const isValid =
    !submitting &&
    fullName.trim().length >= 2 &&
    phone.length === 10 &&
    password.length >= 8 &&
    email.trim().length > 0 &&
    locationState !== '' &&
    locationCity !== '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!role || !isValid) return;
    setError(null);
    setSubmitting(true);
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
      setError(apiErrorMessage(err, t('auth.signup.errorDefault')));
    } finally {
      setSubmitting(false);
    }
  };

  if (!role) {
    return (
      <div>
        <MonoLabel className="text-copper">— {t('auth.signup.eyebrow')}</MonoLabel>
        <h1 className="mt-2 font-display text-[32px] font-medium tracking-[-0.6px] text-ink">
          {t('auth.signup.title')}
        </h1>
        <p className="mt-2 text-[14px] text-muted">
          {t('auth.signup.subtitle')}
        </p>

        <div className="mt-8 space-y-3">
          {ROLE_OPTIONS.map((option) => (
            <button
              key={option.role}
              type="button"
              onClick={() => setRole(option.role)}
              className="flex w-full items-start gap-4 rounded-[14px] border border-line bg-white p-5 text-left transition hover:-translate-y-0.5 hover:border-ink hover:shadow-[0_12px_28px_rgba(15,30,26,0.06)]"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[9px] bg-forest text-white">
                <option.icon className="h-5 w-5" />
              </span>
              <span>
                <span className="block text-[15px] font-bold tracking-[-0.2px] text-ink">
                  {t(`auth.signup.roleOptions.${option.key}.title`)}
                </span>
                <span className="mt-1 block text-[13px] leading-[1.6] text-muted">
                  {t(`auth.signup.roleOptions.${option.key}.body`)}
                </span>
              </span>
            </button>
          ))}
        </div>

        <p className="mt-6 text-[14px] text-muted">
          {t('auth.signup.alreadyHaveAccount')}{' '}
          <Link to="/login" className="font-bold text-forest hover:text-forest-2">
            {t('common:nav.login')}
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setRole(null)}
        className="mb-4 text-[13.5px] font-semibold text-muted hover:text-ink"
      >
        ← {t('auth.signup.changeAccountType')}
      </button>
      <MonoLabel className="text-copper">
        — {t('auth.signup.signingUpAs', { role: role === UserRole.SELLER ? t('common:role.seller') : t('common:role.buyer') })}
      </MonoLabel>
      <h1 className="mt-2 font-display text-[32px] font-medium tracking-[-0.6px] text-ink">
        {t('auth.signup.tellUsAboutYourself')}
      </h1>
      <p className="mt-1 text-[13px] text-muted">
        {t('auth.signup.fieldsMarked')} <span className="font-semibold text-red-500">*</span> {t('auth.signup.areRequired')}
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-5">
        {error && <ErrorBanner message={error} />}

        <Field label={t('auth.signup.fullNameLabel')} required>
          <Input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            minLength={2}
            placeholder={t('auth.signup.fullNamePlaceholder')}
          />
        </Field>

        <Field label={t('auth.signup.mobileLabel')} required hint={t('auth.signup.mobileHint')}>
          <Input
            inputMode="numeric"
            placeholder={t('auth.signup.mobilePlaceholder')}
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
            required
          />
          {phone.length > 0 && phone.length < 10 && (
            <span className="mt-1 block text-xs text-red-500">
              {t('auth.signup.mobileError')}
            </span>
          )}
        </Field>

        <Field label={t('auth.signup.passwordLabel')} required hint={t('auth.signup.passwordHint')}>
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            placeholder={t('auth.signup.passwordPlaceholder')}
          />
        </Field>

        <Field label={t('auth.signup.emailLabel')} required>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder={t('auth.signup.emailPlaceholder')}
          />
        </Field>

        {/* State first, then city cascade */}
        <Field label={t('auth.signup.stateLabel')} required hint={t('auth.signup.stateHint')}>
          <Select
            value={locationState}
            onChange={(e) => handleStateChange(e.target.value)}
            required
          >
            <option value="">{t('auth.signup.selectStatePlaceholder')}</option>
            {INDIA_STATES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
        </Field>

        <Field
          label={t('auth.signup.cityLabel')}
          required
          hint={!locationState ? t('auth.signup.cityHintSelectState') : undefined}
        >
          <Select
            value={locationCity}
            onChange={(e) => setLocationCity(e.target.value)}
            required
            disabled={!locationState}
          >
            <option value="">{t('auth.signup.selectCityPlaceholder')}</option>
            {cities.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
        </Field>

        <Button type="submit" disabled={!isValid} className="w-full">
          {submitting ? t('auth.signup.submitting') : t('auth.signup.submit')}
          <ChevronRightIcon className="h-4 w-4" />
        </Button>
      </form>

      <p className="mt-6 text-[14px] text-muted">
        {t('auth.signup.alreadyHaveAccount')}{' '}
        <Link to="/login" className="font-bold text-forest hover:text-forest-2">
          {t('common:nav.login')}
        </Link>
      </p>
    </div>
  );
}
