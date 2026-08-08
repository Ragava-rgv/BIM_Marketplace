import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { CategoryDto, ListingDto, PaginatedResult } from '@machinebazaar/shared';
import { api } from '../../lib/api';
import { ListingCard } from '../../components/ListingCard';
import { MonoLabel } from '../../components/ui';
import { ListingGridSkeleton } from '../../components/Skeleton';
import { INDIA_STATES } from '../../lib/india-locations';
import {
  ChevronRightIcon,
  CloseIcon,
  DocumentIcon,
  GridIcon,
  SearchIcon,
  ShieldCheckIcon,
  TruckIcon,
  VideoIcon,
  MachineIcon,
  CncTurningIcon,
  VmcIcon,
  LatheIcon,
  PressIcon,
  InjectionIcon,
  EdmIcon,
  BuildingIcon,
} from '../../components/icons';
import { HomeAdBanner } from '../../components/HomeAdBanner';

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
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [searchInput, setSearchInput] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedState, setSelectedState] = useState('');

  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [expandedCatId, setExpandedCatId] = useState<string | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState('');
  const [listings, setListings] = useState<ListingDto[] | null>(null);
  const [total, setTotal] = useState<number | null>(null);

  useEffect(() => {
    api.get<CategoryDto[]>('/categories').then(({ data }) => setCategories(data)).catch(() => {});
  }, []);

  const expandedCat = expandedCatId ? categories.find((c) => c.id === expandedCatId) ?? null : null;
  const expandedSubs = expandedCat?.subcategories ?? [];

  useEffect(() => {
    let cancelled = false;
    const params: Record<string, string | number> = { pageSize: 9, page: 1 };
    if (selectedCategory) params.category = selectedCategory;
    if (selectedSubcategory) params.subcategory = selectedSubcategory;
    if (selectedState) params.state = selectedState;
    api
      .get<PaginatedResult<ListingDto>>('/listings', { params })
      .then(({ data }) => { if (!cancelled) { setListings(data.items); setTotal(data.total); } })
      .catch(() => { if (!cancelled) { setListings([]); setTotal(0); } });
    return () => { cancelled = true; };
  }, [selectedCategory, selectedSubcategory, selectedState]);

  // Scroll to results only once the subtype panel has collapsed to its compact chip (after
  // the re-render), so the scroll lands on the results' *final* position instead of a stale
  // pre-collapse offset. Runs only when a subtype is picked, not when the chip clears it.
  useEffect(() => {
    if (!selectedSubcategory) return;
    document.getElementById('results-section')?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedSubcategory]);

  const hasFilters = !!(selectedCategory || selectedState || searchInput);

  const clearFilters = () => {
    setSelectedCategory('');
    setSelectedSubcategory('');
    setExpandedCatId(null);
    setSelectedState('');
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
    if (selectedState) params.set('state', selectedState);
    navigate(`/listings${params.toString() ? `?${params.toString()}` : ''}`);
  };

  const handleViewAll = () => {
    const params = new URLSearchParams();
    if (selectedCategory) params.set('category', selectedCategory);
    if (selectedSubcategory) params.set('subcategory', selectedSubcategory);
    if (selectedState) params.set('state', selectedState);
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
                placeholder={t('public.home.searchPlaceholder')}
                className="h-[52px] w-full rounded-[12px] border border-line bg-paper pl-11 pr-4 text-[15px] font-medium text-ink placeholder:text-muted outline-none transition focus:border-forest focus:shadow-[0_0_0_3px_rgba(45,106,79,0.12)]"
              />
            </div>
            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              aria-label={t('public.home.filters.stateLabel')}
              className="hidden h-[52px] w-[150px] shrink-0 appearance-none rounded-[12px] border border-line bg-paper px-3.5 text-[13.5px] font-medium text-ink outline-none transition hover:border-forest focus:border-forest sm:block"
            >
              <option value="">{t('public.home.filters.allIndia')}</option>
              {INDIA_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <button
              type="submit"
              className="h-[52px] shrink-0 rounded-[12px] bg-forest px-6 text-[14px] font-bold text-white transition hover:bg-forest-2"
            >
              {t('common:common.button.search')}
            </button>
          </form>

          {total !== null && (
            <div className="mt-4 font-mono text-[12px] font-semibold text-muted">
              <span className="font-bold text-forest">{formatCount(total)}</span> {t('public.home.activeListings')}
            </div>
          )}
        </div>
      </div>

      {/* ── CATEGORY ROW — the single "All machines" browse row (bold copper pill +
          outline category chips), with inline subtype-tile expansion beneath. Same
          row and behavior on every breakpoint; sits directly below the search bar. ── */}
      <div className="border-y border-line bg-white px-6 lg:px-[52px]">
        <div className="mx-auto max-w-7xl">
          {/* Primary category chip row */}
          <div className="flex gap-2 overflow-x-auto py-3" style={{ scrollbarWidth: 'none' }}>
            <button
              type="button"
              onClick={() => { setExpandedCatId(null); setSelectedCategory(''); setSelectedSubcategory(''); }}
              className="flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full bg-copper px-4 py-1.5 text-[13px] font-bold text-white transition hover:bg-copper-2"
            >
              <GridIcon className="h-3.5 w-3.5" />
              {t('public.home.allMachines')}
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
                {expandedCat.name} — {t('public.home.subtypes')}
              </p>

              {/* Mobile: once a machine type is picked, collapse the full subtype grid into a
                  compact chip so results land right below without scrolling past the whole
                  list — tapping the chip clears the pick and reopens the grid to change it.
                  Desktop keeps the full grid visible either way (more room, less scroll cost). */}
              {selectedSubcategory && (
                <button
                  type="button"
                  onClick={() => setSelectedSubcategory('')}
                  className="mb-1 flex items-center gap-2 rounded-full border border-copper bg-[#FEF6EC] px-3.5 py-2 text-[12.5px] font-semibold text-copper lg:hidden"
                >
                  <span className="flex-1 truncate text-left">{selectedSubcategory}</span>
                  {(() => {
                    const activeSub = expandedSubs.find((s) => s.name === selectedSubcategory);
                    return activeSub && activeSub.listingCount > 0 ? (
                      <span className="shrink-0 rounded-full bg-copper px-1.5 py-0.5 font-mono text-[9.5px] font-bold text-white">
                        {activeSub.listingCount.toLocaleString('en-IN')}
                      </span>
                    ) : null;
                  })()}
                  <CloseIcon className="h-3.5 w-3.5 shrink-0" />
                </button>
              )}

              <div className={`grid grid-cols-2 gap-1.5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 ${selectedSubcategory ? 'hidden lg:grid' : ''}`}>
                {expandedSubs.map((sub) => {
                  const isActive = selectedSubcategory === sub.name;
                  return (
                    <button
                      key={sub.id}
                      type="button"
                      onClick={() => setSelectedSubcategory(isActive ? '' : sub.name)}
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

      {/* ── WIDE AD BANNER (admin-managed, placement=HOME_BANNER) ────────── */}
      <div className="px-6 pb-6 pt-6 lg:px-[52px]">
        <div className="mx-auto max-w-7xl">
          <HomeAdBanner />
        </div>
      </div>

      {/* ── BROWSE BY INDUSTRY GRID ──────────────────────────────────────── */}
      <div className="bg-[#F9FAFB] px-6 py-6 lg:px-[52px]">
        <div className="mx-auto max-w-7xl">
          <div className="mb-4 flex items-end justify-between">
            <div>
              <MonoLabel className="text-copper">— {t('public.home.browseByIndustry')}</MonoLabel>
              <h2 className="mt-1.5 font-display text-[24px] font-medium tracking-[-0.6px] text-ink sm:text-[28px]">
                {t('public.home.industryHeading')}
              </h2>
            </div>
            <Link
              to="/listings"
              className="hidden sm:inline-flex items-center gap-1.5 border-b border-ink pb-0.5 text-[13px] font-bold text-ink transition hover:border-forest hover:text-forest"
            >
              {t('public.home.browseAll')}
              <ChevronRightIcon className="h-3.5 w-3.5" />
            </Link>
          </div>

          {/* Mobile: 3 compact columns so the whole set reads at a glance with minimal
              scrolling; widens to the original 4/3-image tiles from sm: up. */}
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-5">
            {categories.map((cat) => {
              const CatIcon = CATEGORY_ICON_MAP[cat.slug] ?? MachineIcon;
              const subCount = cat.subcategories?.length ?? 0;
              const isActive = selectedCategory === cat.name;
              const image = cat.thumbnailUrl || cat.imageUrl;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    handleCategoryChipClick(cat);
                    document.getElementById('results-section')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className={`group relative overflow-hidden rounded-[10px] border text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-[#101828] hover:shadow-[0_12px_28px_rgba(15,30,26,0.08)] sm:rounded-[14px] ${
                    isActive ? 'border-copper bg-[#FEF6EC]' : 'border-line bg-white'
                  }`}
                >
                  <div className={`flex aspect-square items-center justify-center sm:aspect-[4/3] ${isActive ? 'bg-[#FEF6EC]' : 'bg-gradient-to-br from-paper-2 to-paper'}`}>
                    {image ? (
                      <img src={image} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <CatIcon className={`h-7 w-7 sm:h-10 sm:w-10 ${isActive ? 'text-copper' : 'text-muted'}`} />
                    )}
                  </div>
                  <div className="p-1.5 pb-2 sm:p-3.5 sm:pb-4">
                    <p className={`line-clamp-2 text-[10.5px] font-bold leading-tight tracking-[-0.1px] sm:line-clamp-1 sm:text-[13px] sm:tracking-[-0.2px] ${isActive ? 'text-copper' : 'text-ink'}`}>
                      {cat.name}
                    </p>
                    <div className="mt-1 hidden items-center gap-1.5 sm:flex">
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

      {/* ── RESULTS ───────────────────────────────────────────────────────── */}
      <div id="results-section" className="px-6 py-8 lg:px-[52px]">
        <div className="mx-auto max-w-7xl">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <MonoLabel className="text-copper">— {t('public.home.filterResults')}</MonoLabel>
              {total !== null && (
                <p className="mt-0.5 text-[13px] text-muted">
                  <span className="font-bold text-ink">{formatCount(total)}</span> {t('public.home.machinesMatchFilters')}
                </p>
              )}
            </div>
            {hasFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="text-[13px] font-semibold text-muted underline underline-offset-2 transition hover:text-ink"
              >
                {t('common:common.button.clearFilters')}
              </button>
            )}
          </div>

          {/* Results */}
          <div className="rounded-[14px] border border-line bg-white p-5">
            {listings === null ? (
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
                <ListingGridSkeleton />
              </div>
            ) : listings.length === 0 ? (
              <div className="rounded-xl border border-dashed border-line px-6 py-14 text-center text-[13px] text-muted">
                {t('public.home.results.empty')}{' '}
                {hasFilters && (
                  <button type="button" onClick={clearFilters} className="font-semibold text-forest underline">
                    {t('common:common.button.clearFilters')}
                  </button>
                )}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
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
                    {t('public.home.results.viewAll', { count: formatCount(total) })}
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
            { icon: ShieldCheckIcon, label: t('public.home.trustStrip.gstVerified') },
            { icon: DocumentIcon, label: t('public.home.trustStrip.bankCertification') },
            { icon: TruckIcon, label: t('public.home.trustStrip.buyback') },
            { icon: VideoIcon, label: t('public.home.trustStrip.timestampedMedia') },
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
