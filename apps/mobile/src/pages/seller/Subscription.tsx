import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { SubscriptionStatusDto, SubscriptionPlanConfigDto, RazorpayOrderDto } from '@machinebazaar/shared';
import { api, apiErrorMessage } from '../../lib/api';
import { AppLayout } from '../../components/AppLayout';
import { formatInr, formatDate } from '../../lib/format';
import { CheckIcon, ChevronRightIcon } from '../../components/icons';
import { loadRazorpayScript } from '../../lib/razorpay';

export function SellerSubscription() {
  const { t } = useTranslation();
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
      try {
        await loadRazorpayScript();
      } catch {
        setError(t('seller.subscription.error.loadPaymentGateway'));
        setUpgrading(null);
        return;
      }

      const { data: order } = await api.post<RazorpayOrderDto>('/subscriptions/order', {
        planId: plan.id,
      });

      const rzp = new window.Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: 'BIM',
        description: t('seller.subscription.razorpayDescription', { planName: plan.displayName }),
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
            setSuccessMsg(t('seller.subscription.success.planActivated', { planName: plan.displayName }));
          } catch (err) {
            setError(apiErrorMessage(err, t('seller.subscription.error.activationFailed')));
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
      rzp.open();
    } catch (err) {
      setError(apiErrorMessage(err, t('seller.subscription.error.initiateFailed')));
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
          <h1 className="text-[17px] font-extrabold text-ink tracking-[-0.3px]">{t('seller.subscription.header.title')}</h1>
          <p className="text-[11px] text-gray-500">{t('seller.subscription.header.subtitle')}</p>
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
                <p className="font-mono text-[9px] text-[#9BD8B8] font-semibold tracking-[0.1em] mb-2">{t('seller.subscription.currentPlan.heading')}</p>
                <p className="text-[18px] font-extrabold text-white mb-1">
                  {status.subscription?.planConfig?.displayName ?? status.plan}
                </p>
                <div className="grid grid-cols-3 gap-2 mt-3">
                  {[
                    [t('seller.subscription.currentPlan.quota'), t('seller.subscription.currentPlan.listingCount', { count: status.listingQuota })],
                    [t('seller.subscription.currentPlan.active'), String(status.activeListingsCount)],
                    [t('seller.subscription.currentPlan.remaining'), String(status.remainingSlots)],
                  ].map(([label, value]) => (
                    <div key={label} className="bg-white/10 rounded-[8px] px-2 py-2 text-center">
                      <p className="font-mono text-[8px] text-white/55 mb-0.5">{label.toUpperCase()}</p>
                      <p className="text-[13px] font-bold text-white">{value}</p>
                    </div>
                  ))}
                </div>
                {status.subscription?.expiresAt && (
                  <p className="text-[11px] text-white/55 mt-3">
                    {t('seller.subscription.currentPlan.expires', { date: formatDate(status.subscription.expiresAt) })}
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
                          {t('seller.subscription.plan.current')}
                        </span>
                      )}
                    </div>
                    <p className={`text-[12.5px] ${isCurrent ? 'text-forest/70' : 'text-gray-500'}`}>
                      {plan.isFree ? t('seller.subscription.plan.freeForever') : t('seller.subscription.plan.priceDuration', { price: formatInr(plan.priceInr), days: plan.durationDays })}
                    </p>
                  </div>

                  <div className="px-4 py-3 border-t border-gray-100">
                    <div className="space-y-2 mb-3">
                      <div className="flex items-center gap-2">
                        <CheckIcon className="w-3.5 h-3.5 text-forest flex-shrink-0" />
                        <p className="text-[12px] text-gray-600">
                          {t('seller.subscription.plan.upToListings', { count: plan.listingQuota })}
                        </p>
                      </div>
                      {!plan.isFree && (
                        <>
                          <div className="flex items-center gap-2">
                            <CheckIcon className="w-3.5 h-3.5 text-forest flex-shrink-0" />
                            <p className="text-[12px] text-gray-600">{t('seller.subscription.plan.priorityReview')}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <CheckIcon className="w-3.5 h-3.5 text-forest flex-shrink-0" />
                            <p className="text-[12px] text-gray-600">{t('seller.subscription.plan.featuredSearch')}</p>
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
                          ? t('seller.subscription.plan.openingPayment')
                          : isCurrent
                            ? t('seller.subscription.plan.currentPlanButton')
                            : status?.subscription
                              ? t('seller.subscription.plan.renewUpgrade')
                              : t('seller.subscription.plan.upgradeTo', { planName: plan.displayName })}
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



