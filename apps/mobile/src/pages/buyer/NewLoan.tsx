import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { GstStatus } from '@machinebazaar/shared';
import type { ListingDto } from '@machinebazaar/shared';
import { api, apiErrorMessage } from '../../lib/api';
import { useAuth } from '../../lib/auth-context';
import { AppLayout } from '../../components/AppLayout';
import { formatInrShort } from '../../lib/format';
import { ChevronRightIcon, ShieldIcon } from '../../components/icons';

const inputCls =
  'w-full h-[50px] bg-gray-50 border border-gray-200 rounded-[12px] px-4 text-[14px] text-ink font-medium placeholder-gray-400 outline-none focus:border-forest focus:bg-white transition';
const selectCls = inputCls + ' appearance-none pr-8';

function SelectWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative">
      {children}
      <ChevronRightIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 rotate-90 pointer-events-none" />
    </div>
  );
}

export function BuyerNewLoan() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const presetListingId = searchParams.get('listingId') ?? '';

  const [savedListings, setSavedListings] = useState<ListingDto[]>([]);
  const [loadingListings, setLoadingListings] = useState(true);
  const [selectedListingId, setSelectedListingId] = useState(presetListingId);
  const [amount, setAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isGstActive = user?.gstStatus === GstStatus.ACTIVE;

  useEffect(() => {
    if (!user) return;
    api.get<ListingDto[]>('/wishlist')
      .then(async ({ data }) => {
        let all = data;
        if (presetListingId && !all.some((l) => l.id === presetListingId)) {
          try {
            const { data: preset } = await api.get<ListingDto>(`/listings/${presetListingId}`);
            all = [...all, preset];
          } catch {
            // preset listing not found/accessible — fall through with the wishlist alone
          }
        }
        const active = all.filter((l) => l.status === 'ACTIVE');
        setSavedListings(active);
        if (presetListingId && active.some((l) => l.id === presetListingId)) {
          setSelectedListingId(presetListingId);
        }
      })
      .finally(() => setLoadingListings(false));
  }, [user, presetListingId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedListingId) { setError(t('buyer.newLoan.errors.noListing')); return; }
    if (!amount || parseFloat(amount) <= 0) { setError(t('buyer.newLoan.errors.invalidAmount')); return; }
    setSubmitting(true);
    setError(null);
    try {
      const { data } = await api.post<{ id: string }>('/loans', {
        listingId: selectedListingId,
        amountRequested: parseFloat(amount),
      });
      await api.post(`/loans/${data.id}/submit`);
      navigate('/buyer/loans', { replace: true });
    } catch (err) {
      setError(apiErrorMessage(err, t('buyer.newLoan.errors.submitFailed')));
      setSubmitting(false);
    }
  };

  return (
    <AppLayout>
      <div className="bg-white border-b border-gray-200 px-4 pt-4 pb-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="w-8 h-8 flex items-center justify-center">
          <ChevronRightIcon className="w-4 h-4 text-gray-500 rotate-180" />
        </button>
        <div>
          <h1 className="text-[17px] font-extrabold text-ink tracking-[-0.3px]">{t('buyer.newLoan.title')}</h1>
          <p className="text-[11px] text-gray-500">{t('buyer.newLoan.subtitle')}</p>
        </div>
      </div>

      <div className="px-4 pt-4 pb-6 space-y-4">
        {/* GST gate */}
        {!isGstActive && (
          <div className="bg-copper-bg border border-copper-bdr rounded-[13px] px-4 py-4">
            <div className="flex items-start gap-3">
              <ShieldIcon className="w-5 h-5 text-copper mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-[13px] font-bold text-copper mb-1">{t('buyer.newLoan.gstGate.title')}</p>
                <p className="text-[11.5px] text-copper/80 leading-relaxed mb-3">
                  {t('buyer.newLoan.gstGate.description')}
                </p>
                <button
                  onClick={() => navigate('/buyer/gst-verification')}
                  className="h-[38px] px-4 bg-copper text-white rounded-[10px] text-[12.5px] font-bold"
                >
                  {t('buyer.newLoan.gstGate.verifyButton')}
                </button>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className={`space-y-4 ${!isGstActive ? 'opacity-50 pointer-events-none' : ''}`}>
          {/* Listing selection */}
          <div>
            <label className="block text-[11.5px] font-semibold text-gray-600 mb-1">
              {t('buyer.newLoan.fields.listingLabel')} <span className="text-red-500">*</span>
            </label>
            {loadingListings ? (
              <div className="h-[50px] bg-gray-100 rounded-[12px] animate-pulse" />
            ) : savedListings.length > 0 ? (
              <SelectWrapper>
                <select
                  value={selectedListingId}
                  onChange={(e) => setSelectedListingId(e.target.value)}
                  className={selectCls}
                >
                  <option value="">{t('buyer.newLoan.fields.listingPlaceholder')}</option>
                  {savedListings.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.title} — {formatInrShort(l.askingPrice)}
                    </option>
                  ))}
                </select>
              </SelectWrapper>
            ) : (
              <div>
                <input
                  value={selectedListingId}
                  onChange={(e) => setSelectedListingId(e.target.value)}
                  placeholder={t('buyer.newLoan.fields.listingIdPlaceholder')}
                  className={inputCls}
                />
                <p className="mt-1 text-[10.5px] text-gray-400">
                  {t('buyer.newLoan.fields.listingIdHint')}
                </p>
              </div>
            )}
          </div>

          {/* Amount */}
          <div>
            <label className="block text-[11.5px] font-semibold text-gray-600 mb-1">
              {t('buyer.newLoan.fields.amountLabel')} <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={t('buyer.newLoan.fields.amountPlaceholder')}
              min="1"
              className={inputCls}
            />
            <p className="mt-1 text-[10.5px] text-gray-400">
              {t('buyer.newLoan.fields.amountHint')}
            </p>
          </div>

          {/* Info */}
          <div className="bg-forest-bg border border-forest-bdr rounded-[12px] px-3.5 py-3">
            <p className="text-[11.5px] font-bold text-forest mb-0.5">{t('buyer.newLoan.info.title')}</p>
            <p className="text-[11px] text-forest/75 leading-relaxed">
              {t('buyer.newLoan.info.description')}
            </p>
          </div>

          {error && (
            <p className="text-[12px] text-red-600 font-medium bg-red-50 border border-red-200 rounded-[10px] px-3 py-2.5">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting || !isGstActive}
            className="w-full h-[52px] bg-forest text-white rounded-[13px] text-[15px] font-bold disabled:opacity-50"
          >
            {submitting ? t('buyer.newLoan.submitting') : t('buyer.newLoan.submitButton')}
          </button>
        </form>
      </div>
    </AppLayout>
  );
}
