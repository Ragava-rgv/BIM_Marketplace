import { useTranslation } from 'react-i18next';
import { DashboardShell } from './DashboardShell';
import { BankIcon, ChatIcon, MachineIcon, PlusIcon, RupeeIcon, SearchIcon, ShieldCheckIcon, TrendDownIcon, TruckIcon } from '../components/icons';

function useBuyerNavItems() {
  const { t } = useTranslation();
  return [
    { to: '/buyer/dashboard', label: t('layout.buyerLayout.nav.dashboard'), icon: MachineIcon, end: true },
    { to: '/listings', label: t('layout.buyerLayout.nav.browseListings'), icon: SearchIcon },
    { to: '/buyer/enquiries', label: t('layout.buyerLayout.nav.enquiries'), icon: ChatIcon },
    { to: '/buyer/saved', label: t('layout.buyerLayout.nav.savedListings'), icon: TruckIcon },
    { to: '/buyer/subscription', label: t('layout.buyerLayout.nav.contactViews'), icon: RupeeIcon },
    { to: '/buyer/loans', label: t('layout.buyerLayout.nav.loanApplications'), icon: BankIcon },
    { to: '/buyer/buyback', label: t('layout.buyerLayout.nav.buybackAgreements'), icon: TrendDownIcon },
    { to: '/buyer/gst-verification', label: t('layout.buyerLayout.nav.gstVerification'), icon: ShieldCheckIcon },
    { to: '/buyer/switch-to-seller', label: t('layout.buyerLayout.nav.startSelling'), icon: PlusIcon },
  ];
}

export function BuyerLayout() {
  const { t } = useTranslation();
  const items = useBuyerNavItems();
  return <DashboardShell title={t('layout.buyerLayout.title')} items={items} />;
}
