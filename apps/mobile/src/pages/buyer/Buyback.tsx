import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { BuybackOfferDto } from '@machinebazaar/shared';
import { BuybackStatus } from '@machinebazaar/shared';
import { api, apiErrorMessage } from '../../lib/api';
import { AppLayout } from '../../components/AppLayout';
import { formatInr, formatDate } from '../../lib/format';
import { ChevronRightIcon } from '../../components/icons';

const STATUS_STYLE: Record<string, string> = {
  QUOTED: 'bg-copper-bg text-copper',
  ACCEPTED: 'bg-green-bg text-green-txt',
  EXPIRED: 'bg-gray-100 text-gray-500',
  COMPLETED: 'bg-green-bg text-green-txt',
};

export function BuyerBuyback() {
  const navigate = useNavigate();
  const [offers, setOffers] = useState<BuybackOfferDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    api.get<BuybackOfferDto[]>('/buyback/mine')
      .then(({ data }) => { if (!cancelled) setOffers(data); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const handleAccept = async (offerId: string) => {
    setAccepting(offerId);
    setError(null);
    try {
      await api.post(`/buyback/${offerId}/accept`);
      setOffers((prev) =>
        prev.map((o) => (o.id === offerId ? { ...o, status: BuybackStatus.ACCEPTED } : o)),
      );
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not accept buyback offer. Please try again.'));
    } finally {
      setAccepting(null);
    }
  };

  return (
    <AppLayout>
      <div className="bg-white border-b border-gray-200 px-4 pt-4 pb-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="w-8 h-8 flex items-center justify-center">
          <ChevronRightIcon className="w-4 h-4 text-gray-500 rotate-180" />
        </button>
        <div>
          <h1 className="text-[17px] font-extrabold text-ink tracking-[-0.3px]">Buyback Agreements</h1>
          <p className="text-[11px] text-gray-500">{offers.length} offer{offers.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      <div className="px-4 pt-4 pb-4 space-y-4">
        {error && (
          <p className="text-[12px] text-red-600 font-medium bg-red-50 border border-red-200 rounded-[10px] px-3 py-2.5">
            {error}
          </p>
        )}

        {loading ? (
          Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-[13px] h-[200px] animate-pulse" />
          ))
        ) : offers.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-14 h-14 rounded-full bg-forest/10 flex items-center justify-center mx-auto mb-3">
              <svg className="w-7 h-7 text-forest" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 22 22">
                <rect x="3" y="4" width="16" height="14" rx="2" />
                <path d="M7 8h8M7 12h5" />
              </svg>
            </div>
            <p className="text-[14px] font-semibold text-ink mb-1">No buyback offers yet</p>
            <p className="text-[12px] text-gray-500 max-w-xs mx-auto">
              Buyback offers are generated after your loan is approved and machine certification
              is completed.
            </p>
          </div>
        ) : (
          offers.map((offer) => (
            <div key={offer.id} className="bg-white border border-gray-200 rounded-[13px] overflow-hidden">
              {/* Header */}
              <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <p className="text-[13px] font-bold text-ink">
                    {offer.listing?.title ?? offer.machineReference ?? 'Machine'}
                  </p>
                  {offer.listing && (
                    <p className="text-[10.5px] text-gray-400 mt-0.5">
                      {offer.listing.machineMake} {offer.listing.machineModel} · {offer.listing.manufactureYear}
                    </p>
                  )}
                </div>
                <span className={`text-[9.5px] font-bold px-2 py-0.5 rounded-[5px] ${STATUS_STYLE[offer.status] ?? 'bg-gray-100 text-gray-600'}`}>
                  {offer.status}
                </span>
              </div>

              {/* Values */}
              <div className="px-4 py-3 grid grid-cols-2 gap-3 border-b border-gray-100">
                <div>
                  <p className="font-mono text-[9px] text-gray-400 font-semibold tracking-[0.06em] mb-0.5">OFFER AMOUNT</p>
                  <p className="text-[14px] font-bold text-ink">{formatInr(offer.offerAmount)}</p>
                </div>
                {offer.certifiedValue && (
                  <div>
                    <p className="font-mono text-[9px] text-gray-400 font-semibold tracking-[0.06em] mb-0.5">CERTIFIED VALUE</p>
                    <p className="text-[14px] font-bold text-ink">{formatInr(offer.certifiedValue)}</p>
                  </div>
                )}
                <div>
                  <p className="font-mono text-[9px] text-gray-400 font-semibold tracking-[0.06em] mb-0.5">MACHINE AGE</p>
                  <p className="text-[13px] font-semibold text-ink">{offer.machineAgeYears} year{offer.machineAgeYears !== 1 ? 's' : ''}</p>
                </div>
                <div>
                  <p className="font-mono text-[9px] text-gray-400 font-semibold tracking-[0.06em] mb-0.5">QUOTED ON</p>
                  <p className="text-[13px] font-semibold text-ink">{formatDate(offer.createdAt)}</p>
                </div>
              </div>

              {/* Depreciation schedule */}
              {offer.depreciationSchedule && offer.depreciationSchedule.length > 0 && (
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="font-mono text-[9px] text-gray-500 font-semibold tracking-[0.06em] mb-2">DEPRECIATION SCHEDULE</p>
                  <div className="space-y-1">
                    {offer.depreciationSchedule.slice(0, 5).map((row) => (
                      <div key={row.yearOffset} className="flex items-center justify-between">
                        <p className="text-[11px] text-gray-500">Year {row.yearOffset}</p>
                        <div className="flex items-center gap-3">
                          <p className="text-[11px] text-gray-500">{Number(row.retainedValuePct).toFixed(0)}% value</p>
                          <p className="text-[11px] font-semibold text-ink">{formatInr(row.buybackValue)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Agreement terms */}
              {offer.agreementTerms && (
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="font-mono text-[9px] text-gray-500 font-semibold tracking-[0.06em] mb-2">AGREEMENT TERMS</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-[10px] text-gray-400">Buyback window</p>
                      <p className="text-[12px] font-semibold text-ink">{offer.agreementTerms.buybackWindowYears} year{offer.agreementTerms.buybackWindowYears !== 1 ? 's' : ''}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400">Notice period</p>
                      <p className="text-[12px] font-semibold text-ink">{offer.agreementTerms.noticePeriodDays} days</p>
                    </div>
                  </div>
                  {offer.agreementTerms.conditions && (
                    <p className="text-[11px] text-gray-500 mt-2 leading-relaxed">
                      {offer.agreementTerms.conditions}
                    </p>
                  )}
                </div>
              )}

              {/* Accept action */}
              {offer.status === BuybackStatus.QUOTED && (
                <div className="px-4 py-3">
                  <button
                    onClick={() => handleAccept(offer.id)}
                    disabled={accepting === offer.id}
                    className="w-full h-[44px] bg-forest text-white rounded-[11px] text-[13.5px] font-bold disabled:opacity-50"
                  >
                    {accepting === offer.id ? 'Accepting…' : 'Accept buyback agreement →'}
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </AppLayout>
  );
}
