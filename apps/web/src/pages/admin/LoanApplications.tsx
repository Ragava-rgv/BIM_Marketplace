import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { FinancePartnerDto, LoanApplicationDto } from '@machinebazaar/shared';
import { CertificationStatus, LoanApplicationStatus } from '@machinebazaar/shared';
import { api, apiErrorMessage } from '../../lib/api';
import { formatDate, formatDateTime, formatInr, humanizeStatus } from '../../lib/format';
import { Button, Card, EmptyState, ErrorBanner, LoadingBlock, MonoLabel, PageHeading, Select, StatusBadge } from '../../components/ui';
import { DownloadIcon } from '../../components/icons';
import { exportToExcel } from '../../lib/export';

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-navy/50">{label}</p>
      <p className="text-sm text-navy">{value}</p>
    </div>
  );
}

function EligibilityActions({ loan, onChanged }: { loan: LoanApplicationDto; onChanged: () => void }) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const act = async (status: 'CERT_PENDING' | 'REJECTED') => {
    setSubmitting(true);
    setError(null);
    try {
      await api.patch(`/loans/${loan.id}/status`, { status });
      onChanged();
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not update this application.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-navy/10 pt-3">
      <Button disabled={submitting} onClick={() => act('CERT_PENDING')}>
        Mark eligible & start certification
      </Button>
      <Button variant="secondary" disabled={submitting} onClick={() => act('REJECTED')}>
        Reject
      </Button>
      {error && <p className="w-full text-sm text-rose-600">{error}</p>}
    </div>
  );
}

