import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
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

const TILES: Array<{
  key: keyof AdminDashboardSummary;
  label: string;
  icon: typeof ClockIcon;
  to: string;
  tone: string;
}> = [
  { key: 'listingsPendingReview', label: 'Listings pending review', icon: ClockIcon, to: '/admin/listings', tone: 'text-amber-600 bg-amber-50' },
  { key: 'listingsActive', label: 'Active listings', icon: CheckCircleIcon, to: '/admin/listings?status=ACTIVE', tone: 'text-emerald-600 bg-emerald-50' },
  { key: 'listingsSold', label: 'Sold listings', icon: RupeeIcon, to: '/admin/listings?status=SOLD', tone: 'text-forest bg-forest-bg' },
  { key: 'listingsInactive', label: 'Inactive listings', icon: TrendDownIcon, to: '/admin/listings?status=WITHDRAWN', tone: 'text-navy/60 bg-navy/[0.06]' },
  { key: 'loansAwaitingAction', label: 'Loans awaiting action', icon: BankIcon, to: '/admin/loan-applications', tone: 'text-accent bg-accent/10' },
  { key: 'certificationsInProgress', label: 'Certifications in progress', icon: DocumentIcon, to: '/admin/certifications', tone: 'text-navy bg-navy/[0.06]' },
  { key: 'commissionsPending', label: 'Commissions pending', icon: RupeeIcon, to: '/admin/transactions', tone: 'text-amber-600 bg-amber-50' },
  { key: 'enquiriesNew', label: 'New enquiries', icon: AlertCircleIcon, to: '/admin/enquiries', tone: 'text-rose-600 bg-rose-50' },
];

export function AdminDashboard() {
  const { user } = useAuth();
  const [summary, setSummary] = useState<AdminDashboardSummary | null>(null);

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
        eyebrow="Admin console"
        title={`Welcome, ${user?.fullName?.split(' ')[0] ?? 'Admin'}`}
        description="Monitor the listing review queue, enquiries, commissions, certifications and finance pipeline at a glance."
      />

      {summary === null ? (
        <LoadingBlock />
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {TILES.map(({ key, label, icon: Icon, to, tone }) => (
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
