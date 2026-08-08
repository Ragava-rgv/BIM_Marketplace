import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { ListingBoostStatusDto, PromotionPlanDto, RazorpayOrderDto } from '@machinebazaar/shared';
import { api, apiErrorMessage } from '../lib/api';
import { formatInr } from '../lib/format';
import { loadRazorpayScript } from '../lib/razorpay';
import { StarIcon } from './icons';

interface Props {
  listingId: string;
  open: boolean;
  onClose: () => void;
}

export function BoostSheet({ listingId, open, onClose }: Props) {
  const { t } = useTranslation();
  const [status, setStatus] = useState<ListingBoostStatusDto | null>(null);
  const [plans, setPlans] = useState<PromotionPlanDto[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [paying, setPaying] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setSuccess(false);
    Promise.all([
      api.get<ListingBoostStatusDto>(`/listing-boosts/${listingId}/status`),
      api.get<PromotionPlanDto[]>('/boost-plans'),
    ])
      .then(([statusRes, plansRes]) => {
        setStatus(statusRes.data);
        setPlans(plansRes.data);
      })
      .catch((err) => setError(apiErrorMessage(err, t('components.boostSheet.loadError'))));
  }, [open, listingId]);

  if (!open) return null;

  const purchase = async (plan: PromotionPlanDto) => {
    setPaying(plan.id);
    setError(null);
    setSuccess(false);
    try {
      await loadRazorpayScript();
      const { data: orderData } = await api.post<RazorpayOrderDto>(`/listing-boosts/${listingId}/order`, {
        planId: plan.id,
      });
      await new Promise<void>((resolve, reject) => {
        const rzp = new window.Razorpay({
          key: orderData.keyId,
          amount: orderData.amount,
          currency: orderData.currency,
          name: 'BIM',
          description: t('components.boostSheet.razorpayDescription', { planName: plan.displayName, days: plan.durationDays }),
          order_id: orderData.razorpayOrderId,
          handler: async (resp: {
            razorpay_payment_id: string;
            razorpay_order_id: string;
            razorpay_signature: string;
          }) => {
            try {
              await api.post(`/listing-boosts/${listingId}/verify`, {
                planId: plan.id,
                razorpayOrderId: resp.razorpay_order_id,
                razorpayPaymentId: resp.razorpay_payment_id,
                razorpaySignature: resp.razorpay_signature,
              });
              const { data } = await api.get<ListingBoostStatusDto>(`/listing-boosts/${listingId}/status`);
              setStatus(data);
              setSuccess(true);
              resolve();
            } catch (e) {
              reject(e);
            }
          },
          modal: { ondismiss: () => reject(new Error('Payment cancelled')) },
          theme: { color: '#E8820C' },
        });
        rzp.open();
      });
    } catch (err) {
      if ((err as Error).message !== 'Payment cancelled') {
        setError(apiErrorMessage(err, t('components.boostSheet.paymentFailedError')));
      }
    } finally {
      setPaying(null);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-[60] bg-black/40" onClick={onClose} />
      <div
        className="fixed bottom-0 left-0 right-0 z-[70] bg-white rounded-t-[24px] px-6 pt-5 max-h-[85vh] overflow-y-auto"
        style={{ paddingBottom: `calc(env(safe-area-inset-bottom) + 24px)` }}
      >
        <div className="w-10 h-1 rounded-full bg-gray-200 mx-auto mb-5" />
        <div className="flex items-start justify-between mb-4">
          <h2 className="text-[18px] font-extrabold text-ink tracking-[-0.3px]">{t('components.boostSheet.title')}</h2>
          <button onClick={onClose} aria-label={t('components.boostSheet.close')} className="text-gray-400 text-[20px] leading-none px-1">
            ×
          </button>
        </div>

        {status?.isBoosted && status.boostExpiresAt && (
          <div className="flex items-start gap-2.5 rounded-[13px] border border-forest-bdr bg-forest-bg px-4 py-3 mb-4 text-[12.5px] text-gray-600">
            <StarIcon className="mt-0.5 w-4 h-4 shrink-0 text-forest" />
            <p>
              {t('components.boostSheet.boostedNoticePrefix')} <span className="font-semibold text-forest">{t('components.boostSheet.boostedWord')}</span>{t('components.boostSheet.boostedNoticeMiddle')}{' '}
              <span className="font-semibold text-ink">
                {new Date(status.boostExpiresAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
              {t('components.boostSheet.boostedNoticeSuffix')}
            </p>
          </div>
        )}

        {error && (
          <p className="text-[12.5px] text-red-600 font-medium bg-red-50 border border-red-200 rounded-[10px] px-3 py-2.5 mb-3">
            {error}
          </p>
        )}
        {success && (
          <p className="text-[12.5px] text-green-txt font-medium bg-green-bg border border-green-bdr rounded-[10px] px-3 py-2.5 mb-3">
            {t('components.boostSheet.successMessage')}
          </p>
        )}

        <div className="space-y-2.5 mb-2">
          {plans.map((plan) => (
            <div key={plan.id} className="flex items-center justify-between rounded-[13px] border border-gray-200 px-4 py-3">
              <div>
                <p className="text-[13.5px] font-bold text-ink">{plan.displayName}</p>
                <p className="mt-0.5 text-[11.5px] text-gray-500">
                  {plan.durationDays} {t('components.boostSheet.days')}{plan.description ? ` · ${plan.description}` : ''}
                </p>
              </div>
              <button
                onClick={() => purchase(plan)}
                disabled={paying !== null}
                className="h-[38px] px-4 rounded-[10px] bg-forest text-white text-[13px] font-bold disabled:opacity-50"
              >
                {paying === plan.id ? t('components.boostSheet.processing') : formatInr(String(plan.priceInr))}
              </button>
            </div>
          ))}
          {plans.length === 0 && !error && (
            <p className="text-[12.5px] text-gray-500 text-center py-4">{t('components.boostSheet.noPlansAvailable')}</p>
          )}
        </div>
      </div>
    </>
  );
}
