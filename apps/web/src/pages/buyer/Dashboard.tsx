import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { GstStatus } from '@machinebazaar/shared';
import type { LoanApplicationDto, ReleasedContactSummaryDto } from '@machinebazaar/shared';
import { api } from '../../lib/api';
import { useAuth } from '../../lib/auth-context';
import { getSavedListingIds } from '../../lib/saved-listings';
import { formatInr, humanizeStatus } from '../../lib/format';
import { Button, Card, EmptyState, LoadingBlock, PageHeading, StatusBadge } from '../../components/ui';
import { CheckCircleIcon, ChevronRightIcon, MachineIcon, PlusIcon, RupeeIcon, ShieldCheckIcon } from '../../components/icons';

export function BuyerDashboard() {
  const { user } = useAuth();
  const [loans, setLoans] = useState<LoanApplicationDto[] | null>(null);
  const [contacts, setContacts] = useState<ReleasedContactSummaryDto[]>([]);
  const savedCount = user ? getSavedListingIds(user.id).length : 0;

  useEffect(() => {
    let cancelled = false;
    api
      .get<LoanApplicationDto[]>('/loans/mine')
      .then(({ data }) => {
        if (!cancelled) setLoans(data);
      })
      .catch(() => {
        if (!cancelled) setLoans([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    api
      .get<ReleasedContactSummaryDto[]>('/transactions/contacts')
      .then(({ data }) => {
        if (!cancelled) setContacts(data);
      })
      .catch(() => {
        if (!cancelled) setContacts([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const isGstActive = user?.gstStatus === GstStatus.ACTIVE;

  return (
    <div>
      <PageHeading
        eyebrow="Buyer workspace"
        title={`Welcome back, ${user?.fullName?.split(' ')[0] ?? ''}`}
        description="Browse machines, message sellers, and track your finance applications from one place."
      />

      {!isGstActive && (
        <Card className="mb-8 flex flex-col gap-4 border-amber-200 bg-amber-50 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <ShieldCheckIcon className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
            <div>
              <p className="font-semibold text-amber-800">GST verification needed for financing</p>
              <p className="mt-1 text-sm text-amber-700">
                Browsing and messaging sellers is open to everyone — verify your GST only when
                you&apos;re ready to submit a loan application.
              </p>
            </div>
          </div>
          <Link to="/buyer/gst-verification">
            <Button variant="secondary" className="whitespace-nowrap">
              Verify GST now
              <ChevronRightIcon className="h-4 w-4" />
            </Button>
          </Link>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <Card>
          <p className="text-xs font-semibold uppercase tracking-wide text-navy/40">Saved listings</p>
          <p className="mt-2 font-display text-3xl text-navy">{savedCount}</p>
        </Card>
        <Card>
          <p className="text-xs font-semibold uppercase tracking-wide text-navy/40">Loan applications</p>
          <p className="mt-2 font-display text-3xl text-navy">{loans ? loans.length : '—'}</p>
        </Card>
        <Card>
          <p className="text-xs font-semibold uppercase tracking-wide text-navy/40">GST status</p>
          <p className="mt-2 font-display text-3xl text-navy">{humanizeStatus(user?.gstStatus ?? GstStatus.UNVERIFIED)}</p>
        </Card>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div>
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl text-navy">Recent loan applications</h2>
            <Link to="/buyer/loans">
              <Button variant="ghost">View all</Button>
            </Link>
          </div>

          {loans === null ? (
            <LoadingBlock />
          ) : loans.length === 0 ? (
            <Card className="mt-4 flex flex-col items-center gap-3 py-10 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-navy/[0.06] text-navy">
                <RupeeIcon className="h-6 w-6" />
              </span>
              <p className="font-display text-lg text-navy">No loan applications yet</p>
              <p className="max-w-sm text-sm text-navy/55">
                Found a machine you like? Apply for financing through one of our partner banks
                and NBFCs.
              </p>
              <Link to="/buyer/loans/new">
                <Button>Apply for a loan</Button>
              </Link>
            </Card>
          ) : (
            <div className="mt-4 divide-y divide-navy/10 overflow-hidden rounded-2xl border border-navy/10 bg-white">
              {loans.slice(0, 5).map((loan) => (
                <div key={loan.id} className="flex items-center justify-between gap-4 px-5 py-4">
                  <div>
                    <p className="font-semibold text-navy">{formatInr(loan.amountRequested)}</p>
                    <p className="text-sm text-navy/45">Applied {new Date(loan.createdAt).toLocaleDateString('en-IN')}</p>
                  </div>
                  <StatusBadge status={loan.status} />
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl text-navy">Saved listings</h2>
            <Link to="/buyer/saved">
              <Button variant="ghost">View all</Button>
            </Link>
          </div>

          {savedCount === 0 ? (
            <div className="mt-4">
              <EmptyState
                title="Nothing saved yet"
                description="Browse listings and bookmark machines you're interested in for quick access later."
                action={
                  <Link to="/listings">
                    <Button variant="secondary">
                      <MachineIcon className="h-4 w-4" />
                      Browse listings
                    </Button>
                  </Link>
                }
              />
            </div>
          ) : (
            <Card className="mt-4">
              <div className="flex items-center gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-navy/[0.06] text-navy">
                  <CheckCircleIcon className="h-6 w-6" />
                </span>
                <div>
                  <p className="font-display text-lg text-navy">{savedCount} listing{savedCount === 1 ? '' : 's'} saved</p>
                  <p className="text-sm text-navy/55">Pick up where you left off.</p>
                </div>
              </div>
              <Link to="/buyer/saved" className="mt-4 inline-block">
                <Button variant="secondary">View saved listings</Button>
              </Link>
            </Card>
          )}
        </div>
      </div>

      {/* â"€â"€ Start selling CTA â"€â"€ */}
      <div className="mt-8">
        <Card className={`flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between ${
          isGstActive ? 'border-forest/20 bg-[#f0faf4]' : 'border-line bg-white'
        }`}>
          <div className="flex items-start gap-3">
            <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[9px] ${
              isGstActive ? 'bg-forest text-white' : 'bg-navy/[0.06] text-navy'
            }`}>
              <PlusIcon className="h-5 w-5" />
            </span>
            <div>
              <p className={`font-semibold ${isGstActive ? 'text-forest' : 'text-navy'}`}>
                {isGstActive ? 'Ready to sell? Switch your account' : 'Want to sell machinery?'}
              </p>
              <p className="mt-0.5 text-sm text-muted">
                {isGstActive
                  ? 'Your GST is verified. You can switch to a seller account and start listing machines immediately.'
                  : 'Verify your GST first — once active, you can switch your account to a seller in one click.'}
              </p>
            </div>
          </div>
          <Link to="/buyer/switch-to-seller" className="shrink-0">
            <Button variant={isGstActive ? 'primary' : 'secondary'} className="whitespace-nowrap">
              {isGstActive ? 'Switch to seller' : 'Learn more'}
              <ChevronRightIcon className="h-4 w-4" />
            </Button>
          </Link>
        </Card>
      </div>

      {contacts.length > 0 && (
        <div className="mt-8">
          <h2 className="font-display text-xl text-navy">Deal contacts</h2>
          <p className="mt-1 text-sm text-navy/55">
            The commission has been settled on these deals, so the seller&apos;s contact details have been released.
          </p>
          <div className="mt-4 divide-y divide-navy/10 overflow-hidden rounded-2xl border border-navy/10 bg-white">
            {contacts.map((c) => (
              <div key={c.transactionId} className="flex items-center justify-between gap-4 px-5 py-4">
                <div>
                  <p className="font-semibold text-navy">{c.listingTitle}</p>
                  <p className="text-sm text-navy/45">
                    {c.contact.fullName} · {c.contact.phone}
                    {c.contact.email ? ` · ${c.contact.email}` : ''}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
