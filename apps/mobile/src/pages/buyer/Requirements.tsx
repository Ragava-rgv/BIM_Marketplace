import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { RequirementDto } from '@machinebazaar/shared';
import { api } from '../../lib/api';
import { AppLayout } from '../../components/AppLayout';
import { PlusIcon, MachineIcon } from '../../components/icons';

const STATUS_STYLE: Record<string, string> = {
  ACTIVE: 'bg-green-bg text-green-txt',
  PENDING_REVIEW: 'bg-copper-bg text-copper',
  DRAFT: 'bg-gray-100 text-gray-600',
  REJECTED: 'bg-red-50 text-red-600',
  FULFILLED: 'bg-forest text-white',
  CLOSED: 'bg-gray-200 text-gray-600',
};

export function BuyerRequirements() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [requirements, setRequirements] = useState<RequirementDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<RequirementDto[]>('/requirements/mine/all')
      .then(({ data }) => setRequirements(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <AppLayout>
      <div className="bg-white border-b border-gray-200 px-4 pt-4 pb-3 flex items-center justify-between">
        <div>
          <h1 className="text-[19px] font-extrabold text-ink tracking-[-0.4px]">{t('buyer.requirements.title')}</h1>
          <p className="text-[12px] text-gray-500 mt-0.5">{t('buyer.requirements.description')}</p>
        </div>
        <button onClick={() => navigate('/buyer/requirements/new')}
          className="flex items-center gap-1.5 bg-forest text-white text-[12px] font-bold px-3 py-2 rounded-[10px]">
          <PlusIcon className="w-3.5 h-3.5 stroke-white stroke-[2.5px]" />
          {t('buyer.requirements.postRequirement')}
        </button>
      </div>

      <div className="px-4 pt-4 flex flex-col gap-3 pb-4">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-[13px] h-[90px] animate-pulse" />
          ))
        ) : requirements.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-14 h-14 rounded-full bg-forest/10 flex items-center justify-center mx-auto mb-3">
              <MachineIcon className="w-7 h-7 text-forest" />
            </div>
            <p className="text-[14px] font-semibold text-ink mb-1">{t('buyer.requirements.emptyState.title')}</p>
            <p className="text-[12px] text-gray-500 mb-4">{t('buyer.requirements.emptyState.description')}</p>
            <button onClick={() => navigate('/buyer/requirements/new')} className="bg-forest text-white text-[13px] font-bold px-5 py-2.5 rounded-[11px]">
              {t('buyer.requirements.postRequirement')}
            </button>
          </div>
        ) : (
          requirements.map((req) => (
            <button
              key={req.id}
              onClick={() => navigate(`/buyer/requirements/${req.id}/edit`)}
              className="bg-white border border-gray-200 rounded-[13px] p-3.5 text-left"
            >
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className={`inline-flex items-center text-[9px] font-bold px-1.5 py-0.5 rounded-[5px] ${STATUS_STYLE[req.status] ?? 'bg-gray-100 text-gray-600'}`}>
                  {t(`common:status.requirement.${req.status}`, req.status)}
                </span>
                <span className="text-[11px] text-gray-500">{t('buyer.requirements.table.quotes')}: {req.quotes?.length ?? 0}</span>
              </div>
              <p className="text-[13.5px] font-bold text-ink truncate">{req.title}</p>
              <p className="text-[11.5px] text-gray-400 mt-0.5">{req.machineCategory}</p>
            </button>
          ))
        )}
      </div>
    </AppLayout>
  );
}
