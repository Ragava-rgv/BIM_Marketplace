import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { MonoLabel, Button } from '../../components/ui';
import { ChevronRightIcon } from '../../components/icons';

export function NotFound() {
  const { t } = useTranslation();
  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center px-6 py-24 text-center">
      <MonoLabel className="text-copper">— {t('public.notFound.errorCode')}</MonoLabel>
      <h1 className="mt-3 font-display text-[64px] font-medium leading-none tracking-[-1px] text-ink">404</h1>
      <p className="mt-4 text-[15px] leading-relaxed text-muted">
        {t('public.notFound.description')}
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link to="/listings">
          <Button>
            {t('public.notFound.browseListings')}
            <ChevronRightIcon className="h-4 w-4" />
          </Button>
        </Link>
        <Link to="/">
          <Button variant="ghost">{t('public.notFound.backToHome')}</Button>
        </Link>
      </div>
    </div>
  );
}
