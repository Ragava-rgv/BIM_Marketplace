import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { LoanApplicationDto } from '@machinebazaar/shared';
import { api } from '../../lib/api';
import { formatDateTime, formatInr } from '../../lib/format';
import { Button, EmptyState, LoadingBlock, PageHeading, StatusBadge } from '../../components/ui';
import { PlusIcon, RupeeIcon } from '../../components/icons';

export function BuyerLoans() {
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
          eyebrow="Buyer workspace"
          title="Loan applications"
          description="Apply for financing through BIM's partner banks and NBFCs, and track each application's progress through certification and approval."
        />
        <Link to="/buyer/loans/new">
          <Button>
            <PlusIcon className="h-4 w-4" />
            New application
          </Button>
        </Link>
      </div>

      {loans === null ? (
        <LoadingBlock />
      ) : loans.length === 0 ? (
        <EmptyState
          title="No loan applications yet"
          description="Once you've found a machine you'd like to finance, start an application here — submitting it triggers an independent certification of the listing."
          action={
            <Link to="/buyer/loans/new">
              <Button>
                <RupeeIcon className="h-4 w-4" />
                Apply for a loan
              </Button>
            </Link>
          }
        />
      ) : (
        <div className="mt-6 overflow-hidden rounded-2xl border border-navy/10 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-navy/[0.03] text-xs font-semibold uppercase tracking-wide text-navy/40">
              <tr>
                <th className="px-5 py-3">Amount requested</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Bank / NBFC</th>
                <th className="px-5 py-3">Referral commission</th>
                <th className="px-5 py-3">Applied on</th>
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
                    {loan.partner ? `Routed to: ${loan.partner.name}` : 'Awaiting admin routing'}
                  </td>
                  <td className="px-5 py-4 text-navy/65">{loan.referralCommission ? formatInr(loan.referralCommission) : '—'}</td>
                  <td className="px-5 py-4 text-navy/55">{formatDateTime(loan.createdAt)}</td>
                  <td className="px-5 py-4 text-right">
                    <Link to={`/listings/${loan.listingId}`} className="text-sm font-semibold text-accent hover:underline">
                      View listing
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
