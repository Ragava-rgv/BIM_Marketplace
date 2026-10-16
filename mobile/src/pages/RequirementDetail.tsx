import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { ListingDto, RequirementDto } from '../shared';
import { api, apiErrorMessage } from '../lib/api';
import { formatInrShort, formatDate } from '../lib/format';
import { useAuth } from '../lib/auth-context';
import { AppLayout } from '../components/AppLayout';
import { ChevronRightIcon, CheckIcon, MapPinIcon } from '../components/icons';

const inputCls =
  'w-full h-[48px] bg-gray-50 border border-gray-200 rounded-[12px] px-4 text-[14px] text-ink font-medium placeholder-gray-400 outline-none focus:border-forest focus:bg-white transition';

export function RequirementDetail() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();

  const [req, setReq] = useState<RequirementDto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [myListings, setMyListings] = useState<ListingDto[]>([]);
  const [listingId, setListingId] = useState('');
  const [price, setPrice] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [quoteSent, setQuoteSent] = useState(false);

  useEffect(() => {
    if (!id) return;
    api.get<RequirementDto>(`/requirements/${id}`)
      .then(({ data }) => setReq(data))
      .catch((err) => setError(apiErrorMessage(err, t('requirementDetail.notFoundError'))));
  }, [id, t]);

  const canQuote = !!user?.canSell;

  useEffect(() => {
    if (!canQuote) return;
    api.get<ListingDto[]>('/listings/mine/all').then(({ data }) => setMyListings(data.filter((l) => l.status === 'ACTIVE'))).catch(() => {});
  }, [canQuote]);

  if (error) {
    return (
      <AppLayout>
        <div className="px-4 py-16 text-center">
          <p className="text-[13px] text-red-600 font-medium">{error}</p>
          <button onClick={() => navigate('/wanted')} className="mt-4 text-[13px] font-semibold text-forest">{t('requirementDetail.backToWanted')}</button>
        </div>
      </AppLayout>
    );
  }
  if (!req) return <AppLayout><div className="px-4 py-16 text-center text-gray-400 text-[13px]">…</div></AppLayout>;

  const submitQuote = async () => {
    if (!id || !listingId) return;
    setQuoteError(null);
    setSubmitting(true);
    try {
      await api.post(`/requirements/${id}/quotes`, {
        listingId,
        price: price ? Number(price) : undefined,
        message: message || undefined,
      });
      setQuoteSent(true);
    } catch (err) {
      setQuoteError(apiErrorMessage(err, t('requirementDetail.errors.quoteFailed')));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppLayout>
      <div className="bg-white border-b border-gray-200 px-4 pt-4 pb-3 flex items-center gap-3">
        <button onClick={() => navigate('/wanted')} className="w-8 h-8 flex items-center justify-center flex-shrink-0">
          <ChevronRightIcon className="w-4 h-4 text-gray-500 rotate-180" />
        </button>
        <h1 className="text-[16px] font-extrabold text-ink tracking-[-0.3px] truncate">{req.title}</h1>
      </div>

      <div className="px-4 pt-4 pb-8 space-y-5">
        <div className="bg-white border border-gray-200 rounded-[13px] p-4">
          <span className="inline-flex items-center text-[9px] font-bold px-1.5 py-0.5 rounded-[5px] bg-copper-bg text-copper mb-2">
            {t('wanted.badge')}
          </span>
          <p className="text-[12px] text-gray-500">{req.machineCategory}{req.machineSubcategory ? ` · ${req.machineSubcategory}` : ''} · {formatDate(req.postedAt ?? req.createdAt)}</p>
          {(req.locationCity || req.locationState) && (
            <p className="flex items-center gap-1 text-[12px] text-gray-500 mt-1.5">
              <MapPinIcon className="w-3.5 h-3.5" />
              {[req.locationCity, req.locationState].filter(Boolean).join(', ')}
            </p>
          )}
          {req.budgetMax && <p className="font-mono text-[16px] font-bold text-forest mt-2">{formatInrShort(req.budgetMax)}</p>}
          <p className="text-[13px] text-ink leading-relaxed mt-3">{req.description}</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-[13px] p-4">
          <h2 className="text-[14px] font-bold text-ink">{t('requirementDetail.quoteHeading')}</h2>
          <p className="text-[11.5px] text-gray-500 mt-0.5">{t('requirementDetail.quoteSubheading')}</p>

          {!user ? (
            <button onClick={() => navigate('/login')} className="mt-3 w-full h-[46px] bg-forest text-white rounded-[12px] text-[13.5px] font-bold">
              {t('common:nav.login')}
            </button>
          ) : !canQuote ? (
            <p className="mt-3 text-[12px] text-gray-500">{t('requirementDetail.needsSellerPrompt')}</p>
          ) : quoteSent ? (
            <div className="mt-3 rounded-[10px] bg-green-bg border border-green-bdr px-3 py-2.5 flex items-center gap-2">
              <CheckIcon className="w-4 h-4 text-green-txt" />
              <p className="text-[12px] font-semibold text-green-txt">{t('requirementDetail.quoteSentNotice')}</p>
            </div>
          ) : (
            <div className="mt-3 space-y-3">
              {quoteError && <p className="text-[12px] text-red-600 font-medium bg-red-50 border border-red-200 rounded-[10px] px-3 py-2">{quoteError}</p>}
              <select value={listingId} onChange={(e) => setListingId(e.target.value)} className={inputCls}>
                <option value="">{t('requirementDetail.selectListing')}</option>
                {myListings.map((l) => (
                  <option key={l.id} value={l.id}>{l.title}</option>
                ))}
              </select>
              <input type="number" min={0} value={price} onChange={(e) => setPrice(e.target.value)} placeholder={t('requirementDetail.priceLabel')} className={inputCls} />
              <textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder={t('requirementDetail.messageLabel')} rows={3} className={inputCls + ' h-auto py-3'} />
              <button onClick={submitQuote} disabled={submitting || !listingId} className="w-full h-[48px] bg-forest text-white rounded-[12px] text-[13.5px] font-bold disabled:opacity-50">
                {submitting ? t('requirementDetail.sending') : t('requirementDetail.sendQuote')}
              </button>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
