import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { humanizeStatus } from '../lib/format';

export function PageHeading({ eyebrow, title, description }: { eyebrow?: string; title: string; description?: string }) {
  return (
    <div className="mb-8">
      {eyebrow && <p className="mb-2 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-copper">— {eyebrow}</p>}
      <h1 className="font-display text-3xl text-ink sm:text-4xl">{title}</h1>
      {description && <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-muted">{description}</p>}
    </div>
  );
}

export function Button({
  variant = 'primary',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'copper' }) {
  const base =
    'inline-flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-50 shadow-[0_1px_0_rgba(0,0,0,0.05),inset_0_1px_0_rgba(255,255,255,0.08)]';
  const variants: Record<string, string> = {
    primary: 'bg-forest text-white hover:bg-forest-2',
    secondary: 'bg-ink text-white hover:bg-black',
    ghost: 'border border-line text-ink shadow-none hover:border-ink',
    danger: 'bg-red-600 text-white hover:bg-red-700',
    copper: 'bg-copper text-white hover:bg-copper-2',
  };
  return <button className={`${base} ${variants[variant]} ${className}`} {...props} />;
}

export function Input({ className = '', ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-sm text-ink placeholder:text-muted outline-none transition focus:border-forest focus:ring-2 focus:ring-forest/10 ${className}`}
      {...props}
    />
  );
}

export function Textarea({ className = '', ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={`w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-sm text-ink placeholder:text-muted outline-none transition focus:border-forest focus:ring-2 focus:ring-forest/10 ${className}`}
      {...props}
    />
  );
}

export function Select({ className = '', children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={`w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-sm text-ink outline-none transition focus:border-forest focus:ring-2 focus:ring-forest/10 disabled:cursor-not-allowed disabled:bg-navy/[0.04] disabled:text-muted ${className}`}
      {...props}
    >
      {children}
    </select>
  );
}

export function Field({ label, children, hint, required }: { label: string; children: ReactNode; hint?: string; required?: boolean }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-ink">
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </span>
      {children}
      {hint && <span className="mt-1 block text-xs text-muted">{hint}</span>}
    </label>
  );
}

export function Card({ className = '', children }: { className?: string; children: ReactNode }) {
  return <div className={`rounded-2xl border border-line bg-white p-6 ${className}`}>{children}</div>;
}

/** Small uppercase mono-spaced label, used for spec headings, IDs, and eyebrows. */
export function MonoLabel({ className = '', children }: { className?: string; children: ReactNode }) {
  return (
    <span className={`font-mono text-[10.5px] font-semibold uppercase tracking-[0.1em] text-muted ${className}`}>
      {children}
    </span>
  );
}

/** Pill tag — cert/uncert/video badges used on listing media. */
export function Tag({
  tone = 'neutral',
  className = '',
  children,
}: {
  tone?: 'cert' | 'uncert' | 'dark' | 'neutral';
  className?: string;
  children: ReactNode;
}) {
  const tones: Record<string, string> = {
    cert: 'bg-green-bg text-green-txt border-green-bdr',
    uncert: 'bg-copper-bg text-copper border-copper-bdr',
    dark: 'bg-ink text-white border-ink',
    neutral: 'bg-white text-ink border-line',
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold ${tones[tone]} ${className}`}
    >
      {tone === 'cert' && <span className="h-1.5 w-1.5 rounded-full bg-green-txt" />}
      {tone === 'uncert' && <span className="h-1.5 w-1.5 rounded-full bg-copper" />}
      {children}
    </span>
  );
}

const STATUS_TONES: Record<string, string> = {
  ACTIVE: 'bg-green-bg text-green-txt ring-green-bdr',
  APPROVED: 'bg-green-bg text-green-txt ring-green-bdr',
  COMPLETED: 'bg-green-bg text-green-txt ring-green-bdr',
  PAID: 'bg-green-bg text-green-txt ring-green-bdr',
  CONTACT_RELEASED: 'bg-green-bg text-green-txt ring-green-bdr',
  ACCEPTED: 'bg-green-bg text-green-txt ring-green-bdr',

  PENDING_REVIEW: 'bg-copper-bg text-copper ring-copper-bdr',
  PENDING: 'bg-copper-bg text-copper ring-copper-bdr',
  IN_PROGRESS: 'bg-copper-bg text-copper ring-copper-bdr',
  REQUESTED: 'bg-copper-bg text-copper ring-copper-bdr',
  SUBMITTED: 'bg-copper-bg text-copper ring-copper-bdr',
  CERT_PENDING: 'bg-copper-bg text-copper ring-copper-bdr',
  WITH_PARTNER: 'bg-copper-bg text-copper ring-copper-bdr',
  UNDER_OFFER: 'bg-copper-bg text-copper ring-copper-bdr',
  QUOTED: 'bg-copper-bg text-copper ring-copper-bdr',
  OPEN: 'bg-copper-bg text-copper ring-copper-bdr',
  UNVERIFIED: 'bg-copper-bg text-copper ring-copper-bdr',

  REJECTED: 'bg-rose-50 text-rose-700 ring-rose-600/20',
  WITHDRAWN: 'bg-rose-50 text-rose-700 ring-rose-600/20',
  EXPIRED: 'bg-rose-50 text-rose-700 ring-rose-600/20',
  CLOSED: 'bg-rose-50 text-rose-700 ring-rose-600/20',
  INACTIVE: 'bg-rose-50 text-rose-700 ring-rose-600/20',

  DRAFT: 'bg-paper-2 text-slate ring-line-2',
  SOLD: 'bg-ink/10 text-ink ring-ink/15',
};

export function StatusBadge({ status }: { status: string }) {
  const tone = STATUS_TONES[status] ?? 'bg-paper-2 text-slate ring-line-2';
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold ring-1 ring-inset ${tone}`}>
      {humanizeStatus(status)}
    </span>
  );
}

export function EmptyState({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-line-2 bg-paper px-6 py-14 text-center">
      <p className="font-display text-xl text-ink">{title}</p>
      {description && <p className="mx-auto mt-2 max-w-md text-sm text-muted">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Spinner({ className = '' }: { className?: string }) {
  return (
    <span
      className={`inline-block h-5 w-5 animate-spin rounded-full border-2 border-line border-t-forest ${className}`}
      aria-label="Loading"
    />
  );
}

export function LoadingBlock() {
  return (
    <div className="flex items-center justify-center py-20">
      <Spinner />
    </div>
  );
}

export function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">{message}</div>
  );
}

export function SuccessBanner({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-forest-bdr bg-forest-bg px-4 py-3 text-sm font-medium text-forest">{message}</div>
  );
}
