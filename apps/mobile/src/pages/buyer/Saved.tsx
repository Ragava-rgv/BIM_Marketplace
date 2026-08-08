import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { ListingDto } from '@machinebazaar/shared';
import { api } from '../../lib/api';
import { useAuth } from '../../lib/auth-context';
import { useWishlist } from '../../lib/wishlist-context';
import { AppLayout } from '../../components/AppLayout';
import { formatInrShort } from '../../lib/format';
import { ChevronRightIcon, HeartIcon, MachineIcon, MapPinIcon } from '../../components/icons';

export function BuyerSaved() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toggle } = useWishlist();
  const navigate = useNavigate();
  const [listings, setListings] = useState<ListingDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    let cancelled = false;
    api.get<ListingDto[]>('/wishlist')
      .then(({ data }) => { if (!cancelled) setListings(data); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [user]);

  const handleUnsave = (listingId: string) => {
    if (!user) return;
    void toggle(listingId);
    setListings((prev) => prev.filter((l) => l.id !== listingId));
  };

  return (
    <AppLayout>
      <div className="bg-white border-b border-gray-200 px-4 pt-4 pb-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="w-8 h-8 flex items-center justify-center">
          <ChevronRightIcon className="w-4 h-4 text-gray-500 rotate-180" />
        </button>
        <div>
          <h1 className="text-[17px] font-extrabold text-ink tracking-[-0.3px]">{t('buyer.saved.title')}</h1>
          <p className="text-[11px] text-gray-500">{t('buyer.saved.savedCount', { count: listings.length })}</p>
        </div>
      </div>

      <div className="px-4 pt-4 pb-4 space-y-3">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-[13px] h-[100px] animate-pulse" />
          ))
        ) : listings.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-14 h-14 rounded-full bg-forest/10 flex items-center justify-center mx-auto mb-3">
              <HeartIcon className="w-7 h-7 text-forest" />
            </div>
            <p className="text-[14px] font-semibold text-ink mb-1">{t('buyer.saved.emptyTitle')}</p>
            <p className="text-[12px] text-gray-500 mb-4">
              {t('buyer.saved.emptyDescription')}
            </p>
            <button onClick={() => navigate('/')}
              className="bg-forest text-white text-[13px] font-bold px-5 py-2.5 rounded-[11px]">
              {t('buyer.saved.browseButton')}
            </button>
          </div>
        ) : (
          listings.map((l) => (
            <div key={l.id} className="bg-white border border-gray-200 rounded-[13px] overflow-hidden">
              <button onClick={() => navigate(`/listings/${l.id}`)} className="w-full text-left">
                <div className="flex">
                  <div className="w-[88px] flex-shrink-0 border-r border-gray-200 bg-gray-50 grid-backdrop flex items-center justify-center min-h-[88px]">
                    {l.media?.[0] ? (
                      <img src={l.media[0].url} alt={l.title} className="w-full h-full object-cover" />
                    ) : (
                      <MachineIcon className="w-8 h-8 text-forest opacity-30" />
                    )}
                  </div>
                  <div className="flex-1 p-[10px_12px] min-w-0">
                    <p className="text-[13px] font-bold text-ink truncate">{l.title}</p>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      {l.machineMake} {l.machineModel}
                    </p>
                    <p className="font-mono text-[11px] font-bold text-forest mt-1">
                      {formatInrShort(l.askingPrice)}
                    </p>
                    <div className="flex items-center gap-1 mt-1">
                      <MapPinIcon className="w-3 h-3 text-gray-400" />
                      <p className="text-[10.5px] text-gray-400">{l.locationCity}, {l.locationState}</p>
                    </div>
                  </div>
                </div>
              </button>
              <div className="flex items-center justify-between border-t border-gray-100 px-3 py-2">
                <button
                  onClick={() => navigate(`/listings/${l.id}`)}
                  className="text-[11px] font-semibold text-forest"
                >
                  {t('buyer.saved.viewListing')}
                </button>
                <button
                  onClick={() => handleUnsave(l.id)}
                  className="text-[11px] font-semibold text-red-500"
                >
                  {t('common:common.button.remove')}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </AppLayout>
  );
}
