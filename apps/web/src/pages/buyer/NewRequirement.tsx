import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { RequirementDto } from '@machinebazaar/shared';
import { api, apiErrorMessage } from '../../lib/api';
import {
  EMPTY_REQUIREMENT_DETAILS,
  RequirementDetailsForm,
  requirementDetailsToPayload,
  type RequirementDetailsValues,
} from '../../components/RequirementDetailsForm';
import { Button, Card, ErrorBanner, PageHeading } from '../../components/ui';
import { CheckCircleIcon } from '../../components/icons';

export function NewRequirement() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [posted, setPosted] = useState<RequirementDto | null>(null);

  const handleCreate = async (values: RequirementDetailsValues) => {
    setError(null);
    setCreating(true);
    try {
      // No approval gate — posting goes live immediately, no separate submit-for-review step.
      const { data } = await api.post<RequirementDto>('/requirements', requirementDetailsToPayload(values));
      setPosted(data);
    } catch (err) {
      setError(apiErrorMessage(err, t('buyer.newRequirement.errors.createFailed')));
    } finally {
      setCreating(false);
    }
  };

  if (posted) {
    return (
      <div className="mx-auto max-w-xl py-16 text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
          <CheckCircleIcon className="h-7 w-7" />
        </span>
        <h1 className="mt-5 font-display text-3xl text-navy">{t('buyer.newRequirement.submitted.title')}</h1>
        <p className="mt-3 text-sm leading-relaxed text-navy/60">
          <span className="font-semibold text-navy">{posted.title}</span>{' '}
          {t('buyer.newRequirement.submitted.description')}
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button onClick={() => navigate('/buyer/requirements')}>{t('buyer.newRequirement.submitted.goToRequirements')}</Button>
          <Button variant="ghost" onClick={() => navigate('/wanted')}>{t('buyer.newRequirement.submitted.viewWanted')}</Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeading
        eyebrow={t('buyer.newRequirement.eyebrow')}
        title={t('buyer.newRequirement.title')}
        description={t('buyer.newRequirement.description')}
      />
      {error && <div className="mb-5"><ErrorBanner message={error} /></div>}
      <Card className="max-w-2xl">
        <RequirementDetailsForm
          initial={EMPTY_REQUIREMENT_DETAILS}
          submitLabel={t('buyer.newRequirement.submit')}
          submitting={creating}
          onSubmit={handleCreate}
        />
      </Card>
    </div>
  );
}
