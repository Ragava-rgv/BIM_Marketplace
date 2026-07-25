import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { LoanApplicationDto } from '@machinebazaar/shared';
import { api } from '../../lib/api';
import { AppLayout } from '../../components/AppLayout';
import { formatInr, formatDate } from '../../lib/format';
import { ChevronRightIcon, PlusIcon, RupeeIcon } from '../../components/icons';

const STATUS_STYLE: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-600',
  SUBMITTED: 'bg-blue-50 text-blue-700',
  CERT_PENDING: 'bg-copper-bg text-copper',
  WITH_PARTNER: 'bg-copper-bg text-copper',
  APPROVED: 'bg-green-bg text-green-txt',
  REJECTED: 'bg-red-50 text-red-600',
};

const STATUS_LABEL: Record<string, string> = {
  DRAFT: 'Draft',
  SUBMITTED: 'Submitted',
  CERT_PENDING: 'Certification pending',
  WITH_PARTNER: 'With bank/NBFC',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
};

export function BuyerLoans() {
  const navigate = useNavigate();
  const [loans, setLoans] = useState<LoanApplicationDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    api.get<LoanApplicationDto[]>('/loans/mine')
      .then(({ data }) => { if (!cancelled) setLoans(data); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  return (
    <AppLayout>
      <div className="bg-white border-b border-gray-200 px-4 pt-4 pb-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="w-8 h-8 flex items-center justify-center">
            <ChevronRightIcon className="w-4 h-4 text-gray-500 rotate-180" />
          </button>
          <div>
            <h1 className="text-[17px] font-extrabold text-ink tracking-[-0.3px]">Loan Applications</h1>
            <p className="text-[11px] text-gray-500">{loans.length} application{loans.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <button
          onClick={() => navigate('/buyer/loans/new')}
          className="flex items-center gap-1.5 bg-forest text-white text-[12px] font-bold px-3 py-2 rounded-[10px]"
        >
          <PlusIcon className="w-3.5 h-3.5 stroke-white stroke-[2.5px]" />
          New
        </button>
      </div>

      <div className="px-4 pt-4 pb-4 space-y-3">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-[13px] h-[110px] animate-pulse" />
          ))
        ) : loans.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-14 h-14 rounded-full bg-forest/10 flex items-center justify-center mx-auto mb-3">
              <RupeeIcon className="w-7 h-7 text-forest" />
            </div>
            <p className="text-[14px] font-semibold text-ink mb-1">No loan applications yet</p>
            <p className="text-[12px] text-gray-500 mb-4">
              Find a machine and apply for financing through our partner banks and NBFCs.
            </p>
            <button onClick={() => navigate('/buyer/loans/new')}
              className="bg-forest text-white text-[13px] font-bold px-5 py-2.5 rounded-[11px]">
              Apply for a loan
            </button>
          </div>
        ) : (
          loans.map((loan) => (
            <div key={loan.id} className="bg-white border border-gray-200 rounded-[13px] overflow-hidden">
              <div className="px-4 py-3">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <p className="text-[13px] font-bold text-ink flex-1 min-w-0 truncate">
                    {loan.listing?.title ?? 'Loan application'}
                  </p>
                  <span className={`text-[9.5px] font-bold px-2 py-0.5 rounded-[5px] flex-shrink-0 ${
                    STATUS_STYLE[loan.status] ?? 'bg-gray-100 text-gray-600'
                  }`}>
                    {STATUS_LABEL[loan.status] ?? loan.status.replace(/_/g, ' ')}
                  </span>
                </div>

                {loan.listing && (
                  <p className="text-[11px] text-gray-500 mb-2">
                    {loan.listing.machineMake} {loan.listing.machineModel}
                  </p>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="font-mono text-[9px] text-gray-400 font-semibold tracking-[0.06em] mb-0.5">AMOUNT</p>
                    <p className="text-[13px] font-bold text-ink">{formatInr(loan.amountRequested)}</p>
                  </div>
                  {loan.partner && (
                    <div>
                      <p className="font-mono text-[9px] text-gray-400 font-semibold tracking-[0.06em] mb-0.5">ROUTED TO</p>
                      <p className="text-[12px] font-semibold text-ink">{loan.partner.name}</p>
                    </div>
                  )}
                  {loan.status === 'APPROVED' && loan.referralCommission && (
                    <div>
                      <p className="font-mono text-[9px] text-gray-400 font-semibold tracking-[0.06em] mb-0.5">COMMISSION</p>
                      <p className="text-[12px] font-semibold text-ink">{formatInr(loan.referralCommission)}</p>
                    </div>
                  )}
                </div>
              </div>
              <div className="border-t border-gray-100 bg-gray-25 px-4 py-2">
                <p className="text-[10.5px] text-gray-400">Applied {formatDate(loan.createdAt)}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </AppLayout>
  );
}
