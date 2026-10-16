import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { RequirementDto } from '../../shared';
import { api, apiErrorMessage } from '../../lib/api';
import { formatInr } from '../../lib/format';
import { ErrorBanner, LoadingBlock, MonoLabel, StatusBadge } from '../../components/ui';
import { ArrowLeftIcon } from '../../components/icons';

/** Read-only traceability detail — requirements and quotes have no approval gate, so
    there's nothing to decide here, only to audit. */
export function AdminRequirementReview() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();

  const [req, setReq] = useState<RequirementDto | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    api.get<RequirementDto>(`/admin/requirements/${id}`)
      .then(({ data }) => setReq(data))
      .catch((err) => setError(apiErrorMessage(err, t('admin.requirementReview.notFound'))));
  }, [id, t]);

  if (error && !req) {
    return (
      <div className="mx-auto max-w-3xl py-16 text-center">
        <ErrorBanner message={error} />
        <Link to="/admin/requirements" className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-forest">
          <ArrowLeftIcon className="h-4 w-4" />
          {t('admin.requirementReview.backToQueue')}
        </Link>
      </div>
    );
  }
  if (!req) return <LoadingBlock />;

  return (
    <div>
      <Link to="/admin/requirements" className="mb-6 inline-flex items-center gap-1.5 text-[13.5px] font-semibold text-muted hover:text-ink">
        <ArrowLeftIcon className="h-4 w-4" />
        {t('admin.requirementReview.backToQueue')}
      </Link>

      <div className="mb-4 flex items-center gap-3">
        <h1 className="font-display text-2xl text-ink">{req.title}</h1>
        <StatusBadge status={req.status} />
      </div>
      <p className="whitespace-pre-line text-sm leading-relaxed text-ink">{req.description}</p>

      <div className="mt-6 grid grid-cols-2 gap-4 rounded-xl border border-line bg-paper p-4 text-sm sm:grid-cols-3">
        <div><MonoLabel>{t('admin.requirementReview.category')}</MonoLabel><p className="mt-0.5 font-semibold">{req.machineCategory}</p></div>
        <div><MonoLabel>{t('admin.requirementReview.origin')}</MonoLabel><p className="mt-0.5 font-semibold">{req.origin ?? '—'}</p></div>
        <div><MonoLabel>{t('common:listing.condition')}</MonoLabel><p className="mt-0.5 font-semibold">{req.condition ?? '—'}</p></div>
        <div><MonoLabel>{t('admin.requirementReview.location')}</MonoLabel><p className="mt-0.5 font-semibold">{[req.locationCity, req.locationState].filter(Boolean).join(', ') || '—'}</p></div>
        <div><MonoLabel>{t('admin.requirementReview.budget')}</MonoLabel><p className="mt-0.5 font-semibold">{req.budgetMax ? formatInr(req.budgetMax) : '—'}</p></div>
      </div>

      <h2 className="mt-8 mb-3 font-display text-lg text-ink">{t('admin.requirementReview.quotesHeading')}</h2>
      {!req.quotes || req.quotes.length === 0 ? (
        <p className="text-sm text-muted">{t('admin.requirementReview.noQuotes')}</p>
      ) : (
        <div className="space-y-3">
          {req.quotes.map((q) => (
            <div key={q.id} className="rounded-xl border border-line bg-white p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-semibold text-ink">{q.listing?.title ?? `${q.machineMake ?? ''} ${q.machineModel ?? ''}`.trim()}</p>
                  <p className="text-sm text-muted">{t('admin.requirementReview.responder')}: {q.responder?.fullName}</p>
                </div>
                <StatusBadge status={q.status} />
              </div>
              {q.message && <p className="mt-2 text-sm text-ink">{q.message}</p>}
              {q.price && <p className="mt-1 font-mono font-bold text-forest">{formatInr(q.price)}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
