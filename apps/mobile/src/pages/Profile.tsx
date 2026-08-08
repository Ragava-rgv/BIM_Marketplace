import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LANGUAGE_OPTIONS, UserRole } from '@machinebazaar/shared';
import { useAuth } from '../lib/auth-context';
import { AppLayout } from '../components/AppLayout';
import { LanguageSheet } from '../components/LanguageSheet';
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
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [languageSheetOpen, setLanguageSheetOpen] = useState(false);

  if (!user) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-6">
          <div className="w-16 h-16 rounded-full bg-forest/10 flex items-center justify-center text-[28px] font-bold text-forest">?</div>
          <p className="text-[16px] font-bold text-ink">{t('profile.signInPrompt')}</p>
          <button onClick={() => navigate('/login')}
            className="w-full max-w-xs h-[46px] bg-forest text-white rounded-[13px] font-bold text-[14px]">
            {t('common:nav.login')}
          </button>
        </div>
      </AppLayout>
    );
  }

  const initials = user.fullName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();
  const isSeller = user.role === UserRole.SELLER;
  const isBuyer = user.role === UserRole.BUYER;
  const activeLanguage = LANGUAGE_OPTIONS.find((opt) => opt.code.toLowerCase() === (i18n.resolvedLanguage ?? 'en'));

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
            <p className="text-[12px] text-white/65">{user.phone} · {t(`common:role.${user.role.toLowerCase()}`)}</p>
          </div>
        </div>
        <div className={`mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10.5px] font-bold ${
          user.gstStatus === 'ACTIVE' ? 'bg-white/15 text-white' : 'bg-copper-bg text-copper'
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${user.gstStatus === 'ACTIVE' ? 'bg-[#6CE9A6]' : 'bg-copper'}`} />
          {t('profile.gstLabel', { status: t(`common:status.gst.${user.gstStatus}`) })}
          {user.businessName ? ` · ${user.businessName}` : ''}
        </div>
      </div>

      <div className="px-4 pt-4 space-y-3">
        {/* Preferences */}
        <div className="bg-white border border-gray-200 rounded-[13px] overflow-hidden">
          <p className="font-mono text-[9.5px] font-semibold text-gray-500 tracking-[0.08em] px-4 py-3 border-b border-gray-100">
            {t('profile.groups.preferences')}
          </p>
          <button onClick={() => setLanguageSheetOpen(true)}
            className="w-full flex items-center justify-between px-4 py-[13px]">
            <span className="text-[13.5px] font-semibold text-ink">{t('profile.items.language')}</span>
            <span className="flex items-center gap-1.5 text-[13px] font-semibold text-gray-500">
              {activeLanguage?.nativeLabel}
              <ChevronRightIcon className="w-4 h-4 text-gray-400" />
            </span>
          </button>
        </div>

        {/* Seller tools */}
        {isSeller && (
          <NavGroup title={t('profile.groups.seller')} items={[
            { label: t('profile.items.sellerDashboard'), path: '/seller/dashboard' },
            { label: t('profile.items.myListings'), path: '/seller/listings' },
            { label: t('profile.items.enquiriesFromBuyers'), path: '/seller/enquiries' },
            { label: t('profile.items.subscriptionPlan'), path: '/seller/subscription' },
            { label: t('profile.items.gstVerification'), path: '/seller/gst-verification' },
          ]} />
        )}

        {/* Buyer tools */}
        {isBuyer && (
          <NavGroup title={t('profile.groups.buyer')} items={[
            { label: t('profile.items.buyerDashboard'), path: '/buyer/dashboard' },
            { label: t('profile.items.myEnquiries'), path: '/enquiries' },
            { label: t('profile.items.savedListings'), path: '/buyer/saved' },
            { label: t('profile.items.loanApplications'), path: '/buyer/loans' },
            { label: t('profile.items.buybackAgreements'), path: '/buyer/buyback' },
            { label: t('profile.items.gstVerification'), path: '/buyer/gst-verification' },
            { label: t('profile.items.switchToSeller'), path: '/buyer/switch-to-seller' },
          ]} />
        )}

        {/* Account */}
        <NavGroup title={t('profile.groups.account')} items={[
          { label: t('profile.items.browseAllListings'), path: '/search' },
        ]} />

        <button onClick={handleLogout}
          className="w-full h-[46px] bg-white border border-gray-200 rounded-[13px] text-[13.5px] font-semibold text-red-600">
          {t('common:nav.signOut')}
        </button>
      </div>

      <LanguageSheet open={languageSheetOpen} onClose={() => setLanguageSheetOpen(false)} />
    </AppLayout>
  );
}
