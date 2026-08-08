import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { GstStatus } from '@machinebazaar/shared';
import type { ListingDto, ReleasedContactSummaryDto } from '@machinebazaar/shared';
import { api } from '../../lib/api';
import { useAuth } from '../../lib/auth-context';
import { Button, Card, LoadingBlock, PageHeading, StatusBadge } from '../../components/ui';
import { ChevronRightIcon, MachineIcon, PlusIcon, ShieldCheckIcon } from '../../components/icons';

export function SellerDashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [listings, setListings] = useState<ListingDto[] | null>(null);
  const [contacts, setContacts] = useState<ReleasedContactSummaryDto[]>([]);

  useEffect(() => {
    let cancelled = false;
    api
      .get<ListingDto[]>('/listings/mine/all')
      .then(({ data }) => {
        if (!cancelled) setListings(data);
      })
      .catch(() => {
        if (!cancelled) setListings([]);
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
  const counts = listings
    ? {
        active: listings.filter((l) => l.status === 'ACTIVE').length,
        pending: listings.filter((l) => l.status === 'PENDING_REVIEW').length,
        sold: listings.filter((l) => l.status === 'SOLD').length,
      }
    : null;

  return (
    <div>
      <PageHeading
        eyebrow={t('seller.dashboard.eyebrow')}
        title={t('seller.dashboard.welcomeTitle', { name: user?.fullName?.split(' ')[0] ?? '' })}
        description={t('seller.dashboard.description')}
      />

      {!isGstActive && (
        <Card className="mb-8 flex flex-col gap-4 border-amber-200 bg-amber-50 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <ShieldCheckIcon className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
            <div>
              <p className="font-semibold text-amber-800">{t('seller.dashboard.gstBanner.title')}</p>
              <p className="mt-1 text-sm text-amber-700">
                {t('seller.dashboard.gstBanner.description')}
              </p>
            </div>
          </div>
          <Link to="/seller/gst-verification">
            <Button variant="secondary" className="whitespace-nowrap">
              {t('seller.dashboard.gstBanner.cta')}
              <ChevronRightIcon className="h-4 w-4" />
            </Button>
          </Link>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <Card>
          <p className="text-xs font-semibold uppercase tracking-wide text-navy/40">{t('seller.dashboard.stats.activeListings')}</p>
          <p className="mt-2 font-display text-3xl text-navy">{counts ? counts.active : '—'}</p>
        </Card>
        <Card>
          <p className="text-xs font-semibold uppercase tracking-wide text-navy/40">{t('seller.dashboard.stats.pendingReview')}</p>
          <p className="mt-2 font-display text-3xl text-navy">{counts ? counts.pending : '—'}</p>
        </Card>
        <Card>
          <p className="text-xs font-semibold uppercase tracking-wide text-navy/40">{t('seller.dashboard.stats.sold')}</p>
          <p className="mt-2 font-display text-3xl text-navy">{counts ? counts.sold : '—'}</p>
        </Card>
      </div>

      <div className="mt-8 flex items-center justify-between">
        <h2 className="font-display text-xl text-navy">{t('seller.dashboard.recentListings.heading')}</h2>
        <div className="flex gap-2">
          <Link to="/seller/listings">
            <Button variant="ghost">{t('common:common.button.viewAll')}</Button>
          </Link>
          <Link to="/seller/listings/new">
            <Button disabled={!isGstActive}>
              <PlusIcon className="h-4 w-4" />
              {t('seller.dashboard.recentListings.newListing')}
            </Button>
          </Link>
        </div>
      </div>

      {listings === null ? (
        <LoadingBlock />
      ) : listings.length === 0 ? (
        <Card className="mt-4 flex flex-col items-center gap-3 py-12 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-navy/[0.06] text-navy">
            <MachineIcon className="h-6 w-6" />
          </span>
          <p className="font-display text-lg text-navy">{t('seller.dashboard.emptyState.title')}</p>
          <p className="max-w-sm text-sm text-navy/55">
            {isGstActive
              ? t('seller.dashboard.emptyState.descriptionGstActive')
              : t('seller.dashboard.emptyState.descriptionGstInactive')}
          </p>
          <Link to={isGstActive ? '/seller/listings/new' : '/seller/gst-verification'}>
            <Button>{isGstActive ? t('seller.dashboard.emptyState.createListing') : t('seller.dashboard.emptyState.verifyGst')}</Button>
          </Link>
        </Card>
      ) : (
        <div className="mt-4 divide-y divide-navy/10 overflow-hidden rounded-2xl border border-navy/10 bg-white">
          {listings.slice(0, 6).map((listing) => (
            <Link key={listing.id} to={`/seller/listings/${listing.id}/edit`} className="flex items-center justify-between gap-4 px-5 py-4 transition hover:bg-navy/[0.02]">
              <div>
                <p className="font-semibold text-navy">{listing.title}</p>
                <p className="text-sm text-navy/45">
                  {listing.machineMake} · {listing.machineModel} · {listing.locationCity}
                </p>
              </div>
              <StatusBadge status={listing.status} />
            </Link>
          ))}
        </div>
      )}

      {contacts.length > 0 && (
        <div className="mt-8">
          <h2 className="font-display text-xl text-navy">{t('seller.dashboard.dealContacts.heading')}</h2>
          <p className="mt-1 text-sm text-navy/55">
            {t('seller.dashboard.dealContacts.description')}
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
