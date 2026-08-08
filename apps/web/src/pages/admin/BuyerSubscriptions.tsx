import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { BuyerSubscriptionDto, PaginatedResult } from '@machinebazaar/shared';
import { api, apiErrorMessage } from '../../lib/api';
import {
  Button,
  EmptyState,
  ErrorBanner,
  Field,
  Input,
  LoadingBlock,
  Modal,
  PageHeading,
  SuccessBanner,
  Textarea,
} from '../../components/ui';
import { SearchIcon } from '../../components/icons';

function AdjustQuotaModal({
  subscription,
  onClose,
  onSaved,
}: {
  subscription: BuyerSubscriptionDto;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { t } = useTranslation();
  const [delta, setDelta] = useState('0');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const newTotal = subscription.quotaTotal + (Number(delta) || 0);
  const valid = Number(delta) !== 0 && reason.trim().length > 0 && newTotal >= subscription.quotaUsed;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) return;
    setSubmitting(true);
    setError(null);
    try {
      await api.patch(`/admin/buyer-subscriptions/${subscription.id}/adjust-quota`, {
        delta: Number(delta),
        reason: reason.trim(),
      });
      onSaved();
    } catch (err) {
      setError(apiErrorMessage(err, t('admin.buyerSubscriptions.adjustError')));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open onClose={onClose} title={t('admin.buyerSubscriptions.adjustQuotaTitle', { buyer: subscription.buyer?.fullName ?? t('admin.buyerSubscriptions.buyerFallback') })}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <ErrorBanner message={error} />}
        <p className="text-sm text-navy/60">
          {t('admin.buyerSubscriptions.currentQuotaPrefix')} <strong>{t('admin.buyerSubscriptions.quotaUsedOf', { used: subscription.quotaUsed, total: subscription.quotaTotal })}</strong> {t('admin.buyerSubscriptions.used')}
        </p>
        <Field label={t('admin.buyerSubscriptions.fields.adjustment')} hint={t('admin.buyerSubscriptions.fields.adjustmentHint')}>
          <Input
            type="number"
            value={delta}
            onChange={(e) => setDelta(e.target.value)}
            required
          />
        </Field>
        <p className="text-[12.5px] text-navy/55">
          {t('admin.buyerSubscriptions.newQuotaTotalPrefix')} <strong>{newTotal}</strong>
          {newTotal < subscription.quotaUsed && (
            <span className="text-red-600"> {t('admin.buyerSubscriptions.cannotBeLessThanUsed', { used: subscription.quotaUsed })}</span>
          )}
        </p>
        <Field label={t('admin.buyerSubscriptions.fields.reason')} hint={t('admin.buyerSubscriptions.fields.reasonHint')}>
          <Textarea
            rows={2}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={t('admin.buyerSubscriptions.fields.reasonPlaceholder')}
            required
          />
        </Field>
        <div className="flex gap-3">
          <Button type="submit" disabled={!valid || submitting}>
            {submitting ? t('admin.buyerSubscriptions.saving') : t('admin.buyerSubscriptions.applyAdjustment')}
          </Button>
          <Button type="button" variant="ghost" onClick={onClose}>
            {t('common:common.button.cancel')}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export function AdminBuyerSubscriptions() {
  const { t } = useTranslation();
  const [result, setResult] = useState<PaginatedResult<BuyerSubscriptionDto> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [reload, setReload] = useState(0);
  const [adjusting, setAdjusting] = useState<BuyerSubscriptionDto | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api
      .get<PaginatedResult<BuyerSubscriptionDto>>('/admin/buyer-subscriptions', {
        params: { search: search || undefined, page, pageSize: 20 },
      })
      .then(({ data }) => { if (!cancelled) setResult(data); })
      .catch((err) => {
        if (!cancelled) setError(apiErrorMessage(err, t('admin.buyerSubscriptions.loadError')));
      });
    return () => { cancelled = true; };
  }, [search, page, reload, t]);

  const totalPages = result ? Math.max(1, Math.ceil(result.total / result.pageSize)) : 1;

  return (
    <div>
      <PageHeading
        eyebrow={t('admin.buyerSubscriptions.eyebrow')}
        title={t('admin.buyerSubscriptions.title')}
        description={t('admin.buyerSubscriptions.description')}
      />

      {error && <div className="mb-5"><ErrorBanner message={error} /></div>}
      {saveSuccess && (
        <div className="mb-5">
          <SuccessBanner message={t('admin.buyerSubscriptions.adjustSuccess')} />
        </div>
      )}

      <div className="mb-5 max-w-sm">
        <div className="relative">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <Input
            placeholder={t('admin.buyerSubscriptions.searchPlaceholder')}
            className="pl-9"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
      </div>

      {result === null ? (
        <LoadingBlock />
      ) : result.items.length === 0 ? (
        <EmptyState title={t('admin.buyerSubscriptions.emptyTitle')} description={t('admin.buyerSubscriptions.emptyDescription')} />
      ) : (
        <>
          <div className="overflow-hidden rounded-2xl border border-navy/10 bg-white">
            <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-navy/10 bg-navy/[0.02] text-left text-xs font-semibold uppercase tracking-wide text-navy/40">
                <tr>
                  <th className="px-5 py-3">{t('admin.buyerSubscriptions.columns.buyer')}</th>
                  <th className="px-5 py-3">{t('admin.buyerSubscriptions.columns.plan')}</th>
                  <th className="px-5 py-3">{t('admin.buyerSubscriptions.columns.quota')}</th>
                  <th className="px-5 py-3">{t('admin.buyerSubscriptions.columns.status')}</th>
                  <th className="px-5 py-3">{t('admin.buyerSubscriptions.columns.expires')}</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-navy/10">
                {result.items.map((sub) => (
                  <tr key={sub.id} className="transition hover:bg-navy/[0.02]">
                    <td className="px-5 py-4">
                      <p className="font-semibold text-navy">{sub.buyer?.fullName ?? '—'}</p>
                      <p className="mt-0.5 text-[12px] text-navy/45">{sub.buyer?.phone}</p>
                    </td>
                    <td className="px-5 py-4 text-navy/65">{sub.plan?.displayName ?? '—'}</td>
                    <td className="px-5 py-4 text-navy/65">
                      {sub.quotaUsed} / {sub.quotaTotal}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${
                          sub.status === 'ACTIVE'
                            ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20'
                            : 'bg-slate-100 text-slate-600 ring-slate-500/20'
                        }`}
                      >
                        {t(`common:status.subscription.${sub.status}`)}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-navy/65">
                      {sub.expiresAt ? new Date(sub.expiresAt).toLocaleDateString('en-IN') : t('admin.buyerSubscriptions.indefinite')}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Button variant="ghost" onClick={() => setAdjusting(sub)}>
                        {t('admin.buyerSubscriptions.adjustQuota')}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>

          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-2">
              <Button variant="ghost" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                {t('admin.buyerSubscriptions.previous')}
              </Button>
              <span className="px-3 font-mono text-[12.5px] font-medium text-muted">
                {t('admin.buyerSubscriptions.pageOf', { page, totalPages })}
              </span>
              <Button variant="ghost" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
                {t('common:common.button.next')}
              </Button>
            </div>
          )}
        </>
      )}

      {adjusting && (
        <AdjustQuotaModal
          subscription={adjusting}
          onClose={() => setAdjusting(null)}
          onSaved={() => {
            setAdjusting(null);
            setSaveSuccess(true);
            setReload((n) => n + 1);
            setTimeout(() => setSaveSuccess(false), 4000);
          }}
        />
      )}
    </div>
  );
}
