import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { EnquiryDto } from '@machinebazaar/shared';
import { EnquiryStatus } from '@machinebazaar/shared';
import { api, apiErrorMessage } from '../../lib/api';
import { formatDateTime, formatInr } from '../../lib/format';
import { Button, EmptyState, ErrorBanner, LoadingBlock, PageHeading, StatusBadge } from '../../components/ui';
import { CheckCircleIcon, DownloadIcon, MapPinIcon } from '../../components/icons';
import { exportToExcel } from '../../lib/export';

export function AdminEnquiries() {
  const { t } = useTranslation();
  const [enquiries, setEnquiries] = useState<EnquiryDto[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actingId, setActingId] = useState<string | null>(null);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let cancelled = false;
    api
      .get<EnquiryDto[]>('/enquiries')
      .then(({ data }) => {
        if (!cancelled) setEnquiries(data);
      })
      .catch((err) => {
        if (!cancelled) {
          setEnquiries([]);
          setError(apiErrorMessage(err, t('admin.enquiries.loadError')));
        }
      });
    return () => {
      cancelled = true;
    };
  }, [reload]);

  const markClosed = async (id: string) => {
    setActingId(id);
    setError(null);
    try {
      await api.patch(`/enquiries/${id}`, { status: 'CLOSED' });
      setReload((n) => n + 1);
    } catch (err) {
      setError(apiErrorMessage(err, t('admin.enquiries.updateError')));
    } finally {
      setActingId(null);
    }
  };

  const downloadExcel = () => {
    if (!enquiries?.length) return;
    exportToExcel(
      enquiries.map((e) => ({
        'Listing': e.listing?.title ?? '',
        'Asking Price (₹)': e.listing ? Number(e.listing.askingPrice) : '',
        'Buyer Name': e.buyer?.fullName ?? '',
        'Phone': e.buyer?.phone ?? '',
        'Email': e.buyer?.email ?? '',
        'Business': e.buyer?.businessName ?? '',
        'GST Number': e.buyer?.gstNumber ?? '',
        'City': e.buyer?.locationCity ?? '',
        'State': e.buyer?.locationState ?? '',
        'Status': e.status,
        'Received At': e.createdAt,
      })),
      'enquiries',
    );
  };

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <PageHeading
          eyebrow={t('admin.enquiries.eyebrow')}
          title={t('admin.enquiries.title')}
          description={t('admin.enquiries.description')}
        />
        <Button variant="ghost" disabled={!enquiries?.length} onClick={downloadExcel}>
          <DownloadIcon className="h-4 w-4" />
          {t('admin.enquiries.exportExcel')}
        </Button>
      </div>

      {error && (
        <div className="mb-5">
          <ErrorBanner message={error} />
        </div>
      )}

      {enquiries === null ? (
        <LoadingBlock />
      ) : enquiries.length === 0 ? (
        <EmptyState title={t('admin.enquiries.emptyTitle')} description={t('admin.enquiries.emptyDescription')} />
      ) : (
        <div className="space-y-4">
          {enquiries.map((enquiry) => (
            <div key={enquiry.id} className="rounded-2xl border border-line bg-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-display text-lg text-ink">{enquiry.listing?.title ?? t('admin.enquiries.listingFallback')}</p>
                  {enquiry.listing && <p className="text-sm text-muted">{formatInr(enquiry.listing.askingPrice)}</p>}
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={enquiry.status} />
                  {enquiry.status === EnquiryStatus.NEW && (
                    <Button variant="ghost" disabled={actingId === enquiry.id} onClick={() => markClosed(enquiry.id)}>
                      <CheckCircleIcon className="h-4 w-4" />
                      {t('admin.enquiries.markClosed')}
                    </Button>
                  )}
                </div>
              </div>

              {enquiry.buyer && (
                <div className="mt-4 grid grid-cols-1 gap-3 rounded-xl bg-paper p-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">{t('admin.enquiries.fields.buyer')}</p>
                    <p className="mt-1 font-medium text-ink">{enquiry.buyer.fullName}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">{t('admin.enquiries.fields.phone')}</p>
                    <p className="mt-1 font-medium text-ink">{enquiry.buyer.phone}</p>
                  </div>
                  {enquiry.buyer.email && (
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">{t('admin.enquiries.fields.email')}</p>
                      <p className="mt-1 font-medium text-ink">{enquiry.buyer.email}</p>
                    </div>
                  )}
                  {enquiry.buyer.businessName && (
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">{t('admin.enquiries.fields.business')}</p>
                      <p className="mt-1 font-medium text-ink">{enquiry.buyer.businessName}</p>
                    </div>
                  )}
                  {enquiry.buyer.gstNumber && (
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">{t('admin.enquiries.fields.gstNumber')}</p>
                      <p className="mt-1 font-medium text-ink">{enquiry.buyer.gstNumber}</p>
                    </div>
                  )}
                  {(enquiry.buyer.locationCity || enquiry.buyer.locationState) && (
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">{t('admin.enquiries.fields.location')}</p>
                      <p className="mt-1 inline-flex items-center gap-1.5 font-medium text-ink">
                        <MapPinIcon className="h-3.5 w-3.5" />
                        {[enquiry.buyer.locationCity, enquiry.buyer.locationState].filter(Boolean).join(', ')}
                      </p>
                    </div>
                  )}
                </div>
              )}

              <p className="mt-3 text-xs text-muted">{t('admin.enquiries.received', { time: formatDateTime(enquiry.createdAt) })}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
