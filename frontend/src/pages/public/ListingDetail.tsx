import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { ContactViewStatusDto, ListingDto, PaginatedResult } from '../../shared';
import { ListingStatus, UserRole } from '../../shared';
import { api, apiErrorMessage } from '../../lib/api';
import { useAuth } from '../../lib/auth-context';
import { formatDate, formatInr, formatSpecField } from '../../lib/format';
import { useWishlist } from '../../lib/wishlist-context';
import { Button, ErrorBanner, MonoLabel, Tag } from '../../components/ui';
import { ListingCard } from '../../components/ListingCard';
import { Skeleton, ListingGridSkeleton } from '../../components/Skeleton';
import { QuotaAlertModal, shouldShowQuotaAlert } from '../../components/QuotaAlertModal';
import {
  ArrowLeftIcon,
  ChatIcon,
  CheckCircleIcon,
  MapPinIcon,
  PhotoIcon,
  PlayIcon,
  PlusIcon,
  RupeeIcon,
  ShieldCheckIcon,
  VideoIcon,
} from '../../components/icons';

export function ListingDetail() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, switchMode } = useAuth();
  const { isWishlisted, toggle: toggleWishlist } = useWishlist();

  const [listing, setListing] = useState<ListingDto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeMediaId, setActiveMediaId] = useState<string | null>(null);
  const [enquiring, setEnquiring] = useState(false);
  const [enquiryNotice, setEnquiryNotice] = useState<string | null>(null);
  const [enquirySent, setEnquirySent] = useState(false);

  // Similar machines (same category, excluding this listing)
  const [related, setRelated] = useState<ListingDto[] | null>(null);

  // Contact reveal state
  const [contactStatus, setContactStatus] = useState<ContactViewStatusDto | null>(null);
  const [contactLoading, setContactLoading] = useState(false);
  const [contactError, setContactError] = useState<string | null>(null);
  const [showQuotaModal, setShowQuotaModal] = useState(false);
  const [modeSwitching, setModeSwitching] = useState(false);
  const contactChecked = useRef(false);

  const saved = id ? isWishlisted(id) : false;
  const toggleSave = () => {
    if (!id) return;
    void toggleWishlist(id);
  };

  useEffect(() => {
    if (!id) return;
    setListing(null);
    setError(null);
    setRelated(null);
    contactChecked.current = false;
    let cancelled = false;
    api
      .get<ListingDto>(`/listings/${id}`)
      .then(({ data }) => {
        if (cancelled) return;
        setListing(data);
        const primaryPhoto = data.media?.find((m) => m.type === 'PHOTO' && m.isPrimary);
        setActiveMediaId((primaryPhoto ?? data.media?.[0])?.id ?? null);
      })
      .catch((err) => {
        if (!cancelled) setError(apiErrorMessage(err, t('public.listingDetail.notFoundError')));
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  // Similar machines — same category, excluding this listing
  useEffect(() => {
    if (!listing) return;
    let cancelled = false;
    api
      .get<PaginatedResult<ListingDto>>('/listings', { params: { category: listing.machineCategory, pageSize: 5 } })
      .then(({ data }) => {
        if (cancelled) return;
        setRelated(data.items.filter((item) => item.id !== listing.id).slice(0, 4));
      })
      .catch(() => { if (!cancelled) setRelated([]); });
    return () => {
      cancelled = true;
    };
  }, [listing]);

  // Check if this buyer has already revealed this listing's contact (also works for sellers in buyer mode)
  const isBuyerMode = user?.activeMode === 'BUYER' || user?.role === UserRole.BUYER;
  useEffect(() => {
    if (!id || !user || !isBuyerMode || contactChecked.current) return;
    contactChecked.current = true;
    api
      .get<ContactViewStatusDto>(`/buyer-subscriptions/reveal-status/${id}`)
      .then(({ data }) => setContactStatus(data))
      .catch(() => {});
  }, [id, user, isBuyerMode]);

  const sendEnquiry = async () => {
    if (!listing) return;
    if (!user) {
      navigate('/login', { state: { from: { pathname: `/listings/${listing.id}` } } });
      return;
    }
    const inBuyerMode = user.activeMode === 'BUYER' || user.role === UserRole.BUYER;
    if (!inBuyerMode) {
      setEnquiryNotice(t('public.listingDetail.onlyBuyerCanEnquire'));
      return;
    }
    setEnquiring(true);
    setEnquiryNotice(null);
    try {
      await api.post('/enquiries', { listingId: listing.id });
      setEnquirySent(true);
    } catch (err) {
      setEnquiryNotice(apiErrorMessage(err, t('public.listingDetail.enquiryError')));
    } finally {
      setEnquiring(false);
    }
  };

  const revealContact = async () => {
    if (!listing || !user) return;
    const inBuyerMode = user.activeMode === 'BUYER' || user.role === UserRole.BUYER;
    if (!inBuyerMode) {
      navigate('/login', { state: { from: { pathname: `/listings/${listing.id}` } } });
      return;
    }
    setContactLoading(true);
    setContactError(null);
    try {
      const { data } = await api.post<ContactViewStatusDto>(`/buyer-subscriptions/reveal/${listing.id}`);
      setContactStatus(data);
      if (shouldShowQuotaAlert(data.quotaUsed, data.quotaTotal)) {
        setShowQuotaModal(true);
      }
    } catch (err) {
      const code = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      if (code === 'QUOTA_EXHAUSTED') {
        setContactError(t('public.listingDetail.quotaExhausted'));
      } else {
        setContactError(apiErrorMessage(err, t('public.listingDetail.revealContactError')));
      }
    } finally {
      setContactLoading(false);
    }
  };

  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-16 text-center">
        <ErrorBanner message={error} />
        <Link to="/listings" className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-forest">
          <ArrowLeftIcon className="h-4 w-4" />
          {t('public.listingDetail.backToListings')}
        </Link>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="mx-auto max-w-7xl px-6 py-8 lg:px-[52px]">
        <Skeleton className="mb-6 h-4 w-24" />
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1.4fr_1fr]">
          <div>
            <Skeleton className="aspect-video w-full rounded-[14px]" />
            <div className="mt-3 flex gap-2">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-20 rounded-lg" />)}
            </div>
          </div>
          <div className="space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-5 w-1/2" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
      </div>
    );
  }

  const photos = listing.media?.filter((m) => m.type === 'PHOTO') ?? [];
  const video = listing.media?.find((m) => m.type === 'VIDEO');
  const activeMedia = listing.media?.find((m) => m.id === activeMediaId) ?? listing.media?.[0];
  const isCertified = listing.status === ListingStatus.ACTIVE;
  const shortId = `BIM-${listing.id.slice(0, 8).toUpperCase()}`;

  return (
    <div className="bg-paper">
      <div className="mx-auto max-w-7xl px-6 py-8 lg:px-[52px]">
        <Link
          to="/listings"
          className="mb-6 inline-flex items-center gap-1.5 text-[13.5px] font-semibold text-muted transition hover:text-ink"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          {t('public.listingDetail.backToListings')}
        </Link>

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1.4fr_1fr]">
          <div>
            <div className="relative overflow-hidden rounded-[14px] border border-line bg-white grid-backdrop-fine">
              <div className="flex aspect-video items-center justify-center">
                {activeMedia ? (
                  activeMedia.type === 'VIDEO' ? (
                    <video src={activeMedia.url} controls className="h-full w-full bg-black object-contain" />
                  ) : (
                    <img
                      src={activeMedia.url}
                      alt={listing.title}
                      className="h-full w-full object-cover"
                      onError={(e) => { (e.currentTarget as HTMLImageElement).src = ''; (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                    />
                  )
                ) : (
                  <PhotoIcon className="h-12 w-12 text-forest/25" />
                )}
              </div>
              <div className="absolute inset-x-3.5 top-3.5 z-[2] flex items-start justify-between">
                <Tag tone={isCertified ? 'cert' : 'uncert'}>{isCertified ? t('public.listingDetail.certified') : t('public.listingDetail.unverified')}</Tag>
                {video && (
                  <Tag tone="dark">
                    <PlayIcon className="h-[9px] w-[9px] fill-current stroke-none" />
                    {t('public.listingDetail.video')}
                  </Tag>
                )}
              </div>
              <div className="absolute bottom-3.5 left-3.5 z-[2] rounded border border-line bg-white px-2 py-0.5 font-mono text-[10px] font-semibold tracking-[0.04em] text-muted">
                {shortId}
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
                    {t('public.listingDetail.runningVideo')} {video.durationSeconds ? `(${video.durationSeconds}s)` : ''}
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
                    <img
                      src={photo.url}
                      alt={`${listing.title} photo ${idx + 1}`}
                      className="h-full w-full object-cover"
                      onError={(e) => { (e.currentTarget as HTMLImageElement).style.opacity = '0'; }}
                    />
                  </button>
                ))}
              </div>
            )}

            <div className="mt-10">
              <MonoLabel className="text-copper">— {t('public.listingDetail.aboutThisMachine')}</MonoLabel>
              <p className="mt-3 whitespace-pre-line text-[14.5px] leading-[1.75] text-slate">{listing.description}</p>
            </div>

            <div className="mt-10">
              <MonoLabel className="text-copper">— {t('public.listingDetail.specifications')}</MonoLabel>
              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {(
                  [
                    [t('public.listingDetail.specs.category'), listing.machineCategory],
                    ...(listing.machineSubcategory ? [[t('public.listingDetail.specs.subcategory'), listing.machineSubcategory]] : []),
                    [t('public.listingDetail.specs.make'), listing.machineMake],
                    [t('public.listingDetail.specs.model'), listing.machineModel],
                    [t('public.listingDetail.specs.year'), listing.manufactureYear != null ? String(listing.manufactureYear) : t('public.listingDetail.specs.notAvailable')],
                    [
                      t('public.listingDetail.specs.origin'),
                      listing.origin === 'IMPORTED'
                        ? `${t('public.listingDetail.specs.imported')}${listing.importedCountry ? ` (${listing.importedCountry})` : ''}`
                        : t('public.listingDetail.specs.indian'),
                    ],
                    [
                      t('public.listingDetail.specs.runningHours'),
                      listing.runningHours != null ? listing.runningHours.toLocaleString('en-IN') : t('public.listingDetail.specs.notAvailable'),
                    ],
                    ...(listing.conditionGrade ? [[t('public.listingDetail.specs.condition'), listing.conditionGrade]] : []),
                    [t('public.listingDetail.specs.location'), `${listing.locationCity}, ${listing.locationState}`],
                    [t('public.listingDetail.specs.complexityTier'), listing.complexityTier],
                  ] as [string, string][]
                ).map(([label, value]) => (
                    <div key={label} className="rounded-xl border border-dashed border-line-2 bg-white p-4">
                      <MonoLabel>{label}</MonoLabel>
                      <p className="mt-1 font-mono text-[13.5px] font-bold text-ink">{value}</p>
                    </div>
                  ))}
              </div>
            </div>

            {listing.catalogCategory?.specFields && listing.catalogCategory.specFields.length > 0 && (
              <div className="mt-10">
                <MonoLabel className="text-copper">— {t('public.listingDetail.categorySpecifications', { category: listing.catalogCategory.name })}</MonoLabel>
                <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {listing.catalogCategory.specFields.map((field) => {
                    const { label, value } = formatSpecField(field, listing.specs?.[field.fieldKey]);
                    return (
                      <div key={field.id} className="rounded-xl border border-dashed border-line-2 bg-white p-4">
                        <MonoLabel>{label}</MonoLabel>
                        <p className="mt-1 font-mono text-[13.5px] font-bold text-ink">{value}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-[14px] border border-line bg-white p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Tag tone={isCertified ? 'cert' : 'uncert'}>{isCertified ? t('public.listingDetail.certified') : t('public.listingDetail.unverified')}</Tag>
                  <Tag tone={listing.condition === 'NEW' ? 'dark' : 'neutral'}>
                    {listing.condition === 'NEW' ? t('common:listing.conditionNew') : t('common:listing.conditionOld')}
                  </Tag>
                </div>
                <span className="font-mono text-[10.5px] font-semibold tracking-[0.04em] text-muted">{shortId}</span>
              </div>
              <h1 className="mt-3.5 font-display text-2xl font-medium leading-[1.2] tracking-[-0.4px] text-ink">
                {listing.title}
              </h1>
              <p className="mt-1.5 flex items-center gap-1.5 text-[12.5px] font-medium text-muted">
                <MapPinIcon className="h-3.5 w-3.5" />
                {listing.locationCity}, {listing.locationState}
              </p>
              <p className="mt-1 font-mono text-[11px] font-medium text-muted">
                {t('common:listing.posted', { date: formatDate(listing.postedAt ?? listing.createdAt) })}
                {' · '}
                {t('common:listing.views', { count: listing.viewCount })}
              </p>

              <div className="mt-5 border-t border-line pt-5">
                <MonoLabel>{t('public.listingDetail.askingPrice')}</MonoLabel>
                <p className="mt-1 font-display text-[34px] font-medium leading-none tracking-[-0.5px] text-ink">
                  {formatInr(listing.askingPrice)}
                </p>
              </div>

              {enquirySent ? (
                <div className="mt-6 flex items-start gap-2.5 rounded-xl border border-forest-bdr bg-forest-bg p-4 text-[13px] leading-[1.6] text-slate">
                  <CheckCircleIcon className="mt-0.5 h-4 w-4 shrink-0 text-forest" />
                  <p>
                    {t('public.listingDetail.enquirySentMessage')}
                  </p>
                </div>
              ) : (
                <Button onClick={sendEnquiry} disabled={enquiring} className="mt-6 w-full">
                  <ChatIcon className="h-4 w-4" />
                  {enquiring ? t('public.listingDetail.sending') : t('public.listingDetail.showInterest')}
                </Button>
              )}

              {user?.role === UserRole.BUYER && (
                <>
                  <Button onClick={toggleSave} variant="ghost" className="mt-3 w-full">
                    {saved ? <CheckCircleIcon className="h-4 w-4 text-forest" /> : <PlusIcon className="h-4 w-4" />}
                    {saved ? t('public.listingDetail.savedToList') : t('public.listingDetail.saveThisListing')}
                  </Button>
                  <Link to={`/buyer/loans/new?listingId=${listing.id}`}>
                    <Button variant="ghost" className="mt-3 w-full">
                      <RupeeIcon className="h-4 w-4" />
                      {t('public.listingDetail.applyForFinancing')}
                    </Button>
                  </Link>
                </>
              )}

              {enquiryNotice && <p className="mt-3 text-[13px] text-muted">{enquiryNotice}</p>}

              <div className="mt-5 flex items-start gap-2.5 rounded-xl border border-forest-bdr bg-forest-bg p-4 text-[13px] leading-[1.6] text-slate">
                <ShieldCheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-forest" />
                <p>
                  {t('public.listingDetail.showInterestNotice')}
                </p>
              </div>
            </div>

            {/* Contact Reveal Panel */}
            <div className="rounded-[14px] border border-line bg-white p-6">
              <MonoLabel className="text-copper">— {t('public.listingDetail.sellerContact')}</MonoLabel>

              {contactStatus?.contact ? (
                <div className="mt-4 space-y-2">
                  <div className="flex items-start gap-2.5 rounded-xl border border-forest-bdr bg-forest-bg p-4">
                    <CheckCircleIcon className="mt-0.5 h-4 w-4 shrink-0 text-forest" />
                    <div>
                      <p className="font-semibold text-ink">{contactStatus.contact.fullName}</p>
                      <p className="mt-0.5 text-[13px] text-slate">📞 {contactStatus.contact.phone}</p>
                      <p className="text-[13px] text-slate">📍 {contactStatus.contact.address}</p>
                      {contactStatus.contact.email && (
                        <p className="text-[13px] text-slate">✉️ {contactStatus.contact.email}</p>
                      )}
                    </div>
                  </div>
                  <p className="text-[11.5px] text-muted">
                    {t('public.listingDetail.quotaRemaining', { remaining: contactStatus.quotaRemaining, total: contactStatus.quotaTotal })}
                  </p>
                </div>
              ) : isBuyerMode ? (
                <div className="mt-4">
                  <p className="text-[13px] leading-[1.6] text-muted">
                    {t('public.listingDetail.revealBody')}
                    {contactStatus && (
                      <>
                        {' '}{t('public.listingDetail.revealBodyQuota', { remaining: contactStatus.quotaRemaining, total: contactStatus.quotaTotal })}
                      </>
                    )}
                  </p>
                  {contactError && (
                    <div className="mt-3">
                      <ErrorBanner message={contactError} />
                    </div>
                  )}
                  <Button
                    className="mt-4 w-full"
                    onClick={revealContact}
                    disabled={contactLoading}
                  >
                    <RupeeIcon className="h-4 w-4" />
                    {contactLoading ? t('public.listingDetail.revealing') : t('public.listingDetail.viewContact')}
                  </Button>
                </div>
              ) : !user ? (
                <div className="mt-4">
                  <div className="rounded-xl border border-dashed border-line-2 bg-paper p-4 text-center">
                    <p className="text-[13px] text-muted">
                      <button
                        type="button"
                        className="font-semibold text-forest hover:underline"
                        onClick={() => navigate('/login', { state: { from: { pathname: `/listings/${listing.id}` } } })}
                      >
                        {t('public.listingDetail.signIn')}
                      </button>{' '}
                      {t('public.listingDetail.toViewSellerContactQuota')}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="mt-4">
                  <div className="rounded-xl border border-dashed border-line-2 bg-paper p-4 text-center">
                    <p className="text-[13px] text-muted">
                      {t('public.listingDetail.sellerModeNotice')}{' '}
                      <button
                        type="button"
                        className="font-semibold text-forest hover:underline disabled:opacity-60"
                        disabled={modeSwitching}
                        onClick={async () => {
                          setModeSwitching(true);
                          try {
                            await switchMode('BUYER');
                          } finally {
                            setModeSwitching(false);
                          }
                        }}
                      >
                        {modeSwitching ? t('public.listingDetail.switching') : t('public.listingDetail.switchToBuyerMode')}
                      </button>{' '}
                      {t('public.listingDetail.toViewSellerContact')}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </aside>
        </div>

        {related === null ? (
          <div className="mt-14">
            <MonoLabel className="text-copper">— {t('public.listingDetail.similarMachines')}</MonoLabel>
            <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-2 sm:gap-5 xl:grid-cols-4">
              <ListingGridSkeleton count={4} />
            </div>
          </div>
        ) : related.length > 0 ? (
          <div className="mt-14">
            <MonoLabel className="text-copper">— {t('public.listingDetail.similarMachines')}</MonoLabel>
            <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-2 sm:gap-5 xl:grid-cols-4">
              {related.map((item) => (
                <ListingCard key={item.id} listing={item} />
              ))}
            </div>
          </div>
        ) : null}
      </div>

      {contactStatus && (
        <QuotaAlertModal
          open={showQuotaModal}
          quotaUsed={contactStatus.quotaUsed}
          quotaTotal={contactStatus.quotaTotal}
          onClose={() => setShowQuotaModal(false)}
        />
      )}
    </div>
  );
}
