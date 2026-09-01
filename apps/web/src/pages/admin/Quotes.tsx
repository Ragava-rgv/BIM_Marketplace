import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { QuoteDto } from '@machinebazaar/shared';
import { api, apiErrorMessage } from '../../lib/api';
import { formatInr } from '../../lib/format';
import { Button, EmptyState, ErrorBanner, LoadingBlock, PageHeading, Select, StatusBadge } from '../../components/ui';

const STATUS_OPTIONS = ['PENDING_ADMIN', 'APPROVED', 'REJECTED'];

export function AdminQuotes() {
  const { t } = useTranslation();
  const [status, setStatus] = useState('PENDING_ADMIN');
  const [quotes, setQuotes] = useState<QuoteDto[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [acting, setActing] = useState<string | null>(null);

  const load = () => {
    setQuotes(null);
    api.get<QuoteDto[]>('/admin/quotes', { params: { status } })
      .then(({ data }) => setQuotes(data))
      .catch(() => setQuotes([]));
  };

  useEffect(load, [status]);

  const act = async (id: string, action: 'approve' | 'reject') => {
    setActing(id);
    setError(null);
    try {
      await api.post(`/admin/quotes/${id}/${action}`);
      load();
    } catch (err) {
      setError(apiErrorMessage(err, t('admin.quotes.actionError')));
    } finally {
      setActing(null);
    }
  };

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <PageHeading eyebrow={t('admin.quotes.eyebrow')} title={t('admin.quotes.title')} description={t('admin.quotes.description')} />
        <Select value={status} onChange={(e) => setStatus(e.target.value)} className="w-48">
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>{t(`common:status.quote.${s}`, s)}</option>
          ))}
        </Select>
      </div>

      {error && <div className="mb-5"><ErrorBanner message={error} /></div>}

      {quotes === null ? (
        <LoadingBlock />
      ) : quotes.length === 0 ? (
        <EmptyState title={t('admin.quotes.emptyState.title')} description={t('admin.quotes.emptyState.description')} />
      ) : (
        <div className="space-y-3">
          {quotes.map((q) => (
            <div key={q.id} className="rounded-xl border border-navy/10 bg-white p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <Link to={`/admin/requirements/${q.requirementId}`} className="font-semibold text-navy hover:text-forest">
                    {q.requirement?.title}
                  </Link>
                  <p className="text-sm text-navy/50">
                    {t('admin.quotes.from')} {q.responder?.fullName} · {t('admin.quotes.for')} {q.requirement?.buyer?.fullName}
                  </p>
                  {(q.contactName || q.contactPhone) && (
                    <p className="mt-1 text-sm text-navy/50">
                      {[q.contactName, q.contactPhone, q.contactCompany].filter(Boolean).join(' · ')}
                    </p>
                  )}
                  <p className="mt-1 text-sm text-navy">
                    {q.listing?.title ?? `${q.machineCategory ? `${q.machineCategory} — ` : ''}${q.machineMake ?? ''} ${q.machineModel ?? ''}`.trim()}
                  </p>
                  {q.machineLocation && <p className="mt-1 text-sm text-navy/50">{q.machineLocation}</p>}
                  {q.description && <p className="mt-1 text-sm text-navy/70">{q.description}</p>}
                  {q.message && <p className="mt-1 text-sm text-navy/70">{q.message}</p>}
                </div>
                <div className="text-right">
                  {q.price && <p className="font-mono font-bold text-forest">{formatInr(q.price)}</p>}
                  <StatusBadge status={q.status} />
                </div>
              </div>
              {q.media && q.media.length > 0 && (
                <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-6">
                  {q.media.map((m) => (
                    <a key={m.id} href={m.url} target="_blank" rel="noopener noreferrer" className="aspect-square overflow-hidden rounded-lg border border-navy/10">
                      <img src={m.url} alt="" className="h-full w-full object-cover" />
                    </a>
                  ))}
                </div>
              )}
              {q.status === 'PENDING_ADMIN' && (
                <div className="mt-3 flex gap-2">
                  <Button onClick={() => act(q.id, 'approve')} disabled={acting === q.id}>{t('admin.quotes.approve')}</Button>
                  <Button variant="ghost" onClick={() => act(q.id, 'reject')} disabled={acting === q.id}>{t('admin.quotes.reject')}</Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
