import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const act = async (status: 'CERT_PENDING' | 'REJECTED') => {
    setSubmitting(true);
    setError(null);
    try {
      await api.patch(`/loans/${loan.id}/status`, { status });
      onChanged();
    } catch (err) {
      setError(apiErrorMessage(err, t('admin.loanApplications.updateError')));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-navy/10 pt-3">
      <Button disabled={submitting} onClick={() => act('CERT_PENDING')}>
        {t('admin.loanApplications.markEligible')}
      </Button>
      <Button variant="secondary" disabled={submitting} onClick={() => act('REJECTED')}>
        {t('common:admin.approval.reject')}
      </Button>
      {error && <p className="w-full text-sm text-rose-600">{error}</p>}
    </div>
  );
}

function RouteToPartner({ loan, partners, onRouted }: { loan: LoanApplicationDto; partners: FinancePartnerDto[]; onRouted: () => void }) {
  const { t } = useTranslation();
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
      setError(apiErrorMessage(err, t('admin.loanApplications.routeError')));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mt-3 flex flex-wrap items-end gap-3 border-t border-navy/10 pt-3">
      <div className="min-w-[220px] flex-1">
        <Select value={partnerId} onChange={(e) => setPartnerId(e.target.value)}>
          <option value="">{t('admin.loanApplications.selectPartner')}</option>
          {partners.map((partner) => (
            <option key={partner.id} value={partner.id}>
              {t('admin.loanApplications.partnerOption', {
                name: partner.name,
                type: partner.type === 'BANK' ? t('admin.financePartners.type.BANK') : t('admin.financePartners.type.NBFC'),
                rate: partner.referralRate,
              })}
            </option>
          ))}
        </Select>
      </div>
      <Button disabled={!partnerId || submitting} onClick={route}>
        {submitting ? t('admin.loanApplications.routing') : t('admin.loanApplications.routeToPartner')}
      </Button>
      {error && <p className="w-full text-sm text-rose-600">{error}</p>}
    </div>
  );
}

