import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { EnquiryDto } from '@machinebazaar/shared';
import { api, apiErrorMessage } from '../../lib/api';
import { formatDateTime, formatInr } from '../../lib/format';
import { Button, EmptyState, ErrorBanner, LoadingBlock, PageHeading, StatusBadge } from '../../components/ui';

export function BuyerEnquiries() {
  const { t } = useTranslation();
  const [enquiries, setEnquiries] = useState<EnquiryDto[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    api
      .get<EnquiryDto[]>('/enquiries/mine')
      .then(({ data }) => {
        if (!cancelled) setEnquiries(data);
      })
      .catch((err) => {
        if (!cancelled) {
          setEnquiries([]);
          setError(apiErrorMessage(err, t('buyer.enquiries.errorLoad')));
        }
      });
    return () => {
      cancelled = true;
    };
  }, [t]);

  return (
    <div>
      <PageHeading
        eyebrow={t('buyer.enquiries.eyebrow')}
        title={t('buyer.enquiries.title')}
        description={t('buyer.enquiries.description')}
      />

      {error && (
        <div className="mb-5">
          <ErrorBanner message={error} />
        </div>
      )}

      {enquiries === null ? (
        <LoadingBlock />
      ) : enquiries.length === 0 ? (
        <EmptyState
          title={t('buyer.enquiries.emptyTitle')}
          description={t('buyer.enquiries.emptyDescription')}
          action={
            <Link to="/listings">
              <Button>{t('buyer.enquiries.browseButton')}</Button>
            </Link>
          }
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-line bg-white">
          <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-line bg-paper text-left text-xs font-semibold uppercase tracking-wide text-muted">
              <tr>
                <th className="px-5 py-3">{t('buyer.enquiries.table.listing')}</th>
                <th className="px-5 py-3">{t('buyer.enquiries.table.askingPrice')}</th>
                <th className="px-5 py-3">{t('buyer.enquiries.table.status')}</th>
                <th className="px-5 py-3">{t('buyer.enquiries.table.enquiredOn')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {enquiries.map((enquiry) => (
                <tr key={enquiry.id} className="transition hover:bg-paper">
                  <td className="px-5 py-4">
                    {enquiry.listing ? (
                      <Link to={`/listings/${enquiry.listing.id}`} className="font-semibold text-ink hover:text-forest">
                        {enquiry.listing.title}
                      </Link>
                    ) : (
                      <span className="font-semibold text-ink">{t('buyer.enquiries.table.listingFallback')}</span>
                    )}
                  </td>
                  <td className="px-5 py-4 font-medium text-ink">{enquiry.listing ? formatInr(enquiry.listing.askingPrice) : '—'}</td>
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
