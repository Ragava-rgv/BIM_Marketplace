import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { ListingDto } from '../../shared';
import { ListingStatus } from '../../shared';
import { api, apiErrorMessage } from '../../lib/api';
import { formatInr, formatSpecField } from '../../lib/format';
import { Button, ErrorBanner, LoadingBlock, MonoLabel, StatusBadge } from '../../components/ui';
import { humanizeStatus } from '../../lib/format';
import { ArrowLeftIcon, CheckCircleIcon, CloseIcon, PhotoIcon, VideoIcon } from '../../components/icons';

export function AdminListingReview() {
  const { t } = useTranslation();
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
        if (!cancelled) setError(apiErrorMessage(err, t('admin.listingReview.notFound')));
      });
    return () => {
      cancelled = true;
    };
  }, [id, t]);

  const act = async (action: 'approve' | 'reject') => {
    if (!listing) return;
    setActing(true);
    setError(null);
    try {
      await api.post(`/admin/listings/${listing.id}/${action}`);
      navigate('/admin/listings');
    } catch (err) {
      setError(apiErrorMessage(err, action === 'approve' ? t('admin.listingReview.approveError') : t('admin.listingReview.rejectError')));
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
          {t('admin.listingReview.backToQueue')}
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
        {t('admin.listingReview.backToQueue')}
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
                  {t('admin.listingReview.runningVideo', { duration: video.durationSeconds ? `(${video.durationSeconds}s)` : '' })}
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
                  <img src={photo.url} alt={t('admin.listingReview.photoAlt', { title: listing.title, index: idx + 1 })} className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {photos.length === 0 && !video && (
            <p className="mt-3 text-[13px] text-muted">{t('admin.listingReview.noMedia')}</p>
          )}

          <div className="mt-10">
            <MonoLabel className="text-copper">— {t('admin.listingReview.description')}</MonoLabel>
            <p className="mt-3 whitespace-pre-line text-[14.5px] leading-[1.75] text-slate">{listing.description}</p>
          </div>

          <div className="mt-10">
            <MonoLabel className="text-copper">— {t('admin.listingReview.specifications')}</MonoLabel>
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {[
                [t('admin.listingReview.fields.category'), listing.machineCategory],
                [t('admin.listingReview.fields.make'), listing.machineMake],
                [t('admin.listingReview.fields.model'), listing.machineModel],
                [t('admin.listingReview.fields.manufactureYear'), String(listing.manufactureYear)],
                [t('admin.listingReview.fields.location'), `${listing.locationCity}, ${listing.locationState}`],
                [t('admin.listingReview.fields.complexityTier'), listing.complexityTier],
              ].map(([label, value]) => (
                <div key={label} className="rounded-xl border border-dashed border-line-2 bg-white p-4">
                  <MonoLabel>{label}</MonoLabel>
                  <p className="mt-1 text-[13.5px] font-bold text-ink">{value}</p>
                </div>
              ))}
            </div>
          </div>

          {listing.catalogCategory?.specFields && listing.catalogCategory.specFields.length > 0 && (
            <div className="mt-10">
              <MonoLabel className="text-copper">— {t('admin.listingReview.categorySpecifications', { category: listing.catalogCategory.name })}</MonoLabel>
              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {listing.catalogCategory.specFields.map((field) => {
                  const { label, value } = formatSpecField(field, listing.specs?.[field.fieldKey]);
                  return (
                    <div key={field.id} className="rounded-xl border border-dashed border-line-2 bg-white p-4">
                      <MonoLabel>{label}</MonoLabel>
                      <p className="mt-1 text-[13.5px] font-bold text-ink">{value}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {listing.seller && (
            <div className="mt-10">
              <MonoLabel className="text-copper">— {t('admin.listingReview.sellerContact')}</MonoLabel>
              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {[
                  [t('admin.listingReview.fields.name'), listing.seller.fullName],
                  [t('admin.listingReview.fields.phone'), listing.seller.phone],
                  [t('admin.listingReview.fields.email'), listing.seller.email ?? '—'],
                  [t('admin.listingReview.fields.businessName'), listing.seller.businessName ?? '—'],
                  [t('admin.listingReview.fields.gstNumber'), listing.seller.gstNumber ?? '—'],
                  [t('admin.listingReview.fields.gstStatus'), humanizeStatus(listing.seller.gstStatus)],
                  [t('admin.listingReview.fields.location'), [listing.seller.locationCity, listing.seller.locationState].filter(Boolean).join(', ') || '—'],
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
              {t('admin.listingReview.sellerLine', {
                seller: listing.seller?.fullName ?? `${listing.sellerId.slice(0, 8)}...`,
                city: listing.locationCity,
                state: listing.locationState,
              })}
            </p>

            <div className="mt-5 border-t border-line pt-5">
              <MonoLabel>{t('admin.listingReview.askingPrice')}</MonoLabel>
              <p className="mt-1 font-display text-[34px] font-medium leading-none tracking-[-0.5px] text-ink">
                {formatInr(listing.askingPrice)}
              </p>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-2 border-t border-line pt-5 text-[12.5px] font-semibold text-muted">
              <div>
                <MonoLabel>{t('admin.listingReview.photos')}</MonoLabel>
                <p className="mt-0.5 text-ink">{photos.length}</p>
              </div>
              <div>
                <MonoLabel>{t('admin.listingReview.video')}</MonoLabel>
                <p className="mt-0.5 text-ink">{video ? `${video.durationSeconds ?? 0}s` : t('admin.listingReview.notUploaded')}</p>
              </div>
            </div>

            {listing.status === ListingStatus.PENDING_REVIEW ? (
              <div className="mt-6 flex flex-col gap-2.5">
                <Button onClick={() => act('approve')} disabled={acting} className="w-full">
                  <CheckCircleIcon className="h-4 w-4" />
                  {t('admin.listingReview.approveListing')}
                </Button>
                <Button variant="ghost" onClick={() => act('reject')} disabled={acting} className="w-full">
                  <CloseIcon className="h-4 w-4" />
                  {t('admin.listingReview.rejectListing')}
                </Button>
              </div>
            ) : (
              <p className="mt-6 text-[13px] text-muted">
                {t('admin.listingReview.noActionNeeded', { status: t(`common:status.listing.${listing.status}`) })}
              </p>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
