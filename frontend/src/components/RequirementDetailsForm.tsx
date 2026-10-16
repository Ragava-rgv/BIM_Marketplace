import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { CategoryGroupDto, CategorySpecTemplateDto } from '../shared';
import { MACHINE_CATEGORIES } from '../shared';
import { api } from '../lib/api';
import { Button, Field, Input, Select, Textarea } from './ui';
import { DynamicSpecFields } from './DynamicSpecFields';
import { INDIA_STATES, INDIA_STATES_AND_CITIES } from '../lib/india-locations';
import { IMPORT_COUNTRIES } from '../lib/countries';
import { scrollToFirstError, useFieldRefs } from '../lib/form-errors';

const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: CURRENT_YEAR - 1950 + 1 }, (_, i) => CURRENT_YEAR - i);

export interface RequirementDetailsValues {
  title: string;
  description: string;
  machineCategory: string;
  machineSubcategory: string;
  manufactureYear: string;
  origin: '' | 'INDIAN' | 'IMPORTED';
  importedCountry: string;
  condition: '' | 'OLD' | 'NEW';
  complexityTier: 'SIMPLE' | 'STANDARD' | 'COMPLEX';
  runningHours: string;
  catalogCategoryId: string;
  specs: Record<string, string>;
  budgetMin: string;
  budgetMax: string;
  quantity: string;
  locationCity: string;
  locationState: string;
}

export const EMPTY_REQUIREMENT_DETAILS: RequirementDetailsValues = {
  title: '',
  description: '',
  machineCategory: '',
  machineSubcategory: '',
  manufactureYear: '',
  origin: '',
  importedCountry: '',
  condition: '',
  complexityTier: 'STANDARD',
  runningHours: '',
  catalogCategoryId: '',
  specs: {},
  budgetMin: '',
  budgetMax: '',
  quantity: '1',
  locationCity: '',
  locationState: '',
};

export function requirementDetailsToPayload(values: RequirementDetailsValues) {
  return {
    title: values.title,
    description: values.description,
    machineCategory: values.machineCategory,
    machineSubcategory: values.machineSubcategory || undefined,
    manufactureYear: values.manufactureYear ? Number(values.manufactureYear) : null,
    origin: values.origin || undefined,
    importedCountry: values.origin === 'IMPORTED' ? values.importedCountry || undefined : undefined,
    condition: values.condition || undefined,
    complexityTier: values.complexityTier,
    runningHours: values.runningHours ? Number(values.runningHours) : null,
    catalogCategoryId: values.catalogCategoryId || undefined,
    specs: values.catalogCategoryId && Object.keys(values.specs).length > 0 ? values.specs : undefined,
    budgetMin: values.budgetMin ? Number(values.budgetMin) : undefined,
    budgetMax: values.budgetMax ? Number(values.budgetMax) : undefined,
    quantity: values.quantity ? Number(values.quantity) : undefined,
    locationCity: values.locationCity || undefined,
    locationState: values.locationState || undefined,
  };
}

