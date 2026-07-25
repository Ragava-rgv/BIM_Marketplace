import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { ListingDto } from '@machinebazaar/shared';
import { api } from '../../lib/api';
import { useAuth } from '../../lib/auth-context';
import { ListingCard } from '../../components/ListingCard';
import { Button, EmptyState, LoadingBlock, PageHeading } from '../../components/ui';

export function BuyerSaved() {
  const { user } = useAuth();
  const [listings, setListings] = useState<ListingDto[] | null>(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    api
      .get<ListingDto[]>('/wishlist')
      .then(({ data }) => { if (!cancelled) setListings(data); })
      .catch(() => { if (!cancelled) setListings([]); });
    return () => {
      cancelled = true;
    };
  }, [user]);

  return (
    <div>
      <PageHeading
        eyebrow="Buyer workspace"
        title="Saved listings"
        description="Listings you've bookmarked while browsing — synced to your account, so they follow you across devices."
      />

      {listings === null ? (
        <LoadingBlock />
      ) : listings.length === 0 ? (
        <EmptyState
          title="Nothing saved yet"
          description={`Open a listing and choose "Save this listing" to keep track of machines you're interested in.`}
          action={
            <Link to="/listings">
              <Button>Browse listings</Button>
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {listings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      )}
    </div>
  );
}
