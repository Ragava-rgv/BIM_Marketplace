import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GstStatus } from '@machinebazaar/shared';
import type { EnquiryDto, LoanApplicationDto } from '@machinebazaar/shared';
import { api } from '../../lib/api';
import { useAuth } from '../../lib/auth-context';
import { AppLayout } from '../../components/AppLayout';
import { useWishlist } from '../../lib/wishlist-context';
import { formatInr, formatDate } from '../../lib/format';
import { ChevronRightIcon, MachineIcon, RupeeIcon, ShieldIcon } from '../../components/icons';

const STATUS_STYLE: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-600',
  SUBMITTED: 'bg-blue-50 text-blue-700',
  CERT_PENDING: 'bg-copper-bg text-copper',
  WITH_PARTNER: 'bg-copper-bg text-copper',
  APPROVED: 'bg-green-bg text-green-txt',
  REJECTED: 'bg-red-50 text-red-600',
};

export function BuyerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [enquiries, setEnquiries] = useState<EnquiryDto[]>([]);
  const [loans, setLoans] = useState<LoanApplicationDto[]>([]);
  const [loading, setLoading] = useState(true);

  const { count: savedCount } = useWishlist();
  const initials = user?.fullName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() ?? '';
  const isGstActive = user?.gstStatus === GstStatus.ACTIVE;

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      api.get<EnquiryDto[]>('/enquiries/mine').then(({ data }) => data).catch(() => [] as EnquiryDto[]),
      api.get<LoanApplicationDto[]>('/loans/mine').then(({ data }) => data).catch(() => [] as LoanApplicationDto[]),
    ]).then(([e, l]) => {
      if (cancelled) return;
      setEnquiries(e);
      setLoans(l);
    }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  if (!user) return null;

  return (
    <AppLayout>
      {/* Header */}
      <div className="bg-forest px-4 pt-4 pb-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-[52px] h-[52px] rounded-full bg-white/15 border border-white/20 flex items-center justify-center text-[20px] font-bold text-white">
            {initials}
          </div>
          <div>
            <p className="text-[12px] text-white/65">Buyer workspace</p>
            <p className="text-[19px] font-extrabold text-white tracking-[-0.4px]">
              {user.fullName.split(' ')[0]}
            </p>
          </div>
        </div>
        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10.5px] font-bold ${
          isGstActive ? 'bg-white/15 text-white' : 'bg-copper-bg text-copper'
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${isGstActive ? 'bg-[#6CE9A6]' : 'bg-copper'}`} />
          GST {user.gstStatus}
          {user.businessName ? ` · ${user.businessName}` : ''}
        </div>
      </div>

      <div className="px-4 pt-4 space-y-4 pb-4">
        {/* GST gate banner */}
        {!isGstActive && (
          <div className="bg-copper-bg border border-copper-bdr rounded-[13px] px-4 py-3 flex items-start gap-3">
            <ShieldIcon className="w-4 h-4 text-copper mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-[12.5px] font-bold text-copper">GST verification needed for financing</p>
              <p className="text-[11px] text-copper/80 mt-0.5">
                Browsing and enquiring is open to everyone. Verify GST to apply for machine loans.
              </p>
            </div>
            <button
              onClick={() => navigate('/buyer/gst-verification')}
              className="flex-shrink-0 text-[11px] font-bold text-copper bg-copper-bdr rounded-[8px] px-2.5 py-1"
            >
              Verify
            </button>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Saved', value: savedCount, path: '/buyer/saved' },
            { label: 'Enquiries', value: loading ? '—' : enquiries.length, path: '/enquiries' },
            { label: 'Loans', value: loading ? '—' : loans.length, path: '/buyer/loans' },
          ].map(({ label, value, path }) => (
            <button key={label} onClick={() => navigate(path)}
              className="bg-white border border-gray-200 rounded-[12px] px-3 py-3 text-center">
              <p className="font-mono text-[8.5px] text-gray-500 font-semibold tracking-[0.07em] mb-1">{label.toUpperCase()}</p>
              <p className="text-[22px] font-extrabold text-ink tracking-[-0.5px]">{value}</p>
            </button>
          ))}
        </div>

        {/* Quick actions */}
        <div className="space-y-2">
          <button onClick={() => navigate('/')}
            className="w-full bg-white border border-gray-200 rounded-[12px] p-[12px_13px] flex items-center gap-3">
            <div className="w-9 h-9 rounded-[9px] bg-forest-bg flex items-center justify-center flex-shrink-0">
              <MachineIcon className="w-4 h-4 text-forest" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-[12.5px] font-bold text-ink">Browse machines</p>
              <p className="text-[10.5px] text-gray-500">Find industrial machinery across India</p>
            </div>
            <ChevronRightIcon className="w-[11px] h-[11px] text-gray-400" />
          </button>

          <button onClick={() => navigate('/buyer/loans/new')}
            className={`w-full border rounded-[12px] p-[12px_13px] flex items-center gap-3 ${
              isGstActive ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-100 opacity-60'
            }`}
            disabled={!isGstActive}
          >
            <div className={`w-9 h-9 rounded-[9px] flex items-center justify-center flex-shrink-0 ${
              isGstActive ? 'bg-forest-bg' : 'bg-gray-100'
            }`}>
              <RupeeIcon className={`w-4 h-4 ${isGstActive ? 'text-forest' : 'text-gray-400'}`} />
            </div>
            <div className="flex-1 text-left">
              <p className="text-[12.5px] font-bold text-ink">Apply for loan</p>
              <p className="text-[10.5px] text-gray-500">
                {isGstActive ? 'Finance a machine via our partner banks' : 'Requires GST verification first'}
              </p>
            </div>
            <ChevronRightIcon className="w-[11px] h-[11px] text-gray-400" />
          </button>

          <button onClick={() => navigate('/buyer/saved')}
            className="w-full bg-white border border-gray-200 rounded-[12px] p-[12px_13px] flex items-center gap-3">
            <div className="w-9 h-9 rounded-[9px] bg-gray-100 flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 18 18">
                <path d="M3 2h12l-2 6H5z" /><path d="M5 8l2 7h4l2-7" />
              </svg>
            </div>
            <div className="flex-1 text-left">
              <p className="text-[12.5px] font-bold text-ink">Saved listings</p>
              <p className="text-[10.5px] text-gray-500">{savedCount} machine{savedCount !== 1 ? 's' : ''} bookmarked</p>
            </div>
            <ChevronRightIcon className="w-[11px] h-[11px] text-gray-400" />
          </button>
        </div>

        {/* Recent loans */}
        {!loading && loans.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[14px] font-bold text-ink">Recent applications</p>
              <button onClick={() => navigate('/buyer/loans')}
                className="text-[11px] font-bold text-forest-2">
                View all →
              </button>
            </div>
            <div className="space-y-2">
              {loans.slice(0, 3).map((loan) => (
                <div key={loan.id} className="bg-white border border-gray-200 rounded-[12px] px-4 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-[12.5px] font-bold text-ink">
                      {loan.listing?.title ?? 'Loan application'}
                    </p>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      {formatInr(loan.amountRequested)} · {formatDate(loan.createdAt)}
                    </p>
                  </div>
                  <span className={`text-[9.5px] font-bold px-2 py-0.5 rounded-[5px] ${
                    STATUS_STYLE[loan.status] ?? 'bg-gray-100 text-gray-600'
                  }`}>
                    {loan.status.replace(/_/g, ' ')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Switch to seller CTA */}
        <div className={`rounded-[13px] border px-4 py-4 flex items-start gap-3 ${
          isGstActive ? 'bg-forest-bg border-forest-bdr' : 'bg-white border-gray-200'
        }`}>
          <div className={`w-9 h-9 rounded-[9px] flex items-center justify-center flex-shrink-0 ${
            isGstActive ? 'bg-forest text-white' : 'bg-gray-100 text-gray-500'
          }`}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 16 16">
              <line x1="8" y1="2" x2="8" y2="14" /><line x1="2" y1="8" x2="14" y2="8" />
            </svg>
          </div>
          <div className="flex-1">
            <p className={`text-[12.5px] font-bold ${isGstActive ? 'text-forest' : 'text-ink'}`}>
              {isGstActive ? 'Ready to sell? Switch account' : 'Want to sell machinery?'}
            </p>
            <p className="text-[11px] text-gray-500 mt-0.5">
              {isGstActive
                ? 'Your GST is active. Switch to a seller account to start listing.'
                : 'Verify GST first, then switch your account to seller in one tap.'}
            </p>
            <button
              onClick={() => navigate('/buyer/switch-to-seller')}
              className={`mt-2.5 h-[34px] px-3 rounded-[8px] text-[11.5px] font-bold ${
                isGstActive ? 'bg-forest text-white' : 'bg-gray-100 text-gray-700'
              }`}
            >
              {isGstActive ? 'Switch to seller →' : 'Learn more →'}
            </button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
