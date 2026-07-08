import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { AppLayout } from '../../components/AppLayout';
import { formatDate } from '../../lib/format';
import { ChevronRightIcon } from '../../components/icons';

interface SellerEnquiry {
  id: string;
  status: string;
  createdAt: string;
  listing?: { id: string; title: string };
  buyerName?: string;
  buyerLocationCity?: string;
  buyerLocationState?: string;
}

export function SellerEnquiries() {
  const [enquiries, setEnquiries] = useState<SellerEnquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    api.get<SellerEnquiry[]>('/enquiries/seller')
      .then(({ data }) => setEnquiries(data))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  return (
    <AppLayout>
      <div className="bg-white border-b border-gray-200 px-4 pt-4 pb-3">
        <h1 className="text-[19px] font-extrabold text-ink tracking-[-0.4px]">Buyer Enquiries</h1>
        <p className="text-[12px] text-gray-500 mt-0.5">Buyers interested in your machines</p>
      </div>

      <div className="px-4 pt-4 flex flex-col gap-3">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-[13px] h-[80px] animate-pulse" />
          ))
        ) : error ? (
          <div className="text-center py-16">
            <p className="text-[14px] font-semibold text-ink mb-1">Could not load enquiries</p>
            <p className="text-[12px] text-gray-500">Please try again later.</p>
          </div>
        ) : enquiries.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-[14px] font-semibold text-ink mb-1">No enquiries yet</p>
            <p className="text-[12px] text-gray-500">When buyers enquire on your listings, they'll appear here.</p>
            <Link to="/seller/listings/new" className="mt-4 inline-block text-[13px] font-bold text-forest">
              List a machine →
            </Link>
          </div>
        ) : (
          enquiries.map((e) => (
            <div key={e.id} className="bg-white border border-gray-200 rounded-[13px] p-[13px]">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-8 h-8 rounded-full bg-forest/10 flex items-center justify-center text-[12px] font-bold text-forest flex-shrink-0">
                      {(e.buyerName ?? 'B')[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="text-[13px] font-bold text-ink leading-tight">{e.buyerName ?? 'Buyer'}</p>
                      {(e.buyerLocationCity || e.buyerLocationState) && (
                        <p className="text-[10.5px] text-gray-500">
                          {[e.buyerLocationCity, e.buyerLocationState].filter(Boolean).join(', ')}
                        </p>
                      )}
                    </div>
                  </div>
                  <p className="text-[11.5px] text-gray-600 truncate ml-10">
                    {e.listing?.title ?? 'Your listing'}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                    e.status === 'NEW' ? 'bg-green-bg text-green-txt' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {e.status}
                  </span>
                  <p className="text-[10px] text-gray-400">{formatDate(e.createdAt)}</p>
                </div>
              </div>
              {e.listing?.id && (
                <Link to={`/listings/${e.listing.id}`}
                  className="mt-2.5 flex items-center justify-between border-t border-gray-100 pt-2.5">
                  <span className="text-[11px] font-semibold text-forest">View listing</span>
                  <ChevronRightIcon className="w-3.5 h-3.5 text-forest" />
                </Link>
              )}
            </div>
          ))
        )}
      </div>
    </AppLayout>
  );
}
