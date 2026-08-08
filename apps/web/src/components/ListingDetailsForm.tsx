import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { CategoryGroupDto, CategorySpecTemplateDto } from '@machinebazaar/shared';
import { MACHINE_CATEGORIES } from '@machinebazaar/shared';
import { api } from '../lib/api';
import { Button, Field, Input, Select, Textarea } from './ui';
import { DynamicSpecFields } from './DynamicSpecFields';
import { INDIA_STATES, INDIA_STATES_AND_CITIES } from '../lib/india-locations';
import { IMPORT_COUNTRIES } from '../lib/countries';
import { scrollToFirstError, useFieldRefs } from '../lib/form-errors';

const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: CURRENT_YEAR - 1950 + 1 }, (_, i) => CURRENT_YEAR - i);

export interface ListingDetailsValues {
  title: string;
  description: string;
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
  complexityTier: 'SIMPLE' | 'STANDARD' | 'COMPLEX';
  condition: 'OLD' | 'NEW';
  // Catalog system
  catalogCategoryId: string;
  specs: Record<string, string>;
  conditionGrade: string;
  runningHours: string;
  negotiable: boolean;
}

export const EMPTY_LISTING_DETAILS: ListingDetailsValues = {
  title: '',
  description: '',
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
  complexityTier: 'STANDARD',
  condition: 'OLD',
  catalogCategoryId: '',
  specs: {},
  conditionGrade: '',
  runningHours: '',
  negotiable: false,
};

export function listingDetailsToPayload(values: ListingDetailsValues) {
  return {
    title: values.title,
    description: values.description,
    machineCategory: values.machineCategory,
    machineSubcategory: values.machineSubcategory || undefined,
    machineMake: values.machineMake,
    machineModel: values.machineModel,
    // Explicit null (not undefined) so clearing the field on an edit actually clears it, not just skips the update.
    manufactureYear: values.manufactureYear ? Number(values.manufactureYear) : null,
    origin: values.origin,
    importedCountry: values.origin === 'IMPORTED' ? values.importedCountry || undefined : undefined,
    askingPrice: Number(values.askingPrice),
    locationCity: values.locationCity,
    locationState: values.locationState,
    complexityTier: values.complexityTier,
    condition: values.condition,
    catalogCategoryId: values.catalogCategoryId || undefined,
    specs: values.catalogCategoryId && Object.keys(values.specs).length > 0 ? values.specs : undefined,
    conditionGrade: values.conditionGrade || undefined,
    runningHours: values.runningHours ? Number(values.runningHours) : null,
    negotiable: values.negotiable,
  };
}

