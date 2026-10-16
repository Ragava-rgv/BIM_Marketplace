import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { GstStatus } from '../../shared';
import type { LoanApplicationDto, ReleasedContactSummaryDto } from '../../shared';
import { api } from '../../lib/api';
import { useAuth } from '../../lib/auth-context';
import { useWishlist } from '../../lib/wishlist-context';
import { formatInr, humanizeStatus } from '../../lib/format';
import { Button, Card, EmptyState, LoadingBlock, PageHeading, StatusBadge } from '../../components/ui';
import { CheckCircleIcon, ChevronRightIcon, MachineIcon, PlusIcon, RupeeIcon, ShieldCheckIcon } from '../../components/icons';

export function BuyerDashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { count: savedCount } = useWishlist();
  const [loans, setLoans] = useState<LoanApplicationDto[] | null>(null);
  const [contacts, setContacts] = useState<ReleasedContactSummaryDto[]>([]);

  useEffect(() => {
    let cancelled = false;
    api
      .get<LoanApplicationDto[]>('/loans/mine')
      .then(({ data }) => {
        if (!cancelled) setLoans(data);
      })
      .catch(() => {
        if (!cancelled) setLoans([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    api
      .get<ReleasedContactSummaryDto[]>('/transactions/contacts')
      .then(({ data }) => {
        if (!cancelled) setContacts(data);
      })
      .catch(() => {
        if (!cancelled) setContacts([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const isGstActive = user?.gstStatus === GstStatus.ACTIVE;

  return (
    <div>
      <PageHeading
        eyebrow={t('buyer.dashboard.eyebrow')}
        title={t('buyer.dashboard.title', { name: user?.fullName?.split(' ')[0] ?? '' })}
        description={t('buyer.dashboard.description')}
      />

      {!isGstActive && (
        <Card className="mb-8 flex flex-col gap-4 border-amber-200 bg-amber-50 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <ShieldCheckIcon className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
            <div>
              <p className="font-semibold text-amber-800">{t('buyer.dashboard.gstBanner.title')}</p>
              <p className="mt-1 text-sm text-amber-700">
                {t('buyer.dashboard.gstBanner.description')}
              </p>
            </div>
          </div>
          <Link to="/buyer/gst-verification">
            <Button variant="secondary" className="whitespace-nowrap">
              {t('buyer.dashboard.gstBanner.cta')}
              <ChevronRightIcon className="h-4 w-4" />
            </Button>
          </Link>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <Card>
          <p className="text-xs font-semibold uppercase tracking-wide text-navy/40">{t('buyer.dashboard.stats.savedListings')}</p>
          <p className="mt-2 font-display text-3xl text-navy">{savedCount}</p>
        </Card>
        <Card>
          <p className="text-xs font-semibold uppercase tracking-wide text-navy/40">{t('buyer.dashboard.stats.loanApplications')}</p>
          <p className="mt-2 font-display text-3xl text-navy">{loans ? loans.length : '—'}</p>
        </Card>
        <Card>
          <p className="text-xs font-semibold uppercase tracking-wide text-navy/40">{t('buyer.dashboard.stats.gstStatus')}</p>
          <p className="mt-2 font-display text-3xl text-navy">{humanizeStatus(user?.gstStatus ?? GstStatus.UNVERIFIED)}</p>
        </Card>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div>
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl text-navy">{t('buyer.dashboard.recentLoans.heading')}</h2>
            <Link to="/buyer/loans">
              <Button variant="ghost">{t('common:common.button.viewAll')}</Button>
            </Link>
          </div>

          {loans === null ? (
            <LoadingBlock />
          ) : loans.length === 0 ? (
            <Card className="mt-4 flex flex-col items-center gap-3 py-10 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-navy/[0.06] text-navy">
                <RupeeIcon className="h-6 w-6" />
              </span>
              <p className="font-display text-lg text-navy">{t('buyer.dashboard.recentLoans.emptyTitle')}</p>
              <p className="max-w-sm text-sm text-navy/55">
                {t('buyer.dashboard.recentLoans.emptyDescription')}
              </p>
              <Link to="/buyer/loans/new">
                <Button>{t('buyer.dashboard.recentLoans.applyButton')}</Button>
              </Link>
            </Card>
          ) : (
            <div className="mt-4 divide-y divide-navy/10 overflow-hidden rounded-2xl border border-navy/10 bg-white">
              {loans.slice(0, 5).map((loan) => (
                <div key={loan.id} className="flex items-center justify-between gap-4 px-5 py-4">
                  <div>
                    <p className="font-semibold text-navy">{formatInr(loan.amountRequested)}</p>
                    <p className="text-sm text-navy/45">
                      {t('buyer.dashboard.recentLoans.appliedOn', { date: new Date(loan.createdAt).toLocaleDateString('en-IN') })}
                    </p>
                  </div>
                  <StatusBadge status={loan.status} />
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl text-navy">{t('buyer.dashboard.savedListings.heading')}</h2>
            <Link to="/buyer/saved">
              <Button variant="ghost">{t('common:common.button.viewAll')}</Button>
            </Link>
          </div>

          {savedCount === 0 ? (
            <div className="mt-4">
              <EmptyState
                title={t('buyer.dashboard.savedListings.emptyTitle')}
                description={t('buyer.dashboard.savedListings.emptyDescription')}
                action={
                  <Link to="/listings">
                    <Button variant="secondary">
                      <MachineIcon className="h-4 w-4" />
                      {t('buyer.dashboard.savedListings.browseButton')}
                    </Button>
                  </Link>
                }
              />
            </div>
          ) : (
            <Card className="mt-4">
              <div className="flex items-center gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-navy/[0.06] text-navy">
                  <CheckCircleIcon className="h-6 w-6" />
                </span>
                <div>
                  <p className="font-display text-lg text-navy">
                    {t('buyer.dashboard.savedListings.countSaved', { count: savedCount })}
                  </p>
                  <p className="text-sm text-navy/55">{t('buyer.dashboard.savedListings.pickUp')}</p>
                </div>
              </div>
              <Link to="/buyer/saved" className="mt-4 inline-block">
                <Button variant="secondary">{t('buyer.dashboard.savedListings.viewButton')}</Button>
              </Link>
            </Card>
          )}
        </div>
      </div>

      {/* â"€â"€ Start selling CTA â"€â"€ */}
      <div className="mt-8">
        <Card className={`flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between ${
          isGstActive ? 'border-forest/20 bg-[#f0faf4]' : 'border-line bg-white'
        }`}>
          <div className="flex items-start gap-3">
            <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[9px] ${
              isGstActive ? 'bg-forest text-white' : 'bg-navy/[0.06] text-navy'
            }`}>
              <PlusIcon className="h-5 w-5" />
            </span>
            <div>
              <p className={`font-semibold ${isGstActive ? 'text-forest' : 'text-navy'}`}>
                {isGstActive ? t('buyer.dashboard.sellCta.readyTitle') : t('buyer.dashboard.sellCta.wantTitle')}
              </p>
              <p className="mt-0.5 text-sm text-muted">
                {isGstActive
                  ? t('buyer.dashboard.sellCta.readyDescription')
                  : t('buyer.dashboard.sellCta.wantDescription')}
              </p>
            </div>
          </div>
          <Link to="/buyer/switch-to-seller" className="shrink-0">
            <Button variant={isGstActive ? 'primary' : 'secondary'} className="whitespace-nowrap">
              {isGstActive ? t('buyer.dashboard.sellCta.switchButton') : t('buyer.dashboard.sellCta.learnMoreButton')}
              <ChevronRightIcon className="h-4 w-4" />
            </Button>
          </Link>
        </Card>
      </div>

      {contacts.length > 0 && (
        <div className="mt-8">
          <h2 className="font-display text-xl text-navy">{t('buyer.dashboard.dealContacts.heading')}</h2>
          <p className="mt-1 text-sm text-navy/55">
            {t('buyer.dashboard.dealContacts.description')}
          </p>
          <div className="mt-4 divide-y divide-navy/10 overflow-hidden rounded-2xl border border-navy/10 bg-white">
            {contacts.map((c) => (
              <div key={c.transactionId} className="flex items-center justify-between gap-4 px-5 py-4">
                <div>
                  <p className="font-semibold text-navy">{c.listingTitle}</p>
                  <p className="text-sm text-navy/45">
                    {c.contact.fullName} · {c.contact.phone}
                    {c.contact.email ? ` · ${c.contact.email}` : ''}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
