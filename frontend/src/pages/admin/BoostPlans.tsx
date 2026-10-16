import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { PromotionPlanDto } from '../../shared';
import { api, apiErrorMessage } from '../../lib/api';
import { formatInr } from '../../lib/format';
import {
  Button,
  Card,
  EmptyState,
  ErrorBanner,
  Field,
  Input,
  LoadingBlock,
  PageHeading,
  SuccessBanner,
  Textarea,
} from '../../components/ui';
import { PlusIcon, TrashIcon } from '../../components/icons';
import { scrollToFirstError, useFieldRefs } from '../../lib/form-errors';

interface PlanFormValues {
  name: string;
  displayName: string;
  priceInr: string;
  durationDays: string;
  sortWeight: string;
  description: string;
  sortOrder: string;
  isActive: boolean;
}

const EMPTY_FORM: PlanFormValues = {
  name: '',
  displayName: '',
  priceInr: '',
  durationDays: '7',
  sortWeight: '0',
  description: '',
  sortOrder: '0',
  isActive: true,
};

function planToForm(plan: PromotionPlanDto): PlanFormValues {
  return {
    name: plan.name,
    displayName: plan.displayName,
    priceInr: String(Number(plan.priceInr)),
    durationDays: String(plan.durationDays),
    sortWeight: String(plan.sortWeight),
    description: plan.description ?? '',
    sortOrder: String(plan.sortOrder),
    isActive: plan.isActive,
  };
}

function planPayload(values: PlanFormValues) {
  return {
    name: values.name,
    displayName: values.displayName,
    priceInr: Number(values.priceInr),
    durationDays: Number(values.durationDays),
    sortWeight: Number(values.sortWeight),
    description: values.description || undefined,
    sortOrder: Number(values.sortOrder),
    isActive: values.isActive,
  };
}

function PlanForm({
  initial,
  onSave,
  onCancel,
  submitLabel,
}: {
  initial: PlanFormValues;
  onSave: (values: PlanFormValues) => Promise<void>;
  onCancel?: () => void;
  submitLabel: string;
}) {
  const { t } = useTranslation();
  const [form, setForm] = useState<PlanFormValues>(initial);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { refs, setFieldRef } = useFieldRefs<HTMLElement>();

  const set = <K extends keyof PlanFormValues>(key: K, value: PlanFormValues[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const fieldOrder = ['name', 'displayName', 'priceInr', 'durationDays'];
  const fieldErrors: Record<string, string | false> = {
    name: form.name.trim().length < 1 && t('admin.boostPlans.validation.nameRequired'),
    displayName: form.displayName.trim().length < 1 && t('admin.boostPlans.validation.displayNameRequired'),
    priceInr: !(Number(form.priceInr) >= 0) && t('admin.boostPlans.validation.priceInvalid'),
    durationDays: !(Number(form.durationDays) >= 1) && t('admin.boostPlans.validation.durationInvalid'),
  };
  const valid = Object.values(fieldErrors).every((v) => !v);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) {
      scrollToFirstError(fieldOrder, fieldErrors, refs);
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await onSave(form);
    } catch (err) {
      setError(apiErrorMessage(err, t('admin.boostPlans.saveError')));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <ErrorBanner message={error} />}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-4">
        <Field label={t('admin.boostPlans.fields.internalName')} hint={t('admin.boostPlans.fields.internalNameHint')}>
          <Input
            ref={setFieldRef('name')}
            value={form.name}
            onChange={(e) => set('name', e.target.value.toUpperCase().replace(/\s+/g, '_'))}
            placeholder={t('admin.boostPlans.fields.internalNamePlaceholder')}
            required
          />
        </Field>
        <Field label={t('admin.boostPlans.fields.displayName')} hint={t('admin.boostPlans.fields.displayNameHint')}>
          <Input
            ref={setFieldRef('displayName')}
            value={form.displayName}
            onChange={(e) => set('displayName', e.target.value)}
            placeholder={t('admin.boostPlans.fields.displayNamePlaceholder')}
            required
          />
        </Field>
        <Field label={t('admin.boostPlans.fields.price')}>
          <Input
            ref={setFieldRef('priceInr')}
            type="number"
            min={0}
            step="1"
            value={form.priceInr}
            onChange={(e) => set('priceInr', e.target.value)}
            required
          />
        </Field>
        <Field label={t('admin.boostPlans.fields.duration')}>
          <Input
            ref={setFieldRef('durationDays')}
            type="number"
            min={1}
            max={365}
            value={form.durationDays}
            onChange={(e) => set('durationDays', e.target.value)}
            required
          />
        </Field>
        <Field label={t('admin.boostPlans.fields.sortWeight')} hint={t('admin.boostPlans.fields.sortWeightHint')}>
          <Input
            type="number"
            value={form.sortWeight}
            onChange={(e) => set('sortWeight', e.target.value)}
          />
        </Field>
        <Field label={t('admin.boostPlans.fields.sortOrder')} hint={t('admin.boostPlans.fields.sortOrderHint')}>
          <Input
            type="number"
            min={0}
            value={form.sortOrder}
            onChange={(e) => set('sortOrder', e.target.value)}
          />
        </Field>
        <div className="flex flex-col gap-3 pt-5">
          <label className="flex cursor-pointer items-center gap-2.5 text-sm text-navy">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => set('isActive', e.target.checked)}
              className="h-4 w-4 rounded border-navy/20 accent-accent"
            />
            {t('admin.boostPlans.fields.activeCheckbox')}
          </label>
        </div>
      </div>
      <Field label={t('admin.boostPlans.fields.descriptionOptional')}>
        <Textarea
          rows={2}
          value={form.description}
          onChange={(e) => set('description', e.target.value)}
          placeholder={t('admin.boostPlans.fields.descriptionPlaceholder')}
        />
      </Field>
      <div className="flex gap-3">
        <Button type="submit" disabled={!valid || submitting}>
          {submitting ? t('admin.boostPlans.saving') : submitLabel}
        </Button>
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel}>
            {t('common:common.button.cancel')}
          </Button>
        )}
      </div>
    </form>
  );
}

