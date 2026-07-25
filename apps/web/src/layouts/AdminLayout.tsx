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

const ITEMS = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: MachineIcon, end: true },
  { to: '/admin/listings', label: 'Listing review', icon: DocumentIcon },
  { to: '/admin/enquiries', label: 'Enquiries', icon: ChatIcon },
  { to: '/admin/transactions', label: 'Transactions', icon: RupeeIcon },
  { to: '/admin/certifications', label: 'Certifications', icon: ShieldCheckIcon },
  { to: '/admin/loan-applications', label: 'Loan applications', icon: BankIcon },
  { to: '/admin/finance-partners', label: 'Finance partners', icon: BankIcon },
  { to: '/admin/depreciation', label: 'Depreciation schedule', icon: TrendDownIcon },
  { to: '/admin/buyback', label: 'Buyback agreements', icon: TrendDownIcon },
  { to: '/admin/subscription-plans', label: 'Subscription plans', icon: RupeeIcon },
  { to: '/admin/buyer-subscription-plans', label: 'Buyer plans', icon: RupeeIcon },
  { to: '/admin/buyer-subscriptions', label: 'Buyer subscriptions', icon: RupeeIcon },
  { to: '/admin/boost-plans', label: 'Boost tiers', icon: StarIcon },
  { to: '/admin/advertisements', label: 'Ad slots', icon: PhotoIcon },
  { to: '/admin/catalog', label: 'Machine catalog', icon: GridIcon },
  { to: '/admin/settings', label: 'Platform settings', icon: GridIcon },
];

export function AdminLayout() {
  return <DashboardShell title="Admin console" items={ITEMS} />;
}
