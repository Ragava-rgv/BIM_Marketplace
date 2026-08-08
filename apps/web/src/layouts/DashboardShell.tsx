import { useState, type ReactNode } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { UserRole } from '@machinebazaar/shared';
import { useAuth } from '../lib/auth-context';
import { BimIcon, BimLogoLight } from '../components/BimLogo';
import { CloseIcon, LogoutIcon, MenuIcon } from '../components/icons';

export interface ShellNavItem {
  to: string;
  label: string;
  icon: (props: { className?: string }) => ReactNode;
  end?: boolean;
}

/**
 * Shared chrome for the seller/buyer/admin dashboards: ink sidebar with
 * role-scoped navigation, a topbar showing the signed-in user, a mobile
 * bottom nav (Blinkit-style) for the first few items, and an outlet.
 */
export function DashboardShell({ title, items }: { title: string; items: ShellNavItem[] }) {
  const { t } = useTranslation();
  const { user, logout, switchMode } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const switchModeLabel = user?.activeMode === 'SELLER'
    ? t('layout.dashboardShell.switchToBuyerMode')
    : t('layout.dashboardShell.switchToSellerMode');

  const navContent = (
    <nav className="flex flex-1 flex-col gap-1 px-3">
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          onClick={() => setMobileOpen(false)}
          className={({ isActive }) =>
            `flex items-center gap-3 rounded-[9px] px-3.5 py-2.5 text-[13.5px] font-semibold transition ${
              isActive ? 'bg-white text-ink' : 'text-white/60 hover:bg-white/10 hover:text-white'
            }`
          }
        >
          <item.icon className="h-[18px] w-[18px]" />
          {item.label}
        </NavLink>
      ))}
    </nav>
  );

  const bottomNavItems = items.slice(0, 5);

  return (
    <div className="flex min-h-screen bg-paper">
      <aside className="hidden w-64 shrink-0 flex-col bg-ink lg:flex">
        <Link to="/" className="px-6 py-6" aria-label={t('layout.dashboardShell.bimHomeAria')}>
          <BimLogoLight />
        </Link>
        <p className="px-6 pb-4 font-mono text-[10.5px] font-semibold uppercase tracking-[0.14em] text-copper">{title}</p>
        {navContent}
        <div className="mt-auto border-t border-white/10 px-6 py-5">
          <p className="truncate text-[13.5px] font-bold text-white">{user?.fullName}</p>
          <p className="truncate text-xs text-white/40">{user?.phone}</p>
          {user && user.role !== UserRole.ADMIN && user.canSell && (
            <button
              type="button"
              onClick={async () => {
                const next = user.activeMode === 'SELLER' ? 'BUYER' : 'SELLER';
                await switchMode(next);
                navigate(next === 'SELLER' ? '/seller/dashboard' : '/buyer/dashboard');
              }}
              className="mt-2.5 inline-flex w-full items-center justify-center gap-2 rounded-[7px] border border-white/15 bg-white/8 px-3 py-1.5 text-[12px] font-semibold text-white/75 transition hover:bg-white/15 hover:text-white"
            >
              {switchModeLabel}
            </button>
          )}
          <button
            type="button"
            onClick={handleLogout}
            className="mt-3 inline-flex items-center gap-2 text-[13px] font-semibold text-white/55 transition hover:text-white"
          >
            <LogoutIcon className="h-4 w-4" />
            {t('layout.dashboardShell.logOut')}
          </button>
        </div>
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 flex lg:hidden">
          <div className="absolute inset-0 bg-ink/40" onClick={() => setMobileOpen(false)} />
          <aside className="relative flex w-72 flex-col bg-ink">
            <div className="flex items-center justify-between px-6 py-6">
              <Link to="/" onClick={() => setMobileOpen(false)} aria-label={t('layout.dashboardShell.bimHomeAria')}>
                <BimLogoLight />
              </Link>
              <button type="button" onClick={() => setMobileOpen(false)} className="text-white/70">
                <CloseIcon className="h-6 w-6" />
              </button>
            </div>
            <p className="px-6 pb-4 font-mono text-[10.5px] font-semibold uppercase tracking-[0.14em] text-copper">{title}</p>
            {navContent}
            <div className="mt-auto border-t border-white/10 px-6 py-5">
              <p className="truncate text-[13.5px] font-bold text-white">{user?.fullName}</p>
              {user && user.role !== UserRole.ADMIN && user.canSell && (
                <button
                  type="button"
                  onClick={async () => {
                    const next = user.activeMode === 'SELLER' ? 'BUYER' : 'SELLER';
                    setMobileOpen(false);
                    await switchMode(next);
                    navigate(next === 'SELLER' ? '/seller/dashboard' : '/buyer/dashboard');
                  }}
                  className="mt-2.5 inline-flex w-full items-center justify-center gap-2 rounded-[7px] border border-white/15 bg-white/8 px-3 py-1.5 text-[12px] font-semibold text-white/75 transition hover:bg-white/15 hover:text-white"
                >
                  {switchModeLabel}
                </button>
              )}
              <button
                type="button"
                onClick={handleLogout}
                className="mt-3 inline-flex items-center gap-2 text-[13px] font-semibold text-white/55"
              >
                <LogoutIcon className="h-4 w-4" />
                {t('layout.dashboardShell.logOut')}
              </button>
            </div>
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-line bg-white px-6 py-4 lg:hidden">
          <Link to="/" aria-label={t('layout.dashboardShell.bimHomeAria')}>
            <BimIcon size={32} />
          </Link>
          <button type="button" onClick={() => setMobileOpen(true)} className="text-ink" aria-label={t('layout.dashboardShell.openMenuAria')}>
            <MenuIcon className="h-6 w-6" />
          </button>
        </header>

        <main className="flex-1 px-6 py-8 pb-24 lg:px-10 lg:py-10 lg:pb-10">
          <div className="mx-auto max-w-6xl">
            <Outlet />
          </div>
        </main>
      </div>

      {bottomNavItems.length > 0 && (
        <nav className="fixed inset-x-0 bottom-0 z-30 flex border-t border-line bg-white lg:hidden">
          {bottomNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex flex-1 flex-col items-center gap-1 py-2.5 text-[10.5px] font-semibold transition ${
                  isActive ? 'text-forest' : 'text-muted'
                }`
              }
            >
              <item.icon className="h-5 w-5" />
              <span className="truncate px-1">{item.label}</span>
            </NavLink>
          ))}
        </nav>
      )}
    </div>
  );
}
