import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChatIcon, CheckCircleIcon, RupeeIcon, ShieldCheckIcon } from '../../components/icons';
import { PageHeading } from '../../components/ui';

const VALUES = [
  { icon: ShieldCheckIcon, key: 'verificationFirst' },
  { icon: CheckCircleIcon, key: 'proofNotPromises' },
  { icon: ChatIcon, key: 'privacyUntilItCounts' },
  { icon: RupeeIcon, key: 'fairSimpleEconomics' },
];

export function About() {
  const { t } = useTranslation();
  return (
    <div className="mx-auto max-w-4xl px-6 py-14">
      <PageHeading
        eyebrow={t('public.about.eyebrow')}
        title={t('public.about.title')}
        description={t('public.about.description')}
      />

      <div className="prose-none space-y-5 text-[15px] leading-relaxed text-navy/65">
        <p>
          {t('public.about.paragraph1')}
        </p>
        <p>
          {t('public.about.paragraph2')}
        </p>
      </div>

      <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2">
        {VALUES.map((value) => (
          <div key={value.key} className="rounded-2xl border border-navy/10 bg-white p-6">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-navy/[0.06] text-navy">
              <value.icon className="h-5 w-5" />
            </span>
            <h3 className="mt-4 font-display text-lg text-navy">{t(`public.about.values.${value.key}.title`)}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-navy/60">{t(`public.about.values.${value.key}.body`)}</p>
          </div>
        ))}
      </div>

      <div className="mt-14 rounded-2xl border border-navy/10 bg-navy p-8 text-white">
        <h3 className="font-display text-2xl">{t('public.about.cta.title')}</h3>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/60">
          {t('public.about.cta.body')}
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link to="/signup" className="rounded-lg bg-white px-6 py-3 text-sm font-semibold text-navy transition hover:bg-white/90">
            {t('public.about.cta.createAccount')}
          </Link>
          <Link to="/how-it-works" className="rounded-lg border border-white/20 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10">
            {t('public.about.cta.seeHowItWorks')}
          </Link>
        </div>
      </div>
    </div>
  );
}
