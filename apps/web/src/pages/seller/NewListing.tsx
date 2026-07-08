import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ListingDto, ListingMediaDto } from '@machinebazaar/shared';
import { api, apiErrorMessage } from '../../lib/api';
import { formatInr } from '../../lib/format';
import {
  EMPTY_LISTING_DETAILS,
  ListingDetailsForm,
  listingDetailsToPayload,
  type ListingDetailsValues,
} from '../../components/ListingDetailsForm';
import { ListingMediaManager } from '../../components/ListingMediaManager';
import { Button, Card, ErrorBanner, PageHeading, SuccessBanner } from '../../components/ui';
import { CheckCircleIcon } from '../../components/icons';

const STEPS = ['Details', 'Media', 'Review'] as const;

export function NewListing() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [listing, setListing] = useState<ListingDto | null>(null);
  const [media, setMedia] = useState<ListingMediaDto[]>([]);
  const [details, setDetails] = useState<ListingDetailsValues | null>(null);
  const [creating, setCreating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const photos = media.filter((m) => m.type === 'PHOTO');
  const video = media.find((m) => m.type === 'VIDEO');
  const mediaReady = photos.length >= 5 && photos.length <= 10 && !!video && (video.durationSeconds ?? 0) >= 60;

  const handleCreate = async (values: ListingDetailsValues) => {
    setError(null);
    setCreating(true);
    try {
      const { data } = await api.post<ListingDto>('/listings', listingDetailsToPayload(values));
      setDetails(values);
      setListing(data);
      setMedia(data.media ?? []);
      setStep(1);
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not save your listing details. Please check the form and try again.'));
    } finally {
      setCreating(false);
    }
  };

  const handleSubmitForReview = async () => {
    if (!listing) return;
    setError(null);
    setSubmitting(true);
    try {
      await api.post(`/listings/${listing.id}/submit`);
      setSubmitted(true);
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not submit this listing for review yet — check the media requirements above.'));
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted && listing) {
    return (
      <div className="mx-auto max-w-xl py-16 text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
          <CheckCircleIcon className="h-7 w-7" />
        </span>
        <h1 className="mt-5 font-display text-3xl text-navy">Submitted for review</h1>
        <p className="mt-3 text-sm leading-relaxed text-navy/60">
          <span className="font-semibold text-navy">{listing.title}</span> is now in our review
          queue. Our admin team checks listing details and proof media before approving it to go
          live — you&apos;ll see its status update on your listings page.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button onClick={() => navigate('/seller/listings')}>Go to my listings</Button>
          <Button variant="ghost" onClick={() => navigate(`/seller/listings/${listing.id}/edit`)}>
            View this listing
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeading
        eyebrow="New listing"
        title="Create a listing in three steps"
        description="Fill in the machine details, add proof media that meets our requirements, then submit for admin review."
      />

      <ol className="mb-8 flex items-center gap-3">
        {STEPS.map((label, idx) => (
          <li key={label} className="flex items-center gap-3">
            <span
              className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold ${
                idx < step ? 'bg-emerald-100 text-emerald-700' : idx === step ? 'bg-accent text-white' : 'bg-navy/[0.06] text-navy/40'
              }`}
            >
              {idx < step ? <CheckCircleIcon className="h-4 w-4" /> : idx + 1}
            </span>
            <span className={`text-sm font-medium ${idx === step ? 'text-navy' : 'text-navy/45'}`}>{label}</span>
            {idx < STEPS.length - 1 && <span className="h-px w-10 bg-navy/10" />}
          </li>
        ))}
      </ol>

      {error && <div className="mb-5"><ErrorBanner message={error} /></div>}

      {step === 0 && (
        <Card className="max-w-2xl">
          <ListingDetailsForm initial={details ?? EMPTY_LISTING_DETAILS} submitLabel="Save & continue to media" submitting={creating} onSubmit={handleCreate} />
        </Card>
      )}

      {step === 1 && listing && (
        <div className="space-y-6">
          <ListingMediaManager listingId={listing.id} media={media} onChange={setMedia} />
          <div className="flex justify-end">
            <Button onClick={() => setStep(2)} disabled={!mediaReady}>
              Continue to review
            </Button>
          </div>
        </div>
      )}

      {step === 2 && listing && details && (
        <div className="max-w-2xl space-y-6">
          <Card>
            <h2 className="font-display text-xl text-navy">{details.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-navy/60">{details.description}</p>
            <dl className="mt-5 grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
              {[
                ['Category', details.machineCategory],
                ['Make / model', `${details.machineMake} ${details.machineModel}`],
                ['Year', details.manufactureYear],
                ['Asking price', formatInr(details.askingPrice)],
                ['Location', `${details.locationCity}, ${details.locationState}`],
                ['Complexity', details.complexityTier],
              ].map(([label, value]) => (
                <div key={label}>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-navy/40">{label}</dt>
                  <dd className="mt-0.5 font-medium text-navy">{value}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-5 text-sm text-navy/55">
              {photos.length} photo{photos.length === 1 ? '' : 's'} and {video ? '1 running video' : 'no video'} attached.
            </p>
          </Card>
          <SuccessBanner message="Your media meets the minimum requirements — you're ready to submit for admin review." />
          <div className="flex flex-wrap gap-3">
            <Button onClick={handleSubmitForReview} disabled={submitting}>
              {submitting ? 'Submitting...' : 'Submit for review'}
            </Button>
            <Button variant="ghost" onClick={() => setStep(1)}>
              Back to media
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
