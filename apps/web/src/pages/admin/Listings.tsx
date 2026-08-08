import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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

type BulkAction = 'approve' | 'reject' | 'mark-sold' | 'mark-inactive' | 'reactivate';

function useStatusOptions(): Array<{ value: string; label: string }> {
  const { t } = useTranslation();
  return [
    { value: '', label: t('admin.listings.statusOptions.all') },
    { value: ListingStatus.PENDING_REVIEW, label: t('common:status.listing.PENDING_REVIEW') },
    { value: ListingStatus.ACTIVE, label: t('common:status.listing.ACTIVE') },
    { value: ListingStatus.UNDER_OFFER, label: t('common:status.listing.UNDER_OFFER') },
    { value: ListingStatus.SOLD, label: t('common:status.listing.SOLD') },
    { value: ListingStatus.REJECTED, label: t('common:status.listing.REJECTED') },
    { value: ListingStatus.WITHDRAWN, label: t('admin.listings.statusOptions.inactive') },
    { value: ListingStatus.DRAFT, label: t('common:status.listing.DRAFT') },
  ];
}

export function AdminListings() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const status = searchParams.get('status') ?? '';
  const category = searchParams.get('category') ?? '';
  const statusOptions = useStatusOptions();

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
          setError(apiErrorMessage(err, t('admin.listings.loadError')));
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
      setError(apiErrorMessage(err, t('admin.listings.updateError')));
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
      setNotice(
        data.failed.length
          ? t('admin.listings.bulkResultWithFailures', { succeeded: data.succeeded, failed: data.failed.length })
          : t('admin.listings.bulkResult', { succeeded: data.succeeded }),
      );
      setReload((n) => n + 1);
    } catch (err) {
      setError(apiErrorMessage(err, t('admin.listings.bulkActionError')));
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
          eyebrow={t('admin.listings.eyebrow')}
          title={t('admin.listings.title')}
          description={t('admin.listings.description')}
        />
        <Button variant="ghost" disabled={!listings?.length} onClick={downloadExcel}>
          <DownloadIcon className="h-4 w-4" />
          {t('admin.listings.exportExcel')}
        </Button>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Field label={t('admin.listings.filters.status')}>
          <Select value={status} onChange={(e) => setSearchParams(e.target.value ? { status: e.target.value } : {})}>
            {statusOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={t('admin.listings.filters.category')}>
          <Input
            value={category}
            onChange={(e) => {
              const next: Record<string, string> = {};
              if (status) next.status = status;
              if (e.target.value) next.category = e.target.value;
              setSearchParams(next);
            }}
            placeholder={t('admin.listings.filters.categoryPlaceholder')}
          />
        </Field>
        <Field label={t('admin.listings.filters.seller')}>
          <Input
            value={sellerSearch}
            onChange={(e) => setSellerSearch(e.target.value)}
            placeholder={t('admin.listings.filters.sellerPlaceholder')}
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
          <span className="text-sm font-semibold text-navy">{t('admin.listings.selectedCount', { count: selected.size })}</span>
          <div className="ml-auto flex flex-wrap gap-2">
            <Button variant="ghost" disabled={bulkActing} onClick={() => runBulkAction('approve')}>{t('common:admin.approval.approve')}</Button>
            <Button variant="ghost" disabled={bulkActing} onClick={() => runBulkAction('reject')}>{t('common:admin.approval.reject')}</Button>
            <Button variant="ghost" disabled={bulkActing} onClick={() => runBulkAction('mark-sold')}>{t('admin.listings.markSold')}</Button>
            <Button variant="ghost" disabled={bulkActing} onClick={() => runBulkAction('mark-inactive')}>{t('admin.listings.markInactive')}</Button>
            <Button variant="ghost" disabled={bulkActing} onClick={() => runBulkAction('reactivate')}>{t('admin.listings.reactivate')}</Button>
          </div>
        </div>
      )}

      {listings === null ? (
        <LoadingBlock />
      ) : listings.length === 0 ? (
        <EmptyState title={t('admin.listings.emptyTitle')} description={t('admin.listings.emptyDescription')} />
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
                <th className="px-5 py-3">{t('admin.listings.columns.listing')}</th>
                <th className="px-5 py-3">{t('admin.listings.columns.seller')}</th>
                <th className="px-5 py-3">{t('admin.listings.columns.askingPrice')}</th>
                <th className="px-5 py-3">{t('admin.listings.columns.status')}</th>
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
                          {t('common:admin.approval.reject')}
                        </Button>
                        <Button disabled={actingId === listing.id} onClick={() => act(listing.id, 'approve')}>
                          <CheckCircleIcon className="h-4 w-4" />
                          {t('common:admin.approval.approve')}
                        </Button>
                      </div>
                    ) : listing.status === ListingStatus.ACTIVE || listing.status === ListingStatus.UNDER_OFFER ? (
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" disabled={actingId === listing.id} onClick={() => act(listing.id, 'mark-inactive')}>
                          {t('admin.listings.markInactive')}
                        </Button>
                        <Button variant="ghost" disabled={actingId === listing.id} onClick={() => act(listing.id, 'mark-sold')}>
                          {t('admin.listings.markSold')}
                        </Button>
                      </div>
                    ) : listing.status === ListingStatus.SOLD || listing.status === ListingStatus.WITHDRAWN ? (
                      <Button variant="ghost" disabled={actingId === listing.id} onClick={() => act(listing.id, 'reactivate')}>
                        {t('admin.listings.reactivate')}
                      </Button>
                    ) : (
                      <span className="text-sm text-navy/35">{t('admin.listings.noActionNeeded')}</span>
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