function RouteToPartner({ loan, partners, onRouted }: { loan: LoanApplicationDto; partners: FinancePartnerDto[]; onRouted: () => void }) {
  const [partnerId, setPartnerId] = useState(loan.partnerId ?? '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const route = async () => {
    if (!partnerId) return;
    setSubmitting(true);
    setError(null);
    try {
      await api.patch(`/loans/${loan.id}/status`, { status: 'WITH_PARTNER', partnerId });
      onRouted();
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not route this application.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mt-3 flex flex-wrap items-end gap-3 border-t border-navy/10 pt-3">
      <div className="min-w-[220px] flex-1">
        <Select value={partnerId} onChange={(e) => setPartnerId(e.target.value)}>
          <option value="">Select a finance partner...</option>
          {partners.map((partner) => (
            <option key={partner.id} value={partner.id}>
              {partner.name} ({partner.type === 'BANK' ? 'Bank' : 'NBFC'}) · {partner.referralRate}% rate
            </option>
          ))}
        </Select>
      </div>
      <Button disabled={!partnerId || submitting} onClick={route}>
        {submitting ? 'Routing...' : 'Route to partner'}
      </Button>
      {error && <p className="w-full text-sm text-rose-600">{error}</p>}
    </div>
  );
}

function ApproveReject({ loan, onChanged }: { loan: LoanApplicationDto; onChanged: () => void }) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const act = async (status: 'APPROVED' | 'REJECTED') => {
    setSubmitting(true);
    setError(null);
    try {
      await api.patch(`/loans/${loan.id}/status`, { status });
      onChanged();
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not update this application.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-navy/10 pt-3">
      <Button disabled={submitting} onClick={() => act('APPROVED')}>
        Approve
      </Button>
      <Button variant="secondary" disabled={submitting} onClick={() => act('REJECTED')}>
        Reject
      </Button>
      {error && <p className="w-full text-sm text-rose-600">{error}</p>}
    </div>
  );
}

function MachineDetails({ loan }: { loan: LoanApplicationDto }) {
  if (!loan.listing) return null;
  const { listing } = loan;
  return (
    <div className="mt-4 border-t border-navy/10 pt-4">
      <MonoLabel>Machine</MonoLabel>
      <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <DetailRow label="Category" value={listing.machineCategory} />
        <DetailRow label="Make / model" value={`${listing.machineMake} ${listing.machineModel}`} />
        <DetailRow label="Manufacture year" value={String(listing.manufactureYear)} />
        <DetailRow label="Asking price" value={formatInr(listing.askingPrice)} />
        <DetailRow label="Location" value={`${listing.locationCity}, ${listing.locationState}`} />
        <DetailRow label="Complexity tier" value={humanizeStatus(listing.complexityTier)} />
        <DetailRow label="Listing status" value={humanizeStatus(listing.status)} />
      </div>
    </div>
  );
}

function BuyerDetails({ loan }: { loan: LoanApplicationDto }) {
  if (!loan.buyer) return null;
  const { buyer } = loan;
  return (
    <div className="mt-4 border-t border-navy/10 pt-4">
      <MonoLabel>Buyer</MonoLabel>
      <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <DetailRow label="Name" value={buyer.fullName} />
        <DetailRow label="Phone" value={buyer.phone} />
        <DetailRow label="Email" value={buyer.email ?? '—'} />
        <DetailRow label="GST status" value={humanizeStatus(buyer.gstStatus)} />
      </div>
    </div>
  );
}

function CertificationDetails({ loan }: { loan: LoanApplicationDto }) {
  const cert = loan.certification;
  if (!cert) return null;
  const report = cert.inspectionReport;
  return (
    <div className="mt-4 border-t border-navy/10 pt-4">
      <MonoLabel>Certification</MonoLabel>
      <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <DetailRow label="Status" value={humanizeStatus(cert.status)} />
        <DetailRow label="Fee" value={formatInr(cert.fee)} />
        <DetailRow label="Completed" value={cert.completedAt ? formatDateTime(cert.completedAt) : '—'} />
        {cert.reportStorageKey && (
          <div>
            <p className="text-xs text-navy/50">Report</p>
            <a href={`/media/${cert.reportStorageKey}`} target="_blank" rel="noreferrer" className="text-sm text-accent hover:underline">
              Download report
            </a>
          </div>
        )}
      </div>

      {report && (
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <DetailRow label="Certificate issued by" value={report.inspectorName} />
          <DetailRow label="Inspection date" value={formatDate(report.inspectionDate)} />
          <DetailRow label="Condition grade" value={`Grade ${report.conditionGrade}`} />
          <DetailRow label="Verified run hours" value={String(report.verifiedRunHours)} />
          <DetailRow label="Verified manufacture year" value={String(report.verifiedManufactureYear)} />
          <DetailRow label="Functional test" value={report.functionalTestPassed ? 'Passed' : 'Failed'} />
          <DetailRow label="Recommended market value" value={formatInr(report.recommendedMarketValue)} />
          <div className="col-span-2 sm:col-span-4">
            <p className="text-xs text-navy/50">Defects / observations</p>
            <p className="text-sm text-navy">{report.defectsObserved || '—'}</p>
          </div>
        </div>
      )}

      {cert.inspectorNotes && (
        <div className="mt-3">
          <p className="text-xs text-navy/50">Inspector notes</p>
          <p className="text-sm text-navy">{cert.inspectorNotes}</p>
        </div>
      )}
    </div>
  );
}

export function AdminLoanApplications() {
  const [loans, setLoans] = useState<LoanApplicationDto[] | null>(null);
  const [partners, setPartners] = useState<FinancePartnerDto[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [reload, setReload] = useState(0);

  const downloadExcel = () => {
    if (!loans?.length) return;
    exportToExcel(
      loans.map((l) => ({
        'Listing': l.listing?.title ?? '',
        'Machine': l.listing ? `${l.listing.machineMake} ${l.listing.machineModel}` : '',
        'Asking Price (₹)': l.listing ? Number(l.listing.askingPrice) : '',
        'Buyer Name': l.buyer?.fullName ?? '',
        'Buyer Phone': l.buyer?.phone ?? '',
        'Amount Requested (₹)': Number(l.amountRequested),
        'Status': l.status,
        'Finance Partner': l.partner?.name ?? '',
        'Referral Commission (₹)': l.referralCommission ? Number(l.referralCommission) : '',
        'Certification Status': l.certification?.status ?? '',
        'Applied At': l.createdAt,
      })),
      'loan-applications',
    );
  };

  useEffect(() => {
    let cancelled = false;
    api
      .get<LoanApplicationDto[]>('/loans')
      .then(({ data }) => {
        if (!cancelled) setLoans(data);
      })
      .catch((err) => {
        if (!cancelled) {
          setLoans([]);
          setError(apiErrorMessage(err, 'Could not load loan applications.'));
        }
      });
    api
      .get<FinancePartnerDto[]>('/finance-partners/admin')
      .then(({ data }) => {
        if (!cancelled) setPartners(data.filter((p) => p.active));
      })
      .catch(() => {
        if (!cancelled) setPartners([]);
      });
    return () => {
      cancelled = true;
    };
  }, [reload]);

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <PageHeading
          eyebrow="Admin console"
          title="Loan applications"
          description="Review each application's machine, buyer and certification details. Confirm eligibility to kick off certification, then route to a finance partner once certification is complete, and finally approve or reject."
        />
        <Button variant="ghost" disabled={!loans?.length} onClick={downloadExcel}>
          <DownloadIcon className="h-4 w-4" />
          Export Excel
        </Button>
      </div>

      {error && (
        <div className="mb-5">
          <ErrorBanner message={error} />
        </div>
      )}

      {loans === null ? (
        <LoadingBlock />
      ) : loans.length === 0 ? (
        <EmptyState title="No loan applications yet" description="Buyer-submitted loan applications will appear here once submitted for review." />
      ) : (
        <div className="space-y-4">
          {loans.map((loan) => (
            <Card key={loan.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-display text-lg text-navy">
                    <Link to={`/listings/${loan.listingId}`} className="hover:text-accent">
                      {loan.listing?.title ?? `Listing ${loan.listingId.slice(0, 8)}...`}
                    </Link>
                  </p>
                  <p className="mt-1 text-sm text-navy/55">
                    Requested {formatInr(loan.amountRequested)} · Applied {formatDateTime(loan.createdAt)}
                  </p>
                  <p className="mt-1 text-sm text-navy/55">
                    {loan.partner
                      ? [LoanApplicationStatus.WITH_PARTNER, LoanApplicationStatus.APPROVED, LoanApplicationStatus.REJECTED].includes(loan.status)
                        ? `Routed to ${loan.partner.name} (${loan.partner.referralRate}% rate)`
                        : `Buyer's preferred bank: ${loan.partner.name} (${loan.partner.referralRate}% rate)`
                      : 'No finance partner preference'}
                    {loan.referralCommission ? ` · Referral commission ${formatInr(loan.referralCommission)}` : ''}
                  </p>
                </div>
                <StatusBadge status={loan.status} />
              </div>

              <MachineDetails loan={loan} />
              <BuyerDetails loan={loan} />
              <CertificationDetails loan={loan} />

              {loan.status === LoanApplicationStatus.SUBMITTED && (
                <EligibilityActions loan={loan} onChanged={() => setReload((n) => n + 1)} />
              )}

              {loan.status === LoanApplicationStatus.CERT_PENDING &&
                loan.certification?.status === CertificationStatus.COMPLETED && (
                  <RouteToPartner loan={loan} partners={partners} onRouted={() => setReload((n) => n + 1)} />
                )}

              {loan.status === LoanApplicationStatus.WITH_PARTNER && (
                <ApproveReject loan={loan} onChanged={() => setReload((n) => n + 1)} />
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
