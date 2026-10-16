import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { LoanApplicationDto } from '../../shared';
import { api } from '../../lib/api';
import { formatDateTime, formatInr } from '../../lib/format';
import { Button, EmptyState, LoadingBlock, PageHeading, StatusBadge } from '../../components/ui';
import { PlusIcon, RupeeIcon } from '../../components/icons';

export function BuyerLoans() {
  const { t } = useTranslation();
  const [loans, setLoans] = useState<LoanApplicationDto[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    api
      .get<LoanApplicationDto[]>('/loans/mine')
      .then(({ data }) => {
        if (!cancelled) setLoans(data);
      })
      .catch(() => {
        if (!cancelled) setLoans([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <PageHeading
          eyebrow={t('buyer.loans.eyebrow')}
          title={t('buyer.loans.title')}
          description={t('buyer.loans.description')}
        />
        <Link to="/buyer/loans/new">
          <Button>
            <PlusIcon className="h-4 w-4" />
            {t('buyer.loans.newApplication')}
          </Button>
        </Link>
      </div>

      {loans === null ? (
        <LoadingBlock />
      ) : loans.length === 0 ? (
        <EmptyState
          title={t('buyer.loans.emptyTitle')}
          description={t('buyer.loans.emptyDescription')}
          action={
            <Link to="/buyer/loans/new">
              <Button>
                <RupeeIcon className="h-4 w-4" />
                {t('buyer.loans.applyButton')}
              </Button>
            </Link>
          }
        />
      ) : (
        <div className="mt-6 overflow-hidden rounded-2xl border border-navy/10 bg-white">
          <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-navy/[0.03] text-xs font-semibold uppercase tracking-wide text-navy/40">
              <tr>
                <th className="px-5 py-3">{t('buyer.loans.table.amountRequested')}</th>
                <th className="px-5 py-3">{t('buyer.loans.table.status')}</th>
                <th className="px-5 py-3">{t('buyer.loans.table.bankNbfc')}</th>
                <th className="px-5 py-3">{t('buyer.loans.table.referralCommission')}</th>
                <th className="px-5 py-3">{t('buyer.loans.table.appliedOn')}</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-navy/10">
              {loans.map((loan) => (
                <tr key={loan.id}>
                  <td className="px-5 py-4 font-semibold text-navy">{formatInr(loan.amountRequested)}</td>
                  <td className="px-5 py-4">
                    <StatusBadge status={loan.status} />
                  </td>
                  <td className="px-5 py-4 text-navy/65">
                    {loan.partner ? t('buyer.loans.table.routedTo', { name: loan.partner.name }) : t('buyer.loans.table.awaitingRouting')}
                  </td>
                  <td className="px-5 py-4 text-navy/65">{loan.referralCommission ? formatInr(loan.referralCommission) : '—'}</td>
                  <td className="px-5 py-4 text-navy/55">{formatDateTime(loan.createdAt)}</td>
                  <td className="px-5 py-4 text-right">
                    <Link to={`/listings/${loan.listingId}`} className="text-sm font-semibold text-accent hover:underline">
                      {t('buyer.loans.table.viewListing')}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}
    </div>
  );
}
