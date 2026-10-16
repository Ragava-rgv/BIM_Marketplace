import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  MACHINE_CATEGORIES,
  MIN_LISTING_PHOTOS,
  MAX_LISTING_PHOTOS,
  MIN_VIDEO_DURATION_SECONDS,
  ListingStatus,
  MediaType,
} from '../../shared';
import type { ListingDto, ListingMediaDto } from '../../shared';
import { api, apiErrorMessage } from '../../lib/api';
import { AppLayout } from '../../components/AppLayout';
import { ArrowDownIcon, ArrowUpIcon, ChevronRightIcon, PlusIcon, MachineIcon, StarIcon } from '../../components/icons';
import { BoostSheet } from '../../components/BoostSheet';
import { WithdrawConfirmSheet } from '../../components/WithdrawConfirmSheet';
import { INDIA_STATES, INDIA_STATES_AND_CITIES } from '../../lib/india-locations';
import { formatInr } from '../../lib/format';
import { scrollToFirstError, useFieldRefs } from '../../lib/form-errors';

const inputCls =
  'w-full h-[50px] bg-gray-50 border border-gray-200 rounded-[12px] px-4 text-[14px] text-ink font-medium placeholder-gray-400 outline-none focus:border-forest focus:bg-white transition';
const selectCls = inputCls + ' appearance-none pr-8';

function Field({ label, required, hint, children }: { label: string; required?: boolean; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[11.5px] font-semibold text-gray-600 mb-1">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {hint && <p className="mt-1 text-[11px] text-gray-400">{hint}</p>}
    </div>
  );
}

function SelectWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative">
      {children}
      <ChevronRightIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 rotate-90 pointer-events-none" />
    </div>
  );
}

const STATUS_STYLE: Record<string, string> = {
  ACTIVE: 'bg-green-bg text-green-txt',
  PENDING_REVIEW: 'bg-copper-bg text-copper',
  DRAFT: 'bg-gray-100 text-gray-600',
  REJECTED: 'bg-red-50 text-red-600',
  SOLD: 'bg-gray-100 text-gray-500',
  WITHDRAWN: 'bg-gray-100 text-gray-500',
  UNDER_OFFER: 'bg-blue-50 text-blue-700',
};

function getVideoDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    const url = URL.createObjectURL(file);
    video.onloadedmetadata = () => { URL.revokeObjectURL(url); resolve(Math.round(video.duration)); };
    video.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Cannot read video duration')); };
    video.src = url;
  });
}

function fmtDuration(secs: number) {
  return `${Math.floor(secs / 60)}m ${secs % 60}s`;
}

interface FormData {
  title: string;
  machineCategory: string;
  machineSubcategory: string;
  machineMake: string;
  machineModel: string;
  manufactureYear: string;
  origin: string;
  importedCountry: string;
  condition: 'OLD' | 'NEW';
  askingPrice: string;
  locationCity: string;
  locationState: string;
  description: string;
}

const EDIT_CURRENT_YEAR = new Date().getFullYear();
const EDIT_YEAR_OPTIONS = Array.from({ length: EDIT_CURRENT_YEAR - 1950 + 1 }, (_, i) => EDIT_CURRENT_YEAR - i);
const EDIT_IMPORT_COUNTRIES = [
  'China', 'Japan', 'South Korea', 'Germany', 'USA', 'Italy',
  'United Kingdom', 'France', 'Sweden', 'Taiwan', 'Singapore', 'UAE', 'Other',
];

