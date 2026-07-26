import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import type { ListingDto } from '@machinebazaar/shared';
import { ListingStatus } from '@machinebazaar/shared';
import { api, apiErrorMessage } from '../../lib/api';
import { formatInr } from '../../lib/format';
import { Button, EmptyState, ErrorBanner, Field, Input, LoadingBlock, PageHeading, Select, StatusBadge, SuccessBanner } from '../../components/ui';
import { CheckCircleIcon, CloseIcon, DownloadIcon } from '../../components/icons';
import { exportToExcel } from '../../lib/export';

type ListingRow = Omit<ListingDto, 'seller'> & {
  seller?: { id: string; fullName: string; email: string | null; phone: string };
};

const STATUS_OPTIONS: Array<{ value: string; label: string }> = [
  { value: '', label: 'All statuses' },
  { value: ListingStatus.PENDING_REVIEW, label: 'Pending review' },
  { value: ListingStatus.ACTIVE, label: 'Active' },
  { value: ListingStatus.UNDER_OFFER, label: 'Under offer' },
  { value: ListingStatus.SOLD, label: 'Sold' },
  { value: ListingStatus.REJECTED, label: 'Rejected' },
  { value: ListingStatus.WITHDRAWN, label: 'Inactive' },
  { value: ListingStatus.DRAFT, label: 'Draft' },
];

type BulkAction = 'approve' | 'reject' | 'mark-sold' | 'mark-inactive' | 'reactivate';

