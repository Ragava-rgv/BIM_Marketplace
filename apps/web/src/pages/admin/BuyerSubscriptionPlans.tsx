import { useEffect, useState } from 'react';
import type { BuyerSubscriptionPlanDto } from '@machinebazaar/shared';
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
  contactViewQuota: string;
  priceInr: string;
  durationDays: string;
  indefinite: boolean;
  description: string;
  sortOrder: string;
  isActive: boolean;
  isFree: boolean;
  isDefault: boolean;
}

const EMPTY_FORM: PlanFormValues = {
  name: '',
  displayName: '',
  contactViewQuota: '',
  priceInr: '',
  durationDays: '30',
  indefinite: false,
  description: '',
  sortOrder: '0',
  isActive: true,
  isFree: false,
  isDefault: false,
};

function planToForm(plan: BuyerSubscriptionPlanDto): PlanFormValues {
  return {
    name: plan.name,
    displayName: plan.displayName,
    contactViewQuota: String(plan.contactViewQuota),
    priceInr: String(Number(plan.priceInr)),
    durationDays: plan.durationDays ? String(plan.durationDays) : '30',
    indefinite: plan.durationDays === null,
    description: plan.description ?? '',
    sortOrder: String(plan.sortOrder),
    isActive: plan.isActive,
    isFree: plan.isFree,
    isDefault: plan.isDefault,
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
    Number(form.contactViewQuota) >= 1 &&
    Number(form.priceInr) >= 0 &&
    (form.indefinite || Number(form.durationDays) >= 1);

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
        <Field label="Display name" hint="Shown to buyers">
          <Input
            value={form.displayName}
            onChange={(e) => set('displayName', e.target.value)}
            placeholder="Standard"
            required
          />
        </Field>
        <Field label="Contact view quota" hint="Max contact reveals">
          <Input
            type="number"
            min={1}
            max={10000}
            value={form.contactViewQuota}
            onChange={(e) => set('contactViewQuota', e.target.value)}
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
        <Field label="Duration (days)" hint="Ignored if indefinite">
          <Input
            type="number"
            min={1}
            max={3650}
            value={form.durationDays}
            onChange={(e) => set('durationDays', e.target.value)}
            disabled={form.indefinite}
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
              checked={form.indefinite}
              onChange={(e) => set('indefinite', e.target.checked)}
              className="h-4 w-4 rounded border-navy/20 accent-accent"
            />
            Indefinite (no expiry)
          </label>
          <label className="flex cursor-pointer items-center gap-2.5 text-sm text-navy">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => set('isActive', e.target.checked)}
              className="h-4 w-4 rounded border-navy/20 accent-accent"
            />
            Active (visible to buyers)
          </label>
        </div>
        <div className="flex flex-col gap-3 pt-5">
          <label className="flex cursor-pointer items-center gap-2.5 text-sm text-navy">
            <input
              type="checkbox"
              checked={form.isFree}
              onChange={(e) => set('isFree', e.target.checked)}
              className="h-4 w-4 rounded border-navy/20 accent-accent"
            />
            Free plan (no payment required)
          </label>
          <label className="flex cursor-pointer items-center gap-2.5 text-sm text-navy">
            <input
              type="checkbox"
              checked={form.isDefault}
              onChange={(e) => set('isDefault', e.target.checked)}
              className="h-4 w-4 rounded border-navy/20 accent-accent"
            />
            Default plan (auto-assigned to new buyers)
          </label>
        </div>
      </div>
      <Field label="Description (optional)">
        <Textarea
          rows={2}
          value={form.description}
          onChange={(e) => set('description', e.target.value)}
          placeholder="Short description shown to buyers"
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

function planPayload(values: PlanFormValues) {
  return {
    name: values.name,
    displayName: values.displayName,
    contactViewQuota: Number(values.contactViewQuota),
    priceInr: Number(values.priceInr),
    durationDays: values.indefinite ? null : Number(values.durationDays),
    description: values.description || undefined,
    sortOrder: Number(values.sortOrder),
    isActive: values.isActive,
    isFree: values.isFree,
    isDefault: values.isDefault,
  };
}

function PlanRow({
  plan,
  onChanged,
}: {
  plan: BuyerSubscriptionPlanDto;
  onChanged: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async (values: PlanFormValues) => {
    await api.patch(`/buyer-subscription-plans/${plan.id}`, planPayload(values));
    setEditing(false);
    onChanged();
  };

  const remove = async () => {
    if (!confirm(`Delete "${plan.displayName}" plan? This cannot be undone.`)) return;
    setDeleting(true);
    setError(null);
    try {
      await api.delete(`/buyer-subscription-plans/${plan.id}`);
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
        <div className="flex items-center gap-2">
          <p className="font-semibold text-navy">{plan.displayName}</p>
          {plan.isDefault && (
            <span className="rounded-full bg-forest-bg px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-forest">
              Default
            </span>
          )}
        </div>
        <p className="mt-0.5 font-mono text-[10.5px] text-navy/40">{plan.name}</p>
        {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      </td>
      <td className="px-5 py-4 text-navy/65">{plan.contactViewQuota} views</td>
      <td className="px-5 py-4 text-navy/65">
        {plan.isFree ? 'Free' : formatInr(plan.priceInr)}
      </td>
      <td className="px-5 py-4 text-navy/65">{plan.durationDays ? `${plan.durationDays} days` : 'Indefinite'}</td>
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

export function AdminBuyerSubscriptionPlans() {
  const [plans, setPlans] = useState<BuyerSubscriptionPlanDto[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reload, setReload] = useState(0);
  const [showCreate, setShowCreate] = useState(false);
  const [createSuccess, setCreateSuccess] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api
      .get<BuyerSubscriptionPlanDto[]>('/buyer-subscription-plans/admin/all')
      .then(({ data }) => {
        if (!cancelled) setPlans(data);
      })
      .catch((err) => {
        if (!cancelled) {
          setPlans([]);
          setError(apiErrorMessage(err, 'Could not load buyer subscription plans.'));
        }
      });
    return () => { cancelled = true; };
  }, [reload]);

  const createPlan = async (values: PlanFormValues) => {
    await api.post('/buyer-subscription-plans', planPayload(values));
    setShowCreate(false);
    setCreateSuccess(true);
    setReload((n) => n + 1);
    setTimeout(() => setCreateSuccess(false), 4000);
  };

  return (
    <div>
      <PageHeading
        eyebrow="Admin console"
        title="Buyer subscription plans"
        description="Create, edit and delete the contact-view quota tiers available to buyers. Exactly one plan must be marked default — it's auto-assigned to every new buyer."
      />

      {error && <div className="mb-5"><ErrorBanner message={error} /></div>}
      {createSuccess && (
        <div className="mb-5">
          <SuccessBanner message="Buyer subscription plan created successfully." />
        </div>
      )}

      {/* Create form */}
      <div className="mb-8">
        {showCreate ? (
          <Card>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-lg text-navy">New buyer plan</h2>
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
          title="No buyer subscription plans yet"
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
            Every reveal consumes one contact view from the buyer&apos;s active subscription. The
            quota value is <strong>snapshot at purchase time</strong> from the plan config — changing
            a plan&apos;s quota here does not retroactively alter existing subscriptions. Deleting a
            plan is blocked while any active subscription still references it, and the default plan
            cannot be removed until another plan is promoted to default.
          </p>
        </div>
      </div>
    </div>
  );
}
