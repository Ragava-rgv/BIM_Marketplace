import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { CategoryDto, PaginatedResult, RequirementDto } from '../../shared';
import { api } from '../../lib/api';
import { formatInr, formatRelativeDate } from '../../lib/format';
import { useAuth } from '../../lib/auth-context';
import { MonoLabel, EmptyState, Select, Button } from '../../components/ui';
import { Skeleton } from '../../components/Skeleton';
import { ChevronRightIcon, ClockIcon, MachineIcon, MapPinIcon, PlusIcon, SearchIcon } from '../../components/icons';

const PAGE_SIZE = 10;

function humanizeSpecKey(key: string): string {
  const withSpaces = key.replace(/([a-z0-9])([A-Z])/g, '$1 $2');
  return withSpaces.charAt(0).toUpperCase() + withSpaces.slice(1);
}

function formatSpecValue(value: unknown): string {
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  return String(value);
}

function RequirementRowSkeleton() {
  return (
    <div className="flex flex-col gap-4 rounded-xl border border-[#E4E7EC] bg-white p-4 sm:flex-row sm:p-5">
      <Skeleton className="h-[100px] w-full shrink-0 rounded-lg sm:w-[140px]" />
      <div className="flex-1">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="mt-2.5 h-5 w-2/3" />
        <Skeleton className="mt-2.5 h-3 w-1/3" />
        <Skeleton className="mt-3 h-4 w-1/4" />
      </div>
      <Skeleton className="h-10 w-full shrink-0 rounded-lg sm:w-[130px]" />
    </div>
  );
}

