import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { RequirementDto } from '@machinebazaar/shared';
import { api } from '../../lib/api';
import { Button, EmptyState, LoadingBlock, PageHeading, StatusBadge } from '../../components/ui';
import { PlusIcon } from '../../components/icons';

export function BuyerRequirements() {
  const { t } = useTranslation();
  const [requirements, setRequirements] = useState<RequirementDto[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    api
      .get<RequirementDto[]>('/requirements/mine/all')
      .then(({ data }) => { if (!cancelled) setRequirements(data); })
      .catch(() => { if (!cancelled) setRequirements([]); });
    return () => { cancelled = true; };
  }, []);

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <PageHeading eyebrow={t('buyer.requirements.eyebrow')} title={t('buyer.requirements.title')} description={t('buyer.requirements.description')} />
        <Link to="/buyer/requirements/new">
          <Button>
            <PlusIcon className="h-4 w-4" />
            {t('buyer.requirements.postRequirement')}
          </Button>
        </Link>
      </div>

      {requirements === null ? (
        <LoadingBlock />
      ) : requirements.length === 0 ? (
        <EmptyState
          title={t('buyer.requirements.emptyState.title')}
          description={t('buyer.requirements.emptyState.description')}
          action={
            <Link to="/buyer/requirements/new">
              <Button>{t('buyer.requirements.postRequirement')}</Button>
            </Link>
          }
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-navy/10 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-navy/10 bg-navy/[0.02] text-left text-xs font-semibold uppercase tracking-wide text-navy/40">
                <tr>
                  <th className="px-5 py-3">{t('buyer.requirements.table.requirement')}</th>
                  <th className="px-5 py-3">{t('buyer.requirements.table.status')}</th>
                  <th className="px-5 py-3">{t('buyer.requirements.table.quotes')}</th>
                  <th className="px-5 py-3">{t('buyer.requirements.table.updated')}</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-navy/10">
                {requirements.map((req) => (
                  <tr key={req.id} className="transition hover:bg-navy/[0.02]">
                    <td className="px-5 py-4">
                      <p className="font-semibold text-navy">{req.title}</p>
                      <p className="text-navy/45">{req.machineCategory}</p>
                    </td>
                    <td className="px-5 py-4"><StatusBadge status={req.status} /></td>
                    <td className="px-5 py-4 text-navy/60">{req.quotes?.length ?? 0}</td>
                    <td className="px-5 py-4 text-navy/45">{new Date(req.updatedAt).toLocaleDateString('en-IN')}</td>
                    <td className="px-5 py-4 text-right">
                      <Link to={`/buyer/requirements/${req.id}/edit`} className="text-sm font-semibold text-accent hover:text-accent-dark">
                        {t('buyer.requirements.manage')}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
