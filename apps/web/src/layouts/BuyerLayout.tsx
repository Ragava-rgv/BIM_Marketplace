import { DashboardShell } from './DashboardShell';
import { BankIcon, ChatIcon, MachineIcon, PlusIcon, SearchIcon, ShieldCheckIcon, TrendDownIcon, TruckIcon } from '../components/icons';

const ITEMS = [
  { to: '/buyer/dashboard', label: 'Dashboard', icon: MachineIcon, end: true },
  { to: '/listings', label: 'Browse listings', icon: SearchIcon },
  { to: '/buyer/enquiries', label: 'Enquiries', icon: ChatIcon },
  { to: '/buyer/saved', label: 'Saved listings', icon: TruckIcon },
  { to: '/buyer/loans', label: 'Loan applications', icon: BankIcon },
  { to: '/buyer/buyback', label: 'Buyback agreements', icon: TrendDownIcon },
  { to: '/buyer/gst-verification', label: 'GST verification', icon: ShieldCheckIcon },
  { to: '/buyer/switch-to-seller', label: 'Start selling', icon: PlusIcon },
];

export function BuyerLayout() {
  return <DashboardShell title="Buyer workspace" items={ITEMS} />;
}
