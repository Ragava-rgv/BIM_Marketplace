import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ListingDto } from '@machinebazaar/shared';
import { MACHINE_CATEGORIES } from '@machinebazaar/shared';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth-context';
import { AppLayout } from '../components/AppLayout';
import { ListingCard } from '../components/ListingCard';
import { SearchIcon, MapPinIcon } from '../components/icons';

// Short chip labels for horizontal scroll
const CAT_SHORT: Record<string, string> = {
  metalworking:           'Metal',
  'sheet-metal':          'Sheet Metal',
  'plastic-rubber':       'Plastic',
  textile:                'Textile',
  printing:               'Printing',
  packaging:              'Packaging',
  'pharma-chemical':      'Pharma',
  'food-processing':      'Food',
  woodworking:            'Wood',
  'industrial-equipment': 'Industrial',
};

// Per-category: [dark accent, light background] — alternating navy / copper
const CAT_COLORS: Record<string, [string, string]> = {
  metalworking:           ['#101828', '#EEF1F6'],
  'sheet-metal':          ['#E8820C', '#FEF6EC'],
  'plastic-rubber':       ['#101828', '#EEF1F6'],
  textile:                ['#E8820C', '#FEF6EC'],
  printing:               ['#101828', '#EEF1F6'],
  packaging:              ['#E8820C', '#FEF6EC'],
  'pharma-chemical':      ['#101828', '#EEF1F6'],
  'food-processing':      ['#E8820C', '#FEF6EC'],
  woodworking:            ['#101828', '#EEF1F6'],
  'industrial-equipment': ['#E8820C', '#FEF6EC'],
};

