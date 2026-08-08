import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { ListingDto } from '@machinebazaar/shared';
import { api } from '../../lib/api';
import { AppLayout } from '../../components/AppLayout';
import { formatInrShort } from '../../lib/format';
import { PlusIcon, MachineIcon } from '../../components/icons';

const STATUS_STYLE: Record<string, string> = {
  ACTIVE: 'bg-green-bg text-green-txt',
  PENDING_REVIEW: 'bg-copper-bg text-copper',
  DRAFT: 'bg-gray-100 text-gray-600',
  REJECTED: 'bg-red-50 text-red-600',
};

export function SellerListings() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [listings, setListings] = useState<ListingDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<ListingDto[]>('/listings/mine/all')
      .then(({ data }) => setListings(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <AppLayout>
      <div className="bg-white border-b border-gray-200 px-4 pt-4 pb-3 flex items-center justify-between">
        <div>
          <h1 className="text-[19px] font-extrabold text-ink tracking-[-0.4px]">{t('seller.listings.title')}</h1>
          <p className="text-[12px] text-gray-500 mt-0.5">{t('seller.listings.totalCount', { count: listings.length })}</p>
        </div>
        <button onClick={() => navigate('/seller/listings/new')}
          className="flex items-center gap-1.5 bg-forest text-white text-[12px] font-bold px-3 py-2 rounded-[10px]">
          <PlusIcon className="w-3.5 h-3.5 stroke-white stroke-[2.5px]" />
          {t('seller.listings.new')}
        </button>
      </div>

      <div className="px-4 pt-4 flex flex-col gap-3 pb-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-[13px] h-[100px] animate-pulse" />
          ))
        ) : listings.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-14 h-14 rounded-full bg-forest/10 flex items-center justify-center mx-auto mb-3">
              <MachineIcon className="w-7 h-7 text-forest" />
            </div>
            <p className="text-[14px] font-semibold text-ink mb-1">{t('seller.listings.emptyTitle')}</p>
            <p className="text-[12px] text-gray-500 mb-4">{t('seller.listings.emptyDescription')}</p>
            <button onClick={() => navigate('/seller/listings/new')}
              className="bg-forest text-white text-[13px] font-bold px-5 py-2.5 rounded-[11px]">
              {t('seller.listings.listMachine')}
            </button>
          </div>
        ) : (
          listings.map((l) => (
            <div key={l.id} className="bg-white border border-gray-200 rounded-[13px] overflow-hidden">
              <button
                onClick={() => navigate(`/seller/listings/${l.id}/edit`)}
                className="w-full text-left"
              >
                <div className="flex">
                  <div className="w-[88px] flex-shrink-0 border-r border-gray-200 bg-gray-50 grid-backdrop flex items-center justify-center min-h-[88px]">
                    <MachineIcon className="w-8 h-8 text-forest opacity-30" />
                  </div>
                  <div className="flex-1 p-[10px_12px] min-w-0">
                    <span className={`inline-flex items-center text-[9px] font-bold px-1.5 py-0.5 rounded-[5px] mb-1 ${
                      STATUS_STYLE[l.status] ?? 'bg-gray-100 text-gray-600'
                    }`}>
                      {t(`common:status.listing.${l.status}`)}
                    </span>
                    <p className="text-[13px] font-bold text-ink truncate">{l.title}</p>
                    <p className="font-mono text-[8.5px] text-gray-500 font-semibold mt-0.5">
                      {formatInrShort(l.askingPrice)}
                    </p>
                    <p className="text-[10.5px] text-gray-400 mt-0.5">{l.locationCity}, {l.locationState}</p>
                  </div>
                </div>
              </button>
              <div className="flex items-center justify-between border-t border-gray-100 bg-gray-25 px-3 py-2">
                <p className="text-[10.5px] text-gray-400">{l.machineCategory}</p>
                <button
                  onClick={() => navigate(`/seller/listings/${l.id}/edit`)}
                  className="text-[11px] font-semibold text-forest"
                >
                  {t('seller.listings.manage')}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </AppLayout>
  );
}
