import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { AdvertisementDto, CategoryDto, ListingDto, PaginatedResult } from '@machinebazaar/shared';
import { api } from '../../lib/api';
import { ListingCard } from '../../components/ListingCard';
import { Button, EmptyState, Input } from '../../components/ui';
import { ChevronRightIcon, CloseIcon, SearchIcon, SlidersIcon } from '../../components/icons';
import { INDIA_STATES } from '../../lib/india-locations';
import { ActiveFilters } from '../../components/FilterChips';
import { SortSelect } from '../../components/SortSelect';
import { ListingGridSkeleton } from '../../components/Skeleton';
import { FilterSheet } from '../../components/FilterSheet';

type GridEntry = { kind: 'listing'; listing: ListingDto } | { kind: 'ad'; ad: AdvertisementDto };

/** Interleaves active ad slots into the organic results at each ad's configured position — never reorders listings. */
function interleaveAds(items: ListingDto[], ads: AdvertisementDto[]): GridEntry[] {
  const result: GridEntry[] = items.map((listing) => ({ kind: 'listing', listing }));
  const sorted = [...ads].sort((a, b) => a.position - b.position);
  for (const ad of sorted) {
    const index = Math.min(Math.max(ad.position, 0), result.length);
    result.splice(index, 0, { kind: 'ad', ad });
  }
  return result;
}

function AdTile({ ad }: { ad: AdvertisementDto }) {
  const { t } = useTranslation();
  const content = (
    <img src={ad.imageUrl} alt={ad.title} className="h-full w-full rounded-xl object-cover" />
  );
  return (
    <div className="relative overflow-hidden rounded-xl border border-dashed border-line-2 bg-paper">
      <span className="absolute left-2 top-2 z-[1] rounded bg-ink/70 px-1.5 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-wide text-white">
        {t('public.listings.adBadge')}
      </span>
      {ad.linkUrl ? (
        <a href={ad.linkUrl} target="_blank" rel="noopener noreferrer sponsored" className="block h-full">
          {content}
        </a>
      ) : (
        content
      )}
    </div>
  );
}

