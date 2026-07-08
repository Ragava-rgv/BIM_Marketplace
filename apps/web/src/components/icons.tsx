import type { ReactNode, SVGProps } from 'react';

/**
 * Minimal set of stroke-only line icons (project_spec.md §4: "SVG line icons only,
 * no emojis"). Each accepts standard SVG props so callers can size/color via className.
 */
function Icon({ children, ...props }: SVGProps<SVGSVGElement> & { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {children}
    </svg>
  );
}

export const SearchIcon = (props: SVGProps<SVGSVGElement>) => (
  <Icon {...props}>
    <circle cx="11" cy="11" r="7" />
    <path d="M21 21l-4.3-4.3" />
  </Icon>
);

export const MachineIcon = (props: SVGProps<SVGSVGElement>) => (
  <Icon {...props}>
    <rect x="3" y="9" width="13" height="9" rx="1.5" />
    <path d="M7 9V6a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3" />
    <circle cx="7.5" cy="13.5" r="1.4" />
    <circle cx="12.5" cy="13.5" r="1.4" />
    <path d="M16 12h3.2a1 1 0 0 1 .9.6l1.2 2.7a1 1 0 0 1 .1.4V18a1 1 0 0 1-1 1H16" />
  </Icon>
);

export const ShieldCheckIcon = (props: SVGProps<SVGSVGElement>) => (
  <Icon {...props}>
    <path d="M12 3l7 3v5c0 4.5-3 8.3-7 9.5C8 19.3 5 15.5 5 11V6l7-3z" />
    <path d="M9 12l2 2 4-4" />
  </Icon>
);

export const ChatIcon = (props: SVGProps<SVGSVGElement>) => (
  <Icon {...props}>
    <path d="M4 5h16v11H8l-4 4V5z" />
  </Icon>
);

export const RupeeIcon = (props: SVGProps<SVGSVGElement>) => (
  <Icon {...props}>
    <path d="M6 4h12M6 9h12M6 4c4 0 6 1.5 6 4s-2 4-6 4h-1l8 7" />
  </Icon>
);

export const DocumentIcon = (props: SVGProps<SVGSVGElement>) => (
  <Icon {...props}>
    <path d="M7 3h7l4 4v14H7z" />
    <path d="M14 3v4h4" />
    <path d="M9.5 12h5M9.5 15.5h5M9.5 8.5h2" />
  </Icon>
);

export const TruckIcon = (props: SVGProps<SVGSVGElement>) => (
  <Icon {...props}>
    <rect x="2" y="7" width="11" height="9" rx="1" />
    <path d="M13 10h4l3 3v3h-7z" />
    <circle cx="6" cy="18" r="1.6" />
    <circle cx="17" cy="18" r="1.6" />
  </Icon>
);

export const ChevronRightIcon = (props: SVGProps<SVGSVGElement>) => (
  <Icon {...props}>
    <path d="M9 6l6 6-6 6" />
  </Icon>
);

export const ChevronDownIcon = (props: SVGProps<SVGSVGElement>) => (
  <Icon {...props}>
    <path d="M6 9l6 6 6-6" />
  </Icon>
);

export const MenuIcon = (props: SVGProps<SVGSVGElement>) => (
  <Icon {...props}>
    <path d="M4 7h16M4 12h16M4 17h16" />
  </Icon>
);

export const CloseIcon = (props: SVGProps<SVGSVGElement>) => (
  <Icon {...props}>
    <path d="M6 6l12 12M18 6L6 18" />
  </Icon>
);

export const UploadIcon = (props: SVGProps<SVGSVGElement>) => (
  <Icon {...props}>
    <path d="M12 16V4M12 4l-4 4M12 4l4 4" />
    <path d="M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3" />
  </Icon>
);

export const VideoIcon = (props: SVGProps<SVGSVGElement>) => (
  <Icon {...props}>
    <rect x="3" y="6" width="13" height="12" rx="1.5" />
    <path d="M16 10.5l5-2.5v8l-5-2.5z" />
  </Icon>
);

export const PhotoIcon = (props: SVGProps<SVGSVGElement>) => (
  <Icon {...props}>
    <rect x="3" y="5" width="18" height="14" rx="1.5" />
    <circle cx="9" cy="11" r="1.6" />
    <path d="M21 17l-5.5-5.5a1.5 1.5 0 0 0-2 0L4 21" />
  </Icon>
);

export const CheckCircleIcon = (props: SVGProps<SVGSVGElement>) => (
  <Icon {...props}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M8.5 12.2l2.4 2.4 4.6-5" />
  </Icon>
);

export const AlertCircleIcon = (props: SVGProps<SVGSVGElement>) => (
  <Icon {...props}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 8v4.5M12 16h.01" />
  </Icon>
);

export const ClockIcon = (props: SVGProps<SVGSVGElement>) => (
  <Icon {...props}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7v5l3.2 1.9" />
  </Icon>
);

export const ArrowLeftIcon = (props: SVGProps<SVGSVGElement>) => (
  <Icon {...props}>
    <path d="M19 12H5M11 6l-6 6 6 6" />
  </Icon>
);

