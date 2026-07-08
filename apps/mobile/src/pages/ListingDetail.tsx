import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type { ContactRevealStatusDto, ListingDto, RazorpayOrderDto } from '@machinebazaar/shared';
import { UserRole } from '@machinebazaar/shared';
import { api, apiErrorMessage } from '../lib/api';
import { useAuth } from '../lib/auth-context';
import { formatInr } from '../lib/format';
import { ArrowLeftIcon, HeartIcon, ShareIcon, MachineIcon, PlayIcon, ShieldIcon, RupeeIcon } from '../components/icons';

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
  const [enquiring, setEnquiring] = useState(false);
  const [enquirySent, setEnquirySent] = useState(false);

  const [contactStatus, setContactStatus] = useState<ContactRevealStatusDto | null>(null);
  const [contactLoading, setContactLoading] = useState(false);
  const [contactError, setContactError] = useState<string | null>(null);
  const [contactPrice, setContactPrice] = useState<number>(500);
  const contactChecked = useRef(false);

  const isBuyerMode = user?.activeMode === 'BUYER' || user?.role === UserRole.BUYER;

  useEffect(() => {
    if (!id) return;
    api.get<ListingDto>(`/listings/${id}`)
      .then(({ data }) => setListing(data))
      .catch((err) => setError(apiErrorMessage(err, 'Listing not found.')));
  }, [id]);

  useEffect(() => {
    api.get<{ price: number }>('/settings/contact-reveal-price')
      .then(({ data }) => setContactPrice(data.price))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!id || !user || !isBuyerMode || contactChecked.current) return;
    contactChecked.current = true;
    api.get<ContactRevealStatusDto>(`/contact-payments/check/${id}`)
      .then(({ data }) => setContactStatus(data))
      .catch(() => setContactStatus({ paid: false, contact: null }));
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

  const revealContact = useCallback(async () => {
    if (!listing || !user) {
      navigate('/login');
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
            } catch (e) { reject(e); }
          },
          modal: { ondismiss: () => reject(new Error('Payment cancelled')) },
          theme: { color: '#E8820C' },
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
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 px-6">
        <p className="text-gray-500 text-[14px]">{error}</p>
        <button onClick={() => navigate(-1)} className="text-forest font-semibold text-[13px]">Go back</button>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="min-h-screen bg-gray-100">
        <div className="h-[240px] bg-gray-200 animate-pulse" />
        <div className="bg-white rounded-t-[20px] -mt-4 p-5 space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-4 bg-gray-200 rounded animate-pulse" />)}
        </div>
      </div>
    );
  }

  const photos = listing.media?.filter((m) => m.type === 'PHOTO') ?? [];
  const video = listing.media?.find((m) => m.type === 'VIDEO');
  const cover = photos[0] ?? null;
  const isCertified = listing.status === 'ACTIVE';
  const shortId = `MB-${listing.id.slice(0, 8).toUpperCase()}`;

  return (
    <div className="min-h-screen bg-gray-100 pb-[80px]">
      {/* Overlaid back/action buttons */}
      <div className="absolute top-10 left-0 right-0 flex items-center justify-between px-[14px] z-10">
        <button onClick={() => navigate(-1)}
          className="w-[34px] h-[34px] bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-sm">
          <ArrowLeftIcon className="w-[14px] h-[14px] text-ink" />
        </button>
        <div className="flex gap-1.5">
          <button className="w-[34px] h-[34px] bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-sm">
            <HeartIcon className="w-[14px] h-[14px] text-ink" />
          </button>
          <button className="w-[34px] h-[34px] bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-sm">
            <ShareIcon className="w-[14px] h-[14px] text-ink" />
          </button>
        </div>
      </div>

      {/* Hero image */}
      <div className="h-[240px] bg-gray-100 relative flex items-center justify-center"
        style={{ backgroundImage: 'linear-gradient(rgba(16,24,40,.04) 1px,transparent 1px),linear-gradient(90deg,rgba(16,24,40,.04) 1px,transparent 1px)', backgroundSize: '18px 18px' }}>
        {cover ? (
          <img src={cover.url} alt={listing.title} className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <MachineIcon className="w-[100px] h-[100px] text-forest opacity-25 relative z-[1]" />
        )}
        {video && (
          <div className="absolute bottom-[14px] left-[12px] bg-forest text-white font-mono text-[9.5px] font-semibold px-[9px] py-[3px] rounded-full flex items-center gap-1 z-[2]">
            <PlayIcon className="w-1.5 h-1.5 fill-[#6CE9A6]" />
            VIDEO {video.durationSeconds ? `${video.durationSeconds}s` : ''}
          </div>
        )}
        {photos.length > 0 && (
          <div className="absolute bottom-[14px] right-[12px] bg-ink text-white font-mono text-[9.5px] font-semibold px-[9px] py-[3px] rounded-full z-[2]">
            <span className="text-[#6CE9A6]">1</span> / {photos.length}
          </div>
        )}
      </div>

      {/* Bottom sheet card */}
      <div className="bg-white rounded-t-[20px] -mt-[18px] relative z-[5] px-4 pt-5 pb-4">
        {/* Handle */}
        <div className="absolute top-[7px] left-1/2 -translate-x-1/2 w-9 h-1 bg-gray-300 rounded-full" />

        {/* Badges */}
        <div className="flex gap-1.5 mb-2.5 flex-wrap">
          <span className={`inline-flex items-center gap-1 text-[9.5px] font-bold px-[9px] py-[3px] rounded-[6px] ${isCertified ? 'bg-green-bg text-green-txt border border-green-bdr' : 'bg-copper-bg text-copper border border-copper-bdr'}`}>
            {isCertified && <span className="w-1.5 h-1.5 rounded-full bg-green-txt" />}
            {isCertified ? 'CERTIFIED' : 'UNVERIFIED'}
          </span>
          <span className="inline-flex items-center gap-1 text-[9.5px] font-bold px-[9px] py-[3px] rounded-[6px] bg-gray-100 text-gray-700 border border-gray-200">
            {shortId}
          </span>
        </div>

        {/* Title */}
        <h1 className="text-[21px] font-extrabold text-ink tracking-[-0.5px] leading-[1.15] mb-1">
          {listing.title}
        </h1>

        {/* Seller row */}
        <div className="flex items-center gap-1.5 text-[12px] text-gray-500 font-medium mb-[14px]">
          <span className="w-3 h-3 rounded-full bg-forest-bg inline-flex items-center justify-center flex-shrink-0">
            <svg width="7" height="7" viewBox="0 0 8 8" fill="none">
              <polyline points="1.5 4 3.5 6 6.5 2" stroke="#101828" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          {listing.machineMake} · {listing.machineModel} · GST verified · {listing.locationCity}
        </div>

        {/* Price card */}
        <div className="bg-gray-25 border border-gray-200 rounded-[12px] px-[15px] py-[13px] flex items-center justify-between mb-[14px]">
          <div>
            <p className="font-mono text-[9px] font-semibold text-gray-500 tracking-[0.08em] mb-0.5">ASKING PRICE</p>
            <p className="text-[26px] font-extrabold text-ink tracking-[-0.6px] leading-none">{formatInr(listing.askingPrice)}</p>
          </div>
          <span className="text-[10px] font-bold text-green-txt bg-green-bg border border-green-bdr px-[10px] py-1 rounded-full">
            Negotiable
          </span>
        </div>

        {/* Specs grid */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          {([
            ['YEAR', String(listing.manufactureYear)],
            ['GRADE', listing.complexityTier],
            ['CATEGORY', listing.machineCategory],
            ['LOCATION', `${listing.locationCity}, ${listing.locationState}`],
          ] as [string, string][]).map(([k, v]) => (
            <div key={k} className="bg-gray-25 border border-gray-200 rounded-[10px] px-[11px] py-[9px]">
              <p className="font-mono text-[8.5px] font-semibold text-gray-500 tracking-[0.08em] mb-0.5">{k}</p>
              <p className="text-[12.5px] font-bold text-ink">{v}</p>
            </div>
          ))}
        </div>

        {/* Description */}
        {listing.description && (
          <div className="mb-4">
            <p className="font-mono text-[9.5px] font-semibold text-forest-2 tracking-[0.1em] mb-2">"” ABOUT THIS MACHINE</p>
            <p className="text-[13px] leading-[1.65] text-gray-600">{listing.description}</p>
          </div>
        )}

        {/* Trust strip */}
        <div className="bg-forest rounded-[13px] px-[15px] py-[13px] mb-4">
          <p className="font-mono text-[9px] text-[#9BD8B8] font-semibold tracking-[0.1em] mb-1">INSTITUTIONAL TRUST</p>
          <p className="text-[13px] font-semibold text-white leading-[1.5]">
            All deals go through admin review. Contacts released only after commission is confirmed.
          </p>
        </div>

        {/* Contact reveal section */}
        <div className="border border-gray-200 rounded-[13px] px-[15px] py-[13px]">
          <p className="font-mono text-[9px] font-semibold text-copper tracking-[0.1em] mb-3">"” SELLER CONTACT</p>
          {contactStatus?.paid && contactStatus.contact ? (
            <div className="bg-green-bg border border-green-bdr rounded-[10px] px-[13px] py-[11px] space-y-1">
              <p className="text-[13px] font-bold text-ink">{contactStatus.contact.fullName}</p>
              <p className="text-[12px] text-gray-700">ðŸ“ž {contactStatus.contact.phone}</p>
              {contactStatus.contact.email && (
                <p className="text-[12px] text-gray-700">âœ‰ï¸ {contactStatus.contact.email}</p>
              )}
            </div>
          ) : isBuyerMode ? (
            <>
              <p className="text-[12.5px] text-gray-500 leading-[1.6] mb-3">
                Pay a one-time fee of <span className="font-bold text-ink">₹{contactPrice}</span> to view the seller's phone number and email.
              </p>
              {contactError && (
                <p className="text-[12px] text-rose-600 mb-2">{contactError}</p>
              )}
              <button onClick={revealContact} disabled={contactLoading}
                className="w-full h-[42px] rounded-[10px] bg-copper-bg text-copper border border-copper-bdr flex items-center justify-center gap-1.5 text-[13px] font-bold disabled:opacity-60">
                <RupeeIcon className="w-[13px] h-[13px] stroke-copper" />
                {contactLoading ? 'Processing...' : `View contact (₹${contactPrice})`}
              </button>
              <p className="text-center text-[10.5px] text-gray-400 mt-1.5">Secure payment via Razorpay</p>
            </>
          ) : (
            <p className="text-[12.5px] text-gray-500 text-center">
              <button type="button" className="font-semibold text-forest" onClick={() => navigate('/login')}>
                Sign in as a buyer
              </button>{' '}
              to view seller contact (₹{contactPrice} one-time fee).
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
            Apply loan
          </button>
        )}
        {enquirySent ? (
          <div className="flex-1 h-[46px] rounded-[10px] bg-green-bg border border-green-bdr flex items-center justify-center gap-1.5 text-[13px] font-bold text-green-txt">
            <ShieldIcon className="w-[13px] h-[13px] stroke-green-txt" />
            Interest sent!
          </div>
        ) : (
          <button onClick={sendEnquiry} disabled={enquiring}
            className="flex-1 h-[46px] rounded-[10px] bg-forest text-white flex items-center justify-center gap-1.5 text-[13px] font-bold">
            {enquiring ? 'Sending...' : 'Enquire'}
          </button>
        )}
      </div>
    </div>
  );
}