function ApproveReject({ loan, onChanged }: { loan: LoanApplicationDto; onChanged: () => void }) {
  const { t } = useTranslation();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const act = async (status: 'APPROVED' | 'REJECTED') => {
    setSubmitting(true);
    setError(null);
    try {
      await api.patch(`/loans/${loan.id}/status`, { status });
      onChanged();
    } catch (err) {
      setError(apiErrorMessage(err, t('admin.loanApplications.updateError')));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-navy/10 pt-3">
      <Button disabled={submitting} onClick={() => act('APPROVED')}>
        {t('common:admin.approval.approve')}
      </Button>
      <Button variant="secondary" disabled={submitting} onClick={() => act('REJECTED')}>
        {t('common:admin.approval.reject')}
      </Button>
      {error && <p className="w-full text-sm text-rose-600">{error}</p>}
    </div>
  );
}

function MachineDetails({ loan }: { loan: LoanApplicationDto }) {
  const { t } = useTranslation();
  if (!loan.listing) return null;
  const { listing } = loan;
  return (
    <div className="mt-4 border-t border-navy/10 pt-4">
      <MonoLabel>{t('admin.loanApplications.machine')}</MonoLabel>
      <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <DetailRow label={t('admin.loanApplications.fields.category')} value={listing.machineCategory} />
        <DetailRow label={t('admin.loanApplications.fields.makeModel')} value={`${listing.machineMake} ${listing.machineModel}`} />
        <DetailRow label={t('admin.loanApplications.fields.manufactureYear')} value={String(listing.manufactureYear)} />
        <DetailRow label={t('admin.loanApplications.fields.askingPrice')} value={formatInr(listing.askingPrice)} />
        <DetailRow label={t('admin.loanApplications.fields.location')} value={`${listing.locationCity}, ${listing.locationState}`} />
        <DetailRow label={t('admin.loanApplications.fields.complexityTier')} value={humanizeStatus(listing.complexityTier)} />
        <DetailRow label={t('admin.loanApplications.fields.listingStatus')} value={humanizeStatus(listing.status)} />
      </div>
    </div>
  );
}

function BuyerDetails({ loan }: { loan: LoanApplicationDto }) {
  const { t } = useTranslation();
  if (!loan.buyer) return null;
  const { buyer } = loan;
  return (
    <div className="mt-4 border-t border-navy/10 pt-4">
      <MonoLabel>{t('admin.loanApplications.buyer')}</MonoLabel>
      <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <DetailRow label={t('admin.loanApplications.fields.name')} value={buyer.fullName} />
        <DetailRow label={t('admin.loanApplications.fields.phone')} value={buyer.phone} />
        <DetailRow label={t('admin.loanApplications.fields.email')} value={buyer.email ?? '—'} />
        <DetailRow label={t('admin.loanApplications.fields.gstStatus')} value={humanizeStatus(buyer.gstStatus)} />
      </div>
    </div>
  );
}

function CertificationDetails({ loan }: { loan: LoanApplicationDto }) {
  const { t } = useTranslation();
  const cert = loan.certification;
  if (!cert) return null;
  const report = cert.inspectionReport;
  return (
    <div className="mt-4 border-t border-navy/10 pt-4">
      <MonoLabel>{t('admin.loanApplications.certification')}</MonoLabel>
      <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <DetailRow label={t('admin.loanApplications.fields.status')} value={humanizeStatus(cert.status)} />
        <DetailRow label={t('admin.loanApplications.fields.fee')} value={formatInr(cert.fee)} />
        <DetailRow label={t('admin.loanApplications.fields.completed')} value={cert.completedAt ? formatDateTime(cert.completedAt) : '—'} />
        {cert.reportStorageKey && (
          <div>
            <p className="text-xs text-navy/50">{t('admin.loanApplications.fields.report')}</p>
            <a href={`/media/${cert.reportStorageKey}`} target="_blank" rel="noreferrer" className="text-sm text-accent hover:underline">
              {t('admin.loanApplications.downloadReport')}
            </a>
          </div>
        )}
      </div>

      {report && (
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <DetailRow label={t('admin.loanApplications.fields.certificateIssuedBy')} value={report.inspectorName} />
          <DetailRow label={t('admin.loanApplications.fields.inspectionDate')} value={formatDate(report.inspectionDate)} />
          <DetailRow label={t('admin.loanApplications.fields.conditionGrade')} value={t('admin.loanApplications.gradeValue', { grade: report.conditionGrade })} />
          <DetailRow label={t('admin.loanApplications.fields.verifiedRunHours')} value={String(report.verifiedRunHours)} />
          <DetailRow label={t('admin.loanApplications.fields.verifiedManufactureYear')} value={String(report.verifiedManufactureYear)} />
          <DetailRow label={t('admin.loanApplications.fields.functionalTest')} value={report.functionalTestPassed ? t('admin.loanApplications.passed') : t('admin.loanApplications.failed')} />
          <DetailRow label={t('admin.loanApplications.fields.recommendedMarketValue')} value={formatInr(report.recommendedMarketValue)} />
          <div className="col-span-2 sm:col-span-4">
            <p className="text-xs text-navy/50">{t('admin.loanApplications.fields.defectsObserved')}</p>
            <p className="text-sm text-navy">{report.defectsObserved || '—'}</p>
          </div>
        </div>
      )}

      {cert.inspectorNotes && (
        <div className="mt-3">
          <p className="text-xs text-navy/50">{t('admin.loanApplications.fields.inspectorNotes')}</p>
          <p className="text-sm text-navy">{cert.inspectorNotes}</p>
        </div>
      )}
    </div>
  );
}

export function AdminLoanApplications() {
  const { t } = useTranslation();
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
          setError(apiErrorMessage(err, t('admin.loanApplications.loadError')));
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
  }, [reload, t]);

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <PageHeading
          eyebrow={t('admin.loanApplications.eyebrow')}
          title={t('admin.loanApplications.title')}
          description={t('admin.loanApplications.description')}
        />
        <Button variant="ghost" disabled={!loans?.length} onClick={downloadExcel}>
          <DownloadIcon className="h-4 w-4" />
          {t('admin.loanApplications.exportExcel')}
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
        <EmptyState title={t('admin.loanApplications.emptyTitle')} description={t('admin.loanApplications.emptyDescription')} />
      ) : (
        <div className="space-y-4">
          {loans.map((loan) => (
            <Card key={loan.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-display text-lg text-navy">
                    <Link to={`/listings/${loan.listingId}`} className="hover:text-accent">
                      {loan.listing?.title ?? t('admin.loanApplications.listingFallback', { id: loan.listingId.slice(0, 8) })}
                    </Link>
                  </p>
                  <p className="mt-1 text-sm text-navy/55">
                    {t('admin.loanApplications.requestedApplied', { amount: formatInr(loan.amountRequested), time: formatDateTime(loan.createdAt) })}
                  </p>
                  <p className="mt-1 text-sm text-navy/55">
                    {loan.partner
                      ? [LoanApplicationStatus.WITH_PARTNER, LoanApplicationStatus.APPROVED, LoanApplicationStatus.REJECTED].includes(loan.status)
                        ? t('admin.loanApplications.routedTo', { name: loan.partner.name, rate: loan.partner.referralRate })
                        : t('admin.loanApplications.preferredBank', { name: loan.partner.name, rate: loan.partner.referralRate })
                      : t('admin.loanApplications.noPartnerPreference')}
                    {loan.referralCommission ? t('admin.loanApplications.referralCommissionSuffix', { amount: formatInr(loan.referralCommission) }) : ''}
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