// Machine-shaped SVG illustrations for each category
function CategorySvg({ id, color, size = 24 }: { id: string; color: string; size?: number }) {
  const w = 'white';
  const cls = `w-[${size}px] h-[${size}px]`;

  switch (id) {
    case 'metalworking':
      // 8-tooth gear with center hole
      return (
        <svg viewBox="0 0 24 24" className={cls}>
          <path fill={color} d="M12,2 L14.68,5.54 L19.07,4.93 L18.46,9.32 L22,12 L18.46,14.68 L19.07,19.07 L14.68,18.46 L12,22 L9.32,18.46 L4.93,19.07 L5.54,14.68 L2,12 L5.54,9.32 L4.93,4.93 L9.32,5.54 Z"/>
          <circle cx="12" cy="12" r="3.2" fill={w}/>
          <circle cx="12" cy="12" r="1.4" fill={color}/>
        </svg>
      );

    case 'sheet-metal':
      // Three stacked metal sheets with a laser-cut spark
      return (
        <svg viewBox="0 0 24 24" className={cls}>
          <rect x="2" y="4" width="20" height="4" rx="0.8" fill={color}/>
          <rect x="2" y="10" width="20" height="4" rx="0.8" fill={color} opacity="0.7"/>
          <rect x="2" y="16" width="20" height="4" rx="0.8" fill={color} opacity="0.45"/>
          {/* Lightning bolt (laser spark) on top sheet */}
          <path d="M15 4.5 L12 8 L14.5 8 L11 11.5 L14 7.5 L11.5 7.5 Z" fill={w}/>
        </svg>
      );

    case 'plastic-rubber':
      // Injection molding: horizontal barrel + hopper + split mold
      return (
        <svg viewBox="0 0 24 24" className={cls}>
          {/* Barrel */}
          <rect x="2" y="10" width="14" height="5" rx="2.5" fill={color}/>
          {/* Screw flights inside barrel */}
          <line x1="4.5" y1="10.5" x2="4.5" y2="14.5" stroke={w} strokeWidth="0.8"/>
          <line x1="7.2" y1="10.5" x2="7.2" y2="14.5" stroke={w} strokeWidth="0.8"/>
          <line x1="9.9" y1="10.5" x2="9.9" y2="14.5" stroke={w} strokeWidth="0.8"/>
          <line x1="12.6" y1="10.5" x2="12.6" y2="14.5" stroke={w} strokeWidth="0.8"/>
          {/* Nozzle tip */}
          <path d="M16 11.2 L19.5 12.5 L16 13.8 Z" fill={color}/>
          {/* Hopper (triangle above barrel) */}
          <path d="M5.5 10 L8 4.5 L12 4.5 L14 10 Z" fill={color}/>
          <path d="M7 10 L8.8 6 L11.2 6 L13 10 Z" fill={w} opacity="0.35"/>
          {/* Split mold halves (right) */}
          <rect x="20" y="8.5" width="3" height="3" rx="0.5" fill={color}/>
          <rect x="20" y="13.5" width="3" height="3" rx="0.5" fill={color}/>
        </svg>
      );

    case 'textile':
      // Thread spool / bobbin
      return (
        <svg viewBox="0 0 24 24" className={cls}>
          {/* Top flange */}
          <ellipse cx="12" cy="4.5" rx="7.5" ry="2.5" fill={color}/>
          {/* Bottom flange */}
          <ellipse cx="12" cy="19.5" rx="7.5" ry="2.5" fill={color}/>
          {/* Spool body */}
          <rect x="9.5" y="4.5" width="5" height="15" rx="0.5" fill={color} opacity="0.65"/>
          {/* Thread waves across body */}
          <path d="M4.5 9 Q8 11 12 9 Q16 7 19.5 9" stroke={w} strokeWidth="1.1" fill="none" strokeLinecap="round"/>
          <path d="M4.5 12 Q8 14 12 12 Q16 10 19.5 12" stroke={w} strokeWidth="1.1" fill="none" strokeLinecap="round"/>
          <path d="M4.5 15 Q8 17 12 15 Q16 13 19.5 15" stroke={w} strokeWidth="1.1" fill="none" strokeLinecap="round"/>
        </svg>
      );

    case 'printing':
      // Two print rollers with paper/substrate passing between them
      return (
        <svg viewBox="0 0 24 24" className={cls}>
          {/* Top roller */}
          <ellipse cx="12" cy="5.5" rx="9.5" ry="3.5" fill={color}/>
          <ellipse cx="10" cy="4.5" rx="2.5" ry="1" fill={w} opacity="0.3"/>
          {/* Bottom roller */}
          <ellipse cx="12" cy="18.5" rx="9.5" ry="3.5" fill={color}/>
          <ellipse cx="10" cy="17.5" rx="2.5" ry="1" fill={w} opacity="0.3"/>
          {/* White paper sheet between rollers */}
          <rect x="2.5" y="9" width="19" height="6" fill={w}/>
          {/* Printed text lines on paper */}
          <line x1="5.5" y1="11" x2="13" y2="11" stroke={color} strokeWidth="1.1"/>
          <line x1="5.5" y1="13.5" x2="18.5" y2="13.5" stroke={color} strokeWidth="1.1"/>
        </svg>
      );

    case 'packaging':
      // 3-D cardboard box with tape seal and label
      return (
        <svg viewBox="0 0 24 24" className={cls}>
          {/* Front face */}
          <rect x="3" y="10" width="14" height="12" rx="0.5" fill={color}/>
          {/* Top face (trapezoid) */}
          <path d="M3 10 L7 5.5 L21 5.5 L17 10 Z" fill={color} opacity="0.7"/>
          {/* Right face */}
          <path d="M17 10 L21 5.5 L21 17.5 L17 22 Z" fill={color} opacity="0.5"/>
          {/* Tape / seal */}
          <line x1="3" y1="10" x2="17" y2="10" stroke={w} strokeWidth="1.5"/>
          {/* Label lines */}
          <line x1="6" y1="15" x2="14" y2="15" stroke={w} strokeWidth="0.9" opacity="0.7"/>
          <line x1="6" y1="18" x2="11" y2="18" stroke={w} strokeWidth="0.9" opacity="0.7"/>
        </svg>
      );

    case 'pharma-chemical':
      // Capsule pill — two-tone halves
      return (
        <svg viewBox="0 0 24 24" className={cls}>
          {/* Full capsule */}
          <rect x="2" y="8.5" width="20" height="7" rx="3.5" fill={color}/>
          {/* Right half lighter overlay */}
          <rect x="12" y="8.5" width="10" height="7" rx="3.5" fill={w} opacity="0.38"/>
          {/* Centre split line */}
          <line x1="12" y1="8.5" x2="12" y2="15.5" stroke={w} strokeWidth="1.4"/>
          {/* Dot on each half */}
          <circle cx="7" cy="12" r="1.1" fill={w} opacity="0.55"/>
          <circle cx="17" cy="12" r="1.1" fill={w} opacity="0.75"/>
        </svg>
      );

    case 'food-processing':
      // Industrial cooking vessel / pot with steam
      return (
        <svg viewBox="0 0 24 24" className={cls}>
          {/* Steam wisps */}
          <path d="M8 9 Q9.5 6.5 8 4" stroke={color} strokeWidth="1.3" fill="none" strokeLinecap="round"/>
          <path d="M12 9 Q13.5 6 12 3" stroke={color} strokeWidth="1.3" fill="none" strokeLinecap="round"/>
          <path d="M16 9 Q17.5 6.5 16 4" stroke={color} strokeWidth="1.3" fill="none" strokeLinecap="round"/>
          {/* Lid knob */}
          <rect x="9.5" y="7.5" width="5" height="2" rx="1" fill={color}/>
          {/* Lid */}
          <rect x="5" y="9.5" width="14" height="2.5" rx="1.3" fill={color}/>
          {/* Pot body */}
          <path d="M5 12 L4.5 21 L19.5 21 L19 12 Z" fill={color}/>
          {/* Left handle */}
          <path d="M5 14.5 Q2 14.5 2 17 Q2 19.5 5 19.5" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round"/>
          {/* Right handle */}
          <path d="M19 14.5 Q22 14.5 22 17 Q22 19.5 19 19.5" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round"/>
          {/* Shine on body */}
          <line x1="8" y1="13.5" x2="8" y2="20" stroke={w} strokeWidth="1" opacity="0.25"/>
        </svg>
      );

    case 'woodworking':
      // Circular saw blade with radial gullets and arbor hole
      return (
        <svg viewBox="0 0 24 24" className={cls}>
          {/* Blade disc */}
          <circle cx="12" cy="12" r="10.5" fill={color}/>
          {/* 8 radial gullet cuts */}
          {([0, 45, 90, 135, 180, 225, 270, 315] as number[]).map(deg => {
            const a = (deg * Math.PI) / 180;
            return (
              <line key={deg}
                x1={12 + 3.5 * Math.cos(a)} y1={12 + 3.5 * Math.sin(a)}
                x2={12 + 10.5 * Math.cos(a)} y2={12 + 10.5 * Math.sin(a)}
                stroke={w} strokeWidth="1.4"/>
            );
          })}
          {/* Arbor hole */}
          <circle cx="12" cy="12" r="2.8" fill={w}/>
          <circle cx="12" cy="12" r="1.2" fill={color}/>
        </svg>
      );

    case 'industrial-equipment':
      // Forklift silhouette
      return (
        <svg viewBox="0 0 24 24" className={cls}>
          {/* Mast */}
          <rect x="2" y="3" width="2.2" height="14.5" rx="0.6" fill={color}/>
          <rect x="5.5" y="3" width="1.5" height="14.5" rx="0.5" fill={color} opacity="0.6"/>
          {/* Forks */}
          <rect x="1" y="16.5" width="7.5" height="1.5" rx="0.5" fill={color}/>
          <rect x="1" y="20" width="7.5" height="1.5" rx="0.5" fill={color}/>
          {/* Chassis body */}
          <rect x="7" y="12" width="13" height="7.5" rx="1" fill={color}/>
          {/* Cab */}
          <path d="M8 12 L9.5 6.5 L17 6.5 L19 12 Z" fill={color}/>
          {/* Cab window */}
          <rect x="10.5" y="7.5" width="5.5" height="4" rx="0.5" fill={w} opacity="0.4"/>
          {/* Counterweight */}
          <rect x="19.5" y="13" width="2.5" height="5" rx="0.4" fill={color} opacity="0.8"/>
          {/* Drive wheel */}
          <circle cx="11" cy="21.5" r="2.3" fill={color}/>
          <circle cx="11" cy="21.5" r="0.9" fill={w}/>
          {/* Rear wheel */}
          <circle cx="19" cy="21.5" r="2.3" fill={color}/>
          <circle cx="19" cy="21.5" r="0.9" fill={w}/>
        </svg>
      );

    default:
      return (
        <svg viewBox="0 0 24 24" className={cls}>
          <circle cx="12" cy="12" r="9" fill={color}/>
        </svg>
      );
  }
}

