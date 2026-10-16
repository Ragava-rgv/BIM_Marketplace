import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  MACHINE_CATEGORIES,
  MIN_LISTING_PHOTOS,
  MAX_LISTING_PHOTOS,
  MIN_VIDEO_DURATION_SECONDS,
} from '../../shared';
import type { CategoryGroupDto, CategorySpecTemplateDto, ListingDto, ListingMediaDto } from '../../shared';
import { api, apiErrorMessage } from '../../lib/api';
import { AppLayout } from '../../components/AppLayout';
import { ArrowDownIcon, ArrowUpIcon, CheckIcon, ChevronRightIcon, PlusIcon, StarIcon } from '../../components/icons';
import { INDIA_STATES, INDIA_STATES_AND_CITIES } from '../../lib/india-locations';
import { scrollToFirstError, useFieldRefs } from '../../lib/form-errors';

const inputCls =
  'w-full h-[50px] bg-gray-50 border border-gray-200 rounded-[12px] px-4 text-[14px] text-ink font-medium placeholder-gray-400 outline-none focus:border-forest focus:bg-white transition';
const selectCls = inputCls + ' appearance-none pr-8';

function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-[11.5px] font-semibold text-gray-600 mb-1">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
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

interface FormData {
  title: string;
  machineCategory: string;
  machineSubcategory: string;
  machineMake: string;
  machineModel: string;
  manufactureYear: string;
  origin: 'INDIAN' | 'IMPORTED';
  importedCountry: string;
  askingPrice: string;
  locationCity: string;
  locationState: string;
  description: string;
  catalogCategoryId: string;
  specs: Record<string, string>;
  conditionGrade: string;
  condition: 'OLD' | 'NEW';
  runningHours: string;
  negotiable: boolean;
}

const EMPTY_FORM: FormData = {
  title: '',
  machineCategory: '',
  machineSubcategory: '',
  machineMake: '',
  machineModel: '',
  manufactureYear: '',
  origin: 'INDIAN',
  importedCountry: '',
  askingPrice: '',
  locationCity: '',
  locationState: '',
  description: '',
  catalogCategoryId: '',
  specs: {},
  conditionGrade: '',
  condition: 'OLD',
  runningHours: '',
  negotiable: false,
};

const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: CURRENT_YEAR - 1950 + 1 }, (_, i) => CURRENT_YEAR - i);
const IMPORT_COUNTRIES = [
  'China', 'Japan', 'South Korea', 'Germany', 'USA', 'Italy',
  'United Kingdom', 'France', 'Sweden', 'Taiwan', 'Singapore', 'UAE', 'Other',
];

interface UploadedPhoto {
  id: string;
  localUrl: string;
  isPrimary: boolean;
}

interface UploadedVideo {
  id: string;
  durationSeconds: number;
}

function getVideoDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    const url = URL.createObjectURL(file);
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      resolve(Math.round(video.duration));
    };
    video.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Cannot read video duration'));
    };
    video.src = url;
  });
}

