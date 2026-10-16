/**
 * BIM icon mark — 8-tooth gear in industrial orange on deep navy.
 * Use as a drop-in wherever the old BIM icon square was.
 */
export function BimIcon({ size = 36, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 72 72"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Navy rounded-square background */}
      <rect width="72" height="72" rx="16" fill="#0f2544" />

      {/*
        8-tooth gear, center (36,36), outer r=24, inner r=17.
        Path computed: each tooth spans 22.5Â°, each valley spans 22.5Â°.
      */}
      <path
        d="
          M 51.7,29.5
          L 59.5,31.3 L 59.5,40.7
          L 51.7,42.5
          L 56,49.3 L 49.3,56
          L 42.5,51.7
          L 40.7,59.5 L 31.3,59.5
          L 29.5,51.7
          L 22.7,56 L 16,49.3
          L 20.3,42.5
          L 12.5,40.7 L 12.5,31.3
          L 20.3,29.5
          L 16,22.7 L 22.7,16
          L 29.5,20.3
          L 31.3,12.5 L 40.7,12.5
          L 42.5,20.3
          L 49.3,16 L 56,22.7
          Z
        "
        fill="#f97316"
      />

      {/* Center bore — shows navy background through the gear */}
      <circle cx="36" cy="36" r="12" fill="#0f2544" />

      {/* Centre bolt dot */}
      <circle cx="36" cy="36" r="4.5" fill="#f97316" />

      {/* Subtle inner-ring detail */}
      <circle cx="36" cy="36" r="8.5" fill="none" stroke="#f97316" strokeWidth="1.5" opacity="0.35" />
    </svg>
  );
}

/** Compact icon + wordmark for sidebars and nav headers (dark context). */
export function BimLogoLight({ className = '' }: { className?: string }) {
  return (
    <span className={`flex items-center gap-2.5 ${className}`}>
      <BimIcon size={36} />
      <span className="flex flex-col leading-none">
        <span className="font-display text-[19px] font-semibold tracking-[-0.4px] text-white">
          BIM
        </span>
        <span className="mt-[3px] font-mono text-[9px] font-medium uppercase tracking-[0.12em] text-orange-400">
          Big Industrial Machines
        </span>
      </span>
    </span>
  );
}

/** Compact icon + wordmark for the public header (light context). */
export function BimLogoDark({ className = '' }: { className?: string }) {
  return (
    <span className={`flex items-center gap-2.5 ${className}`}>
      <BimIcon size={36} />
      <span className="flex flex-col leading-none">
        <span className="font-display text-[19px] font-semibold tracking-[-0.4px] text-ink">
          BIM
        </span>
        <span className="mt-[3px] font-mono text-[9px] font-medium uppercase tracking-[0.12em] text-copper">
          Big Industrial Machines
        </span>
      </span>
    </span>
  );
}

/** Full-width hero logo for footers, auth panels, and landing splash. */
export function BimLogoFull({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 296 72"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="BIM — Big Industrial Machines"
    >
      {/* Icon mark */}
      <rect width="72" height="72" rx="16" fill="#0f2544" />
      <path
        d="M 51.7,29.5 L 59.5,31.3 L 59.5,40.7 L 51.7,42.5 L 56,49.3 L 49.3,56 L 42.5,51.7 L 40.7,59.5 L 31.3,59.5 L 29.5,51.7 L 22.7,56 L 16,49.3 L 20.3,42.5 L 12.5,40.7 L 12.5,31.3 L 20.3,29.5 L 16,22.7 L 22.7,16 L 29.5,20.3 L 31.3,12.5 L 40.7,12.5 L 42.5,20.3 L 49.3,16 L 56,22.7 Z"
        fill="#f97316"
      />
      <circle cx="36" cy="36" r="12" fill="#0f2544" />
      <circle cx="36" cy="36" r="4.5" fill="#f97316" />
      <circle cx="36" cy="36" r="8.5" fill="none" stroke="#f97316" strokeWidth="1.5" opacity="0.35" />

      {/* Wordmark */}
      <text
        x="86"
        y="47"
        fontFamily="'Instrument Serif', 'Georgia', serif"
        fontWeight="600"
        fontSize="42"
        fill="#0f2544"
        letterSpacing="-1"
      >
        BIM
      </text>

      {/* Tagline */}
      <text
        x="88"
        y="65"
        fontFamily="'Plus Jakarta Sans', 'Arial', sans-serif"
        fontWeight="600"
        fontSize="10.5"
        fill="#64748b"
        letterSpacing="3"
      >
        BIG INDUSTRIAL MACHINES
      </text>
    </svg>
  );
}
