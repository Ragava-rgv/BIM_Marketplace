import { useCallback, useEffect, useState } from 'react';
import type {
  BuyerSubscriptionPlanDto,
  BuyerSubscriptionStatusDto,
  RazorpayOrderDto,
} from '@machinebazaar/shared';
import { api, apiErrorMessage } from '../../lib/api';
import { formatInr } from '../../lib/format';
import { loadRazorpayScript } from '../../lib/razorpay';
import {
  Button,
  Card,
  ErrorBanner,
  LoadingBlock,
  MonoLabel,
  PageHeading,
  SuccessBanner,
} from '../../components/ui';
import { CheckCircleIcon } from '../../components/icons';

export function BuyerSubscription() {
  const [status, setStatus] = useState<BuyerSubscriptionStatusDto | null>(null);
  const [plans, setPlans] = useState<BuyerSubscriptionPlanDto[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      api.get<BuyerSubscriptionStatusDto>('/buyer-subscriptions/me'),
      api.get<BuyerSubscriptionPlanDto[]>('/buyer-subscription-plans'),
    ])
      .then(([statusRes, plansRes]) => {
        if (!cancelled) {
          setStatus(statusRes.data);
          setPlans(plansRes.data);
        }
      })
      .catch((err) => {
        if (!cancelled) setError(apiErrorMessage(err, 'Could not load subscription details.'));
      });
    return () => { cancelled = true; };
  }, [reload]);

  const upgrade = useCallback(
    async (plan: BuyerSubscriptionPlanDto) => {
      setPaying(true);
      setPayError(null);
      setSuccess(false);
      try {
        await loadRazorpayScript();
        const { data: orderData } = await api.post<RazorpayOrderDto>('/buyer-subscriptions/order', {
          planId: plan.id,
        });
        await new Promise<void>((resolve, reject) => {
          const rzp = new window.Razorpay({
            key: orderData.keyId,
            amount: orderData.amount,
            currency: orderData.currency,
            name: 'BIM',
            description: `${plan.displayName} — ${plan.contactViewQuota} contact views`,
            order_id: orderData.razorpayOrderId,
            handler: async (resp: {
              razorpay_payment_id: string;
              razorpay_order_id: string;
              razorpay_signature: string;
            }) => {
              try {
                await api.post('/buyer-subscriptions/verify', {
                  planId: plan.id,
                  razorpayOrderId: resp.razorpay_order_id,
                  razorpayPaymentId: resp.razorpay_payment_id,
                  razorpaySignature: resp.razorpay_signature,
                });
                setSuccess(true);
                setReload((n) => n + 1);
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
          setPayError(apiErrorMessage(err, 'Payment failed. Please try again.'));
        }
      } finally {
        setPaying(false);
      }
    },
    [],
  );

  const orderedPlans = [...plans].sort((a, b) => (a.isFree === b.isFree ? 0 : a.isFree ? -1 : 1));

  const FEATURE_ROWS: Array<{ label: string; check: (plan: BuyerSubscriptionPlanDto) => boolean }> = [
    { label: 'No expiry', check: (plan) => plan.durationDays == null },
    { label: 'Assigned automatically on signup', check: (plan) => plan.isDefault },
    { label: 'Unused views carry over on upgrade', check: (plan) => !plan.isFree },
    { label: 'Priority support', check: (plan) => !plan.isFree },
  ];

  return (
    <div>
      <PageHeading
        eyebrow="Buyer workspace"
        title="Contact view subscription"
        description="Manage how many seller contacts you can reveal on BIM."
      />

      {error && <div className="mb-5"><ErrorBanner message={error} /></div>}
      {success && (
        <div className="mb-5">
          <SuccessBanner message="Subscription activated! Your contact-view quota has been updated." />
        </div>
      )}
      {payError && (
        <div className="mb-5">
          <ErrorBanner message={payError} />
        </div>
      )}

      {!status ? (
        <LoadingBlock />
      ) : (
        <div className="space-y-6">
          {/* Current status */}
          <Card className="max-w-2xl">
            <MonoLabel className="text-copper">Current plan</MonoLabel>
            <div className="mt-4 flex items-center justify-between">
              <div>
                <p className="font-display text-2xl font-medium text-navy">
                  {status.subscription.plan?.displayName ?? 'Free'}
                </p>
                <p className="mt-1 text-sm text-navy/55">
                  {status.quotaTotal} contact view{status.quotaTotal !== 1 ? 's' : ''}
                  {status.expiresAt ? ' / cycle' : ' — no expiry'}
                </p>
              </div>
              <span className="rounded-full bg-navy/[0.06] px-3 py-1 text-[12px] font-bold uppercase tracking-wide text-navy/50">
                {status.status}
              </span>
            </div>

            <div className="mt-5 grid grid-cols-3 gap-3">
              {[
                { label: 'Quota', value: status.quotaTotal },
                { label: 'Used', value: status.quotaUsed },
                { label: 'Remaining', value: status.quotaRemaining },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-xl border border-dashed border-navy/10 bg-white p-4 text-center"
                >
                  <p className="font-display text-3xl font-medium text-navy">{item.value}</p>
                  <MonoLabel className="mt-1">{item.label}</MonoLabel>
                </div>
              ))}
            </div>

            {status.expiresAt && (
              <p className="mt-4 text-[13px] text-navy/55">
                Subscription expires:{' '}
                <span className="font-semibold text-navy">
                  {new Date(status.expiresAt).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </span>
              </p>
            )}
          </Card>

          {/* Plan comparison table */}
          <div className="overflow-x-auto rounded-2xl border border-navy/10 bg-white">
            <table className="w-full min-w-[560px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-navy/10 bg-navy/[0.02]">
                  <th className="w-48 px-5 py-4 text-left align-bottom text-xs font-semibold uppercase tracking-wide text-navy/40">
                    Plan
                  </th>
                  {orderedPlans.map((plan) => {
                    const isCurrent = status.subscription.planId === plan.id;
                    return (
                      <th key={plan.id} className="px-5 py-4 text-center align-bottom">
                        <p className="font-display text-lg font-medium text-navy">{plan.displayName}</p>
                        <p className="mt-1 font-display text-xl font-medium text-navy">
                          {plan.isFree ? '₹0' : formatInr(String(plan.priceInr))}
                          {!plan.isFree && (
                            <span className="ml-1 text-[12px] font-normal text-navy/45">
                              /{plan.durationDays == null ? 'once' : plan.durationDays === 30 ? 'mo' : `${plan.durationDays}d`}
                            </span>
                          )}
                        </p>
                        {isCurrent && (
                          <span className="mt-1.5 inline-block rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10.5px] font-bold uppercase tracking-wide text-emerald-700">
                            Current
                          </span>
                        )}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-navy/10">
                  <td className="px-5 py-3 font-semibold text-navy/60">Contact views</td>
                  {orderedPlans.map((plan) => (
                    <td key={plan.id} className="px-5 py-3 text-center font-semibold text-navy">
                      {plan.contactViewQuota}
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-navy/10">
                  <td className="px-5 py-3 font-semibold text-navy/60">Duration</td>
                  {orderedPlans.map((plan) => (
                    <td key={plan.id} className="px-5 py-3 text-center text-navy/70">
                      {plan.durationDays == null ? 'No expiry' : `${plan.durationDays} days`}
                    </td>
                  ))}
                </tr>
                {FEATURE_ROWS.map((row) => (
                  <tr key={row.label} className="border-b border-navy/10">
                    <td className="px-5 py-3 text-navy/60">{row.label}</td>
                    {orderedPlans.map((plan) => (
                      <td key={plan.id} className="px-5 py-3 text-center">
                        {row.check(plan) ? (
                          <CheckCircleIcon className="mx-auto h-4 w-4 text-forest" />
                        ) : (
                          <span className="text-navy/20">—</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
                <tr>
                  <td className="px-5 py-4" />
                  {orderedPlans.map((plan) => {
                    const isCurrent = status.subscription.planId === plan.id;
                    return (
                      <td key={plan.id} className="px-5 py-4 text-center">
                        {plan.isFree ? (
                          <span className="text-[12px] font-semibold text-navy/40">
                            {isCurrent ? 'Current plan' : 'Assigned automatically'}
                          </span>
                        ) : (
                          <Button onClick={() => upgrade(plan)} disabled={paying} className="w-full">
                            {paying ? 'Processing...' : isCurrent ? 'Renew' : 'Upgrade'}
                          </Button>
                        )}
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-center text-[11.5px] text-navy/45">Secure payment via Razorpay</p>
        </div>
      )}
    </div>
  );
}
