import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { GstStatus } from '@machinebazaar/shared';
import type { ListingDto } from '@machinebazaar/shared';
import { api, apiErrorMessage } from '../../lib/api';
import { useAuth } from '../../lib/auth-context';
import { formatInr } from '../../lib/format';
import { Button, Card, ErrorBanner, Field, Input, LoadingBlock, PageHeading, Select, SuccessBanner } from '../../components/ui';
import { ChevronRightIcon, RupeeIcon, ShieldCheckIcon } from '../../components/icons';

export function BuyerNewLoan() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const presetListingId = searchParams.get('listingId');

  const [listings, setListings] = useState<ListingDto[] | null>(null);

  const [listingId, setListingId] = useState(presetListingId ?? '');
  const [amount, setAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const isGstActive = user?.gstStatus === GstStatus.ACTIVE;

  useEffect(() => {
    if (!user) {
      setListings([]);
      return;
    }
    let cancelled = false;
    api
      .get<ListingDto[]>('/wishlist')
      .then(async ({ data }) => {
        if (presetListingId && !data.some((l) => l.id === presetListingId)) {
          try {
            const { data: preset } = await api.get<ListingDto>(`/listings/${presetListingId}`);
            data = [preset, ...data];
          } catch {
            // preset listing not found/accessible — fall through with the wishlist alone
          }
        }
        if (!cancelled) setListings(data);
      })
      .catch(() => { if (!cancelled) setListings([]); });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!listingId || !amount) return;
    setSubmitting(true);
    setError(null);
    try {
      const { data: application } = await api.post<{ id: string }>('/loans', {
        listingId,
        amountRequested: Number(amount),
      });
      await api.post(`/loans/${application.id}/submit`);
      setDone(true);
      setTimeout(() => navigate('/buyer/loans'), 1200);
    } catch (err) {
      setError(apiErrorMessage(err, t('buyer.newLoan.errorSubmit')));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeading
        eyebrow={t('buyer.newLoan.eyebrow')}
        title={t('buyer.newLoan.title')}
        description={t('buyer.newLoan.description')}
      />

      {!isGstActive ? (
        <Card className="flex flex-col gap-4 border-amber-200 bg-amber-50 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <ShieldCheckIcon className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
            <div>
              <p className="font-semibold text-amber-800">{t('buyer.newLoan.gstGate.title')}</p>
              <p className="mt-1 text-sm text-amber-700">
                {t('buyer.newLoan.gstGate.description')}
              </p>
            </div>
          </div>
          <Link to="/buyer/gst-verification">
            <Button variant="secondary" className="whitespace-nowrap">
              {t('buyer.newLoan.gstGate.cta')}
              <ChevronRightIcon className="h-4 w-4" />
            </Button>
          </Link>
        </Card>
      ) : done ? (
        <SuccessBanner message={t('buyer.newLoan.successMessage')} />
      ) : listings === null ? (
        <LoadingBlock />
      ) : listings.length === 0 ? (
        <Card className="flex flex-col items-center gap-3 py-12 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-navy/[0.06] text-navy">
            <RupeeIcon className="h-6 w-6" />
          </span>
          <p className="font-display text-lg text-navy">{t('buyer.newLoan.noSaved.title')}</p>
          <p className="max-w-sm text-sm text-navy/55">
            {t('buyer.newLoan.noSaved.description')}
          </p>
          <Link to="/listings">
            <Button>{t('buyer.newLoan.noSaved.browseButton')}</Button>
          </Link>
        </Card>
      ) : (
        <Card>
          {error && (
            <div className="mb-5">
              <ErrorBanner message={error} />
            </div>
          )}
          <form className="space-y-5" onSubmit={handleSubmit}>
            <Field label={t('buyer.newLoan.form.listingLabel')}>
              <Select value={listingId} onChange={(e) => setListingId(e.target.value)} required>
                <option value="">{t('buyer.newLoan.form.listingPlaceholder')}</option>
                {listings.map((listing) => (
                  <option key={listing.id} value={listing.id}>
                    {listing.title} · {formatInr(listing.askingPrice)}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label={t('buyer.newLoan.form.amountLabel')} hint={t('buyer.newLoan.form.amountHint')}>
              <Input
                type="number"
                min={1}
                step="1"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder={t('buyer.newLoan.form.amountPlaceholder')}
              />
            </Field>

            <Button type="submit" disabled={submitting} className="w-full">
              {submitting ? t('buyer.newLoan.form.submitting') : t('buyer.newLoan.form.submit')}
            </Button>
          </form>
        </Card>
      )}
    </div>
  );
}