export function RequirementDetailsForm({
  initial,
  submitLabel,
  onSubmit,
  submitting,
}: {
  initial: RequirementDetailsValues;
  submitLabel: string;
  submitting: boolean;
  onSubmit: (values: RequirementDetailsValues) => void | Promise<void>;
}) {
  const { t } = useTranslation();
  const [values, setValues] = useState(initial);
  const [catGroups, setCatGroups] = useState<CategoryGroupDto[]>([]);
  const [specFields, setSpecFields] = useState<CategorySpecTemplateDto[]>([]);
  const [attempted, setAttempted] = useState(false);
  const { refs, setFieldRef } = useFieldRefs<HTMLElement>();

  const set = <K extends keyof RequirementDetailsValues>(key: K, value: RequirementDetailsValues[K]) =>
    setValues((prev) => ({ ...prev, [key]: value }));

  useEffect(() => {
    api.get<CategoryGroupDto[]>('/category-groups').then(({ data }) => setCatGroups(data)).catch(() => {});
  }, []);

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

  const handleStateChange = (state: string) => setValues((prev) => ({ ...prev, locationState: state, locationCity: '' }));
  const handleCategoryChange = (cat: string) => setValues((prev) => ({ ...prev, machineCategory: cat, machineSubcategory: '' }));
  const handleCatalogCatChange = (id: string) => setValues((prev) => ({ ...prev, catalogCategoryId: id, specs: {} }));
  const handleSpecChange = (key: string, value: string) => setValues((prev) => ({ ...prev, specs: { ...prev.specs, [key]: value } }));

  const titleValid = values.title.trim().length >= 5;
  const descriptionValid = values.description.trim().length >= 20;
  const originValid = values.origin !== 'IMPORTED' || values.importedCountry.trim() !== '';
  const budgetValid = !values.budgetMin || !values.budgetMax || Number(values.budgetMin) <= Number(values.budgetMax);

  const requiredSpecs = specFields.filter((f) => f.isRequired);
  const specsValid = requiredSpecs.every((f) => (values.specs[f.fieldKey] ?? '').trim() !== '');

  const valid = titleValid && descriptionValid && values.machineCategory.trim() && originValid && budgetValid && specsValid;

  const fieldOrder = ['title', 'description', 'machineCategory', 'importedCountry', 'budgetMax'];
  const fieldErrors: Record<string, string | false> = {
    title: !titleValid && t('components.listingDetailsForm.errors.titleTooShort', { count: values.title.trim().length }),
    description: !descriptionValid && t('components.listingDetailsForm.errors.descriptionTooShort', { count: values.description.trim().length }),
    machineCategory: !values.machineCategory.trim() && t('components.listingDetailsForm.errors.machineCategoryRequired'),
    importedCountry: !originValid && t('components.listingDetailsForm.errors.importedCountryRequired'),
    budgetMax: !budgetValid && t('components.requirementDetailsForm.errors.budgetRangeInvalid'),
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
      <Field label={t('components.requirementDetailsForm.titleLabel')} hint={t('components.requirementDetailsForm.titleHint')}>
        <Input
          ref={setFieldRef('title')}
          value={values.title}
          onChange={(e) => set('title', e.target.value)}
          placeholder={t('components.requirementDetailsForm.titlePlaceholder')}
          required
          minLength={5}
          maxLength={160}
        />
      </Field>

      <Field label={t('components.requirementDetailsForm.descriptionLabel')}>
        <Textarea
          ref={setFieldRef('description')}
          rows={5}
          value={values.description}
          onChange={(e) => set('description', e.target.value)}
          placeholder={t('components.requirementDetailsForm.descriptionPlaceholder')}
          required
          minLength={20}
          maxLength={5000}
        />
      </Field>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Field label={t('components.listingDetailsForm.machineCategoryLabel')}>
          <Select ref={setFieldRef('machineCategory')} value={values.machineCategory} onChange={(e) => handleCategoryChange(e.target.value)} required>
            <option value="">{t('components.listingDetailsForm.selectCategory')}</option>
            {MACHINE_CATEGORIES.map((cat) => (
              <option key={cat.id} value={cat.label}>{cat.label}</option>
            ))}
          </Select>
        </Field>
        <Field label={t('components.listingDetailsForm.subcategoryLabel')} hint={t('components.listingDetailsForm.subcategoryHint')}>
          <Select value={values.machineSubcategory} onChange={(e) => set('machineSubcategory', e.target.value)} disabled={subcategories.length === 0}>
            <option value="">{subcategories.length ? t('components.listingDetailsForm.selectSubcategory') : t('components.listingDetailsForm.selectCategoryFirst')}</option>
            {subcategories.map((sub) => (
              <option key={sub} value={sub}>{sub}</option>
            ))}
          </Select>
        </Field>
        <Field label={t('components.listingDetailsForm.yearBoughtLabel')} hint={t('components.requirementDetailsForm.yearHint')}>
          <Select value={values.manufactureYear} onChange={(e) => set('manufactureYear', e.target.value)}>
            <option value="">{t('components.requirementDetailsForm.anyYear')}</option>
            {YEAR_OPTIONS.map((year) => (
              <option key={year} value={year}>{year}</option>
            ))}
          </Select>
        </Field>
        <Field label={t('components.listingDetailsForm.makeOriginLabel')}>
          <Select value={values.origin} onChange={(e) => set('origin', e.target.value as RequirementDetailsValues['origin'])}>
            <option value="">{t('components.requirementDetailsForm.anyOrigin')}</option>
            <option value="INDIAN">{t('components.listingDetailsForm.originIndian')}</option>
            <option value="IMPORTED">{t('components.listingDetailsForm.originImported')}</option>
          </Select>
        </Field>
        <Field label={t('common:listing.condition')}>
          <Select value={values.condition} onChange={(e) => set('condition', e.target.value as RequirementDetailsValues['condition'])}>
            <option value="">{t('components.requirementDetailsForm.anyCondition')}</option>
            <option value="OLD">{t('common:listing.conditionOld')}</option>
            <option value="NEW">{t('common:listing.conditionNew')}</option>
          </Select>
        </Field>
        {values.origin === 'IMPORTED' && (
          <Field label={t('components.listingDetailsForm.countryOfImportLabel')}>
            <Select ref={setFieldRef('importedCountry')} value={values.importedCountry} onChange={(e) => set('importedCountry', e.target.value)} required>
              <option value="">{t('components.listingDetailsForm.selectCountry')}</option>
              {IMPORT_COUNTRIES.map((country) => (
                <option key={country} value={country}>{country}</option>
              ))}
            </Select>
          </Field>
        )}
        <Field label={t('components.requirementDetailsForm.quantityLabel')}>
          <Input type="number" min={1} value={values.quantity} onChange={(e) => set('quantity', e.target.value)} />
        </Field>
        <Field label={t('components.requirementDetailsForm.budgetMinLabel')}>
          <Input type="text" inputMode="numeric" value={values.budgetMin ? Number(values.budgetMin).toLocaleString('en-IN') : ''} onChange={(e) => set('budgetMin', e.target.value.replace(/[^0-9]/g, ''))} placeholder={t('components.requirementDetailsForm.budgetPlaceholder')} />
        </Field>
        <Field label={t('components.requirementDetailsForm.budgetMaxLabel')}>
          <Input ref={setFieldRef('budgetMax')} type="text" inputMode="numeric" value={values.budgetMax ? Number(values.budgetMax).toLocaleString('en-IN') : ''} onChange={(e) => set('budgetMax', e.target.value.replace(/[^0-9]/g, ''))} placeholder={t('components.requirementDetailsForm.budgetPlaceholder')} />
        </Field>
        <Field label={t('components.listingDetailsForm.stateLabel')} hint={t('components.requirementDetailsForm.locationHint')}>
          <Select value={values.locationState} onChange={(e) => handleStateChange(e.target.value)}>
            <option value="">{t('components.requirementDetailsForm.anyState')}</option>
            {INDIA_STATES.map((state) => (
              <option key={state} value={state}>{state}</option>
            ))}
          </Select>
        </Field>
        <Field label={t('components.listingDetailsForm.cityLabel')}>
          <Select value={values.locationCity} onChange={(e) => set('locationCity', e.target.value)} disabled={!values.locationState}>
            <option value="">{values.locationState ? t('components.listingDetailsForm.selectCity') : t('components.listingDetailsForm.selectStateFirst')}</option>
            {cities.map((city) => (
              <option key={city} value={city}>{city}</option>
            ))}
          </Select>
        </Field>
      </div>

      {catGroups.length > 0 && (
        <div className="rounded-xl border border-line bg-navy/[.02] p-5 space-y-4">
          <div>
            <p className="text-sm font-bold text-ink mb-0.5">{t('components.listingDetailsForm.specTemplateHeading')}</p>
            <p className="text-[12.5px] text-muted leading-relaxed">{t('components.listingDetailsForm.specTemplateDescription')}</p>
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
            <DynamicSpecFields fields={specFields} values={values.specs} onChange={handleSpecChange} />
          )}

          {values.catalogCategoryId && (
            <Field label={t('components.listingDetailsForm.runningHoursLabel')} hint={t('components.requirementDetailsForm.runningHoursHint')}>
              <Input type="number" min={0} value={values.runningHours} onChange={(e) => set('runningHours', e.target.value)} placeholder={t('components.listingDetailsForm.runningHoursPlaceholder')} />
            </Field>
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
