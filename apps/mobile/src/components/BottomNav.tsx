import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth-context';
import { UserRole, GstStatus } from '@machinebazaar/shared';
import { api, apiErrorMessage } from '../lib/api';
import { HomeIcon, SearchIcon, PlusIcon, InboxIcon, ProfileIcon } from './icons';

type Sheet = 'gst-required' | 'switch-confirm' | 'switching' | null;

export function BottomNav() {
  const { user, authenticate } = useAuth();
  const navigate = useNavigate();
  const [sheet, setSheet] = useState<Sheet>(null);
  const [switchError, setSwitchError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const inboxPath = user?.role === UserRole.SELLER ? '/seller/enquiries' : '/enquiries';

  const handleSell = () => {
    if (!user) { navigate('/login'); return; }
    if (user.role === UserRole.SELLER) { navigate('/seller/listings/new'); return; }
    // Buyer: gate on GST status
    if (user.gstStatus === GstStatus.ACTIVE) {
      setSwitchError(null);
      setSheet('switch-confirm');
    } else {
      setSheet('gst-required');
    }
  };

  const handleSwitch = async () => {
    setLoading(true);
    setSwitchError(null);
    try {
      const { data } = await api.post<{ accessToken: string; refreshToken: string }>(
        '/auth/switch-to-seller',
      );
      await authenticate(data);
      setSheet(null);
      navigate('/seller/dashboard', { replace: true });
    } catch (err) {
      setSwitchError(apiErrorMessage(err, 'Could not switch account. Please try again.'));
      setLoading(false);
    }
  };

  const navItem = (to: string, Icon: React.FC<React.SVGProps<SVGSVGElement>>, label: string) => (
    <NavLink to={to} className={({ isActive }) =>
      `flex flex-col items-center gap-0.5 flex-1 py-1 px-1 ${isActive ? 'text-copper' : 'text-gray-500'}`
    }>
      {({ isActive }) => (
        <>
          <Icon className={`w-[21px] h-[21px] ${isActive ? 'stroke-copper stroke-[2px]' : ''}`} />
          <span className={`text-[9.5px] font-${isActive ? 'bold' : 'medium'}`}>{label}</span>
        </>
      )}
    </NavLink>
  );

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 flex items-start pt-2"
        style={{ paddingBottom: `calc(env(safe-area-inset-bottom) + 4px)` }}>
        {navItem('/', HomeIcon, 'Home')}
        {navItem('/search', SearchIcon, 'Search')}

        {/* Center FAB */}
        <div className="flex flex-col items-center gap-0.5 flex-1">
          <button onClick={handleSell}
            className="-mt-[15px] w-11 h-11 rounded-full bg-copper flex items-center justify-center shadow-[0_4px_12px_rgba(232,130,12,.3)]">
            <PlusIcon className="w-[19px] h-[19px] stroke-white stroke-[2.2px]" />
          </button>
          <span className="text-[9.5px] font-bold text-ink mt-0.5">Sell</span>
        </div>

        {navItem(inboxPath, InboxIcon, 'Enquiries')}
        {navItem('/profile', ProfileIcon, 'Profile')}
      </nav>

      {/* ── Sheet: GST not verified ── */}
      {sheet === 'gst-required' && (
        <>
          <div className="fixed inset-0 z-[60] bg-black/40" onClick={() => setSheet(null)} />
          <div className="fixed bottom-0 left-0 right-0 z-[70] bg-white rounded-t-[24px] px-6 pt-5"
            style={{ paddingBottom: `calc(env(safe-area-inset-bottom) + 24px)` }}>
            <div className="w-10 h-1 rounded-full bg-gray-200 mx-auto mb-5" />

            <div className="w-14 h-14 rounded-[14px] bg-copper-bg border border-copper-bdr flex items-center justify-center mb-4">
              <svg className="w-7 h-7" fill="none" stroke="#B45309" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <line x1="12" y1="8" x2="12" y2="12" strokeWidth="2" />
                <circle cx="12" cy="16" r="0.5" strokeWidth="2" fill="#B45309" />
              </svg>
            </div>

            <h2 className="text-[18px] font-extrabold text-ink tracking-[-0.3px] mb-1">
              GST verification required
            </h2>
            <p className="text-[13px] text-gray-500 leading-relaxed mb-5">
              To sell on BIM, your GST must be verified and active. Complete GST verification first — it only takes a few minutes.
            </p>

            <div className="bg-copper-bg border border-copper-bdr rounded-[12px] px-3.5 py-3 mb-5">
              <p className="text-[12px] font-semibold text-copper">
                Current status: <span className="uppercase">{user?.gstStatus ?? 'UNVERIFIED'}</span>
              </p>
            </div>

            <div className="space-y-2.5">
              <button
                onClick={() => { setSheet(null); navigate('/buyer/gst-verification'); }}
                className="w-full h-[50px] bg-copper text-white rounded-[13px] text-[14.5px] font-bold">
                Verify GST now →
              </button>
              <button
                onClick={() => setSheet(null)}
                className="w-full h-[46px] bg-gray-100 text-gray-700 rounded-[13px] text-[14px] font-semibold">
                Cancel
              </button>
            </div>
          </div>
        </>
      )}

      {/* ── Sheet: GST verified — confirm switch ── */}
      {(sheet === 'switch-confirm' || sheet === 'switching') && (
        <>
          <div className="fixed inset-0 z-[60] bg-black/40" onClick={() => { if (!loading) setSheet(null); }} />
          <div className="fixed bottom-0 left-0 right-0 z-[70] bg-white rounded-t-[24px] px-6 pt-5"
            style={{ paddingBottom: `calc(env(safe-area-inset-bottom) + 24px)` }}>
            <div className="w-10 h-1 rounded-full bg-gray-200 mx-auto mb-5" />

            {/* GST verified badge */}
            <div className="flex items-center gap-2 mb-4">
              <div className="w-14 h-14 rounded-[14px] bg-forest flex items-center justify-center flex-shrink-0">
                <svg className="w-7 h-7" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  <polyline points="9 12 11 14 15 10" strokeWidth="2" />
                </svg>
              </div>
              <div>
                <span className="inline-flex items-center gap-1.5 bg-green-bg border border-green-bdr text-green-txt text-[10px] font-bold px-2 py-0.5 rounded-full mb-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#12B76A]" />
                  GST ACTIVE
                </span>
                <p className="text-[12px] text-gray-500 font-mono">{user?.gstNumber}</p>
              </div>
            </div>

            <h2 className="text-[18px] font-extrabold text-ink tracking-[-0.3px] mb-1">
              Switch to seller account?
            </h2>
            <p className="text-[13px] text-gray-500 leading-relaxed mb-3">
              Your GST is verified. Switch your account to <span className="font-semibold text-ink">Seller</span> to start listing machines. You'll be redirected to your seller dashboard.
            </p>

            <div className="bg-gray-50 border border-gray-200 rounded-[12px] px-3.5 py-3 mb-5 space-y-1">
              {[
                'Your existing data, GST and profile are kept',
                'You can list machines immediately after switching',
                'This action cannot be reversed from the app',
              ].map((line) => (
                <div key={line} className="flex items-start gap-2">
                  <svg className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" fill="none" stroke="#101828" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 12 12">
                    <polyline points="1.5 6 4.5 9 10.5 3" />
                  </svg>
                  <p className="text-[11.5px] text-gray-600">{line}</p>
                </div>
              ))}
            </div>

            {switchError && (
              <p className="text-[12px] text-red-600 font-medium bg-red-50 border border-red-200 rounded-[10px] px-3 py-2 mb-3">
                {switchError}
              </p>
            )}

            <div className="space-y-2.5">
              <button onClick={handleSwitch} disabled={loading}
                className="w-full h-[50px] bg-forest text-white rounded-[13px] text-[14.5px] font-bold disabled:opacity-60">
                {loading ? 'Switching account…' : 'Yes, switch to seller →'}
              </button>
              <button onClick={() => setSheet(null)} disabled={loading}
                className="w-full h-[46px] bg-gray-100 text-gray-700 rounded-[13px] text-[14px] font-semibold disabled:opacity-50">
                Cancel
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
