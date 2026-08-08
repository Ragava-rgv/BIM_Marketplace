import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { ContactViewStatusDto, ListingDto } from '@machinebazaar/shared';
import { QUOTA_ALERT_AFTER_USED, QUOTA_ALERT_REMAINING_THRESHOLD, UserRole } from '@machinebazaar/shared';
import { api, apiErrorMessage } from '../lib/api';
import { useAuth } from '../lib/auth-context';
import { useWishlist } from '../lib/wishlist-context';
import { formatDate, formatInr, formatSpecField } from '../lib/format';
import { ArrowLeftIcon, ChevronRightIcon, HeartIcon, ShareIcon, MachineIcon, PlayIcon, ShieldIcon, RupeeIcon, StarIcon } from '../components/icons';
import { QuotaAlertSheet } from '../components/QuotaAlertSheet';

function shouldShowQuotaAlert(quotaUsed: number, quotaTotal: number): boolean {
  const quotaRemaining = quotaTotal - quotaUsed;
  return quotaUsed >= QUOTA_ALERT_AFTER_USED || quotaRemaining < QUOTA_ALERT_REMAINING_THRESHOLD;
}

export function ListingDetail() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, switchMode } = useAuth();
  const { isWishlisted, toggle: toggleWishlist } = useWishlist();

  const [listing, setListing] = useState<ListingDto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [enquiring, setEnquiring] = useState(false);
  const [enquirySent, setEnquirySent] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const [contactStatus, setContactStatus] = useState<ContactViewStatusDto | null>(null);
  const [contactLoading, setContactLoading] = useState(false);
  const [contactError, setContactError] = useState<string | null>(null);
  const [showQuotaModal, setShowQuotaModal] = useState(false);
  const [modeSwitching, setModeSwitching] = useState(false);
  const contactChecked = useRef(false);

  const isBuyerMode = user?.activeMode === 'BUYER' || user?.role === UserRole.BUYER;

  useEffect(() => {
    if (!id) return;
    api.get<ListingDto>(`/listings/${id}`)
      .then(({ data }) => {
        setListing(data);
        const photos = data.media?.filter((m) => m.type === 'PHOTO') ?? [];
        const primaryIdx = photos.findIndex((p) => p.isPrimary);
        setActiveIndex(primaryIdx >= 0 ? primaryIdx : 0);
      })
      .catch((err) => setError(apiErrorMessage(err, t('listingDetail.notFound'))));
  }, [id]);

  useEffect(() => {
    if (!id || !user || !isBuyerMode || contactChecked.current) return;
    contactChecked.current = true;
    api.get<ContactViewStatusDto>(`/buyer-subscriptions/reveal-status/${id}`)
      .then(({ data }) => setContactStatus(data))
      .catch(() => {});
  }, [id, user, isBuyerMode]);

  const sendEnquiry = async () => {
    if (!listing) return;
    if (!user) { navigate('/login'); return; }
    if (!isBuyerMode) return;
    setEnquiring(true);
    try {
      await api.post('/enquiries', { listingId: listing.id });
      setEnquirySent(true);
    } catch {}
    finally { setEnquiring(false); }
  };

  const revealContact = async () => {
    if (!listing || !user) {
      navigate('/login');
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
        setContactError(t('listingDetail.contact.quotaExhausted'));
      } else {
        setContactError(apiErrorMessage(err, t('listingDetail.contact.revealError')));
      }
    } finally {
      setContactLoading(false);
    }
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 px-6">
        <p className="text-gray-500 text-[14px]">{error}</p>
        <button onClick={() => navigate(-1)} className="text-forest font-semibold text-[13px]">{t('listingDetail.goBack')}</button>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="min-h-screen bg-white">
        <div className="mx-4 mt-16 h-[200px] rounded-[16px] bg-gray-200 animate-pulse" />
        <div className="p-4 space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-4 bg-gray-200 rounded animate-pulse" />)}
        </div>
      </div>
    );
  }

  const photos = listing.media?.filter((m) => m.type === 'PHOTO') ?? [];
  const video = listing.media?.find((m) => m.type === 'VIDEO');
  const galleryItems = [...photos, ...(video ? [video] : [])];
  const activeItem = galleryItems[Math.min(activeIndex, galleryItems.length - 1)] ?? null;
  const goToVideo = () => {
    const idx = galleryItems.findIndex((m) => m.type === 'VIDEO');
    if (idx >= 0) setActiveIndex(idx);
  };
  const goPrev = () => setActiveIndex((i) => (i - 1 + galleryItems.length) % galleryItems.length);
  const goNext = () => setActiveIndex((i) => (i + 1) % galleryItems.length);
  const isCertified = listing.status === 'ACTIVE';
  const isSold = listing.status === 'SOLD';
  const shortId = `MB-${listing.id.slice(0, 8).toUpperCase()}`;

  return (
    <div className="min-h-screen bg-white pb-[80px]">
      {/* Header row — back button + wishlist/share, normal in-flow (not overlaid on the image) */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <button onClick={() => navigate(-1)}
          className="w-[34px] h-[34px] bg-white border border-gray-200 rounded-full flex items-center justify-center">
          <ArrowLeftIcon className="w-[14px] h-[14px] text-ink" />
        </button>
        <div className="flex gap-1.5">
          {user && (
            <button
              type="button"
              aria-label={isWishlisted(listing.id) ? t('listingDetail.removeFromWishlist') : t('listingDetail.saveToWishlist')}
              onClick={() => void toggleWishlist(listing.id)}
              className="w-[34px] h-[34px] bg-white border border-gray-200 rounded-full flex items-center justify-center"
            >
              <HeartIcon className={`w-[14px] h-[14px] ${isWishlisted(listing.id) ? 'fill-copper stroke-copper' : 'text-ink'}`} />
            </button>
          )}
          <button className="w-[34px] h-[34px] bg-white border border-gray-200 rounded-full flex items-center justify-center">
            <ShareIcon className="w-[14px] h-[14px] text-ink" />
          </button>
        </div>
      </div>

      {/* Contained media gallery — fixed-height frame with margins/rounded corners, not edge-to-edge.
          Tap the arrows or the video badge to cycle through all photos + the video. */}
      <div className="mx-4 h-[200px] rounded-[16px] border border-gray-200 bg-gray-50 relative flex items-center justify-center overflow-hidden"
        style={{ backgroundImage: 'linear-gradient(rgba(16,24,40,.04) 1px,transparent 1px),linear-gradient(90deg,rgba(16,24,40,.04) 1px,transparent 1px)', backgroundSize: '18px 18px' }}>
        {activeItem ? (
          activeItem.type === 'VIDEO' ? (
            <video
              key={activeItem.id}
              src={activeItem.url}
              controls
              playsInline
              className="absolute inset-0 w-full h-full object-contain bg-black"
            />
          ) : (
            <img src={activeItem.url} alt={listing.title} className="absolute inset-0 w-full h-full object-cover" />
          )
        ) : (
          <MachineIcon className="w-[100px] h-[100px] text-forest opacity-25 relative z-[1]" />
        )}

        {galleryItems.length > 1 && (
          <>
            <button
              type="button"
              onClick={goPrev}
              aria-label={t('listingDetail.previousMedia')}
              className="absolute left-1.5 top-1/2 -translate-y-1/2 z-[3] w-8 h-8 rounded-full bg-black/40 flex items-center justify-center"
            >
              <ChevronRightIcon className="w-4 h-4 text-white rotate-180" />
            </button>
            <button
              type="button"
              onClick={goNext}
              aria-label={t('listingDetail.nextMedia')}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 z-[3] w-8 h-8 rounded-full bg-black/40 flex items-center justify-center"
            >
              <ChevronRightIcon className="w-4 h-4 text-white" />
            </button>
          </>
        )}

        {video && activeItem?.type !== 'VIDEO' && (
          <button
            type="button"
            onClick={goToVideo}
            className="absolute bottom-[14px] left-[12px] bg-forest text-white font-mono text-[9.5px] font-semibold px-[9px] py-[3px] rounded-full flex items-center gap-1 z-[2]"
          >
            <PlayIcon className="w-1.5 h-1.5 fill-[#6CE9A6]" />
            {t('listingDetail.videoBadge')} {video.durationSeconds ? `${video.durationSeconds}s` : ''}
          </button>
        )}
        {galleryItems.length > 0 && (
          <div className="absolute bottom-[14px] right-[12px] bg-ink text-white font-mono text-[9.5px] font-semibold px-[9px] py-[3px] rounded-full z-[2]">
            <span className="text-[#6CE9A6]">{activeIndex + 1}</span> / {galleryItems.length}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="bg-white px-4 pt-4 pb-4">
        {/* Badges */}
        <div className="flex gap-1.5 mb-2.5 flex-wrap">
          {isSold ? (
            <span className="inline-flex items-center gap-1 text-[9.5px] font-bold px-[9px] py-[3px] rounded-[6px] bg-gray-200 text-gray-600">
              {t('listingDetail.badge.sold')}
            </span>
          ) : (
            <span className={`inline-flex items-center gap-1 text-[9.5px] font-bold px-[9px] py-[3px] rounded-[6px] ${isCertified ? 'bg-green-bg text-green-txt border border-green-bdr' : 'bg-copper-bg text-copper border border-copper-bdr'}`}>
              {isCertified && <span className="w-1.5 h-1.5 rounded-full bg-green-txt" />}
              {isCertified ? t('listingDetail.badge.certified') : t('listingDetail.badge.unverified')}
            </span>
          )}
          <span className="inline-flex items-center gap-1 text-[9.5px] font-bold px-[9px] py-[3px] rounded-[6px] bg-gray-100 text-gray-700 border border-gray-200">
            {shortId}
          </span>
          {listing.isBoosted && (
            <span className="inline-flex items-center gap-1 text-[9.5px] font-bold px-[9px] py-[3px] rounded-[6px] bg-forest text-white">
              <StarIcon className="w-2.5 h-2.5 fill-white stroke-white" />
              {t('listingDetail.badge.boosted')}
            </span>
          )}
          {listing.condition === 'NEW' ? (
            <span className="inline-flex items-center text-[9.5px] font-bold px-[9px] py-[3px] rounded-[6px] bg-ink text-white">
              {t('common:listing.conditionNew')}
            </span>
          ) : (
            <span className="inline-flex items-center text-[9.5px] font-bold px-[9px] py-[3px] rounded-[6px] bg-gray-100 text-gray-700 border border-gray-200">
              {t('common:listing.conditionOld')}
            </span>
          )}
        </div>

        {/* Title */}
        <h1 className="text-[21px] font-extrabold text-ink tracking-[-0.5px] leading-[1.15] mb-1">
          {listing.title}
        </h1>

        {/* Posted date + view count */}
        <p className="font-mono text-[10.5px] font-medium text-gray-400 mb-[6px]">
          {t('common:listing.posted', { date: formatDate(listing.postedAt ?? listing.createdAt) })}
          {' · '}
          {t('common:listing.views', { count: listing.viewCount })}
        </p>

        {/* Seller row */}
        <div className="flex items-center gap-1.5 text-[12px] text-gray-500 font-medium mb-[14px]">
          <span className="w-3 h-3 rounded-full bg-forest-bg inline-flex items-center justify-center flex-shrink-0">
            <svg width="7" height="7" viewBox="0 0 8 8" fill="none">
              <polyline points="1.5 4 3.5 6 6.5 2" stroke="#101828" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          {listing.machineMake} · {listing.machineModel} · {t('listingDetail.gstVerified')} · {listing.locationCity}
        </div>

        {/* Price card */}
        <div className="bg-gray-25 border border-gray-200 rounded-[12px] px-[15px] py-[13px] flex items-center justify-between mb-[14px]">
          <div>
            <p className="font-mono text-[9px] font-semibold text-gray-500 tracking-[0.08em] mb-0.5">{t('listingDetail.askingPrice')}</p>
            <p className="text-[26px] font-extrabold text-ink tracking-[-0.6px] leading-none">{formatInr(listing.askingPrice)}</p>
          </div>
          <span className="text-[10px] font-bold text-green-txt bg-green-bg border border-green-bdr px-[10px] py-1 rounded-full">
            {t('listingDetail.negotiable')}
          </span>
        </div>

        {/* About this machine — description + the FULL seller-filled spec, grouped in one
            place: the base fields every listing has, plus (if the seller picked one) the
            optional catalog-category spec-template fields. Not split into separate sections. */}
        <div className="mb-4">
          <p className="font-mono text-[9.5px] font-semibold text-forest-2 tracking-[0.1em] mb-2">{t('listingDetail.aboutHeading')}</p>
          {listing.description && (
            <p className="text-[13px] leading-[1.65] text-gray-600 mb-3">{listing.description}</p>
          )}
          <div className="grid grid-cols-2 gap-2">
            {([
              [t('listingDetail.specs.grade'), listing.complexityTier],
              [t('listingDetail.specs.category'), listing.machineCategory],
              ...(listing.machineSubcategory ? [[t('listingDetail.specs.subcategory'), listing.machineSubcategory] as [string, string]] : []),
              [t('listingDetail.specs.year'), listing.manufactureYear != null ? String(listing.manufactureYear) : t('common:common.label.notAvailable')],
              [
                t('listingDetail.specs.origin'),
                listing.origin === 'IMPORTED'
                  ? `${t('listingDetail.origin.imported')}${listing.importedCountry ? ` (${listing.importedCountry})` : ''}`
                  : t('listingDetail.origin.indian'),
              ],
              [
                t('listingDetail.specs.runningHours'),
                listing.runningHours != null ? listing.runningHours.toLocaleString('en-IN') : t('common:common.label.notAvailable'),
              ],
              [t('listingDetail.specs.location'), `${listing.locationCity}, ${listing.locationState}`],
            ] as [string, string][]).map(([k, v]) => (
              <div key={k} className="bg-gray-25 border border-gray-200 rounded-[10px] px-[11px] py-[9px]">
                <p className="font-mono text-[8.5px] font-semibold text-gray-500 tracking-[0.08em] mb-0.5">{k}</p>
                <p className="text-[12.5px] font-bold text-ink">{v}</p>
              </div>
            ))}
            {/* Optional catalog-category "spec template" fields — only present if the seller picked one */}
            {listing.catalogCategory?.specFields?.map((field) => {
              const { label, value } = formatSpecField(field, listing.specs?.[field.fieldKey]);
              return (
                <div key={field.id} className="bg-gray-25 border border-gray-200 rounded-[10px] px-[11px] py-[9px]">
                  <p className="font-mono text-[8.5px] font-semibold text-gray-500 tracking-[0.08em] mb-0.5 uppercase">{label}</p>
                  <p className="text-[12.5px] font-bold text-ink">{value}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Trust strip */}
        <div className="bg-forest rounded-[13px] px-[15px] py-[13px] mb-4">
          <p className="font-mono text-[9px] text-[#9BD8B8] font-semibold tracking-[0.1em] mb-1">{t('listingDetail.institutionalTrust')}</p>
          <p className="text-[13px] font-semibold text-white leading-[1.5]">
            {t('listingDetail.trustBody')}
          </p>
        </div>

        {/* Contact reveal section */}
        <div className="border border-gray-200 rounded-[13px] px-[15px] py-[13px]">
          <p className="font-mono text-[9px] font-semibold text-copper tracking-[0.1em] mb-3">{t('listingDetail.sellerContactHeading')}</p>
          {contactStatus?.contact ? (
            <div className="bg-green-bg border border-green-bdr rounded-[10px] px-[13px] py-[11px] space-y-1">
              <p className="text-[13px] font-bold text-ink">{contactStatus.contact.fullName}</p>
              <p className="text-[12px] text-gray-700">📞 {contactStatus.contact.phone}</p>
              <p className="text-[12px] text-gray-700">📍 {contactStatus.contact.address}</p>
              {contactStatus.contact.email && (
                <p className="text-[12px] text-gray-700">✉️ {contactStatus.contact.email}</p>
              )}
              <p className="text-[11px] text-gray-500 pt-1">
                {t('listingDetail.contact.viewsRemaining', { quotaRemaining: contactStatus.quotaRemaining, quotaTotal: contactStatus.quotaTotal })}
              </p>
            </div>
          ) : isBuyerMode ? (
            <>
              <p className="text-[12.5px] text-gray-500 leading-[1.6] mb-3">
                {t('listingDetail.contact.revealPrompt')}
                {contactStatus && (
                  <> {t('listingDetail.contact.remainingPrefix')} <span className="font-bold text-ink">{contactStatus.quotaRemaining}</span> {t('listingDetail.contact.remainingSuffix', { quotaTotal: contactStatus.quotaTotal })}</>
                )}
              </p>
              {contactError && (
                <p className="text-[12px] text-rose-600 mb-2">{contactError}</p>
              )}
              <button onClick={revealContact} disabled={contactLoading}
                className="w-full h-[42px] rounded-[10px] bg-copper-bg text-copper border border-copper-bdr flex items-center justify-center gap-1.5 text-[13px] font-bold disabled:opacity-60">
                <RupeeIcon className="w-[13px] h-[13px] stroke-copper" />
                {contactLoading ? t('listingDetail.contact.revealing') : t('listingDetail.contact.viewContact')}
              </button>
            </>
          ) : !user ? (
            <p className="text-[12.5px] text-gray-500 text-center">
              <button type="button" className="font-semibold text-forest" onClick={() => navigate('/login')}>
                {t('common:nav.login')}
              </button>{' '}
              {t('listingDetail.contact.signInSuffix')}
            </p>
          ) : (
            <p className="text-[12.5px] text-gray-500 text-center">
              {t('listingDetail.contact.sellerModeNotice')}{' '}
              <button
                type="button"
                className="font-semibold text-forest disabled:opacity-60"
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
                {modeSwitching ? t('listingDetail.contact.switching') : t('listingDetail.contact.switchToBuyer')}
              </button>{' '}
              {t('listingDetail.contact.sellerModeSuffix')}
            </p>
          )}
        </div>
      </div>

      {/* Sticky bottom actions */}
      <div className="fixed bottom-0 left-0 right-0 z-20 bg-white border-t border-gray-200 flex gap-2 px-[14px] py-3"
        style={{ paddingBottom: `calc(env(safe-area-inset-bottom) + 12px)` }}>
        {isBuyerMode && (
          <button onClick={() => navigate(`/buyer/loans/new?listingId=${listing.id}`)}
            className="flex-1 h-[46px] rounded-[10px] bg-copper-bg text-copper border border-copper-bdr flex items-center justify-center gap-1.5 text-[13px] font-bold">
            <RupeeIcon className="w-[13px] h-[13px] stroke-copper" />
            {t('listingDetail.applyLoan')}
          </button>
        )}
        {isSold ? (
          <div className="flex-1 h-[46px] rounded-[10px] bg-gray-100 border border-gray-200 flex items-center justify-center gap-1.5 text-[13px] font-bold text-gray-500">
            {t('listingDetail.machineSold')}
          </div>
        ) : enquirySent ? (
          <div className="flex-1 h-[46px] rounded-[10px] bg-green-bg border border-green-bdr flex items-center justify-center gap-1.5 text-[13px] font-bold text-green-txt">
            <ShieldIcon className="w-[13px] h-[13px] stroke-green-txt" />
            {t('listingDetail.interestSent')}
          </div>
        ) : (
          <button onClick={sendEnquiry} disabled={enquiring}
            className="flex-1 h-[46px] rounded-[10px] bg-forest text-white flex items-center justify-center gap-1.5 text-[13px] font-bold">
            {enquiring ? t('listingDetail.sending') : t('listingDetail.enquire')}
          </button>
        )}
      </div>

      {contactStatus && (
        <QuotaAlertSheet
          open={showQuotaModal}
          quotaUsed={contactStatus.quotaUsed}
          quotaTotal={contactStatus.quotaTotal}
          onClose={() => setShowQuotaModal(false)}
        />
      )}
    </div>
  );
}



