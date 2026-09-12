import { useState } from 'react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { MACHINE_CATEGORIES } from '@machinebazaar/shared';
import type { RequirementDto } from '@machinebazaar/shared';
import { api, apiErrorMessage } from '../../lib/api';
import { AppLayout } from '../../components/AppLayout';
import { ChevronRightIcon, CheckIcon } from '../../components/icons';
import { INDIA_STATES, INDIA_STATES_AND_CITIES } from '../../lib/india-locations';
import { scrollToFirstError, useFieldRefs } from '../../lib/form-errors';

const inputCls =
  'w-full h-[50px] bg-gray-50 border border-gray-200 rounded-[12px] px-4 text-[14px] text-ink font-medium placeholder-gray-400 outline-none focus:border-forest focus:bg-white transition';
const selectCls = inputCls + ' appearance-none pr-8';

function Field({ label, required, hint, children }: { label: string; required?: boolean; hint?: string; children: ReactNode }) {
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

function SelectWrapper({ children }: { children: ReactNode }) {
  return (
    <div className="relative">
      {children}
      <ChevronRightIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 rotate-90 pointer-events-none" />
    </div>
  );
}

interface FormData {
  title: string;
  description: string;
  machineCategory: string;
  machineSubcategory: string;
  origin: '' | 'INDIAN' | 'IMPORTED';
  condition: '' | 'OLD' | 'NEW';
  manufactureYear: string;
  budgetMin: string;
  budgetMax: string;
  quantity: string;
  locationCity: string;
  locationState: string;
}

const EMPTY_FORM: FormData = {
  title: '',
  description: '',
  machineCategory: '',
  machineSubcategory: '',
  origin: '',
  condition: '',
  manufactureYear: '',
  budgetMin: '',
  budgetMax: '',
  quantity: '1',
  locationCity: '',
  locationState: '',
};

export function NewRequirement() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attempted, setAttempted] = useState(false);
  const [posted, setPosted] = useState<RequirementDto | null>(null);
  const { refs, setFieldRef } = useFieldRefs<HTMLElement>();

  const setField = (key: keyof FormData, value: string) => setForm((prev) => ({ ...prev, [key]: value }));

  const selectedCat = MACHINE_CATEGORIES.find((c) => c.label === form.machineCategory);
  const subcategories = selectedCat?.subcategories ?? [];
  const cities = form.locationState ? INDIA_STATES_AND_CITIES[form.locationState] ?? [] : [];

  const titleValid = form.title.trim().length >= 5;
  const descriptionValid = form.description.trim().length >= 20;
  const valid = titleValid && descriptionValid && form.machineCategory.trim().length > 0;

  const fieldOrder = ['title', 'description', 'machineCategory'];
  const fieldErrors: Record<string, string | false> = {
    title: !titleValid && t('buyer.newRequirement.errors.titleTooShort'),
    description: !descriptionValid && t('buyer.newRequirement.errors.descriptionTooShort'),
    machineCategory: !form.machineCategory.trim() && t('buyer.newRequirement.errors.categoryRequired'),
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAttempted(true);
    if (!valid) {
      scrollToFirstError(fieldOrder, fieldErrors, refs);
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const { data } = await api.post<RequirementDto>('/requirements', {
        title: form.title,
        description: form.description,
        machineCategory: form.machineCategory,
        machineSubcategory: form.machineSubcategory || undefined,
        origin: form.origin || undefined,
        condition: form.condition || undefined,
        manufactureYear: form.manufactureYear ? Number(form.manufactureYear) : undefined,
        budgetMin: form.budgetMin ? Number(form.budgetMin) : undefined,
        budgetMax: form.budgetMax ? Number(form.budgetMax) : undefined,
        quantity: form.quantity ? Number(form.quantity) : undefined,
        locationCity: form.locationCity || undefined,
        locationState: form.locationState || undefined,
      });
      // No approval gate — posting goes live immediately, no separate submit-for-review step.
      setPosted(data);
    } catch (err) {
      setError(apiErrorMessage(err, t('buyer.newRequirement.errors.createFailed')));
    } finally {
      setSubmitting(false);
    }
  };

  if (posted) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center min-h-[75vh] px-6 text-center">
          <div className="w-16 h-16 rounded-full bg-forest/10 flex items-center justify-center mb-5">
            <CheckIcon className="w-8 h-8 text-forest" />
          </div>
          <h2 className="text-[22px] font-extrabold text-ink tracking-[-0.5px]">{t('buyer.newRequirement.submitted.title')}</h2>
          <p className="mt-2.5 text-[13px] text-gray-500 leading-relaxed max-w-xs">{t('buyer.newRequirement.submitted.description')}</p>
          <button
            onClick={() => navigate('/buyer/requirements', { replace: true })}
            className="mt-8 w-full max-w-xs h-[52px] bg-forest text-white rounded-[13px] text-[15px] font-bold"
          >
            {t('buyer.newRequirement.submitted.goToRequirements')}
          </button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="bg-white border-b border-gray-200 px-4 pt-4 pb-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="w-8 h-8 flex items-center justify-center flex-shrink-0">
          <ChevronRightIcon className="w-4 h-4 text-gray-500 rotate-180" />
        </button>
        <h1 className="text-[17px] font-extrabold text-ink tracking-[-0.3px]">{t('buyer.newRequirement.title')}</h1>
      </div>

      <form onSubmit={handleSubmit} className="px-4 pt-4 pb-8 space-y-4">
        {error && (
          <p className="text-[12px] text-red-600 font-medium bg-red-50 border border-red-200 rounded-[10px] px-3 py-2.5">{error}</p>
        )}

        <Field label={t('buyer.newRequirement.fields.title')} required>
          <input ref={setFieldRef('title')} value={form.title} onChange={(e) => setField('title', e.target.value)} placeholder={t('buyer.newRequirement.fields.titlePlaceholder')} className={inputCls} minLength={5} maxLength={160} />
        </Field>

        <Field label={t('buyer.newRequirement.fields.description')} required>
          <textarea ref={setFieldRef('description') as unknown as React.Ref<HTMLTextAreaElement>} value={form.description} onChange={(e) => setField('description', e.target.value)} placeholder={t('buyer.newRequirement.fields.descriptionPlaceholder')} rows={4} minLength={20} maxLength={5000} className={inputCls + ' h-auto py-3'} />
        </Field>

        <Field label={t('buyer.newRequirement.fields.category')} required>
          <SelectWrapper>
            <select ref={setFieldRef('machineCategory')} value={form.machineCategory} onChange={(e) => setField('machineCategory', e.target.value)} className={selectCls}>
              <option value="">{t('buyer.newRequirement.fields.selectCategory')}</option>
              {MACHINE_CATEGORIES.map((c) => (
                <option key={c.id} value={c.label}>{c.label}</option>
              ))}
            </select>
          </SelectWrapper>
        </Field>

        {subcategories.length > 0 && (
          <Field label={t('buyer.newRequirement.fields.subcategory')}>
            <SelectWrapper>
              <select value={form.machineSubcategory} onChange={(e) => setField('machineSubcategory', e.target.value)} className={selectCls}>
                <option value="">{t('buyer.newRequirement.fields.selectSubcategory')}</option>
                {subcategories.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </SelectWrapper>
          </Field>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Field label={t('buyer.newRequirement.fields.origin')}>
            <SelectWrapper>
              <select value={form.origin} onChange={(e) => setField('origin', e.target.value)} className={selectCls}>
                <option value="">{t('buyer.newRequirement.fields.anyOrigin')}</option>
                <option value="INDIAN">{t('common:listing.originIndian')}</option>
                <option value="IMPORTED">{t('common:listing.originImported')}</option>
              </select>
            </SelectWrapper>
          </Field>
          <Field label={t('common:listing.condition')}>
            <SelectWrapper>
              <select value={form.condition} onChange={(e) => setField('condition', e.target.value)} className={selectCls}>
                <option value="">{t('buyer.newRequirement.fields.anyCondition')}</option>
                <option value="OLD">{t('common:listing.conditionOld')}</option>
                <option value="NEW">{t('common:listing.conditionNew')}</option>
              </select>
            </SelectWrapper>
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label={t('buyer.newRequirement.fields.budgetMin')}>
            <input type="number" min={0} value={form.budgetMin} onChange={(e) => setField('budgetMin', e.target.value)} placeholder={t('buyer.newRequirement.fields.budgetPlaceholder')} className={inputCls} />
          </Field>
          <Field label={t('buyer.newRequirement.fields.budgetMax')}>
            <input type="number" min={0} value={form.budgetMax} onChange={(e) => setField('budgetMax', e.target.value)} placeholder={t('buyer.newRequirement.fields.budgetPlaceholder')} className={inputCls} />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label={t('buyer.newRequirement.fields.state')}>
            <SelectWrapper>
              <select value={form.locationState} onChange={(e) => setForm((prev) => ({ ...prev, locationState: e.target.value, locationCity: '' }))} className={selectCls}>
                <option value="">{t('buyer.newRequirement.fields.anyState')}</option>
                {INDIA_STATES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </SelectWrapper>
          </Field>
          <Field label={t('buyer.newRequirement.fields.city')}>
            <SelectWrapper>
              <select value={form.locationCity} onChange={(e) => setField('locationCity', e.target.value)} disabled={!form.locationState} className={selectCls}>
                <option value="">{form.locationState ? t('buyer.newRequirement.fields.selectCity') : t('buyer.newRequirement.fields.selectStateFirst')}</option>
                {cities.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </SelectWrapper>
          </Field>
        </div>

        {attempted && !valid && (
          <div className="rounded-[10px] border border-copper-bdr bg-copper-bg px-3.5 py-3">
            <ul className="list-inside list-disc space-y-0.5 text-[12px] text-copper-2">
              {Object.values(fieldErrors).filter((v): v is string => !!v).map((msg) => <li key={msg}>{msg}</li>)}
            </ul>
          </div>
        )}

        <button type="submit" disabled={submitting} className="w-full h-[52px] bg-forest text-white rounded-[13px] text-[15px] font-bold disabled:opacity-50">
          {submitting ? t('buyer.newRequirement.posting') : t('buyer.newRequirement.submit')}
        </button>
      </form>
    </AppLayout>
  );
}
