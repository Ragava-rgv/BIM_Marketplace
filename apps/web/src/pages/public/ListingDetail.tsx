import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import type { ContactRevealStatusDto, ListingDto, RazorpayOrderDto } from '@machinebazaar/shared';
import { ListingStatus, UserRole } from '@machinebazaar/shared';
import { api, apiErrorMessage } from '../../lib/api';
import { useAuth } from '../../lib/auth-context';
import { formatInr } from '../../lib/format';
import { isListingSaved, toggleSavedListing } from '../../lib/saved-listings';
import { Button, ErrorBanner, MonoLabel, Tag } from '../../components/ui';
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

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Razorpay: any;
  }
}

function loadRazorpayScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window.Razorpay !== 'undefined') { resolve(); return; }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Razorpay SDK'));
    document.body.appendChild(script);
  });
}

export function ListingDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [listing, setListing] = useState<ListingDto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeMediaId, setActiveMediaId] = useState<string | null>(null);
  const [enquiring, setEnquiring] = useState(false);
  const [enquiryNotice, setEnquiryNotice] = useState<string | null>(null);
  const [enquirySent, setEnquirySent] = useState(false);
  const [saved, setSaved] = useState(false);

  // Contact reveal state
  const [contactStatus, setContactStatus] = useState<ContactRevealStatusDto | null>(null);
  const [contactLoading, setContactLoading] = useState(false);
  const [contactError, setContactError] = useState<string | null>(null);
  const [contactPrice, setContactPrice] = useState<number>(500);
  const contactChecked = useRef(false);

  useEffect(() => {
    if (user?.role === UserRole.BUYER && id) {
      setSaved(isListingSaved(user.id, id));
    }
  }, [user, id]);

  const toggleSave = () => {
    if (!user || !id) return;
    setSaved(toggleSavedListing(user.id, id).includes(id));
  };

  useEffect(() => {
    if (!id) return;
    setListing(null);
    setError(null);
    contactChecked.current = false;
    let cancelled = false;
    api
      .get<ListingDto>(`/listings/${id}`)
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

  // Fetch current contact reveal price (admin-configurable)
  useEffect(() => {
    api.get<{ price: number }>('/settings/contact-reveal-price')
      .then(({ data }) => setContactPrice(data.price))
      .catch(() => {});
  }, []);

  // Check if buyer has already paid to reveal contact (also works for sellers in buyer mode)
  const isBuyerMode = user?.activeMode === 'BUYER' || user?.role === UserRole.BUYER;
  useEffect(() => {
    if (!id || !user || !isBuyerMode || contactChecked.current) return;
    contactChecked.current = true;
    api
      .get<ContactRevealStatusDto>(`/contact-payments/check/${id}`)
      .then(({ data }) => setContactStatus(data))
      .catch(() => setContactStatus({ paid: false, contact: null }));
  }, [id, user, isBuyerMode]);

  const sendEnquiry = async () => {
    if (!listing) return;
    if (!user) {
      navigate('/login', { state: { from: { pathname: `/listings/${listing.id}` } } });
      return;
    }
    const inBuyerMode = user.activeMode === 'BUYER' || user.role === UserRole.BUYER;
    if (!inBuyerMode) {
      setEnquiryNotice('Only buyer accounts can enquire about a listing.');
      return;
    }
    setEnquiring(true);
    setEnquiryNotice(null);
    try {
      await api.post('/enquiries', { listingId: listing.id });
      setEnquirySent(true);
    } catch (err) {
      setEnquiryNotice(apiErrorMessage(err, 'Could not send your enquiry. Please try again.'));
    } finally {
      setEnquiring(false);
    }
  };

  const revealContact = useCallback(async () => {
    if (!listing || !user) return;
    const inBuyerMode = user.activeMode === 'BUYER' || user.role === UserRole.BUYER;
    if (!inBuyerMode) {
      navigate('/login', { state: { from: { pathname: `/listings/${listing.id}` } } });
      return;
    }
    setContactLoading(true);
    setContactError(null);
    try {
      await loadRazorpayScript();
      const { data: orderData } = await api.post<RazorpayOrderDto>('/contact-payments/order', {
        listingId: listing.id,
      });
      await new Promise<void>((resolve, reject) => {
        const rzp = new window.Razorpay({
          key: orderData.keyId,
          amount: orderData.amount,
          currency: orderData.currency,
          name: 'BIM',
          description: `Seller contact for: ${listing.title}`,
          order_id: orderData.razorpayOrderId,
          handler: async (resp: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) => {
            try {
              const { data } = await api.post<ContactRevealStatusDto>('/contact-payments/verify', {
                listingId: listing.id,
                razorpayOrderId: resp.razorpay_order_id,
                razorpayPaymentId: resp.razorpay_payment_id,
                razorpaySignature: resp.razorpay_signature,
              });
              setContactStatus(data);
              resolve();
            } catch (e) {
              reject(e);
            }
          },
          modal: { ondismiss: () => reject(new Error('Payment cancelled')) },
          theme: { color: '#1a56db' },
        });
        rzp.open();
      });
    } catch (err) {
      if ((err as Error).message !== 'Payment cancelled') {
        setContactError(apiErrorMessage(err, 'Could not process payment. Please try again.'));
      }
    } finally {
      setContactLoading(false);
    }
  }, [listing, user, navigate]);

  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-16 text-center">
        <ErrorBanner message={error} />
        <Link to="/listings" className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-forest">
          <ArrowLeftIcon className="h-4 w-4" />
          Back to listings
        </Link>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="mx-auto max-w-7xl px-6 py-8 lg:px-[52px]">
        <div className="mb-6 h-4 w-24 animate-pulse rounded bg-paper-2" />
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1.4fr_1fr]">
          <div>
            <div className="aspect-video w-full animate-pulse rounded-[14px] bg-paper-2" />
            <div className="mt-3 flex gap-2">
              {[1, 2, 3].map((i) => <div key={i} className="h-16 w-20 animate-pulse rounded-lg bg-paper-2" />)}
            </div>
          </div>
          <div className="space-y-4">
            <div className="h-8 w-3/4 animate-pulse rounded bg-paper-2" />
            <div className="h-5 w-1/2 animate-pulse rounded bg-paper-2" />
            <div className="h-10 w-full animate-pulse rounded bg-paper-2" />
            <div className="h-32 w-full animate-pulse rounded bg-paper-2" />
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
          Back to listings
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
                <Tag tone={isCertified ? 'cert' : 'uncert'}>{isCertified ? 'Certified' : 'Unverified'}</Tag>
                {video && (
                  <Tag tone="dark">
                    <PlayIcon className="h-[9px] w-[9px] fill-current stroke-none" />
                    Video
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
              <MonoLabel className="text-copper">— About this machine</MonoLabel>
              <p className="mt-3 whitespace-pre-line text-[14.5px] leading-[1.75] text-slate">{listing.description}</p>
            </div>

            <div className="mt-10">
              <MonoLabel className="text-copper">— Specifications</MonoLabel>
              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {(
                  [
                    ['Category', listing.machineCategory],
                    ...(listing.machineSubcategory ? [['Subcategory', listing.machineSubcategory]] : []),
                    ['Make', listing.machineMake],
                    ['Model', listing.machineModel],
                    ['Manufacture year', String(listing.manufactureYear)],
                    ['Location', `${listing.locationCity}, ${listing.locationState}`],
                    ['Complexity tier', listing.complexityTier],
                  ] as [string, string][]
                ).map(([label, value]) => (
                    <div key={label} className="rounded-xl border border-dashed border-line-2 bg-white p-4">
                      <MonoLabel>{label}</MonoLabel>
                      <p className="mt-1 text-[13.5px] font-bold text-ink">{value}</p>
                    </div>
                  ))}
              </div>
            </div>
          </div>

          <aside className="space-y-5">
            <div className="rounded-[14px] border border-line bg-white p-6">
              <div className="flex items-center justify-between">
                <Tag tone={isCertified ? 'cert' : 'uncert'}>{isCertified ? 'Certified' : 'Unverified'}</Tag>
                <span className="font-mono text-[10.5px] font-semibold tracking-[0.04em] text-muted">{shortId}</span>
              </div>
              <h1 className="mt-3.5 font-display text-2xl font-medium leading-[1.2] tracking-[-0.4px] text-ink">
                {listing.title}
              </h1>
              <p className="mt-1.5 flex items-center gap-1.5 text-[12.5px] font-medium text-muted">
                <MapPinIcon className="h-3.5 w-3.5" />
                {listing.locationCity}, {listing.locationState}
              </p>

              <div className="mt-5 border-t border-line pt-5">
                <MonoLabel>Asking price</MonoLabel>
                <p className="mt-1 font-display text-[34px] font-medium leading-none tracking-[-0.5px] text-ink">
                  {formatInr(listing.askingPrice)}
                </p>
              </div>

              {enquirySent ? (
                <div className="mt-6 flex items-start gap-2.5 rounded-xl border border-forest-bdr bg-forest-bg p-4 text-[13px] leading-[1.6] text-slate">
                  <CheckCircleIcon className="mt-0.5 h-4 w-4 shrink-0 text-forest" />
                  <p>
                    Your interest has been sent — our team will be in touch, and the seller has been notified.
                  </p>
                </div>
              ) : (
                <Button onClick={sendEnquiry} disabled={enquiring} className="mt-6 w-full">
                  <ChatIcon className="h-4 w-4" />
                  {enquiring ? 'Sending...' : 'Show interest'}
                </Button>
              )}

              {user?.role === UserRole.BUYER && (
                <>
                  <Button onClick={toggleSave} variant="ghost" className="mt-3 w-full">
                    {saved ? <CheckCircleIcon className="h-4 w-4 text-forest" /> : <PlusIcon className="h-4 w-4" />}
                    {saved ? 'Saved to your list' : 'Save this listing'}
                  </Button>
                  <Link to={`/buyer/loans/new?listingId=${listing.id}`}>
                    <Button variant="ghost" className="mt-3 w-full">
                      <RupeeIcon className="h-4 w-4" />
                      Apply for financing
                    </Button>
                  </Link>
                </>
              )}

              {enquiryNotice && <p className="mt-3 text-[13px] text-muted">{enquiryNotice}</p>}

              <div className="mt-5 flex items-start gap-2.5 rounded-xl border border-forest-bdr bg-forest-bg p-4 text-[13px] leading-[1.6] text-slate">
                <ShieldCheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-forest" />
                <p>
                  Clicking &quot;Show interest&quot; sends your details to our team and a brief notice to the seller.
                </p>
              </div>
            </div>

            {/* Contact Reveal Panel */}
            <div className="rounded-[14px] border border-line bg-white p-6">
              <MonoLabel className="text-copper">— Seller contact</MonoLabel>

              {contactStatus?.paid && contactStatus.contact ? (
                <div className="mt-4 space-y-2">
                  <div className="flex items-start gap-2.5 rounded-xl border border-forest-bdr bg-forest-bg p-4">
                    <CheckCircleIcon className="mt-0.5 h-4 w-4 shrink-0 text-forest" />
                    <div>
                      <p className="font-semibold text-ink">{contactStatus.contact.fullName}</p>
                      <p className="mt-0.5 text-[13px] text-slate">ðŸ"ž {contactStatus.contact.phone}</p>
                      {contactStatus.contact.email && (
                        <p className="text-[13px] text-slate">âœ‰ï¸ {contactStatus.contact.email}</p>
                      )}
                    </div>
                  </div>
                </div>
              ) : isBuyerMode ? (
                <div className="mt-4">
                  <p className="text-[13px] leading-[1.6] text-muted">
                    Pay a one-time fee of{' '}
                    <span className="font-semibold text-ink">{formatInr(String(contactPrice))}</span> to
                    view the seller&apos;s phone number and email for this listing.
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
                    {contactLoading ? 'Processing...' : `View contact (₹${contactPrice})`}
                  </Button>
                  <p className="mt-2 text-center text-[11.5px] text-muted">
                    Secure payment via Razorpay
                  </p>
                </div>
              ) : (
                <div className="mt-4">
                  <div className="rounded-xl border border-dashed border-line-2 bg-paper p-4 text-center">
                    <p className="text-[13px] text-muted">
                      <button
                        type="button"
                        className="font-semibold text-forest hover:underline"
                        onClick={() => navigate('/login', { state: { from: { pathname: `/listings/${listing.id}` } } })}
                      >
                        Sign in as a buyer
                      </button>{' '}
                      to view the seller&apos;s contact details (₹{contactPrice} one-time fee).
                    </p>
                  </div>
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
