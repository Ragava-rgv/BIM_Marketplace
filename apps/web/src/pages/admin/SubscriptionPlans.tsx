import { useEffect, useState } from 'react';
import type { SubscriptionPlanConfigDto } from '@machinebazaar/shared';
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
      setError(apiErrorMessage(err, 'Could not save plan.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <ErrorBanner message={error} />}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-4">
        <Field label="Internal name" hint="Unique identifier e.g. STANDARD">
          <Input
            value={form.name}
            onChange={(e) => set('name', e.target.value.toUpperCase().replace(/\s+/g, '_'))}
            placeholder="STANDARD"
            required
          />
        </Field>
        <Field label="Display name" hint="Shown to sellers">
          <Input
            value={form.displayName}
            onChange={(e) => set('displayName', e.target.value)}
            placeholder="Standard"
            required
          />
        </Field>
        <Field label="Listing quota" hint="Max active listings">
          <Input
            type="number"
            min={1}
            max={1000}
            value={form.listingQuota}
            onChange={(e) => set('listingQuota', e.target.value)}
            required
          />
        </Field>
        <Field label="Price (₹)" hint="0 for free plans">
          <Input
            type="number"
            min={0}
            step="1"
            value={form.priceInr}
            onChange={(e) => set('priceInr', e.target.value)}
            required
          />
        </Field>
        <Field label="Duration (days)" hint="Validity after payment">
          <Input
            type="number"
            min={1}
            max={365}
            value={form.durationDays}
            onChange={(e) => set('durationDays', e.target.value)}
            required
          />
        </Field>
        <Field label="Sort order" hint="Lower = shown first">
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
            Active (visible to sellers)
          </label>
          <label className="flex cursor-pointer items-center gap-2.5 text-sm text-navy">
            <input
              type="checkbox"
              checked={form.isFree}
              onChange={(e) => set('isFree', e.target.checked)}
              className="h-4 w-4 rounded border-navy/20 accent-accent"
            />
            Free plan (no payment required)
          </label>
        </div>
      </div>
      <Field label="Description (optional)">
        <Textarea
          rows={2}
          value={form.description}
          onChange={(e) => set('description', e.target.value)}
          placeholder="Short description shown to sellers"
        />
      </Field>
      <div className="flex gap-3">
        <Button type="submit" disabled={!valid || submitting}>
          {submitting ? 'Saving...' : submitLabel}
        </Button>
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancel
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
    if (!confirm(`Delete "${plan.displayName}" plan? This cannot be undone.`)) return;
    setDeleting(true);
    setError(null);
    try {
      await api.delete(`/subscription-plans/${plan.id}`);
      onChanged();
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not delete this plan.'));
      setDeleting(false);
    }
  };

  if (editing) {
    return (
      <div className="border-t border-navy/10 p-5">
        <p className="mb-4 font-semibold text-navy">Editing: {plan.displayName}</p>
        {error && <div className="mb-3"><ErrorBanner message={error} /></div>}
        <PlanForm
          initial={planToForm(plan)}
          onSave={save}
          onCancel={() => setEditing(false)}
          submitLabel="Save changes"
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
      <td className="px-5 py-4 text-navy/65">{plan.listingQuota} listings</td>
      <td className="px-5 py-4 text-navy/65">
        {plan.isFree ? 'Free' : formatInr(plan.priceInr)}
      </td>
      <td className="px-5 py-4 text-navy/65">{plan.durationDays} days</td>
      <td className="px-5 py-4">
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${
            plan.isActive
              ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20'
              : 'bg-slate-100 text-slate-600 ring-slate-500/20'
          }`}
        >
          {plan.isActive ? 'Active' : 'Inactive'}
        </span>
      </td>
      <td className="px-5 py-4">
        <p className="max-w-xs truncate text-[12.5px] text-navy/55">{plan.description ?? '—'}</p>
      </td>
      <td className="px-5 py-4">
        <div className="flex items-center justify-end gap-2">
          <Button variant="ghost" onClick={() => setEditing(true)}>
            Edit
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
          setError(apiErrorMessage(err, 'Could not load subscription plans.'));
        }
      });
    return () => { cancelled = true; };
  }, [reload]);

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
        eyebrow="Admin console"
        title="Subscription plans"
        description="Create, edit and delete the listing subscription tiers available to sellers. Changes take effect immediately for new purchases."
      />

      {error && <div className="mb-5"><ErrorBanner message={error} /></div>}
      {createSuccess && (
        <div className="mb-5">
          <SuccessBanner message="Subscription plan created successfully." />
        </div>
      )}

      {/* Create form */}
      <div className="mb-8">
        {showCreate ? (
          <Card>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-lg text-navy">New subscription plan</h2>
            </div>
            <PlanForm
              initial={EMPTY_FORM}
              onSave={createPlan}
              onCancel={() => setShowCreate(false)}
              submitLabel="Create plan"
            />
          </Card>
        ) : (
          <Button onClick={() => setShowCreate(true)}>
            <PlusIcon className="h-4 w-4" />
            New plan
          </Button>
        )}
      </div>

      {/* Plans table */}
      {plans === null ? (
        <LoadingBlock />
      ) : plans.length === 0 ? (
        <EmptyState
          title="No subscription plans yet"
          description="Add your first plan using the button above."
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-navy/10 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-navy/10 bg-navy/[0.02] text-left text-xs font-semibold uppercase tracking-wide text-navy/40">
              <tr>
                <th className="px-5 py-3">Plan</th>
                <th className="px-5 py-3">Quota</th>
                <th className="px-5 py-3">Price</th>
                <th className="px-5 py-3">Duration</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Description</th>
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
      )}

      <div className="mt-8 flex items-start gap-2.5 rounded-xl border border-forest-bdr bg-forest-bg p-4 text-[13px] leading-[1.6] text-slate">
        <CheckCircleIcon className="mt-0.5 h-4 w-4 shrink-0 text-forest" />
        <div>
          <MonoLabel>How quota enforcement works</MonoLabel>
          <p className="mt-1">
            When a seller creates a listing, the system checks their active subscription's quota. The
            quota value is <strong>snapshot at purchase time</strong> from the plan config — changing a
            plan's quota here does not retroactively alter existing subscriptions. Mark a plan
            &quot;Inactive&quot; to hide it from sellers while keeping existing subscribers unaffected.
          </p>
        </div>
      </div>
    </div>
  );
}
