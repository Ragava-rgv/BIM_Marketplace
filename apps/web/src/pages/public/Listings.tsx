import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { CategoryDto, ListingDto, PaginatedResult } from '@machinebazaar/shared';
import { api } from '../../lib/api';
import { ListingCard } from '../../components/ListingCard';
import { Button, EmptyState, Input, LoadingBlock, MonoLabel } from '../../components/ui';
import { ChevronRightIcon, CloseIcon, SearchIcon } from '../../components/icons';
import { INDIA_STATES } from '../../lib/india-locations';

interface Filters {
  search: string;
  category: string;
  subcategory: string;
  make: string;
  state: string;
  priceMin: string;
  priceMax: string;
  yearMin: string;
  yearMax: string;
}

const EMPTY_FILTERS: Filters = {
  search: '',
  category: '',
  subcategory: '',
  make: '',
  state: '',
  priceMin: '',
  priceMax: '',
  yearMin: '',
  yearMax: '',
};

const SELECT_ARROW =
  "url(\"data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12' fill='none' stroke='%236B7280' stroke-width='1.5' stroke-linecap='round'%3e%3cpolyline points='3 5 6 8 9 5'/%3e%3c/svg%3e\")";

const selectCls =
  'appearance-none rounded-lg border border-line bg-white bg-[length:12px] bg-[right_10px_center] bg-no-repeat pl-3 pr-8 py-2 text-sm text-ink outline-none transition focus:border-forest focus:ring-2 focus:ring-forest/10';

const BUDGET_RANGES = [
  { label: 'Any price', min: '', max: '' },
  { label: 'Under ₹5L', min: '', max: '500000' },
  { label: '₹5L — ₹20L', min: '500000', max: '2000000' },
  { label: '₹20L — ₹50L', min: '2000000', max: '5000000' },
  { label: '₹50L — ₹1Cr', min: '5000000', max: '10000000' },
  { label: 'Above ₹1Cr', min: '10000000', max: '' },
];

