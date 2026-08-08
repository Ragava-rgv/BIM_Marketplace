import type { ReactNode, SVGProps } from 'react';

function Icon({ children, ...props }: SVGProps<SVGSVGElement> & { children: ReactNode }) {
  return (
    <svg viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth={1.6}
      strokeLinecap="round" strokeLinejoin="round" {...props}>
      {children}
    </svg>
  );
}

export const HomeIcon = (p: SVGProps<SVGSVGElement>) => <Icon {...p}><path d="M3 11l8-7 8 7v8a1 1 0 0 1-1 1h-4v-5h-6v5H4a1 1 0 0 1-1-1z" /></Icon>;
export const SearchIcon = (p: SVGProps<SVGSVGElement>) => <Icon {...p}><circle cx="10" cy="10" r="6" /><line x1="14.5" y1="14.5" x2="19" y2="19" /></Icon>;
export const PlusIcon = (p: SVGProps<SVGSVGElement>) => <Icon {...p}><line x1="11" y1="5" x2="11" y2="17" /><line x1="5" y1="11" x2="17" y2="11" /></Icon>;
export const InboxIcon = (p: SVGProps<SVGSVGElement>) => <Icon {...p}><path d="M3 6h16v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z" /><polyline points="3 6 11 13 19 6" /></Icon>;
export const ProfileIcon = (p: SVGProps<SVGSVGElement>) => <Icon {...p}><circle cx="11" cy="8" r="4" /><path d="M3 19a8 8 0 0 1 16 0" /></Icon>;
export const ArrowLeftIcon = (p: SVGProps<SVGSVGElement>) => <Icon {...p}><polyline points="11 4 5 9 11 14" /></Icon>;
export const HeartIcon = (p: SVGProps<SVGSVGElement>) => <Icon {...p}><path d="M9 16s-7-4-7-9a4 4 0 0 1 7-2.6A4 4 0 0 1 16 7c0 5-7 9-7 9z" /></Icon>;
export const ShareIcon = (p: SVGProps<SVGSVGElement>) => <Icon {...p}><polyline points="13 4 6 11 13 11" /><polyline points="9 7 6 11 9 15" /></Icon>;
export const EyeIcon = (p: SVGProps<SVGSVGElement>) => <Icon {...p}><path d="M1 11S4.5 4.5 11 4.5 21 11 21 11 17.5 17.5 11 17.5 1 11 1 11z" /><circle cx="11" cy="11" r="2.8" /></Icon>;
export const BellIcon = (p: SVGProps<SVGSVGElement>) => <Icon {...p}><path d="M8 1.5a4.5 4.5 0 0 0-4.5 4.5v3l-1.5 2h12L12.5 9V6A4.5 4.5 0 0 0 8 1.5z" /><path d="M6.5 13a1.5 1.5 0 0 0 3 0" /></Icon>;
export const MapPinIcon = (p: SVGProps<SVGSVGElement>) => <Icon {...p}><path d="M11 1C8.2 1 6 3.1 6 5.7 6 9.4 11 16 11 16s5-6.6 5-10.3C16 3.1 13.8 1 11 1z" /><circle cx="11" cy="5.7" r="2" /></Icon>;
export const CheckIcon = (p: SVGProps<SVGSVGElement>) => <Icon {...p}><polyline points="4 11 8.5 15.5 18 7" /></Icon>;
export const ChevronRightIcon = (p: SVGProps<SVGSVGElement>) => <Icon {...p}><polyline points="8 5 13 11 8 17" /></Icon>;
export const RupeeIcon = (p: SVGProps<SVGSVGElement>) => <Icon {...p}><path d="M5 4h12M5 8h12M5 4c3.5 0 5.5 1.3 5.5 3.5S8.5 11 5 11h-1l7 7" /></Icon>;
export const ShieldIcon = (p: SVGProps<SVGSVGElement>) => <Icon {...p}><path d="M11 2.5L4 5.5v4c0 4 2.9 7.6 7 8.8 4.1-1.2 7-4.8 7-8.8v-4L11 2.5z" /></Icon>;
export const MachineIcon = (p: SVGProps<SVGSVGElement>) => <Icon {...p}><rect x="3" y="9" width="13" height="9" rx="1.5" /><path d="M7 9V6a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3" /><circle cx="7.5" cy="13.5" r="1.4" /><circle cx="12.5" cy="13.5" r="1.4" /></Icon>;
export const ArrowUpIcon = (p: SVGProps<SVGSVGElement>) => <Icon {...p}><line x1="11" y1="17" x2="11" y2="5" /><polyline points="5 11 11 5 17 11" /></Icon>;
export const ArrowDownIcon = (p: SVGProps<SVGSVGElement>) => <Icon {...p}><line x1="11" y1="5" x2="11" y2="17" /><polyline points="5 11 11 17 17 11" /></Icon>;
export const StarIcon = (p: SVGProps<SVGSVGElement>) => <Icon {...p}><polygon points="11 2 13.7 8 20 9 15.3 13.3 16.5 20 11 16.7 5.5 20 6.7 13.3 2 9 8.3 8" /></Icon>;

export const PlayIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 9 9" {...p}><polygon points="2,1 7.5,4.5 2,8" /></svg>
);
