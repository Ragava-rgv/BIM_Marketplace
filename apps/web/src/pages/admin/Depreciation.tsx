import { useEffect, useMemo, useState } from 'react';
import type { DepreciationScheduleDto } from '@machinebazaar/shared';
import { api, apiErrorMessage } from '../../lib/api';
import { Button, Card, EmptyState, ErrorBanner, Field, Input, LoadingBlock, PageHeading } from '../../components/ui';
import { PlusIcon, TrashIcon, TrendDownIcon } from '../../components/icons';

function NewEntryForm({ onSaved }: { onSaved: () => void }) {
  const [machineCategory, setMachineCategory] = useState('');
  const [yearOffset, setYearOffset] = useState('');
  const [retainedValuePct, setRetainedValuePct] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await api.post('/depreciation-schedule', {
        machineCategory,
        yearOffset: Number(yearOffset),
        retainedValuePct: Number(retainedValuePct),
      });
      setMachineCategory('');
      setYearOffset('');
      setRetainedValuePct('');
      onSaved();
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not save this depreciation entry.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card>
      <h2 className="font-display text-lg text-navy">Add or update an entry</h2>
      <p className="mt-1 text-sm text-navy/55">
        Saving an entry for a category and year-offset that already exists will overwrite its retained value.
      </p>

      {error && (
        <div className="mt-4">
          <ErrorBanner message={error} />
        </div>
      )}

      <form onSubmit={submit} className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Field label="Machine category">
          <Input value={machineCategory} onChange={(e) => setMachineCategory(e.target.value)} required minLength={2} placeholder="e.g. CNC Machines" />
        </Field>
        <Field label="Year offset" hint="Years since manufacture">
          <Input type="number" min={0} step="1" value={yearOffset} onChange={(e) => setYearOffset(e.target.value)} required placeholder="e.g. 3" />
        </Field>
        <Field label="Retained value (%)">
          <Input type="number" min={0} max={100} step="0.1" value={retainedValuePct} onChange={(e) => setRetainedValuePct(e.target.value)} required placeholder="e.g. 62.5" />
        </Field>
        <div className="sm:col-span-3">
          <Button type="submit" disabled={submitting}>
            <PlusIcon className="h-4 w-4" />
            {submitting ? 'Saving...' : 'Save entry'}
          </Button>
        </div>
      </form>
    </Card>
  );
}

export function AdminDepreciation() {
  const [entries, setEntries] = useState<DepreciationScheduleDto[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let cancelled = false;
    api
      .get<DepreciationScheduleDto[]>('/depreciation-schedule')
      .then(({ data }) => {
        if (!cancelled) setEntries(data);
      })
      .catch((err) => {
        if (!cancelled) {
          setEntries([]);
          setError(apiErrorMessage(err, 'Could not load the depreciation schedule.'));
        }
      });
    return () => {
      cancelled = true;
    };
  }, [reload]);

  const remove = async (id: string) => {
    setRemovingId(id);
    setError(null);
    try {
      await api.delete(`/depreciation-schedule/${id}`);
      setReload((n) => n + 1);
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not remove this entry.'));
    } finally {
      setRemovingId(null);
    }
  };

  const grouped = useMemo(() => {
    if (!entries) return [];
    const map = new Map<string, DepreciationScheduleDto[]>();
    for (const entry of entries) {
      const list = map.get(entry.machineCategory) ?? [];
      list.push(entry);
      map.set(entry.machineCategory, list);
    }
    return [...map.entries()].map(([category, items]) => ({
      category,
      items: items.sort((a, b) => a.yearOffset - b.yearOffset),
    }));
  }, [entries]);

  return (
    <div>
      <PageHeading
        eyebrow="Admin console"
        title="Depreciation schedule"
        description="Defines the buyback quote engine — for each machine category and year of age, the percentage of original value retained. Sellers see a buyback estimate derived from these figures."
      />

      {error && (
        <div className="mb-5">
          <ErrorBanner message={error} />
        </div>
      )}

      <div className="mb-8">
        <NewEntryForm onSaved={() => setReload((n) => n + 1)} />
      </div>

      {entries === null ? (
        <LoadingBlock />
      ) : entries.length === 0 ? (
        <EmptyState title="No depreciation entries yet" description="Add category and year-offset entries above to power buyback quotes." />
      ) : (
        <div className="space-y-6">
          {grouped.map(({ category, items }) => (
            <Card key={category}>
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-navy/[0.06] text-navy">
                  <TrendDownIcon className="h-4.5 w-4.5" />
                </span>
                <h3 className="font-display text-lg text-navy">{category}</h3>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {items.map((entry) => (
                  <div key={entry.id} className="flex items-center justify-between gap-2 rounded-xl border border-navy/10 px-3.5 py-2.5">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-navy/40">Year {entry.yearOffset}</p>
                      <p className="font-display text-lg text-navy">{Number(entry.retainedValuePct).toFixed(1)}%</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => remove(entry.id)}
                      disabled={removingId === entry.id}
                      className="rounded-lg p-1.5 text-navy/35 transition hover:bg-rose-50 hover:text-rose-600 disabled:opacity-40"
                      aria-label={`Remove ${category} year ${entry.yearOffset} entry`}
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
