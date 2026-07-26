import { useEffect, useRef, useState } from 'react';
import type { AdvertisementDto } from '@machinebazaar/shared';
import { api, apiErrorMessage } from '../../lib/api';
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
} from '../../components/ui';
import { PlusIcon, TrashIcon } from '../../components/icons';
import { scrollToFirstError, useFieldRefs } from '../../lib/form-errors';

interface AdFormValues {
  title: string;
  linkUrl: string;
  position: string;
  sortOrder: string;
  isActive: boolean;
}

const EMPTY_FORM: AdFormValues = {
  title: '',
  linkUrl: '',
  position: '0',
  sortOrder: '0',
  isActive: true,
};

function adToForm(ad: AdvertisementDto): AdFormValues {
  return {
    title: ad.title,
    linkUrl: ad.linkUrl ?? '',
    position: String(ad.position),
    sortOrder: String(ad.sortOrder),
    isActive: ad.isActive,
  };
}

function buildFormData(values: AdFormValues, file: File | null): FormData {
  const form = new FormData();
  form.append('title', values.title);
  if (values.linkUrl) form.append('linkUrl', values.linkUrl);
  form.append('position', values.position);
  form.append('sortOrder', values.sortOrder);
  form.append('isActive', String(values.isActive));
  if (file) form.append('image', file);
  return form;
}

