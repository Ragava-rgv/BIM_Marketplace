import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type {
  RazorpayOrderDto,
  SubscriptionPlanConfigDto,
  SubscriptionStatusDto,
} from '../../shared';
import { SubscriptionPlan } from '../../shared';
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

const FEATURE_ROWS = [
  { key: 'gstVerification', labelKey: 'seller.subscription.features.gstVerification' },
  { key: 'adminReviewed', labelKey: 'seller.subscription.features.adminReviewed' },
  { key: 'enquiryNotifications', labelKey: 'seller.subscription.features.enquiryNotifications' },
  { key: 'priorityReview', labelKey: 'seller.subscription.features.priorityReview' },
  { key: 'subcategoryTagging', labelKey: 'seller.subscription.features.subcategoryTagging' },
] as const;
const freeFeatureSupport = [true, true, true, false, false];

export function SellerSubscription() {
  const { t } = useTranslation();
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
        if (!cancelled) setError(apiErrorMessage(err, t('seller.subscription.errors.loadFailed')));
      });
    return () => { cancelled = true; };
  }, [reload, t]);

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
          setPayError(apiErrorMessage(err, t('seller.subscription.errors.paymentFailed')));
        }
      } finally {
        setPaying(false);
      }
    },
    [t],
  );

  const orderedPlans = [...plans].sort((a, b) => (a.isFree === b.isFree ? 0 : a.isFree ? -1 : 1));

  return (
    <div>
      <PageHeading
        eyebrow={t('seller.subscription.eyebrow')}
        title={t('seller.subscription.title')}
        description={t('seller.subscription.description')}
      />

      {error && <div className="mb-5"><ErrorBanner message={error} /></div>}
      {success && (
        <div className="mb-5">
          <SuccessBanner message={t('seller.subscription.activatedMessage')} />
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
            <MonoLabel className="text-copper">{t('seller.subscription.currentPlan')}</MonoLabel>
            <div className="mt-4 flex items-center justify-between">
              <div>
                <p className="font-display text-2xl font-medium text-navy">
                  {status.subscription?.planConfig?.displayName ??
                    (status.plan === SubscriptionPlan.STANDARD ? t('common:plan.STANDARD') : t('common:plan.FREE'))}
                </p>
                <p className="mt-1 text-sm text-navy/55">
                  {t('seller.subscription.listingSlots', { count: status.listingQuota })}
                  {status.plan === SubscriptionPlan.FREE ? ` — ${t('seller.subscription.freeForever')}` : ` / ${t('seller.subscription.perMonth')}`}
                </p>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-[12px] font-bold uppercase tracking-wide ${
                  status.plan === SubscriptionPlan.STANDARD
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-navy/[0.06] text-navy/50'
                }`}
              >
                {t(`common:plan.${status.plan}`)}
              </span>
            </div>

            <div className="mt-5 grid grid-cols-3 gap-3">
              {[
                { label: t('seller.subscription.stats.listingQuota'), value: status.listingQuota },
                { label: t('seller.subscription.stats.activeListings'), value: status.activeListingsCount },
                { label: t('seller.subscription.stats.remainingSlots'), value: status.remainingSlots },
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
                {t('seller.subscription.expiresLabel')}{' '}
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

          {/* Plan comparison table */}
          <div className="overflow-x-auto rounded-2xl border border-navy/10 bg-white">
            <table className="w-full min-w-[560px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-navy/10 bg-navy/[0.02]">
                  <th className="w-40 px-5 py-4 text-left align-bottom text-xs font-semibold uppercase tracking-wide text-navy/40">
                    {t('seller.subscription.table.plan')}
                  </th>
                  {orderedPlans.map((plan) => {
                    const isCurrent =
                      (status.plan === SubscriptionPlan.FREE && plan.isFree) ||
                      (status.plan === SubscriptionPlan.STANDARD && status.subscription?.planConfigId === plan.id);
                    return (
                      <th key={plan.id} className="px-5 py-4 text-center align-bottom">
                        <p className="font-display text-lg font-medium text-navy">{plan.displayName}</p>
                        <p className="mt-1 font-display text-xl font-medium text-navy">
                          {plan.isFree ? '₹0' : formatInr(String(plan.priceInr))}
                          {!plan.isFree && (
                            <span className="ml-1 text-[12px] font-normal text-navy/45">
                              /{plan.durationDays === 30 ? t('seller.subscription.abbrev.month') : t('seller.subscription.abbrev.days', { count: plan.durationDays })}
                            </span>
                          )}
                        </p>
                        {isCurrent && (
                          <span className="mt-1.5 inline-block rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10.5px] font-bold uppercase tracking-wide text-emerald-700">
                            {t('seller.subscription.current')}
                          </span>
                        )}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-navy/10">
                  <td className="px-5 py-3 font-semibold text-navy/60">{t('seller.subscription.table.listingQuota')}</td>
                  {orderedPlans.map((plan) => (
                    <td key={plan.id} className="px-5 py-3 text-center font-semibold text-navy">
                      {plan.listingQuota}
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-navy/10">
                  <td className="px-5 py-3 font-semibold text-navy/60">{t('seller.subscription.table.duration')}</td>
                  {orderedPlans.map((plan) => (
                    <td key={plan.id} className="px-5 py-3 text-center text-navy/70">
                      {t('seller.subscription.daysCount', { count: plan.durationDays })}
                    </td>
                  ))}
                </tr>
                {FEATURE_ROWS.map((feature, idx) => (
                  <tr key={feature.key} className="border-b border-navy/10">
                    <td className="px-5 py-3 text-navy/60">{t(feature.labelKey)}</td>
                    {orderedPlans.map((plan) => {
                      const has = plan.isFree ? freeFeatureSupport[idx] : true;
                      return (
                        <td key={plan.id} className="px-5 py-3 text-center">
                          {has ? (
                            <CheckCircleIcon className="mx-auto h-4 w-4 text-forest" />
                          ) : (
                            <span className="text-navy/20">—</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
                <tr>
                  <td className="px-5 py-4" />
                  {orderedPlans.map((plan) => {
                    const isCurrent =
                      (status.plan === SubscriptionPlan.FREE && plan.isFree) ||
                      (status.plan === SubscriptionPlan.STANDARD && status.subscription?.planConfigId === plan.id);
                    return (
                      <td key={plan.id} className="px-5 py-4 text-center">
                        {plan.isFree ? (
                          <span className="text-[12px] font-semibold text-navy/40">
                            {isCurrent ? t('seller.subscription.currentPlanLabel') : t('seller.subscription.alwaysIncluded')}
                          </span>
                        ) : (
                          <Button onClick={() => upgrade(plan)} disabled={paying} className="w-full">
                            {paying ? t('seller.subscription.processing') : isCurrent ? t('seller.subscription.renew') : t('seller.subscription.upgrade')}
                          </Button>
                        )}
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-center text-[11.5px] text-navy/45">{t('seller.subscription.securePayment')}</p>
        </div>
      )}
    </div>
  );
}
