import { useEffect, useState } from 'react';
import type { CategoryGroupDto, CategorySpecTemplateDto } from '@machinebazaar/shared';
import { MACHINE_CATEGORIES } from '@machinebazaar/shared';
import { api } from '../lib/api';
import { Button, Field, Input, Select, Textarea } from './ui';
import { DynamicSpecFields } from './DynamicSpecFields';
import { INDIA_STATES, INDIA_STATES_AND_CITIES } from '../lib/india-locations';

export interface ListingDetailsValues {
  title: string;
  description: string;
  machineCategory: string;
  machineSubcategory: string;
  machineMake: string;
  machineModel: string;
  manufactureYear: string;
  askingPrice: string;
  locationCity: string;
  locationState: string;
  complexityTier: 'SIMPLE' | 'STANDARD' | 'COMPLEX';
  // Catalog system
  catalogCategoryId: string;
  specs: Record<string, string>;
  conditionGrade: string;
  runningHours: string;
  serialNumber: string;
  negotiable: boolean;
}

export const EMPTY_LISTING_DETAILS: ListingDetailsValues = {
  title: '',
  description: '',
  machineCategory: '',
  machineSubcategory: '',
  machineMake: '',
  machineModel: '',
  manufactureYear: String(new Date().getFullYear() - 1),
  askingPrice: '',
  locationCity: '',
  locationState: '',
  complexityTier: 'STANDARD',
  catalogCategoryId: '',
  specs: {},
  conditionGrade: '',
  runningHours: '',
  serialNumber: '',
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
    manufactureYear: Number(values.manufactureYear),
    askingPrice: Number(values.askingPrice),
    locationCity: values.locationCity,
    locationState: values.locationState,
    complexityTier: values.complexityTier,
    catalogCategoryId: values.catalogCategoryId || undefined,
    specs: values.catalogCategoryId && Object.keys(values.specs).length > 0 ? values.specs : undefined,
    conditionGrade: values.conditionGrade || undefined,
    runningHours: values.runningHours ? Number(values.runningHours) : undefined,
    serialNumber: values.serialNumber || undefined,
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
  const yearValid = Number(values.manufactureYear) >= 1950;

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
    yearValid &&
    specsValid;

  const missing: string[] = [];
  if (!titleValid) missing.push(`Title needs at least 5 characters (${values.title.trim().length}/5)`);
  if (!descriptionValid) missing.push(`Description needs at least 20 characters (${values.description.trim().length}/20)`);
  if (!values.machineCategory.trim()) missing.push('Machine category is required');
  if (!values.machineMake.trim()) missing.push('Make is required');
  if (!values.machineModel.trim()) missing.push('Model is required');
  if (!yearValid) missing.push('Manufacture year must be 1950 or later');
  if (!priceValid) missing.push('Asking price must be greater than 0');
  if (!values.locationState.trim()) missing.push('State is required');
  if (!values.locationCity.trim()) missing.push('City is required');
  requiredSpecs.forEach((f) => {
    if (!(values.specs[f.fieldKey] ?? '').trim()) missing.push(`${f.fieldLabel} is required`);
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (valid) void onSubmit(values);
      }}
      className="space-y-5"
    >
      <Field label="Listing title" hint="Be specific — make, model and key spec helps buyers find you">
        <Input value={values.title} onChange={(e) => set('title', e.target.value)} placeholder="2019 Hyundai R140 Excavator, well-maintained" required minLength={5} maxLength={160} />
      </Field>

      <Field label="Description">
        <Textarea
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
          <Input value={values.machineMake} onChange={(e) => set('machineMake', e.target.value)} placeholder="Hyundai" required />
        </Field>
        <Field label="Model">
          <Input value={values.machineModel} onChange={(e) => set('machineModel', e.target.value)} placeholder="R140LC-9" required />
        </Field>
        <Field label="Manufacture year">
          <Input
            type="number"
            min={1950}
            max={new Date().getFullYear()}
            value={values.manufactureYear}
            onChange={(e) => set('manufactureYear', e.target.value)}
            required
          />
        </Field>
        <Field label="Asking price (₹)">
          <Input type="number" min={0} value={values.askingPrice} onChange={(e) => set('askingPrice', e.target.value)} placeholder="1850000" required />
        </Field>
        <Field label="State">
          <Select value={values.locationState} onChange={(e) => handleStateChange(e.target.value)} required>
            <option value="">Select state</option>
            {INDIA_STATES.map((state) => (
              <option key={state} value={state}>
                {state}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="City">
          <Select value={values.locationCity} onChange={(e) => set('locationCity', e.target.value)} required disabled={!values.locationState}>
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
                <Input
                  type="number"
                  min={0}
                  value={values.runningHours}
                  onChange={(e) => set('runningHours', e.target.value)}
                  placeholder="4200"
                />
              </Field>
              <Field label="Serial number" hint="Manufacturer plate / nameplate serial">
                <Input
                  value={values.serialNumber}
                  onChange={(e) => set('serialNumber', e.target.value)}
                  placeholder="SN-202194"
                />
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

      {!valid && missing.length > 0 && (
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
