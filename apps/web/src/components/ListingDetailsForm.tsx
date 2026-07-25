import { useEffect, useState } from 'react';
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
    title: !titleValid && `Title needs at least 5 characters (${values.title.trim().length}/5)`,
    description: !descriptionValid && `Description needs at least 20 characters (${values.description.trim().length}/20)`,
    machineCategory: !values.machineCategory.trim() && 'Machine category is required',
    machineMake: !values.machineMake.trim() && 'Make is required',
    machineModel: !values.machineModel.trim() && 'Model is required',
    askingPrice: !priceValid && 'Asking price must be greater than 0',
    importedCountry: !originValid && 'Country of import is required for imported machines',
    locationState: !values.locationState.trim() && 'State is required',
    locationCity: !values.locationCity.trim() && 'City is required',
  };
  const missing = Object.values(fieldErrors).filter((v): v is string => !!v);
  requiredSpecs.forEach((f) => {
    if (!(values.specs[f.fieldKey] ?? '').trim()) missing.push(`${f.fieldLabel} is required`);
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
      <Field label="Listing title" hint="Be specific — make, model and key spec helps buyers find you">
        <Input
          ref={setFieldRef('title')}
          value={values.title}
          onChange={(e) => set('title', e.target.value)}
          placeholder="2019 Hyundai R140 Excavator, well-maintained"
          required
          minLength={5}
          maxLength={160}
        />
      </Field>

      <Field label="Description">
        <Textarea
          ref={setFieldRef('description')}
          rows={5}
          value={values.description}
          onChange={(e) => set('description', e.target.value)}
          placeholder="Describe condition, usage history, recent maintenance, included accessories…"
          required
          minLength={20}
          maxLength={5000}
        />
      </Field>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Field label="Machine category">
          <Select
            ref={setFieldRef('machineCategory')}
            value={values.machineCategory}
            onChange={(e) => handleCategoryChange(e.target.value)}
            required
          >
            <option value="">Select a category</option>
            {MACHINE_CATEGORIES.map((cat) => (
              <option key={cat.id} value={cat.label}>
                {cat.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Subcategory" hint="Optional — helps buyers find your machine faster">
          <Select
            value={values.machineSubcategory}
            onChange={(e) => set('machineSubcategory', e.target.value)}
            disabled={subcategories.length === 0}
          >
            <option value="">{subcategories.length ? 'Select subcategory' : 'Select a category first'}</option>
            {subcategories.map((sub) => (
              <option key={sub} value={sub}>
                {sub}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Complexity tier" hint="Drives certification fee if a buyer applies for financing">
          <Select value={values.complexityTier} onChange={(e) => set('complexityTier', e.target.value as ListingDetailsValues['complexityTier'])}>
            <option value="SIMPLE">Simple</option>
            <option value="STANDARD">Standard</option>
            <option value="COMPLEX">Complex</option>
          </Select>
        </Field>
        <Field label="Make">
          <Input ref={setFieldRef('machineMake')} value={values.machineMake} onChange={(e) => set('machineMake', e.target.value)} placeholder="Hyundai" required />
        </Field>
        <Field label="Model">
          <Input ref={setFieldRef('machineModel')} value={values.machineModel} onChange={(e) => set('machineModel', e.target.value)} placeholder="R140LC-9" required />
        </Field>
        <Field label="Year bought" hint="Leave as “Not available” if unknown">
          <Select value={values.manufactureYear} onChange={(e) => set('manufactureYear', e.target.value)}>
            <option value="">Not available</option>
            {YEAR_OPTIONS.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Make origin">
          <Select
            value={values.origin}
            onChange={(e) => set('origin', e.target.value as ListingDetailsValues['origin'])}
            required
          >
            <option value="INDIAN">Indian</option>
            <option value="IMPORTED">Imported</option>
          </Select>
        </Field>
        {values.origin === 'IMPORTED' && (
          <Field label="Country of import">
            <Select ref={setFieldRef('importedCountry')} value={values.importedCountry} onChange={(e) => set('importedCountry', e.target.value)} required>
              <option value="">Select country</option>
              {IMPORT_COUNTRIES.map((country) => (
                <option key={country} value={country}>
                  {country}
                </option>
              ))}
            </Select>
          </Field>
        )}
        <Field label="Asking price (₹)">
          <Input
            ref={setFieldRef('askingPrice')}
            type="text"
            inputMode="numeric"
            value={values.askingPrice ? Number(values.askingPrice).toLocaleString('en-IN') : ''}
            onChange={(e) => set('askingPrice', e.target.value.replace(/[^0-9]/g, ''))}
            placeholder="18,50,000"
            required
          />
        </Field>
        <Field label="State">
          <Select ref={setFieldRef('locationState')} value={values.locationState} onChange={(e) => handleStateChange(e.target.value)} required>
            <option value="">Select state</option>
            {INDIA_STATES.map((state) => (
              <option key={state} value={state}>
                {state}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="City">
          <Select ref={setFieldRef('locationCity')} value={values.locationCity} onChange={(e) => set('locationCity', e.target.value)} required disabled={!values.locationState}>
            <option value="">{values.locationState ? 'Select city' : 'Select state first'}</option>
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
            <p className="text-sm font-bold text-ink mb-0.5">Machine specification template</p>
            <p className="text-[12.5px] text-muted leading-relaxed">
              Select a catalog category to unlock spec fields specific to that machine type.
              This helps buyers filter and compare machines accurately.
            </p>
          </div>
          <Field label="Catalog category">
            <Select value={values.catalogCategoryId} onChange={(e) => handleCatalogCatChange(e.target.value)}>
              <option value="">None — use general category above</option>
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
              <Field label="Condition grade" hint="A = excellent, B = good, C = fair">
                <Select value={values.conditionGrade} onChange={(e) => set('conditionGrade', e.target.value)}>
                  <option value="">Select…</option>
                  <option value="A">A — Excellent</option>
                  <option value="B">B — Good</option>
                  <option value="C">C — Fair</option>
                </Select>
              </Field>
              <Field label="Running hours" hint="Verified odometer / hour-meter reading">
                <div className="space-y-2">
                  <Input
                    type="number"
                    min={0}
                    value={values.runningHours}
                    onChange={(e) => set('runningHours', e.target.value)}
                    placeholder="4200"
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
                    Not available
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
                  Price is negotiable
                </label>
              </div>
            </div>
          )}
        </div>
      )}

      {attempted && !valid && missing.length > 0 && (
        <div className="rounded-[10px] border border-copper-bdr bg-copper-bg p-4">
          <p className="text-[12.5px] font-bold text-copper-2">Before you continue:</p>
          <ul className="mt-1.5 list-inside list-disc space-y-0.5 text-[12.5px] text-copper-2">
            {missing.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      )}

      <Button type="submit" disabled={!valid || submitting}>
        {submitting ? 'Saving…' : submitLabel}
      </Button>
    </form>
  );
}
