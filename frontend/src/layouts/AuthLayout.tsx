import { Link, Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CheckCircleIcon, MachineIcon, ShieldCheckIcon } from '../components/icons';

export function AuthLayout() {
  const { t } = useTranslation();
  const features = [
    t('layout.authLayout.features.gstVerified'),
    t('layout.authLayout.features.bankAccepted'),
    t('layout.authLayout.features.buybackGuarantee'),
  ];

  return (
    <div className="flex min-h-screen bg-white">
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-ink px-12 py-12 text-white lg:flex">
        <div className="pointer-events-none absolute inset-0 grid-backdrop opacity-40 [mask-image:radial-gradient(ellipse_at_top_left,#000_20%,transparent_70%)]" />

        <Link to="/" className="relative flex items-center gap-2.5">
          <span className="relative flex h-9 w-9 items-center justify-center rounded-[9px] bg-forest text-white">
            <span className="pointer-events-none absolute inset-1 rounded-[6px] border border-white/15" />
            <MachineIcon className="relative h-[18px] w-[18px]" />
          </span>
          <span className="flex flex-col leading-none">
            <span className="font-display text-[19px] font-semibold tracking-[-0.4px] text-white">BIM</span>
            <span className="mt-[3px] font-mono text-[9.5px] font-medium uppercase tracking-[0.12em] text-copper">
              {t('layout.authLayout.certifiedBadge')}
            </span>
          </span>
        </Link>

        <div className="relative max-w-md">
          <p className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.14em] text-white/40">
            {t('layout.authLayout.eyebrow')}
          </p>
          <h1 className="mt-4 font-display text-[40px] font-medium leading-[1.1] tracking-[-1px] text-white">
            {t('layout.authLayout.title')}{' '}
            <em className="font-normal not-italic italic text-copper">{t('layout.authLayout.titleHighlight')}</em>
          </h1>
          <p className="mt-4 text-[14.5px] leading-[1.7] text-white/55">
            {t('layout.authLayout.subtitle')}
          </p>

          <div className="mt-8 flex flex-col gap-2.5">
            {features.map((item) => (
              <div key={item} className="flex items-center gap-2.5 text-[13px] font-medium text-white/75">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-copper/30 bg-copper/[0.18]">
                  <CheckCircleIcon className="h-2.5 w-2.5 text-copper" />
                </span>
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="relative flex items-center gap-2.5 border-t border-white/10 pt-6 text-[13px] text-white/50">
          <ShieldCheckIcon className="h-4 w-4 shrink-0 text-forest-2" />
          {t('layout.authLayout.contactPrivacyNote')}
        </div>
      </div>

      <div className="flex w-full flex-col justify-center px-6 py-12 sm:px-12 lg:w-1/2 lg:px-20">
        <Link to="/" className="mb-10 flex items-center gap-2.5 lg:hidden">
          <span className="relative flex h-9 w-9 items-center justify-center rounded-[9px] bg-forest text-white">
            <span className="pointer-events-none absolute inset-1 rounded-[6px] border border-white/15" />
            <MachineIcon className="relative h-[18px] w-[18px]" />
          </span>
          <span className="font-display text-[19px] font-semibold tracking-[-0.4px] text-ink">BIM</span>
        </Link>
        <div className="mx-auto w-full max-w-sm">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
