import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { PaginatedResult, RequirementDto } from '../shared';
import { api } from '../lib/api';
import { formatInrShort } from '../lib/format';
import { AppLayout } from '../components/AppLayout';
import { MachineIcon, MapPinIcon } from '../components/icons';

export function Wanted() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [result, setResult] = useState<PaginatedResult<RequirementDto> | null>(null);

  useEffect(() => {
    api.get<PaginatedResult<RequirementDto>>('/requirements', { params: { pageSize: 30 } })
      .then(({ data }) => setResult(data))
      .catch(() => setResult({ items: [], total: 0, page: 1, pageSize: 30 }));
  }, []);

  return (
    <AppLayout>
      <div className="bg-white border-b border-gray-200 px-4 pt-4 pb-3">
        <h1 className="text-[19px] font-extrabold text-ink tracking-[-0.4px]">{t('wanted.title')}</h1>
        <p className="text-[11.5px] text-gray-500 mt-1 leading-relaxed">{t('wanted.intro')}</p>
      </div>

      <div className="px-4 pt-4 flex flex-col gap-3 pb-4">
        {result === null ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-[13px] h-[90px] animate-pulse" />
          ))
        ) : result.items.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-14 h-14 rounded-full bg-forest/10 flex items-center justify-center mx-auto mb-3">
              <MachineIcon className="w-7 h-7 text-forest" />
            </div>
            <p className="text-[14px] font-semibold text-ink mb-1">{t('wanted.emptyState.title')}</p>
            <p className="text-[12px] text-gray-500">{t('wanted.emptyState.description')}</p>
          </div>
        ) : (
          result.items.map((req) => (
            <button
              key={req.id}
              onClick={() => navigate(`/wanted/${req.id}`)}
              className="bg-white border border-gray-200 rounded-[13px] p-3.5 text-left"
            >
              <span className="inline-flex items-center text-[9px] font-bold px-1.5 py-0.5 rounded-[5px] bg-copper-bg text-copper mb-1.5">
                {t('wanted.badge')}
              </span>
              <p className="text-[13.5px] font-bold text-ink truncate">{req.title}</p>
              <p className="text-[11.5px] text-gray-400 mt-0.5">{req.machineCategory}</p>
              {(req.locationCity || req.locationState) && (
                <p className="flex items-center gap-1 text-[11px] text-gray-400 mt-1">
                  <MapPinIcon className="w-3 h-3" />
                  {[req.locationCity, req.locationState].filter(Boolean).join(', ')}
                </p>
              )}
              {req.budgetMax && <p className="font-mono text-[13px] font-bold text-forest mt-1.5">{formatInrShort(req.budgetMax)}</p>}
            </button>
          ))
        )}
      </div>
    </AppLayout>
  );
}
