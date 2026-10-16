import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AppLayout } from '../components/AppLayout';

export function NotFound() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  return (
    <AppLayout>
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
        <p className="font-mono text-[48px] font-bold text-forest opacity-20 leading-none mb-4">404</p>
        <p className="text-[16px] font-bold text-ink mb-1">{t('notFound.title')}</p>
        <p className="text-[12.5px] text-gray-500 mb-6">{t('notFound.body')}</p>
        <button onClick={() => navigate('/')}
          className="bg-forest text-white text-[13.5px] font-bold px-5 py-2.5 rounded-[11px]">
          {t('notFound.cta')}
        </button>
      </div>
    </AppLayout>
  );
}
