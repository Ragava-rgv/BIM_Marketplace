import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { EnquiryDto } from '@machinebazaar/shared';
import { api, apiErrorMessage } from '../../lib/api';
import { formatDateTime, formatInr } from '../../lib/format';
import { Button, EmptyState, ErrorBanner, LoadingBlock, PageHeading, StatusBadge } from '../../components/ui';

export function BuyerEnquiries() {
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
          setError(apiErrorMessage(err, 'Could not load your enquiries.'));
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div>
      <PageHeading
        eyebrow="Buyer workspace"
        title="My enquiries"
        description="When you show interest in a listing, our team is notified and follows up with you directly — the seller is told only your name and location."
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
          title="No enquiries yet"
          description="Browse listings and click 'Enquire' on one you're interested in."
          action={
            <Link to="/listings">
              <Button>Browse listings</Button>
            </Link>
          }
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-line bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-line bg-paper text-left text-xs font-semibold uppercase tracking-wide text-muted">
              <tr>
                <th className="px-5 py-3">Listing</th>
                <th className="px-5 py-3">Asking price</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Enquired on</th>
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
                      <span className="font-semibold text-ink">Listing</span>
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
      )}
    </div>
  );
}
