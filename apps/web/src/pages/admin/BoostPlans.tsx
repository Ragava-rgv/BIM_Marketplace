import { useEffect, useState } from 'react';
import type { PromotionPlanDto } from '@machinebazaar/shared';
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
  const [form, setForm] = useState<PlanFormValues>(initial);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { refs, setFieldRef } = useFieldRefs<HTMLElement>();

  const set = <K extends keyof PlanFormValues>(key: K, value: PlanFormValues[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const fieldOrder = ['name', 'displayName', 'priceInr', 'durationDays'];
  const fieldErrors: Record<string, string | false> = {
    name: form.name.trim().length < 1 && 'Internal name is required',
    displayName: form.displayName.trim().length < 1 && 'Display name is required',
    priceInr: !(Number(form.priceInr) >= 0) && 'Price must be 0 or greater',
    durationDays: !(Number(form.durationDays) >= 1) && 'Duration must be at least 1 day',
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
      setError(apiErrorMessage(err, 'Could not save boost plan.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <ErrorBanner message={error} />}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-4">
        <Field label="Internal name" hint="Unique identifier e.g. WEEKLY_BOOST">
          <Input
            ref={setFieldRef('name')}
            value={form.name}
            onChange={(e) => set('name', e.target.value.toUpperCase().replace(/\s+/g, '_'))}
            placeholder="WEEKLY_BOOST"
            required
          />
        </Field>
        <Field label="Display name" hint="Shown to sellers">
          <Input
            ref={setFieldRef('displayName')}
            value={form.displayName}
            onChange={(e) => set('displayName', e.target.value)}
            placeholder="7-Day Boost"
            required
          />
        </Field>
        <Field label="Price (₹)">
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
        <Field label="Duration (days)">
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
        <Field label="Sort weight" hint="Higher = ranked above other boosted listings">
          <Input
            type="number"
            value={form.sortWeight}
            onChange={(e) => set('sortWeight', e.target.value)}
          />
        </Field>
        <Field label="Sort order" hint="Lower = shown first in this list">
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
            Active (purchasable by sellers)
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

function PlanRow({ plan, onChanged }: { plan: PromotionPlanDto; onChanged: () => void }) {
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async (values: PlanFormValues) => {
    await api.patch(`/boost-plans/${plan.id}`, planPayload(values));
    setEditing(false);
    onChanged();
  };

  const remove = async () => {
    if (!confirm(`Delete "${plan.displayName}" boost tier? This cannot be undone.`)) return;
    setDeleting(true);
    setError(null);
    try {
      await api.delete(`/boost-plans/${plan.id}`);
      onChanged();
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not delete this boost tier.'));
      setDeleting(false);
    }
  };

  if (editing) {
    return (
      <div className="border-t border-navy/10 p-5">
        <p className="mb-4 font-semibold text-navy">Editing: {plan.displayName}</p>
        {error && <div className="mb-3"><ErrorBanner message={error} /></div>}
        <PlanForm initial={planToForm(plan)} onSave={save} onCancel={() => setEditing(false)} submitLabel="Save changes" />
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
      <td className="px-5 py-4 text-navy/65">{plan.durationDays} days</td>
      <td className="px-5 py-4 text-navy/65">{plan.sortWeight}</td>
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

export function AdminBoostPlans() {
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
          setError(apiErrorMessage(err, 'Could not load boost plans.'));
        }
      });
    return () => { cancelled = true; };
  }, [reload]);

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
        eyebrow="Admin console"
        title="Boost tiers"
        description="Create, edit and delete the paid promotion tiers sellers can buy to push a listing to the top of search results."
      />

      {error && <div className="mb-5"><ErrorBanner message={error} /></div>}
      {createSuccess && (
        <div className="mb-5">
          <SuccessBanner message="Boost tier created successfully." />
        </div>
      )}

      <div className="mb-8">
        {showCreate ? (
          <Card>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-lg text-navy">New boost tier</h2>
            </div>
            <PlanForm initial={EMPTY_FORM} onSave={createPlan} onCancel={() => setShowCreate(false)} submitLabel="Create tier" />
          </Card>
        ) : (
          <Button onClick={() => setShowCreate(true)}>
            <PlusIcon className="h-4 w-4" />
            New boost tier
          </Button>
        )}
      </div>

      {plans === null ? (
        <LoadingBlock />
      ) : plans.length === 0 ? (
        <EmptyState title="No boost tiers yet" description="Add your first tier using the button above." />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-navy/10 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-navy/10 bg-navy/[0.02] text-left text-xs font-semibold uppercase tracking-wide text-navy/40">
              <tr>
                <th className="px-5 py-3">Tier</th>
                <th className="px-5 py-3">Price</th>
                <th className="px-5 py-3">Duration</th>
                <th className="px-5 py-3">Sort weight</th>
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
    </div>
  );
}
