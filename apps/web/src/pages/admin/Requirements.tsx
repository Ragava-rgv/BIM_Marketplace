import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { PaginatedResult, RequirementDto } from '@machinebazaar/shared';
import { api } from '../../lib/api';
import { EmptyState, LoadingBlock, PageHeading, Select, StatusBadge } from '../../components/ui';

const STATUS_OPTIONS = ['PENDING_REVIEW', 'ACTIVE', 'FULFILLED', 'CLOSED', 'REJECTED'];

export function AdminRequirements() {
  const { t } = useTranslation();
  const [status, setStatus] = useState('PENDING_REVIEW');
  const [result, setResult] = useState<PaginatedResult<RequirementDto> | null>(null);

  useEffect(() => {
    let cancelled = false;
    setResult(null);
    api.get<PaginatedResult<RequirementDto>>('/admin/requirements', { params: { status, pageSize: 50 } })
      .then(({ data }) => { if (!cancelled) setResult(data); })
      .catch(() => { if (!cancelled) setResult({ items: [], total: 0, page: 1, pageSize: 50 }); });
    return () => { cancelled = true; };
  }, [status]);

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <PageHeading eyebrow={t('admin.requirements.eyebrow')} title={t('admin.requirements.title')} description={t('admin.requirements.description')} />
        <Select value={status} onChange={(e) => setStatus(e.target.value)} className="w-48">
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>{t(`common:status.requirement.${s}`, s)}</option>
          ))}
        </Select>
      </div>

      {result === null ? (
        <LoadingBlock />
      ) : result.items.length === 0 ? (
        <EmptyState title={t('admin.requirements.emptyState.title')} description={t('admin.requirements.emptyState.description')} />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-navy/10 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-navy/10 bg-navy/[0.02] text-left text-xs font-semibold uppercase tracking-wide text-navy/40">
                <tr>
                  <th className="px-5 py-3">{t('admin.requirements.table.requirement')}</th>
                  <th className="px-5 py-3">{t('admin.requirements.table.buyer')}</th>
                  <th className="px-5 py-3">{t('admin.requirements.table.status')}</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-navy/10">
                {result.items.map((req) => (
                  <tr key={req.id} className="transition hover:bg-navy/[0.02]">
                    <td className="px-5 py-4">
                      <p className="font-semibold text-navy">{req.title}</p>
                      <p className="text-navy/45">{req.machineCategory}</p>
                    </td>
                    <td className="px-5 py-4 text-navy/70">{req.buyer?.fullName}</td>
                    <td className="px-5 py-4"><StatusBadge status={req.status} /></td>
                    <td className="px-5 py-4 text-right">
                      <Link to={`/admin/requirements/${req.id}`} className="text-sm font-semibold text-accent hover:text-accent-dark">
                        {t('admin.requirements.review')}
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
