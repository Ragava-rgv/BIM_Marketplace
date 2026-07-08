import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import type { ListingDto } from '@machinebazaar/shared';
import { ListingStatus } from '@machinebazaar/shared';
import { api, apiErrorMessage } from '../../lib/api';
import { formatInr } from '../../lib/format';
import { Button, EmptyState, ErrorBanner, LoadingBlock, PageHeading, Select, StatusBadge } from '../../components/ui';
import { CheckCircleIcon, CloseIcon, DownloadIcon } from '../../components/icons';
import { exportToExcel } from '../../lib/export';

const STATUS_OPTIONS: Array<{ value: string; label: string }> = [
  { value: '', label: 'All statuses' },
  { value: ListingStatus.PENDING_REVIEW, label: 'Pending review' },
  { value: ListingStatus.ACTIVE, label: 'Active' },
  { value: ListingStatus.UNDER_OFFER, label: 'Under offer' },
  { value: ListingStatus.SOLD, label: 'Sold' },
  { value: ListingStatus.REJECTED, label: 'Rejected' },
  { value: ListingStatus.WITHDRAWN, label: 'Withdrawn' },
  { value: ListingStatus.DRAFT, label: 'Draft' },
];

export function AdminListings() {
  const [searchParams, setSearchParams] = useSearchParams();
  const status = searchParams.get('status') ?? ListingStatus.PENDING_REVIEW;

  const [listings, setListings] = useState<ListingDto[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actingId, setActingId] = useState<string | null>(null);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setListings(null);
    const params: Record<string, string> = { pageSize: '50' };
    if (status) params.status = status;
    api
      .get<{ items: ListingDto[]; total: number }>('/admin/listings', { params })
      .then(({ data }) => {
        if (!cancelled) setListings(data.items);
      })
      .catch((err) => {
        if (!cancelled) {
          setListings([]);
          setError(apiErrorMessage(err, 'Could not load the listing queue.'));
        }
      });
    return () => {
      cancelled = true;
    };
  }, [status, reload]);

  const act = async (id: string, action: 'approve' | 'reject') => {
    setActingId(id);
    setError(null);
    try {
      await api.post(`/admin/listings/${id}/${action}`);
      setReload((n) => n + 1);
    } catch (err) {
      setError(apiErrorMessage(err, `Could not ${action} this listing.`));
    } finally {
      setActingId(null);
    }
  };

  const downloadExcel = () => {
    if (!listings?.length) return;
    exportToExcel(
      listings.map((l) => ({
        'Title': l.title,
        'Make': l.machineMake,
        'Model': l.machineModel,
        'Category': l.machineCategory,
        'Subcategory': l.machineSubcategory ?? '',
        'Location City': l.locationCity,
        'Location State': l.locationState,
        'Asking Price (₹)': Number(l.askingPrice),
        'Status': l.status,
        'Manufacture Year': l.manufactureYear,
      })),
      'listings',
    );
  };

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <PageHeading
          eyebrow="Admin console"
          title="Listing review queue"
          description="Approve or reject seller submissions. Approving publishes the listing immediately; rejecting returns it to the seller for edits."
        />
        <div className="flex items-center gap-3">
          <div className="w-52">
            <Select value={status} onChange={(e) => setSearchParams(e.target.value ? { status: e.target.value } : {})}>
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </Select>
          </div>
          <Button variant="ghost" disabled={!listings?.length} onClick={downloadExcel}>
            <DownloadIcon className="h-4 w-4" />
            Export Excel
          </Button>
        </div>
      </div>

      {error && (
        <div className="mb-5">
          <ErrorBanner message={error} />
        </div>
      )}

      {listings === null ? (
        <LoadingBlock />
      ) : listings.length === 0 ? (
        <EmptyState title="Nothing here" description="No listings match the selected status right now." />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-navy/10 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-navy/10 bg-navy/[0.02] text-left text-xs font-semibold uppercase tracking-wide text-navy/40">
              <tr>
                <th className="px-5 py-3">Listing</th>
                <th className="px-5 py-3">Seller</th>
                <th className="px-5 py-3">Asking price</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-navy/10">
              {listings.map((listing) => (
                <tr key={listing.id} className="transition hover:bg-navy/[0.02]">
                  <td className="px-5 py-4">
                    <Link to={`/admin/listings/${listing.id}`} className="font-semibold text-navy hover:text-accent">
                      {listing.title}
                    </Link>
                    <p className="text-navy/45">{listing.machineMake} · {listing.machineModel} · {listing.locationCity}</p>
                  </td>
                  <td className="px-5 py-4 text-navy/55">{listing.sellerId.slice(0, 8)}...</td>
                  <td className="px-5 py-4 font-medium text-navy">{formatInr(listing.askingPrice)}</td>
                  <td className="px-5 py-4">
                    <StatusBadge status={listing.status} />
                  </td>
                  <td className="px-5 py-4 text-right">
                    {listing.status === ListingStatus.PENDING_REVIEW ? (
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          disabled={actingId === listing.id}
                          onClick={() => act(listing.id, 'reject')}
                        >
                          <CloseIcon className="h-4 w-4" />
                          Reject
                        </Button>
                        <Button disabled={actingId === listing.id} onClick={() => act(listing.id, 'approve')}>
                          <CheckCircleIcon className="h-4 w-4" />
                          Approve
                        </Button>
                      </div>
                    ) : (
                      <span className="text-sm text-navy/35">No action needed</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
