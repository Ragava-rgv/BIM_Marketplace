import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { RequirementDto } from '@machinebazaar/shared';
import { api, apiErrorMessage } from '../../lib/api';
import { formatInr } from '../../lib/format';
import { Button, ErrorBanner, LoadingBlock, MonoLabel, StatusBadge } from '../../components/ui';
import { ArrowLeftIcon, CheckCircleIcon, CloseIcon } from '../../components/icons';

export function AdminRequirementReview() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [req, setReq] = useState<RequirementDto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [acting, setActing] = useState(false);
  const [quoteActing, setQuoteActing] = useState<string | null>(null);

  const load = () => {
    if (!id) return;
    api.get<RequirementDto>(`/admin/requirements/${id}`)
      .then(({ data }) => setReq(data))
      .catch((err) => setError(apiErrorMessage(err, t('admin.requirementReview.notFound'))));
  };

  useEffect(load, [id]);

  const act = async (action: 'approve' | 'reject') => {
    if (!req) return;
    setActing(true);
    setError(null);
    try {
      await api.post(`/admin/requirements/${req.id}/${action}`);
      navigate('/admin/requirements');
    } catch (err) {
      setError(apiErrorMessage(err, t('admin.requirementReview.actionError')));
    } finally {
      setActing(false);
    }
  };

  const actOnQuote = async (quoteId: string, action: 'approve' | 'reject') => {
    setQuoteActing(quoteId);
    setError(null);
    try {
      await api.post(`/admin/quotes/${quoteId}/${action}`);
      load();
    } catch (err) {
      setError(apiErrorMessage(err, t('admin.requirementReview.quoteActionError')));
    } finally {
      setQuoteActing(null);
    }
  };

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

      {error && <div className="mb-5"><ErrorBanner message={error} /></div>}

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1.4fr_1fr]">
        <div>
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
                  {q.status === 'PENDING_ADMIN' && (
                    <div className="mt-3 flex gap-2">
                      <Button onClick={() => actOnQuote(q.id, 'approve')} disabled={quoteActing === q.id}>{t('admin.requirementReview.approveQuote')}</Button>
                      <Button variant="ghost" onClick={() => actOnQuote(q.id, 'reject')} disabled={quoteActing === q.id}>{t('admin.requirementReview.rejectQuote')}</Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          {req.status === 'PENDING_REVIEW' && (
            <div className="rounded-xl border border-line bg-white p-5">
              <p className="mb-3 text-sm font-semibold text-ink">{t('admin.requirementReview.decisionHeading')}</p>
              <div className="flex gap-3">
                <Button onClick={() => act('approve')} disabled={acting}>
                  <CheckCircleIcon className="h-4 w-4" />
                  {t('admin.requirementReview.approve')}
                </Button>
                <Button variant="ghost" onClick={() => act('reject')} disabled={acting}>
                  <CloseIcon className="h-4 w-4" />
                  {t('admin.requirementReview.reject')}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
