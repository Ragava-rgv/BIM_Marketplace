import { useTranslation } from 'react-i18next';
import { LANGUAGE_OPTIONS } from '../shared';
import { useAuth } from '../lib/auth-context';
import { CheckIcon } from './icons';

interface Props {
  open: boolean;
  onClose: () => void;
}

export function LanguageSheet({ open, onClose }: Props) {
  const { t, i18n } = useTranslation('common');
  const { switchLanguage } = useAuth();
  const active = i18n.resolvedLanguage ?? 'en';

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-[60] bg-black/40" onClick={onClose} />
      <div
        className="fixed bottom-0 left-0 right-0 z-[70] bg-white rounded-t-[24px] px-6 pt-5"
        style={{ paddingBottom: `calc(env(safe-area-inset-bottom) + 24px)` }}
      >
        <div className="w-10 h-1 rounded-full bg-gray-200 mx-auto mb-5" />
        <div className="flex items-start justify-between mb-4">
          <h2 className="text-[18px] font-extrabold text-ink tracking-[-0.3px]">{t('languageSwitcher.title')}</h2>
          <button onClick={onClose} aria-label={t('common.button.close')} className="text-gray-400 text-[20px] leading-none px-1">
            ×
          </button>
        </div>

        <div className="space-y-2 mb-2">
          {LANGUAGE_OPTIONS.map((opt) => {
            const isActive = opt.code.toLowerCase() === active;
            return (
              <button
                key={opt.code}
                onClick={() => {
                  void switchLanguage(opt.code);
                  onClose();
                }}
                className={`w-full flex items-center gap-3 rounded-[13px] border px-4 py-3.5 text-left transition ${
                  isActive ? 'border-forest bg-forest-bg' : 'border-gray-200'
                }`}
              >
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[15px] font-bold select-none ${
                    isActive ? 'bg-forest text-white' : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {opt.glyph}
                </span>
                <span className={`flex-1 text-[14.5px] font-bold ${isActive ? 'text-forest' : 'text-ink'}`}>
                  {opt.nativeLabel}
                </span>
                {isActive && <CheckIcon className="w-5 h-5 text-forest" />}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
