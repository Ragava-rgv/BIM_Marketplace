import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { QuoteDto, RequirementDto } from '@machinebazaar/shared';
import { api, apiErrorMessage } from '../../lib/api';
import { formatInr } from '../../lib/format';
import {
  RequirementDetailsForm,
  requirementDetailsToPayload,
  type RequirementDetailsValues,
} from '../../components/RequirementDetailsForm';
import { Button, Card, ErrorBanner, LoadingBlock, PageHeading, StatusBadge, SuccessBanner } from '../../components/ui';
import { ArrowLeftIcon } from '../../components/icons';

const EDITABLE = new Set(['DRAFT', 'REJECTED']);

function toDetailsValues(req: RequirementDto): RequirementDetailsValues {
  return {
    title: req.title,
    description: req.description,
    machineCategory: req.machineCategory,
    machineSubcategory: req.machineSubcategory ?? '',
    manufactureYear: req.manufactureYear != null ? String(req.manufactureYear) : '',
    origin: req.origin ?? '',
    importedCountry: req.importedCountry ?? '',
    condition: req.condition ?? '',
    complexityTier: req.complexityTier,
    runningHours: req.runningHours != null ? String(req.runningHours) : '',
    catalogCategoryId: req.catalogCategoryId ?? '',
    specs: (req.specs as Record<string, string>) ?? {},
    budgetMin: req.budgetMin ?? '',
    budgetMax: req.budgetMax ?? '',
    quantity: req.quantity != null ? String(req.quantity) : '1',
    locationCity: req.locationCity ?? '',
    locationState: req.locationState ?? '',
  };
}

export function EditRequirement() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();

  const [req, setReq] = useState<RequirementDto | null>(null);
  const [quotes, setQuotes] = useState<QuoteDto[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [closing, setClosing] = useState(false);

  const load = () => {
    if (!id) return;
    api.get<RequirementDto>(`/requirements/mine/${id}`)
      .then(({ data }) => setReq(data))
      .catch((err) => setLoadError(apiErrorMessage(err, t('buyer.editRequirement.errors.notFound'))));
    api.get<QuoteDto[]>(`/requirements/${id}/quotes`).then(({ data }) => setQuotes(data)).catch(() => {});
  };

  useEffect(load, [id]);

  if (loadError) {
    return (
      <div className="text-center">
        <ErrorBanner message={loadError} />
        <Link to="/buyer/requirements" className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-accent">
          <ArrowLeftIcon className="h-4 w-4" />
          {t('buyer.editRequirement.backToRequirements')}
        </Link>
      </div>
    );
  }

  if (!req) return <LoadingBlock />;

  const editable = EDITABLE.has(req.status);

  const handleUpdate = async (values: RequirementDetailsValues) => {
    setActionError(null);
    setNotice(null);
    setSaving(true);
    try {
      const { data } = await api.patch<RequirementDto>(`/requirements/${req.id}`, requirementDetailsToPayload(values));
      setReq(data);
      setNotice(t('buyer.editRequirement.notices.updated'));
    } catch (err) {
      setActionError(apiErrorMessage(err, t('buyer.editRequirement.errors.updateFailed')));
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async () => {
    setActionError(null);
    setNotice(null);
    setSubmitting(true);
    try {
      const { data } = await api.post<RequirementDto>(`/requirements/${req.id}/submit`);
      setReq(data);
      setNotice(t('buyer.editRequirement.notices.submitted'));
    } catch (err) {
      setActionError(apiErrorMessage(err, t('buyer.editRequirement.errors.submitFailed')));
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = async () => {
    setActionError(null);
    setNotice(null);
    setClosing(true);
    try {
      const { data } = await api.post<RequirementDto>(`/requirements/${req.id}/close`);
      setReq(data);
      setNotice(t('buyer.editRequirement.notices.closed'));
    } catch (err) {
      setActionError(apiErrorMessage(err, t('buyer.editRequirement.errors.closeFailed')));
    } finally {
      setClosing(false);
    }
  };

  return (
    <div>
      <Link to="/buyer/requirements" className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-navy/55 hover:text-navy">
        <ArrowLeftIcon className="h-4 w-4" />
        {t('buyer.editRequirement.backToRequirements')}
      </Link>

      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <PageHeading title={req.title} description={t('buyer.editRequirement.description')} />
        <StatusBadge status={req.status} />
      </div>

      {actionError && <div className="mb-5"><ErrorBanner message={actionError} /></div>}
      {notice && <div className="mb-5"><SuccessBanner message={notice} /></div>}

      <div className="space-y-10">
        <section>
          <h2 className="mb-4 font-display text-xl text-navy">{t('buyer.editRequirement.sections.detailsHeading')}</h2>
          {editable ? (
            <Card className="max-w-2xl">
              <RequirementDetailsForm initial={toDetailsValues(req)} submitLabel={t('buyer.editRequirement.saveChanges')} submitting={saving} onSubmit={handleUpdate} />
            </Card>
          ) : (
            <Card className="max-w-2xl space-y-2 text-sm text-navy/65">
              <p>{req.description}</p>
              <p className="text-navy/45">{req.machineCategory}{req.machineSubcategory ? ` · ${req.machineSubcategory}` : ''}</p>
            </Card>
          )}
        </section>

        <section>
          <h2 className="mb-4 font-display text-xl text-navy">{t('buyer.editRequirement.sections.quotesHeading')}</h2>
          {quotes.length === 0 ? (
            <p className="text-sm text-navy/45">{t('buyer.editRequirement.noQuotes')}</p>
          ) : (
            <div className="space-y-3">
              {quotes.map((q) => (
                <Card key={q.id} className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-navy">
                      {q.listing?.title ?? `${q.machineMake ?? ''} ${q.machineModel ?? ''}`.trim()}
                    </p>
                    <p className="text-sm text-navy/50">{t('buyer.editRequirement.quoteFrom', { name: q.responder?.fullName ?? '—' })}</p>
                    {q.message && <p className="mt-1 text-sm text-navy/65">{q.message}</p>}
                  </div>
                  {q.price && <p className="font-mono text-lg font-bold text-forest">{formatInr(q.price)}</p>}
                </Card>
              ))}
            </div>
          )}
        </section>

        <section className="flex flex-wrap gap-3 border-t border-navy/10 pt-8">
          {editable && (
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? t('buyer.editRequirement.submitting') : t('buyer.editRequirement.submitForReview')}
            </Button>
          )}
          {req.status !== 'CLOSED' && (
            <Button variant="ghost" onClick={handleClose} disabled={closing}>
              {closing ? t('buyer.editRequirement.closing') : t('buyer.editRequirement.closeRequirement')}
            </Button>
          )}
        </section>
      </div>
    </div>
  );
}
