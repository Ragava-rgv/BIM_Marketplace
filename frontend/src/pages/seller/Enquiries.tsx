import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { SellerEnquiryDto } from '../../shared';
import { api, apiErrorMessage } from '../../lib/api';
import { formatDateTime } from '../../lib/format';
import { EmptyState, ErrorBanner, LoadingBlock, PageHeading, StatusBadge } from '../../components/ui';
import { MapPinIcon } from '../../components/icons';

export function SellerEnquiries() {
  const { t } = useTranslation();
  const [enquiries, setEnquiries] = useState<SellerEnquiryDto[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    api
      .get<SellerEnquiryDto[]>('/enquiries/seller')
      .then(({ data }) => {
        if (!cancelled) setEnquiries(data);
      })
      .catch((err) => {
        if (!cancelled) {
          setEnquiries([]);
          setError(apiErrorMessage(err, t('seller.enquiries.errors.loadFailed')));
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div>
      <PageHeading
        eyebrow={t('seller.enquiries.eyebrow')}
        title={t('seller.enquiries.title')}
        description={t('seller.enquiries.description')}
      />

      {error && (
        <div className="mb-5">
          <ErrorBanner message={error} />
        </div>
      )}

      {enquiries === null ? (
        <LoadingBlock />
      ) : enquiries.length === 0 ? (
        <EmptyState title={t('seller.enquiries.emptyState.title')} description={t('seller.enquiries.emptyState.description')} />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-line bg-white">
          <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-line bg-paper text-left text-xs font-semibold uppercase tracking-wide text-muted">
              <tr>
                <th className="px-5 py-3">{t('seller.enquiries.table.listing')}</th>
                <th className="px-5 py-3">{t('seller.enquiries.table.interestedBuyer')}</th>
                <th className="px-5 py-3">{t('seller.enquiries.table.location')}</th>
                <th className="px-5 py-3">{t('seller.enquiries.table.status')}</th>
                <th className="px-5 py-3">{t('seller.enquiries.table.received')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {enquiries.map((enquiry) => (
                <tr key={enquiry.id} className="transition hover:bg-paper">
                  <td className="px-5 py-4 font-semibold text-ink">{enquiry.listingTitle}</td>
                  <td className="px-5 py-4 text-ink">{enquiry.buyerName}</td>
                  <td className="px-5 py-4 text-muted">
                    {enquiry.buyerLocationCity || enquiry.buyerLocationState ? (
                      <span className="inline-flex items-center gap-1.5">
                        <MapPinIcon className="h-3.5 w-3.5" />
                        {[enquiry.buyerLocationCity, enquiry.buyerLocationState].filter(Boolean).join(', ')}
                      </span>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <StatusBadge status={enquiry.status} />
                  </td>
                  <td className="px-5 py-4 text-muted">{formatDateTime(enquiry.createdAt)}</td>
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
