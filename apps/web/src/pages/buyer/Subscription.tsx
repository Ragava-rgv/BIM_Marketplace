import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
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
        if (!cancelled) setError(apiErrorMessage(err, t('buyer.subscription.errorLoad')));
      });
    return () => { cancelled = true; };
  }, [reload, t]);

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
            description: t('buyer.subscription.razorpayDescription', {
              planName: plan.displayName,
              quota: plan.contactViewQuota,
            }),
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
            // Sentinel string used only for internal control-flow (matched below to
            // silently swallow a user-initiated dismiss) — never rendered to the user.
            modal: { ondismiss: () => reject(new Error('Payment cancelled')) },
            theme: { color: '#1a56db' },
          });
          rzp.open();
        });
      } catch (err) {
        if ((err as Error).message !== 'Payment cancelled') {
          setPayError(apiErrorMessage(err, t('buyer.subscription.errorPaymentFailed')));
        }
      } finally {
        setPaying(false);
      }
    },
    [t],
  );

  const orderedPlans = [...plans].sort((a, b) => (a.isFree === b.isFree ? 0 : a.isFree ? -1 : 1));

  const FEATURE_ROWS: Array<{ label: string; check: (plan: BuyerSubscriptionPlanDto) => boolean }> = [
    { label: t('buyer.subscription.features.noExpiry'), check: (plan) => plan.durationDays == null },
    { label: t('buyer.subscription.features.autoAssigned'), check: (plan) => plan.isDefault },
    { label: t('buyer.subscription.features.carryOver'), check: (plan) => !plan.isFree },
    { label: t('buyer.subscription.features.prioritySupport'), check: (plan) => !plan.isFree },
  ];

  return (
    <div>
      <PageHeading
        eyebrow={t('buyer.subscription.eyebrow')}
        title={t('buyer.subscription.title')}
        description={t('buyer.subscription.description')}
      />

      {error && <div className="mb-5"><ErrorBanner message={error} /></div>}
      {success && (
        <div className="mb-5">
          <SuccessBanner message={t('buyer.subscription.successActivated')} />
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
            <MonoLabel className="text-copper">{t('buyer.subscription.currentPlanLabel')}</MonoLabel>
            <div className="mt-4 flex items-center justify-between">
              <div>
                <p className="font-display text-2xl font-medium text-navy">
                  {status.subscription.plan?.displayName ?? t('buyer.subscription.freePlanFallback')}
                </p>
                <p className="mt-1 text-sm text-navy/55">
                  {t('buyer.subscription.quotaLine', { count: status.quotaTotal })}
                  {status.expiresAt ? t('buyer.subscription.perCycle') : t('buyer.subscription.noExpirySuffix')}
                </p>
              </div>
              <span className="rounded-full bg-navy/[0.06] px-3 py-1 text-[12px] font-bold uppercase tracking-wide text-navy/50">
                {t(`common:status.subscription.${status.status}`)}
              </span>
            </div>

            <div className="mt-5 grid grid-cols-3 gap-3">
              {[
                { label: t('buyer.subscription.stats.quota'), value: status.quotaTotal },
                { label: t('buyer.subscription.stats.used'), value: status.quotaUsed },
                { label: t('buyer.subscription.stats.remaining'), value: status.quotaRemaining },
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
                {t('buyer.subscription.expiresLabel')}{' '}
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
                    {t('buyer.subscription.table.planHeader')}
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
                              /{plan.durationDays == null
                                ? t('buyer.subscription.table.perOnce')
                                : plan.durationDays === 30
                                  ? t('buyer.subscription.table.perMonth')
                                  : t('buyer.subscription.table.perDays', { days: plan.durationDays })}
                            </span>
                          )}
                        </p>
                        {isCurrent && (
                          <span className="mt-1.5 inline-block rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10.5px] font-bold uppercase tracking-wide text-emerald-700">
                            {t('buyer.subscription.table.currentBadge')}
                          </span>
                        )}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-navy/10">
                  <td className="px-5 py-3 font-semibold text-navy/60">{t('buyer.subscription.table.contactViewsLabel')}</td>
                  {orderedPlans.map((plan) => (
                    <td key={plan.id} className="px-5 py-3 text-center font-semibold text-navy">
                      {plan.contactViewQuota}
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-navy/10">
                  <td className="px-5 py-3 font-semibold text-navy/60">{t('buyer.subscription.table.durationLabel')}</td>
                  {orderedPlans.map((plan) => (
                    <td key={plan.id} className="px-5 py-3 text-center text-navy/70">
                      {plan.durationDays == null ? t('buyer.subscription.table.durationNoExpiry') : t('buyer.subscription.table.durationDays', { days: plan.durationDays })}
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
                            {isCurrent ? t('buyer.subscription.table.currentPlanCell') : t('buyer.subscription.table.assignedAutomatically')}
                          </span>
                        ) : (
                          <Button onClick={() => upgrade(plan)} disabled={paying} className="w-full">
                            {paying ? t('buyer.subscription.actions.processing') : isCurrent ? t('buyer.subscription.actions.renew') : t('buyer.subscription.actions.upgrade')}
                          </Button>
                        )}
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-center text-[11.5px] text-navy/45">{t('buyer.subscription.securePayment')}</p>
        </div>
      )}
    </div>
  );
}
