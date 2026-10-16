import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { QuoteDto } from '../../shared';
import { api } from '../../lib/api';
import { formatInrShort } from '../../lib/format';
import { AppLayout } from '../../components/AppLayout';
import { MachineIcon } from '../../components/icons';

const STATUS_STYLE: Record<string, string> = {
  SUBMITTED: 'bg-green-bg text-green-txt',
  WITHDRAWN: 'bg-red-50 text-red-600',
};

export function MyQuotes() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [quotes, setQuotes] = useState<QuoteDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<QuoteDto[]>('/quotes/mine')
      .then(({ data }) => setQuotes(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <AppLayout>
      <div className="bg-white border-b border-gray-200 px-4 pt-4 pb-3">
        <h1 className="text-[19px] font-extrabold text-ink tracking-[-0.4px]">{t('seller.myQuotes.title')}</h1>
        <p className="text-[12px] text-gray-500 mt-0.5">{t('seller.myQuotes.description')}</p>
      </div>

      <div className="px-4 pt-4 flex flex-col gap-3 pb-4">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-[13px] h-[80px] animate-pulse" />
          ))
        ) : quotes.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-14 h-14 rounded-full bg-forest/10 flex items-center justify-center mx-auto mb-3">
              <MachineIcon className="w-7 h-7 text-forest" />
            </div>
            <p className="text-[14px] font-semibold text-ink mb-1">{t('seller.myQuotes.emptyState.title')}</p>
            <p className="text-[12px] text-gray-500 mb-4">{t('seller.myQuotes.emptyState.description')}</p>
            <button onClick={() => navigate('/wanted')} className="bg-forest text-white text-[13px] font-bold px-5 py-2.5 rounded-[11px]">
              {t('seller.myQuotes.browseWanted')}
            </button>
          </div>
        ) : (
          quotes.map((q) => (
            <button key={q.id} onClick={() => navigate(`/wanted/${q.requirementId}`)} className="bg-white border border-gray-200 rounded-[13px] p-3.5 text-left">
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className={`inline-flex items-center text-[9px] font-bold px-1.5 py-0.5 rounded-[5px] ${STATUS_STYLE[q.status] ?? 'bg-gray-100 text-gray-600'}`}>
                  {t(`common:status.quote.${q.status}`, q.status)}
                </span>
                {q.price && <span className="font-mono text-[12px] font-bold text-forest">{formatInrShort(q.price)}</span>}
              </div>
              <p className="text-[13px] font-bold text-ink truncate">{q.requirement?.title}</p>
              <p className="text-[11px] text-gray-400 mt-0.5">{q.requirement?.machineCategory}</p>
            </button>
          ))
        )}
      </div>
    </AppLayout>
  );
}