export function Listings() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState<Filters>({
    ...EMPTY_FILTERS,
    search: searchParams.get('search') ?? '',
    category: searchParams.get('category') ?? '',
    subcategory: searchParams.get('subcategory') ?? '',
    state: searchParams.get('state') ?? '',
    priceMin: searchParams.get('priceMin') ?? '',
    priceMax: searchParams.get('priceMax') ?? '',
  });
  // Separate input value so the field is live while the API call is debounced
  const [inputSearch, setInputSearch] = useState(filters.search);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [result, setResult] = useState<PaginatedResult<ListingDto> | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const isSearchMode = filters.search.trim().length > 0;

  useEffect(() => {
    api.get<CategoryDto[]>('/categories').then(({ data }) => setCategories(data)).catch(() => {});
  }, []);

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
    if (filters.yearMin) params.yearMin = filters.yearMin;
    if (filters.yearMax) params.yearMax = filters.yearMax;

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
    setSearchParams(next);
    setFilters(f);
  };

  const update = <K extends keyof Filters>(key: K, value: Filters[K]) => {
    const next = { ...filters, [key]: value };
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
                  placeholder="Search machines, makes, models..."
                  className="w-full rounded-xl border border-line bg-paper py-2.5 pl-10 pr-4 text-[15px] text-ink outline-none transition placeholder:text-muted focus:border-forest focus:bg-white focus:ring-2 focus:ring-forest/10"
                />
              </div>
              <button
                type="button"
                onClick={clearSearch}
                className="flex items-center gap-1.5 rounded-lg border border-line bg-white px-3.5 py-2.5 text-[13px] font-semibold text-muted transition hover:border-rose-300 hover:text-rose-600"
              >
                <CloseIcon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Clear</span>
              </button>
            </div>

            {/* Result count + category chips on same row */}
            <div className="mt-2.5 flex items-center gap-3">
              {/* Count */}
              <span className="shrink-0 font-mono text-[11.5px] font-semibold uppercase tracking-[0.07em] text-muted">
                {loading ? 'Searching...' : `${result?.total ?? 0} result${result?.total === 1 ? '' : 's'} for "${filters.search}"`}
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
                  All
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
                {filtersOpen ? 'Hide filters' : 'More filters'}
              </button>
            </div>

            {/* Expandable extra filters */}
            {filtersOpen && (
              <div className="mt-3 flex flex-wrap items-end gap-3 border-t border-line pt-3">
                {/* State */}
                <div>
                  <p className="mb-1 font-mono text-[10px] font-semibold uppercase tracking-[0.07em] text-muted">State</p>
                  <select
                    value={filters.state}
                    onChange={(e) => update('state', e.target.value)}
                    className={selectCls}
                    style={{ backgroundImage: SELECT_ARROW }}
                  >
                    <option value="">All India</option>
                    {INDIA_STATES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                {/* Budget */}
                <div>
                  <p className="mb-1 font-mono text-[10px] font-semibold uppercase tracking-[0.07em] text-muted">Budget</p>
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
                      <option key={r.label} value={`${r.min}|${r.max}`}>{r.label}</option>
                    ))}
                  </select>
                </div>
                {/* Make */}
                <div>
                  <p className="mb-1 font-mono text-[10px] font-semibold uppercase tracking-[0.07em] text-muted">Make</p>
                  <Input
                    placeholder="e.g. HMT, BFW, Mazak"
                    value={filters.make}
                    onChange={(e) => update('make', e.target.value)}
                    className="w-44"
                  />
                </div>
                {/* Subcategory */}
                {subcategories.length > 0 && (
                  <div>
                    <p className="mb-1 font-mono text-[10px] font-semibold uppercase tracking-[0.07em] text-muted">Subcategory</p>
                    <select
                      value={filters.subcategory}
                      onChange={(e) => update('subcategory', e.target.value)}
                      className={selectCls}
                      style={{ backgroundImage: SELECT_ARROW }}
                    >
                      <option value="">All</option>
                      {subcategories.map((sub) => (
                        <option key={sub} value={sub}>{sub}</option>
                      ))}
                    </select>
                  </div>
                )}
                {/* Year range */}
                <div>
                  <p className="mb-1 font-mono text-[10px] font-semibold uppercase tracking-[0.07em] text-muted">Year</p>
                  <div className="flex gap-1.5">
                    <Input
                      placeholder="From"
                      inputMode="numeric"
                      maxLength={4}
                      value={filters.yearMin}
                      onChange={(e) => update('yearMin', e.target.value)}
                      className="w-20"
                    />
                    <Input
                      placeholder="To"
                      inputMode="numeric"
                      maxLength={4}
                      value={filters.yearMax}
                      onChange={(e) => update('yearMax', e.target.value)}
                      className="w-20"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={clearAll}
                  className="text-[12.5px] font-semibold text-muted hover:text-rose-600"
                >
                  Reset all
                </button>
              </div>
            )}
          </div>
        </div>

        {/* â"€â"€ Results grid â"€â"€ */}
        <div className="mx-auto max-w-7xl px-4 py-6 lg:px-[52px]">
          {loading ? (
            <LoadingBlock />
          ) : !result || result.items.length === 0 ? (
            <EmptyState
              title={`No machines found for "${filters.search}"`}
              description="Try a different keyword, or clear the search to browse all listings."
            />
          ) : (
            <>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {result.items.map((listing) => (
                  <ListingCard key={listing.id} listing={listing} />
                ))}
              </div>
              {totalPages > 1 && (
                <div className="mt-10 flex items-center justify-center gap-2">
                  <Button variant="ghost" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                    Previous
                  </Button>
                  <span className="px-3 font-mono text-[12.5px] font-medium text-muted">
                    Page {page} of {totalPages}
                  </span>
                  <Button variant="ghost" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
                    Next
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
      {/* Hero */}
      <div className="border-b border-line bg-white px-6 py-12 lg:px-[52px]">
        <div className="mx-auto max-w-7xl">
          <MonoLabel className="text-copper">— Marketplace</MonoLabel>
          <h1 className="mt-2.5 font-display text-[34px] font-medium leading-[1.05] tracking-[-0.8px] text-ink sm:text-[42px]">
            Browse machinery listings
          </h1>
          <p className="mt-2 max-w-2xl text-[14.5px] leading-[1.7] text-muted">
            GST-verified, admin-approved industrial machines from across India. Filter by category, make, location and budget.
          </p>
          {/* Prominent search bar in hero */}
          <div className="mt-6 flex max-w-2xl gap-3">
            <div className="relative flex-1">
              <SearchIcon className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-muted" />
              <input
                value={inputSearch}
                onChange={(e) => handleSearchInput(e.target.value)}
                placeholder="Search machines, makes, models..."
                className="w-full rounded-xl border border-line bg-paper py-3.5 pl-11 pr-4 text-[15px] text-ink shadow-sm outline-none transition placeholder:text-muted focus:border-forest focus:bg-white focus:ring-2 focus:ring-forest/10"
              />
            </div>
            <button
              type="button"
              onClick={() => { applyFilters({ ...filters, search: inputSearch }); }}
              className="rounded-xl bg-forest px-6 py-3.5 text-[15px] font-semibold text-white transition hover:bg-[#2D6A4F]"
            >
              Search
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-10 lg:px-[52px]">
        <div className="flex gap-8 lg:items-start">
          {/* SIDEBAR */}
          <aside className="hidden w-64 shrink-0 lg:block">
            <form onSubmit={(e) => { e.preventDefault(); applyFilters({ ...filters, search: inputSearch }); }} className="space-y-5">
              {/* Search */}
              <div>
                <p className="mb-1.5 text-[11.5px] font-bold uppercase tracking-[0.06em] text-ink">Search</p>
                <div className="relative">
                  <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                  <Input
                    placeholder="Title, make, model..."
                    className="pl-9"
                    value={inputSearch}
                    onChange={(e) => handleSearchInput(e.target.value)}
                  />
                </div>
              </div>

              {/* Category — expandable tree */}
              <div>
                <p className="mb-1.5 text-[11.5px] font-bold uppercase tracking-[0.06em] text-ink">Category</p>
                <div className="space-y-0.5">
                  <button
                    type="button"
                    onClick={() => handleCategoryChange('')}
                    className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-[12.5px] font-semibold transition ${
                      !filters.category ? 'bg-[#101828] text-white' : 'text-slate hover:bg-paper'
                    }`}
                  >
                    All categories
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
                              All {cat.name}
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
                <p className="mb-1.5 text-[11.5px] font-bold uppercase tracking-[0.06em] text-ink">Make</p>
                <Input
                  placeholder="e.g. HMT, BFW, Mazak"
                  value={filters.make}
                  onChange={(e) => update('make', e.target.value)}
                />
              </div>

              {/* State */}
              <div>
                <p className="mb-1.5 text-[11.5px] font-bold uppercase tracking-[0.06em] text-ink">State</p>
                <select
                  value={filters.state}
                  onChange={(e) => update('state', e.target.value)}
                  className={`${selectCls} w-full`}
                  style={{ backgroundImage: SELECT_ARROW }}
                >
                  <option value="">All India</option>
                  {INDIA_STATES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              {/* Budget */}
              <div>
                <p className="mb-1.5 text-[11.5px] font-bold uppercase tracking-[0.06em] text-ink">Budget (INR)</p>
                <div className="space-y-1.5">
                  {BUDGET_RANGES.map((range) => {
                    const active = filters.priceMin === range.min && filters.priceMax === range.max;
                    return (
                      <button
                        key={range.label}
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
                        {range.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Year */}
              <div>
                <p className="mb-1.5 text-[11.5px] font-bold uppercase tracking-[0.06em] text-ink">Manufacture Year</p>
                <div className="flex gap-2">
                  <Input
                    placeholder="From"
                    inputMode="numeric"
                    maxLength={4}
                    value={filters.yearMin}
                    onChange={(e) => update('yearMin', e.target.value)}
                  />
                  <Input
                    placeholder="To"
                    inputMode="numeric"
                    maxLength={4}
                    value={filters.yearMax}
                    onChange={(e) => update('yearMax', e.target.value)}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2 pt-2">
                <Button type="submit">
                  Apply filters
                  <ChevronRightIcon className="h-4 w-4" />
                </Button>
                <Button type="button" variant="ghost" onClick={clearAll}>
                  Clear all
                </Button>
              </div>
            </form>
          </aside>

          {/* MAIN CONTENT */}
          <div className="min-w-0 flex-1">
            {/* Mobile search bar */}
            <div className="mb-5 flex gap-2 lg:hidden">
              <div className="relative flex-1">
                <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                <Input
                  placeholder="Search..."
                  className="pl-9"
                  value={inputSearch}
                  onChange={(e) => handleSearchInput(e.target.value)}
                />
              </div>
              <select
                value={filters.category}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className={`${selectCls} w-auto`}
                style={{ backgroundImage: SELECT_ARROW }}
              >
                <option value="">Category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.name}>{cat.name}</option>
                ))}
              </select>
              <select
                value={filters.state}
                onChange={(e) => update('state', e.target.value)}
                className={`${selectCls} w-auto`}
                style={{ backgroundImage: SELECT_ARROW }}
              >
                <option value="">All India</option>
                {INDIA_STATES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
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
                  All
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

            {loading ? (
              <LoadingBlock />
            ) : !result || result.items.length === 0 ? (
              <EmptyState
                title="No listings match your filters"
                description="Try widening your search — new verified listings are added regularly."
              />
            ) : (
              <>
                <p className="mb-5 font-mono text-[11.5px] font-semibold uppercase tracking-[0.08em] text-muted">
                  {result.total} listing{result.total === 1 ? '' : 's'} found
                </p>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
                  {result.items.map((listing) => (
                    <ListingCard key={listing.id} listing={listing} />
                  ))}
                </div>

                {totalPages > 1 && (
                  <div className="mt-10 flex items-center justify-center gap-2">
                    <Button variant="ghost" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                      Previous
                    </Button>
                    <span className="px-3 font-mono text-[12.5px] font-medium text-muted">
                      Page {page} of {totalPages}
                    </span>
                    <Button variant="ghost" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
                      Next
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
