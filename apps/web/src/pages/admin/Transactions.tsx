import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { TransactionDto } from '@machinebazaar/shared';
import { CommissionStatus } from '@machinebazaar/shared';
import { api, apiErrorMessage } from '../../lib/api';
import { formatDateTime, formatInr } from '../../lib/format';
import { Button, EmptyState, ErrorBanner, LoadingBlock, PageHeading, StatusBadge } from '../../components/ui';
import { CheckCircleIcon, DownloadIcon, RupeeIcon, ShieldCheckIcon } from '../../components/icons';
import { exportToExcel } from '../../lib/export';

export function AdminTransactions() {
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
          setError(apiErrorMessage(err, 'Could not load transactions.'));
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
      setError(apiErrorMessage(err, 'Could not mark this commission as paid.'));
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
          eyebrow="Admin console"
          title="Transactions & commissions"
          description="BIM earns a fixed 1% buyer-side and 1% seller-side commission on every sale. Marking a commission as PAID is the only action that releases buyer—seller contact details."
        />
        <Button variant="ghost" disabled={!transactions?.length} onClick={downloadExcel}>
          <DownloadIcon className="h-4 w-4" />
          Export Excel
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
        <EmptyState title="No transactions yet" description="Transactions appear here once a seller records an agreed sale with a buyer." />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-navy/10 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-navy/10 bg-navy/[0.02] text-left text-xs font-semibold uppercase tracking-wide text-navy/40">
              <tr>
                <th className="px-5 py-3">Sale price</th>
                <th className="px-5 py-3">Buyer commission (1%)</th>
                <th className="px-5 py-3">Seller commission (1%)</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Contact released</th>
                <th className="px-5 py-3">Created</th>
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
                      <span className="text-xs text-navy/35">Not released</span>
                    )}
                  </td>
                  <td className="px-5 py-4 text-navy/45">{formatDateTime(txn.createdAt)}</td>
                  <td className="px-5 py-4 text-right">
                    {txn.commissionStatus === CommissionStatus.PENDING ? (
                      <Button disabled={actingId === txn.id} onClick={() => markPaid(txn.id)}>
                        <CheckCircleIcon className="h-4 w-4" />
                        Mark commission paid
                      </Button>
                    ) : (
                      <Link to={`/listings/${txn.listingId}`} className="text-sm font-semibold text-accent hover:underline">
                        View listing
                      </Link>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-6 flex items-start gap-3 rounded-xl bg-navy/[0.03] p-4 text-sm text-navy/55">
        <RupeeIcon className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
        <p>
          Commission is split 1% buyer-side + 1% seller-side (2% total) on every completed sale —
          this rate is fixed platform-wide and is not configurable per listing.
        </p>
      </div>
    </div>
  );
}