function PlanRow({ plan, onChanged }: { plan: PromotionPlanDto; onChanged: () => void }) {
  const { t } = useTranslation();
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async (values: PlanFormValues) => {
    await api.patch(`/boost-plans/${plan.id}`, planPayload(values));
    setEditing(false);
    onChanged();
  };

  const remove = async () => {
    if (!confirm(t('admin.boostPlans.deleteConfirm', { name: plan.displayName }))) return;
    setDeleting(true);
    setError(null);
    try {
      await api.delete(`/boost-plans/${plan.id}`);
      onChanged();
    } catch (err) {
      setError(apiErrorMessage(err, t('admin.boostPlans.deleteError')));
      setDeleting(false);
    }
  };

  if (editing) {
    return (
      <div className="border-t border-navy/10 p-5">
        <p className="mb-4 font-semibold text-navy">{t('admin.boostPlans.editing', { name: plan.displayName })}</p>
        {error && <div className="mb-3"><ErrorBanner message={error} /></div>}
        <PlanForm initial={planToForm(plan)} onSave={save} onCancel={() => setEditing(false)} submitLabel={t('admin.boostPlans.saveChanges')} />
      </div>
    );
  }

  return (
    <tr className="transition hover:bg-navy/[0.02]">
      <td className="px-5 py-4">
        <p className="font-semibold text-navy">{plan.displayName}</p>
        <p className="mt-0.5 font-mono text-[10.5px] text-navy/40">{plan.name}</p>
        {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      </td>
      <td className="px-5 py-4 text-navy/65">{formatInr(plan.priceInr)}</td>
      <td className="px-5 py-4 text-navy/65">{t('admin.boostPlans.daysCount', { count: plan.durationDays })}</td>
      <td className="px-5 py-4 text-navy/65">{plan.sortWeight}</td>
      <td className="px-5 py-4">
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${
            plan.isActive
              ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20'
              : 'bg-slate-100 text-slate-600 ring-slate-500/20'
          }`}
        >
          {plan.isActive ? t('admin.boostPlans.active') : t('admin.boostPlans.inactive')}
        </span>
      </td>
      <td className="px-5 py-4">
        <div className="flex items-center justify-end gap-2">
          <Button variant="ghost" onClick={() => setEditing(true)}>
            {t('common:common.button.edit')}
          </Button>
          <Button variant="ghost" disabled={deleting} onClick={remove}>
            <TrashIcon className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      </td>
    </tr>
  );
}

export function AdminBoostPlans() {
  const { t } = useTranslation();
  const [plans, setPlans] = useState<PromotionPlanDto[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reload, setReload] = useState(0);
  const [showCreate, setShowCreate] = useState(false);
  const [createSuccess, setCreateSuccess] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api
      .get<PromotionPlanDto[]>('/boost-plans/admin/all')
      .then(({ data }) => {
        if (!cancelled) setPlans(data);
      })
      .catch((err) => {
        if (!cancelled) {
          setPlans([]);
          setError(apiErrorMessage(err, t('admin.boostPlans.loadError')));
        }
      });
    return () => { cancelled = true; };
  }, [reload, t]);

  const createPlan = async (values: PlanFormValues) => {
    await api.post('/boost-plans', planPayload(values));
    setShowCreate(false);
    setCreateSuccess(true);
    setReload((n) => n + 1);
    setTimeout(() => setCreateSuccess(false), 4000);
  };

  return (
    <div>
      <PageHeading
        eyebrow={t('admin.boostPlans.eyebrow')}
        title={t('admin.boostPlans.title')}
        description={t('admin.boostPlans.description')}
      />

      {error && <div className="mb-5"><ErrorBanner message={error} /></div>}
      {createSuccess && (
        <div className="mb-5">
          <SuccessBanner message={t('admin.boostPlans.createSuccess')} />
        </div>
      )}

      <div className="mb-8">
        {showCreate ? (
          <Card>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-lg text-navy">{t('admin.boostPlans.newTierTitle')}</h2>
            </div>
            <PlanForm initial={EMPTY_FORM} onSave={createPlan} onCancel={() => setShowCreate(false)} submitLabel={t('admin.boostPlans.createTier')} />
          </Card>
        ) : (
          <Button onClick={() => setShowCreate(true)}>
            <PlusIcon className="h-4 w-4" />
            {t('admin.boostPlans.newTier')}
          </Button>
        )}
      </div>

      {plans === null ? (
        <LoadingBlock />
      ) : plans.length === 0 ? (
        <EmptyState title={t('admin.boostPlans.emptyTitle')} description={t('admin.boostPlans.emptyDescription')} />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-navy/10 bg-white">
          <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-navy/10 bg-navy/[0.02] text-left text-xs font-semibold uppercase tracking-wide text-navy/40">
              <tr>
                <th className="px-5 py-3">{t('admin.boostPlans.columns.tier')}</th>
                <th className="px-5 py-3">{t('admin.boostPlans.columns.price')}</th>
                <th className="px-5 py-3">{t('admin.boostPlans.columns.duration')}</th>
                <th className="px-5 py-3">{t('admin.boostPlans.columns.sortWeight')}</th>
                <th className="px-5 py-3">{t('admin.boostPlans.columns.status')}</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-navy/10">
              {plans.map((plan) => (
                <PlanRow key={plan.id} plan={plan} onChanged={() => setReload((n) => n + 1)} />
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}
    </div>
  );
}
