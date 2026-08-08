import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { EnquiryDto } from '@machinebazaar/shared';
import { api } from '../lib/api';
import { AppLayout } from '../components/AppLayout';
import { formatDate } from '../lib/format';
import { ChevronRightIcon } from '../components/icons';

export function Enquiries() {
  const { t } = useTranslation();
  const [enquiries, setEnquiries] = useState<EnquiryDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<EnquiryDto[]>('/enquiries/mine')
      .then(({ data }) => setEnquiries(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <AppLayout>
      <div className="bg-white border-b border-gray-200 px-4 pt-4 pb-3">
        <h1 className="text-[19px] font-extrabold text-ink tracking-[-0.4px]">{t('enquiries.title')}</h1>
        <p className="text-[12px] text-gray-500 mt-0.5">{t('enquiries.subtitle')}</p>
      </div>

      <div className="px-4 pt-4 flex flex-col gap-3">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-[13px] h-[72px] animate-pulse" />
          ))
        ) : enquiries.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-[14px] font-semibold text-ink mb-1">{t('enquiries.empty.title')}</p>
            <p className="text-[12px] text-gray-500">{t('enquiries.empty.body')}</p>
            <Link to="/" className="mt-4 inline-block text-[13px] font-bold text-forest">{t('enquiries.empty.cta')}</Link>
          </div>
        ) : (
          enquiries.map((e) => (
            <Link key={e.id} to={`/listings/${e.listingId}`}
              className="bg-white border border-gray-200 rounded-[13px] p-[13px] flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-[13.5px] font-bold text-ink truncate">{e.listing?.title ?? t('enquiries.fallbackTitle')}</p>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  {formatDate(e.createdAt)} · {t(`enquiries.status.${e.status}`, e.status)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-[9.5px] font-bold px-2 py-0.5 rounded-full ${
                  e.status === 'NEW' ? 'bg-green-bg text-green-txt' : 'bg-gray-100 text-gray-600'
                }`}>
                  {t(`enquiries.status.${e.status}`, e.status)}
                </span>
                <ChevronRightIcon className="w-4 h-4 text-gray-400" />
              </div>
            </Link>
          ))
        )}
      </div>
    </AppLayout>
  );
}
