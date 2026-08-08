import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ChatIcon,
  CheckCircleIcon,
  DocumentIcon,
  RupeeIcon,
  ShieldCheckIcon,
  TrendDownIcon,
  UploadIcon,
  VideoIcon,
} from '../../components/icons';
import { PageHeading } from '../../components/ui';

const SELLER_STEPS = [
  { icon: ShieldCheckIcon, key: 'verifyGst' },
  { icon: UploadIcon, key: 'buildListing' },
  { icon: VideoIcon, key: 'uploadProofMedia' },
  { icon: DocumentIcon, key: 'submitForReview' },
  { icon: ChatIcon, key: 'receiveBuyerEnquiries' },
  { icon: RupeeIcon, key: 'settleCommission' },
];

const BUYER_STEPS = [
  { icon: DocumentIcon, key: 'browseWithoutBarriers' },
  { icon: ChatIcon, key: 'sendEnquiry' },
  { icon: ShieldCheckIcon, key: 'verifyGstForFinancing' },
  { icon: RupeeIcon, key: 'applyForFinancing' },
  { icon: CheckCircleIcon, key: 'certificationForPeaceOfMind' },
  { icon: RupeeIcon, key: 'payCommissionGetContact' },
];

export function HowItWorks() {
  const { t } = useTranslation();
  return (
    <div className="mx-auto max-w-5xl px-6 py-14">
      <PageHeading
        eyebrow={t('public.howItWorks.eyebrow')}
        title={t('public.howItWorks.title')}
        description={t('public.howItWorks.description')}
      />

      <section>
        <h2 className="font-display text-2xl text-navy">{t('public.howItWorks.forSellers')}</h2>
        <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
          {SELLER_STEPS.map((step, idx) => (
            <div key={step.key} className="flex gap-4 rounded-2xl border border-navy/10 bg-white p-5">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-navy/[0.06] text-navy">
                <step.icon className="h-5 w-5" />
              </span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-accent">{t('public.howItWorks.step', { number: idx + 1 })}</p>
                <h3 className="mt-0.5 font-display text-lg text-navy">{t(`public.howItWorks.sellerSteps.${step.key}.title`)}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-navy/60">{t(`public.howItWorks.sellerSteps.${step.key}.body`)}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-16">
        <h2 className="font-display text-2xl text-navy">{t('public.howItWorks.forBuyers')}</h2>
        <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
          {BUYER_STEPS.map((step, idx) => (
            <div key={step.key} className="flex gap-4 rounded-2xl border border-navy/10 bg-white p-5">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
                <step.icon className="h-5 w-5" />
              </span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-accent">{t('public.howItWorks.step', { number: idx + 1 })}</p>
                <h3 className="mt-0.5 font-display text-lg text-navy">{t(`public.howItWorks.buyerSteps.${step.key}.title`)}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-navy/60">{t(`public.howItWorks.buyerSteps.${step.key}.body`)}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-16 rounded-2xl border border-navy/10 bg-navy/[0.03] p-8">
        <div className="flex items-start gap-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-navy text-white">
            <TrendDownIcon className="h-5 w-5" />
          </span>
          <div>
            <h3 className="font-display text-xl text-navy">{t('public.howItWorks.buyback.title')}</h3>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-navy/60">
              {t('public.howItWorks.buyback.body')}
            </p>
          </div>
        </div>
      </section>

      <div className="mt-12 flex flex-wrap gap-3">
        <Link to="/signup" className="rounded-lg bg-accent px-6 py-3 text-sm font-semibold text-white transition hover:bg-accent-dark">
          {t('public.howItWorks.createAccount')}
        </Link>
        <Link to="/listings" className="rounded-lg border border-navy/15 px-6 py-3 text-sm font-semibold text-navy transition hover:bg-navy/5">
          {t('public.howItWorks.browseListings')}
        </Link>
      </div>
    </div>
  );
}
