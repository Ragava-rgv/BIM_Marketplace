import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { SubscriptionStatusDto, SubscriptionPlanConfigDto, RazorpayOrderDto } from '@machinebazaar/shared';
import { api, apiErrorMessage } from '../../lib/api';
import { AppLayout } from '../../components/AppLayout';
import { formatInr, formatDate } from '../../lib/format';
import { CheckIcon, ChevronRightIcon } from '../../components/icons';

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if ((window as Record<string, unknown>).Razorpay) { resolve(true); return; }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export function SellerSubscription() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<SubscriptionStatusDto | null>(null);
  const [plans, setPlans] = useState<SubscriptionPlanConfigDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const statusRef = useRef(status);
  statusRef.current = status;

  const fetchStatus = async () => {
    const [s, p] = await Promise.all([
      api.get<SubscriptionStatusDto>('/subscriptions/me').then(({ data }) => data),
      api.get<SubscriptionPlanConfigDto[]>('/subscription-plans').then(({ data }) => data),
    ]);
    setStatus(s);
    setPlans(p);
  };

  useEffect(() => {
    fetchStatus().catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleUpgrade = async (plan: SubscriptionPlanConfigDto) => {
    if (plan.isFree) return;
    setUpgrading(plan.id);
    setError(null);
    setSuccessMsg(null);
    try {
      const loaded = await loadRazorpayScript();
      if (!loaded) {
        setError('Could not load payment gateway. Please check your connection and try again.');
        setUpgrading(null);
        return;
      }

      const { data: order } = await api.post<RazorpayOrderDto>('/subscriptions/order', {
        planId: plan.id,
      });

      const rzp = new (window as Record<string, unknown>).Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: 'BIM',
        description: `${plan.displayName} subscription`,
        order_id: order.razorpayOrderId,
        handler: async (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
          try {
            await api.post('/subscriptions/verify', {
              planId: plan.id,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });
            await fetchStatus();
            setSuccessMsg(`${plan.displayName} plan activated successfully!`);
          } catch (err) {
            setError(apiErrorMessage(err, 'Payment completed but activation failed. Contact support.'));
          } finally {
            setUpgrading(null);
          }
        },
        modal: {
          ondismiss: () => setUpgrading(null),
        },
        prefill: {},
        theme: { color: '#E8820C' },
      });
      (rzp as { open: () => void }).open();
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not initiate payment. Please try again.'));
      setUpgrading(null);
    }
  };

  return (
    <AppLayout>
      <div className="bg-white border-b border-gray-200 px-4 pt-4 pb-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="w-8 h-8 flex items-center justify-center">
          <ChevronRightIcon className="w-4 h-4 text-gray-500 rotate-180" />
        </button>
        <div>
          <h1 className="text-[17px] font-extrabold text-ink tracking-[-0.3px]">Subscription</h1>
          <p className="text-[11px] text-gray-500">Manage your listing plan</p>
        </div>
      </div>

      <div className="px-4 pt-4 pb-6 space-y-4">
        {loading ? (
          <>
            <div className="bg-gray-100 rounded-[13px] h-[130px] animate-pulse" />
            <div className="bg-gray-100 rounded-[13px] h-[160px] animate-pulse" />
          </>
        ) : (
          <>
            {error && (
              <p className="text-[12px] text-red-600 font-medium bg-red-50 border border-red-200 rounded-[10px] px-3 py-2.5">
                {error}
              </p>
            )}
            {successMsg && (
              <p className="text-[12px] text-green-txt font-medium bg-green-bg border border-green-bdr rounded-[10px] px-3 py-2.5">
                {successMsg}
              </p>
            )}

            {/* Current plan card */}
            {status && (
              <div className="bg-forest rounded-[13px] px-4 py-4">
                <p className="font-mono text-[9px] text-[#9BD8B8] font-semibold tracking-[0.1em] mb-2">CURRENT PLAN</p>
                <p className="text-[18px] font-extrabold text-white mb-1">
                  {status.subscription?.planConfig?.displayName ?? status.plan}
                </p>
                <div className="grid grid-cols-3 gap-2 mt-3">
                  {[
                    ['Quota', `${status.listingQuota} listing${status.listingQuota !== 1 ? 's' : ''}`],
                    ['Active', String(status.activeListingsCount)],
                    ['Remaining', String(status.remainingSlots)],
                  ].map(([label, value]) => (
                    <div key={label} className="bg-white/10 rounded-[8px] px-2 py-2 text-center">
                      <p className="font-mono text-[8px] text-white/55 mb-0.5">{label.toUpperCase()}</p>
                      <p className="text-[13px] font-bold text-white">{value}</p>
                    </div>
                  ))}
                </div>
                {status.subscription?.expiresAt && (
                  <p className="text-[11px] text-white/55 mt-3">
                    Expires {formatDate(status.subscription.expiresAt)}
                  </p>
                )}
              </div>
            )}

            {/* Plan cards */}
            {plans.filter((p) => p.isActive).map((plan) => {
              const isCurrent = status?.subscription?.planConfig?.id === plan.id ||
                (plan.isFree && !status?.subscription);
              const isUpgrading = upgrading === plan.id;

              return (
                <div key={plan.id}
                  className={`bg-white border rounded-[13px] overflow-hidden ${
                    isCurrent ? 'border-forest' : 'border-gray-200'
                  }`}
                >
                  <div className={`px-4 py-3 ${isCurrent ? 'bg-forest-bg' : 'bg-white'}`}>
                    <div className="flex items-center justify-between mb-1">
                      <p className={`text-[15px] font-extrabold ${isCurrent ? 'text-forest' : 'text-ink'}`}>
                        {plan.displayName}
                      </p>
                      {isCurrent && (
                        <span className="text-[9.5px] font-bold text-forest bg-forest/10 px-2 py-0.5 rounded-full">
                          CURRENT
                        </span>
                      )}
                    </div>
                    <p className={`text-[12.5px] ${isCurrent ? 'text-forest/70' : 'text-gray-500'}`}>
                      {plan.isFree ? 'Free forever' : `${formatInr(plan.priceInr)} / ${plan.durationDays} days`}
                    </p>
                  </div>

                  <div className="px-4 py-3 border-t border-gray-100">
                    <div className="space-y-2 mb-3">
                      <div className="flex items-center gap-2">
                        <CheckIcon className="w-3.5 h-3.5 text-forest flex-shrink-0" />
                        <p className="text-[12px] text-gray-600">
                          Up to {plan.listingQuota} active listing{plan.listingQuota !== 1 ? 's' : ''}
                        </p>
                      </div>
                      {!plan.isFree && (
                        <>
                          <div className="flex items-center gap-2">
                            <CheckIcon className="w-3.5 h-3.5 text-forest flex-shrink-0" />
                            <p className="text-[12px] text-gray-600">Priority admin review</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <CheckIcon className="w-3.5 h-3.5 text-forest flex-shrink-0" />
                            <p className="text-[12px] text-gray-600">Featured in search results</p>
                          </div>
                        </>
                      )}
                      {plan.description && (
                        <p className="text-[11px] text-gray-400">{plan.description}</p>
                      )}
                    </div>

                    {!plan.isFree && (
                      <button
                        onClick={() => handleUpgrade(plan)}
                        disabled={isCurrent || isUpgrading !== false}
                        className={`w-full h-[44px] rounded-[11px] text-[13.5px] font-bold disabled:opacity-50 ${
                          isCurrent ? 'bg-gray-100 text-gray-500' : 'bg-forest text-white'
                        }`}
                      >
                        {isUpgrading
                          ? 'Opening payment...'
                          : isCurrent
                            ? 'Current plan'
                            : status?.subscription
                              ? 'Renew / Upgrade'
                              : `Upgrade to ${plan.displayName}`}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>
    </AppLayout>
  );
}