// Trim verbose suffixes for compact subcategory tile labels
function shortSubcat(name: string) {
  return name
    .replace(' – Vertical Machining Centres', '')
    .replace(' – Horizontal Machining Centres', '')
    .replace(' Machines', '')
    .replace(' Machine', '')
    .replace('Miscellaneous ', 'Misc. ');
}

export function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [activeCatId, setActiveCatId] = useState<string | null>(null);
  const [activeSub, setActiveSub] = useState<string | null>(null);
  const [showAllSubs, setShowAllSubs] = useState(false);
  const [certified, setCertified] = useState(false);
  const [loanEligible, setLoanEligible] = useState(false);
  const [listings, setListings] = useState<ListingDto[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const selectedCat = activeCatId ? (MACHINE_CATEGORIES.find(c => c.id === activeCatId) ?? null) : null;
  const initials = user ? user.fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : '';

  useEffect(() => {
    setLoading(true);
    const params: Record<string, string> = { pageSize: '20' };
    if (selectedCat) params.category = selectedCat.label;
    if (activeSub) params.subcategory = activeSub;
    if (certified) params.certified = 'true';
    if (loanEligible) params.loanEligible = 'true';
    api.get<{ items: ListingDto[]; total: number }>('/listings', { params })
      .then(({ data }) => { setListings(data.items); setTotal(data.total); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [activeCatId, activeSub, certified, loanEligible]);

  function selectCategory(id: string | null) {
    setActiveCatId(id);
    setActiveSub(null);
    setShowAllSubs(false);
  }

  const activeSubs = ((selectedCat as unknown) as { subcategories?: string[] })?.subcategories ?? [];
  const subsToShow = showAllSubs ? activeSubs : activeSubs.slice(0, 6);
  const hiddenSubCount = Math.max(0, activeSubs.length - 6);

  return (
    <AppLayout>
      {/* ── Sticky header ── */}
      <div className="bg-forest sticky top-0 z-20 px-[14px] pb-[14px]">
        <div className="flex items-center justify-between mb-[11px] pt-3">
          {/* BIM logo + location */}
          <div className="flex items-center gap-2.5">
            <svg width="30" height="30" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
              <circle cx="512" cy="512" r="370" fill="#E8820C"/>
              <g fill="#E8820C">
                <rect x="468" y="60" width="88" height="82" rx="6" transform="rotate(0 512 512)"/>
                <rect x="468" y="60" width="88" height="82" rx="6" transform="rotate(40 512 512)"/>
                <rect x="468" y="60" width="88" height="82" rx="6" transform="rotate(80 512 512)"/>
                <rect x="468" y="60" width="88" height="82" rx="6" transform="rotate(120 512 512)"/>
                <rect x="468" y="60" width="88" height="82" rx="6" transform="rotate(160 512 512)"/>
                <rect x="468" y="60" width="88" height="82" rx="6" transform="rotate(200 512 512)"/>
                <rect x="468" y="60" width="88" height="82" rx="6" transform="rotate(240 512 512)"/>
                <rect x="468" y="60" width="88" height="82" rx="6" transform="rotate(280 512 512)"/>
                <rect x="468" y="60" width="88" height="82" rx="6" transform="rotate(320 512 512)"/>
              </g>
              <circle cx="512" cy="512" r="262" fill="#101828"/>
              <circle cx="512" cy="512" r="78" fill="#E8820C"/>
            </svg>
            <div>
              <p className="text-[17px] font-extrabold text-white tracking-[-0.4px] leading-none">BIM</p>
              <div className="flex items-center gap-1 font-mono text-[8.5px] font-semibold text-white/50 tracking-[0.08em] mt-[2px]">
                <MapPinIcon className="w-2 h-2 stroke-white/50" />
                INDIA
              </div>
            </div>
          </div>
          {user ? (
            <button onClick={() => navigate('/profile')}
              className="w-[34px] h-[34px] rounded-full bg-white/15 border border-white/20 flex items-center justify-center text-[12.5px] font-bold text-white">
              {initials}
            </button>
          ) : (
            <button onClick={() => navigate('/login')}
              className="text-[12px] font-semibold text-white/80 bg-white/10 border border-white/20 rounded-lg px-3 py-1.5">
              Sign in
            </button>
          )}
        </div>

        {/* Search bar */}
        <button onClick={() => navigate('/search')}
          className="w-full bg-white rounded-[10px] h-[42px] flex items-center gap-2.5 px-[13px] text-left">
          <SearchIcon className="w-[15px] h-[15px] text-gray-500 flex-shrink-0" />
          <span className="text-[13px] text-gray-500 font-medium">
            Search <strong className="text-ink font-semibold">machines, makes, models...</strong>
          </span>
        </button>
      </div>

      {/* ── Trust strip ── */}
      <div className="flex gap-1.5 px-[14px] pt-[10px] pb-1 overflow-x-auto">
        {['840 GST verified', '12 bank partners', '24h review'].map(t => (
          <span key={t} className="flex-shrink-0 inline-flex items-center gap-1.5 bg-white border border-gray-200 rounded-full px-[11px] py-[5px] text-[10.5px] font-semibold text-gray-700">
            <span className="w-1.5 h-1.5 rounded-full bg-copper" />
            {t}
          </span>
        ))}
      </div>

      {/* ── Category chips (horizontal scroll) ── */}
      <div className="flex gap-1.5 px-[14px] pt-[9px] pb-1 overflow-x-auto">
        <button onClick={() => selectCategory(null)}
          className={`flex-shrink-0 px-[13px] py-[7px] rounded-[9px] border text-[11.5px] font-semibold transition ${
            activeCatId === null ? 'bg-copper-bg border-copper-bdr text-copper' : 'bg-white border-gray-200 text-gray-600'
          }`}>
          All
        </button>
        {MACHINE_CATEGORIES.map(cat => (
          <button key={cat.id} onClick={() => selectCategory(cat.id)}
            className={`flex-shrink-0 px-[13px] py-[7px] rounded-[9px] border text-[11.5px] font-semibold transition ${
              activeCatId === cat.id ? 'bg-copper-bg border-copper-bdr text-copper' : 'bg-white border-gray-200 text-gray-600'
            }`}>
            {CAT_SHORT[cat.id]}
          </button>
        ))}
      </div>

      {/* ── Browse by industry (All view) — centered card grid ── */}
      {!selectedCat && (
        <div className="px-[14px] pt-[14px]">
          <p className="font-mono text-[10px] font-semibold text-gray-400 tracking-[0.09em] uppercase mb-[11px]">
            Browse by industry
          </p>

          {/* 2-col grid with icon-on-top stacked cards */}
          <div className="grid grid-cols-2 gap-[9px] mb-[20px]">
            {MACHINE_CATEGORIES.map(cat => {
              const [dark, light] = CAT_COLORS[cat.id] ?? ['#334155', '#F1F5F9'];
              const subCount = ((cat as unknown) as { subcategories?: string[] }).subcategories?.length ?? 0;
              return (
                <button key={cat.id} onClick={() => selectCategory(cat.id)}
                  className="flex flex-col items-center bg-white border border-gray-200 rounded-[14px] pt-[16px] pb-[13px] px-[8px] text-center active:scale-[.96] transition-transform">
                  <div className="w-[50px] h-[50px] rounded-[13px] flex items-center justify-center mb-[10px]"
                    style={{ background: light }}>
                    <CategorySvg id={cat.id} color={dark} size={28} />
                  </div>
                  {/* Category name */}
                  <p className="text-[12px] font-bold text-ink leading-[1.3] mb-[3px]">
                    {CAT_SHORT[cat.id]}
                  </p>
                  {/* Type count badge */}
                  <span className="inline-flex items-center gap-1 px-[7px] py-[2.5px] rounded-full text-[9.5px] font-semibold"
                    style={{ background: light, color: dark }}>
                    {subCount} types
                  </span>
                </button>
              );
            })}
          </div>

          {/* Divider before listing feed */}
          <div className="flex items-center gap-2 mb-[11px]">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="font-mono text-[9px] font-semibold text-gray-400 tracking-[0.09em] uppercase">
              Recent listings
            </span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>
        </div>
      )}

      {/* ── Subcategory grid (category selected) ── */}
      {selectedCat && (() => {
        const [dark, light] = CAT_COLORS[selectedCat.id] ?? ['#334155', '#F1F5F9'];
        return (
          <div className="px-[14px] pt-[12px]">
            {/* Breadcrumb */}
            <div className="flex items-center gap-1.5 mb-[11px]">
              <button onClick={() => selectCategory(null)}
                className="flex items-center gap-1 text-[10.5px] font-semibold text-gray-400">
                <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 10 10">
                  <polyline points="6.5 2 3 5 6.5 8" />
                </svg>
                All
              </button>
              <svg className="w-2.5 h-2.5 text-gray-300" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 10 10">
                <polyline points="3.5 2 6.5 5 3.5 8" />
              </svg>
              <span className="text-[10.5px] font-bold text-ink">{CAT_SHORT[selectedCat.id]}</span>
              <span className="ml-auto text-[9.5px] font-medium text-gray-400">{activeSubs.length} types</span>
            </div>

            {/* 3-column subcategory tiles */}
            <div className="grid grid-cols-3 gap-[7px] mb-2">
              {subsToShow.map(sub => {
                const isActive = activeSub === sub;
                return (
                  <button key={sub}
                    onClick={() => setActiveSub(isActive ? null : sub)}
                    className="flex flex-col items-center text-center rounded-[11px] pt-[10px] pb-[8px] px-[4px] border transition active:scale-95"
                    style={{ background: isActive ? light : '#fff', borderColor: isActive ? `${dark}60` : '#E5E7EB' }}>
                    <div className="w-[30px] h-[30px] rounded-[8px] flex items-center justify-center mb-[6px] transition-colors"
                      style={{ background: isActive ? dark : light }}>
                      <CategorySvg id={selectedCat.id} color={isActive ? '#fff' : dark} size={16} />
                    </div>
                    <p className="text-[9px] font-semibold leading-[1.3] line-clamp-2 px-[2px]"
                      style={{ color: isActive ? dark : '#374151' }}>
                      {shortSubcat(sub)}
                    </p>
                  </button>
                );
              })}
            </div>

            {/* Expand button */}
            {!showAllSubs && hiddenSubCount > 0 && (
              <button onClick={() => setShowAllSubs(true)}
                className="w-full mb-2 text-[11px] font-semibold py-[7px] rounded-[9px] bg-copper-bg border border-copper-bdr text-copper">
                + {hiddenSubCount} more types
              </button>
            )}

            {/* Active subcategory badge */}
            {activeSub && (
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-[10px] text-gray-400 font-medium">Filtered:</span>
                <span className="inline-flex items-center gap-1 bg-copper-bg border border-copper-bdr text-copper text-[10px] font-bold px-2 py-[3px] rounded-full">
                  {activeSub}
                  <button onClick={() => setActiveSub(null)} className="ml-0.5 opacity-60 text-[13px] leading-none">×</button>
                </span>
              </div>
            )}
          </div>
        );
      })()}

      {/* ── Quick filter pills ── */}
      <div className="flex gap-1.5 px-[14px] pt-[8px] pb-1">
        <button onClick={() => setCertified(!certified)}
          className={`flex-shrink-0 flex items-center gap-1.5 px-[13px] py-[7px] rounded-[9px] border text-[11.5px] font-semibold transition ${
            certified ? 'bg-copper-bg border-copper-bdr text-copper' : 'bg-white border-gray-200 text-gray-600'
          }`}>
          {certified && <span className="w-1.5 h-1.5 rounded-full bg-copper" />}
          Certified
        </button>
        <button onClick={() => setLoanEligible(!loanEligible)}
          className={`flex-shrink-0 flex items-center gap-1.5 px-[13px] py-[7px] rounded-[9px] border text-[11.5px] font-semibold transition ${
            loanEligible ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-gray-200 text-gray-600'
          }`}>
          {loanEligible && <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />}
          Loan eligible
        </button>
      </div>

      {/* ── Results count ── */}
      <div className="flex items-center justify-between px-4 py-2">
        <span className="font-mono text-[10.5px] font-semibold text-gray-500 tracking-[0.04em]">
          <span className="text-copper font-bold">{total}</span>
          {' '}MACHINES
          {activeSub
            ? ` · ${shortSubcat(activeSub)}`
            : selectedCat
              ? ` · ${CAT_SHORT[selectedCat.id]}`
              : ''}
        </span>
        <button className="text-[11px] font-semibold text-ink flex items-center gap-1">
          Latest
          <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" viewBox="0 0 10 10">
            <polyline points="2.5 4 5 6.5 7.5 4" />
          </svg>
        </button>
      </div>

      {/* ── Listing cards ── */}
      <div className="px-[14px] pb-[14px] flex flex-col gap-[10px]">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-[13px] h-[124px] animate-pulse" />
          ))
        ) : listings.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-[13px] font-semibold text-gray-500 mb-3">No machines found</p>
            {(activeSub || activeCatId) && (
              <button onClick={() => { setActiveSub(null); setActiveCatId(null); }}
                className="text-[12px] font-semibold text-copper border border-copper-bdr bg-copper-bg rounded-[9px] px-4 py-2">
                Clear filters
              </button>
            )}
          </div>
        ) : (
          listings.map(l => <ListingCard key={l.id} listing={l} />)
        )}
      </div>
    </AppLayout>
  );
}
