import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../lib/auth-context';
import { api } from '../../lib/api';
import { Card, LoadingBlock, PageHeading } from '../../components/ui';
import {
  AlertCircleIcon,
  BankIcon,
  CheckCircleIcon,
  ClockIcon,
  DocumentIcon,
  RupeeIcon,
  TrendDownIcon,
} from '../../components/icons';

interface AdminDashboardSummary {
  listingsPendingReview: number;
  listingsActive: number;
  listingsSold: number;
  listingsInactive: number;
  loansAwaitingAction: number;
  certificationsInProgress: number;
  commissionsPending: number;
  enquiriesNew: number;
}

function useTiles(): Array<{
  key: keyof AdminDashboardSummary;
  label: string;
  icon: typeof ClockIcon;
  to: string;
  tone: string;
}> {
  const { t } = useTranslation();
  return [
    { key: 'listingsPendingReview', label: t('admin.dashboard.tiles.listingsPendingReview'), icon: ClockIcon, to: '/admin/listings', tone: 'text-amber-600 bg-amber-50' },
    { key: 'listingsActive', label: t('admin.dashboard.tiles.listingsActive'), icon: CheckCircleIcon, to: '/admin/listings?status=ACTIVE', tone: 'text-emerald-600 bg-emerald-50' },
    { key: 'listingsSold', label: t('admin.dashboard.tiles.listingsSold'), icon: RupeeIcon, to: '/admin/listings?status=SOLD', tone: 'text-forest bg-forest-bg' },
    { key: 'listingsInactive', label: t('admin.dashboard.tiles.listingsInactive'), icon: TrendDownIcon, to: '/admin/listings?status=WITHDRAWN', tone: 'text-navy/60 bg-navy/[0.06]' },
    { key: 'loansAwaitingAction', label: t('admin.dashboard.tiles.loansAwaitingAction'), icon: BankIcon, to: '/admin/loan-applications', tone: 'text-accent bg-accent/10' },
    { key: 'certificationsInProgress', label: t('admin.dashboard.tiles.certificationsInProgress'), icon: DocumentIcon, to: '/admin/certifications', tone: 'text-navy bg-navy/[0.06]' },
    { key: 'commissionsPending', label: t('admin.dashboard.tiles.commissionsPending'), icon: RupeeIcon, to: '/admin/transactions', tone: 'text-amber-600 bg-amber-50' },
    { key: 'enquiriesNew', label: t('admin.dashboard.tiles.enquiriesNew'), icon: AlertCircleIcon, to: '/admin/enquiries', tone: 'text-rose-600 bg-rose-50' },
  ];
}

export function AdminDashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [summary, setSummary] = useState<AdminDashboardSummary | null>(null);
  const tiles = useTiles();

  useEffect(() => {
    let cancelled = false;
    api
      .get<AdminDashboardSummary>('/admin/dashboard')
      .then(({ data }) => {
        if (!cancelled) setSummary(data);
      })
      .catch(() => {
        if (!cancelled) setSummary(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div>
      <PageHeading
        eyebrow={t('admin.dashboard.eyebrow')}
        title={t('admin.dashboard.title', { name: user?.fullName?.split(' ')[0] ?? t('admin.dashboard.defaultName') })}
        description={t('admin.dashboard.description')}
      />

      {summary === null ? (
        <LoadingBlock />
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {tiles.map(({ key, label, icon: Icon, to, tone }) => (
            <Link key={key} to={to}>
              <Card className="h-full transition hover:border-accent/30 hover:shadow-md">
                <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${tone}`}>
                  <Icon className="h-5 w-5" />
                </span>
                <p className="mt-4 font-display text-3xl text-navy">{summary[key]}</p>
                <p className="mt-1 text-sm font-medium text-navy/55">{label}</p>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
