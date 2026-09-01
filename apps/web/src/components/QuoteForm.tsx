import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { CategoryGroupDto, CategorySpecTemplateDto } from '@machinebazaar/shared';
import { api, apiErrorMessage } from '../lib/api';
import { useAuth } from '../lib/auth-context';
import { IMPORT_COUNTRIES } from '../lib/countries';
import { Button, ErrorBanner, Field, Input, MonoLabel, Select, SuccessBanner, Textarea } from './ui';
import { DynamicSpecFields } from './DynamicSpecFields';
import { CloseIcon, PhotoIcon } from './icons';

const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: CURRENT_YEAR - 1950 + 1 }, (_, i) => CURRENT_YEAR - i);
const MAX_PHOTOS = 16;
const MAX_PHOTO_BYTES = 10 * 1024 * 1024;

interface PhotoFile {
  file: File;
  previewUrl: string;
}

interface Props {
  requirementId: string;
  initialCatalogCategoryId: string | null;
  initialSpecFields: CategorySpecTemplateDto[];
  onSubmitted: () => void;
}

/** Full quote-submission form — reuses the same catalog category / spec-template system
    (category-groups → catalogCategoryId → DynamicSpecFields) as the seller "new listing"
    flow, so future spec-template changes propagate here automatically without redefining
    fields inline. Category/Type start pre-filled from the requirement but stay editable —
    a responder's matching machine may not sit in exactly the same catalog slot. */
