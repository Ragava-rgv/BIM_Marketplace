import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { CertificationDto } from '../../shared';
import { CertificationStatus } from '../../shared';
import { api, apiErrorMessage } from '../../lib/api';
import { formatDateTime, formatInr } from '../../lib/format';
import { Button, Card, EmptyState, ErrorBanner, Field, LoadingBlock, PageHeading, Select, StatusBadge, Textarea } from '../../components/ui';
import { DocumentIcon, DownloadIcon, UploadIcon } from '../../components/icons';
import { exportToExcel } from '../../lib/export';
import {
  CertificateTemplateForm,
  inspectionReportToPayload,
  inspectionReportToValues,
  isInspectionReportValid,
  type InspectionReportValues,
} from '../../components/CertificateTemplateForm';

const NEXT_STATUS: Record<string, CertificationStatus[]> = {
  REQUESTED: [CertificationStatus.IN_PROGRESS, CertificationStatus.REJECTED],
  IN_PROGRESS: [CertificationStatus.COMPLETED, CertificationStatus.REJECTED],
  COMPLETED: [],
  REJECTED: [],
};

function CertificationRow({ certification, onChanged }: { certification: CertificationDto; onChanged: () => void }) {
  const { t } = useTranslation();
  const [status, setStatus] = useState<string>(certification.status);
  const [notes, setNotes] = useState(certification.inspectorNotes ?? '');
  const [report, setReport] = useState<InspectionReportValues>(inspectionReportToValues(certification.inspectionReport));

  useEffect(() => {
    setStatus(certification.status);
    setNotes(certification.inspectorNotes ?? '');
    setReport(inspectionReportToValues(certification.inspectionReport));
  }, [certification.status, certification.inspectorNotes, certification.inspectionReport]);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const options = [certification.status, ...NEXT_STATUS[certification.status]];
  const completingNow = status === CertificationStatus.COMPLETED && certification.status !== CertificationStatus.COMPLETED;
  const reportValid = isInspectionReportValid(report);

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      await api.patch(`/certifications/${certification.id}`, {
        status: status === certification.status ? undefined : status,
        inspectorNotes: notes,
        inspectionReport: inspectionReportToPayload(report),
      });
      onChanged();
    } catch (err) {
      setError(apiErrorMessage(err, t('admin.certifications.updateError')));
    } finally {
      setSaving(false);
    }
  };

  const uploadReport = async () => {
    const file = fileRef.current?.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const form = new FormData();
      form.append('file', file);
      await api.post(`/certifications/${certification.id}/report`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (fileRef.current) fileRef.current.value = '';
      onChanged();
    } catch (err) {
      setError(apiErrorMessage(err, t('admin.certifications.uploadError')));
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-display text-lg text-navy">
            <Link to={`/listings/${certification.listingId}`} className="hover:text-accent">
              {certification.listing ? certification.listing.title : t('admin.certifications.listingFallback', { id: certification.listingId.slice(0, 8) })}
            </Link>
          </p>
          {certification.listing && (
            <p className="mt-1 text-sm text-navy/65">
              {certification.listing.machineCategory} · {certification.listing.machineMake} {certification.listing.machineModel} ·{' '}
              {certification.listing.manufactureYear} · {certification.listing.locationCity}, {certification.listing.locationState} ·{' '}
              {t('admin.certifications.asking', { price: formatInr(certification.listing.askingPrice) })}
            </p>
          )}
          <p className="mt-1 text-sm text-navy/55">
            {t('admin.certifications.tierFeeRequested', {
              tier: certification.complexityTier,
              fee: formatInr(certification.fee),
              time: formatDateTime(certification.createdAt),
            })}
          </p>
          {certification.completedAt && (
            <p className="mt-0.5 text-sm text-navy/45">{t('admin.certifications.completedAt', { time: formatDateTime(certification.completedAt) })}</p>
          )}
        </div>
        <StatusBadge status={certification.status} />
      </div>

      {error && (
        <div className="mt-4">
          <ErrorBanner message={error} />
        </div>
      )}

      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label={t('admin.certifications.fields.status')} hint={options.length === 1 ? t('admin.certifications.finalStateHint') : undefined}>
          <Select value={status} onChange={(e) => setStatus(e.target.value)} disabled={options.length === 1}>
            {options.map((opt) => (
              <option key={opt} value={opt}>
                {t(`common:status.certification.${opt}`)}
              </option>
            ))}
          </Select>
        </Field>

        <Field label={t('admin.certifications.fields.inspectorNotes')}>
          <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={t('admin.certifications.fields.inspectorNotesPlaceholder')} />
        </Field>
      </div>

      <div className="mt-5 border-t border-navy/10 pt-5">
        <p className="mb-3 text-sm font-semibold text-navy">{t('admin.certifications.inspectionReport')}</p>
        <CertificateTemplateForm values={report} onChange={setReport} />
        {completingNow && !reportValid && (
          <p className="mt-3 text-sm text-rose-600">
            {t('admin.certifications.reportRequiredWarning')}
          </p>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-navy/10 pt-4">
        <div className="flex flex-wrap items-center gap-3">
          <input ref={fileRef} type="file" accept="application/pdf" className="text-sm text-navy/65" />
          <Button variant="ghost" disabled={uploading} onClick={uploadReport}>
            <UploadIcon className="h-4 w-4" />
            {uploading ? t('admin.certifications.uploading') : t('admin.certifications.uploadReport')}
          </Button>
          {certification.reportStorageKey && (
            <a
              href={`/media/${certification.reportStorageKey}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent hover:underline"
            >
              <DocumentIcon className="h-4 w-4" />
              {t('admin.certifications.viewReport')}
            </a>
          )}
        </div>
        <Button disabled={saving || (completingNow && !reportValid)} onClick={save}>
          {saving ? t('admin.certifications.saving') : t('admin.certifications.saveChanges')}
        </Button>
      </div>
    </Card>
  );
}

export function AdminCertifications() {
  const { t } = useTranslation();
  const [certifications, setCertifications] = useState<CertificationDto[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let cancelled = false;
    api
      .get<CertificationDto[]>('/certifications')
      .then(({ data }) => {
        if (!cancelled) setCertifications(data);
      })
      .catch((err) => {
        if (!cancelled) {
          setCertifications([]);
          setError(apiErrorMessage(err, t('admin.certifications.loadError')));
        }
      });
    return () => {
      cancelled = true;
    };
  }, [reload]);

  const downloadExcel = () => {
    if (!certifications?.length) return;
    exportToExcel(
      certifications.map((c) => ({
        'Listing': c.listing?.title ?? '',
        'Category': c.listing?.machineCategory ?? '',
        'Make': c.listing?.machineMake ?? '',
        'Model': c.listing?.machineModel ?? '',
        'Location': c.listing ? `${c.listing.locationCity}, ${c.listing.locationState}` : '',
        'Asking Price (₹)': c.listing ? Number(c.listing.askingPrice) : '',
        'Complexity Tier': c.complexityTier,
        'Fee (₹)': Number(c.fee),
        'Status': c.status,
        'Condition Grade': c.inspectionReport?.conditionGrade ?? '',
        'Run Hours': c.inspectionReport?.verifiedRunHours ?? '',
        'Manufacture Year': c.inspectionReport?.verifiedManufactureYear ?? '',
        'Functional Test': c.inspectionReport ? (c.inspectionReport.functionalTestPassed ? 'Passed' : 'Failed') : '',
        'Recommended Value (₹)': c.inspectionReport ? Number(c.inspectionReport.recommendedMarketValue) : '',
        'Inspector Name': c.inspectionReport?.inspectorName ?? '',
        'Inspection Date': c.inspectionReport?.inspectionDate ?? '',
        'Inspector Notes': c.inspectorNotes ?? '',
        'Requested At': c.createdAt,
        'Completed At': c.completedAt ?? '',
      })),
      'certifications',
    );
  };

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <PageHeading
          eyebrow={t('admin.certifications.eyebrow')}
          title={t('admin.certifications.title')}
          description={t('admin.certifications.description')}
        />
        <Button variant="ghost" disabled={!certifications?.length} onClick={downloadExcel}>
          <DownloadIcon className="h-4 w-4" />
          {t('admin.certifications.exportExcel')}
        </Button>
      </div>

      {error && (
        <div className="mb-5">
          <ErrorBanner message={error} />
        </div>
      )}

      {certifications === null ? (
        <LoadingBlock />
      ) : certifications.length === 0 ? (
        <EmptyState title={t('admin.certifications.emptyTitle')} description={t('admin.certifications.emptyDescription')} />
      ) : (
        <div className="space-y-4">
          {certifications.map((cert) => (
            <CertificationRow key={cert.id} certification={cert} onChanged={() => setReload((n) => n + 1)} />
          ))}
        </div>
      )}
    </div>
  );
}
