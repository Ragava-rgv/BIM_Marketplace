import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { QuoteDto } from '@machinebazaar/shared';
import { api } from '../../lib/api';
import { formatInr } from '../../lib/format';
import { EmptyState, LoadingBlock, PageHeading, StatusBadge } from '../../components/ui';

export function MyQuotes() {
  const { t } = useTranslation();
  const [quotes, setQuotes] = useState<QuoteDto[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    api.get<QuoteDto[]>('/quotes/mine')
      .then(({ data }) => { if (!cancelled) setQuotes(data); })
      .catch(() => { if (!cancelled) setQuotes([]); });
    return () => { cancelled = true; };
  }, []);

  return (
    <div>
      <PageHeading eyebrow={t('seller.myQuotes.eyebrow')} title={t('seller.myQuotes.title')} description={t('seller.myQuotes.description')} />

      {quotes === null ? (
        <LoadingBlock />
      ) : quotes.length === 0 ? (
        <EmptyState
          title={t('seller.myQuotes.emptyState.title')}
          description={t('seller.myQuotes.emptyState.description')}
          action={<Link to="/wanted" className="text-sm font-semibold text-forest">{t('seller.myQuotes.browseWanted')}</Link>}
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-navy/10 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-navy/10 bg-navy/[0.02] text-left text-xs font-semibold uppercase tracking-wide text-navy/40">
                <tr>
                  <th className="px-5 py-3">{t('seller.myQuotes.table.requirement')}</th>
                  <th className="px-5 py-3">{t('seller.myQuotes.table.yourQuote')}</th>
                  <th className="px-5 py-3">{t('seller.myQuotes.table.status')}</th>
                  <th className="px-5 py-3">{t('seller.myQuotes.table.sent')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy/10">
                {quotes.map((q) => (
                  <tr key={q.id}>
                    <td className="px-5 py-4">
                      <Link to={`/wanted/${q.requirementId}`} className="font-semibold text-navy hover:text-forest">{q.requirement?.title}</Link>
                      <p className="text-navy/45">{q.requirement?.machineCategory}</p>
                    </td>
                    <td className="px-5 py-4 font-mono font-medium text-navy">{q.price ? formatInr(q.price) : '—'}</td>
                    <td className="px-5 py-4"><StatusBadge status={q.status} /></td>
                    <td className="px-5 py-4 text-navy/45">{new Date(q.createdAt).toLocaleDateString('en-IN')}</td>
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