function fmtDuration(secs: number) {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}m ${s}s`;
}

const STEPS = ['Details', 'Photos & Video', 'Review'] as const;

function StepBar({ current }: { current: 0 | 1 | 2 }) {
  const { t } = useTranslation();
  const stepLabels = t('seller.newListing.stepLabels', { returnObjects: true }) as unknown as string[];
  return (
    <div className="flex items-center px-4 py-3 gap-1 bg-white border-b border-gray-100">
      {STEPS.map((_, i) => (
        <div
          key={i}
          className={`flex items-center gap-1.5 ${i < STEPS.length - 1 ? 'flex-1' : ''}`}
        >
          <div
            className={`w-[22px] h-[22px] rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
              i < current
                ? 'bg-forest text-white'
                : i === current
                  ? 'bg-forest text-white ring-2 ring-forest/25'
                  : 'bg-gray-200 text-gray-500'
            }`}
          >
            {i < current ? <CheckIcon className="w-3 h-3" /> : i + 1}
          </div>
          <span
            className={`text-[11px] font-semibold shrink-0 ${
              i === current ? 'text-forest' : i < current ? 'text-forest/60' : 'text-gray-400'
            }`}
          >
            {stepLabels[i] ?? STEPS[i]}
          </span>
          {i < STEPS.length - 1 && (
            <div
              className={`flex-1 h-px mx-0.5 ${i < current ? 'bg-forest/40' : 'bg-gray-200'}`}
            />
          )}
        </div>
      ))}
    </div>
  );
}

export function NewListing() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [step, setStep] = useState<0 | 1 | 2 | 3>(0);

  // Catalog
  const [catGroups, setCatGroups] = useState<CategoryGroupDto[]>([]);
  const [specFields, setSpecFields] = useState<CategorySpecTemplateDto[]>([]);

  // Step 0
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [runningHoursNA, setRunningHoursNA] = useState(false);
  const [step1Loading, setStep1Loading] = useState(false);
  const [step1Error, setStep1Error] = useState<string | null>(null);
  const { refs: fieldRefs, setFieldRef } = useFieldRefs<HTMLElement>();

  useEffect(() => {
    api.get<CategoryGroupDto[]>('/category-groups').then(({ data }) => setCatGroups(data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!form.catalogCategoryId) { setSpecFields([]); return; }
    api
      .get<{ specFields: CategorySpecTemplateDto[] }>(`/categories/${form.catalogCategoryId}/spec-template`)
      .then(({ data }) => setSpecFields(data.specFields ?? []))
      .catch(() => setSpecFields([]));
  }, [form.catalogCategoryId]);

  // Listing created after step 0
  const [listing, setListing] = useState<ListingDto | null>(null);

  // Step 1 — media
  const [photos, setPhotos] = useState<UploadedPhoto[]>([]);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [video, setVideo] = useState<UploadedVideo | null>(null);
  const [videoUploading, setVideoUploading] = useState(false);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [reorderingId, setReorderingId] = useState<string | null>(null);
  const [primaryPending, setPrimaryPending] = useState<string | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  // Step 2
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const setField = (f: keyof FormData, v: string | boolean) => setForm((prev) => ({ ...prev, [f]: v }));
  const setSpec = (key: string, value: string) =>
    setForm((prev) => ({ ...prev, specs: { ...prev.specs, [key]: value } }));

  const selectedCat = MACHINE_CATEGORIES.find((c) => c.label === form.machineCategory);
  const subcategories = ((selectedCat as unknown) as { subcategories?: string[] })?.subcategories ?? [];
  const cities = form.locationState ? (INDIA_STATES_AND_CITIES[form.locationState] ?? []) : [];

  // â”€â”€ Step 0 submit â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  const detailsFieldOrder = [
    'title', 'machineCategory', 'machineMake', 'machineModel', 'importedCountry',
    'askingPrice', 'locationState', 'locationCity', 'description',
    ...specFields.filter((f) => f.isRequired).map((f) => f.fieldKey),
  ];

  const detailsFieldErrors = (): Record<string, string | false> => {
    const errors: Record<string, string | false> = {
      title: form.title.trim().length < 5 && t('seller.newListing.errors.titleTooShort'),
      machineCategory: !form.machineCategory && t('seller.newListing.errors.categoryRequired'),
      machineMake: !form.machineMake.trim() && t('seller.newListing.errors.makeRequired'),
      machineModel: !form.machineModel.trim() && t('seller.newListing.errors.modelRequired'),
      importedCountry: form.origin === 'IMPORTED' && !form.importedCountry && t('seller.newListing.errors.importedCountryRequired'),
      askingPrice: (!form.askingPrice || parseFloat(form.askingPrice) <= 0) && t('seller.newListing.errors.invalidPrice'),
      locationState: !form.locationState && t('seller.newListing.errors.stateRequired'),
      locationCity: !form.locationCity && t('seller.newListing.errors.cityRequired'),
      description: form.description.trim().length < 20 && t('seller.newListing.errors.descriptionTooShort'),
    };
    for (const f of specFields.filter((sf) => sf.isRequired)) {
      errors[f.fieldKey] = !(form.specs[f.fieldKey] ?? '').trim() && t('seller.newListing.errors.specFieldRequired', { field: f.fieldLabel });
    }
    return errors;
  };

  const handleDetailsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const fieldErrors = detailsFieldErrors();
    if (Object.values(fieldErrors).some(Boolean)) {
      setStep1Error(t('seller.newListing.errors.fixHighlightedFields'));
      scrollToFirstError(detailsFieldOrder, fieldErrors, fieldRefs);
      return;
    }
    setStep1Loading(true);
    setStep1Error(null);
    try {
      const { data } = await api.post<ListingDto>('/listings', {
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
        ...(form.catalogCategoryId ? { catalogCategoryId: form.catalogCategoryId } : {}),
        ...(form.catalogCategoryId && Object.keys(form.specs).length > 0 ? { specs: form.specs } : {}),
        ...(form.conditionGrade ? { conditionGrade: form.conditionGrade } : {}),
        runningHours: form.runningHours ? parseInt(form.runningHours, 10) : null,
        negotiable: form.negotiable,
      });
      setListing(data);
      setStep(1);
    } catch (err) {
      setStep1Error(apiErrorMessage(err, t('seller.newListing.errors.createFailed')));
    } finally {
      setStep1Loading(false);
    }
  };

  // â”€â”€ Photo upload â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  const handlePhotoFiles = async (files: FileList) => {
    if (!listing) return;
    const remaining = MAX_LISTING_PHOTOS - photos.length;
    if (remaining <= 0) {
      setMediaError(t('seller.newListing.errors.maxPhotosUploaded', { count: MAX_LISTING_PHOTOS }));
      return;
    }
    const toUpload = Array.from(files).slice(0, remaining);
    setPhotoUploading(true);
    setMediaError(null);
    const added: UploadedPhoto[] = [];
    for (const file of toUpload) {
      try {
        const localUrl = URL.createObjectURL(file);
        const fd = new FormData();
        fd.append('file', file);
        fd.append('type', 'PHOTO');
        fd.append('capturedAt', new Date().toISOString());
        const { data } = await api.post<ListingMediaDto>(
          `/listings/${listing.id}/media`,
          fd,
          { headers: { 'Content-Type': 'multipart/form-data' } },
        );
        added.push({ id: data.id, localUrl, isPrimary: data.isPrimary });
      } catch (err) {
        setMediaError(apiErrorMessage(err, t('seller.newListing.errors.photoUploadFailed')));
        break;
      }
    }
    if (added.length) setPhotos((p) => [...p, ...added]);
    setPhotoUploading(false);
    if (photoInputRef.current) photoInputRef.current.value = '';
  };

  const removePhoto = async (photo: UploadedPhoto) => {
    if (!listing) return;
    try {
      await api.delete(`/listings/${listing.id}/media/${photo.id}`);
      URL.revokeObjectURL(photo.localUrl);
      setPhotos((p) => p.filter((ph) => ph.id !== photo.id));
    } catch (err) {
      setMediaError(apiErrorMessage(err, t('seller.newListing.errors.removePhotoFailed')));
    }
  };

  const handleMovePhoto = async (photoId: string, direction: -1 | 1) => {
    if (!listing) return;
    const index = photos.findIndex((p) => p.id === photoId);
    const swapIndex = index + direction;
    if (index === -1 || swapIndex < 0 || swapIndex >= photos.length) return;

    const reordered = [...photos];
    [reordered[index], reordered[swapIndex]] = [reordered[swapIndex], reordered[index]];

    setMediaError(null);
    setReorderingId(photoId);
    try {
      const { data } = await api.patch<ListingMediaDto[]>(`/listings/${listing.id}/media/reorder`, {
        mediaIds: reordered.map((p) => p.id),
      });
      setPhotos((prev) =>
        data
          .filter((m) => m.type === 'PHOTO')
          .map((m) => ({ id: m.id, isPrimary: m.isPrimary, localUrl: prev.find((p) => p.id === m.id)?.localUrl ?? m.url })),
      );
    } catch (err) {
      setMediaError(apiErrorMessage(err, t('seller.newListing.errors.reorderPhotosFailed')));
    } finally {
      setReorderingId(null);
    }
  };

  const handleSetPrimary = async (photoId: string) => {
    if (!listing) return;
    setMediaError(null);
    setPrimaryPending(photoId);
    try {
      const { data } = await api.patch<ListingMediaDto[]>(`/listings/${listing.id}/media/${photoId}/primary`);
      setPhotos((prev) =>
        data
          .filter((m) => m.type === 'PHOTO')
          .map((m) => ({ id: m.id, isPrimary: m.isPrimary, localUrl: prev.find((p) => p.id === m.id)?.localUrl ?? m.url })),
      );
    } catch (err) {
      setMediaError(apiErrorMessage(err, t('seller.newListing.errors.setPrimaryFailed')));
    } finally {
      setPrimaryPending(null);
    }
  };

  // â”€â”€ Video upload â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  const handleVideoFile = async (file: File) => {
    if (!listing) return;
    setVideoUploading(true);
    setMediaError(null);
    try {
      let durationSeconds: number;
      try {
        durationSeconds = await getVideoDuration(file);
      } catch {
        setMediaError(t('seller.newListing.errors.videoDurationReadFailed'));
        setVideoUploading(false);
        if (videoInputRef.current) videoInputRef.current.value = '';
        return;
      }
      if (durationSeconds < MIN_VIDEO_DURATION_SECONDS) {
        setMediaError(
          t('seller.newListing.errors.videoTooShort', { min: MIN_VIDEO_DURATION_SECONDS, actual: fmtDuration(durationSeconds) }),
        );
        setVideoUploading(false);
        if (videoInputRef.current) videoInputRef.current.value = '';
        return;
      }
      const fd = new FormData();
      fd.append('file', file);
      fd.append('type', 'VIDEO');
      fd.append('durationSeconds', String(durationSeconds));
      const { data } = await api.post<{ id: string }>(
        `/listings/${listing.id}/media`,
        fd,
        { headers: { 'Content-Type': 'multipart/form-data' } },
      );
      setVideo({ id: data.id, durationSeconds });
    } catch (err) {
      setMediaError(apiErrorMessage(err, t('seller.newListing.errors.videoUploadFailed')));
    } finally {
      setVideoUploading(false);
      if (videoInputRef.current) videoInputRef.current.value = '';
    }
  };

  const removeVideo = async () => {
    if (!listing || !video) return;
    try {
      await api.delete(`/listings/${listing.id}/media/${video.id}`);
      setVideo(null);
    } catch (err) {
      setMediaError(apiErrorMessage(err, t('seller.newListing.errors.removeVideoFailed')));
    }
  };

  const mediaGatePassed =
    photos.length >= MIN_LISTING_PHOTOS &&
    photos.length <= MAX_LISTING_PHOTOS &&
    video !== null;

  // â”€â”€ Step 2: submit listing â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  const handleSubmit = async () => {
    if (!listing) return;
    setSubmitLoading(true);
    setSubmitError(null);
    try {
      await api.post(`/listings/${listing.id}/submit`);
      setStep(3);
    } catch (err) {
      setSubmitError(apiErrorMessage(err, t('seller.newListing.errors.submitFailed')));
      setSubmitLoading(false);
    }
  };

  // â”€â”€ Success screen â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  if (step === 3) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center min-h-[75vh] px-6 text-center">
          <div className="w-16 h-16 rounded-full bg-forest/10 flex items-center justify-center mb-5">
            <CheckIcon className="w-8 h-8 text-forest" />
          </div>
          <h2 className="text-[22px] font-extrabold text-ink tracking-[-0.5px]">
            {t('seller.newListing.success.title')}
          </h2>
          <p className="mt-2.5 text-[13px] text-gray-500 leading-relaxed max-w-xs">
            {t('seller.newListing.success.description')}
          </p>
          <button
            onClick={() => navigate('/seller/listings', { replace: true })}
            className="mt-8 w-full max-w-xs h-[52px] bg-forest text-white rounded-[13px] text-[15px] font-bold"
          >
            {t('seller.newListing.success.viewListingsButton')}
          </button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      {/* â”€â”€ Header â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="bg-white border-b border-gray-200 px-4 pt-4 pb-3 flex items-center gap-3">
        <button
          onClick={() => {
            if (step === 0) navigate(-1);
            else if (step === 1) navigate('/seller/listings');
            else setStep(1);
          }}
          className="w-8 h-8 flex items-center justify-center flex-shrink-0"
        >
          <ChevronRightIcon className="w-4 h-4 text-gray-500 rotate-180" />
        </button>
        <div>
          <h1 className="text-[17px] font-extrabold text-ink tracking-[-0.3px]">{t('seller.newListing.title')}</h1>
          <p className="text-[11px] text-gray-500">
            {t('seller.newListing.stepIndicator', {
              current: (step as number) + 1,
              label: (t('seller.newListing.stepLabels', { returnObjects: true }) as unknown as string[])[step as number] ?? STEPS[step as number],
            })}
          </p>
        </div>
      </div>

      <StepBar current={step as 0 | 1 | 2} />

      {/* â”€â”€ Step 0: Details â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {step === 0 && (
        <form onSubmit={handleDetailsSubmit} className="px-4 pt-4 pb-6 space-y-4">
          <Field
            label={t('seller.newListing.fields.title')}
            required
            hint={t('seller.newListing.fields.titleHint')}
          >
            <input
              ref={setFieldRef('title')}
              value={form.title}
              onChange={(e) => setField('title', e.target.value)}
              placeholder={t('seller.newListing.fields.titlePlaceholder')}
              className={inputCls}
              minLength={5}
              maxLength={160}
            />
          </Field>

          <Field label={t('seller.newListing.fields.category')} required>
            <SelectWrapper>
              <select
                ref={setFieldRef('machineCategory')}
                value={form.machineCategory}
                onChange={(e) => {
                  setField('machineCategory', e.target.value);
                  setField('machineSubcategory', '');
                }}
                className={selectCls}
              >
                <option value="">{t('seller.newListing.fields.categoryPlaceholder')}</option>
                {MACHINE_CATEGORIES.map((c) => (
                  <option key={c.id} value={c.label}>
                    {t(`common:taxonomy.category.${c.id}.label`, c.label)}
                  </option>
                ))}
              </select>
            </SelectWrapper>
          </Field>

          {subcategories.length > 0 && (
            <Field label={t('seller.newListing.fields.subcategory')} hint={t('seller.newListing.fields.subcategoryHint')}>
              <SelectWrapper>
                <select
                  value={form.machineSubcategory}
                  onChange={(e) => setField('machineSubcategory', e.target.value)}
                  className={selectCls}
                >
                  <option value="">{t('seller.newListing.fields.subcategoryPlaceholder')}</option>
                  {subcategories.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </SelectWrapper>
            </Field>
          )}

          {/* â”€â”€ Catalog spec category + dynamic fields â”€â”€ */}
          {catGroups.length > 0 && (
            <div className="bg-gray-50 rounded-[14px] border border-gray-200 p-4 space-y-3">
              <div>
                <p className="text-[12.5px] font-bold text-ink mb-0.5">{t('seller.newListing.specTemplate.title')}</p>
                <p className="text-[11px] text-gray-500">
                  {t('seller.newListing.specTemplate.description')}
                </p>
              </div>
              <Field label={t('seller.newListing.specTemplate.catalogCategoryLabel')}>
                <SelectWrapper>
                  <select
                    value={form.catalogCategoryId}
                    onChange={(e) => {
                      setField('catalogCategoryId', e.target.value);
                      setForm((prev) => ({ ...prev, specs: {} }));
                    }}
                    className={selectCls}
                  >
                    <option value="">{t('seller.newListing.specTemplate.noneOption')}</option>
                    {catGroups.map((group) => (
                      <optgroup key={group.id} label={group.name}>
                        {group.categories.map((cat) => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </SelectWrapper>
              </Field>

              {specFields.map((f) => (
                <Field key={f.id} label={f.unit ? `${f.fieldLabel} (${f.unit})` : f.fieldLabel} required={f.isRequired} hint={f.helpText ?? undefined}>
                  {f.fieldType === 'select' || f.fieldType === 'boolean' ? (
                    <SelectWrapper>
                      <select
                        ref={setFieldRef(f.fieldKey)}
                        value={form.specs[f.fieldKey] ?? ''}
                        onChange={(e) => setSpec(f.fieldKey, e.target.value)}
                        className={selectCls}
                        required={f.isRequired}
                      >
                        <option value="">{t('seller.newListing.specTemplate.selectPlaceholder')}</option>
                        {f.fieldType === 'boolean'
                          ? ['true', 'false'].map((v) => <option key={v} value={v}>{v === 'true' ? t('common:common.label.yes') : t('common:common.label.no')}</option>)
                          : f.options.map((o) => <option key={o} value={o}>{o}</option>)
                        }
                      </select>
                    </SelectWrapper>
                  ) : (
                    <input
                      ref={setFieldRef(f.fieldKey)}
                      type={f.fieldType === 'number' ? 'number' : 'text'}
                      value={form.specs[f.fieldKey] ?? ''}
                      onChange={(e) => setSpec(f.fieldKey, e.target.value)}
                      className={inputCls}
                      required={f.isRequired}
                      min={f.fieldType === 'number' ? 0 : undefined}
                    />
                  )}
                </Field>
              ))}

              {form.catalogCategoryId && (
                <div className="grid grid-cols-2 gap-3">
                  <Field label={t('seller.newListing.specTemplate.conditionGrade')} hint={t('seller.newListing.specTemplate.conditionGradeHint')}>
                    <SelectWrapper>
                      <select value={form.conditionGrade} onChange={(e) => setField('conditionGrade', e.target.value)} className={selectCls}>
                        <option value="">{t('seller.newListing.specTemplate.selectPlaceholder')}</option>
                        {['A', 'B', 'C'].map((g) => <option key={g} value={g}>{g}</option>)}
                      </select>
                    </SelectWrapper>
                  </Field>
                  <Field label={t('seller.newListing.specTemplate.runningHours')}>
                    <input
                      type="number"
                      min={0}
                      value={form.runningHours}
                      onChange={(e) => setField('runningHours', e.target.value)}
                      placeholder={t('seller.newListing.fields.runningHoursPlaceholder')}
                      disabled={runningHoursNA}
                      className={inputCls}
                    />
                    <label className="mt-1.5 flex items-center gap-1.5 text-[11.5px] font-medium text-gray-500">
                      <input
                        type="checkbox"
                        checked={runningHoursNA}
                        onChange={(e) => {
                          setRunningHoursNA(e.target.checked);
                          if (e.target.checked) setField('runningHours', '');
                        }}
                        className="h-3.5 w-3.5 rounded"
                      />
                      {t('common:common.label.notAvailable')}
                    </label>
                  </Field>
                  <div className="flex items-end pb-1">
                    <label className="flex items-center gap-2 text-[12.5px] font-semibold text-ink">
                      <input
                        type="checkbox"
                        checked={form.negotiable}
                        onChange={(e) => setForm((prev) => ({ ...prev, negotiable: e.target.checked }))}
                        className="h-4 w-4 rounded"
                      />
                      {t('seller.newListing.specTemplate.negotiable')}
                    </label>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Field label={t('seller.newListing.fields.make')} required>
              <input
                ref={setFieldRef('machineMake')}
                value={form.machineMake}
                onChange={(e) => setField('machineMake', e.target.value)}
                placeholder={t('seller.newListing.fields.makePlaceholder')}
                className={inputCls}
              />
            </Field>
            <Field label={t('seller.newListing.fields.model')} required>
              <input
                ref={setFieldRef('machineModel')}
                value={form.machineModel}
                onChange={(e) => setField('machineModel', e.target.value)}
                placeholder={t('seller.newListing.fields.modelPlaceholder')}
                className={inputCls}
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label={t('seller.newListing.fields.yearBought')} hint={t('seller.newListing.fields.yearBoughtHint')}>
              <SelectWrapper>
                <select
                  value={form.manufactureYear}
                  onChange={(e) => setField('manufactureYear', e.target.value)}
                  className={selectCls}
                >
                  <option value="">{t('common:common.label.notAvailable')}</option>
                  {YEAR_OPTIONS.map((year) => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </SelectWrapper>
            </Field>
            <Field label={t('seller.newListing.fields.origin')} required>
              <SelectWrapper>
                <select
                  value={form.origin}
                  onChange={(e) => setField('origin', e.target.value as FormData['origin'])}
                  className={selectCls}
                >
                  <option value="INDIAN">{t('seller.newListing.origin.indian')}</option>
                  <option value="IMPORTED">{t('seller.newListing.origin.imported')}</option>
                </select>
              </SelectWrapper>
            </Field>
            <Field label={t('common:listing.condition')} required>
              <SelectWrapper>
                <select
                  value={form.condition}
                  onChange={(e) => setField('condition', e.target.value as FormData['condition'])}
                  className={selectCls}
                >
                  <option value="OLD">{t('common:listing.conditionOld')}</option>
                  <option value="NEW">{t('common:listing.conditionNew')}</option>
                </select>
              </SelectWrapper>
            </Field>
          </div>

          {form.origin === 'IMPORTED' && (
            <Field label={t('seller.newListing.fields.importedCountry')} required>
              <SelectWrapper>
                <select
                  ref={setFieldRef('importedCountry')}
                  value={form.importedCountry}
                  onChange={(e) => setField('importedCountry', e.target.value)}
                  className={selectCls}
                >
                  <option value="">{t('seller.newListing.fields.importedCountryPlaceholder')}</option>
                  {IMPORT_COUNTRIES.map((country) => (
                    <option key={country} value={country}>{country}</option>
                  ))}
                </select>
              </SelectWrapper>
            </Field>
          )}

          <Field label={t('seller.newListing.fields.price')} required>
            <input
              ref={setFieldRef('askingPrice')}
              type="text"
              inputMode="numeric"
              value={form.askingPrice ? Number(form.askingPrice).toLocaleString('en-IN') : ''}
              onChange={(e) => setField('askingPrice', e.target.value.replace(/[^0-9]/g, ''))}
              placeholder={t('seller.newListing.fields.pricePlaceholder')}
              className={inputCls}
            />
          </Field>

          <Field label={t('seller.newListing.fields.state')} required>
            <SelectWrapper>
              <select
                ref={setFieldRef('locationState')}
                value={form.locationState}
                onChange={(e) => {
                  setField('locationState', e.target.value);
                  setField('locationCity', '');
                }}
                className={selectCls}
              >
                <option value="">{t('seller.newListing.fields.statePlaceholder')}</option>
                {INDIA_STATES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </SelectWrapper>
          </Field>

          <Field
            label={t('seller.newListing.fields.city')}
            required
            hint={!form.locationState ? t('seller.newListing.fields.cityHint') : undefined}
          >
            <SelectWrapper>
              <select
                ref={setFieldRef('locationCity')}
                value={form.locationCity}
                onChange={(e) => setField('locationCity', e.target.value)}
                className={selectCls}
                disabled={!form.locationState}
              >
                <option value="">{t('seller.newListing.fields.cityPlaceholder')}</option>
                {cities.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </SelectWrapper>
          </Field>

          <Field
            label={t('seller.newListing.fields.description')}
            required
            hint={t('seller.newListing.fields.descriptionHint')}
          >
            <textarea
              ref={setFieldRef('description')}
              value={form.description}
              onChange={(e) => setField('description', e.target.value)}
              placeholder={t('seller.newListing.fields.descriptionPlaceholder')}
              rows={5}
              className="w-full bg-gray-50 border border-gray-200 rounded-[12px] px-4 py-3 text-[14px] text-ink font-medium placeholder-gray-400 outline-none focus:border-forest focus:bg-white transition resize-none"
            />
            <p
              className={`mt-1 text-[11px] text-right ${form.description.length < 20 ? 'text-gray-400' : 'text-green-txt'}`}
            >
              {t('seller.newListing.fields.descriptionCounter', { count: form.description.length })}
            </p>
          </Field>

          {step1Error && (
            <p className="text-[12.5px] text-red-600 font-medium bg-red-50 border border-red-200 rounded-[10px] px-3 py-2.5">
              {step1Error}
            </p>
          )}

          <button
            type="submit"
            disabled={step1Loading}
            className="w-full h-[52px] bg-forest text-white rounded-[13px] text-[15px] font-bold disabled:opacity-50"
          >
            {step1Loading ? t('seller.newListing.creatingDraft') : t('seller.newListing.nextAddMedia')}
          </button>
        </form>
      )}

      {/* â”€â”€ Step 1: Photos & Video â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {step === 1 && (
        <div className="px-4 pt-4 pb-6 space-y-5">
          {/* Gate status banner */}
          <div
            className={`rounded-[12px] px-3.5 py-3 border ${
              mediaGatePassed
                ? 'bg-green-bg border-green-bdr'
                : 'bg-copper-bg border-copper-bdr'
            }`}
          >
            <p
              className={`text-[12px] font-bold mb-1.5 ${mediaGatePassed ? 'text-green-txt' : 'text-copper'}`}
            >
              {mediaGatePassed ? t('seller.newListing.media.requirementsMet') : t('seller.newListing.media.requirementsTitle')}
            </p>
            <div className="space-y-1">
              <p
                className={`text-[11px] font-medium ${photos.length >= MIN_LISTING_PHOTOS ? 'text-green-txt' : 'text-copper'}`}
              >
                {photos.length >= MIN_LISTING_PHOTOS ? '✓' : '○'}{' '}
                {t('seller.newListing.media.photosLine', { count: photos.length, min: MIN_LISTING_PHOTOS, max: MAX_LISTING_PHOTOS })}
              </p>
              <p
                className={`text-[11px] font-medium ${video ? 'text-green-txt' : 'text-copper'}`}
              >
                {video ? '✓' : '○'}{' '}
                {video
                  ? t('seller.newListing.media.videoUploadedLine', { duration: fmtDuration(video.durationSeconds) })
                  : t('seller.newListing.media.videoRequiredLine', { min: MIN_VIDEO_DURATION_SECONDS })}
              </p>
            </div>
          </div>

          {/* Photos â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <p className="text-[13.5px] font-bold text-ink">{t('seller.newListing.media.machinePhotos')}</p>
              <span
                className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                  photos.length >= MIN_LISTING_PHOTOS
                    ? 'bg-green-bg text-green-txt'
                    : 'bg-gray-100 text-gray-500'
                }`}
              >
                {photos.length} / {MAX_LISTING_PHOTOS}
              </span>
            </div>

            {photos.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mb-3">
                {photos.map((photo, i) => (
                  <div
                    key={photo.id}
                    className="relative aspect-square rounded-[10px] overflow-hidden bg-gray-100"
                  >
                    <img
                      src={photo.localUrl}
                      alt={t('seller.newListing.media.photoAlt', { index: i + 1 })}
                      className="w-full h-full object-cover"
                    />

                    {photo.isPrimary && (
                      <span className="absolute left-1 top-1 flex items-center gap-0.5 rounded-[6px] bg-forest px-1.5 py-0.5 text-[8.5px] font-bold text-white">
                        <StarIcon className="w-2 h-2 fill-white stroke-white" />
                        {t('seller.newListing.media.primaryBadge')}
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={() => removePhoto(photo)}
                      className="absolute top-1 right-1 w-5 h-5 bg-black/55 rounded-full flex items-center justify-center text-white text-[13px] leading-none font-bold"
                    >
                      ×
                    </button>

                    <div className="absolute bottom-1 left-1 right-1 flex items-center justify-between gap-1">
                      {!photo.isPrimary ? (
                        <button
                          type="button"
                          onClick={() => handleSetPrimary(photo.id)}
                          disabled={primaryPending === photo.id}
                          className="flex h-6 w-6 items-center justify-center rounded-[6px] bg-white/85 text-ink disabled:opacity-50"
                          aria-label={t('seller.newListing.media.setPrimaryAriaLabel')}
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
                          aria-label={t('seller.newListing.media.moveEarlierAriaLabel')}
                        >
                          <ArrowUpIcon className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMovePhoto(photo.id, 1)}
                          disabled={reorderingId === photo.id || i === photos.length - 1}
                          className="flex h-6 w-6 items-center justify-center rounded-[6px] bg-white/85 text-ink disabled:opacity-40"
                          aria-label={t('seller.newListing.media.moveLaterAriaLabel')}
                        >
                          <ArrowDownIcon className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {photos.length < MAX_LISTING_PHOTOS && (
              <>
                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files?.length) handlePhotoFiles(e.target.files);
                  }}
                />
                <button
                  type="button"
                  onClick={() => photoInputRef.current?.click()}
                  disabled={photoUploading}
                  className="w-full h-[50px] border-2 border-dashed border-gray-300 rounded-[12px] flex items-center justify-center gap-2 text-[13px] font-semibold text-gray-500 disabled:opacity-50 bg-gray-50"
                >
                  {photoUploading ? (
                    <span className="animate-pulse text-forest">{t('seller.newListing.media.uploadingPhotos')}</span>
                  ) : (
                    <>
                      <PlusIcon className="w-4 h-4" />
                      {photos.length === 0
                        ? t('seller.newListing.media.addPhotosNeeded', { min: MIN_LISTING_PHOTOS, max: MAX_LISTING_PHOTOS })
                        : t('seller.newListing.media.addMorePhotos', { count: MAX_LISTING_PHOTOS - photos.length })}
                    </>
                  )}
                </button>
              </>
            )}
            <p className="mt-1.5 text-[11px] text-gray-400">
              {t('seller.newListing.media.photosHint')}
            </p>
          </div>

          {/* Video â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <p className="text-[13.5px] font-bold text-ink">{t('seller.newListing.media.runningVideo')}</p>
              <span
                className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                  video ? 'bg-green-bg text-green-txt' : 'bg-gray-100 text-gray-500'
                }`}
              >
                {video ? '1 / 1' : '0 / 1'}
              </span>
            </div>

            {video ? (
              <div className="bg-white border border-gray-200 rounded-[12px] px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="text-[13px] font-semibold text-ink">{t('seller.newListing.media.videoUploaded')}</p>
                  <p className="text-[11px] text-gray-500 mt-0.5">{fmtDuration(video.durationSeconds)}</p>
                </div>
                <button
                  type="button"
                  onClick={removeVideo}
                  className="text-[11px] font-semibold text-red-600 border border-red-200 rounded-[8px] px-2.5 py-1"
                >
                  {t('common:common.button.remove')}
                </button>
              </div>
            ) : (
              <>
                <input
                  ref={videoInputRef}
                  type="file"
                  accept="video/*"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files?.[0]) handleVideoFile(e.target.files[0]);
                  }}
                />
                <button
                  type="button"
                  onClick={() => videoInputRef.current?.click()}
                  disabled={videoUploading}
                  className="w-full h-[50px] border-2 border-dashed border-gray-300 rounded-[12px] flex items-center justify-center gap-2 text-[13px] font-semibold text-gray-500 disabled:opacity-50 bg-gray-50"
                >
                  {videoUploading ? (
                    <span className="animate-pulse text-forest">{t('seller.newListing.media.uploadingVideo')}</span>
                  ) : (
                    <>
                      <PlusIcon className="w-4 h-4" />
                      {t('seller.newListing.media.addVideo', { min: MIN_VIDEO_DURATION_SECONDS })}
                    </>
                  )}
                </button>
              </>
            )}
            <p className="mt-1.5 text-[11px] text-gray-400">
              {t('seller.newListing.media.videoHint')}
            </p>
          </div>

          {mediaError && (
            <p className="text-[12.5px] text-red-600 font-medium bg-red-50 border border-red-200 rounded-[10px] px-3 py-2.5">
              {mediaError}
            </p>
          )}

          <button
            type="button"
            onClick={() => {
              setMediaError(null);
              setStep(2);
            }}
            disabled={!mediaGatePassed || photoUploading || videoUploading}
            className="w-full h-[52px] bg-forest text-white rounded-[13px] text-[15px] font-bold disabled:opacity-50"
          >
            {t('seller.newListing.nextReview')}
          </button>
        </div>
      )}

      {/* â”€â”€ Step 2: Review â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {step === 2 && listing && (
        <div className="px-4 pt-4 pb-6 space-y-4">
          <p className="text-[12.5px] text-gray-500">
            {t('seller.newListing.review.intro')}
          </p>

          {/* Details summary */}
          <div className="bg-white border border-gray-200 rounded-[14px] overflow-hidden divide-y divide-gray-100">
            {(
              [
                [t('seller.newListing.review.labels.title'), listing.title],
                [
                  t('seller.newListing.review.labels.category'),
                  [listing.machineCategory, listing.machineSubcategory]
                    .filter(Boolean)
                    .join(' › '),
                ],
                [t('seller.newListing.review.labels.makeModel'), `${listing.machineMake} ${listing.machineModel}`],
                [t('seller.newListing.review.labels.year'), listing.manufactureYear != null ? String(listing.manufactureYear) : t('common:common.label.notAvailable')],
                [
                  t('seller.newListing.review.labels.origin'),
                  listing.origin === 'IMPORTED'
                    ? `${t('seller.newListing.origin.imported')}${listing.importedCountry ? ` (${listing.importedCountry})` : ''}`
                    : t('seller.newListing.origin.indian'),
                ],
                [
                  t('seller.newListing.review.labels.askingPrice'),
                  `₹ ${Number(listing.askingPrice).toLocaleString('en-IN')}`,
                ],
                [t('seller.newListing.review.labels.location'), `${listing.locationCity}, ${listing.locationState}`],
              ] as [string, string][]
            ).map(([label, value]) => (
              <div key={label} className="flex items-start gap-3 px-4 py-3">
                <p className="text-[11px] font-semibold text-gray-500 w-24 shrink-0 pt-0.5">
                  {label}
                </p>
                <p className="text-[13px] text-ink font-medium flex-1">{value}</p>
              </div>
            ))}
            <div className="flex items-start gap-3 px-4 py-3">
              <p className="text-[11px] font-semibold text-gray-500 w-24 shrink-0 pt-0.5">
                {t('seller.newListing.review.labels.media')}
              </p>
              <p className="text-[13px] text-ink font-medium flex-1">
                {t('seller.newListing.review.photoCount', { count: photos.length })} ·{' '}
                {video ? t('seller.newListing.review.videoWithDuration', { duration: fmtDuration(video.durationSeconds) }) : t('seller.newListing.review.videoNoDuration')}
              </p>
            </div>
          </div>

          {/* Description */}
          <div className="bg-white border border-gray-200 rounded-[14px] px-4 py-3">
            <p className="text-[11px] font-semibold text-gray-500 mb-1.5">{t('seller.newListing.review.descriptionLabel')}</p>
            <p className="text-[13px] text-ink font-medium leading-relaxed">
              {listing.description}
            </p>
          </div>

          {/* Notice */}
          <div className="bg-forest-bg border border-forest-bdr rounded-[12px] px-3.5 py-3">
            <p className="text-[12px] font-bold text-forest mb-0.5">{t('seller.newListing.review.pendingReviewTitle')}</p>
            <p className="text-[11px] text-forest/75">
              {t('seller.newListing.review.pendingReviewDescription')}
            </p>
          </div>

          {submitError && (
            <p className="text-[12.5px] text-red-600 font-medium bg-red-50 border border-red-200 rounded-[10px] px-3 py-2.5">
              {submitError}
            </p>
          )}

          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitLoading}
            className="w-full h-[52px] bg-forest text-white rounded-[13px] text-[15px] font-bold disabled:opacity-50"
          >
            {submitLoading ? t('seller.newListing.submitting') : t('seller.newListing.submitForReview')}
          </button>

          <button
            type="button"
            onClick={() => setStep(1)}
            className="w-full h-[44px] border border-gray-200 rounded-[13px] text-[13px] font-semibold text-gray-600 bg-white"
          >
            {t('seller.newListing.backToMedia')}
          </button>
        </div>
      )}
    </AppLayout>
  );
}


