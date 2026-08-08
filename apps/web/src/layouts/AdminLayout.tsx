import { useTranslation } from 'react-i18next';
import { DashboardShell } from './DashboardShell';
import {
  BankIcon,
  ChatIcon,
  DocumentIcon,
  GridIcon,
  MachineIcon,
  PhotoIcon,
  RupeeIcon,
  ShieldCheckIcon,
  StarIcon,
  TrendDownIcon,
} from '../components/icons';

function useAdminNavItems() {
  const { t } = useTranslation();
  return [
    { to: '/admin/dashboard', label: t('layout.adminLayout.nav.dashboard'), icon: MachineIcon, end: true },
    { to: '/admin/listings', label: t('layout.adminLayout.nav.listingReview'), icon: DocumentIcon },
    { to: '/admin/enquiries', label: t('layout.adminLayout.nav.enquiries'), icon: ChatIcon },
    { to: '/admin/transactions', label: t('layout.adminLayout.nav.transactions'), icon: RupeeIcon },
    { to: '/admin/certifications', label: t('layout.adminLayout.nav.certifications'), icon: ShieldCheckIcon },
    { to: '/admin/loan-applications', label: t('layout.adminLayout.nav.loanApplications'), icon: BankIcon },
    { to: '/admin/finance-partners', label: t('layout.adminLayout.nav.financePartners'), icon: BankIcon },
    { to: '/admin/depreciation', label: t('layout.adminLayout.nav.depreciationSchedule'), icon: TrendDownIcon },
    { to: '/admin/buyback', label: t('layout.adminLayout.nav.buybackAgreements'), icon: TrendDownIcon },
    { to: '/admin/subscription-plans', label: t('layout.adminLayout.nav.subscriptionPlans'), icon: RupeeIcon },
    { to: '/admin/buyer-subscription-plans', label: t('layout.adminLayout.nav.buyerPlans'), icon: RupeeIcon },
    { to: '/admin/buyer-subscriptions', label: t('layout.adminLayout.nav.buyerSubscriptions'), icon: RupeeIcon },
    { to: '/admin/boost-plans', label: t('layout.adminLayout.nav.boostTiers'), icon: StarIcon },
    { to: '/admin/advertisements', label: t('layout.adminLayout.nav.adSlots'), icon: PhotoIcon },
    { to: '/admin/catalog', label: t('layout.adminLayout.nav.machineCatalog'), icon: GridIcon },
    { to: '/admin/settings', label: t('layout.adminLayout.nav.platformSettings'), icon: GridIcon },
  ];
}

export function AdminLayout() {
  const { t } = useTranslation();
  const items = useAdminNavItems();
  return <DashboardShell title={t('layout.adminLayout.title')} items={items} />;
}