function AdForm({
  initial,
  requireImage,
  onSave,
  onCancel,
  submitLabel,
}: {
  initial: AdFormValues;
  requireImage: boolean;
  onSave: (values: AdFormValues, file: File | null) => Promise<void>;
  onCancel?: () => void;
  submitLabel: string;
}) {
  const [form, setForm] = useState<AdFormValues>(initial);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const { refs, setFieldRef } = useFieldRefs<HTMLElement>();

  const set = <K extends keyof AdFormValues>(key: K, value: AdFormValues[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const fieldOrder = ['title', 'position'];
  const fieldErrors: Record<string, string | false> = {
    title: form.title.trim().length < 1 && 'Title is required',
    position: !(Number(form.position) >= 0) && 'Position must be 0 or greater',
  };
  const valid = Object.values(fieldErrors).every((v) => !v);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) {
      scrollToFirstError(fieldOrder, fieldErrors, refs);
      return;
    }
    const file = fileInput.current?.files?.[0] ?? null;
    if (requireImage && !file) {
      setError('An image is required.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await onSave(form, file);
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not save advertisement.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <ErrorBanner message={error} />}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-4">
        <Field label="Title" hint="Internal label, not shown to buyers">
          <Input ref={setFieldRef('title')} value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="Q3 finance partner banner" required />
        </Field>
        <Field label="Link URL (optional)">
          <Input value={form.linkUrl} onChange={(e) => set('linkUrl', e.target.value)} placeholder="https://…" />
        </Field>
        <Field label="Position" hint="Grid slot interval index">
          <Input ref={setFieldRef('position')} type="number" min={0} value={form.position} onChange={(e) => set('position', e.target.value)} required />
        </Field>
        <Field label="Sort order" hint="Lower = shown first among ads">
          <Input type="number" min={0} value={form.sortOrder} onChange={(e) => set('sortOrder', e.target.value)} />
        </Field>
        <Field label={requireImage ? 'Image' : 'Replace image (optional)'}>
          <input
            ref={fileInput}
            type="file"
            accept="image/*"
            className="block w-full text-sm text-navy/60 file:mr-3 file:rounded-lg file:border-0 file:bg-navy/[0.06] file:px-3.5 file:py-2 file:text-sm file:font-semibold file:text-navy hover:file:bg-navy/10"
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
            Active (shown in listing grid)
          </label>
        </div>
      </div>
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

function AdRow({ ad, onChanged }: { ad: AdvertisementDto; onChanged: () => void }) {
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async (values: AdFormValues, file: File | null) => {
    await api.patch(`/advertisements/${ad.id}`, buildFormData(values, file), {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    setEditing(false);
    onChanged();
  };

  const remove = async () => {
    if (!confirm(`Delete "${ad.title}" advertisement? This cannot be undone.`)) return;
    setDeleting(true);
    setError(null);
    try {
      await api.delete(`/advertisements/${ad.id}`);
      onChanged();
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not delete this advertisement.'));
      setDeleting(false);
    }
  };

  if (editing) {
    return (
      <div className="border-t border-navy/10 p-5">
        <p className="mb-4 font-semibold text-navy">Editing: {ad.title}</p>
        {error && <div className="mb-3"><ErrorBanner message={error} /></div>}
        <AdForm initial={adToForm(ad)} requireImage={false} onSave={save} onCancel={() => setEditing(false)} submitLabel="Save changes" />
      </div>
    );
  }

  return (
    <tr className="transition hover:bg-navy/[0.02]">
      <td className="px-5 py-4">
        <div className="flex items-center gap-3">
          <img src={ad.imageUrl} alt="" className="h-12 w-20 rounded-lg border border-navy/10 object-cover" />
          <div>
            <p className="font-semibold text-navy">{ad.title}</p>
            {ad.linkUrl && <p className="mt-0.5 truncate text-[11.5px] text-navy/40">{ad.linkUrl}</p>}
          </div>
        </div>
        {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      </td>
      <td className="px-5 py-4 text-navy/65">{ad.position}</td>
      <td className="px-5 py-4">
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${
            ad.isActive
              ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20'
              : 'bg-slate-100 text-slate-600 ring-slate-500/20'
          }`}
        >
          {ad.isActive ? 'Active' : 'Inactive'}
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

export function AdminAdvertisements() {
  const [ads, setAds] = useState<AdvertisementDto[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reload, setReload] = useState(0);
  const [showCreate, setShowCreate] = useState(false);
  const [createSuccess, setCreateSuccess] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api
      .get<AdvertisementDto[]>('/advertisements/admin/all')
      .then(({ data }) => {
        if (!cancelled) setAds(data);
      })
      .catch((err) => {
        if (!cancelled) {
          setAds([]);
          setError(apiErrorMessage(err, 'Could not load advertisements.'));
        }
      });
    return () => { cancelled = true; };
  }, [reload]);

  const createAd = async (values: AdFormValues, file: File | null) => {
    await api.post('/advertisements', buildFormData(values, file), {
      headers: { 'Content-Type': 'multipart/form-data' },
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
        title="Ad slots"
        description="Manage the display-ad blocks interleaved into the buyer listing grid. Organic listing order is never disturbed by ads."
      />

      {error && <div className="mb-5"><ErrorBanner message={error} /></div>}
      {createSuccess && (
        <div className="mb-5">
          <SuccessBanner message="Advertisement created successfully." />
        </div>
      )}

      <div className="mb-8">
        {showCreate ? (
          <Card>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-lg text-navy">New advertisement</h2>
            </div>
            <AdForm initial={EMPTY_FORM} requireImage onSave={createAd} onCancel={() => setShowCreate(false)} submitLabel="Create ad" />
          </Card>
        ) : (
          <Button onClick={() => setShowCreate(true)}>
            <PlusIcon className="h-4 w-4" />
            New ad slot
          </Button>
        )}
      </div>

      {ads === null ? (
        <LoadingBlock />
      ) : ads.length === 0 ? (
        <EmptyState title="No ad slots yet" description="Add your first ad using the button above." />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-navy/10 bg-white">
          <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-navy/10 bg-navy/[0.02] text-left text-xs font-semibold uppercase tracking-wide text-navy/40">
              <tr>
                <th className="px-5 py-3">Ad</th>
                <th className="px-5 py-3">Position</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-navy/10">
              {ads.map((ad) => (
                <AdRow key={ad.id} ad={ad} onChanged={() => setReload((n) => n + 1)} />
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}
    </div>
  );
}
