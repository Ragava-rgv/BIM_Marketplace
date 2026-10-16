import { useTranslation } from 'react-i18next';
import type { CategorySpecTemplateDto } from '../shared';
import { Field, Input, Select } from './ui';

interface Props {
  fields: CategorySpecTemplateDto[];
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
}

/**
 * Renders a set of dynamic spec input fields driven by a category's spec template.
 * Values are always stored as strings; the API/backend coerces numbers and booleans.
 */
export function DynamicSpecFields({ fields, values, onChange }: Props) {
  const { t } = useTranslation();
  if (fields.length === 0) return null;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-navy/10" />
        <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
          {t('components.dynamicSpecFields.sectionHeading')}
        </span>
        <div className="h-px flex-1 bg-navy/10" />
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        {fields.map((field) => (
          <SpecFieldInput key={field.id} field={field} value={values[field.fieldKey] ?? ''} onChange={(v) => onChange(field.fieldKey, v)} />
        ))}
      </div>
    </div>
  );
}

function SpecFieldInput({
  field,
  value,
  onChange,
}: {
  field: CategorySpecTemplateDto;
  value: string;
  onChange: (v: string) => void;
}) {
  const { t } = useTranslation();
  const labelWithUnit = field.unit ? `${field.fieldLabel} (${field.unit})` : field.fieldLabel;

  switch (field.fieldType) {
    case 'number':
      return (
        <Field label={labelWithUnit} hint={field.helpText ?? undefined} required={field.isRequired}>
          <div className="relative">
            <Input
              type="number"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              required={field.isRequired}
              placeholder={t('components.dynamicSpecFields.numberPlaceholder')}
              className={field.unit ? 'pr-14' : ''}
            />
            {field.unit && (
              <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center font-mono text-[11px] font-semibold text-muted">
                {field.unit}
              </span>
            )}
          </div>
        </Field>
      );

    case 'select':
      return (
        <Field label={labelWithUnit} hint={field.helpText ?? undefined} required={field.isRequired}>
          <Select value={value} onChange={(e) => onChange(e.target.value)} required={field.isRequired}>
            <option value="">{t('components.dynamicSpecFields.selectPlaceholder')}</option>
            {field.options.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </Select>
        </Field>
      );

    case 'boolean':
      return (
        <Field label={labelWithUnit} hint={field.helpText ?? undefined} required={field.isRequired}>
          <Select value={value} onChange={(e) => onChange(e.target.value)} required={field.isRequired}>
            <option value="">{t('components.dynamicSpecFields.selectPlaceholder')}</option>
            <option value="true">{t('common:common.label.yes')}</option>
            <option value="false">{t('common:common.label.no')}</option>
          </Select>
        </Field>
      );

    case 'text':
    default:
      return (
        <Field label={labelWithUnit} hint={field.helpText ?? undefined} required={field.isRequired}>
          <Input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            required={field.isRequired}
          />
        </Field>
      );
  }
}
