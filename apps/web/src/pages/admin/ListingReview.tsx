import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import type { ListingDto } from '@machinebazaar/shared';
import { ListingStatus } from '@machinebazaar/shared';
import { api, apiErrorMessage } from '../../lib/api';
import { formatInr } from '../../lib/format';
import { Button, ErrorBanner, LoadingBlock, MonoLabel, StatusBadge } from '../../components/ui';
import { humanizeStatus } from '../../lib/format';
import { ArrowLeftIcon, CheckCircleIcon, CloseIcon, PhotoIcon, VideoIcon } from '../../components/icons';

export function AdminListingReview() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [listing, setListing] = useState<ListingDto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeMediaId, setActiveMediaId] = useState<string | null>(null);
  const [acting, setActing] = useState(false);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    api
      .get<ListingDto>(`/admin/listings/${id}`)
      .then(({ data }) => {
        if (cancelled) return;
        setListing(data);
        setActiveMediaId(data.media?.[0]?.id ?? null);
      })
      .catch((err) => {
        if (!cancelled) setError(apiErrorMessage(err, 'This listing could not be found.'));
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  const act = async (action: 'approve' | 'reject') => {
    if (!listing) return;
    setActing(true);
    setError(null);
    try {
      await api.post(`/admin/listings/${listing.id}/${action}`);
      navigate('/admin/listings');
    } catch (err) {
      setError(apiErrorMessage(err, `Could not ${action} this listing.`));
    } finally {
      setActing(false);
    }
  };

  if (error) {
    return (
      <div className="mx-auto max-w-3xl py-16 text-center">
        <ErrorBanner message={error} />
        <Link to="/admin/listings" className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-forest">
          <ArrowLeftIcon className="h-4 w-4" />
          Back to review queue
        </Link>
      </div>
    );
  }

  if (!listing) return <LoadingBlock />;

  const photos = listing.media?.filter((m) => m.type === 'PHOTO') ?? [];
  const video = listing.media?.find((m) => m.type === 'VIDEO');
  const activeMedia = listing.media?.find((m) => m.id === activeMediaId) ?? listing.media?.[0];

  return (
    <div>
      <Link
        to="/admin/listings"
        className="mb-6 inline-flex items-center gap-1.5 text-[13.5px] font-semibold text-muted transition hover:text-ink"
      >
        <ArrowLeftIcon className="h-4 w-4" />
        Back to review queue
      </Link>

      {error && (
        <div className="mb-5">
          <ErrorBanner message={error} />
        </div>
      )}

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <div className="overflow-hidden rounded-[14px] border border-line bg-white grid-backdrop-fine">
            <div className="flex aspect-video items-center justify-center">
              {activeMedia ? (
                activeMedia.type === 'VIDEO' ? (
                  <video src={activeMedia.url} controls className="h-full w-full bg-black object-contain" />
                ) : (
                  <img src={activeMedia.url} alt={listing.title} className="h-full w-full object-cover" />
                )
              ) : (
                <PhotoIcon className="h-12 w-12 text-forest/25" />
              )}
            </div>
          </div>

          {(photos.length > 0 || video) && (
            <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
              {video && (
                <button
                  type="button"
                  onClick={() => setActiveMediaId(video.id)}
                  className={`flex shrink-0 items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition ${
                    activeMediaId === video.id
                      ? 'border-forest bg-forest-bg text-forest'
                      : 'border-line text-muted hover:border-line-2'
                  }`}
                >
                  <VideoIcon className="h-4 w-4" />
                  Running video {video.durationSeconds ? `(${video.durationSeconds}s)` : ''}
                </button>
              )}
              {photos.map((photo, idx) => (
                <button
                  key={photo.id}
                  type="button"
                  onClick={() => setActiveMediaId(photo.id)}
                  className={`h-16 w-20 shrink-0 overflow-hidden rounded-lg border-2 transition ${
                    activeMediaId === photo.id ? 'border-forest' : 'border-transparent opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={photo.url} alt={`${listing.title} photo ${idx + 1}`} className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {photos.length === 0 && !video && (
            <p className="mt-3 text-[13px] text-muted">No proof media has been uploaded for this listing yet.</p>
          )}

          <div className="mt-10">
            <MonoLabel className="text-copper">— Description</MonoLabel>
            <p className="mt-3 whitespace-pre-line text-[14.5px] leading-[1.75] text-slate">{listing.description}</p>
          </div>

          <div className="mt-10">
            <MonoLabel className="text-copper">— Specifications</MonoLabel>
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {[
                ['Category', listing.machineCategory],
                ['Make', listing.machineMake],
                ['Model', listing.machineModel],
                ['Manufacture year', String(listing.manufactureYear)],
                ['Location', `${listing.locationCity}, ${listing.locationState}`],
                ['Complexity tier', listing.complexityTier],
              ].map(([label, value]) => (
                <div key={label} className="rounded-xl border border-dashed border-line-2 bg-white p-4">
                  <MonoLabel>{label}</MonoLabel>
                  <p className="mt-1 text-[13.5px] font-bold text-ink">{value}</p>
                </div>
              ))}
            </div>
          </div>

          {listing.seller && (
            <div className="mt-10">
              <MonoLabel className="text-copper">— Seller contact</MonoLabel>
              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {[
                  ['Name', listing.seller.fullName],
                  ['Phone', listing.seller.phone],
                  ['Email', listing.seller.email ?? '—'],
                  ['Business name', listing.seller.businessName ?? '—'],
                  ['GST number', listing.seller.gstNumber ?? '—'],
                  ['GST status', humanizeStatus(listing.seller.gstStatus)],
                  ['Location', [listing.seller.locationCity, listing.seller.locationState].filter(Boolean).join(', ') || '—'],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-xl border border-dashed border-line-2 bg-white p-4">
                    <MonoLabel>{label}</MonoLabel>
                    <p className="mt-1 text-[13.5px] font-bold text-ink">{value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <aside className="space-y-5">
          <div className="rounded-[14px] border border-line bg-white p-6">
            <div className="flex items-center justify-between">
              <StatusBadge status={listing.status} />
              <span className="font-mono text-[10.5px] font-semibold tracking-[0.04em] text-muted">
                MB-{listing.id.slice(0, 8).toUpperCase()}
              </span>
            </div>
            <h1 className="mt-3.5 font-display text-2xl font-medium leading-[1.2] tracking-[-0.4px] text-ink">
              {listing.title}
            </h1>
            <p className="mt-1.5 text-[12.5px] font-medium text-muted">
              Seller {listing.seller?.fullName ?? `${listing.sellerId.slice(0, 8)}...`} · {listing.locationCity}, {listing.locationState}
            </p>

            <div className="mt-5 border-t border-line pt-5">
              <MonoLabel>Asking price</MonoLabel>
              <p className="mt-1 font-display text-[34px] font-medium leading-none tracking-[-0.5px] text-ink">
                {formatInr(listing.askingPrice)}
              </p>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-2 border-t border-line pt-5 text-[12.5px] font-semibold text-muted">
              <div>
                <MonoLabel>Photos</MonoLabel>
                <p className="mt-0.5 text-ink">{photos.length}</p>
              </div>
              <div>
                <MonoLabel>Video</MonoLabel>
                <p className="mt-0.5 text-ink">{video ? `${video.durationSeconds ?? 0}s` : 'Not uploaded'}</p>
              </div>
            </div>

            {listing.status === ListingStatus.PENDING_REVIEW ? (
              <div className="mt-6 flex flex-col gap-2.5">
                <Button onClick={() => act('approve')} disabled={acting} className="w-full">
                  <CheckCircleIcon className="h-4 w-4" />
                  Approve listing
                </Button>
                <Button variant="ghost" onClick={() => act('reject')} disabled={acting} className="w-full">
                  <CloseIcon className="h-4 w-4" />
                  Reject listing
                </Button>
              </div>
            ) : (
              <p className="mt-6 text-[13px] text-muted">No action needed — this listing is {listing.status}.</p>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
