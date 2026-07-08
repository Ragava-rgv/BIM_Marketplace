import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ListingDto, SellerSubscriptionDto } from '@machinebazaar/shared';
import { api } from '../../lib/api';
import { useAuth } from '../../lib/auth-context';
import { AppLayout } from '../../components/AppLayout';
import { formatInrShort } from '../../lib/format';
import { BellIcon, ChevronRightIcon, PlusIcon, MachineIcon } from '../../components/icons';

export function SellerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [listings, setListings] = useState<ListingDto[]>([]);
  const [subscription, setSubscription] = useState<SellerSubscriptionDto | null>(null);
  const [loading, setLoading] = useState(true);

  const initials = user ? user.fullName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() : '';

  useEffect(() => {
    Promise.all([
      api.get<ListingDto[]>('/listings/mine/all'),
      api.get<{ subscription: SellerSubscriptionDto | null }>('/subscriptions/me'),
    ])
      .then(([listRes, subRes]) => {
        setListings(listRes.data);
        setSubscription(subRes.data.subscription);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const activeListings = listings.filter((l) => l.status === 'ACTIVE');
  const pendingListings = listings.filter((l) => l.status === 'PENDING_REVIEW');
  const draftListings = listings.filter((l) => l.status === 'DRAFT');

  return (
    <AppLayout>
      {/* Green dashboard header */}
      <div className="bg-forest px-4 pt-4 pb-4">
        <div className="flex items-center justify-between mb-3">
          <div className="w-9 h-9 rounded-full bg-white/15 border border-white/20 flex items-center justify-center text-[13px] font-bold text-white">
            {initials}
          </div>
          <button className="w-9 h-9 bg-white/10 border border-white/15 rounded-[10px] flex items-center justify-center relative">
            <BellIcon className="w-[15px] h-[15px] stroke-white" />
            {pendingListings.length > 0 && (
              <span className="absolute top-2 right-2 w-[7px] h-[7px] bg-[#F5A623] rounded-full border-[1.5px] border-forest" />
            )}
          </button>
        </div>
        <p className="text-[12px] text-white/65 mb-0.5">Good morning</p>
        <p className="text-[21px] font-extrabold text-white tracking-[-0.5px] mb-3">{user?.fullName}</p>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-[7px]">
          {[
            ['LISTINGS', String(activeListings.length)],
            ['PENDING', String(pendingListings.length), pendingListings.length > 0 ? '#F5A623' : undefined],
            ['DRAFTS', String(draftListings.length)],
          ].map(([k, v, accent]) => (
            <div key={k} className="bg-white/10 border border-white/15 rounded-[10px] px-[11px] py-[9px]">
              <p className="font-mono text-[8px] text-white/55 font-semibold tracking-[0.08em] mb-0.5">{k}</p>
              <p className="text-[17px] font-extrabold text-white tracking-[-0.3px] leading-none"
                style={accent ? { color: accent } : {}}>
                {v}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Quick actions */}
      <div className="px-4 pt-4">
        <div className="flex items-baseline justify-between mb-[10px]">
          <h2 className="text-[15px] font-bold text-ink tracking-[-0.2px]">Needs your attention</h2>
        </div>

        <div className="space-y-2 mb-5">
          {pendingListings.length > 0 && (
            <button onClick={() => navigate('/seller/listings')}
              className="w-full bg-white border border-gray-200 rounded-[12px] p-[12px_13px] flex items-center gap-3">
              <div className="w-9 h-9 rounded-[9px] bg-copper-bg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" stroke="#B45309" viewBox="0 0 18 18">
                  <path d="M2 9h14v6a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1z" /><polyline points="2 9 9 3 16 9" />
                </svg>
              </div>
              <div className="flex-1 text-left">
                <p className="text-[12.5px] font-bold text-ink">
                  Listing in review
                  <span className="ml-1.5 font-mono text-[8.5px] font-bold text-white bg-copper px-1.5 py-0.5 rounded">
                    {pendingListings.length}
                  </span>
                </p>
                <p className="text-[10.5px] text-gray-500">Admin review in progress</p>
              </div>
              <ChevronRightIcon className="w-[11px] h-[11px] text-gray-400" />
            </button>
          )}

          <button onClick={() => navigate('/seller/listings/new')}
            className="w-full bg-white border border-gray-200 rounded-[12px] p-[12px_13px] flex items-center gap-3">
            <div className="w-9 h-9 rounded-[9px] bg-forest-bg flex items-center justify-center flex-shrink-0">
              <PlusIcon className="w-4 h-4 stroke-forest stroke-[1.8px]" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-[12.5px] font-bold text-ink">List a new machine</p>
              <p className="text-[10.5px] text-gray-500">5+ photos · running video required</p>
            </div>
            <ChevronRightIcon className="w-[11px] h-[11px] text-gray-400" />
          </button>

          <button onClick={() => navigate('/seller/enquiries')}
            className="w-full bg-white border border-gray-200 rounded-[12px] p-[12px_13px] flex items-center gap-3">
            <div className="w-9 h-9 rounded-[9px] bg-gray-100 flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 stroke-ink" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 18 18">
                <path d="M3 5h12v8a1 1 0 0 1-1 1H6l-3 3z" />
              </svg>
            </div>
            <div className="flex-1 text-left">
              <p className="text-[12.5px] font-bold text-ink">Buyer enquiries</p>
              <p className="text-[10.5px] text-gray-500">Admin-vetted buyers waiting</p>
            </div>
            <ChevronRightIcon className="w-[11px] h-[11px] text-gray-400" />
          </button>
        </div>

        {/* Your listings */}
        <div className="flex items-baseline justify-between mb-[10px]">
          <h2 className="text-[15px] font-bold text-ink tracking-[-0.2px]">Your listings</h2>
          <button onClick={() => navigate('/seller/listings')}
            className="text-[11px] font-bold text-forest-2">Manage all →</button>
        </div>

        <div className="flex flex-col gap-[10px]">
          {loading ? (
            Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-[13px] h-[108px] animate-pulse" />
            ))
          ) : listings.slice(0, 5).map((l) => (
            <button key={l.id} onClick={() => navigate(`/seller/listings/${l.id}/edit`)}
              className="bg-white border border-gray-200 rounded-[13px] overflow-hidden text-left">
              <div className="flex">
                <div className="w-[88px] flex-shrink-0 border-r border-gray-200 bg-gray-50 grid-backdrop flex items-center justify-center min-h-[88px]">
                  <MachineIcon className="w-8 h-8 text-forest opacity-30" />
                </div>
                <div className="flex-1 p-[10px_12px] min-w-0">
                  <span className={`inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-[5px] mb-1 ${
                    l.status === 'ACTIVE' ? 'bg-green-bg text-green-txt' :
                    l.status === 'PENDING_REVIEW' ? 'bg-copper-bg text-copper' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {l.status.replace('_', ' ')}
                  </span>
                  <p className="text-[13px] font-bold text-ink truncate">{l.title}</p>
                  <p className="font-mono text-[8.5px] text-gray-500 font-semibold mt-0.5">
                    {formatInrShort(l.askingPrice)}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between border-t border-gray-200 bg-gray-25 px-3 py-2">
                <p className="text-[10.5px] text-gray-500">{l.locationCity}, {l.locationState}</p>
                <span className="text-[11px] font-semibold text-ink border border-gray-200 bg-white rounded-[7px] px-2 py-0.5">
                  Manage
                </span>
              </div>
            </button>
          ))}
        </div>

        {/* Subscription status */}
        {subscription && (
          <div className="mt-5 bg-forest rounded-[13px] px-[15px] py-[13px]">
            <p className="font-mono text-[9px] text-[#9BD8B8] font-semibold tracking-[0.1em] mb-1">ACTIVE PLAN</p>
            <p className="text-[15px] font-bold text-white mb-0.5">
              {subscription.planConfig?.displayName ?? subscription.plan}
            </p>
            <p className="text-[11px] text-white/60">
              Expires {new Date(subscription.expiresAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            </p>
          </div>
        )}

        <div className="h-4" />
      </div>
    </AppLayout>
  );
}
