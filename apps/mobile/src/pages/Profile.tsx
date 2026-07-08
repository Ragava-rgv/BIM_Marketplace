import { useNavigate } from 'react-router-dom';
import { UserRole } from '@machinebazaar/shared';
import { useAuth } from '../lib/auth-context';
import { AppLayout } from '../components/AppLayout';
import { ChevronRightIcon } from '../components/icons';

interface NavItem { label: string; path: string }

function NavGroup({ title, items }: { title: string; items: NavItem[] }) {
  const navigate = useNavigate();
  return (
    <div className="bg-white border border-gray-200 rounded-[13px] overflow-hidden">
      <p className="font-mono text-[9.5px] font-semibold text-gray-500 tracking-[0.08em] px-4 py-3 border-b border-gray-100">
        {title}
      </p>
      {items.map(({ label, path }) => (
        <button key={path} onClick={() => navigate(path)}
          className="w-full flex items-center justify-between px-4 py-[13px] border-b border-gray-100 last:border-0">
          <span className="text-[13.5px] font-semibold text-ink">{label}</span>
          <ChevronRightIcon className="w-4 h-4 text-gray-400" />
        </button>
      ))}
    </div>
  );
}

export function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-6">
          <div className="w-16 h-16 rounded-full bg-forest/10 flex items-center justify-center text-[28px] font-bold text-forest">?</div>
          <p className="text-[16px] font-bold text-ink">Sign in to your account</p>
          <button onClick={() => navigate('/login')}
            className="w-full max-w-xs h-[46px] bg-forest text-white rounded-[13px] font-bold text-[14px]">
            Sign in
          </button>
        </div>
      </AppLayout>
    );
  }

  const initials = user.fullName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();
  const isSeller = user.role === UserRole.SELLER;
  const isBuyer = user.role === UserRole.BUYER;

  const handleLogout = async () => { await logout(); navigate('/'); };

  return (
    <AppLayout>
      {/* Header */}
      <div className="bg-forest px-4 pt-4 pb-6">
        <div className="flex items-center gap-3">
          <div className="w-[52px] h-[52px] rounded-full bg-white/15 border border-white/20 flex items-center justify-center text-[20px] font-bold text-white">
            {initials}
          </div>
          <div>
            <p className="text-[17px] font-bold text-white tracking-[-0.3px]">{user.fullName}</p>
            <p className="text-[12px] text-white/65">{user.phone} · {user.role}</p>
          </div>
        </div>
        <div className={`mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10.5px] font-bold ${
          user.gstStatus === 'ACTIVE' ? 'bg-white/15 text-white' : 'bg-copper-bg text-copper'
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${user.gstStatus === 'ACTIVE' ? 'bg-[#6CE9A6]' : 'bg-copper'}`} />
          GST {user.gstStatus}
          {user.businessName ? ` · ${user.businessName}` : ''}
        </div>
      </div>

      <div className="px-4 pt-4 space-y-3">
        {/* Seller tools */}
        {isSeller && (
          <NavGroup title="SELLER" items={[
            { label: 'Seller dashboard', path: '/seller/dashboard' },
            { label: 'My listings', path: '/seller/listings' },
            { label: 'Enquiries from buyers', path: '/seller/enquiries' },
            { label: 'Subscription & plan', path: '/seller/subscription' },
            { label: 'GST verification', path: '/seller/gst-verification' },
          ]} />
        )}

        {/* Buyer tools */}
        {isBuyer && (
          <NavGroup title="BUYER" items={[
            { label: 'Buyer dashboard', path: '/buyer/dashboard' },
            { label: 'My enquiries', path: '/enquiries' },
            { label: 'Saved listings', path: '/buyer/saved' },
            { label: 'Loan applications', path: '/buyer/loans' },
            { label: 'Buyback agreements', path: '/buyer/buyback' },
            { label: 'GST verification', path: '/buyer/gst-verification' },
            { label: 'Switch to seller', path: '/buyer/switch-to-seller' },
          ]} />
        )}

        {/* Account */}
        <NavGroup title="ACCOUNT" items={[
          { label: 'Browse all listings', path: '/search' },
        ]} />

        <button onClick={handleLogout}
          className="w-full h-[46px] bg-white border border-gray-200 rounded-[13px] text-[13.5px] font-semibold text-red-600">
          Sign out
        </button>
      </div>
    </AppLayout>
  );
}
