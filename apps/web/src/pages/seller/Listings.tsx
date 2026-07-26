import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { GstStatus, ListingStatus } from '@machinebazaar/shared';
import type { ListingDto } from '@machinebazaar/shared';
import { api } from '../../lib/api';
import { useAuth } from '../../lib/auth-context';
import { formatInr } from '../../lib/format';
import { Button, EmptyState, LoadingBlock, PageHeading, StatusBadge } from '../../components/ui';
import { BoostListingModal } from '../../components/BoostListingModal';
import { PlusIcon, StarIcon } from '../../components/icons';

const BOOSTABLE_STATUSES: string[] = [ListingStatus.ACTIVE, ListingStatus.UNDER_OFFER];

export function SellerListings() {
  const { user } = useAuth();
  const [listings, setListings] = useState<ListingDto[] | null>(null);
  const [boostingId, setBoostingId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    api
      .get<ListingDto[]>('/listings/mine/all')
      .then(({ data }) => {
        if (!cancelled) setListings(data);
      })
      .catch(() => {
        if (!cancelled) setListings([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const isGstActive = user?.gstStatus === GstStatus.ACTIVE;

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <PageHeading eyebrow="Seller workspace" title="My listings" description="Manage drafts, track review status and edit your published machines." />
        <Link to="/seller/listings/new">
          <Button disabled={!isGstActive}>
            <PlusIcon className="h-4 w-4" />
            New listing
          </Button>
        </Link>
      </div>

      {listings === null ? (
        <LoadingBlock />
      ) : listings.length === 0 ? (
        <EmptyState
          title="No listings yet"
          description={isGstActive ? 'Create your first listing to start reaching buyers.' : 'Verify your GST registration to unlock listing creation.'}
          action={
            <Link to={isGstActive ? '/seller/listings/new' : '/seller/gst-verification'}>
              <Button>{isGstActive ? 'Create a listing' : 'Verify GST'}</Button>
            </Link>
          }
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-navy/10 bg-white">
          <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-navy/10 bg-navy/[0.02] text-left text-xs font-semibold uppercase tracking-wide text-navy/40">
              <tr>
                <th className="px-5 py-3">Listing</th>
                <th className="px-5 py-3">Asking price</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Updated</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-navy/10">
              {listings.map((listing) => (
                <tr key={listing.id} className="transition hover:bg-navy/[0.02]">
                  <td className="px-5 py-4">
                    <p className="font-semibold text-navy">{listing.title}</p>
                    <p className="text-navy/45">{listing.machineMake} · {listing.machineModel}</p>
                  </td>
                  <td className="px-5 py-4 font-medium text-navy">{formatInr(listing.askingPrice)}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <StatusBadge status={listing.status} />
                      {listing.isBoosted && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-forest-bg px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-forest">
                          <StarIcon className="h-3 w-3" />
                          Boosted
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-4 text-navy/45">{new Date(listing.updatedAt).toLocaleDateString('en-IN')}</td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-3">
                      {BOOSTABLE_STATUSES.includes(listing.status) && (
                        <button
                          type="button"
                          onClick={() => setBoostingId(listing.id)}
                          className="text-sm font-semibold text-copper hover:text-copper-2"
                        >
                          Boost
                        </button>
                      )}
                      <Link to={`/seller/listings/${listing.id}/edit`} className="text-sm font-semibold text-accent hover:text-accent-dark">
                        Manage
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}

      {boostingId && (
        <BoostListingModal
          listingId={boostingId}
          open={!!boostingId}
          onClose={() => {
            setBoostingId(null);
            api.get<ListingDto[]>('/listings/mine/all').then(({ data }) => setListings(data)).catch(() => {});
          }}
        />
      )}
    </div>
  );
}
