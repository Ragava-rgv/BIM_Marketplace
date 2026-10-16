import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { DepreciationScheduleDto } from '../../shared';
import { api, apiErrorMessage } from '../../lib/api';
import { Button, Card, EmptyState, ErrorBanner, Field, Input, LoadingBlock, PageHeading } from '../../components/ui';
import { PlusIcon, TrashIcon, TrendDownIcon } from '../../components/icons';

function NewEntryForm({ onSaved }: { onSaved: () => void }) {
  const { t } = useTranslation();
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
      setError(apiErrorMessage(err, t('admin.depreciation.saveError')));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card>
      <h2 className="font-display text-lg text-navy">{t('admin.depreciation.formTitle')}</h2>
      <p className="mt-1 text-sm text-navy/55">
        {t('admin.depreciation.formDescription')}
      </p>

      {error && (
        <div className="mt-4">
          <ErrorBanner message={error} />
        </div>
      )}

      <form onSubmit={submit} className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Field label={t('admin.depreciation.fields.machineCategory')}>
          <Input value={machineCategory} onChange={(e) => setMachineCategory(e.target.value)} required minLength={2} placeholder={t('admin.depreciation.fields.machineCategoryPlaceholder')} />
        </Field>
        <Field label={t('admin.depreciation.fields.yearOffset')} hint={t('admin.depreciation.fields.yearOffsetHint')}>
          <Input type="number" min={0} step="1" value={yearOffset} onChange={(e) => setYearOffset(e.target.value)} required placeholder={t('admin.depreciation.fields.yearOffsetPlaceholder')} />
        </Field>
        <Field label={t('admin.depreciation.fields.retainedValue')}>
          <Input type="number" min={0} max={100} step="0.1" value={retainedValuePct} onChange={(e) => setRetainedValuePct(e.target.value)} required placeholder={t('admin.depreciation.fields.retainedValuePlaceholder')} />
        </Field>
        <div className="sm:col-span-3">
          <Button type="submit" disabled={submitting}>
            <PlusIcon className="h-4 w-4" />
            {submitting ? t('admin.depreciation.saving') : t('admin.depreciation.saveEntry')}
          </Button>
        </div>
      </form>
    </Card>
  );
}

export function AdminDepreciation() {
  const { t } = useTranslation();
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
          setError(apiErrorMessage(err, t('admin.depreciation.loadError')));
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
      setError(apiErrorMessage(err, t('admin.depreciation.removeError')));
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
        eyebrow={t('admin.depreciation.eyebrow')}
        title={t('admin.depreciation.title')}
        description={t('admin.depreciation.description')}
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
        <EmptyState title={t('admin.depreciation.emptyTitle')} description={t('admin.depreciation.emptyDescription')} />
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
                      <p className="text-xs font-semibold uppercase tracking-wide text-navy/40">{t('admin.depreciation.yearLabel', { year: entry.yearOffset })}</p>
                      <p className="font-display text-lg text-navy">{Number(entry.retainedValuePct).toFixed(1)}%</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => remove(entry.id)}
                      disabled={removingId === entry.id}
                      className="rounded-lg p-1.5 text-navy/35 transition hover:bg-rose-50 hover:text-rose-600 disabled:opacity-40"
                      aria-label={t('admin.depreciation.removeAria', { category, year: entry.yearOffset })}
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
