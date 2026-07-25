import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { CategoryDto, ListingDto, PaginatedResult } from '@machinebazaar/shared';
import { api } from '../../lib/api';
import { ListingCard } from '../../components/ListingCard';
import { MonoLabel } from '../../components/ui';
import { ListingGridSkeleton } from '../../components/Skeleton';
import { INDIA_STATES } from '../../lib/india-locations';
import {
  ChevronRightIcon,
  ClockIcon,
  DocumentIcon,
  CheckCircleIcon,
  SearchIcon,
  ShieldCheckIcon,
  TruckIcon,
  VideoIcon,
  MachineIcon,
  BankIcon,
  CncTurningIcon,
  VmcIcon,
  LatheIcon,
  PressIcon,
  InjectionIcon,
  EdmIcon,
  BuildingIcon,
} from '../../components/icons';

const BUDGET_PRESETS = [
  { label: 'Any', min: '', max: '' },
  { label: 'Under ₹5L', min: '', max: '500000' },
  { label: '₹5L – ₹20L', min: '500000', max: '2000000' },
  { label: '₹20L – ₹50L', min: '2000000', max: '5000000' },
  { label: '₹50L – ₹1Cr', min: '5000000', max: '10000000' },
  { label: '₹1Cr – ₹3Cr', min: '10000000', max: '30000000' },
  { label: 'Above ₹3Cr', min: '30000000', max: '' },
];

const CATEGORY_ICON_MAP: Record<string, (p: { className?: string }) => React.ReactElement> = {
  metalworking: CncTurningIcon,
  'sheet-metal': PressIcon,
  'plastic-rubber': InjectionIcon,
  textile: MachineIcon,
  printing: DocumentIcon,
  packaging: BuildingIcon,
  'pharma-chemical': EdmIcon,
  'food-processing': MachineIcon,
  woodworking: LatheIcon,
  'industrial-equipment': VmcIcon,
};

function formatCount(n: number | null): string {
  if (n === null) return '—';
  return n.toLocaleString('en-IN');
}

