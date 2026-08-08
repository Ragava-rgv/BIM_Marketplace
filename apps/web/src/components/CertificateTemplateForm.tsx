import { useTranslation } from 'react-i18next';
import { CertificationConditionGrade } from '@machinebazaar/shared';
import type { InspectionReportDto } from '@machinebazaar/shared';
import { Field, Input, Select, Textarea } from './ui';

export interface InspectionReportValues {
  conditionGrade: CertificationConditionGrade;
  verifiedRunHours: string;
  verifiedManufactureYear: string;
  functionalTestPassed: 'true' | 'false';
  defectsObserved: string;
  recommendedMarketValue: string;
  inspectorName: string;
  inspectionDate: string;
}

export const EMPTY_INSPECTION_REPORT: InspectionReportValues = {
  conditionGrade: CertificationConditionGrade.B,
  verifiedRunHours: '',
  verifiedManufactureYear: String(new Date().getFullYear() - 1),
  functionalTestPassed: 'true',
  defectsObserved: '',
  recommendedMarketValue: '',
  inspectorName: '',
  inspectionDate: new Date().toISOString().slice(0, 10),
};

export function inspectionReportToValues(report: InspectionReportDto | null): InspectionReportValues {
  if (!report) return EMPTY_INSPECTION_REPORT;
  return {
    conditionGrade: report.conditionGrade,
    verifiedRunHours: String(report.verifiedRunHours),
    verifiedManufactureYear: String(report.verifiedManufactureYear),
    functionalTestPassed: report.functionalTestPassed ? 'true' : 'false',
    defectsObserved: report.defectsObserved,
    recommendedMarketValue: String(report.recommendedMarketValue),
    inspectorName: report.inspectorName,
    inspectionDate: report.inspectionDate.slice(0, 10),
  };
}

export function inspectionReportToPayload(values: InspectionReportValues): InspectionReportDto {
  return {
    conditionGrade: values.conditionGrade,
    verifiedRunHours: Number(values.verifiedRunHours),
    verifiedManufactureYear: Number(values.verifiedManufactureYear),
    functionalTestPassed: values.functionalTestPassed === 'true',
    defectsObserved: values.defectsObserved,
    recommendedMarketValue: Number(values.recommendedMarketValue),
    inspectorName: values.inspectorName,
    inspectionDate: values.inspectionDate,
  };
}

export function isInspectionReportValid(values: InspectionReportValues): boolean {
  return (
    values.verifiedRunHours.trim() !== '' &&
    Number(values.verifiedRunHours) >= 0 &&
    Number(values.verifiedManufactureYear) >= 1900 &&
    values.recommendedMarketValue.trim() !== '' &&
    Number(values.recommendedMarketValue) >= 0 &&
    values.inspectorName.trim().length > 0 &&
    values.inspectionDate.trim().length > 0
  );
}

/** Prefixed inspection template — standard set of fields the inspector fills in. */
export function CertificateTemplateForm({
  values,
  onChange,
}: {
  values: InspectionReportValues;
  onChange: (values: InspectionReportValues) => void;
}) {
  const { t } = useTranslation();
  const set = <K extends keyof InspectionReportValues>(key: K, value: InspectionReportValues[K]) =>
    onChange({ ...values, [key]: value });

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <Field label={t('components.certificateTemplateForm.conditionGrade')}>
        <Select value={values.conditionGrade} onChange={(e) => set('conditionGrade', e.target.value as CertificationConditionGrade)}>
          {Object.values(CertificationConditionGrade).map((grade) => (
            <option key={grade} value={grade}>
              {t('components.certificateTemplateForm.gradeOption', { grade })}
            </option>
          ))}
        </Select>
      </Field>

      <Field label={t('components.certificateTemplateForm.functionalTest')}>
        <Select value={values.functionalTestPassed} onChange={(e) => set('functionalTestPassed', e.target.value as 'true' | 'false')}>
          <option value="true">{t('components.certificateTemplateForm.pass')}</option>
          <option value="false">{t('components.certificateTemplateForm.fail')}</option>
        </Select>
      </Field>

      <Field label={t('components.certificateTemplateForm.verifiedRunHours')}>
        <Input type="number" min={0} value={values.verifiedRunHours} onChange={(e) => set('verifiedRunHours', e.target.value)} />
      </Field>

      <Field label={t('components.certificateTemplateForm.verifiedManufactureYear')}>
        <Input type="number" min={1900} value={values.verifiedManufactureYear} onChange={(e) => set('verifiedManufactureYear', e.target.value)} />
      </Field>

      <Field label={t('components.certificateTemplateForm.recommendedMarketValue')}>
        <Input type="number" min={0} value={values.recommendedMarketValue} onChange={(e) => set('recommendedMarketValue', e.target.value)} />
      </Field>

      <Field label={t('components.certificateTemplateForm.inspectionDate')}>
        <Input type="date" value={values.inspectionDate} onChange={(e) => set('inspectionDate', e.target.value)} />
      </Field>

      <Field label={t('components.certificateTemplateForm.inspectorName')}>
        <Input value={values.inspectorName} onChange={(e) => set('inspectorName', e.target.value)} placeholder={t('components.certificateTemplateForm.inspectorNamePlaceholder')} />
      </Field>

      <div className="sm:col-span-2">
        <Field label={t('components.certificateTemplateForm.defectsObserved')}>
          <Textarea
            rows={3}
            value={values.defectsObserved}
            onChange={(e) => set('defectsObserved', e.target.value)}
            placeholder={t('components.certificateTemplateForm.defectsObservedPlaceholder')}
          />
        </Field>
      </div>
    </div>
  );
}