interface Filters {
  search: string;
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

const EMPTY_FILTERS: Filters = {
  search: '',
  category: '',
  subcategory: '',
  make: '',
  state: '',
  priceMin: '',
  priceMax: '',
  condition: '',
  origin: '',
  conditionType: '',
  sort: '',
};

const ORIGIN_OPTIONS = [
  { value: 'INDIAN', key: 'indian' },
  { value: 'IMPORTED', key: 'imported' },
];

const CONDITION_OPTIONS = [
  { value: 'A', key: 'excellent' },
  { value: 'B', key: 'good' },
  { value: 'C', key: 'fair' },
];

/** Old/New — named "conditionType" to avoid colliding with the pre-existing A/B/C quality
    grade filter above (that one is unfortunately just called "condition"). */
const OLD_NEW_OPTIONS = [
  { value: 'OLD', key: 'conditionOld' },
  { value: 'NEW', key: 'conditionNew' },
];

const SELECT_ARROW =
  "url(\"data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12' fill='none' stroke='%236B7280' stroke-width='1.5' stroke-linecap='round'%3e%3cpolyline points='3 5 6 8 9 5'/%3e%3c/svg%3e\")";

const selectCls =
  'appearance-none rounded-lg border border-line bg-white bg-[length:12px] bg-[right_10px_center] bg-no-repeat pl-3 pr-8 py-2 text-sm text-ink outline-none transition focus:border-forest focus:ring-2 focus:ring-forest/10';

const BUDGET_RANGES = [
  { key: 'anyPrice', min: '', max: '' },
  { key: 'under5L', min: '', max: '500000' },
  { key: '5Lto20L', min: '500000', max: '2000000' },
  { key: '20Lto50L', min: '2000000', max: '5000000' },
  { key: '50LtoCr', min: '5000000', max: '10000000' },
  { key: 'above1Cr', min: '10000000', max: '' },
];

/**
 * The full filter set (search, category tree, make, state, budget, condition, origin) —
 * shared by the desktop sidebar (always visible, lg+) and the mobile filter bottom sheet
 * (opened on demand), so both surfaces stay in sync with a single field implementation.
 */
function FilterFields({
  filters,
  categories,
  inputSearch,
  handleSearchInput,
  handleCategoryChange,
  update,
  applyFilters,
}: {
  filters: Filters;
  categories: CategoryDto[];
  inputSearch: string;
  handleSearchInput: (value: string) => void;
  handleCategoryChange: (cat: string) => void;
  update: <K extends keyof Filters>(key: K, value: Filters[K]) => void;
  applyFilters: (f: Filters) => void;
}) {
  const { t } = useTranslation();
  return (
    <div className="space-y-5">
      {/* Search */}
      <div>
        <p className="mb-1.5 text-[11.5px] font-bold uppercase tracking-[0.06em] text-ink">{t('public.listings.filters.searchLabel')}</p>
        <div className="relative">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <Input
            placeholder={t('public.listings.filters.searchPlaceholder')}
            className="pl-9"
            value={inputSearch}
            onChange={(e) => handleSearchInput(e.target.value)}
          />
        </div>
      </div>

      {/* Category — expandable tree */}
      <div>
        <p className="mb-1.5 text-[11.5px] font-bold uppercase tracking-[0.06em] text-ink">{t('public.listings.filters.categoryLabel')}</p>
        <div className="space-y-0.5">
          <button
            type="button"
            onClick={() => handleCategoryChange('')}
            className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-[12.5px] font-semibold transition ${
              !filters.category ? 'bg-[#101828] text-white' : 'text-slate hover:bg-paper'
            }`}
          >
            {t('public.listings.filters.allCategories')}
          </button>
          {categories.map((cat) => {
            const isActive = filters.category === cat.name;
            const isExpanded = isActive && (cat.subcategories?.length ?? 0) > 0;
            return (
              <div key={cat.id}>
                <button
                  type="button"
                  onClick={() => handleCategoryChange(isActive ? '' : cat.name)}
                  className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-[12.5px] font-semibold transition ${
                    isActive ? 'bg-copper text-white' : 'text-slate hover:bg-paper'
                  }`}
                >
                  <span className="flex-1 line-clamp-1">{cat.name}</span>
                  <span className={`ml-1.5 shrink-0 font-mono text-[9.5px] font-bold ${isActive ? 'text-white/70' : 'text-muted'}`}>
                    {cat.listingCount > 0 ? cat.listingCount.toLocaleString('en-IN') : ''}
                  </span>
                </button>
                {isExpanded && (
                  <div className="ml-2.5 mt-0.5 space-y-0.5 border-l border-line pl-2.5">
                    <button
                      type="button"
                      onClick={() => update('subcategory', '')}
                      className={`flex w-full items-center rounded px-2 py-1 text-left text-[11.5px] font-semibold transition ${
                        !filters.subcategory ? 'text-copper' : 'text-muted hover:text-ink'
                      }`}
                    >
                      {t('public.listings.filters.allOfCategory', { category: cat.name })}
                    </button>
                    {(cat.subcategories ?? []).map((sub) => (
                      <button
                        key={sub.id}
                        type="button"
                        onClick={() => update('subcategory', filters.subcategory === sub.name ? '' : sub.name)}
                        className={`flex w-full items-center justify-between rounded px-2 py-1 text-left text-[11.5px] font-semibold transition ${
                          filters.subcategory === sub.name ? 'text-copper' : 'text-muted hover:text-ink'
                        }`}
                      >
                        <span className="flex-1 line-clamp-1">{sub.name}</span>
                        {sub.listingCount > 0 && (
                          <span className={`shrink-0 rounded-full px-1.5 py-0.5 font-mono text-[9px] font-bold ${
                            filters.subcategory === sub.name ? 'bg-copper text-white' : 'bg-paper-2 text-muted'
                          }`}>
                            {sub.listingCount.toLocaleString('en-IN')}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Make */}
      <div>
        <p className="mb-1.5 text-[11.5px] font-bold uppercase tracking-[0.06em] text-ink">{t('public.listings.filters.makeLabel')}</p>
        <Input
          placeholder={t('public.listings.filters.makePlaceholder')}
          value={filters.make}
          onChange={(e) => update('make', e.target.value)}
        />
      </div>

      {/* State */}
      <div>
        <p className="mb-1.5 text-[11.5px] font-bold uppercase tracking-[0.06em] text-ink">{t('public.listings.filters.stateLabel')}</p>
        <select
          value={filters.state}
          onChange={(e) => update('state', e.target.value)}
          className={`${selectCls} w-full`}
          style={{ backgroundImage: SELECT_ARROW }}
        >
          <option value="">{t('public.listings.filters.allIndia')}</option>
          {INDIA_STATES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {/* Budget */}
      <div>
        <p className="mb-1.5 text-[11.5px] font-bold uppercase tracking-[0.06em] text-ink">{t('public.listings.filters.budgetLabel')}</p>
        <div className="space-y-1.5">
          {BUDGET_RANGES.map((range) => {
            const active = filters.priceMin === range.min && filters.priceMax === range.max;
            return (
              <button
                key={range.key}
                type="button"
                onClick={() => {
                  const next = { ...filters, priceMin: range.min, priceMax: range.max };
                  applyFilters(next);
                }}
                className={`w-full rounded-lg border px-3 py-2 text-left text-[13px] font-medium transition ${
                  active
                    ? 'border-forest bg-forest-bg text-forest'
                    : 'border-line bg-white text-muted hover:border-line-2 hover:text-ink'
                }`}
              >
                {t(`public.listings.budgetRanges.${range.key}`)}
              </button>
            );
          })}
        </div>
      </div>

      {/* Condition */}
      <div>
        <p className="mb-1.5 text-[11.5px] font-bold uppercase tracking-[0.06em] text-ink">{t('public.listings.filters.conditionLabel')}</p>
        <select
          value={filters.condition}
          onChange={(e) => update('condition', e.target.value)}
          className={`${selectCls} w-full`}
          style={{ backgroundImage: SELECT_ARROW }}
        >
          <option value="">{t('public.listings.filters.any')}</option>
          {CONDITION_OPTIONS.map((c) => (
            <option key={c.value} value={c.value}>{t(`public.listings.conditionOptions.${c.key}`)}</option>
          ))}
        </select>
      </div>

      {/* Origin */}
      <div>
        <p className="mb-1.5 text-[11.5px] font-bold uppercase tracking-[0.06em] text-ink">{t('public.listings.filters.originLabel')}</p>
        <select
          value={filters.origin}
          onChange={(e) => update('origin', e.target.value)}
          className={`${selectCls} w-full`}
          style={{ backgroundImage: SELECT_ARROW }}
        >
          <option value="">{t('public.listings.filters.any')}</option>
          {ORIGIN_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{t(`public.listings.originOptions.${o.key}`)}</option>
          ))}
        </select>
      </div>

      {/* Old / New */}
      <div>
        <p className="mb-1.5 text-[11.5px] font-bold uppercase tracking-[0.06em] text-ink">{t('common:listing.condition')}</p>
        <select
          value={filters.conditionType}
          onChange={(e) => update('conditionType', e.target.value)}
          className={`${selectCls} w-full`}
          style={{ backgroundImage: SELECT_ARROW }}
        >
          <option value="">{t('public.listings.filters.any')}</option>
          {OLD_NEW_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{t(`common:listing.${o.key}`)}</option>
          ))}
        </select>
      </div>
    </div>
  );
}

export function Listings() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState<Filters>({
    ...EMPTY_FILTERS,
    search: searchParams.get('search') ?? '',
    category: searchParams.get('category') ?? '',
    subcategory: searchParams.get('subcategory') ?? '',
    state: searchParams.get('state') ?? '',
    priceMin: searchParams.get('priceMin') ?? '',
    priceMax: searchParams.get('priceMax') ?? '',
    condition: searchParams.get('condition') ?? '',
    origin: searchParams.get('origin') ?? '',
    conditionType: searchParams.get('conditionType') ?? '',
    sort: searchParams.get('sort') ?? '',
  });
  // Separate input value so the field is live while the API call is debounced
  const [inputSearch, setInputSearch] = useState(filters.search);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [ads, setAds] = useState<AdvertisementDto[]>([]);
  const [result, setResult] = useState<PaginatedResult<ListingDto> | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const isSearchMode = filters.search.trim().length > 0;

  useEffect(() => {
    api.get<CategoryDto[]>('/categories').then(({ data }) => setCategories(data)).catch(() => {});
    api.get<AdvertisementDto[]>('/advertisements').then(({ data }) => setAds(data)).catch(() => {});
  }, []);

  // `filters` is only seeded from the URL once at mount — re-sync whenever the URL's params
  // change from outside this page (e.g. the header's search bar or location selector
  // navigating here with new query params while this component is already mounted on
  // /listings, which React Router does not remount for since it's the same route element).
  // Previously this only re-synced `search`, so e.g. picking a state from the header while
  // already on /listings updated the URL but silently left the results unfiltered.
  useEffect(() => {
    const fromUrl: Filters = {
      search: searchParams.get('search') ?? '',
      category: searchParams.get('category') ?? '',
      subcategory: searchParams.get('subcategory') ?? '',
      make: searchParams.get('make') ?? '',
      state: searchParams.get('state') ?? '',
      priceMin: searchParams.get('priceMin') ?? '',
      priceMax: searchParams.get('priceMax') ?? '',
      condition: searchParams.get('condition') ?? '',
      origin: searchParams.get('origin') ?? '',
      conditionType: searchParams.get('conditionType') ?? '',
      sort: searchParams.get('sort') ?? '',
    };
    const changed = (Object.keys(fromUrl) as (keyof Filters)[]).some((k) => fromUrl[k] !== filters[k]);
    if (changed) {
      setFilters(fromUrl);
      setInputSearch(fromUrl.search);
      setPage(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    const params: Record<string, string | number> = { page, pageSize: 12 };
    if (filters.search) params.search = filters.search;
    if (filters.category) params.category = filters.category;
    if (filters.subcategory) params.subcategory = filters.subcategory;
    if (filters.make) params.make = filters.make;
    if (filters.state) params.state = filters.state;
    if (filters.priceMin) params.priceMin = filters.priceMin;
    if (filters.priceMax) params.priceMax = filters.priceMax;
    if (filters.condition) params.condition = filters.condition;
    if (filters.origin) params.origin = filters.origin;
    if (filters.conditionType) params.conditionType = filters.conditionType;
    if (filters.sort) params.sort = filters.sort;

    api
      .get<PaginatedResult<ListingDto>>('/listings', { params })
      .then(({ data }) => { if (!cancelled) setResult(data); })
      .catch(() => { if (!cancelled) setResult({ items: [], total: 0, page: 1, pageSize: 12 }); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [filters, page]);

  const applyFilters = (f: Filters) => {
    setPage(1);
    const next: Record<string, string> = {};
    if (f.search) next.search = f.search;
    if (f.category) next.category = f.category;
    if (f.subcategory) next.subcategory = f.subcategory;
    if (f.state) next.state = f.state;
    if (f.priceMin) next.priceMin = f.priceMin;
    if (f.priceMax) next.priceMax = f.priceMax;
    if (f.condition) next.condition = f.condition;
    if (f.origin) next.origin = f.origin;
    if (f.conditionType) next.conditionType = f.conditionType;
    if (f.sort) next.sort = f.sort;
    setSearchParams(next);
    setFilters(f);
  };

  const update = <K extends keyof Filters>(key: K, value: Filters[K]) => {
    const next = { ...filters, [key]: value };
    applyFilters(next);
  };

  const clearKeys = (keys: (keyof Filters)[]) => {
    const next = { ...filters };
    for (const key of keys) next[key] = '';
    applyFilters(next);
  };

  const handleSearchInput = (value: string) => {
    setInputSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const next = { ...filters, search: value };
      applyFilters(next);
    }, 300);
  };

  const handleCategoryChange = (cat: string) => {
    const next = { ...filters, category: cat, subcategory: '' };
    applyFilters(next);
  };

  const clearSearch = () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setInputSearch('');
    const next = { ...filters, search: '' };
    applyFilters(next);
    setFiltersOpen(false);
  };

  const clearAll = () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setInputSearch('');
    setFilters(EMPTY_FILTERS);
    setSearchParams({});
    setPage(1);
    setFiltersOpen(false);
  };

  const selectedCat = categories.find((c) => c.name === filters.category);
  const subcategories = selectedCat?.subcategories?.map((s) => s.name) ?? [];
  const totalPages = result ? Math.max(1, Math.ceil(result.total / result.pageSize)) : 1;
  // Counts filters other than search/sort, since those already have their own visible affordances.
  const activeFilterCount = [
    filters.category, filters.subcategory, filters.make, filters.state,
    filters.priceMin, filters.priceMax, filters.condition, filters.origin, filters.conditionType,
  ].filter(Boolean).length;

  // â"€â"€â"€ SEARCH MODE â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
  if (isSearchMode) {
    return (
      <div className="min-h-screen bg-paper">
        {/* â"€â"€ Compact search bar â"€â"€ */}
        <div className="sticky top-0 z-20 border-b border-line bg-white shadow-sm">
          <div className="mx-auto max-w-7xl px-4 py-3 lg:px-[52px]">
            {/* Search input row */}
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                <input
                  autoFocus
                  value={inputSearch}
                  onChange={(e) => handleSearchInput(e.target.value)}
                  placeholder={t('public.listings.searchModePlaceholder')}
                  className="w-full rounded-xl border border-line bg-paper py-2.5 pl-10 pr-4 text-[15px] text-ink outline-none transition placeholder:text-muted focus:border-forest focus:bg-white focus:ring-2 focus:ring-forest/10"
                />
              </div>
              <button
                type="button"
                onClick={clearSearch}
                className="flex items-center gap-1.5 rounded-lg border border-line bg-white px-3.5 py-2.5 text-[13px] font-semibold text-muted transition hover:border-rose-300 hover:text-rose-600"
              >
                <CloseIcon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{t('public.listings.clear')}</span>
              </button>
            </div>

            {/* Result count + category chips on same row */}
            <div className="mt-2.5 flex items-center gap-3">
              {/* Count */}
              <span className="shrink-0 font-mono text-[11.5px] font-semibold uppercase tracking-[0.07em] text-muted">
                {loading
                  ? t('public.listings.searching')
                  : t('public.listings.resultCount', { count: result?.total ?? 0, query: filters.search })}
              </span>
              {/* Separator */}
              <span className="hidden h-3.5 w-px bg-line sm:block" />
              {/* Category chips — horizontal scroll */}
              <div className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                <button
                  type="button"
                  onClick={() => handleCategoryChange('')}
                  className={`shrink-0 rounded-full border px-3 py-1 text-[12px] font-semibold transition ${
                    !filters.category
                      ? 'border-forest bg-forest text-white'
                      : 'border-line bg-white text-muted hover:border-forest hover:text-forest'
                  }`}
                >
                  {t('public.listings.all')}
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => handleCategoryChange(cat.name)}
                    className={`shrink-0 rounded-full border px-3 py-1 text-[12px] font-semibold transition ${
                      filters.category === cat.name
                        ? 'border-forest bg-forest text-white'
                        : 'border-line bg-white text-muted hover:border-forest hover:text-forest'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
              {/* More filters toggle */}
              <button
                type="button"
                onClick={() => setFiltersOpen((v) => !v)}
                className={`shrink-0 rounded-lg border px-3 py-1.5 text-[12.5px] font-semibold transition ${
                  filtersOpen ? 'border-forest bg-forest-bg text-forest' : 'border-line bg-white text-muted hover:border-forest hover:text-forest'
                }`}
              >
                {filtersOpen ? t('public.listings.hideFilters') : t('public.listings.moreFilters')}
              </button>
            </div>

            {/* Expandable extra filters */}
            {filtersOpen && (
              <div className="mt-3 flex flex-wrap items-end gap-3 border-t border-line pt-3">
                {/* State */}
                <div>
                  <p className="mb-1 font-mono text-[10px] font-semibold uppercase tracking-[0.07em] text-muted">{t('public.listings.filters.stateLabel')}</p>
                  <select
                    value={filters.state}
                    onChange={(e) => update('state', e.target.value)}
                    className={selectCls}
                    style={{ backgroundImage: SELECT_ARROW }}
                  >
                    <option value="">{t('public.listings.filters.allIndia')}</option>
                    {INDIA_STATES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                {/* Budget */}
                <div>
                  <p className="mb-1 font-mono text-[10px] font-semibold uppercase tracking-[0.07em] text-muted">{t('public.listings.filters.budgetLabel')}</p>
                  <select
                    value={`${filters.priceMin}|${filters.priceMax}`}
                    onChange={(e) => {
                      const [min, max] = e.target.value.split('|');
                      const next = { ...filters, priceMin: min, priceMax: max };
                      applyFilters(next);
                    }}
                    className={selectCls}
                    style={{ backgroundImage: SELECT_ARROW }}
                  >
                    {BUDGET_RANGES.map((r) => (
                      <option key={r.key} value={`${r.min}|${r.max}`}>{t(`public.listings.budgetRanges.${r.key}`)}</option>
                    ))}
                  </select>
                </div>
                {/* Make */}
                <div>
                  <p className="mb-1 font-mono text-[10px] font-semibold uppercase tracking-[0.07em] text-muted">{t('public.listings.filters.makeLabel')}</p>
                  <Input
                    placeholder={t('public.listings.filters.makePlaceholder')}
                    value={filters.make}
                    onChange={(e) => update('make', e.target.value)}
                    className="w-44"
                  />
                </div>
                {/* Subcategory */}
                {subcategories.length > 0 && (
                  <div>
                    <p className="mb-1 font-mono text-[10px] font-semibold uppercase tracking-[0.07em] text-muted">{t('public.listings.filters.subcategoryLabel')}</p>
                    <select
                      value={filters.subcategory}
                      onChange={(e) => update('subcategory', e.target.value)}
                      className={selectCls}
                      style={{ backgroundImage: SELECT_ARROW }}
                    >
                      <option value="">{t('public.listings.all')}</option>
                      {subcategories.map((sub) => (
                        <option key={sub} value={sub}>{sub}</option>
                      ))}
                    </select>
                  </div>
                )}
                {/* Condition */}
                <div>
                  <p className="mb-1 font-mono text-[10px] font-semibold uppercase tracking-[0.07em] text-muted">{t('public.listings.filters.conditionLabel')}</p>
                  <select
                    value={filters.condition}
                    onChange={(e) => update('condition', e.target.value)}
                    className={selectCls}
                    style={{ backgroundImage: SELECT_ARROW }}
                  >
                    <option value="">{t('public.listings.filters.any')}</option>
                    {CONDITION_OPTIONS.map((c) => (
                      <option key={c.value} value={c.value}>{t(`public.listings.conditionOptions.${c.key}`)}</option>
                    ))}
                  </select>
                </div>
                {/* Origin */}
                <div>
                  <p className="mb-1 font-mono text-[10px] font-semibold uppercase tracking-[0.07em] text-muted">{t('public.listings.filters.originLabel')}</p>
                  <select
                    value={filters.origin}
                    onChange={(e) => update('origin', e.target.value)}
                    className={selectCls}
                    style={{ backgroundImage: SELECT_ARROW }}
                  >
                    <option value="">{t('public.listings.filters.any')}</option>
                    {ORIGIN_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{t(`public.listings.originOptions.${o.key}`)}</option>
                    ))}
                  </select>
                </div>
                {/* Old / New */}
                <div>
                  <p className="mb-1 font-mono text-[10px] font-semibold uppercase tracking-[0.07em] text-muted">{t('common:listing.condition')}</p>
                  <select
                    value={filters.conditionType}
                    onChange={(e) => update('conditionType', e.target.value)}
                    className={selectCls}
                    style={{ backgroundImage: SELECT_ARROW }}
                  >
                    <option value="">{t('public.listings.filters.any')}</option>
                    {OLD_NEW_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{t(`common:listing.${o.key}`)}</option>
                    ))}
                  </select>
                </div>
                <button
                  type="button"
                  onClick={clearAll}
                  className="text-[12.5px] font-semibold text-muted hover:text-rose-600"
                >
                  {t('public.listings.resetAll')}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* â"€â"€ Results grid â"€â"€ */}
        <div className="mx-auto max-w-7xl px-4 py-6 lg:px-[52px]">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <ActiveFilters filters={filters} onClear={clearKeys} onClearAll={clearAll} />
            <SortSelect value={filters.sort} onChange={(v) => update('sort', v)} />
          </div>
          {loading ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
              <ListingGridSkeleton />
            </div>
          ) : !result || result.items.length === 0 ? (
            <EmptyState
              title={t('public.listings.searchModeEmpty.title', { query: filters.search })}
              description={t('public.listings.searchModeEmpty.description')}
            />
          ) : (
            <>
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-2 sm:gap-5 xl:grid-cols-3">
                {interleaveAds(result.items, ads).map((entry) =>
                  entry.kind === 'ad' ? (
                    <AdTile key={`ad-${entry.ad.id}`} ad={entry.ad} />
                  ) : (
                    <ListingCard key={entry.listing.id} listing={entry.listing} />
                  ),
                )}
              </div>
              {totalPages > 1 && (
                <div className="mt-10 flex items-center justify-center gap-2">
                  <Button variant="ghost" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                    {t('common:common.button.back')}
                  </Button>
                  <span className="px-3 font-mono text-[12.5px] font-medium text-muted">
                    {t('public.listings.pageOf', { page, totalPages })}
                  </span>
                  <Button variant="ghost" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
                    {t('common:common.button.next')}
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    );
  }

  // â"€â"€â"€ BROWSE MODE â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
  return (
    <div className="bg-paper">
      <div className="mx-auto max-w-7xl px-6 py-6 lg:px-[52px]">
        <div className="flex gap-8 lg:items-start">
          {/* SIDEBAR */}
          <aside className="hidden w-64 shrink-0 lg:block">
            <form onSubmit={(e) => { e.preventDefault(); applyFilters({ ...filters, search: inputSearch }); }} className="space-y-5">
              <FilterFields
                filters={filters}
                categories={categories}
                inputSearch={inputSearch}
                handleSearchInput={handleSearchInput}
                handleCategoryChange={handleCategoryChange}
                update={update}
                applyFilters={applyFilters}
              />
              <div className="flex flex-col gap-2 pt-2">
                <Button type="submit">
                  {t('public.listings.applyFilters')}
                  <ChevronRightIcon className="h-4 w-4" />
                </Button>
                <Button type="button" variant="ghost" onClick={clearAll}>
                  {t('public.listings.clearAll')}
                </Button>
              </div>
            </form>
          </aside>

          {/* Mobile filter bottom sheet — same fields as the desktop sidebar above */}
          <FilterSheet
            open={filtersOpen}
            onClose={() => setFiltersOpen(false)}
            footer={
              <div className="flex gap-2">
                <Button type="button" onClick={() => setFiltersOpen(false)} className="flex-1 justify-center">
                  {t('common:common.button.apply')}
                </Button>
                <Button type="button" variant="ghost" onClick={() => { clearAll(); setFiltersOpen(false); }}>
                  {t('public.listings.clearAll')}
                </Button>
              </div>
            }
          >
            <FilterFields
              filters={filters}
              categories={categories}
              inputSearch={inputSearch}
              handleSearchInput={handleSearchInput}
              handleCategoryChange={handleCategoryChange}
              update={update}
              applyFilters={applyFilters}
            />
          </FilterSheet>

          {/* MAIN CONTENT */}
          <div className="min-w-0 flex-1">
            {/* Mobile search bar + Filters trigger (opens the bottom sheet with the full filter set) */}
            <div className="mb-5 flex gap-2 lg:hidden">
              <div className="relative flex-1">
                <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                <Input
                  placeholder={t('public.listings.mobileSearchPlaceholder')}
                  className="pl-9"
                  value={inputSearch}
                  onChange={(e) => handleSearchInput(e.target.value)}
                />
              </div>
              <button
                type="button"
                onClick={() => setFiltersOpen(true)}
                className="relative flex shrink-0 items-center gap-1.5 rounded-lg border border-line bg-white px-3.5 py-2 text-[13px] font-semibold text-ink transition hover:border-ink"
              >
                <SlidersIcon className="h-4 w-4" />
                {t('common:common.button.filter')}
                {activeFilterCount > 0 && (
                  <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-copper px-1 font-mono text-[9.5px] font-bold text-white">
                    {activeFilterCount}
                  </span>
                )}
              </button>
            </div>

            {/* Category chips (browse mode — full cloud) */}
            {!filters.category ? (
              <div className="mb-6 flex flex-wrap gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => handleCategoryChange(cat.name)}
                    className="rounded-full border border-line bg-white px-3 py-1.5 text-[12.5px] font-semibold text-muted transition hover:border-forest hover:text-forest"
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            ) : (
              <div className="mb-6 flex items-center gap-2">
                <button
                  type="button"
                  onClick={clearAll}
                  className="text-[12.5px] font-semibold text-muted hover:text-forest"
                >
                  {t('public.listings.all')}
                </button>
                <span className="text-muted/40">/</span>
                <span className="rounded-full bg-forest-bg px-3 py-1 text-[12.5px] font-semibold text-forest">
                  {filters.category}
                </span>
                {filters.subcategory && (
                  <>
                    <span className="text-muted/40">/</span>
                    <span className="rounded-full bg-copper-bg px-3 py-1 text-[12.5px] font-semibold text-copper-2">
                      {filters.subcategory}
                    </span>
                  </>
                )}
              </div>
            )}

            <ActiveFilters filters={filters} onClear={clearKeys} onClearAll={clearAll} />

            {loading ? (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
                <ListingGridSkeleton />
              </div>
            ) : !result || result.items.length === 0 ? (
              <EmptyState
                title={t('public.listings.browseModeEmpty.title')}
                description={t('public.listings.browseModeEmpty.description')}
              />
            ) : (
              <>
                <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                  <p className="font-mono text-[11.5px] font-semibold uppercase tracking-[0.08em] text-muted">
                    {t('public.listings.listingsFound', { count: result.total })}
                  </p>
                  <SortSelect value={filters.sort} onChange={(v) => update('sort', v)} />
                </div>
                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-2 sm:gap-6 xl:grid-cols-3">
                  {interleaveAds(result.items, ads).map((entry) =>
                    entry.kind === 'ad' ? (
                      <AdTile key={`ad-${entry.ad.id}`} ad={entry.ad} />
                    ) : (
                      <ListingCard key={entry.listing.id} listing={entry.listing} />
                    ),
                  )}
                </div>

                {totalPages > 1 && (
                  <div className="mt-10 flex items-center justify-center gap-2">
                    <Button variant="ghost" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                      {t('common:common.button.back')}
                    </Button>
                    <span className="px-3 font-mono text-[12.5px] font-medium text-muted">
                      {t('public.listings.pageOf', { page, totalPages })}
                    </span>
                    <Button variant="ghost" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
                      {t('common:common.button.next')}
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
