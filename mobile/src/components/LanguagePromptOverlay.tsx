import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Preferences } from '@capacitor/preferences';
import { LANGUAGE_OPTIONS } from '../shared';
import { useAuth } from '../lib/auth-context';

const PROMPTED_KEY = 'bim_lang_prompted';

/** Shown once on first run so a new user picks a language before browsing. Gated by a stored
    flag checked on mount — main.tsx already awaits initI18n() before rendering, so there's no flash. */
export function LanguagePromptOverlay() {
  const { t } = useTranslation();
  const { switchLanguage } = useAuth();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    Preferences.get({ key: PROMPTED_KEY }).then(({ value }) => {
      if (!value) setVisible(true);
    });
  }, []);

  if (!visible) return null;

  const choose = async (code: (typeof LANGUAGE_OPTIONS)[number]['code']) => {
    await switchLanguage(code);
    await Preferences.set({ key: PROMPTED_KEY, value: '1' });
    setVisible(false);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-white flex flex-col items-center justify-center px-6">
      <p className="font-mono text-[10px] font-semibold text-gray-500 tracking-[0.1em] uppercase mb-2">
        {t('common:languageSwitcher.title')}
      </p>
      <h1 className="text-[19px] font-extrabold text-ink tracking-[-0.3px] mb-6">
        {t('onboarding.chooseLanguage')}
      </h1>
      <div className="w-full max-w-xs space-y-2.5">
        {LANGUAGE_OPTIONS.map((opt) => (
          <button
            key={opt.code}
            onClick={() => void choose(opt.code)}
            className="w-full flex items-center gap-3 rounded-[13px] border border-gray-200 px-4 py-3.5 text-left transition hover:border-forest"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100 text-[15px] font-bold text-gray-500 select-none">
              {opt.glyph}
            </span>
            <span className="flex-1 text-[14.5px] font-bold text-ink">{opt.nativeLabel}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
