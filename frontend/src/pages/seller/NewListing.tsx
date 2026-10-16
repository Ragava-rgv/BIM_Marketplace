import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { ListingDto, ListingMediaDto } from '../../shared';
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

const STEP_KEYS = [
  'seller.newListing.steps.details',
  'seller.newListing.steps.media',
  'seller.newListing.steps.review',
] as const;

export function NewListing() {
  const { t } = useTranslation();
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
      setError(apiErrorMessage(err, t('seller.newListing.errors.createFailed')));
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
      setError(apiErrorMessage(err, t('seller.newListing.errors.submitFailed')));
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
        <h1 className="mt-5 font-display text-3xl text-navy">{t('seller.newListing.submitted.title')}</h1>
        <p className="mt-3 text-sm leading-relaxed text-navy/60">
          <span className="font-semibold text-navy">{listing.title}</span>{' '}
          {t('seller.newListing.submitted.description')}
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button onClick={() => navigate('/seller/listings')}>{t('seller.newListing.submitted.goToListings')}</Button>
          <Button variant="ghost" onClick={() => navigate(`/seller/listings/${listing.id}/edit`)}>
            {t('seller.newListing.submitted.viewListing')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeading
        eyebrow={t('seller.newListing.eyebrow')}
        title={t('seller.newListing.title')}
        description={t('seller.newListing.description')}
      />

      <ol className="mb-8 flex items-center gap-3">
        {STEP_KEYS.map((labelKey, idx) => {
          const reachable = idx <= step;
          return (
            <li key={labelKey} className="flex items-center gap-3">
              <button
                type="button"
                disabled={!reachable}
                onClick={() => reachable && setStep(idx)}
                className={`flex items-center gap-2 rounded-full ${reachable ? 'cursor-pointer' : 'cursor-not-allowed'}`}
              >
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition ${
                    idx < step
                      ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                      : idx === step
                        ? 'bg-accent text-white'
                        : 'bg-navy/[0.06] text-navy/40'
                  }`}
                >
                  {idx < step ? <CheckCircleIcon className="h-4 w-4" /> : idx + 1}
                </span>
                <span className={`text-sm font-medium ${idx === step ? 'text-navy' : reachable ? 'text-navy/70' : 'text-navy/45'}`}>
                  {t(labelKey)}
                </span>
              </button>
              {idx < STEP_KEYS.length - 1 && <span className="h-px w-10 bg-navy/10" />}
            </li>
          );
        })}
      </ol>

      {error && <div className="mb-5"><ErrorBanner message={error} /></div>}

      {step === 0 && (
        <Card className="max-w-2xl">
          <ListingDetailsForm initial={details ?? EMPTY_LISTING_DETAILS} submitLabel={t('seller.newListing.saveContinue')} submitting={creating} onSubmit={handleCreate} />
        </Card>
      )}

      {step === 1 && listing && (
        <div className="space-y-6">
          <ListingMediaManager listingId={listing.id} media={media} onChange={setMedia} />
          <div className="flex justify-end">
            <Button onClick={() => setStep(2)} disabled={!mediaReady}>
              {t('seller.newListing.continueToReview')}
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
                [t('seller.newListing.review.category'), details.machineCategory],
                [t('seller.newListing.review.makeModel'), `${details.machineMake} ${details.machineModel}`],
                [t('seller.newListing.review.year'), details.manufactureYear || t('common:common.label.notAvailable')],
                [
                  t('seller.newListing.review.origin'),
                  details.origin === 'IMPORTED'
                    ? `${t('seller.newListing.review.imported')}${details.importedCountry ? ` (${details.importedCountry})` : ''}`
                    : t('seller.newListing.review.indian'),
                ],
                [t('seller.newListing.review.askingPrice'), formatInr(details.askingPrice)],
                [t('seller.newListing.review.location'), `${details.locationCity}, ${details.locationState}`],
                [t('seller.newListing.review.complexity'), details.complexityTier],
              ].map(([label, value]) => (
                <div key={label}>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-navy/40">{label}</dt>
                  <dd className="mt-0.5 font-medium text-navy">{value}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-5 text-sm text-navy/55">
              {t('seller.newListing.review.mediaSummary', {
                photoCount: t('seller.newListing.review.photoCount', { count: photos.length }),
                videoPart: video ? t('seller.newListing.review.oneVideo') : t('seller.newListing.review.noVideo'),
              })}
            </p>
          </Card>
          <SuccessBanner message={t('seller.newListing.review.mediaReadyMessage')} />
          <div className="flex flex-wrap gap-3">
            <Button onClick={handleSubmitForReview} disabled={submitting}>
              {submitting ? t('seller.newListing.review.submitting') : t('seller.newListing.review.submitForReview')}
            </Button>
            <Button variant="ghost" onClick={() => setStep(1)}>
              {t('seller.newListing.review.backToMedia')}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
