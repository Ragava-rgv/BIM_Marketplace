import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { SubscriptionPlanConfigDto } from '../../shared';
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
  MonoLabel,
  PageHeading,
  SuccessBanner,
  Textarea,
} from '../../components/ui';
import { CheckCircleIcon, PlusIcon, TrashIcon } from '../../components/icons';

interface PlanFormValues {
  name: string;
  displayName: string;
  listingQuota: string;
  priceInr: string;
  durationDays: string;
  description: string;
  sortOrder: string;
  isActive: boolean;
  isFree: boolean;
}

const EMPTY_FORM: PlanFormValues = {
  name: '',
  displayName: '',
  listingQuota: '',
  priceInr: '',
  durationDays: '30',
  description: '',
  sortOrder: '0',
  isActive: true,
  isFree: false,
};

function planToForm(plan: SubscriptionPlanConfigDto): PlanFormValues {
  return {
    name: plan.name,
    displayName: plan.displayName,
    listingQuota: String(plan.listingQuota),
    priceInr: String(Number(plan.priceInr)),
    durationDays: String(plan.durationDays),
    description: plan.description ?? '',
    sortOrder: String(plan.sortOrder),
    isActive: plan.isActive,
    isFree: plan.isFree,
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

  const set = <K extends keyof PlanFormValues>(key: K, value: PlanFormValues[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const valid =
    form.name.trim().length >= 1 &&
    form.displayName.trim().length >= 1 &&
    Number(form.listingQuota) >= 1 &&
    Number(form.priceInr) >= 0 &&
    Number(form.durationDays) >= 1;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) return;
    setSubmitting(true);
    setError(null);
    try {
      await onSave(form);
    } catch (err) {
      setError(apiErrorMessage(err, t('admin.subscriptionPlans.saveError')));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <ErrorBanner message={error} />}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-4">
        <Field label={t('admin.subscriptionPlans.fields.internalName')} hint={t('admin.subscriptionPlans.fields.internalNameHint')}>
          <Input
            value={form.name}
            onChange={(e) => set('name', e.target.value.toUpperCase().replace(/\s+/g, '_'))}
            placeholder={t('admin.subscriptionPlans.fields.internalNamePlaceholder')}
            required
          />
        </Field>
        <Field label={t('admin.subscriptionPlans.fields.displayName')} hint={t('admin.subscriptionPlans.fields.displayNameHint')}>
          <Input
            value={form.displayName}
            onChange={(e) => set('displayName', e.target.value)}
            placeholder={t('admin.subscriptionPlans.fields.displayNamePlaceholder')}
            required
          />
        </Field>
        <Field label={t('admin.subscriptionPlans.fields.listingQuota')} hint={t('admin.subscriptionPlans.fields.listingQuotaHint')}>
          <Input
            type="number"
            min={1}
            max={1000}
            value={form.listingQuota}
            onChange={(e) => set('listingQuota', e.target.value)}
            required
          />
        </Field>
        <Field label={t('admin.subscriptionPlans.fields.price')} hint={t('admin.subscriptionPlans.fields.priceHint')}>
          <Input
            type="number"
            min={0}
            step="1"
            value={form.priceInr}
            onChange={(e) => set('priceInr', e.target.value)}
            required
          />
        </Field>
        <Field label={t('admin.subscriptionPlans.fields.duration')} hint={t('admin.subscriptionPlans.fields.durationHint')}>
          <Input
            type="number"
            min={1}
            max={365}
            value={form.durationDays}
            onChange={(e) => set('durationDays', e.target.value)}
            required
          />
        </Field>
        <Field label={t('admin.subscriptionPlans.fields.sortOrder')} hint={t('admin.subscriptionPlans.fields.sortOrderHint')}>
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
            {t('admin.subscriptionPlans.fields.activeCheckbox')}
          </label>
          <label className="flex cursor-pointer items-center gap-2.5 text-sm text-navy">
            <input
              type="checkbox"
              checked={form.isFree}
              onChange={(e) => set('isFree', e.target.checked)}
              className="h-4 w-4 rounded border-navy/20 accent-accent"
            />
            {t('admin.subscriptionPlans.fields.freePlan')}
          </label>
        </div>
      </div>
      <Field label={t('admin.subscriptionPlans.fields.descriptionOptional')}>
        <Textarea
          rows={2}
          value={form.description}
          onChange={(e) => set('description', e.target.value)}
          placeholder={t('admin.subscriptionPlans.fields.descriptionPlaceholder')}
        />
      </Field>
      <div className="flex gap-3">
        <Button type="submit" disabled={!valid || submitting}>
          {submitting ? t('admin.subscriptionPlans.saving') : submitLabel}
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

function PlanRow({
  plan,
  onChanged,
}: {
  plan: SubscriptionPlanConfigDto;
  onChanged: () => void;
}) {
  const { t } = useTranslation();
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async (values: PlanFormValues) => {
    await api.patch(`/subscription-plans/${plan.id}`, {
      name: values.name,
      displayName: values.displayName,
      listingQuota: Number(values.listingQuota),
      priceInr: Number(values.priceInr),
      durationDays: Number(values.durationDays),
      description: values.description || undefined,
      sortOrder: Number(values.sortOrder),
      isActive: values.isActive,
      isFree: values.isFree,
    });
    setEditing(false);
    onChanged();
  };

  const remove = async () => {
    if (!confirm(t('admin.subscriptionPlans.deleteConfirm', { name: plan.displayName }))) return;
    setDeleting(true);
    setError(null);
    try {
      await api.delete(`/subscription-plans/${plan.id}`);
      onChanged();
    } catch (err) {
      setError(apiErrorMessage(err, t('admin.subscriptionPlans.deleteError')));
      setDeleting(false);
    }
  };

  if (editing) {
    return (
      <div className="border-t border-navy/10 p-5">
        <p className="mb-4 font-semibold text-navy">{t('admin.subscriptionPlans.editing', { name: plan.displayName })}</p>
        {error && <div className="mb-3"><ErrorBanner message={error} /></div>}
        <PlanForm
          initial={planToForm(plan)}
          onSave={save}
          onCancel={() => setEditing(false)}
          submitLabel={t('admin.subscriptionPlans.saveChanges')}
        />
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
      <td className="px-5 py-4 text-navy/65">{t('admin.subscriptionPlans.listingsCount', { count: plan.listingQuota })}</td>
      <td className="px-5 py-4 text-navy/65">
        {plan.isFree ? t('admin.subscriptionPlans.free') : formatInr(plan.priceInr)}
      </td>
      <td className="px-5 py-4 text-navy/65">{t('admin.subscriptionPlans.daysCount', { count: plan.durationDays })}</td>
      <td className="px-5 py-4">
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${
            plan.isActive
              ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20'
              : 'bg-slate-100 text-slate-600 ring-slate-500/20'
          }`}
        >
          {plan.isActive ? t('admin.subscriptionPlans.active') : t('admin.subscriptionPlans.inactive')}
        </span>
      </td>
      <td className="px-5 py-4">
        <p className="max-w-xs truncate text-[12.5px] text-navy/55">{plan.description ?? '—'}</p>
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

export function AdminSubscriptionPlans() {
  const { t } = useTranslation();
  const [plans, setPlans] = useState<SubscriptionPlanConfigDto[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reload, setReload] = useState(0);
  const [showCreate, setShowCreate] = useState(false);
  const [createSuccess, setCreateSuccess] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api
      .get<SubscriptionPlanConfigDto[]>('/subscription-plans/admin/all')
      .then(({ data }) => {
        if (!cancelled) setPlans(data);
      })
      .catch((err) => {
        if (!cancelled) {
          setPlans([]);
          setError(apiErrorMessage(err, t('admin.subscriptionPlans.loadError')));
        }
      });
    return () => { cancelled = true; };
  }, [reload, t]);

  const createPlan = async (values: PlanFormValues) => {
    await api.post('/subscription-plans', {
      name: values.name,
      displayName: values.displayName,
      listingQuota: Number(values.listingQuota),
      priceInr: Number(values.priceInr),
      durationDays: Number(values.durationDays),
      description: values.description || undefined,
      sortOrder: Number(values.sortOrder),
      isActive: values.isActive,
      isFree: values.isFree,
    });
    setShowCreate(false);
    setCreateSuccess(true);
    setReload((n) => n + 1);
    setTimeout(() => setCreateSuccess(false), 4000);
  };

  return (
    <div>
      <PageHeading
        eyebrow={t('admin.subscriptionPlans.eyebrow')}
        title={t('admin.subscriptionPlans.title')}
        description={t('admin.subscriptionPlans.description')}
      />

      {error && <div className="mb-5"><ErrorBanner message={error} /></div>}
      {createSuccess && (
        <div className="mb-5">
          <SuccessBanner message={t('admin.subscriptionPlans.createSuccess')} />
        </div>
      )}

      {/* Create form */}
      <div className="mb-8">
        {showCreate ? (
          <Card>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-lg text-navy">{t('admin.subscriptionPlans.newPlanTitle')}</h2>
            </div>
            <PlanForm
              initial={EMPTY_FORM}
              onSave={createPlan}
              onCancel={() => setShowCreate(false)}
              submitLabel={t('admin.subscriptionPlans.createPlan')}
            />
          </Card>
        ) : (
          <Button onClick={() => setShowCreate(true)}>
            <PlusIcon className="h-4 w-4" />
            {t('admin.subscriptionPlans.newPlan')}
          </Button>
        )}
      </div>

      {/* Plans table */}
      {plans === null ? (
        <LoadingBlock />
      ) : plans.length === 0 ? (
        <EmptyState
          title={t('admin.subscriptionPlans.emptyTitle')}
          description={t('admin.subscriptionPlans.emptyDescription')}
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-navy/10 bg-white">
          <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-navy/10 bg-navy/[0.02] text-left text-xs font-semibold uppercase tracking-wide text-navy/40">
              <tr>
                <th className="px-5 py-3">{t('admin.subscriptionPlans.columns.plan')}</th>
                <th className="px-5 py-3">{t('admin.subscriptionPlans.columns.quota')}</th>
                <th className="px-5 py-3">{t('admin.subscriptionPlans.columns.price')}</th>
                <th className="px-5 py-3">{t('admin.subscriptionPlans.columns.duration')}</th>
                <th className="px-5 py-3">{t('admin.subscriptionPlans.columns.status')}</th>
                <th className="px-5 py-3">{t('admin.subscriptionPlans.columns.description')}</th>
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

      <div className="mt-8 flex items-start gap-2.5 rounded-xl border border-forest-bdr bg-forest-bg p-4 text-[13px] leading-[1.6] text-slate">
        <CheckCircleIcon className="mt-0.5 h-4 w-4 shrink-0 text-forest" />
        <div>
          <MonoLabel>{t('admin.subscriptionPlans.quotaExplainerTitle')}</MonoLabel>
          <p className="mt-1">
            {t('admin.subscriptionPlans.quotaExplainerBody')}
          </p>
        </div>
      </div>
    </div>
  );
}
