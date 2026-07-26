import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { UserRole } from '@machinebazaar/shared';
import { useAuth } from '../lib/auth-context';
import { useWishlist } from '../lib/wishlist-context';
import { TickerBar } from '../components/TickerBar';
import { BimIcon, BimLogoDark } from '../components/BimLogo';
import { ChevronRightIcon, CloseIcon, HeartIcon, MenuIcon, PlusIcon } from '../components/icons';
import { INDIA_STATES } from '../lib/india-locations';

const NAV_LINKS = [
  { to: '/listings', label: 'Marketplace' },
  { to: '/how-it-works', label: 'How it works' },
  { to: '/about', label: 'About' },
];

function dashboardPath(user: { role: UserRole; activeMode: string; canSell: boolean }): string {
  if (user.role === UserRole.ADMIN) return '/admin/dashboard';
  if (user.canSell && user.activeMode === 'SELLER') return '/seller/dashboard';
  return '/buyer/dashboard';
}

/** Routes to the right place for the viewer's current capability — shared by the header Sell
    button, the drawer's Sell button, and the mobile floating Sell button, so the routing rule
    only lives in one place. */
function useSellNavigate() {
  const { user } = useAuth();
  const navigate = useNavigate();
  return () => {
    if (!user) return navigate('/signup');
    if (!user.canSell) return navigate('/buyer/switch-to-seller');
    navigate('/seller/listings/new');
  };
}

/** Always-visible "Sell" CTA — the primary header action, routed by the viewer's current capability. */
function SellButton({ className = '' }: { className?: string }) {
  const go = useSellNavigate();
  return (
    <button
      type="button"
      onClick={go}
      className={`inline-flex items-center gap-1.5 rounded-lg bg-copper px-[18px] py-2.5 text-[13.5px] font-bold text-white transition hover:bg-copper-2 ${className}`}
    >
      Sell
    </button>
  );
}

/** Mobile-only floating pill, always reachable while scrolling (OLX-style "+ SELL" FAB). */
function FloatingSellButton() {
  const go = useSellNavigate();
  return (
    <button
      type="button"
      onClick={go}
      aria-label="Sell a machine"
      className="fixed bottom-20 right-5 z-30 flex items-center gap-1.5 rounded-full bg-copper px-5 py-3 text-[13.5px] font-bold text-white shadow-[0_8px_24px_rgba(180,83,9,0.35)] transition hover:bg-copper-2 md:hidden"
    >
      <PlusIcon className="h-4 w-4" />
      Sell
    </button>
  );
}

function LocationSelect() {
  const navigate = useNavigate();
  return (
    <select
      aria-label="Browse by state"
      defaultValue=""
      onChange={(e) => {
        if (e.target.value) navigate(`/listings?state=${encodeURIComponent(e.target.value)}`);
        e.target.value = '';
      }}
      className="w-[110px] shrink-0 rounded-lg border border-line bg-white px-2.5 py-2.5 text-[13px] font-semibold text-slate outline-none transition hover:border-ink"
    >
      <option value="">All India</option>
      {INDIA_STATES.map((state) => (
        <option key={state} value={state}>
          {state}
        </option>
      ))}
    </select>
  );
}

function HeaderSearch() {
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        navigate(q.trim() ? `/listings?search=${encodeURIComponent(q.trim())}` : '/listings');
      }}
      className="flex-1"
    >
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search machines, makes, models…"
        aria-label="Search listings"
        className="w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-[13px] text-ink placeholder:text-muted outline-none transition focus:border-forest focus:ring-2 focus:ring-forest/10"
      />
    </form>
  );
}

function WishlistLink() {
  const { user } = useAuth();
  const { count } = useWishlist();
  if (!user) return null;
  return (
    <Link
      to="/buyer/saved"
      aria-label="Wishlist"
      className="relative inline-flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-lg border border-line text-ink transition hover:border-ink"
    >
      <HeartIcon className="h-[18px] w-[18px]" />
      {count > 0 && (
        <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-copper px-1 font-mono text-[9.5px] font-bold text-white">
          {count}
        </span>
      )}
    </Link>
  );
}