export function Home() {
  const navigate = useNavigate();

  const [searchInput, setSearchInput] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [budgetIdx, setBudgetIdx] = useState(0);
  const [brandInput, setBrandInput] = useState('');
  const [financeAvailable, setFinanceAvailable] = useState(false);
  const [certifiedOnly, setCertifiedOnly] = useState(false);

  const [descInput, setDescInput] = useState('');
  const [descOpen, setDescOpen] = useState(false);
  const descRef = useRef<HTMLDivElement>(null);

  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [expandedCatId, setExpandedCatId] = useState<string | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState('');
  const [listings, setListings] = useState<ListingDto[] | null>(null);
  const [total, setTotal] = useState<number | null>(null);

  const budget = BUDGET_PRESETS[budgetIdx];

  useEffect(() => {
    api.get<CategoryDto[]>('/categories').then(({ data }) => setCategories(data)).catch(() => {});
  }, []);

  const descMatches = descInput.trim().length >= 2
    ? categories.filter((c) =>
        c.name.toLowerCase().includes(descInput.toLowerCase()) ||
        (c.description ?? '').toLowerCase().includes(descInput.toLowerCase())
      )
    : [];

  const expandedCat = expandedCatId ? categories.find((c) => c.id === expandedCatId) ?? null : null;
  const expandedSubs = expandedCat?.subcategories ?? [];

  useEffect(() => {
    let cancelled = false;
    const params: Record<string, string | number> = { pageSize: 9, page: 1 };
    if (selectedCategory) params.category = selectedCategory;
    if (selectedSubcategory) params.subcategory = selectedSubcategory;
    if (selectedState) params.state = selectedState;
    if (budget.min) params.priceMin = budget.min;
    if (budget.max) params.priceMax = budget.max;
    if (brandInput.trim()) params.make = brandInput.trim();
    api
      .get<PaginatedResult<ListingDto>>('/listings', { params })
      .then(({ data }) => { if (!cancelled) { setListings(data.items); setTotal(data.total); } })
      .catch(() => { if (!cancelled) { setListings([]); setTotal(0); } });
    return () => { cancelled = true; };
  }, [selectedCategory, selectedSubcategory, selectedState, budgetIdx, brandInput]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (descRef.current && !descRef.current.contains(e.target as Node)) setDescOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const hasFilters = !!(selectedCategory || selectedState || budgetIdx > 0 || brandInput || financeAvailable || certifiedOnly);

  const clearFilters = () => {
    setSelectedCategory('');
    setSelectedSubcategory('');
    setExpandedCatId(null);
    setSelectedState('');
    setBudgetIdx(0);
    setBrandInput('');
    setFinanceAvailable(false);
    setCertifiedOnly(false);
    setSearchInput('');
  };

  const handleCategoryChipClick = (cat: CategoryDto) => {
    if (expandedCatId === cat.id) {
      // Collapse: clear everything
      setExpandedCatId(null);
      setSelectedCategory('');
      setSelectedSubcategory('');
    } else {
      setExpandedCatId(cat.id);
      setSelectedCategory(cat.name);
      setSelectedSubcategory('');
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchInput.trim()) params.set('search', searchInput.trim());
    if (selectedCategory) params.set('category', selectedCategory);
    if (selectedSubcategory) params.set('subcategory', selectedSubcategory);
    navigate(`/listings${params.toString() ? `?${params.toString()}` : ''}`);
  };

  const handleViewAll = () => {
    const params = new URLSearchParams();
    if (selectedCategory) params.set('category', selectedCategory);
    if (selectedSubcategory) params.set('subcategory', selectedSubcategory);
    if (selectedState) params.set('state', selectedState);
    if (budget.min) params.set('priceMin', budget.min);
    if (budget.max) params.set('priceMax', budget.max);
    navigate(`/listings${params.toString() ? `?${params.toString()}` : ''}`);
  };

  return (
    <div>
      {/* ── SEARCH + TRUST CHIPS ─────────────────────────────────────────── */}
      <div className="bg-white px-6 pt-8 pb-6 lg:px-[52px]">
        <div className="mx-auto max-w-7xl">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <SearchIcon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search machines, makes, models…"
                className="h-[52px] w-full rounded-[12px] border border-line bg-paper pl-11 pr-4 text-[15px] font-medium text-ink placeholder:text-muted outline-none transition focus:border-forest focus:shadow-[0_0_0_3px_rgba(45,106,79,0.12)]"
              />
            </div>
            <button
              type="submit"
              className="h-[52px] shrink-0 rounded-[12px] bg-forest px-6 text-[14px] font-bold text-white transition hover:bg-forest-2"
            >
              Search
            </button>
          </form>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            {[
              { icon: ShieldCheckIcon, text: '100% GST verified sellers' },
              { icon: BankIcon, text: '12 bank & NBFC partners' },
              { icon: ClockIcon, text: '24h listing review' },
            ].map(({ icon: Icon, text }) => (
              <span
                key={text}
                className="inline-flex items-center gap-1.5 rounded-full border border-line bg-paper px-3 py-1 text-[12px] font-semibold text-slate"
              >
                <Icon className="h-3.5 w-3.5 text-forest" />
                {text}
              </span>
            ))}
            {total !== null && (
              <span className="ml-auto font-mono text-[12px] font-semibold text-muted">
                <span className="font-bold text-forest">{formatCount(total)}</span> active listings
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── CATEGORY CHIPS + SUBCATEGORY EXPANSION ───────────────────────── */}
      <div className="border-y border-line bg-white px-6 lg:px-[52px]">
        <div className="mx-auto max-w-7xl">
          {/* Primary category chip row */}
          <div className="flex gap-2 overflow-x-auto py-3" style={{ scrollbarWidth: 'none' }}>
            <button
              type="button"
              onClick={() => { setExpandedCatId(null); setSelectedCategory(''); setSelectedSubcategory(''); }}
              className={`shrink-0 whitespace-nowrap rounded-full border px-4 py-1.5 text-[13px] font-semibold transition ${
                !selectedCategory
                  ? 'border-[#101828] bg-[#101828] text-white'
                  : 'border-line bg-white text-slate hover:border-[#101828] hover:text-[#101828]'
              }`}
            >
              All machines
            </button>
            {categories.map((cat) => {
              const isActive = selectedCategory === cat.name;
              const isExpanded = expandedCatId === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => handleCategoryChipClick(cat)}
                  className={`group shrink-0 inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-4 py-1.5 text-[13px] font-semibold transition ${
                    isActive
                      ? 'border-copper bg-copper text-white'
                      : 'border-line bg-white text-slate hover:border-copper hover:text-copper'
                  }`}
                >
                  {cat.name}
                  {cat.listingCount > 0 && (
                    <span className={`font-mono text-[10px] font-bold ${isActive ? 'text-white/80' : 'text-muted'}`}>
                      {cat.listingCount.toLocaleString('en-IN')}
                    </span>
                  )}
                  <ChevronRightIcon className={`h-3 w-3 transition-transform ${isExpanded ? 'rotate-90' : 'rotate-0'} ${isActive ? 'text-white/70' : 'text-muted'}`} />
                </button>
              );
            })}
          </div>

          {/* Subcategory expansion panel */}
          {expandedCat && expandedSubs.length > 0 && (
            <div className="border-t border-line pb-4 pt-3">
              <p className="mb-2.5 font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-muted">
                {expandedCat.name} — subtypes
              </p>
              <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {expandedSubs.map((sub) => {
                  const isActive = selectedSubcategory === sub.name;
                  return (
                    <button
                      key={sub.id}
                      type="button"
                      onClick={() => {
                        setSelectedSubcategory(isActive ? '' : sub.name);
                        document.getElementById('results-section')?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className={`flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-left text-[12px] font-semibold transition ${
                        isActive
                          ? 'border-copper bg-[#FEF6EC] text-copper'
                          : 'border-line bg-white text-slate hover:border-copper hover:text-copper'
                      }`}
                    >
                      <span className="line-clamp-1 flex-1">{sub.name}</span>
                      {sub.listingCount > 0 && (
                        <span className={`shrink-0 rounded-full px-1.5 py-0.5 font-mono text-[9.5px] font-bold ${
                          isActive ? 'bg-copper text-white' : 'bg-paper-2 text-muted'
                        }`}>
                          {sub.listingCount.toLocaleString('en-IN')}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── BROWSE BY INDUSTRY GRID ──────────────────────────────────────── */}
      <div className="bg-[#F9FAFB] px-6 py-10 lg:px-[52px]">
        <div className="mx-auto max-w-7xl">
          <div className="mb-6 flex items-end justify-between">
            <div>
              <MonoLabel className="text-copper">— Browse by industry</MonoLabel>
              <h2 className="mt-1.5 font-display text-[24px] font-medium tracking-[-0.6px] text-ink sm:text-[28px]">
                Find your <em className="not-italic italic text-copper">machine type.</em>
              </h2>
            </div>
            <Link
              to="/listings"
              className="hidden sm:inline-flex items-center gap-1.5 border-b border-ink pb-0.5 text-[13px] font-bold text-ink transition hover:border-forest hover:text-forest"
            >
              Browse all
              <ChevronRightIcon className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {categories.map((cat) => {
              const CatIcon = CATEGORY_ICON_MAP[cat.slug] ?? MachineIcon;
              const subCount = cat.subcategories?.length ?? 0;
              const isActive = selectedCategory === cat.name;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    handleCategoryChipClick(cat);
                    document.getElementById('results-section')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className={`group relative overflow-hidden rounded-[14px] border text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-[#101828] hover:shadow-[0_12px_28px_rgba(15,30,26,0.08)] ${
                    isActive ? 'border-copper bg-[#FEF6EC]' : 'border-line bg-white'
                  }`}
                >
                  <div className={`flex aspect-[4/3] items-center justify-center ${isActive ? 'bg-[#FEF6EC]' : 'bg-gradient-to-br from-paper-2 to-paper'}`}>
                    <CatIcon className={`h-10 w-10 ${isActive ? 'text-copper' : 'text-muted'}`} />
                  </div>
                  <div className="p-3.5 pb-4">
                    <p className={`text-[13px] font-bold leading-tight tracking-[-0.2px] ${isActive ? 'text-copper' : 'text-ink'}`}>
                      {cat.name}
                    </p>
                    <div className="mt-1 flex items-center gap-1.5">
                      {subCount > 0 && (
                        <p className="font-mono text-[10.5px] font-medium text-muted">
                          {subCount} types
                        </p>
                      )}
                      {cat.listingCount > 0 && (
                        <span className={`rounded-full px-1.5 py-0.5 font-mono text-[9.5px] font-bold ${
                          isActive ? 'bg-copper text-white' : 'bg-paper-2 text-muted'
                        }`}>
                          {cat.listingCount.toLocaleString('en-IN')}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── ADVANCED FILTERS + RESULTS ───────────────────────────────────── */}
      <div id="results-section" className="px-6 py-10 lg:px-[52px]">
        <div className="mx-auto max-w-7xl">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <MonoLabel className="text-copper">— Filter results</MonoLabel>
              {total !== null && (
                <p className="mt-0.5 text-[13px] text-muted">
                  <span className="font-bold text-ink">{formatCount(total)}</span> machines match your filters
                </p>
              )}
            </div>
            {hasFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="text-[13px] font-semibold text-muted underline underline-offset-2 transition hover:text-ink"
              >
                Clear all
              </button>
            )}
          </div>

          <div className="mb-5 rounded-[14px] border border-line bg-white p-5 space-y-4">
            {/* Budget presets */}
            <div>
              <p className="mb-2 font-mono text-[11px] font-semibold uppercase tracking-[0.05em] text-muted">Budget</p>
              <div className="flex flex-wrap gap-1.5">
                {BUDGET_PRESETS.map((p, i) => (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => setBudgetIdx(i)}
                    className={`rounded-full border px-3 py-1 text-[12px] font-semibold transition ${
                      budgetIdx === i
                        ? 'border-forest bg-forest text-white'
                        : 'border-line text-slate hover:border-forest hover:text-forest'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Location + Brand */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <p className="mb-2 font-mono text-[11px] font-semibold uppercase tracking-[0.05em] text-muted">State</p>
                <select
                  value={selectedState}
                  onChange={(e) => setSelectedState(e.target.value)}
                  className="h-[38px] w-full appearance-none rounded-lg border border-line bg-paper px-3 text-[13.5px] font-medium text-ink outline-none transition hover:border-forest focus:border-forest"
                >
                  <option value="">All India</option>
                  {INDIA_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <p className="mb-2 font-mono text-[11px] font-semibold uppercase tracking-[0.05em] text-muted">Brand / Make</p>
                <input
                  type="text"
                  value={brandInput}
                  onChange={(e) => setBrandInput(e.target.value)}
                  placeholder="e.g. BFW, Bharat Fritz, LMW…"
                  className="h-[38px] w-full rounded-lg border border-line bg-paper px-3 text-[13.5px] font-medium text-ink placeholder:text-muted outline-none transition hover:border-forest focus:border-forest"
                />
              </div>
            </div>

            {/* Toggle pills */}
            <div className="flex flex-wrap items-center gap-3 border-t border-line pt-4">
              <p className="mr-1 font-mono text-[11px] font-semibold uppercase tracking-[0.05em] text-muted">Quick filters</p>
              <button
                type="button"
                onClick={() => setFinanceAvailable((v) => !v)}
                className={`inline-flex h-[34px] items-center gap-1.5 rounded-full border px-4 text-[12.5px] font-semibold transition ${
                  financeAvailable ? 'border-[#93C5FD] bg-[#EFF6FF] text-[#1D4ED8]' : 'border-line text-slate hover:border-forest hover:text-forest'
                }`}
              >
                {financeAvailable && <CheckCircleIcon className="h-3.5 w-3.5" />}
                Finance available
              </button>
              <button
                type="button"
                onClick={() => setCertifiedOnly((v) => !v)}
                className={`inline-flex h-[34px] items-center gap-1.5 rounded-full border px-4 text-[12.5px] font-semibold transition ${
                  certifiedOnly ? 'border-[#BFE3D2] bg-[#EDF7F2] text-[#1B4332]' : 'border-line text-slate hover:border-forest hover:text-forest'
                }`}
              >
                {certifiedOnly && <CheckCircleIcon className="h-3.5 w-3.5" />}
                Certified only
              </button>
            </div>

            {/* "Not sure what it's called?" */}
            <div ref={descRef} className="relative border-t border-line pt-4">
              <p className="mb-2 font-mono text-[11px] font-semibold uppercase tracking-[0.05em] text-muted">
                Not sure what it&apos;s called?
              </p>
              <input
                type="text"
                value={descInput}
                onChange={(e) => { setDescInput(e.target.value); setDescOpen(true); }}
                onFocus={() => descInput.length >= 2 && setDescOpen(true)}
                placeholder='Describe it — e.g. "cuts metal sheets", "bends pipes", "prints labels"…'
                className="h-[38px] w-full rounded-lg border border-line bg-paper px-3 text-[13.5px] font-medium text-ink placeholder:text-muted outline-none transition hover:border-forest focus:border-forest"
              />
              {descOpen && descMatches.length > 0 && (
                <div className="absolute left-0 right-0 top-full z-20 mt-1 rounded-[10px] border border-line bg-white shadow-[0_8px_24px_rgba(0,0,0,0.08)]">
                  {descMatches.slice(0, 5).map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => { setSelectedCategory(cat.name); setExpandedCatId(cat.id); setSelectedSubcategory(''); setDescInput(''); setDescOpen(false); }}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-[13px] transition hover:bg-paper first:rounded-t-[10px] last:rounded-b-[10px]"
                    >
                      <MachineIcon className="h-4 w-4 shrink-0 text-copper" />
                      <span className="font-semibold text-ink">{cat.name}</span>
                      {cat.description && (
                        <span className="ml-1 line-clamp-1 text-muted">{cat.description}</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Results */}
          <div className="rounded-[14px] border border-line bg-white p-5">
            {listings === null ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <ListingGridSkeleton />
              </div>
            ) : listings.length === 0 ? (
              <div className="rounded-xl border border-dashed border-line px-6 py-14 text-center text-[13px] text-muted">
                No listings match your filters.{' '}
                {hasFilters && (
                  <button type="button" onClick={clearFilters} className="font-semibold text-forest underline">
                    Clear all filters
                  </button>
                )}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {listings.map((listing) => (
                    <ListingCard key={listing.id} listing={listing} />
                  ))}
                </div>
                <div className="mt-6 text-center">
                  <button
                    type="button"
                    onClick={handleViewAll}
                    className="inline-flex items-center gap-2 rounded-[10px] border border-line bg-white px-7 py-2.5 text-[13.5px] font-semibold text-[#344054] transition hover:border-ink hover:text-ink"
                  >
                    View all {formatCount(total)} machines
                    <ChevronRightIcon className="h-4 w-4" />
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── TRUST STRIP ──────────────────────────────────────────────────── */}
      <div className="border-y border-line bg-white px-6 py-6 lg:px-[52px]">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-8 gap-y-3">
          {[
            { icon: ShieldCheckIcon, label: 'GST-verified sellers' },
            { icon: DocumentIcon, label: 'Bank-accepted certification' },
            { icon: TruckIcon, label: 'Structured buyback' },
            { icon: VideoIcon, label: 'Timestamped media' },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-2 text-[13px] font-semibold text-ink">
              <item.icon className="h-4 w-4 text-forest" />
              {item.label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
