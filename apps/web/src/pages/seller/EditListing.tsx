import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import type { ListingDto, ListingMediaDto } from '@machinebazaar/shared';
import { api, apiErrorMessage } from '../../lib/api';
import {
  ListingDetailsForm,
  listingDetailsToPayload,
  type ListingDetailsValues,
} from '../../components/ListingDetailsForm';
import { ListingMediaManager } from '../../components/ListingMediaManager';
import { Button, Card, ErrorBanner, LoadingBlock, PageHeading, StatusBadge, SuccessBanner } from '../../components/ui';
import { ArrowLeftIcon } from '../../components/icons';

const EDITABLE = new Set(['DRAFT', 'REJECTED']);

function toDetailsValues(listing: ListingDto): ListingDetailsValues {
  return {
    title: listing.title,
    description: listing.description,
    machineCategory: listing.machineCategory,
    machineSubcategory: listing.machineSubcategory ?? '',
    machineMake: listing.machineMake,
    machineModel: listing.machineModel,
    manufactureYear: listing.manufactureYear != null ? String(listing.manufactureYear) : '',
    origin: listing.origin,
    importedCountry: listing.importedCountry ?? '',
    askingPrice: listing.askingPrice,
    locationCity: listing.locationCity,
    locationState: listing.locationState,
    complexityTier: listing.complexityTier,
    catalogCategoryId: listing.catalogCategoryId ?? '',
    specs: (listing.specs as Record<string, string>) ?? {},
    conditionGrade: listing.conditionGrade ?? '',
    runningHours: listing.runningHours != null ? String(listing.runningHours) : '',
    negotiable: listing.negotiable ?? false,
  };
}

export function EditListing() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [listing, setListing] = useState<ListingDto | null>(null);
  const [media, setMedia] = useState<ListingMediaDto[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [savingDetails, setSavingDetails] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);

  const load = () => {
    if (!id) return;
    api
      .get<ListingDto>(`/listings/mine/${id}`)
      .then(({ data }) => {
        setListing(data);
        setMedia(data.media ?? []);
      })
      .catch((err) => setLoadError(apiErrorMessage(err, 'This listing could not be found.')));
  };

  useEffect(load, [id]);

  if (loadError) {
    return (
      <div className="text-center">
        <ErrorBanner message={loadError} />
        <Link to="/seller/listings" className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-accent">
          <ArrowLeftIcon className="h-4 w-4" />
          Back to my listings
        </Link>
      </div>
    );
  }

  if (!listing) return <LoadingBlock />;

  const editable = EDITABLE.has(listing.status);
  // Media upload is allowed on live listings so sellers can refresh photos without re-review
  const mediaEditable = editable || listing.status === 'ACTIVE';
  const photos = media.filter((m) => m.type === 'PHOTO');
  const video = media.find((m) => m.type === 'VIDEO');
  const mediaReady = photos.length >= 5 && photos.length <= 10 && !!video && (video.durationSeconds ?? 0) >= 60;

  const handleUpdate = async (values: ListingDetailsValues) => {
    setActionError(null);
    setNotice(null);
    setSavingDetails(true);
    try {
      const { data } = await api.patch<ListingDto>(`/listings/${listing.id}`, listingDetailsToPayload(values));
      setListing(data);
      setNotice('Listing details updated.');
    } catch (err) {
      setActionError(apiErrorMessage(err, 'Could not update this listing.'));
    } finally {
      setSavingDetails(false);
    }
  };

  const handleSubmit = async () => {
    setActionError(null);
    setNotice(null);
    setSubmitting(true);
    try {
      const { data } = await api.post<ListingDto>(`/listings/${listing.id}/submit`);
      setListing(data);
      setNotice('Listing submitted for admin review.');
    } catch (err) {
      setActionError(apiErrorMessage(err, 'Could not submit — check the media requirements below.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleWithdraw = async () => {
    setActionError(null);
    setNotice(null);
    setWithdrawing(true);
    try {
      const { data } = await api.post<ListingDto>(`/listings/${listing.id}/withdraw`);
      setListing(data);
      setNotice('Listing withdrawn from the marketplace.');
    } catch (err) {
      setActionError(apiErrorMessage(err, 'Could not withdraw this listing.'));
    } finally {
      setWithdrawing(false);
    }
  };

  return (
    <div>
      <Link to="/seller/listings" className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-navy/55 hover:text-navy">
        <ArrowLeftIcon className="h-4 w-4" />
        Back to my listings
      </Link>

      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <PageHeading title={listing.title} description="Manage details, media and review submission for this listing." />
        <StatusBadge status={listing.status} />
      </div>

      {actionError && <div className="mb-5"><ErrorBanner message={actionError} /></div>}
      {notice && <div className="mb-5"><SuccessBanner message={notice} /></div>}

      {!editable && (
        <Card className="mb-6 border-navy/10 bg-navy/[0.02]">
          <p className="text-sm text-navy/60">
            This listing is currently <span className="font-semibold text-navy">{listing.status.replaceAll('_', ' ').toLowerCase()}</span>.
            Details and media can only be changed while a listing is in <span className="font-semibold">draft</span> or{' '}
            <span className="font-semibold">rejected</span> status.
            {listing.status !== 'SOLD' && ' You can still withdraw it from the marketplace below.'}
          </p>
        </Card>
      )}

      <div className="space-y-10">
        <section>
          <h2 className="mb-4 font-display text-xl text-navy">Listing details</h2>
          {editable ? (
            <Card className="max-w-2xl">
              <ListingDetailsForm initial={toDetailsValues(listing)} submitLabel="Save changes" submitting={savingDetails} onSubmit={handleUpdate} />
            </Card>
          ) : (
            <Card className="max-w-2xl space-y-2 text-sm text-navy/65">
              <p>{listing.description}</p>
              <p className="text-navy/45">
                {listing.machineMake} · {listing.machineModel} · {listing.locationCity}, {listing.locationState}
              </p>
            </Card>
          )}
        </section>

        <section>
          <h2 className="mb-4 font-display text-xl text-navy">Media</h2>
          {mediaEditable ? (
            <ListingMediaManager listingId={listing.id} media={media} onChange={setMedia} />
          ) : media.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {media.map((item) => (
                <div key={item.id} className="overflow-hidden rounded-xl border border-navy/10">
                  {item.type === 'PHOTO' ? (
                    <img src={item.url} alt="" className="aspect-square w-full object-cover" />
                  ) : (
                    <video src={item.url} className="aspect-square w-full object-cover" muted />
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-navy/45">No media on this listing.</p>
          )}
        </section>

        <section className="flex flex-wrap gap-3 border-t border-navy/10 pt-8">
          {editable && (
            <Button onClick={handleSubmit} disabled={submitting || !mediaReady}>
              {submitting ? 'Submitting...' : 'Submit for review'}
            </Button>
          )}
          {listing.status !== 'SOLD' && listing.status !== 'WITHDRAWN' && (
            <Button variant="ghost" onClick={handleWithdraw} disabled={withdrawing}>
              {withdrawing ? 'Withdrawing...' : 'Withdraw listing'}
            </Button>
          )}
          <Button variant="ghost" onClick={() => navigate(`/listings/${listing.id}`)}>
            View public page
          </Button>
        </section>
      </div>
    </div>
  );
}