export const PlusIcon = (props: SVGProps<SVGSVGElement>) => (
  <Icon {...props}>
    <path d="M12 5v14M5 12h14" />
  </Icon>
);

export const TrashIcon = (props: SVGProps<SVGSVGElement>) => (
  <Icon {...props}>
    <path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m-9 0 1 12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-12" />
  </Icon>
);

export const BankIcon = (props: SVGProps<SVGSVGElement>) => (
  <Icon {...props}>
    <path d="M3 10l9-5 9 5" />
    <path d="M5 10v8M9.5 10v8M14.5 10v8M19 10v8" />
    <path d="M3 20h18" />
  </Icon>
);

export const TrendDownIcon = (props: SVGProps<SVGSVGElement>) => (
  <Icon {...props}>
    <path d="M4 7l6.5 6.5L14 10l6 6" />
    <path d="M20 11v5h-5" />
  </Icon>
);

export const UserIcon = (props: SVGProps<SVGSVGElement>) => (
  <Icon {...props}>
    <circle cx="12" cy="8" r="3.5" />
    <path d="M5 20c0-3.3 3.1-6 7-6s7 2.7 7 6" />
  </Icon>
);

export const LogoutIcon = (props: SVGProps<SVGSVGElement>) => (
  <Icon {...props}>
    <path d="M9 4H6a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h3" />
    <path d="M15 16l4-4-4-4M19 12H8" />
  </Icon>
);

export const MapPinIcon = (props: SVGProps<SVGSVGElement>) => (
  <Icon {...props}>
    <path d="M12 2c-3.3 0-6 2.6-6 6 0 4.5 6 12 6 12s6-7.5 6-12c0-3.4-2.7-6-6-6z" />
    <circle cx="12" cy="8" r="2.2" />
  </Icon>
);

export const PlayIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 9 9" {...props}>
    <polygon points="2.5,1.5 7.5,4.5 2.5,7.5" />
  </svg>
);

export const EyeIcon = (props: SVGProps<SVGSVGElement>) => (
  <Icon {...props}>
    <path d="M1 12S4.5 5.5 12 5.5 23 12 23 12 19.5 18.5 12 18.5 1 12 1 12z" />
    <circle cx="12" cy="12" r="3" />
  </Icon>
);

export const BuildingIcon = (props: SVGProps<SVGSVGElement>) => (
  <Icon {...props}>
    <rect x="4" y="3" width="16" height="18" rx="1.5" />
    <path d="M9 7h2M13 7h2M9 11h2M13 11h2M9 15h2M13 15h2" />
    <path d="M10 21v-3h4v3" />
  </Icon>
);

export const TargetIcon = (props: SVGProps<SVGSVGElement>) => (
  <Icon {...props}>
    <circle cx="12" cy="12" r="3.5" />
    <circle cx="12" cy="12" r="8" />
    <path d="M12 1v3.5M12 19.5V23M1 12h3.5M19.5 12H23" />
  </Icon>
);

/* ── Category icons (matching the spec-sheet machine-illustration style) ── */

export const CncTurningIcon = (props: SVGProps<SVGSVGElement>) => (
  <Icon {...props}>
    <circle cx="12" cy="12" r="3.5" />
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 1v3.5M12 19.5V23M1 12h3.5M19.5 12H23" />
  </Icon>
);

export const VmcIcon = (props: SVGProps<SVGSVGElement>) => (
  <Icon {...props}>
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <rect x="8.5" y="8.5" width="7" height="7" rx="1" />
  </Icon>
);

export const LatheIcon = (props: SVGProps<SVGSVGElement>) => (
  <Icon {...props}>
    <line x1="3" y1="12" x2="21" y2="12" />
    <rect x="6.5" y="7.5" width="11" height="9" rx="4.5" />
  </Icon>
);

export const PressIcon = (props: SVGProps<SVGSVGElement>) => (
  <Icon {...props}>
    <rect x="2" y="10" width="20" height="11" rx="2" />
    <rect x="7.5" y="5.5" width="9" height="4.5" rx="1" />
    <line x1="12" y1="21" x2="12" y2="23" />
  </Icon>
);

export const InjectionIcon = (props: SVGProps<SVGSVGElement>) => (
  <Icon {...props}>
    <rect x="3" y="8" width="18" height="12" rx="2" />
    <path d="M9 8V5.5a2.5 2.5 0 0 1 5 0V8" />
    <circle cx="12" cy="14" r="2.4" />
  </Icon>
);

export const EdmIcon = (props: SVGProps<SVGSVGElement>) => (
  <Icon {...props}>
    <polyline points="3 17 8 12 12 15 20 6" />
    <polyline points="15 6 20 6 20 11" />
  </Icon>
);

export const GridIcon = (props: SVGProps<SVGSVGElement>) => (
  <Icon {...props}>
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
    <rect x="14" y="14" width="7" height="7" rx="1" />
  </Icon>
);

export const DownloadIcon = (props: SVGProps<SVGSVGElement>) => (
  <Icon {...props}>
    <path d="M12 3v12m0 0-4-4m4 4 4-4M3 18h18" strokeLinecap="round" strokeLinejoin="round" />
  </Icon>
);
