import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import type { CertificationDto } from '@machinebazaar/shared';
import { CertificationStatus } from '@machinebazaar/shared';
import { api, apiErrorMessage } from '../../lib/api';
import { formatDateTime, formatInr, humanizeStatus } from '../../lib/format';
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
      setError(apiErrorMessage(err, 'Could not update this certification.'));
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
      setError(apiErrorMessage(err, 'Could not upload the certification report.'));
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
              {certification.listing ? certification.listing.title : `Listing ${certification.listingId.slice(0, 8)}...`}
            </Link>
          </p>
          {certification.listing && (
            <p className="mt-1 text-sm text-navy/65">
              {certification.listing.machineCategory} · {certification.listing.machineMake} {certification.listing.machineModel} ·{' '}
              {certification.listing.manufactureYear} · {certification.listing.locationCity}, {certification.listing.locationState} · Asking{' '}
              {formatInr(certification.listing.askingPrice)}
            </p>
          )}
          <p className="mt-1 text-sm text-navy/55">
            {certification.complexityTier} tier · Fee {formatInr(certification.fee)} · Requested {formatDateTime(certification.createdAt)}
          </p>
          {certification.completedAt && (
            <p className="mt-0.5 text-sm text-navy/45">Completed {formatDateTime(certification.completedAt)}</p>
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
        <Field label="Status" hint={options.length === 1 ? 'This certification is in a final state.' : undefined}>
          <Select value={status} onChange={(e) => setStatus(e.target.value)} disabled={options.length === 1}>
            {options.map((opt) => (
              <option key={opt} value={opt}>
                {humanizeStatus(opt)}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Inspector notes">
          <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Findings, condition notes, recommendations..." />
        </Field>
      </div>

      <div className="mt-5 border-t border-navy/10 pt-5">
        <p className="mb-3 text-sm font-semibold text-navy">Inspection report</p>
        <CertificateTemplateForm values={report} onChange={setReport} />
        {completingNow && !reportValid && (
          <p className="mt-3 text-sm text-rose-600">
            The inspection report must be filled in before this certification can be marked Completed.
          </p>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-navy/10 pt-4">
        <div className="flex flex-wrap items-center gap-3">
          <input ref={fileRef} type="file" accept="application/pdf" className="text-sm text-navy/65" />
          <Button variant="ghost" disabled={uploading} onClick={uploadReport}>
            <UploadIcon className="h-4 w-4" />
            {uploading ? 'Uploading...' : 'Upload report'}
          </Button>
          {certification.reportStorageKey && (
            <a
              href={`/media/${certification.reportStorageKey}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent hover:underline"
            >
              <DocumentIcon className="h-4 w-4" />
              View report
            </a>
          )}
        </div>
        <Button disabled={saving || (completingNow && !reportValid)} onClick={save}>
          {saving ? 'Saving...' : 'Save changes'}
        </Button>
      </div>
    </Card>
  );
}

export function AdminCertifications() {
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
          setError(apiErrorMessage(err, 'Could not load certifications.'));
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
          eyebrow="Admin console"
          title="Certifications"
          description="Independent inspection reports — created only as a side effect of a submitted loan application, never standalone. Move each through Requested -> In progress -> Completed and attach the final PDF report."
        />
        <Button variant="ghost" disabled={!certifications?.length} onClick={downloadExcel}>
          <DownloadIcon className="h-4 w-4" />
          Export Excel
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
        <EmptyState title="No certifications yet" description="A certification is created automatically the moment a buyer submits a loan application." />
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
