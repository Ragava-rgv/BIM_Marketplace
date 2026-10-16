import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { QuoteDto, RequirementDto } from '../../shared';
import { api, apiErrorMessage } from '../../lib/api';
import { formatInrShort } from '../../lib/format';
import { AppLayout } from '../../components/AppLayout';
import { ChevronRightIcon } from '../../components/icons';

const EDITABLE = new Set(['ACTIVE']);

export function EditRequirement() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [req, setReq] = useState<RequirementDto | null>(null);
  const [quotes, setQuotes] = useState<QuoteDto[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = () => {
    if (!id) return;
    api.get<RequirementDto>(`/requirements/mine/${id}`).then(({ data }) => setReq(data)).catch((err) => setError(apiErrorMessage(err, t('buyer.editRequirement.errors.notFound'))));
    api.get<QuoteDto[]>(`/requirements/${id}/quotes`).then(({ data }) => setQuotes(data)).catch(() => {});
  };

  useEffect(load, [id]);

  const markFulfilled = async () => {
    if (!req) return;
    setBusy(true);
    setActionError(null);
    try {
      await api.post(`/requirements/${req.id}/fulfilled`);
      load();
    } catch (err) {
      setActionError(apiErrorMessage(err, t('buyer.editRequirement.errors.fulfilledFailed')));
    } finally {
      setBusy(false);
    }
  };

  const closeRequirement = async () => {
    if (!req) return;
    setBusy(true);
    setActionError(null);
    try {
      await api.post(`/requirements/${req.id}/close`);
      load();
    } catch (err) {
      setActionError(apiErrorMessage(err, t('buyer.editRequirement.errors.closeFailed')));
    } finally {
      setBusy(false);
    }
  };

  if (error) {
    return (
      <AppLayout>
        <div className="px-4 py-16 text-center">
          <p className="text-[13px] text-red-600 font-medium">{error}</p>
          <button onClick={() => navigate('/buyer/requirements')} className="mt-4 text-[13px] font-semibold text-forest">
            {t('buyer.editRequirement.backToRequirements')}
          </button>
        </div>
      </AppLayout>
    );
  }
  if (!req) return <AppLayout><div className="px-4 py-16 text-center text-gray-400 text-[13px]">…</div></AppLayout>;

  const editable = EDITABLE.has(req.status);

  return (
    <AppLayout>
      <div className="bg-white border-b border-gray-200 px-4 pt-4 pb-3 flex items-center gap-3">
        <button onClick={() => navigate('/buyer/requirements')} className="w-8 h-8 flex items-center justify-center flex-shrink-0">
          <ChevronRightIcon className="w-4 h-4 text-gray-500 rotate-180" />
        </button>
        <div className="min-w-0">
          <h1 className="text-[16px] font-extrabold text-ink tracking-[-0.3px] truncate">{req.title}</h1>
          <p className="text-[11px] text-gray-500">{t(`common:status.requirement.${req.status}`, req.status)}</p>
        </div>
      </div>

      <div className="px-4 pt-4 pb-8 space-y-5">
        {actionError && (
          <p className="text-[12px] text-red-600 font-medium bg-red-50 border border-red-200 rounded-[10px] px-3 py-2.5">{actionError}</p>
        )}

        <div className="bg-white border border-gray-200 rounded-[13px] p-4">
          <p className="text-[13px] text-ink leading-relaxed">{req.description}</p>
          <p className="text-[11.5px] text-gray-400 mt-2">{req.machineCategory}{req.machineSubcategory ? ` · ${req.machineSubcategory}` : ''}</p>
          {req.budgetMax && <p className="font-mono text-[13px] font-bold text-forest mt-1.5">{formatInrShort(req.budgetMax)}</p>}
        </div>

        <div>
          <h2 className="text-[13.5px] font-bold text-ink mb-2">{t('buyer.editRequirement.sections.quotesHeading')}</h2>
          {quotes.length === 0 ? (
            <p className="text-[12px] text-gray-400">{t('buyer.editRequirement.noQuotes')}</p>
          ) : (
            <div className="space-y-2.5">
              {quotes.map((q) => (
                <div key={q.id} className="bg-white border border-gray-200 rounded-[12px] p-3">
                  <p className="text-[13px] font-bold text-ink">{q.listing?.title ?? `${q.machineMake ?? ''} ${q.machineModel ?? ''}`.trim()}</p>
                  <p className="text-[11px] text-gray-500 mt-0.5">{t('buyer.editRequirement.quoteFrom', { name: q.responder?.fullName ?? '—' })}</p>
                  {q.message && <p className="text-[12px] text-ink mt-1.5">{q.message}</p>}
                  {q.price && <p className="font-mono text-[13px] font-bold text-forest mt-1">{formatInrShort(q.price)}</p>}
                </div>
              ))}
            </div>
          )}
        </div>

        {editable && (
          <button onClick={markFulfilled} disabled={busy} className="w-full h-[50px] bg-forest text-white rounded-[13px] text-[14px] font-bold disabled:opacity-50">
            {busy ? t('buyer.editRequirement.markingFulfilled') : t('buyer.editRequirement.markFulfilled')}
          </button>
        )}
        {req.status !== 'CLOSED' && (
          <button onClick={closeRequirement} disabled={busy} className="w-full h-[46px] bg-white border border-red-200 text-red-600 rounded-[13px] text-[13.5px] font-bold disabled:opacity-50">
            {busy ? t('buyer.editRequirement.closing') : t('buyer.editRequirement.closeRequirement')}
          </button>
        )}
      </div>
    </AppLayout>
  );
}
