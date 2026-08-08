import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { ListingDto } from '@machinebazaar/shared';
import { api } from '../../lib/api';
import { useAuth } from '../../lib/auth-context';
import { ListingCard } from '../../components/ListingCard';
import { Button, EmptyState, LoadingBlock, PageHeading } from '../../components/ui';

export function BuyerSaved() {
  const { t } = useTranslation();
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
        eyebrow={t('buyer.saved.eyebrow')}
        title={t('buyer.saved.title')}
        description={t('buyer.saved.description')}
      />

      {listings === null ? (
        <LoadingBlock />
      ) : listings.length === 0 ? (
        <EmptyState
          title={t('buyer.saved.emptyTitle')}
          description={t('buyer.saved.emptyDescription')}
          action={
            <Link to="/listings">
              <Button>{t('buyer.saved.browseButton')}</Button>
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
