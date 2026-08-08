import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LANGUAGE_OPTIONS } from '@machinebazaar/shared';
import { useAuth } from '../lib/auth-context';
import { GlobeIcon } from './icons';

/** Language switcher — globe trigger, menu rows show each language as a native-script glyph badge
    so users recognize their language without reading English. List is data-driven off
    LANGUAGE_OPTIONS: adding a language later is one array entry, no component change. */
export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { t, i18n } = useTranslation('common');
  const { switchLanguage } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const active = i18n.resolvedLanguage ?? 'en';

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const activeOption = LANGUAGE_OPTIONS.find((opt) => opt.code.toLowerCase() === active) ?? LANGUAGE_OPTIONS[0];

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={t('languageSwitcher.title')}
        className={`inline-flex items-center gap-1.5 rounded-lg border border-line bg-white text-ink transition hover:border-ink ${
          compact ? 'h-[42px] w-[42px] justify-center' : 'px-3 py-2.5 text-[13px] font-bold'
        }`}
      >
        <GlobeIcon className="h-[17px] w-[17px] shrink-0" />
        {!compact && <span>{activeOption.glyph}</span>}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 w-48 rounded-[12px] border border-line bg-white shadow-[0_8px_28px_rgba(0,0,0,0.10)] z-50">
          <p className="px-3.5 pt-3 pb-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-muted">
            {t('languageSwitcher.title')}
          </p>
          <div className="p-1.5 pt-0.5">
            {LANGUAGE_OPTIONS.map((opt) => {
              const isActive = opt.code.toLowerCase() === active;
              return (
                <button
                  key={opt.code}
                  type="button"
                  onClick={() => {
                    void switchLanguage(opt.code);
                    setOpen(false);
                  }}
                  className={`w-full flex items-center gap-2.5 rounded-[8px] px-3 py-2 text-[13px] font-semibold transition text-left ${
                    isActive ? 'bg-forest-bg text-forest' : 'text-ink hover:bg-paper'
                  }`}
                >
                  <span
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[12px] font-bold select-none ${
                      isActive ? 'bg-forest text-white' : 'bg-paper-2 text-slate'
                    }`}
                  >
                    {opt.glyph}
                  </span>
                  {opt.nativeLabel}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
