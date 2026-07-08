import { useCallback, useEffect, useState } from 'react';
import type {
  RazorpayOrderDto,
  SubscriptionPlanConfigDto,
  SubscriptionStatusDto,
} from '@machinebazaar/shared';
import { SubscriptionPlan } from '@machinebazaar/shared';
import { api, apiErrorMessage } from '../../lib/api';
import { formatInr } from '../../lib/format';
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

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Razorpay: any;
  }
}

function loadRazorpayScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window.Razorpay !== 'undefined') { resolve(); return; }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Razorpay SDK'));
    document.body.appendChild(script);
  });
}

export function SellerSubscription() {
  const [status, setStatus] = useState<SubscriptionStatusDto | null>(null);
  const [plans, setPlans] = useState<SubscriptionPlanConfigDto[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      api.get<SubscriptionStatusDto>('/subscriptions/me'),
      api.get<SubscriptionPlanConfigDto[]>('/subscription-plans'),
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
    async (plan: SubscriptionPlanConfigDto) => {
      setPaying(true);
      setPayError(null);
      setSuccess(false);
      try {
        await loadRazorpayScript();
        const { data: orderData } = await api.post<RazorpayOrderDto>('/subscriptions/order', {
          planId: plan.id,
        });
        await new Promise<void>((resolve, reject) => {
          const rzp = new window.Razorpay({
            key: orderData.keyId,
            amount: orderData.amount,
            currency: orderData.currency,
            name: 'BIM',
            description: `${plan.displayName} — ${plan.listingQuota} listings / ${plan.durationDays} days`,
            order_id: orderData.razorpayOrderId,
            handler: async (resp: {
              razorpay_payment_id: string;
              razorpay_order_id: string;
              razorpay_signature: string;
            }) => {
              try {
                await api.post('/subscriptions/verify', {
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

  const freePlan = plans.find((p) => p.isFree);
  const paidPlans = plans.filter((p) => !p.isFree);

  return (
    <div>
      <PageHeading
        eyebrow="Seller workspace"
        title="Listing subscription"
        description="Manage how many machines you can list on BIM."
      />

      {error && <div className="mb-5"><ErrorBanner message={error} /></div>}
      {success && (
        <div className="mb-5">
          <SuccessBanner message="Subscription activated! Your listing quota has been updated." />
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
        <div className="max-w-2xl space-y-5">
          {/* Current status */}
          <Card>
            <MonoLabel className="text-copper">Current plan</MonoLabel>
            <div className="mt-4 flex items-center justify-between">
              <div>
                <p className="font-display text-2xl font-medium text-navy">
                  {status.subscription?.planConfig?.displayName ??
                    (status.plan === SubscriptionPlan.STANDARD ? 'Standard' : 'Free')}
                </p>
                <p className="mt-1 text-sm text-navy/55">
                  {status.listingQuota} listing slot{status.listingQuota !== 1 ? 's' : ''}
                  {status.plan === SubscriptionPlan.FREE ? ' — free forever' : ' / month'}
                </p>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-[12px] font-bold uppercase tracking-wide ${
                  status.plan === SubscriptionPlan.STANDARD
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-navy/[0.06] text-navy/50'
                }`}
              >
                {status.plan}
              </span>
            </div>

            <div className="mt-5 grid grid-cols-3 gap-3">
              {[
                { label: 'Listing quota', value: status.listingQuota },
                { label: 'Active listings', value: status.activeListingsCount },
                { label: 'Remaining slots', value: status.remainingSlots },
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

            {status.subscription && (
              <p className="mt-4 text-[13px] text-navy/55">
                Subscription expires:{' '}
                <span className="font-semibold text-navy">
                  {new Date(status.subscription.expiresAt).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </span>
              </p>
            )}
          </Card>

          {/* Plan cards */}
          <div className={`grid grid-cols-1 gap-4 sm:grid-cols-${Math.min(2, 1 + paidPlans.length)}`}>
            {/* Free plan */}
            {freePlan && (
              <Card>
                <div className="mb-3 flex items-center justify-between">
                  <p className="font-display text-lg font-medium text-navy">{freePlan.displayName}</p>
                  <span className="font-display text-xl font-medium text-navy">₹0</span>
                </div>
                {freePlan.description && (
                  <p className="mb-3 text-[12.5px] text-navy/55">{freePlan.description}</p>
                )}
                <ul className="space-y-2">
                  {[
                    `${freePlan.listingQuota} active listing${freePlan.listingQuota !== 1 ? 's' : ''}`,
                    'GST verification required',
                    'Admin-reviewed listings',
                    'Enquiry notifications',
                  ].map((feat) => (
                    <li key={feat} className="flex items-center gap-2 text-[13px] text-navy/70">
                      <CheckCircleIcon className="h-4 w-4 shrink-0 text-navy/30" />
                      {feat}
                    </li>
                  ))}
                </ul>
                {status.plan === SubscriptionPlan.FREE && (
                  <div className="mt-4 rounded-lg bg-navy/[0.04] px-3 py-2 text-center text-[12px] font-semibold text-navy/50">
                    Current plan
                  </div>
                )}
              </Card>
            )}

            {/* Paid plans */}
            {paidPlans.map((plan) => {
              const isCurrent =
                status.plan === SubscriptionPlan.STANDARD &&
                status.subscription?.planConfigId === plan.id;
              return (
                <Card key={plan.id} className="border-accent/20 bg-accent/[0.03]">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="font-display text-lg font-medium text-navy">{plan.displayName}</p>
                    <div className="text-right">
                      <span className="font-display text-xl font-medium text-navy">
                        {formatInr(String(plan.priceInr))}
                      </span>
                      <span className="ml-1 text-[12px] text-navy/45">
                        /{plan.durationDays === 30 ? 'month' : `${plan.durationDays}d`}
                      </span>
                    </div>
                  </div>
                  {plan.description && (
                    <p className="mb-3 text-[12.5px] text-navy/55">{plan.description}</p>
                  )}
                  <ul className="space-y-2">
                    {[
                      `${plan.listingQuota} active listing${plan.listingQuota !== 1 ? 's' : ''}`,
                      'Everything in Free',
                      'Priority listing review',
                      'Subcategory tagging',
                    ].map((feat) => (
                      <li key={feat} className="flex items-center gap-2 text-[13px] text-navy/70">
                        <CheckCircleIcon className="h-4 w-4 shrink-0 text-accent" />
                        {feat}
                      </li>
                    ))}
                  </ul>

                  <div className="mt-4">
                    <Button
                      className="w-full"
                      onClick={() => upgrade(plan)}
                      disabled={paying}
                    >
                      {paying
                        ? 'Processing...'
                        : isCurrent
                        ? 'Renew subscription'
                        : `Upgrade — ${formatInr(String(plan.priceInr))}/${plan.durationDays === 30 ? 'mo' : `${plan.durationDays}d`}`}
                    </Button>
                    <p className="mt-2 text-center text-[11.5px] text-navy/45">
                      Secure payment via Razorpay · {plan.durationDays}-day validity
                    </p>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
