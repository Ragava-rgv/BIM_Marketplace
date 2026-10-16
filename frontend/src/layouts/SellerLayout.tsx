import { useTranslation } from 'react-i18next';
import { DashboardShell } from './DashboardShell';
import { ChatIcon, DocumentIcon, MachineIcon, PlusIcon, RupeeIcon, SearchIcon, ShieldCheckIcon } from '../components/icons';

function useSellerNavItems() {
  const { t } = useTranslation();
  return [
    { to: '/seller/dashboard', label: t('layout.sellerLayout.nav.dashboard'), icon: MachineIcon, end: true },
    { to: '/seller/listings', label: t('layout.sellerLayout.nav.myListings'), icon: MachineIcon },
    { to: '/seller/listings/new', label: t('layout.sellerLayout.nav.newListing'), icon: PlusIcon },
    { to: '/listings', label: t('layout.sellerLayout.nav.browseMarketplace'), icon: SearchIcon },
    { to: '/wanted', label: t('layout.sellerLayout.nav.browseWanted'), icon: DocumentIcon },
    { to: '/seller/quotes', label: t('layout.sellerLayout.nav.myQuotes'), icon: DocumentIcon },
    { to: '/seller/enquiries', label: t('layout.sellerLayout.nav.enquiries'), icon: ChatIcon },
    { to: '/seller/subscription', label: t('layout.sellerLayout.nav.subscription'), icon: RupeeIcon },
    { to: '/seller/gst-verification', label: t('layout.sellerLayout.nav.gstVerification'), icon: ShieldCheckIcon },
  ];
}

export function SellerLayout() {
  const { t } = useTranslation();
  const items = useSellerNavItems();
  return <DashboardShell title={t('layout.sellerLayout.title')} items={items} />;
}
