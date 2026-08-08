import { useTranslation } from 'react-i18next';
import { CloseIcon } from './icons';

export interface ActiveFilterValues {
  category: string;
  subcategory: string;
  make: string;
  state: string;
  priceMin: string;
  priceMax: string;
  condition: string;
  origin: string;
  conditionType: string;
  sort: string;
}

interface Chip {
  key: string;
  label: string;
  onRemove: () => void;
}

function formatLakh(value: string): string {
  const n = Number(value);
  if (!n) return '';
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(n % 10000000 === 0 ? 0 : 1)}Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(n % 100000 === 0 ? 0 : 1)}L`;
  return `₹${n.toLocaleString('en-IN')}`;
}

/** Removable pill row for all currently-active filters, plus a single "Clear all" action. */
export function ActiveFilters({
  filters,
  onClear,
  onClearAll,
}: {
  filters: ActiveFilterValues;
  onClear: (keys: (keyof ActiveFilterValues)[]) => void;
  onClearAll: () => void;
}) {
  const { t } = useTranslation();
  const SORT_LABELS: Record<string, string> = {
    price_asc: t('components.filterChips.sortPriceAsc'),
    price_desc: t('components.filterChips.sortPriceDesc'),
  };

  const chips: Chip[] = [];

  if (filters.category) {
    chips.push({
      key: 'category',
      label: filters.subcategory ? `${filters.category} › ${filters.subcategory}` : filters.category,
      onRemove: () => onClear(['category', 'subcategory']),
    });
  }
  if (filters.make) {
    chips.push({ key: 'make', label: t('components.filterChips.makeLabel', { make: filters.make }), onRemove: () => onClear(['make']) });
  }
  if (filters.state) {
    chips.push({ key: 'state', label: filters.state, onRemove: () => onClear(['state']) });
  }
  if (filters.priceMin || filters.priceMax) {
    const min = filters.priceMin ? formatLakh(filters.priceMin) : '';
    const max = filters.priceMax ? formatLakh(filters.priceMax) : '';
    const label = min && max
      ? `${min} – ${max}`
      : min
        ? t('components.filterChips.aboveLabel', { value: min })
        : t('components.filterChips.underLabel', { value: max });
    chips.push({ key: 'budget', label, onRemove: () => onClear(['priceMin', 'priceMax']) });
  }
  if (filters.condition) {
    chips.push({ key: 'condition', label: t('components.filterChips.conditionLabel', { condition: filters.condition }), onRemove: () => onClear(['condition']) });
  }
  if (filters.origin) {
    chips.push({
      key: 'origin',
      label: filters.origin === 'IMPORTED' ? t('components.filterChips.imported') : t('components.filterChips.indian'),
      onRemove: () => onClear(['origin']),
    });
  }
  if (filters.conditionType) {
    chips.push({
      key: 'conditionType',
      label: filters.conditionType === 'NEW' ? t('common:listing.conditionNew') : t('common:listing.conditionOld'),
      onRemove: () => onClear(['conditionType']),
    });
  }
  if (filters.sort && filters.sort !== 'newest') {
    chips.push({
      key: 'sort',
      label: SORT_LABELS[filters.sort] ?? filters.sort,
      onRemove: () => onClear(['sort']),
    });
  }

  if (chips.length === 0) return null;

  return (
    <div className="mb-5 flex flex-wrap items-center gap-2">
      {chips.map((chip) => (
        <button
          key={chip.key}
          type="button"
          onClick={chip.onRemove}
          className="inline-flex items-center gap-1.5 rounded-full border border-forest-bdr bg-forest-bg px-3 py-1 text-[12px] font-semibold text-forest transition hover:border-forest"
        >
          {chip.label}
          <CloseIcon className="h-3 w-3" />
        </button>
      ))}
      <button
        type="button"
        onClick={onClearAll}
        className="text-[12px] font-semibold text-muted hover:text-rose-600"
      >
        {t('components.filterChips.clearAll')}
      </button>
    </div>
  );
}
