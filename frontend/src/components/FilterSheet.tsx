import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { CloseIcon } from './icons';

/**
 * Mobile-only bottom sheet: backdrop + panel sliding up from the bottom, dismissible by
 * backdrop click or the close button. Mirrors the same open/close/backdrop pattern already
 * used by DashboardShell's mobile drawer, just anchored to the bottom instead of a side.
 */
export function FilterSheet({
  open,
  onClose,
  title,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const { t } = useTranslation();
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end md:hidden">
      <div className="absolute inset-0 bg-ink/40" onClick={onClose} />
      <div className="relative flex max-h-[85vh] flex-col rounded-t-2xl bg-white shadow-[0_-8px_32px_rgba(0,0,0,0.15)]">
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <p className="font-display text-lg text-ink">{title ?? t('components.filterSheet.defaultTitle')}</p>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('components.filterSheet.closeAria')}
            className="rounded-lg p-1.5 text-muted transition hover:text-ink"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div className="border-t border-line px-5 py-4">{footer}</div>}
      </div>
    </div>
  );
}
