import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { GstStatus } from '@machinebazaar/shared';
import type { ListingDto } from '@machinebazaar/shared';
import { api, apiErrorMessage } from '../../lib/api';
import { useAuth } from '../../lib/auth-context';
import { getSavedListingIds } from '../../lib/saved-listings';
import { formatInr } from '../../lib/format';
import { Button, Card, ErrorBanner, Field, Input, LoadingBlock, PageHeading, Select, SuccessBanner } from '../../components/ui';
import { ChevronRightIcon, RupeeIcon, ShieldCheckIcon } from '../../components/icons';

export function BuyerNewLoan() {
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
    let cancelled = false;
    const ids = user ? getSavedListingIds(user.id) : [];
    const allIds = presetListingId && !ids.includes(presetListingId) ? [presetListingId, ...ids] : ids;

    if (allIds.length === 0) {
      setListings([]);
    } else {
      Promise.all(
        allIds.map((id) =>
          api
            .get<ListingDto>(`/listings/${id}`)
            .then(({ data }) => data)
            .catch(() => null),
        ),
      ).then((results) => {
        if (!cancelled) setListings(results.filter((l): l is ListingDto => l !== null));
      });
    }

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
      setError(apiErrorMessage(err, 'Could not submit your loan application. Please try again.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeading
        eyebrow="Buyer workspace"
        title="Apply for financing"
        description="Submitting an application routes the listing for an independent certification. Once the certification is complete, our team will route your application to a suitable bank or NBFC partner."
      />

      {!isGstActive ? (
        <Card className="flex flex-col gap-4 border-amber-200 bg-amber-50 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <ShieldCheckIcon className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
            <div>
              <p className="font-semibold text-amber-800">Verify your GST to continue</p>
              <p className="mt-1 text-sm text-amber-700">
                An ACTIVE GST registration is required before you can submit a loan application.
              </p>
            </div>
          </div>
          <Link to="/buyer/gst-verification">
            <Button variant="secondary" className="whitespace-nowrap">
              Verify GST now
              <ChevronRightIcon className="h-4 w-4" />
            </Button>
          </Link>
        </Card>
      ) : done ? (
        <SuccessBanner message="Your loan application was submitted. We've started the certification process and will route your application to a partner once it's complete." />
      ) : listings === null ? (
        <LoadingBlock />
      ) : listings.length === 0 ? (
        <Card className="flex flex-col items-center gap-3 py-12 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-navy/[0.06] text-navy">
            <RupeeIcon className="h-6 w-6" />
          </span>
          <p className="font-display text-lg text-navy">Save a listing first</p>
          <p className="max-w-sm text-sm text-navy/55">
            Browse machines, save the one you&apos;re interested in, then come back here to apply
            for financing against it.
          </p>
          <Link to="/listings">
            <Button>Browse listings</Button>
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
            <Field label="Listing">
              <Select value={listingId} onChange={(e) => setListingId(e.target.value)} required>
                <option value="">Select a saved listing...</option>
                {listings.map((listing) => (
                  <option key={listing.id} value={listing.id}>
                    {listing.title} · {formatInr(listing.askingPrice)}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Amount requested (₹)" hint="Enter the loan amount you'd like to apply for.">
              <Input
                type="number"
                min={1}
                step="1"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="e.g. 1500000"
              />
            </Field>

            <Button type="submit" disabled={submitting} className="w-full">
              {submitting ? 'Submitting...' : 'Submit application'}
            </Button>
          </form>
        </Card>
      )}
    </div>
  );
}