export function AdminListings() {
  const [searchParams, setSearchParams] = useSearchParams();
  const status = searchParams.get('status') ?? '';
  const category = searchParams.get('category') ?? '';

  const [sellerSearch, setSellerSearch] = useState('');
  const [listings, setListings] = useState<ListingRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [actingId, setActingId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkActing, setBulkActing] = useState(false);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setListings(null);
    const params: Record<string, string> = { pageSize: '50' };
    if (status) params.status = status;
    if (category) params.category = category;
    if (sellerSearch) params.sellerSearch = sellerSearch;
    api
      .get<{ items: ListingRow[]; total: number }>('/admin/listings', { params })
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, category, sellerSearch, reload]);

  useEffect(() => {
    setSelected(new Set());
  }, [status, category, sellerSearch, reload]);

  const act = async (id: string, action: BulkAction) => {
    setActingId(id);
    setError(null);
    try {
      await api.post(`/admin/listings/${id}/${action}`);
      setReload((n) => n + 1);
    } catch (err) {
      setError(apiErrorMessage(err, `Could not update this listing.`));
    } finally {
      setActingId(null);
    }
  };

  const toggleSelected = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (!listings) return;
    setSelected((prev) => (prev.size === listings.length ? new Set() : new Set(listings.map((l) => l.id))));
  };

  const runBulkAction = async (action: BulkAction) => {
    if (selected.size === 0) return;
    setBulkActing(true);
    setError(null);
    setNotice(null);
    try {
      const { data } = await api.post<{ succeeded: number; failed: { id: string; error: string }[] }>(
        '/admin/listings/bulk-status',
        { ids: Array.from(selected), action },
      );
      setNotice(`${data.succeeded} listing(s) updated${data.failed.length ? `, ${data.failed.length} failed` : ''}.`);
      setReload((n) => n + 1);
    } catch (err) {
      setError(apiErrorMessage(err, 'Bulk action failed.'));
    } finally {
      setBulkActing(false);
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
        'Seller': l.seller?.fullName ?? '',
        'Location City': l.locationCity,
        'Location State': l.locationState,
        'Asking Price (₹)': Number(l.askingPrice),
        'Status': l.status,
        'Manufacture Year': l.manufactureYear ?? '',
      })),
      'listings',
    );
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <PageHeading
          eyebrow="Admin console"
          title="Listing management"
          description="Approve or reject seller submissions, and manage the lifecycle of live listings (sold / inactive / reactivate)."
        />
        <Button variant="ghost" disabled={!listings?.length} onClick={downloadExcel}>
          <DownloadIcon className="h-4 w-4" />
          Export Excel
        </Button>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Field label="Status">
          <Select value={status} onChange={(e) => setSearchParams(e.target.value ? { status: e.target.value } : {})}>
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Category">
          <Input
            value={category}
            onChange={(e) => {
              const next: Record<string, string> = {};
              if (status) next.status = status;
              if (e.target.value) next.category = e.target.value;
              setSearchParams(next);
            }}
            placeholder="e.g. Metal Working Machines"
          />
        </Field>
        <Field label="Seller">
          <Input
            value={sellerSearch}
            onChange={(e) => setSellerSearch(e.target.value)}
            placeholder="Search name, email or phone"
          />
        </Field>
      </div>

      {error && (
        <div className="mb-5">
          <ErrorBanner message={error} />
        </div>
      )}
      {notice && (
        <div className="mb-5">
          <SuccessBanner message={notice} />
        </div>
      )}

      {selected.size > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-navy/10 bg-navy/[0.02] px-4 py-3">
          <span className="text-sm font-semibold text-navy">{selected.size} selected</span>
          <div className="ml-auto flex flex-wrap gap-2">
            <Button variant="ghost" disabled={bulkActing} onClick={() => runBulkAction('approve')}>Approve</Button>
            <Button variant="ghost" disabled={bulkActing} onClick={() => runBulkAction('reject')}>Reject</Button>
            <Button variant="ghost" disabled={bulkActing} onClick={() => runBulkAction('mark-sold')}>Mark Sold</Button>
            <Button variant="ghost" disabled={bulkActing} onClick={() => runBulkAction('mark-inactive')}>Mark Inactive</Button>
            <Button variant="ghost" disabled={bulkActing} onClick={() => runBulkAction('reactivate')}>Reactivate</Button>
          </div>
        </div>
      )}

      {listings === null ? (
        <LoadingBlock />
      ) : listings.length === 0 ? (
        <EmptyState title="Nothing here" description="No listings match the current filters." />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-navy/10 bg-white">
          <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-navy/10 bg-navy/[0.02] text-left text-xs font-semibold uppercase tracking-wide text-navy/40">
              <tr>
                <th className="w-10 px-5 py-3">
                  <input
                    type="checkbox"
                    checked={selected.size === listings.length}
                    onChange={toggleSelectAll}
                    className="h-4 w-4 rounded border-navy/20"
                  />
                </th>
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
                    <input
                      type="checkbox"
                      checked={selected.has(listing.id)}
                      onChange={() => toggleSelected(listing.id)}
                      className="h-4 w-4 rounded border-navy/20"
                    />
                  </td>
                  <td className="px-5 py-4">
                    <Link to={`/admin/listings/${listing.id}`} className="font-semibold text-navy hover:text-accent">
                      {listing.title}
                    </Link>
                    <p className="text-navy/45">{listing.machineMake} · {listing.machineModel} · {listing.locationCity}</p>
                  </td>
                  <td className="px-5 py-4 text-navy/55">
                    {listing.seller ? (
                      <>
                        <p className="font-medium text-navy/70">{listing.seller.fullName}</p>
                        <p className="text-xs text-navy/40">{listing.seller.phone}</p>
                      </>
                    ) : (
                      `${listing.sellerId.slice(0, 8)}...`
                    )}
                  </td>
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
                    ) : listing.status === ListingStatus.ACTIVE || listing.status === ListingStatus.UNDER_OFFER ? (
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" disabled={actingId === listing.id} onClick={() => act(listing.id, 'mark-inactive')}>
                          Mark Inactive
                        </Button>
                        <Button variant="ghost" disabled={actingId === listing.id} onClick={() => act(listing.id, 'mark-sold')}>
                          Mark Sold
                        </Button>
                      </div>
                    ) : listing.status === ListingStatus.SOLD || listing.status === ListingStatus.WITHDRAWN ? (
                      <Button variant="ghost" disabled={actingId === listing.id} onClick={() => act(listing.id, 'reactivate')}>
                        Reactivate
                      </Button>
                    ) : (
                      <span className="text-sm text-navy/35">No action needed</span>
                    )}
                  </td>
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
