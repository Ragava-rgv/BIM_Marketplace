import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  MACHINE_CATEGORIES,
  MIN_LISTING_PHOTOS,
  MAX_LISTING_PHOTOS,
  MIN_VIDEO_DURATION_SECONDS,
  ListingStatus,
  MediaType,
} from '@machinebazaar/shared';
import type { ListingDto, ListingMediaDto } from '@machinebazaar/shared';
import { api, apiErrorMessage } from '../../lib/api';
import { AppLayout } from '../../components/AppLayout';
import { CheckIcon, ChevronRightIcon, PlusIcon, MachineIcon } from '../../components/icons';
import { INDIA_STATES, INDIA_STATES_AND_CITIES } from '../../lib/india-locations';
import { formatInr } from '../../lib/format';

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
    manufactureYear: '', origin: 'INDIAN', importedCountry: '',
    askingPrice: '', locationCity: '', locationState: '', description: '',
  });
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Media state
  const [photos, setPhotos] = useState<ListingMediaDto[]>([]);
  const [video, setVideo] = useState<ListingMediaDto | null>(null);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [videoUploading, setVideoUploading] = useState(false);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  // Action states
  const [submitLoading, setSubmitLoading] = useState(false);
  const [withdrawLoading, setWithdrawLoading] = useState(false);
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

  const canEditDetails = listing?.status === ListingStatus.DRAFT || listing?.status === ListingStatus.REJECTED;
  const canEditMedia =
    listing?.status === ListingStatus.DRAFT ||
    listing?.status === ListingStatus.REJECTED ||
    listing?.status === ListingStatus.ACTIVE;
  const mediaGatePassed = photos.length >= MIN_LISTING_PHOTOS && photos.length <= MAX_LISTING_PHOTOS && video !== null;
  const canSubmit = canEditDetails && mediaGatePassed;

  // ── Save details ──────────────────────────────────────────────────────────

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
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
        askingPrice: parseFloat(form.askingPrice),
        locationCity: form.locationCity,
        locationState: form.locationState,
      });
      setListing(data);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setSaveError(apiErrorMessage(err, 'Failed to save changes.'));
    } finally {
      setSaveLoading(false);
    }
  };

  // ── Photo upload ──────────────────────────────────────────────────────────

  const handlePhotoFiles = async (files: FileList) => {
    if (!id) return;
    const remaining = MAX_LISTING_PHOTOS - photos.length;
    if (remaining <= 0) { setMediaError(`Maximum ${MAX_LISTING_PHOTOS} photos already uploaded.`); return; }
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
        setMediaError(apiErrorMessage(err, 'A photo failed to upload.'));
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
      setMediaError(apiErrorMessage(err, 'Could not remove photo.'));
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
      catch { setMediaError('Could not read video duration. Please choose a different file.'); setVideoUploading(false); return; }
      if (durationSeconds < MIN_VIDEO_DURATION_SECONDS) {
        setMediaError(`Video must be at least ${MIN_VIDEO_DURATION_SECONDS}s long (yours is ${fmtDuration(durationSeconds)}).`);
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
      setMediaError(apiErrorMessage(err, 'Video upload failed.'));
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
      setMediaError(apiErrorMessage(err, 'Could not remove video.'));
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
      setActionError(apiErrorMessage(err, 'Could not submit listing.'));
      setSubmitLoading(false);
    }
  };

  const handleWithdraw = async () => {
    if (!id) return;
    setWithdrawLoading(true);
    setActionError(null);
    try {
      await api.post(`/listings/${id}/withdraw`);
      navigate('/seller/listings', { replace: true });
    } catch (err) {
      setActionError(apiErrorMessage(err, 'Could not withdraw listing.'));
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
          <p className="text-[15px] font-bold text-ink mb-1">Listing not found</p>
          <p className="text-[12px] text-gray-500 mb-4">This listing doesn't exist or you don't have access to it.</p>
          <button onClick={() => navigate('/seller/listings')}
            className="bg-forest text-white text-[13px] font-bold px-5 py-2.5 rounded-[11px]">
            My Listings
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
              {listing.status.replace(/_/g, ' ')}
            </span>
            <p className="text-[10.5px] text-gray-400">{formatInr(listing.askingPrice)}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200 flex">
        {(['details', 'media'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-3 text-[12.5px] font-bold transition ${
              tab === t ? 'text-forest border-b-2 border-forest' : 'text-gray-500'
            }`}>
            {t === 'details' ? 'Details' : `Photos & Video`}
            {t === 'media' && (
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
                  <p className="text-[12px] font-bold text-red-600 mb-0.5">Listing was rejected</p>
                  <p className="text-[11px] text-red-500">
                    Fix the issues noted by our team, update your media, then re-submit.
                  </p>
                </div>
              )}

              <Field label="Listing title" required>
                <input value={form.title} onChange={(e) => setField('title', e.target.value)}
                  className={inputCls} minLength={5} maxLength={160} />
              </Field>

              <Field label="Machine category" required>
                <SelectWrapper>
                  <select value={form.machineCategory}
                    onChange={(e) => { setField('machineCategory', e.target.value); setField('machineSubcategory', ''); }}
                    className={selectCls}>
                    <option value="">Select category…</option>
                    {MACHINE_CATEGORIES.map((c) => <option key={c.id} value={c.label}>{c.label}</option>)}
                  </select>
                </SelectWrapper>
              </Field>

              {subcategories.length > 0 && (
                <Field label="Subcategory">
                  <SelectWrapper>
                    <select value={form.machineSubcategory}
                      onChange={(e) => setField('machineSubcategory', e.target.value)}
                      className={selectCls}>
                      <option value="">Select subcategory…</option>
                      {subcategories.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </SelectWrapper>
                </Field>
              )}

              <div className="grid grid-cols-2 gap-3">
                <Field label="Make" required>
                  <input value={form.machineMake} onChange={(e) => setField('machineMake', e.target.value)} className={inputCls} />
                </Field>
                <Field label="Model" required>
                  <input value={form.machineModel} onChange={(e) => setField('machineModel', e.target.value)} className={inputCls} />
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Year bought" hint="Leave as Not available if unknown">
                  <SelectWrapper>
                    <select value={form.manufactureYear} onChange={(e) => setField('manufactureYear', e.target.value)} className={selectCls}>
                      <option value="">Not available</option>
                      {EDIT_YEAR_OPTIONS.map((year) => <option key={year} value={year}>{year}</option>)}
                    </select>
                  </SelectWrapper>
                </Field>
                <Field label="Make origin" required>
                  <SelectWrapper>
                    <select value={form.origin} onChange={(e) => setField('origin', e.target.value)} className={selectCls}>
                      <option value="INDIAN">Indian</option>
                      <option value="IMPORTED">Imported</option>
                    </select>
                  </SelectWrapper>
                </Field>
              </div>

              {form.origin === 'IMPORTED' && (
                <Field label="Country of import" required>
                  <SelectWrapper>
                    <select value={form.importedCountry} onChange={(e) => setField('importedCountry', e.target.value)} className={selectCls}>
                      <option value="">Select country…</option>
                      {EDIT_IMPORT_COUNTRIES.map((country) => <option key={country} value={country}>{country}</option>)}
                    </select>
                  </SelectWrapper>
                </Field>
              )}

              <Field label="Price (₹)" required>
                <input
                  type="text"
                  inputMode="numeric"
                  value={form.askingPrice ? Number(form.askingPrice).toLocaleString('en-IN') : ''}
                  onChange={(e) => setField('askingPrice', e.target.value.replace(/[^0-9]/g, ''))}
                  className={inputCls}
                />
              </Field>

              <Field label="State" required>
                <SelectWrapper>
                  <select value={form.locationState}
                    onChange={(e) => { setField('locationState', e.target.value); setField('locationCity', ''); }}
                    className={selectCls}>
                    <option value="">Select state…</option>
                    {INDIA_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </SelectWrapper>
              </Field>

              <Field label="City" required>
                <SelectWrapper>
                  <select value={form.locationCity} onChange={(e) => setField('locationCity', e.target.value)}
                    className={selectCls} disabled={!form.locationState}>
                    <option value="">Select city…</option>
                    {cities.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </SelectWrapper>
              </Field>

              <Field label="Description" required>
                <textarea value={form.description} onChange={(e) => setField('description', e.target.value)}
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
                  Changes saved successfully.
                </p>
              )}

              <button type="submit" disabled={saveLoading}
                className="w-full h-[50px] bg-forest text-white rounded-[13px] text-[14.5px] font-bold disabled:opacity-50">
                {saveLoading ? 'Saving…' : 'Save changes'}
              </button>
            </form>
          ) : (
            /* Read-only summary */
            <div className="space-y-3">
              <div className="bg-white border border-gray-200 rounded-[13px] overflow-hidden divide-y divide-gray-100">
                {[
                  ['Title', listing.title],
                  ['Category', [listing.machineCategory, listing.machineSubcategory].filter(Boolean).join(' › ')],
                  ['Make / Model', `${listing.machineMake} ${listing.machineModel}`],
                  ['Year', listing.manufactureYear != null ? String(listing.manufactureYear) : 'Not available'],
                  [
                    'Origin',
                    listing.origin === 'IMPORTED'
                      ? `Imported${listing.importedCountry ? ` (${listing.importedCountry})` : ''}`
                      : 'Indian',
                  ],
                  ['Price', formatInr(listing.askingPrice)],
                  ['Location', `${listing.locationCity}, ${listing.locationState}`],
                ].map(([label, value]) => (
                  <div key={label} className="flex items-start gap-3 px-4 py-3">
                    <p className="text-[11px] font-semibold text-gray-500 w-24 shrink-0 pt-0.5">{label}</p>
                    <p className="text-[13px] text-ink font-medium flex-1">{value}</p>
                  </div>
                ))}
              </div>
              <div className="bg-white border border-gray-200 rounded-[13px] px-4 py-3">
                <p className="text-[11px] font-semibold text-gray-500 mb-1.5">Description</p>
                <p className="text-[13px] text-ink leading-relaxed">{listing.description}</p>
              </div>

              {listing.status === ListingStatus.ACTIVE && (
                <>
                  {actionError && (
                    <p className="text-[12px] text-red-600 font-medium bg-red-50 border border-red-200 rounded-[10px] px-3 py-2.5">
                      {actionError}
                    </p>
                  )}
                  <button onClick={handleWithdraw} disabled={withdrawLoading}
                    className="w-full h-[50px] bg-white border border-red-200 text-red-600 rounded-[13px] text-[14px] font-bold disabled:opacity-50">
                    {withdrawLoading ? 'Withdrawing…' : 'Withdraw listing'}
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
                Media cannot be changed while the listing is in {listing.status.replace(/_/g, ' ')} status.
              </p>
            </div>
          )}

          {/* Gate status */}
          <div className={`rounded-[12px] px-3.5 py-3 border ${mediaGatePassed ? 'bg-green-bg border-green-bdr' : 'bg-copper-bg border-copper-bdr'}`}>
            <p className={`text-[12px] font-bold mb-1.5 ${mediaGatePassed ? 'text-green-txt' : 'text-copper'}`}>
              {mediaGatePassed ? 'Media requirements met' : 'Media requirements'}
            </p>
            <p className={`text-[11px] font-medium ${photos.length >= MIN_LISTING_PHOTOS ? 'text-green-txt' : 'text-copper'}`}>
              {photos.length >= MIN_LISTING_PHOTOS ? '✓' : '○'} Photos: {photos.length} of {MIN_LISTING_PHOTOS}–{MAX_LISTING_PHOTOS} required
            </p>
            <p className={`text-[11px] font-medium mt-0.5 ${video ? 'text-green-txt' : 'text-copper'}`}>
              {video ? '✓' : '○'} Video: {video ? `Uploaded (${fmtDuration(video.durationSeconds ?? 0)})` : `1 video ≥ ${MIN_VIDEO_DURATION_SECONDS}s required`}
            </p>
          </div>

          {/* Photos */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <p className="text-[13.5px] font-bold text-ink">Machine photos</p>
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${photos.length >= MIN_LISTING_PHOTOS ? 'bg-green-bg text-green-txt' : 'bg-gray-100 text-gray-500'}`}>
                {photos.length} / {MAX_LISTING_PHOTOS}
              </span>
            </div>

            {photos.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mb-3">
                {photos.map((photo, i) => (
                  <div key={photo.id} className="relative aspect-square rounded-[10px] overflow-hidden bg-gray-100">
                    <img src={photo.url} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
                    {canEditMedia && (
                      <button type="button" onClick={() => removePhoto(photo)}
                        className="absolute top-1 right-1 w-5 h-5 bg-black/55 rounded-full flex items-center justify-center text-white text-[13px] font-bold">
                        ×
                      </button>
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
                  {photoUploading ? <span className="animate-pulse text-forest">Uploading…</span> : (
                    <><PlusIcon className="w-4 h-4" />Add photos</>
                  )}
                </button>
              </>
            )}
          </div>

          {/* Video */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <p className="text-[13.5px] font-bold text-ink">Running video</p>
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${video ? 'bg-green-bg text-green-txt' : 'bg-gray-100 text-gray-500'}`}>
                {video ? '1 / 1' : '0 / 1'}
              </span>
            </div>

            {video ? (
              <div className="bg-white border border-gray-200 rounded-[12px] px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="text-[13px] font-semibold text-ink">Video uploaded</p>
                  <p className="text-[11px] text-gray-500 mt-0.5">{fmtDuration(video.durationSeconds ?? 0)}</p>
                </div>
                {canEditMedia && (
                  <button type="button" onClick={removeVideo}
                    className="text-[11px] font-semibold text-red-600 border border-red-200 rounded-[8px] px-2.5 py-1">
                    Remove
                  </button>
                )}
              </div>
            ) : canEditMedia ? (
              <>
                <input ref={videoInputRef} type="file" accept="video/*" className="hidden"
                  onChange={(e) => { if (e.target.files?.[0]) handleVideoFile(e.target.files[0]); }} />
                <button type="button" onClick={() => videoInputRef.current?.click()} disabled={videoUploading}
                  className="w-full h-[50px] border-2 border-dashed border-gray-300 rounded-[12px] flex items-center justify-center gap-2 text-[13px] font-semibold text-gray-500 disabled:opacity-50 bg-gray-50">
                  {videoUploading ? <span className="animate-pulse text-forest">Uploading video…</span> : (
                    <><PlusIcon className="w-4 h-4" />Add video (min {MIN_VIDEO_DURATION_SECONDS}s)</>
                  )}
                </button>
              </>
            ) : (
              <div className="bg-gray-50 border border-gray-200 rounded-[12px] px-4 py-3 text-center">
                <p className="text-[12px] text-gray-400">No video uploaded</p>
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
              {submitLoading ? 'Submitting…' : 'Submit for Review →'}
            </button>
          )}

          {canEditDetails && !mediaGatePassed && (
            <div className="bg-forest-bg border border-forest-bdr rounded-[12px] px-3.5 py-3">
              <p className="text-[11.5px] font-semibold text-forest">
                Add {Math.max(0, MIN_LISTING_PHOTOS - photos.length)} more photo{Math.max(0, MIN_LISTING_PHOTOS - photos.length) !== 1 ? 's' : ''}
                {!video ? ' and a running video' : ''} to enable submission.
              </p>
            </div>
          )}

          {listing.status === ListingStatus.ACTIVE && canEditMedia && (
            <>
              <div className="h-px bg-gray-200" />
              <button type="button" onClick={handleWithdraw} disabled={withdrawLoading}
                className="w-full h-[50px] bg-white border border-red-200 text-red-600 rounded-[13px] text-[14px] font-bold disabled:opacity-50">
                {withdrawLoading ? 'Withdrawing…' : 'Withdraw listing'}
              </button>
            </>
          )}

          {listing.status === ListingStatus.ACTIVE && (
            <button type="button" onClick={() => navigate(`/listings/${id}`)}
              className="w-full h-[44px] border border-gray-200 rounded-[13px] text-[13px] font-semibold text-gray-600 bg-white">
              View public listing →
            </button>
          )}
        </div>
      )}
    </AppLayout>
  );
}
