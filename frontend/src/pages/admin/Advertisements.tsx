import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AdPlacement, type AdvertisementDto } from '../../shared';
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
  Select,
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
  placement: AdPlacement;
  startsAt: string;
  endsAt: string;
}

const EMPTY_FORM: AdFormValues = {
  title: '',
  linkUrl: '',
  position: '0',
  sortOrder: '0',
  isActive: true,
  placement: AdPlacement.IN_GRID,
  startsAt: '',
  endsAt: '',
};

function adToForm(ad: AdvertisementDto): AdFormValues {
  return {
    title: ad.title,
    linkUrl: ad.linkUrl ?? '',
    position: String(ad.position),
    sortOrder: String(ad.sortOrder),
    isActive: ad.isActive,
    placement: ad.placement,
    startsAt: ad.startsAt ? ad.startsAt.slice(0, 10) : '',
    endsAt: ad.endsAt ? ad.endsAt.slice(0, 10) : '',
  };
}

function buildFormData(values: AdFormValues, file: File | null): FormData {
  const form = new FormData();
  form.append('title', values.title);
  if (values.linkUrl) form.append('linkUrl', values.linkUrl);
  form.append('position', values.position);
  form.append('sortOrder', values.sortOrder);
  form.append('isActive', String(values.isActive));
  form.append('placement', values.placement);
  if (values.startsAt) form.append('startsAt', new Date(values.startsAt).toISOString());
  if (values.endsAt) form.append('endsAt', new Date(values.endsAt).toISOString());
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
  const { t } = useTranslation();
  const [form, setForm] = useState<AdFormValues>(initial);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const { refs, setFieldRef } = useFieldRefs<HTMLElement>();

  const set = <K extends keyof AdFormValues>(key: K, value: AdFormValues[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const fieldOrder = ['title', 'position'];
  const fieldErrors: Record<string, string | false> = {
    title: form.title.trim().length < 1 && t('admin.advertisements.validation.titleRequired'),
    position: !(Number(form.position) >= 0) && t('admin.advertisements.validation.positionInvalid'),
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
      setError(t('admin.advertisements.imageRequired'));
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await onSave(form, file);
    } catch (err) {
      setError(apiErrorMessage(err, t('admin.advertisements.saveError')));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <ErrorBanner message={error} />}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-4">
        <Field label={t('admin.advertisements.fields.title')} hint={t('admin.advertisements.fields.titleHint')}>
          <Input ref={setFieldRef('title')} value={form.title} onChange={(e) => set('title', e.target.value)} placeholder={t('admin.advertisements.fields.titlePlaceholder')} required />
        </Field>
        <Field label={t('admin.advertisements.fields.linkUrl')}>
          <Input value={form.linkUrl} onChange={(e) => set('linkUrl', e.target.value)} placeholder="https://…" />
        </Field>
        <Field label={t('admin.advertisements.fields.position')} hint={t('admin.advertisements.fields.positionHint')}>
          <Input ref={setFieldRef('position')} type="number" min={0} value={form.position} onChange={(e) => set('position', e.target.value)} required />
        </Field>
        <Field label={t('admin.advertisements.fields.sortOrder')} hint={t('admin.advertisements.fields.sortOrderHint')}>
          <Input type="number" min={0} value={form.sortOrder} onChange={(e) => set('sortOrder', e.target.value)} />
        </Field>
        <Field label={t('admin.advertisements.fields.placement')} hint={t('admin.advertisements.fields.placementHint')}>
          <Select value={form.placement} onChange={(e) => set('placement', e.target.value as AdPlacement)}>
            <option value={AdPlacement.IN_GRID}>{t('admin.advertisements.fields.placementInGrid')}</option>
            <option value={AdPlacement.HOME_BANNER}>{t('admin.advertisements.fields.placementHomeBanner')}</option>
          </Select>
        </Field>
        <Field label={t('admin.advertisements.fields.startsAt')} hint={t('admin.advertisements.fields.dateRangeHint')}>
          <Input type="date" value={form.startsAt} onChange={(e) => set('startsAt', e.target.value)} />
        </Field>
        <Field label={t('admin.advertisements.fields.endsAt')}>
          <Input type="date" value={form.endsAt} onChange={(e) => set('endsAt', e.target.value)} />
        </Field>
        <Field label={requireImage ? t('admin.advertisements.fields.image') : t('admin.advertisements.fields.replaceImage')}>
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
            {t('admin.advertisements.fields.activeCheckbox')}
          </label>
        </div>
      </div>
      <div className="flex gap-3">
        <Button type="submit" disabled={!valid || submitting}>
          {submitting ? t('admin.advertisements.saving') : submitLabel}
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

function AdRow({ ad, onChanged }: { ad: AdvertisementDto; onChanged: () => void }) {
  const { t } = useTranslation();
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
    if (!confirm(t('admin.advertisements.deleteConfirm', { title: ad.title }))) return;
    setDeleting(true);
    setError(null);
    try {
      await api.delete(`/advertisements/${ad.id}`);
      onChanged();
    } catch (err) {
      setError(apiErrorMessage(err, t('admin.advertisements.deleteError')));
      setDeleting(false);
    }
  };

  if (editing) {
    return (
      <div className="border-t border-navy/10 p-5">
        <p className="mb-4 font-semibold text-navy">{t('admin.advertisements.editing', { title: ad.title })}</p>
        {error && <div className="mb-3"><ErrorBanner message={error} /></div>}
        <AdForm initial={adToForm(ad)} requireImage={false} onSave={save} onCancel={() => setEditing(false)} submitLabel={t('admin.advertisements.saveChanges')} />
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
            ad.placement === 'HOME_BANNER'
              ? 'bg-copper-bg text-copper-2 ring-copper-bdr'
              : 'bg-navy/[0.05] text-navy/70 ring-navy/10'
          }`}
        >
          {ad.placement === 'HOME_BANNER' ? t('admin.advertisements.fields.placementHomeBanner') : t('admin.advertisements.fields.placementInGrid')}
        </span>
        {(ad.startsAt || ad.endsAt) && (
          <p className="mt-1 text-[11px] text-navy/40">
            {ad.startsAt ? new Date(ad.startsAt).toLocaleDateString('en-IN') : '—'} → {ad.endsAt ? new Date(ad.endsAt).toLocaleDateString('en-IN') : '—'}
          </p>
        )}
      </td>
      <td className="px-5 py-4">
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${
            ad.isActive
              ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20'
              : 'bg-slate-100 text-slate-600 ring-slate-500/20'
          }`}
        >
          {ad.isActive ? t('admin.advertisements.active') : t('admin.advertisements.inactive')}
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

export function AdminAdvertisements() {
  const { t } = useTranslation();
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
          setError(apiErrorMessage(err, t('admin.advertisements.loadError')));
        }
      });
    return () => { cancelled = true; };
  }, [reload, t]);

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
        eyebrow={t('admin.advertisements.eyebrow')}
        title={t('admin.advertisements.title')}
        description={t('admin.advertisements.description')}
      />

      {error && <div className="mb-5"><ErrorBanner message={error} /></div>}
      {createSuccess && (
        <div className="mb-5">
          <SuccessBanner message={t('admin.advertisements.createSuccess')} />
        </div>
      )}

      <div className="mb-8">
        {showCreate ? (
          <Card>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-lg text-navy">{t('admin.advertisements.newAdTitle')}</h2>
            </div>
            <AdForm initial={EMPTY_FORM} requireImage onSave={createAd} onCancel={() => setShowCreate(false)} submitLabel={t('admin.advertisements.createAd')} />
          </Card>
        ) : (
          <Button onClick={() => setShowCreate(true)}>
            <PlusIcon className="h-4 w-4" />
            {t('admin.advertisements.newAdSlot')}
          </Button>
        )}
      </div>

      {ads === null ? (
        <LoadingBlock />
      ) : ads.length === 0 ? (
        <EmptyState title={t('admin.advertisements.emptyTitle')} description={t('admin.advertisements.emptyDescription')} />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-navy/10 bg-white">
          <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-navy/10 bg-navy/[0.02] text-left text-xs font-semibold uppercase tracking-wide text-navy/40">
              <tr>
                <th className="px-5 py-3">{t('admin.advertisements.columns.ad')}</th>
                <th className="px-5 py-3">{t('admin.advertisements.columns.position')}</th>
                <th className="px-5 py-3">{t('admin.advertisements.columns.placement')}</th>
                <th className="px-5 py-3">{t('admin.advertisements.columns.status')}</th>
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
