import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { TransactionDto } from '@machinebazaar/shared';
import { CommissionStatus } from '@machinebazaar/shared';
import { api, apiErrorMessage } from '../../lib/api';
import { formatDateTime, formatInr } from '../../lib/format';
import { Button, EmptyState, ErrorBanner, LoadingBlock, PageHeading, StatusBadge } from '../../components/ui';
import { CheckCircleIcon, DownloadIcon, RupeeIcon, ShieldCheckIcon } from '../../components/icons';
import { exportToExcel } from '../../lib/export';

export function AdminTransactions() {
  const { t } = useTranslation();
  const [transactions, setTransactions] = useState<TransactionDto[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actingId, setActingId] = useState<string | null>(null);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setTransactions(null);
    api
      .get<TransactionDto[]>('/transactions')
      .then(({ data }) => {
        if (!cancelled) setTransactions(data);
      })
      .catch((err) => {
        if (!cancelled) {
          setTransactions([]);
          setError(apiErrorMessage(err, t('admin.transactions.loadError')));
        }
      });
    return () => {
      cancelled = true;
    };
  }, [reload]);

  const markPaid = async (id: string) => {
    setActingId(id);
    setError(null);
    try {
      await api.post(`/transactions/${id}/mark-paid`);
      setReload((n) => n + 1);
    } catch (err) {
      setError(apiErrorMessage(err, t('admin.transactions.markPaidError')));
    } finally {
      setActingId(null);
    }
  };

  const downloadExcel = () => {
    if (!transactions?.length) return;
    exportToExcel(
      transactions.map((t) => ({
        'Sale Price (₹)': Number(t.salePrice),
        'Buyer Commission (₹)': Number(t.buyerCommission),
        'Seller Commission (₹)': Number(t.sellerCommission),
        'Status': t.commissionStatus,
        'Contact Released At': t.contactReleasedAt ?? '',
        'Created At': t.createdAt,
      })),
      'transactions',
    );
  };

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <PageHeading
          eyebrow={t('admin.transactions.eyebrow')}
          title={t('admin.transactions.title')}
          description={t('admin.transactions.description')}
        />
        <Button variant="ghost" disabled={!transactions?.length} onClick={downloadExcel}>
          <DownloadIcon className="h-4 w-4" />
          {t('admin.transactions.exportExcel')}
        </Button>
      </div>

      {error && (
        <div className="mb-5">
          <ErrorBanner message={error} />
        </div>
      )}

      {transactions === null ? (
        <LoadingBlock />
      ) : transactions.length === 0 ? (
        <EmptyState title={t('admin.transactions.emptyTitle')} description={t('admin.transactions.emptyDescription')} />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-navy/10 bg-white">
          <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-navy/10 bg-navy/[0.02] text-left text-xs font-semibold uppercase tracking-wide text-navy/40">
              <tr>
                <th className="px-5 py-3">{t('admin.transactions.columns.salePrice')}</th>
                <th className="px-5 py-3">{t('admin.transactions.columns.buyerCommission')}</th>
                <th className="px-5 py-3">{t('admin.transactions.columns.sellerCommission')}</th>
                <th className="px-5 py-3">{t('admin.transactions.columns.status')}</th>
                <th className="px-5 py-3">{t('admin.transactions.columns.contactReleased')}</th>
                <th className="px-5 py-3">{t('admin.transactions.columns.created')}</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-navy/10">
              {transactions.map((txn) => (
                <tr key={txn.id} className="transition hover:bg-navy/[0.02]">
                  <td className="px-5 py-4 font-semibold text-navy">{formatInr(txn.salePrice)}</td>
                  <td className="px-5 py-4 text-navy/65">{formatInr(txn.buyerCommission)}</td>
                  <td className="px-5 py-4 text-navy/65">{formatInr(txn.sellerCommission)}</td>
                  <td className="px-5 py-4">
                    <StatusBadge status={txn.commissionStatus} />
                  </td>
                  <td className="px-5 py-4">
                    {txn.contactReleasedAt ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600">
                        <ShieldCheckIcon className="h-3.5 w-3.5" />
                        {formatDateTime(txn.contactReleasedAt)}
                      </span>
                    ) : (
                      <span className="text-xs text-navy/35">{t('admin.transactions.notReleased')}</span>
                    )}
                  </td>
                  <td className="px-5 py-4 text-navy/45">{formatDateTime(txn.createdAt)}</td>
                  <td className="px-5 py-4 text-right">
                    {txn.commissionStatus === CommissionStatus.PENDING ? (
                      <Button disabled={actingId === txn.id} onClick={() => markPaid(txn.id)}>
                        <CheckCircleIcon className="h-4 w-4" />
                        {t('admin.transactions.markCommissionPaid')}
                      </Button>
                    ) : (
                      <Link to={`/listings/${txn.listingId}`} className="text-sm font-semibold text-accent hover:underline">
                        {t('admin.transactions.viewListing')}
                      </Link>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}

      <div className="mt-6 flex items-start gap-3 rounded-xl bg-navy/[0.03] p-4 text-sm text-navy/55">
        <RupeeIcon className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
        <p>
          {t('admin.transactions.commissionNote')}
        </p>
      </div>
    </div>
  );
}
