const SELECT_ARROW =
  "url(\"data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12' fill='none' stroke='%236B7280' stroke-width='1.5' stroke-linecap='round'%3e%3cpolyline points='3 5 6 8 9 5'/%3e%3c/svg%3e\")";

const selectCls =
  'appearance-none rounded-lg border border-line bg-white bg-[length:12px] bg-[right_10px_center] bg-no-repeat pl-3 pr-8 py-2 text-sm text-ink outline-none transition focus:border-forest focus:ring-2 focus:ring-forest/10';

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
];

export function SortSelect({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <select
      value={value || 'newest'}
      onChange={(e) => onChange(e.target.value)}
      className={`${selectCls} w-auto`}
      style={{ backgroundImage: SELECT_ARROW }}
      aria-label="Sort listings"
    >
      {SORT_OPTIONS.map((opt) => (
        <option key={opt.value} value={opt.value}>
          Sort: {opt.label}
        </option>
      ))}
    </select>
  );
}