export function QuoteForm({ requirementId, initialCatalogCategoryId, initialSpecFields, onSubmitted }: Props) {
  const { t } = useTranslation();
  const { user } = useAuth();

  const [contactName, setContactName] = useState(user?.fullName ?? '');
  const [contactPhone, setContactPhone] = useState(user?.phone ?? '');
  const [contactEmail, setContactEmail] = useState(user?.email ?? '');
  const [contactCompany, setContactCompany] = useState(user?.businessName ?? '');

  const [machineMake, setMachineMake] = useState('');
  const [machineModel, setMachineModel] = useState('');
  const [manufactureYear, setManufactureYear] = useState('');
  const [condition, setCondition] = useState<'' | 'OLD' | 'NEW'>('');
  const [origin, setOrigin] = useState<'' | 'INDIAN' | 'IMPORTED'>('');
  const [importedCountry, setImportedCountry] = useState('');
  const [price, setPrice] = useState('');
  const [machineLocation, setMachineLocation] = useState('');
  const [description, setDescription] = useState('');
  const [message, setMessage] = useState('');
  const [photos, setPhotos] = useState<PhotoFile[]>([]);

  const [catGroups, setCatGroups] = useState<CategoryGroupDto[]>([]);
  const [catalogCategoryId, setCatalogCategoryId] = useState(initialCatalogCategoryId ?? '');
  const [specFields, setSpecFields] = useState<CategorySpecTemplateDto[]>(initialSpecFields);
  const [specs, setSpecs] = useState<Record<string, string>>({});

  const [submitting, setSubmitting] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [quoteSent, setQuoteSent] = useState(false);

  useEffect(() => {
    api.get<CategoryGroupDto[]>('/category-groups').then(({ data }) => setCatGroups(data)).catch(() => {});
  }, []);

  // Re-fetch the spec template whenever the responder changes the category away from
  // whatever the requirement was pre-filled with — same pattern as RequirementDetailsForm.
  useEffect(() => {
    if (!catalogCategoryId || catalogCategoryId === initialCatalogCategoryId) return;
    api
      .get<{ specFields: CategorySpecTemplateDto[] }>(`/categories/${catalogCategoryId}/spec-template`)
      .then(({ data }) => setSpecFields(data.specFields ?? []))
      .catch(() => setSpecFields([]));
  }, [catalogCategoryId, initialCatalogCategoryId]);

  const selectedCategory = catGroups.flatMap((g) => g.categories).find((c) => c.id === catalogCategoryId);
  const selectedGroup = catGroups.find((g) => g.categories.some((c) => c.id === catalogCategoryId));

  const handleCatalogCategoryChange = (id: string) => {
    setCatalogCategoryId(id);
    setSpecs({});
  };

  const handleSpecChange = (key: string, value: string) => setSpecs((prev) => ({ ...prev, [key]: value }));

  const handleAddPhotos = (fileList: FileList | null) => {
    if (!fileList) return;
    const incoming = Array.from(fileList).slice(0, MAX_PHOTOS - photos.length);
    const valid: PhotoFile[] = incoming
      .filter((file) => file.type.startsWith('image/') && file.size <= MAX_PHOTO_BYTES)
      .map((file) => ({ file, previewUrl: URL.createObjectURL(file) }));
    setPhotos((prev) => [...prev, ...valid]);
  };

  const removePhoto = (idx: number) => {
    setPhotos((prev) => {
      URL.revokeObjectURL(prev[idx].previewUrl);
      return prev.filter((_, i) => i !== idx);
    });
  };

  const nameValid = contactName.trim().length >= 2;
  const phoneValid = /^[6-9]\d{9}$/.test(contactPhone.trim());
  const priceValid = price.trim() !== '' && Number(price) > 0;
  const locationValid = machineLocation.trim().length >= 2;
  const photosValid = photos.length >= 1;
  const originValid = origin !== 'IMPORTED' || importedCountry.trim() !== '';
  const requiredSpecs = specFields.filter((f) => f.isRequired);
  const specsValid = requiredSpecs.every((f) => (specs[f.fieldKey] ?? '').trim() !== '');

  const valid = nameValid && phoneValid && priceValid && locationValid && photosValid && originValid && specsValid;

  const submitQuote = async () => {
    setQuoteError(null);
    setSubmitting(true);
    try {
      const form = new FormData();
      form.append('contactName', contactName.trim());
      form.append('contactPhone', contactPhone.trim());
      if (contactEmail.trim()) form.append('contactEmail', contactEmail.trim());
      if (contactCompany.trim()) form.append('contactCompany', contactCompany.trim());
      if (catalogCategoryId) form.append('catalogCategoryId', catalogCategoryId);
      if (selectedCategory) form.append('machineCategory', selectedCategory.name);
      if (machineMake) form.append('machineMake', machineMake);
      if (machineModel) form.append('machineModel', machineModel);
      if (manufactureYear) form.append('manufactureYear', manufactureYear);
      if (origin) form.append('origin', origin);
      if (origin === 'IMPORTED' && importedCountry) form.append('importedCountry', importedCountry);
      if (condition) form.append('condition', condition);
      if (description) form.append('description', description);
      if (Object.keys(specs).length > 0) form.append('specs', JSON.stringify(specs));
      form.append('machineLocation', machineLocation);
      form.append('price', price);
      if (message) form.append('message', message);
      photos.forEach((p) => form.append('photos', p.file));

      await api.post(`/requirements/${requirementId}/quotes`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setQuoteSent(true);
      onSubmitted();
    } catch (err) {
      setQuoteError(apiErrorMessage(err, t('public.requirementDetail.errors.quoteFailed')));
    } finally {
      setSubmitting(false);
    }
  };

  if (quoteSent) {
    return <SuccessBanner message={t('public.requirementDetail.quoteSentNotice')} />;
  }

  return (
    <div className="space-y-6">
      {quoteError && <ErrorBanner message={quoteError} />}

      <div>
        <MonoLabel>{t('components.quoteForm.yourDetailsHeading')}</MonoLabel>
        <div className="mt-2.5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label={t('components.quoteForm.nameLabel')} required>
            <Input value={contactName} onChange={(e) => setContactName(e.target.value)} placeholder={t('components.quoteForm.namePlaceholder')} />
          </Field>
          <Field label={t('components.quoteForm.phoneLabel')} required>
            <Input value={contactPhone} onChange={(e) => setContactPhone(e.target.value.replace(/[^0-9]/g, '').slice(0, 10))} placeholder="98765 43210" />
          </Field>
          <Field label={t('components.quoteForm.emailLabel')}>
            <Input type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} placeholder="you@company.com" />
          </Field>
          <Field label={t('components.quoteForm.companyLabel')}>
            <Input value={contactCompany} onChange={(e) => setContactCompany(e.target.value)} placeholder={t('components.quoteForm.companyPlaceholder')} />
          </Field>
        </div>
      </div>

      <div>
        <MonoLabel>{t('components.quoteForm.theMachineHeading')}</MonoLabel>
        <div className="mt-2.5 grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Field label={t('components.quoteForm.askingPriceLabel')} hint={t('components.quoteForm.askingPriceHint')} required>
            <Input type="text" inputMode="numeric" value={price} onChange={(e) => setPrice(e.target.value.replace(/[^0-9]/g, ''))} placeholder="e.g. 1500000" />
          </Field>
          <Field label={t('components.quoteForm.machineLocationLabel')} hint={t('components.quoteForm.machineLocationHint')} required>
            <Input value={machineLocation} onChange={(e) => setMachineLocation(e.target.value)} placeholder={t('components.quoteForm.machineLocationPlaceholder')} />
          </Field>
          <Field label={t('components.listingDetailsForm.makeLabel')}>
            <Input value={machineMake} onChange={(e) => setMachineMake(e.target.value)} placeholder="e.g. Mazak, BFW, HMT" />
          </Field>
          <Field label={t('components.listingDetailsForm.modelLabel')}>
            <Input value={machineModel} onChange={(e) => setMachineModel(e.target.value)} placeholder="e.g. Quick Turn 250" />
          </Field>
          <Field label={t('components.listingDetailsForm.yearBoughtLabel')}>
            <Select value={manufactureYear} onChange={(e) => setManufactureYear(e.target.value)}>
              <option value="">—</option>
              {YEAR_OPTIONS.map((y) => <option key={y} value={y}>{y}</option>)}
            </Select>
          </Field>
          <Field label={t('common:listing.condition')}>
            <Select value={condition} onChange={(e) => setCondition(e.target.value as typeof condition)}>
              <option value="">{t('components.dynamicSpecFields.selectPlaceholder')}</option>
              <option value="OLD">{t('common:listing.conditionOld')}</option>
              <option value="NEW">{t('common:listing.conditionNew')}</option>
            </Select>
          </Field>
          <Field label={t('components.listingDetailsForm.makeOriginLabel')}>
            <Select value={origin} onChange={(e) => setOrigin(e.target.value as typeof origin)}>
              <option value="">{t('components.dynamicSpecFields.selectPlaceholder')}</option>
              <option value="INDIAN">{t('components.listingDetailsForm.originIndian')}</option>
              <option value="IMPORTED">{t('components.listingDetailsForm.originImported')}</option>
            </Select>
          </Field>
          {origin === 'IMPORTED' && (
            <Field label={t('components.listingDetailsForm.countryOfImportLabel')}>
              <Select value={importedCountry} onChange={(e) => setImportedCountry(e.target.value)}>
                <option value="">{t('components.listingDetailsForm.selectCountry')}</option>
                {IMPORT_COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </Select>
            </Field>
          )}
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 rounded-xl border border-line bg-paper p-4 text-sm sm:grid-cols-2">
          <div>
            <MonoLabel>{t('components.quoteForm.categoryLabel')}</MonoLabel>
            <p className="mt-0.5 font-medium text-ink">{selectedGroup?.name ?? '—'}</p>
            <p className="text-[11px] text-muted">{t('components.quoteForm.prefilled')}</p>
          </div>
          <Field label={t('components.quoteForm.subcategoryLabel')} hint={t('components.quoteForm.prefilled')}>
            <Select value={catalogCategoryId} onChange={(e) => handleCatalogCategoryChange(e.target.value)}>
              <option value="">{t('components.listingDetailsForm.catalogCategoryNone')}</option>
              {catGroups.map((group) => (
                <optgroup key={group.id} label={group.name}>
                  {group.categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </optgroup>
              ))}
            </Select>
          </Field>
        </div>
      </div>

      {specFields.length > 0 && (
        <DynamicSpecFields fields={specFields} values={specs} onChange={handleSpecChange} />
      )}

      <Field label={t('components.quoteForm.descriptionLabel')} hint={t('components.quoteForm.descriptionHint')}>
        <Textarea rows={4} value={description} onChange={(e) => setDescription(e.target.value.slice(0, 2000))} placeholder={t('components.quoteForm.descriptionPlaceholder')} />
        <p className="mt-1 text-right text-[11px] text-muted">{description.length}/2000</p>
      </Field>

      <div>
        <p className="text-sm font-semibold text-ink">{t('components.quoteForm.photosLabel')} *</p>
        <p className="mt-0.5 text-[12.5px] text-muted">{t('components.quoteForm.photosHint')}</p>
        <div className="mt-2.5 grid grid-cols-3 gap-2 sm:grid-cols-5">
          {photos.map((p, i) => (
            <div key={p.previewUrl} className="relative aspect-square overflow-hidden rounded-lg border border-line">
              <img src={p.previewUrl} alt="" className="h-full w-full object-cover" />
              <button type="button" onClick={() => removePhoto(i)} className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white">
                <CloseIcon className="h-3 w-3" />
              </button>
            </div>
          ))}
          {photos.length < MAX_PHOTOS && (
            <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-line text-center text-[11px] font-semibold text-muted transition hover:border-forest hover:text-forest">
              <PhotoIcon className="h-5 w-5" />
              {t('components.quoteForm.addPhotos')}
              <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => { handleAddPhotos(e.target.files); e.target.value = ''; }} />
            </label>
          )}
        </div>
        <p className="mt-1.5 font-mono text-[11px] text-muted">
          {t('components.quoteForm.photosCount', { count: photos.length, max: MAX_PHOTOS })}
          {photos.length === 0 && ` (${t('components.quoteForm.photosMoreRequired', { count: 1 })})`}
        </p>
      </div>

      <Field label={t('public.requirementDetail.messageLabel')}>
        <Textarea rows={3} value={message} onChange={(e) => setMessage(e.target.value)} />
      </Field>

      <Button onClick={submitQuote} disabled={submitting || !valid}>
        {submitting ? t('public.requirementDetail.sending') : t('public.requirementDetail.sendQuote')}
      </Button>
    </div>
  );
}