function RequirementRow({ req }: { req: RequirementDto }) {
  const { t, i18n } = useTranslation();
  const locale = `${i18n.resolvedLanguage ?? 'en'}-IN`;
  const photo = req.media?.find((m) => m.type === 'PHOTO');
  const budget =
    req.budgetMin && req.budgetMax
      ? `${formatInr(req.budgetMin)} – ${formatInr(req.budgetMax)}`
      : req.budgetMax
        ? `${t('public.wanted.upTo')} ${formatInr(req.budgetMax)}`
        : null;
  const specEntries = req.specs
    ? Object.entries(req.specs).filter(([, v]) => v !== null && v !== undefined && v !== '').slice(0, 4)
    : [];

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-[#E4E7EC] bg-white p-4 transition-all duration-[180ms] hover:border-forest hover:shadow-[0_8px_28px_rgba(16,24,40,.08)] sm:flex-row sm:items-start sm:p-5">
      <Link
        to={`/wanted/${req.id}`}
        className="flex h-[100px] w-full shrink-0 items-center justify-center overflow-hidden rounded-lg border border-[#E4E7EC] bg-[#F9FAFB] sm:h-[100px] sm:w-[140px]"
      >
        {photo ? (
          <img src={photo.url} alt={req.title} className="h-full w-full object-cover" />
        ) : (
          <MachineIcon className="h-9 w-9 text-forest opacity-20" />
        )}
      </Link>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center rounded-[6px] bg-[#EEF2F6] px-2 py-[3px] text-[11px] font-semibold text-[#475467]">
            {req.machineCategory}
          </span>
          {req.machineSubcategory && <span className="text-[11.5px] text-muted">{req.machineSubcategory}</span>}
        </div>

        <Link to={`/wanted/${req.id}`} className="mt-1.5 block truncate text-[17px] font-bold text-ink transition hover:text-forest sm:text-[18px]">
          {req.title}
        </Link>

        <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12.5px] text-muted">
          {req.postedAt && (
            <span className="flex items-center gap-1">
              <ClockIcon className="h-3.5 w-3.5" />
              {t('common:listing.posted', { date: formatRelativeDate(req.postedAt, locale) })}
            </span>
          )}
          {(req.locationCity || req.locationState) && (
            <span className="flex items-center gap-1">
              <MapPinIcon className="h-3.5 w-3.5" />
              {[req.locationCity, req.locationState].filter(Boolean).join(', ')}
            </span>
          )}
        </div>

        {specEntries.length > 0 && (
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {specEntries.map(([key, value]) => (
              <span key={key} className="rounded-[6px] bg-paper-2 px-2 py-1 text-[11.5px] font-medium text-slate">
                {humanizeSpecKey(key)}: <span className="font-semibold text-ink">{formatSpecValue(value)}</span>
              </span>
            ))}
          </div>
        )}

        {budget && <p className="mt-2.5 font-mono text-[15px] font-bold text-forest">{budget}</p>}
      </div>

      <Link
        to={`/wanted/${req.id}`}
        className="inline-flex w-full shrink-0 items-center justify-center gap-1.5 rounded-lg bg-copper px-5 py-2.5 text-[13.5px] font-bold text-white transition hover:bg-copper-2 sm:w-auto"
      >
        {t('public.wanted.giveQuote')}
        <ChevronRightIcon className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}

export function Wanted() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [result, setResult] = useState<PaginatedResult<RequirementDto> | null>(null);
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sort, setSort] = useState<'newest' | 'oldest'>('newest');
  const [page, setPage] = useState(1);
  const category = searchParams.get('category') ?? '';

  useEffect(() => {
    api.get<CategoryDto[]>('/categories').then(({ data }) => setCategories(data)).catch(() => {});
  }, []);

  // Debounce the free-text search so we're not firing a request on every keystroke.
  useEffect(() => {
    const handle = setTimeout(() => setDebouncedSearch(searchInput.trim()), 300);
    return () => clearTimeout(handle);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
  }, [category, debouncedSearch]);

  useEffect(() => {
    let cancelled = false;
    const params: Record<string, string | number> = { page, pageSize: PAGE_SIZE };
    if (category) params.category = category;
    if (debouncedSearch) params.search = debouncedSearch;
    api
      .get<PaginatedResult<RequirementDto>>('/requirements', { params })
      .then(({ data }) => { if (!cancelled) setResult(data); })
      .catch(() => { if (!cancelled) setResult({ items: [], total: 0, page: 1, pageSize: PAGE_SIZE }); });
    return () => { cancelled = true; };
  }, [category, debouncedSearch, page]);

  // Server already sorts newest-first; "oldest" just reverses the loaded page rather than
  // re-querying, since the API doesn't expose a sort param.
  const sortedItems = useMemo(() => {
    if (!result) return [];
    return sort === 'oldest' ? [...result.items].reverse() : result.items;
  }, [result, sort]);

  const totalPages = result ? Math.max(1, Math.ceil(result.total / result.pageSize)) : 1;

  return (
    <div className="mx-auto max-w-7xl px-6 py-8 lg:px-[52px]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <MonoLabel className="text-copper">— {t('public.wanted.eyebrow')}</MonoLabel>
          <h1 className="mt-1.5 font-display text-[28px] font-medium tracking-[-0.6px] text-ink sm:text-[34px]">
            {t('public.wanted.title')}
          </h1>
          <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-muted">{t('public.wanted.intro')}</p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2.5">
          <Button
            variant="copper"
            onClick={() => navigate(user ? '/buyer/requirements/new' : '/signup')}
          >
            <PlusIcon className="h-4 w-4" />
            {t('public.wanted.postRequirement')}
          </Button>
          {result !== null && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-copper-bg px-3.5 py-1.5 font-mono text-[11.5px] font-bold uppercase tracking-[0.06em] text-copper">
              <span className="h-1.5 w-1.5 rounded-full bg-copper" />
              {t('public.wanted.activeCount', { count: result.total })}
            </span>
          )}
        </div>
      </div>

      {/* Search + category + sort */}
      <div className="mt-6 flex flex-col gap-2.5 sm:flex-row sm:flex-wrap">
        <div className="relative flex-1 sm:min-w-[220px]">
          <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder={t('public.wanted.searchPlaceholder')}
            className="h-[44px] w-full rounded-lg border border-line bg-white pl-10 pr-3.5 text-[14px] text-ink placeholder:text-muted outline-none transition focus:border-forest focus:ring-2 focus:ring-forest/10"
          />
        </div>
        <div className="sm:w-[220px]">
          <Select value={category} onChange={(e) => setSearchParams(e.target.value ? { category: e.target.value } : {})}>
            <option value="">{t('public.wanted.allCategories')}</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.name}>{cat.name}</option>
            ))}
          </Select>
        </div>
        <div className="sm:w-[170px]">
          <Select value={sort} onChange={(e) => setSort(e.target.value as 'newest' | 'oldest')}>
            <option value="newest">{t('public.wanted.sort.newest')}</option>
            <option value="oldest">{t('public.wanted.sort.oldest')}</option>
          </Select>
        </div>
      </div>

      {result !== null && result.total > 0 && (
        <p className="mt-5 font-mono text-[12px] font-semibold text-muted">
          {t('public.wanted.resultsCount', { shown: sortedItems.length, total: result.total })}
        </p>
      )}

      <div className="mt-3">
        {result === null ? (
          <div className="flex flex-col gap-4">
            {Array.from({ length: 5 }).map((_, i) => <RequirementRowSkeleton key={i} />)}
          </div>
        ) : sortedItems.length === 0 ? (
          <EmptyState title={t('public.wanted.emptyState.title')} description={t('public.wanted.emptyState.description')} />
        ) : (
          <>
            <div className="flex flex-col gap-4">
              {sortedItems.map((req) => (
                <RequirementRow key={req.id} req={req} />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-2">
                <Button variant="ghost" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                  {t('common:common.button.back')}
                </Button>
                <span className="px-3 font-mono text-[12.5px] font-medium text-muted">
                  {t('public.wanted.pageOf', { page, totalPages })}
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