export function ListingDetailsForm({
  initial,
  submitLabel,
  onSubmit,
  submitting,
}: {
  initial: ListingDetailsValues;
  submitLabel: string;
  submitting: boolean;
  onSubmit: (values: ListingDetailsValues) => void | Promise<void>;
}) {
  const { t } = useTranslation();
  const [values, setValues] = useState(initial);
  const [catGroups, setCatGroups] = useState<CategoryGroupDto[]>([]);
  const [specFields, setSpecFields] = useState<CategorySpecTemplateDto[]>([]);
  const [runningHoursNA, setRunningHoursNA] = useState(initial.runningHours === '');
  const [attempted, setAttempted] = useState(false);
  const { refs, setFieldRef } = useFieldRefs<HTMLElement>();

  const set = <K extends keyof ListingDetailsValues>(key: K, value: ListingDetailsValues[K]) =>
    setValues((prev) => ({ ...prev, [key]: value }));

  // Load catalog category groups once
  useEffect(() => {
    api.get<CategoryGroupDto[]>('/category-groups').then(({ data }) => setCatGroups(data)).catch(() => {});
  }, []);

  // When catalog category changes, fetch its spec template
  useEffect(() => {
    if (!values.catalogCategoryId) { setSpecFields([]); return; }
    api
      .get<{ specFields: CategorySpecTemplateDto[] }>(`/categories/${values.catalogCategoryId}/spec-template`)
      .then(({ data }) => setSpecFields(data.specFields ?? []))
      .catch(() => setSpecFields([]));
  }, [values.catalogCategoryId]);

  const cities = values.locationState ? INDIA_STATES_AND_CITIES[values.locationState] ?? [] : [];
  const selectedLegacyCat = MACHINE_CATEGORIES.find((c) => c.label === values.machineCategory);
  const subcategories = ((selectedLegacyCat as unknown) as { subcategories?: string[] })?.subcategories ?? [];

  const handleStateChange = (state: string) => {
    setValues((prev) => ({ ...prev, locationState: state, locationCity: '' }));
  };

  const handleCategoryChange = (cat: string) => {
    setValues((prev) => ({ ...prev, machineCategory: cat, machineSubcategory: '' }));
  };

  const handleCatalogCatChange = (id: string) => {
    setValues((prev) => ({ ...prev, catalogCategoryId: id, specs: {} }));
  };

  const handleSpecChange = (key: string, value: string) => {
    setValues((prev) => ({ ...prev, specs: { ...prev.specs, [key]: value } }));
  };

  const titleValid = values.title.trim().length >= 5;
  const descriptionValid = values.description.trim().length >= 20;
  const priceValid = Number(values.askingPrice) > 0;
  const originValid = values.origin !== 'IMPORTED' || values.importedCountry.trim() !== '';

  // Required spec fields must be filled
  const requiredSpecs = specFields.filter((f) => f.isRequired);
  const specsValid = requiredSpecs.every((f) => (values.specs[f.fieldKey] ?? '').trim() !== '');

  const valid =
    titleValid &&
    descriptionValid &&
    values.machineCategory.trim() &&
    values.machineMake.trim() &&
    values.machineModel.trim() &&
    values.locationCity.trim() &&
    values.locationState.trim() &&
    priceValid &&
    originValid &&
    specsValid;

  // Field-keyed errors, in the same order the fields appear on screen — drives both
  // the summary banner and scrollToFirstError (which jumps to the first key with both
  // a truthy error and a registered ref).
  const fieldOrder = ['title', 'description', 'machineCategory', 'machineMake', 'machineModel', 'importedCountry', 'askingPrice', 'locationState', 'locationCity'];
  const fieldErrors: Record<string, string | false> = {
    title: !titleValid && t('components.listingDetailsForm.errors.titleTooShort', { count: values.title.trim().length }),
    description: !descriptionValid && t('components.listingDetailsForm.errors.descriptionTooShort', { count: values.description.trim().length }),
    machineCategory: !values.machineCategory.trim() && t('components.listingDetailsForm.errors.machineCategoryRequired'),
    machineMake: !values.machineMake.trim() && t('components.listingDetailsForm.errors.makeRequired'),
    machineModel: !values.machineModel.trim() && t('components.listingDetailsForm.errors.modelRequired'),
    askingPrice: !priceValid && t('components.listingDetailsForm.errors.askingPriceRequired'),
    importedCountry: !originValid && t('components.listingDetailsForm.errors.importedCountryRequired'),
    locationState: !values.locationState.trim() && t('components.listingDetailsForm.errors.stateRequired'),
    locationCity: !values.locationCity.trim() && t('components.listingDetailsForm.errors.cityRequired'),
  };
  const missing = Object.values(fieldErrors).filter((v): v is string => !!v);
  requiredSpecs.forEach((f) => {
    if (!(values.specs[f.fieldKey] ?? '').trim()) missing.push(t('components.listingDetailsForm.errors.specFieldRequired', { field: f.fieldLabel }));
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setAttempted(true);
        if (valid) {
          void onSubmit(values);
        } else {
          scrollToFirstError(fieldOrder, fieldErrors, refs);
        }
      }}
      className="space-y-5"
    >
      <Field label={t('components.listingDetailsForm.titleLabel')} hint={t('components.listingDetailsForm.titleHint')}>
        <Input
          ref={setFieldRef('title')}
          value={values.title}
          onChange={(e) => set('title', e.target.value)}
          placeholder={t('components.listingDetailsForm.titlePlaceholder')}
          required
          minLength={5}
          maxLength={160}
        />
      </Field>

      <Field label={t('components.listingDetailsForm.descriptionLabel')}>
        <Textarea
          ref={setFieldRef('description')}
          rows={5}
          value={values.description}
          onChange={(e) => set('description', e.target.value)}
          placeholder={t('components.listingDetailsForm.descriptionPlaceholder')}
          required
          minLength={20}
          maxLength={5000}
        />
      </Field>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Field label={t('components.listingDetailsForm.machineCategoryLabel')}>
          <Select
            ref={setFieldRef('machineCategory')}
            value={values.machineCategory}
            onChange={(e) => handleCategoryChange(e.target.value)}
            required
          >
            <option value="">{t('components.listingDetailsForm.selectCategory')}</option>
            {MACHINE_CATEGORIES.map((cat) => (
              <option key={cat.id} value={cat.label}>
                {cat.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={t('components.listingDetailsForm.subcategoryLabel')} hint={t('components.listingDetailsForm.subcategoryHint')}>
          <Select
            value={values.machineSubcategory}
            onChange={(e) => set('machineSubcategory', e.target.value)}
            disabled={subcategories.length === 0}
          >
            <option value="">{subcategories.length ? t('components.listingDetailsForm.selectSubcategory') : t('components.listingDetailsForm.selectCategoryFirst')}</option>
            {subcategories.map((sub) => (
              <option key={sub} value={sub}>
                {sub}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={t('components.listingDetailsForm.complexityTierLabel')} hint={t('components.listingDetailsForm.complexityTierHint')}>
          <Select value={values.complexityTier} onChange={(e) => set('complexityTier', e.target.value as ListingDetailsValues['complexityTier'])}>
            <option value="SIMPLE">{t('components.listingDetailsForm.tierSimple')}</option>
            <option value="STANDARD">{t('components.listingDetailsForm.tierStandard')}</option>
            <option value="COMPLEX">{t('components.listingDetailsForm.tierComplex')}</option>
          </Select>
        </Field>
        <Field label={t('components.listingDetailsForm.makeLabel')}>
          <Input ref={setFieldRef('machineMake')} value={values.machineMake} onChange={(e) => set('machineMake', e.target.value)} placeholder={t('components.listingDetailsForm.makePlaceholder')} required />
        </Field>
        <Field label={t('components.listingDetailsForm.modelLabel')}>
          <Input ref={setFieldRef('machineModel')} value={values.machineModel} onChange={(e) => set('machineModel', e.target.value)} placeholder={t('components.listingDetailsForm.modelPlaceholder')} required />
        </Field>
        <Field label={t('components.listingDetailsForm.yearBoughtLabel')} hint={t('components.listingDetailsForm.yearBoughtHint')}>
          <Select value={values.manufactureYear} onChange={(e) => set('manufactureYear', e.target.value)}>
            <option value="">{t('common:common.label.notAvailable')}</option>
            {YEAR_OPTIONS.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={t('components.listingDetailsForm.makeOriginLabel')}>
          <Select
            value={values.origin}
            onChange={(e) => set('origin', e.target.value as ListingDetailsValues['origin'])}
            required
          >
            <option value="INDIAN">{t('components.listingDetailsForm.originIndian')}</option>
            <option value="IMPORTED">{t('components.listingDetailsForm.originImported')}</option>
          </Select>
        </Field>
        <Field label={t('common:listing.condition')}>
          <Select
            value={values.condition}
            onChange={(e) => set('condition', e.target.value as ListingDetailsValues['condition'])}
            required
          >
            <option value="OLD">{t('common:listing.conditionOld')}</option>
            <option value="NEW">{t('common:listing.conditionNew')}</option>
          </Select>
        </Field>
        {values.origin === 'IMPORTED' && (
          <Field label={t('components.listingDetailsForm.countryOfImportLabel')}>
            <Select ref={setFieldRef('importedCountry')} value={values.importedCountry} onChange={(e) => set('importedCountry', e.target.value)} required>
              <option value="">{t('components.listingDetailsForm.selectCountry')}</option>
              {IMPORT_COUNTRIES.map((country) => (
                <option key={country} value={country}>
                  {country}
                </option>
              ))}
            </Select>
          </Field>
        )}
        <Field label={t('components.listingDetailsForm.askingPriceLabel')}>
          <Input
            ref={setFieldRef('askingPrice')}
            type="text"
            inputMode="numeric"
            value={values.askingPrice ? Number(values.askingPrice).toLocaleString('en-IN') : ''}
            onChange={(e) => set('askingPrice', e.target.value.replace(/[^0-9]/g, ''))}
            placeholder={t('components.listingDetailsForm.askingPricePlaceholder')}
            required
          />
        </Field>
        <Field label={t('components.listingDetailsForm.stateLabel')}>
          <Select ref={setFieldRef('locationState')} value={values.locationState} onChange={(e) => handleStateChange(e.target.value)} required>
            <option value="">{t('components.listingDetailsForm.selectState')}</option>
            {INDIA_STATES.map((state) => (
              <option key={state} value={state}>
                {state}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={t('components.listingDetailsForm.cityLabel')}>
          <Select ref={setFieldRef('locationCity')} value={values.locationCity} onChange={(e) => set('locationCity', e.target.value)} required disabled={!values.locationState}>
            <option value="">{values.locationState ? t('components.listingDetailsForm.selectCity') : t('components.listingDetailsForm.selectStateFirst')}</option>
            {cities.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      {/* Catalog spec section — shown when catalog groups are loaded */}
      {catGroups.length > 0 && (
        <div className="rounded-xl border border-line bg-navy/[.02] p-5 space-y-4">
          <div>
            <p className="text-sm font-bold text-ink mb-0.5">{t('components.listingDetailsForm.specTemplateHeading')}</p>
            <p className="text-[12.5px] text-muted leading-relaxed">
              {t('components.listingDetailsForm.specTemplateDescription')}
            </p>
          </div>
          <Field label={t('components.listingDetailsForm.catalogCategoryLabel')}>
            <Select value={values.catalogCategoryId} onChange={(e) => handleCatalogCatChange(e.target.value)}>
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

          {specFields.length > 0 && (
            <DynamicSpecFields
              fields={specFields}
              values={values.specs}
              onChange={handleSpecChange}
            />
          )}

          {/* Extra shared fields for catalog listings */}
          {values.catalogCategoryId && (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <Field label={t('components.listingDetailsForm.conditionGradeLabel')} hint={t('components.listingDetailsForm.conditionGradeHint')}>
                <Select value={values.conditionGrade} onChange={(e) => set('conditionGrade', e.target.value)}>
                  <option value="">{t('components.listingDetailsForm.selectEllipsis')}</option>
                  <option value="A">{t('components.listingDetailsForm.gradeAExcellent')}</option>
                  <option value="B">{t('components.listingDetailsForm.gradeBGood')}</option>
                  <option value="C">{t('components.listingDetailsForm.gradeCFair')}</option>
                </Select>
              </Field>
              <Field label={t('components.listingDetailsForm.runningHoursLabel')} hint={t('components.listingDetailsForm.runningHoursHint')}>
                <div className="space-y-2">
                  <Input
                    type="number"
                    min={0}
                    value={values.runningHours}
                    onChange={(e) => set('runningHours', e.target.value)}
                    placeholder={t('components.listingDetailsForm.runningHoursPlaceholder')}
                    disabled={runningHoursNA}
                  />
                  <label className="flex items-center gap-2 text-[12.5px] font-medium text-muted cursor-pointer">
                    <input
                      type="checkbox"
                      checked={runningHoursNA}
                      onChange={(e) => {
                        setRunningHoursNA(e.target.checked);
                        if (e.target.checked) set('runningHours', '');
                      }}
                      className="h-3.5 w-3.5 rounded border-line text-forest focus:ring-forest/30"
                    />
                    {t('common:common.label.notAvailable')}
                  </label>
                </div>
              </Field>
              <div className="flex items-end pb-1">
                <label className="flex items-center gap-2 text-sm font-semibold text-ink cursor-pointer">
                  <input
                    type="checkbox"
                    checked={values.negotiable}
                    onChange={(e) => set('negotiable', e.target.checked)}
                    className="h-4 w-4 rounded border-line text-forest focus:ring-forest/30"
                  />
                  {t('components.listingDetailsForm.priceNegotiable')}
                </label>
              </div>
            </div>
          )}
        </div>
      )}

      {attempted && !valid && missing.length > 0 && (
        <div className="rounded-[10px] border border-copper-bdr bg-copper-bg p-4">
          <p className="text-[12.5px] font-bold text-copper-2">{t('components.listingDetailsForm.beforeYouContinue')}</p>
          <ul className="mt-1.5 list-inside list-disc space-y-0.5 text-[12.5px] text-copper-2">
            {missing.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      )}

      <Button type="submit" disabled={!valid || submitting}>
        {submitting ? t('components.listingDetailsForm.saving') : submitLabel}
      </Button>
    </form>
  );
}
