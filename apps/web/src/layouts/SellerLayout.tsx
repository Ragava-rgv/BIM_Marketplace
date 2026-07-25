import { DashboardShell } from './DashboardShell';
import { ChatIcon, MachineIcon, PlusIcon, RupeeIcon, SearchIcon, ShieldCheckIcon } from '../components/icons';

const ITEMS = [
  { to: '/seller/dashboard', label: 'Dashboard', icon: MachineIcon, end: true },
  { to: '/seller/listings', label: 'My listings', icon: MachineIcon },
  { to: '/seller/listings/new', label: 'New listing', icon: PlusIcon },
  { to: '/listings', label: 'Browse marketplace', icon: SearchIcon },
  { to: '/seller/enquiries', label: 'Enquiries', icon: ChatIcon },
  { to: '/seller/subscription', label: 'Subscription', icon: RupeeIcon },
  { to: '/seller/gst-verification', label: 'GST verification', icon: ShieldCheckIcon },
];

export function SellerLayout() {
  return <DashboardShell title="Seller workspace" items={ITEMS} />;
}