function ProfileDropdown() {
  const { user, switchMode, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  if (!user) return null;

  const isSeller = user.activeMode === 'SELLER' && user.canSell;
  const targetMode = isSeller ? 'BUYER' : 'SELLER';

  const handleSwitch = async () => {
    if (targetMode === 'SELLER' && !user.canSell) {
      setOpen(false);
      navigate('/buyer/switch-to-seller');
      return;
    }
    await switchMode(targetMode);
    setOpen(false);
    navigate(dashboardPath({ ...user, activeMode: targetMode }));
  };

  const handleLogout = async () => {
    setOpen(false);
    await logout();
    navigate('/');
  };

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-2 whitespace-nowrap rounded-lg border border-line bg-white px-3.5 py-2.5 text-[13.5px] font-bold text-ink transition hover:border-ink"
      >
        <span className="h-6 w-6 rounded-full bg-forest text-white flex items-center justify-center text-[11px] font-bold select-none">
          {user.fullName.charAt(0).toUpperCase()}
        </span>
        <span className="max-w-[64px] truncate">{user.fullName.split(' ')[0]}</span>
        <ChevronRightIcon className={`h-3.5 w-3.5 shrink-0 transition-transform ${open ? 'rotate-90' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 w-56 rounded-[12px] border border-line bg-white shadow-[0_8px_28px_rgba(0,0,0,0.10)] z-50">
          <div className="px-4 py-3 border-b border-line">
            <p className="text-[13px] font-bold text-ink truncate">{user.fullName}</p>
            <p className="text-[11.5px] text-muted truncate">{user.phone}</p>
            <span className={`mt-1.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${isSeller ? 'bg-copper/10 text-copper-2' : 'bg-forest-bg text-forest'}`}>
              <span className="h-1.5 w-1.5 rounded-full bg-current" />
              {isSeller ? 'Seller mode' : 'Buyer mode'}
            </span>
          </div>
          <div className="p-1.5">
            <Link
              to={dashboardPath(user)}
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 rounded-[8px] px-3 py-2 text-[13px] font-semibold text-ink hover:bg-paper transition"
            >
              Go to dashboard
              <ChevronRightIcon className="h-3.5 w-3.5 ml-auto text-muted" />
            </Link>
            {user.role !== UserRole.ADMIN && (
              <button
                type="button"
                onClick={handleSwitch}
                className="w-full flex items-center gap-2.5 rounded-[8px] px-3 py-2 text-[13px] font-semibold text-ink hover:bg-paper transition text-left"
              >
                {isSeller ? 'Switch to Buyer mode' : (user.canSell ? 'Switch to Seller mode' : 'Enable Seller mode')}
              </button>
            )}
            <div className="my-1 h-px bg-line" />
            <button
              type="button"
              onClick={handleLogout}
              className="w-full flex items-center gap-2.5 rounded-[8px] px-3 py-2 text-[13px] font-semibold text-red-600 hover:bg-red-50 transition text-left"
            >
              Log out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function PublicLayout() {
  const { user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-white">
      <div className="flex h-9 items-center justify-center bg-forest px-4 text-center">
        <p className="flex items-center gap-2.5 text-[12.5px] font-medium text-white/90">
          <span className="rounded-full bg-white/15 px-2.5 py-0.5 font-mono text-[10.5px] font-bold uppercase tracking-[0.04em] text-white">
            New
          </span>
          <span className="hidden sm:inline">
            Bank-accepted certification reports now available for <strong className="font-bold text-white">CNC, VMC and Press machines</strong>
          </span>
          <span className="sm:hidden">Bank-accepted certification now available</span>
        </p>
      </div>

      <TickerBar />

      <header className="sticky top-0 z-40 border-b border-line bg-white">
        {/* Row 1 — brand, nav, account actions. Kept on its own line so it never has to
            compete with the search bar for space (that was causing overflow/wrapping). */}
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-6 pt-3.5 lg:px-[52px]">
          <Link to="/" aria-label="BIM — Big Industrial Machines" className="shrink-0">
            <BimLogoDark />
          </Link>

          <nav className="hidden shrink-0 items-center gap-1 md:flex">
            {NAV_LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `whitespace-nowrap rounded-[7px] px-3.5 py-2 text-[13.5px] font-semibold transition ${
                    isActive ? 'text-forest' : 'text-slate hover:bg-forest-bg hover:text-forest'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>

          <div className="hidden flex-1 items-center justify-end gap-2 md:flex">
            <WishlistLink />
            {user ? (
              <ProfileDropdown />
            ) : (
              <Link
                to="/login"
                className="shrink-0 whitespace-nowrap rounded-lg border border-line px-[18px] py-2.5 text-[13.5px] font-bold text-ink transition hover:border-ink"
              >
                Sign in
              </Link>
            )}
            <SellButton className="shrink-0" />
          </div>

          {/* Mobile-only: compact location selector next to the hamburger (OLX pattern —
              hamburger, logo, location on the right, single line). Search gets its own
              full-width row below instead of competing for space here. */}
          <div className="ml-auto flex items-center gap-1 md:hidden">
            <LocationSelect />
          </div>

          <button
            type="button"
            className="rounded-lg p-2 text-ink md:hidden"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label="Toggle menu"
          >
            {menuOpen ? <CloseIcon className="h-6 w-6" /> : <MenuIcon className="h-6 w-6" />}
          </button>
        </div>

        {/* Row 2 — search is the dominant element here since it has the whole row to itself.
            Desktop: search + location selector. Mobile: search + wishlist heart (location
            already lives in Row 1 next to the hamburger on mobile). */}
        <div className="mx-auto flex max-w-7xl items-center gap-2 px-6 pb-3 pt-2.5 lg:px-[52px]">
          <HeaderSearch />
          <div className="hidden md:block">
            <LocationSelect />
          </div>
          <div className="md:hidden">
            <WishlistLink />
          </div>
        </div>

        {menuOpen && (
          <div className="border-t border-line px-6 py-4 md:hidden">
            <nav className="flex flex-col gap-3">
              {NAV_LINKS.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  onClick={() => setMenuOpen(false)}
                  className="text-sm font-semibold text-slate"
                >
                  {link.label}
                </NavLink>
              ))}
              <div className="mt-2 flex flex-col gap-2">
                {user && (
                  <>
                    <Link
                      to={dashboardPath(user)}
                      onClick={() => setMenuOpen(false)}
                      className="rounded-lg bg-forest px-4 py-2.5 text-center text-sm font-bold text-white"
                    >
                      Go to dashboard
                    </Link>
                    <Link
                      to="/buyer/saved"
                      onClick={() => setMenuOpen(false)}
                      className="rounded-lg border border-line px-4 py-2.5 text-center text-sm font-bold text-ink"
                    >
                      Wishlist
                    </Link>
                  </>
                )}
                {!user && (
                  <Link
                    to="/login"
                    onClick={() => setMenuOpen(false)}
                    className="rounded-lg border border-line px-4 py-2.5 text-center text-sm font-bold text-ink"
                  >
                    Sign in
                  </Link>
                )}
                <SellButton className="w-full justify-center py-2.5 text-sm" />
              </div>
            </nav>
          </div>
        )}
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <FloatingSellButton />

      <footer className="bg-ink px-6 py-14 text-white/50 lg:px-[52px]">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-10 border-b border-white/8 pb-10 md:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr_1fr_1fr]">
            <div>
              <div className="flex items-center gap-2.5">
                <BimIcon size={40} />
                <div className="flex flex-col leading-none">
                  <span className="font-display text-[22px] font-semibold tracking-[-0.5px] text-white">BIM</span>
                  <span className="mt-[3px] font-mono text-[9px] font-medium uppercase tracking-[0.1em] text-orange-400">Big Industrial Machines</span>
                </div>
              </div>
              <p className="mt-3.5 max-w-xs text-[13px] leading-relaxed text-white/45">
                India&apos;s certified B2B marketplace for used industrial machinery. Backed by GST verification,
                bank-accepted certification reports, and secure admin-mediated transactions.
              </p>
              <p className="mt-4 font-mono text-[10.5px] font-medium tracking-[0.08em] text-copper">
                CERTIFIED · GST-VERIFIED · ADMIN-MEDIATED
              </p>
            </div>

            <div>
              <p className="mb-4 font-mono text-[10.5px] font-semibold uppercase tracking-[0.12em] text-white/40">
                Marketplace
              </p>
              <ul className="space-y-2.5 text-[13px] font-medium text-white/60">
                <li><Link to="/listings" className="transition hover:text-white">Browse machines</Link></li>
                <li><Link to="/signup" className="transition hover:text-white">List a machine</Link></li>
                <li><Link to="/listings" className="transition hover:text-white">Categories</Link></li>
              </ul>
            </div>

            <div>
              <p className="mb-4 font-mono text-[10.5px] font-semibold uppercase tracking-[0.12em] text-white/40">
                Services
              </p>
              <ul className="space-y-2.5 text-[13px] font-medium text-white/60">
                <li><Link to="/how-it-works" className="transition hover:text-white">Certification</Link></li>
                <li><Link to="/how-it-works" className="transition hover:text-white">Finance &amp; loans</Link></li>
                <li><Link to="/how-it-works" className="transition hover:text-white">Buyback</Link></li>
              </ul>
            </div>

            <div>
              <p className="mb-4 font-mono text-[10.5px] font-semibold uppercase tracking-[0.12em] text-white/40">
                Get started
              </p>
              <ul className="space-y-2.5 text-[13px] font-medium text-white/60">
                <li><Link to="/signup" className="transition hover:text-white">Sell a machine</Link></li>
                <li><Link to="/signup" className="transition hover:text-white">Find a machine</Link></li>
                <li><Link to="/login" className="transition hover:text-white">Log in</Link></li>
              </ul>
            </div>

            <div>
              <p className="mb-4 font-mono text-[10.5px] font-semibold uppercase tracking-[0.12em] text-white/40">
                Company
              </p>
              <ul className="space-y-2.5 text-[13px] font-medium text-white/60">
                <li><Link to="/about" className="transition hover:text-white">About</Link></li>
                <li><Link to="/admin/login" className="transition hover:text-white">Admin login</Link></li>
              </ul>
            </div>
          </div>

          <div className="flex flex-col gap-4 pt-7 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-white/30">Â© {new Date().getFullYear()} BIM — Big Industrial Machines Pvt. Ltd.</p>
            <div className="flex items-center gap-2.5">
              <span className="inline-flex items-center gap-[5px] rounded border border-white/10 px-2.5 py-1 font-mono text-[10.5px] font-semibold tracking-[0.04em] text-white/40">
                <span className="h-[5px] w-[5px] rounded-full bg-forest-2 shadow-[0_0_0_2px_rgba(45,106,79,0.2)]" />
                GST API · LIVE
              </span>
              <span className="inline-flex items-center gap-[5px] rounded border border-white/10 px-2.5 py-1 font-mono text-[10.5px] font-semibold tracking-[0.04em] text-white/40">
                <span className="h-[5px] w-[5px] rounded-full bg-forest-2 shadow-[0_0_0_2px_rgba(45,106,79,0.2)]" />
                SECURE PAYMENTS · 256-BIT
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
