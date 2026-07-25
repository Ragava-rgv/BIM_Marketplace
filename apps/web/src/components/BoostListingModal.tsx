import { useEffect, useState } from 'react';
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
      .catch((err) => setError(apiErrorMessage(err, 'Could not load boost options.')));
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
        setError(apiErrorMessage(err, 'Payment failed. Please try again.'));
      }
    } finally {
      setPaying(null);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Boost this listing">
      <div className="space-y-4">
        {status?.isBoosted && status.boostExpiresAt && (
          <div className="flex items-start gap-2.5 rounded-xl border border-forest-bdr bg-forest-bg p-4 text-[13px] text-slate">
            <StarIcon className="mt-0.5 h-4 w-4 shrink-0 text-forest" />
            <p>
              This listing is currently <span className="font-semibold text-forest">boosted</span>, sorting above
              non-boosted listings until{' '}
              <span className="font-semibold text-ink">
                {new Date(status.boostExpiresAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
              . Purchasing another tier below will extend it.
            </p>
          </div>
        )}

        {error && <ErrorBanner message={error} />}
        {success && <SuccessBanner message="Boost activated — this listing now sorts above non-boosted listings." />}

        <div className="space-y-2.5">
          {plans.map((plan) => (
            <div key={plan.id} className="flex items-center justify-between rounded-xl border border-line p-4">
              <div>
                <p className="font-semibold text-ink">{plan.displayName}</p>
                <p className="mt-0.5 text-[12.5px] text-muted">
                  {plan.durationDays} days{plan.description ? ` · ${plan.description}` : ''}
                </p>
              </div>
              <Button onClick={() => purchase(plan)} disabled={paying !== null}>
                {paying === plan.id ? 'Processing...' : formatInr(String(plan.priceInr))}
              </Button>
            </div>
          ))}
          {plans.length === 0 && !error && (
            <p className="text-[13px] text-muted">No boost tiers are currently available.</p>
          )}
        </div>
      </div>
    </Modal>
  );
}