export function EditListing() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [listing, setListing] = useState<ListingDto | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  // Active tab
  const [tab, setTab] = useState<'details' | 'media'>('details');

  // Form state
  const [form, setForm] = useState<FormData>({
    title: '', machineCategory: '', machineSubcategory: '',
    machineMake: '', machineModel: '',
    manufactureYear: '', origin: 'INDIAN', importedCountry: '', condition: 'OLD',
    askingPrice: '', locationCity: '', locationState: '', description: '',
  });
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const { refs: fieldRefs, setFieldRef } = useFieldRefs<HTMLElement>();

  // Media state
  const [photos, setPhotos] = useState<ListingMediaDto[]>([]);
  const [video, setVideo] = useState<ListingMediaDto | null>(null);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [videoUploading, setVideoUploading] = useState(false);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [reorderingId, setReorderingId] = useState<string | null>(null);
  const [primaryPending, setPrimaryPending] = useState<string | null>(null);
  const [boostOpen, setBoostOpen] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  // Action states
  const [submitLoading, setSubmitLoading] = useState(false);
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [withdrawConfirmOpen, setWithdrawConfirmOpen] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) { setNotFound(true); setPageLoading(false); return; }
    api.get<ListingDto>(`/listings/mine/${id}`)
      .then(({ data }) => {
        setListing(data);
        setForm({
          title: data.title,
          machineCategory: data.machineCategory,
          machineSubcategory: data.machineSubcategory ?? '',
          machineMake: data.machineMake,
          machineModel: data.machineModel,
          manufactureYear: data.manufactureYear != null ? String(data.manufactureYear) : '',
          origin: data.origin,
          importedCountry: data.importedCountry ?? '',
          condition: data.condition,
          askingPrice: data.askingPrice,
          locationCity: data.locationCity,
          locationState: data.locationState,
          description: data.description,
        });
        const existingPhotos = data.media?.filter((m) => m.type === MediaType.PHOTO) ?? [];
        const existingVideo = data.media?.find((m) => m.type === MediaType.VIDEO) ?? null;
        setPhotos(existingPhotos);
        setVideo(existingVideo);
      })
      .catch(() => setNotFound(true))
      .finally(() => setPageLoading(false));
  }, [id]);

  const setField = (f: keyof FormData, v: string) => setForm((prev) => ({ ...prev, [f]: v }));
  const selectedCat = MACHINE_CATEGORIES.find((c) => c.label === form.machineCategory);
  const subcategories = selectedCat?.subcategories ?? [];
  const cities = form.locationState ? (INDIA_STATES_AND_CITIES[form.locationState] ?? []) : [];

  const canEditDetails =
    listing?.status === ListingStatus.DRAFT ||
    listing?.status === ListingStatus.REJECTED ||
    listing?.status === ListingStatus.ACTIVE;
  const canEditMedia =
    listing?.status === ListingStatus.DRAFT ||
    listing?.status === ListingStatus.REJECTED ||
    listing?.status === ListingStatus.ACTIVE;
  const mediaGatePassed = photos.length >= MIN_LISTING_PHOTOS && photos.length <= MAX_LISTING_PHOTOS && video !== null;
  // Submitting for review only applies to draft/rejected listings — an ACTIVE listing is
  // already live and editable in place, it doesn't need (re-)submitting.
  const canSubmitForReview =
    listing?.status === ListingStatus.DRAFT || listing?.status === ListingStatus.REJECTED;
  const canSubmit = canSubmitForReview && mediaGatePassed;

  // ── Save details ──────────────────────────────────────────────────────────

  const detailsFieldOrder = [
    'title', 'machineCategory', 'machineMake', 'machineModel', 'importedCountry',
    'askingPrice', 'locationState', 'locationCity', 'description',
  ];

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    const fieldErrors: Record<string, string | false> = {
      title: form.title.trim().length < 5 && t('seller.editListing.errors.titleTooShort'),
      machineCategory: !form.machineCategory && t('seller.editListing.errors.categoryRequired'),
      machineMake: !form.machineMake.trim() && t('seller.editListing.errors.makeRequired'),
      machineModel: !form.machineModel.trim() && t('seller.editListing.errors.modelRequired'),
      importedCountry: form.origin === 'IMPORTED' && !form.importedCountry && t('seller.editListing.errors.importedCountryRequired'),
      askingPrice: (!form.askingPrice || parseFloat(form.askingPrice) <= 0) && t('seller.editListing.errors.invalidPrice'),
      locationState: !form.locationState && t('seller.editListing.errors.stateRequired'),
      locationCity: !form.locationCity && t('seller.editListing.errors.cityRequired'),
      description: form.description.trim().length < 20 && t('seller.editListing.errors.descriptionTooShort'),
    };
    if (Object.values(fieldErrors).some(Boolean)) {
      setSaveError(t('seller.editListing.errors.fixHighlightedFields'));
      scrollToFirstError(detailsFieldOrder, fieldErrors, fieldRefs);
      return;
    }
    setSaveLoading(true);
    setSaveError(null);
    setSaveSuccess(false);
    try {
      const { data } = await api.patch<ListingDto>(`/listings/${id}`, {
        title: form.title.trim(),
        description: form.description.trim(),
        machineCategory: form.machineCategory,
        ...(form.machineSubcategory ? { machineSubcategory: form.machineSubcategory } : {}),
        machineMake: form.machineMake.trim(),
        machineModel: form.machineModel.trim(),
        manufactureYear: form.manufactureYear ? parseInt(form.manufactureYear, 10) : null,
        origin: form.origin,
        ...(form.origin === 'IMPORTED' ? { importedCountry: form.importedCountry } : {}),
        condition: form.condition,
        askingPrice: parseFloat(form.askingPrice),
        locationCity: form.locationCity,
        locationState: form.locationState,
      });
      setListing(data);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setSaveError(apiErrorMessage(err, t('seller.editListing.errors.saveFailed')));
    } finally {
      setSaveLoading(false);
    }
  };

  // ── Photo upload ──────────────────────────────────────────────────────────

  const handlePhotoFiles = async (files: FileList) => {
    if (!id) return;
    const remaining = MAX_LISTING_PHOTOS - photos.length;
    if (remaining <= 0) { setMediaError(t('seller.editListing.errors.maxPhotosUploaded', { count: MAX_LISTING_PHOTOS })); return; }
    const toUpload = Array.from(files).slice(0, remaining);
    setPhotoUploading(true);
    setMediaError(null);
    for (const file of toUpload) {
      try {
        const fd = new FormData();
        fd.append('file', file);
        fd.append('type', 'PHOTO');
        fd.append('capturedAt', new Date().toISOString());
        const { data } = await api.post<ListingMediaDto>(`/listings/${id}/media`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        setPhotos((p) => [...p, data]);
      } catch (err) {
        setMediaError(apiErrorMessage(err, t('seller.editListing.errors.photoUploadFailed')));
        break;
      }
    }
    setPhotoUploading(false);
    if (photoInputRef.current) photoInputRef.current.value = '';
  };

  const removePhoto = async (photo: ListingMediaDto) => {
    if (!id) return;
    try {
      await api.delete(`/listings/${id}/media/${photo.id}`);
      setPhotos((p) => p.filter((ph) => ph.id !== photo.id));
    } catch (err) {
      setMediaError(apiErrorMessage(err, t('seller.editListing.errors.removePhotoFailed')));
    }
  };

  const handleMovePhoto = async (photoId: string, direction: -1 | 1) => {
    if (!id) return;
    const index = photos.findIndex((p) => p.id === photoId);
    const swapIndex = index + direction;
    if (index === -1 || swapIndex < 0 || swapIndex >= photos.length) return;

    const reordered = [...photos];
    [reordered[index], reordered[swapIndex]] = [reordered[swapIndex], reordered[index]];

    setMediaError(null);
    setReorderingId(photoId);
    try {
      const { data } = await api.patch<ListingMediaDto[]>(`/listings/${id}/media/reorder`, {
        mediaIds: reordered.map((p) => p.id),
      });
      setPhotos(data.filter((m) => m.type === MediaType.PHOTO));
    } catch (err) {
      setMediaError(apiErrorMessage(err, t('seller.editListing.errors.reorderPhotosFailed')));
    } finally {
      setReorderingId(null);
    }
  };

  const handleSetPrimary = async (photoId: string) => {
    if (!id) return;
    setMediaError(null);
    setPrimaryPending(photoId);
    try {
      const { data } = await api.patch<ListingMediaDto[]>(`/listings/${id}/media/${photoId}/primary`);
      setPhotos(data.filter((m) => m.type === MediaType.PHOTO));
    } catch (err) {
      setMediaError(apiErrorMessage(err, t('seller.editListing.errors.setPrimaryFailed')));
    } finally {
      setPrimaryPending(null);
    }
  };

  // ── Video upload ──────────────────────────────────────────────────────────

  const handleVideoFile = async (file: File) => {
    if (!id) return;
    setVideoUploading(true);
    setMediaError(null);
    try {
      let durationSeconds: number;
      try { durationSeconds = await getVideoDuration(file); }
      catch { setMediaError(t('seller.editListing.errors.videoDurationReadFailed')); setVideoUploading(false); return; }
      if (durationSeconds < MIN_VIDEO_DURATION_SECONDS) {
        setMediaError(t('seller.editListing.errors.videoTooShort', { min: MIN_VIDEO_DURATION_SECONDS, actual: fmtDuration(durationSeconds) }));
        setVideoUploading(false);
        if (videoInputRef.current) videoInputRef.current.value = '';
        return;
      }
      const fd = new FormData();
      fd.append('file', file);
      fd.append('type', 'VIDEO');
      fd.append('durationSeconds', String(durationSeconds));
      const { data } = await api.post<ListingMediaDto>(`/listings/${id}/media`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setVideo(data);
    } catch (err) {
      setMediaError(apiErrorMessage(err, t('seller.editListing.errors.videoUploadFailed')));
    } finally {
      setVideoUploading(false);
      if (videoInputRef.current) videoInputRef.current.value = '';
    }
  };

  const removeVideo = async () => {
    if (!id || !video) return;
    try {
      await api.delete(`/listings/${id}/media/${video.id}`);
      setVideo(null);
    } catch (err) {
      setMediaError(apiErrorMessage(err, t('seller.editListing.errors.removeVideoFailed')));
    }
  };

  // ── Submit / Withdraw ─────────────────────────────────────────────────────

  const handleSubmit = async () => {
    if (!id) return;
    setSubmitLoading(true);
    setActionError(null);
    try {
      await api.post(`/listings/${id}/submit`);
      navigate('/seller/listings', { replace: true });
    } catch (err) {
      setActionError(apiErrorMessage(err, t('seller.editListing.errors.submitFailed')));
      setSubmitLoading(false);
    }
  };

  const handleWithdraw = async () => {
    if (!id) return;
    setWithdrawConfirmOpen(false);
    setWithdrawLoading(true);
    setActionError(null);
    try {
      await api.post(`/listings/${id}/withdraw`);
      navigate('/seller/listings', { replace: true });
    } catch (err) {
      setActionError(apiErrorMessage(err, t('seller.editListing.errors.withdrawFailed')));
      setWithdrawLoading(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  if (pageLoading) {
    return (
      <AppLayout>
        <div className="px-4 pt-4 space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-[50px] bg-gray-100 rounded-[12px] animate-pulse" />
          ))}
        </div>
      </AppLayout>
    );
  }

  if (notFound || !listing) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
          <MachineIcon className="w-12 h-12 text-gray-300 mb-3" />
          <p className="text-[15px] font-bold text-ink mb-1">{t('seller.editListing.notFoundTitle')}</p>
          <p className="text-[12px] text-gray-500 mb-4">{t('seller.editListing.notFoundDescription')}</p>
          <button onClick={() => navigate('/seller/listings')}
            className="bg-forest text-white text-[13px] font-bold px-5 py-2.5 rounded-[11px]">
            {t('seller.editListing.notFoundButton')}
          </button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 pt-4 pb-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="w-8 h-8 flex items-center justify-center flex-shrink-0">
          <ChevronRightIcon className="w-4 h-4 text-gray-500 rotate-180" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-[15px] font-extrabold text-ink tracking-[-0.3px] truncate">{listing.title}</h1>
          <div className="flex items-center gap-2 mt-0.5">
            <span className={`inline-flex text-[9px] font-bold px-1.5 py-0.5 rounded-[5px] ${
              STATUS_STYLE[listing.status] ?? 'bg-gray-100 text-gray-600'
            }`}>
              {t(`common:status.listing.${listing.status}`, listing.status.replace(/_/g, ' '))}
            </span>
            <p className="text-[10.5px] text-gray-400">{formatInr(listing.askingPrice)}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200 flex">
        {(['details', 'media'] as const).map((tabKey) => (
          <button key={tabKey} onClick={() => setTab(tabKey)}
            className={`flex-1 py-3 text-[12.5px] font-bold transition ${
              tab === tabKey ? 'text-forest border-b-2 border-forest' : 'text-gray-500'
            }`}>
            {tabKey === 'details' ? t('seller.editListing.tabs.details') : t('seller.editListing.tabs.media')}
            {tabKey === 'media' && (
              <span className={`ml-1.5 text-[9px] px-1.5 py-0.5 rounded-full font-bold ${
                mediaGatePassed ? 'bg-green-bg text-green-txt' : 'bg-gray-100 text-gray-500'
              }`}>
                {photos.length}P · {video ? '1V' : '0V'}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Details tab ────────────────────────────────────────────────────── */}
      {tab === 'details' && (
        <div className="px-4 pt-4 pb-6">
          {canEditDetails ? (
            <form onSubmit={handleSave} className="space-y-4">
              {listing.status === ListingStatus.REJECTED && (
                <div className="bg-red-50 border border-red-200 rounded-[12px] px-3.5 py-3">
                  <p className="text-[12px] font-bold text-red-600 mb-0.5">{t('seller.editListing.rejectedNotice.title')}</p>
                  <p className="text-[11px] text-red-500">
                    {t('seller.editListing.rejectedNotice.description')}
                  </p>
                </div>
              )}

              <Field label={t('seller.editListing.fields.title')} required>
                <input ref={setFieldRef('title')} value={form.title} onChange={(e) => setField('title', e.target.value)}
                  className={inputCls} minLength={5} maxLength={160} />
              </Field>

              <Field label={t('seller.editListing.fields.category')} required>
                <SelectWrapper>
                  <select ref={setFieldRef('machineCategory')} value={form.machineCategory}
                    onChange={(e) => { setField('machineCategory', e.target.value); setField('machineSubcategory', ''); }}
                    className={selectCls}>
                    <option value="">{t('seller.editListing.fields.categoryPlaceholder')}</option>
                    {MACHINE_CATEGORIES.map((c) => <option key={c.id} value={c.label}>{t(`common:taxonomy.category.${c.id}.label`, c.label)}</option>)}
                  </select>
                </SelectWrapper>
              </Field>

              {subcategories.length > 0 && (
                <Field label={t('seller.editListing.fields.subcategory')}>
                  <SelectWrapper>
                    <select value={form.machineSubcategory}
                      onChange={(e) => setField('machineSubcategory', e.target.value)}
                      className={selectCls}>
                      <option value="">{t('seller.editListing.fields.subcategoryPlaceholder')}</option>
                      {subcategories.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </SelectWrapper>
                </Field>
              )}

              <div className="grid grid-cols-2 gap-3">
                <Field label={t('seller.editListing.fields.make')} required>
                  <input ref={setFieldRef('machineMake')} value={form.machineMake} onChange={(e) => setField('machineMake', e.target.value)} className={inputCls} />
                </Field>
                <Field label={t('seller.editListing.fields.model')} required>
                  <input ref={setFieldRef('machineModel')} value={form.machineModel} onChange={(e) => setField('machineModel', e.target.value)} className={inputCls} />
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field label={t('seller.editListing.fields.yearBought')} hint={t('seller.editListing.fields.yearBoughtHint')}>
                  <SelectWrapper>
                    <select value={form.manufactureYear} onChange={(e) => setField('manufactureYear', e.target.value)} className={selectCls}>
                      <option value="">{t('common:common.label.notAvailable')}</option>
                      {EDIT_YEAR_OPTIONS.map((year) => <option key={year} value={year}>{year}</option>)}
                    </select>
                  </SelectWrapper>
                </Field>
                <Field label={t('seller.editListing.fields.origin')} required>
                  <SelectWrapper>
                    <select value={form.origin} onChange={(e) => setField('origin', e.target.value)} className={selectCls}>
                      <option value="INDIAN">{t('seller.editListing.origin.indian')}</option>
                      <option value="IMPORTED">{t('seller.editListing.origin.imported')}</option>
                    </select>
                  </SelectWrapper>
                </Field>
                <Field label={t('common:listing.condition')} required>
                  <SelectWrapper>
                    <select value={form.condition} onChange={(e) => setField('condition', e.target.value as FormData['condition'])} className={selectCls}>
                      <option value="OLD">{t('common:listing.conditionOld')}</option>
                      <option value="NEW">{t('common:listing.conditionNew')}</option>
                    </select>
                  </SelectWrapper>
                </Field>
              </div>

              {form.origin === 'IMPORTED' && (
                <Field label={t('seller.editListing.fields.importedCountry')} required>
                  <SelectWrapper>
                    <select ref={setFieldRef('importedCountry')} value={form.importedCountry} onChange={(e) => setField('importedCountry', e.target.value)} className={selectCls}>
                      <option value="">{t('seller.editListing.fields.importedCountryPlaceholder')}</option>
                      {EDIT_IMPORT_COUNTRIES.map((country) => <option key={country} value={country}>{country}</option>)}
                    </select>
                  </SelectWrapper>
                </Field>
              )}

              <Field label={t('seller.editListing.fields.price')} required>
                <input
                  ref={setFieldRef('askingPrice')}
                  type="text"
                  inputMode="numeric"
                  value={form.askingPrice ? Number(form.askingPrice).toLocaleString('en-IN') : ''}
                  onChange={(e) => setField('askingPrice', e.target.value.replace(/[^0-9]/g, ''))}
                  className={inputCls}
                />
              </Field>

              <Field label={t('seller.editListing.fields.state')} required>
                <SelectWrapper>
                  <select ref={setFieldRef('locationState')} value={form.locationState}
                    onChange={(e) => { setField('locationState', e.target.value); setField('locationCity', ''); }}
                    className={selectCls}>
                    <option value="">{t('seller.editListing.fields.statePlaceholder')}</option>
                    {INDIA_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </SelectWrapper>
              </Field>

              <Field label={t('seller.editListing.fields.city')} required>
                <SelectWrapper>
                  <select ref={setFieldRef('locationCity')} value={form.locationCity} onChange={(e) => setField('locationCity', e.target.value)}
                    className={selectCls} disabled={!form.locationState}>
                    <option value="">{t('seller.editListing.fields.cityPlaceholder')}</option>
                    {cities.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </SelectWrapper>
              </Field>

              <Field label={t('seller.editListing.fields.description')} required>
                <textarea ref={setFieldRef('description')} value={form.description} onChange={(e) => setField('description', e.target.value)}
                  rows={5}
                  className="w-full bg-gray-50 border border-gray-200 rounded-[12px] px-4 py-3 text-[14px] text-ink font-medium placeholder-gray-400 outline-none focus:border-forest focus:bg-white transition resize-none" />
              </Field>

              {saveError && (
                <p className="text-[12px] text-red-600 font-medium bg-red-50 border border-red-200 rounded-[10px] px-3 py-2.5">
                  {saveError}
                </p>
              )}
              {saveSuccess && (
                <p className="text-[12px] text-green-txt font-medium bg-green-bg border border-green-bdr rounded-[10px] px-3 py-2.5">
                  {t('seller.editListing.saveSuccess')}
                </p>
              )}

              <button type="submit" disabled={saveLoading}
                className="w-full h-[50px] bg-forest text-white rounded-[13px] text-[14.5px] font-bold disabled:opacity-50">
                {saveLoading ? t('seller.editListing.saving') : t('seller.editListing.saveChanges')}
              </button>
            </form>
          ) : (
            /* Read-only summary */
            <div className="space-y-3">
              <div className="bg-white border border-gray-200 rounded-[13px] overflow-hidden divide-y divide-gray-100">
                {[
                  [t('seller.editListing.summary.title'), listing.title],
                  [t('seller.editListing.summary.category'), [listing.machineCategory, listing.machineSubcategory].filter(Boolean).join(' › ')],
                  [t('seller.editListing.summary.makeModel'), `${listing.machineMake} ${listing.machineModel}`],
                  [t('seller.editListing.summary.year'), listing.manufactureYear != null ? String(listing.manufactureYear) : t('common:common.label.notAvailable')],
                  [
                    t('seller.editListing.summary.origin'),
                    listing.origin === 'IMPORTED'
                      ? `${t('seller.editListing.origin.imported')}${listing.importedCountry ? ` (${listing.importedCountry})` : ''}`
                      : t('seller.editListing.origin.indian'),
                  ],
                  [t('seller.editListing.summary.price'), formatInr(listing.askingPrice)],
                  [t('seller.editListing.summary.location'), `${listing.locationCity}, ${listing.locationState}`],
                ].map(([label, value]) => (
                  <div key={label} className="flex items-start gap-3 px-4 py-3">
                    <p className="text-[11px] font-semibold text-gray-500 w-24 shrink-0 pt-0.5">{label}</p>
                    <p className="text-[13px] text-ink font-medium flex-1">{value}</p>
                  </div>
                ))}
              </div>
              <div className="bg-white border border-gray-200 rounded-[13px] px-4 py-3">
                <p className="text-[11px] font-semibold text-gray-500 mb-1.5">{t('seller.editListing.summary.description')}</p>
                <p className="text-[13px] text-ink leading-relaxed">{listing.description}</p>
              </div>

              {listing.status === ListingStatus.ACTIVE && (
                <>
                  {actionError && (
                    <p className="text-[12px] text-red-600 font-medium bg-red-50 border border-red-200 rounded-[10px] px-3 py-2.5">
                      {actionError}
                    </p>
                  )}
                  <button onClick={() => setBoostOpen(true)}
                    className="w-full h-[50px] bg-copper-bg border border-copper-bdr text-copper rounded-[13px] text-[14px] font-bold flex items-center justify-center gap-1.5">
                    <StarIcon className="w-4 h-4" />
                    {listing.isBoosted ? t('seller.editListing.boost.manageButton') : t('seller.editListing.boost.startButton')}
                  </button>
                  <button onClick={() => setWithdrawConfirmOpen(true)} disabled={withdrawLoading}
                    className="w-full h-[50px] bg-white border border-red-200 text-red-600 rounded-[13px] text-[14px] font-bold disabled:opacity-50">
                    {withdrawLoading ? t('seller.editListing.withdrawing') : t('seller.editListing.withdrawListing')}
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Media tab ──────────────────────────────────────────────────────── */}
      {tab === 'media' && (
        <div className="px-4 pt-4 pb-6 space-y-5">
          {!canEditMedia && (
            <div className="bg-gray-50 border border-gray-200 rounded-[12px] px-3.5 py-3">
              <p className="text-[11.5px] font-semibold text-gray-500">
                {t('seller.editListing.media.cannotChange', { status: t(`common:status.listing.${listing.status}`, listing.status.replace(/_/g, ' ')) })}
              </p>
            </div>
          )}

          {/* Gate status */}
          <div className={`rounded-[12px] px-3.5 py-3 border ${mediaGatePassed ? 'bg-green-bg border-green-bdr' : 'bg-copper-bg border-copper-bdr'}`}>
            <p className={`text-[12px] font-bold mb-1.5 ${mediaGatePassed ? 'text-green-txt' : 'text-copper'}`}>
              {mediaGatePassed ? t('seller.editListing.media.requirementsMet') : t('seller.editListing.media.requirementsTitle')}
            </p>
            <p className={`text-[11px] font-medium ${photos.length >= MIN_LISTING_PHOTOS ? 'text-green-txt' : 'text-copper'}`}>
              {photos.length >= MIN_LISTING_PHOTOS ? '✓' : '○'} {t('seller.editListing.media.photosLine', { count: photos.length, min: MIN_LISTING_PHOTOS, max: MAX_LISTING_PHOTOS })}
            </p>
            <p className={`text-[11px] font-medium mt-0.5 ${video ? 'text-green-txt' : 'text-copper'}`}>
              {video ? '✓' : '○'} {video ? t('seller.editListing.media.videoUploadedLine', { duration: fmtDuration(video.durationSeconds ?? 0) }) : t('seller.editListing.media.videoRequiredLine', { min: MIN_VIDEO_DURATION_SECONDS })}
            </p>
          </div>

          {/* Photos */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <p className="text-[13.5px] font-bold text-ink">{t('seller.editListing.media.machinePhotos')}</p>
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${photos.length >= MIN_LISTING_PHOTOS ? 'bg-green-bg text-green-txt' : 'bg-gray-100 text-gray-500'}`}>
                {photos.length} / {MAX_LISTING_PHOTOS}
              </span>
            </div>

            {photos.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mb-3">
                {photos.map((photo, i) => (
                  <div key={photo.id} className="relative aspect-square rounded-[10px] overflow-hidden bg-gray-100">
                    <img src={photo.url} alt={t('seller.editListing.media.photoAlt', { index: i + 1 })} className="w-full h-full object-cover" />

                    {photo.isPrimary && (
                      <span className="absolute left-1 top-1 flex items-center gap-0.5 rounded-[6px] bg-forest px-1.5 py-0.5 text-[8.5px] font-bold text-white">
                        <StarIcon className="w-2 h-2 fill-white stroke-white" />
                        {t('seller.editListing.media.primaryBadge')}
                      </span>
                    )}

                    {canEditMedia && (
                      <button type="button" onClick={() => removePhoto(photo)}
                        className="absolute top-1 right-1 w-5 h-5 bg-black/55 rounded-full flex items-center justify-center text-white text-[13px] font-bold">
                        ×
                      </button>
                    )}

                    {canEditMedia && (
                      <div className="absolute bottom-1 left-1 right-1 flex items-center justify-between gap-1">
                        {!photo.isPrimary ? (
                          <button
                            type="button"
                            onClick={() => handleSetPrimary(photo.id)}
                            disabled={primaryPending === photo.id}
                            className="flex h-6 w-6 items-center justify-center rounded-[6px] bg-white/85 text-ink disabled:opacity-50"
                            aria-label={t('seller.editListing.media.setPrimaryAriaLabel')}
                          >
                            <StarIcon className="w-3 h-3" />
                          </button>
                        ) : <span />}
                        <div className="flex gap-1">
                          <button
                            type="button"
                            onClick={() => handleMovePhoto(photo.id, -1)}
                            disabled={reorderingId === photo.id || i === 0}
                            className="flex h-6 w-6 items-center justify-center rounded-[6px] bg-white/85 text-ink disabled:opacity-40"
                            aria-label={t('seller.editListing.media.moveEarlierAriaLabel')}
                          >
                            <ArrowUpIcon className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMovePhoto(photo.id, 1)}
                            disabled={reorderingId === photo.id || i === photos.length - 1}
                            className="flex h-6 w-6 items-center justify-center rounded-[6px] bg-white/85 text-ink disabled:opacity-40"
                            aria-label={t('seller.editListing.media.moveLaterAriaLabel')}
                          >
                            <ArrowDownIcon className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {canEditMedia && photos.length < MAX_LISTING_PHOTOS && (
              <>
                <input ref={photoInputRef} type="file" accept="image/*" multiple className="hidden"
                  onChange={(e) => { if (e.target.files?.length) handlePhotoFiles(e.target.files); }} />
                <button type="button" onClick={() => photoInputRef.current?.click()} disabled={photoUploading}
                  className="w-full h-[50px] border-2 border-dashed border-gray-300 rounded-[12px] flex items-center justify-center gap-2 text-[13px] font-semibold text-gray-500 disabled:opacity-50 bg-gray-50">
                  {photoUploading ? <span className="animate-pulse text-forest">{t('seller.editListing.media.uploadingPhotos')}</span> : (
                    <><PlusIcon className="w-4 h-4" />{t('seller.editListing.media.addPhotos')}</>
                  )}
                </button>
              </>
            )}
          </div>

          {/* Video */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <p className="text-[13.5px] font-bold text-ink">{t('seller.editListing.media.runningVideo')}</p>
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${video ? 'bg-green-bg text-green-txt' : 'bg-gray-100 text-gray-500'}`}>
                {video ? '1 / 1' : '0 / 1'}
              </span>
            </div>

            {video ? (
              <div className="bg-white border border-gray-200 rounded-[12px] px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="text-[13px] font-semibold text-ink">{t('seller.editListing.media.videoUploaded')}</p>
                  <p className="text-[11px] text-gray-500 mt-0.5">{fmtDuration(video.durationSeconds ?? 0)}</p>
                </div>
                {canEditMedia && (
                  <button type="button" onClick={removeVideo}
                    className="text-[11px] font-semibold text-red-600 border border-red-200 rounded-[8px] px-2.5 py-1">
                    {t('common:common.button.remove')}
                  </button>
                )}
              </div>
            ) : canEditMedia ? (
              <>
                <input ref={videoInputRef} type="file" accept="video/*" className="hidden"
                  onChange={(e) => { if (e.target.files?.[0]) handleVideoFile(e.target.files[0]); }} />
                <button type="button" onClick={() => videoInputRef.current?.click()} disabled={videoUploading}
                  className="w-full h-[50px] border-2 border-dashed border-gray-300 rounded-[12px] flex items-center justify-center gap-2 text-[13px] font-semibold text-gray-500 disabled:opacity-50 bg-gray-50">
                  {videoUploading ? <span className="animate-pulse text-forest">{t('seller.editListing.media.uploadingVideo')}</span> : (
                    <><PlusIcon className="w-4 h-4" />{t('seller.editListing.media.addVideo', { min: MIN_VIDEO_DURATION_SECONDS })}</>
                  )}
                </button>
              </>
            ) : (
              <div className="bg-gray-50 border border-gray-200 rounded-[12px] px-4 py-3 text-center">
                <p className="text-[12px] text-gray-400">{t('seller.editListing.media.noVideoUploaded')}</p>
              </div>
            )}
          </div>

          {mediaError && (
            <p className="text-[12px] text-red-600 font-medium bg-red-50 border border-red-200 rounded-[10px] px-3 py-2.5">
              {mediaError}
            </p>
          )}

          {/* Submit / action */}
          {actionError && (
            <p className="text-[12px] text-red-600 font-medium bg-red-50 border border-red-200 rounded-[10px] px-3 py-2.5">
              {actionError}
            </p>
          )}

          {canSubmit && (
            <button type="button" onClick={handleSubmit} disabled={submitLoading}
              className="w-full h-[52px] bg-forest text-white rounded-[13px] text-[15px] font-bold disabled:opacity-50">
              {submitLoading ? t('seller.editListing.submitting') : t('seller.editListing.submitForReview')}
            </button>
          )}

          {canSubmitForReview && !mediaGatePassed && (
            <div className="bg-forest-bg border border-forest-bdr rounded-[12px] px-3.5 py-3">
              <p className="text-[11.5px] font-semibold text-forest">
                {video
                  ? t('seller.editListing.media.addMorePhotosOnly', { count: Math.max(0, MIN_LISTING_PHOTOS - photos.length) })
                  : t('seller.editListing.media.addMorePhotosAndVideo', { count: Math.max(0, MIN_LISTING_PHOTOS - photos.length) })}
              </p>
            </div>
          )}

          {listing.status === ListingStatus.ACTIVE && canEditMedia && (
            <>
              <div className="h-px bg-gray-200" />
              <button type="button" onClick={() => setWithdrawConfirmOpen(true)} disabled={withdrawLoading}
                className="w-full h-[50px] bg-white border border-red-200 text-red-600 rounded-[13px] text-[14px] font-bold disabled:opacity-50">
                {withdrawLoading ? t('seller.editListing.withdrawing') : t('seller.editListing.withdrawListing')}
              </button>
            </>
          )}

          {listing.status === ListingStatus.ACTIVE && (
            <button type="button" onClick={() => navigate(`/listings/${id}`)}
              className="w-full h-[44px] border border-gray-200 rounded-[13px] text-[13px] font-semibold text-gray-600 bg-white">
              {t('seller.editListing.viewPublicListing')}
            </button>
          )}
        </div>
      )}

      {id && <BoostSheet listingId={id} open={boostOpen} onClose={() => setBoostOpen(false)} />}
      <WithdrawConfirmSheet
        open={withdrawConfirmOpen}
        loading={withdrawLoading}
        onConfirm={handleWithdraw}
        onClose={() => setWithdrawConfirmOpen(false)}
      />
    </AppLayout>
  );
}
