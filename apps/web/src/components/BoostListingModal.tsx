import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { ListingBoostStatusDto, PromotionPlanDto, RazorpayOrderDto } from '@machinebazaar/shared';
import { api, apiErrorMessage } from '../lib/api';
import { formatInr } from '../lib/format';
import { loadRazorpayScript } from '../lib/razorpay';
import { Button, ErrorBanner, Modal, SuccessBanner } from './ui';
import { StarIcon } from './icons';

export function BoostListingModal({
  listingId,
  open,
  onClose,
}: {
  listingId: string;
  open: boolean;
  onClose: () => void;
}) {
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
      .catch((err) => setError(apiErrorMessage(err, t('components.boostListingModal.loadError'))));
  }, [open, listingId]);

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
          description: `${plan.displayName} — boost this listing for ${plan.durationDays} days`,
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
          theme: { color: '#1a56db' },
        });
        rzp.open();
      });
    } catch (err) {
      if ((err as Error).message !== 'Payment cancelled') {
        setError(apiErrorMessage(err, t('components.boostListingModal.paymentFailed')));
      }
    } finally {
      setPaying(null);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={t('components.boostListingModal.title')}>
      <div className="space-y-4">
        {status?.isBoosted && status.boostExpiresAt && (
          <div className="flex items-start gap-2.5 rounded-xl border border-forest-bdr bg-forest-bg p-4 text-[13px] text-slate">
            <StarIcon className="mt-0.5 h-4 w-4 shrink-0 text-forest" />
            <p>
              {t('components.boostListingModal.boostedNotice.prefix')}{' '}
              <span className="font-semibold text-forest">{t('components.boostListingModal.boostedNotice.boostedWord')}</span>
              {t('components.boostListingModal.boostedNotice.middle')}{' '}
              <span className="font-semibold text-ink">
                {new Date(status.boostExpiresAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
              {t('components.boostListingModal.boostedNotice.suffix')}
            </p>
          </div>
        )}

        {error && <ErrorBanner message={error} />}
        {success && <SuccessBanner message={t('components.boostListingModal.activatedSuccess')} />}

        <div className="space-y-2.5">
          {plans.map((plan) => (
            <div key={plan.id} className="flex items-center justify-between rounded-xl border border-line p-4">
              <div>
                <p className="font-semibold text-ink">{plan.displayName}</p>
                <p className="mt-0.5 text-[12.5px] text-muted">
                  {t('components.boostListingModal.durationDays', { count: plan.durationDays })}{plan.description ? ` · ${plan.description}` : ''}
                </p>
              </div>
              <Button onClick={() => purchase(plan)} disabled={paying !== null}>
                {paying === plan.id ? t('components.boostListingModal.processing') : formatInr(String(plan.priceInr))}
              </Button>
            </div>
          ))}
          {plans.length === 0 && !error && (
            <p className="text-[13px] text-muted">{t('components.boostListingModal.noTiersAvailable')}</p>
          )}
        </div>
      </div>
    </Modal>
  );
}
