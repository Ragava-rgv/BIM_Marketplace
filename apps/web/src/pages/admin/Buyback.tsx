import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { BuybackOfferDto, BuybackScheduleEntryDto, LoanApplicationDto } from '@machinebazaar/shared';
import { BuybackStatus, CertificationStatus } from '@machinebazaar/shared';
import { api, apiErrorMessage } from '../../lib/api';
import { formatDateTime, formatInr } from '../../lib/format';
import { Button, Card, EmptyState, ErrorBanner, Field, Input, LoadingBlock, MonoLabel, PageHeading, StatusBadge, Textarea } from '../../components/ui';

function EligibleApplications({ loans, onInitiated }: { loans: LoanApplicationDto[]; onInitiated: () => void }) {
  const [actingId, setActingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const eligible = loans.filter(
    (loan) => loan.certification?.status === CertificationStatus.COMPLETED && !loan.buybackOffer,
  );

  if (eligible.length === 0) return null;

  const initiate = async (loanId: string) => {
    setActingId(loanId);
    setError(null);
    try {
      await api.post(`/buyback/from-loan/${loanId}`);
      onInitiated();
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not create a buyback agreement for this application.'));
    } finally {
      setActingId(null);
    }
  };

  return (
    <div className="mb-8">
      <MonoLabel>Eligible for a buyback agreement</MonoLabel>
      <div className="mt-3 space-y-3">
        {error && <ErrorBanner message={error} />}
        {eligible.map((loan) => {
          const certifiedValue = loan.certification?.inspectionReport?.recommendedMarketValue;
          return (
            <Card key={loan.id} className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-display text-lg text-navy">
                  <Link to={`/listings/${loan.listingId}`} className="hover:text-accent">
                    {loan.listing?.title ?? `Listing ${loan.listingId.slice(0, 8)}...`}
                  </Link>
                </p>
                <p className="mt-1 text-sm text-navy/55">
                  {loan.buyer?.fullName} · Loan approved {formatDateTime(loan.createdAt)}
                  {certifiedValue != null ? ` · Certified value ${formatInr(certifiedValue)}` : ''}
                </p>
              </div>
              <Button disabled={actingId === loan.id} onClick={() => initiate(loan.id)}>
                {actingId === loan.id ? 'Creating...' : 'Initiate buyback agreement'}
              </Button>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function ScheduleTable({
  schedule,
  editable,
  onChange,
}: {
  schedule: BuybackScheduleEntryDto[];
  editable: boolean;
  onChange: (schedule: BuybackScheduleEntryDto[]) => void;
}) {
  const update = (index: number, field: 'retainedValuePct' | 'buybackValue', value: string) => {
    const next = schedule.map((entry, i) => (i === index ? { ...entry, [field]: value } : entry));
    onChange(next);
  };

  return (
    <div className="overflow-hidden rounded-xl border border-navy/10">
      <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-navy/[0.02] text-left text-xs font-semibold uppercase tracking-wide text-navy/40">
          <tr>
            <th className="px-4 py-2">Year</th>
            <th className="px-4 py-2">Retained value (%)</th>
            <th className="px-4 py-2">Buyback value</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-navy/10">
          {schedule.map((entry, index) => (
            <tr key={entry.yearOffset}>
              <td className="px-4 py-2 font-medium text-navy">{entry.yearOffset === 0 ? 'Now' : `+${entry.yearOffset} yr`}</td>
              <td className="px-4 py-2">
                {editable ? (
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    step="0.1"
                    value={entry.retainedValuePct}
                    onChange={(e) => update(index, 'retainedValuePct', e.target.value)}
                  />
                ) : (
                  `${Number(entry.retainedValuePct).toFixed(1)}%`
                )}
              </td>
              <td className="px-4 py-2">
                {editable ? (
                  <Input
                    type="number"
                    min={0}
                    step="1"
                    value={entry.buybackValue}
                    onChange={(e) => update(index, 'buybackValue', e.target.value)}
                  />
                ) : (
                  formatInr(entry.buybackValue)
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </div>
  );
}

function AgreementCard({ offer, onChanged }: { offer: BuybackOfferDto; onChanged: () => void }) {
  const [schedule, setSchedule] = useState<BuybackScheduleEntryDto[]>(offer.depreciationSchedule ?? []);
  const [buybackWindowYears, setBuybackWindowYears] = useState(String(offer.agreementTerms?.buybackWindowYears ?? ''));
  const [noticePeriodDays, setNoticePeriodDays] = useState(String(offer.agreementTerms?.noticePeriodDays ?? ''));
  const [conditions, setConditions] = useState(offer.agreementTerms?.conditions ?? '');
  const [saving, setSaving] = useState(false);
  const [acting, setActing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const editable = offer.status === BuybackStatus.QUOTED;

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      await api.patch(`/buyback/${offer.id}/agreement`, {
        buybackWindowYears: Number(buybackWindowYears),
        noticePeriodDays: Number(noticePeriodDays),
        conditions,
        depreciationSchedule: schedule.map((entry) => ({
          yearOffset: entry.yearOffset,
          retainedValuePct: Number(entry.retainedValuePct),
          buybackValue: Number(entry.buybackValue),
        })),
      });
      onChanged();
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not save the agreement.'));
    } finally {
      setSaving(false);
    }
  };

  const act = async (action: 'accept' | 'complete') => {
    setActing(true);
    setError(null);
    try {
      await api.post(`/buyback/${offer.id}/${action}`);
      onChanged();
    } catch (err) {
      setError(apiErrorMessage(err, `Could not ${action} this offer.`));
    } finally {
      setActing(false);
    }
  };

  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-display text-lg text-navy">
            {offer.listing ? (
              <Link to={`/listings/${offer.listing.id}`} className="hover:text-accent">
                {offer.listing.title}
              </Link>
            ) : (
              offer.machineReference ?? 'Machine'
            )}
          </p>
          <p className="mt-1 text-sm text-navy/55">
            {offer.listing && `${offer.listing.machineMake} ${offer.listing.machineModel} · ${offer.listing.manufactureYear} · `}
            Machine age {offer.machineAgeYears} yr · Created {formatDateTime(offer.createdAt)}
          </p>
          <p className="mt-1 text-sm text-navy/55">
            Original price {formatInr(offer.originalPrice)}
            {offer.certifiedValue ? ` · Certified value ${formatInr(offer.certifiedValue)}` : ''} · Current buyback offer{' '}
            {formatInr(offer.offerAmount)}
          </p>
        </div>
        <StatusBadge status={offer.status} />
      </div>

      {error && (
        <div className="mt-3">
          <ErrorBanner message={error} />
        </div>
      )}

      <div className="mt-4 border-t border-navy/10 pt-4">
        <MonoLabel>Buyback value table</MonoLabel>
        <div className="mt-2">
          <ScheduleTable schedule={schedule} editable={editable} onChange={setSchedule} />
        </div>
      </div>

      <div className="mt-4 border-t border-navy/10 pt-4">
        <MonoLabel>Agreement terms</MonoLabel>
        <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Buyback window (years)">
            <Input
              type="number"
              min={1}
              step="1"
              value={buybackWindowYears}
              onChange={(e) => setBuybackWindowYears(e.target.value)}
              disabled={!editable}
            />
          </Field>
          <Field label="Notice period (days)">
            <Input
              type="number"
              min={0}
              step="1"
              value={noticePeriodDays}
              onChange={(e) => setNoticePeriodDays(e.target.value)}
              disabled={!editable}
            />
          </Field>
        </div>
        <div className="mt-3">
          <Field label="Conditions">
            <Textarea rows={5} value={conditions} onChange={(e) => setConditions(e.target.value)} disabled={!editable} />
          </Field>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-navy/10 pt-4">
        {editable && (
          <Button disabled={saving} onClick={save}>
            {saving ? 'Saving...' : 'Save agreement'}
          </Button>
        )}
        {offer.status === BuybackStatus.QUOTED && (
          <Button variant="secondary" disabled={acting} onClick={() => act('accept')}>
            Mark accepted
          </Button>
        )}
        {offer.status === BuybackStatus.ACCEPTED && (
          <Button variant="secondary" disabled={acting} onClick={() => act('complete')}>
            Mark completed
          </Button>
        )}
      </div>
    </Card>
  );
}

export function AdminBuyback() {
  const [loans, setLoans] = useState<LoanApplicationDto[] | null>(null);
  const [offers, setOffers] = useState<BuybackOfferDto[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let cancelled = false;
    api
      .get<LoanApplicationDto[]>('/loans')
      .then(({ data }) => {
        if (!cancelled) setLoans(data);
      })
      .catch(() => {
        if (!cancelled) setLoans([]);
      });
    api
      .get<BuybackOfferDto[]>('/buyback')
      .then(({ data }) => {
        if (!cancelled) setOffers(data);
      })
      .catch((err) => {
        if (!cancelled) {
          setOffers([]);
          setError(apiErrorMessage(err, 'Could not load buyback agreements.'));
        }
      });
    return () => {
      cancelled = true;
    };
  }, [reload]);

  return (
    <div>
      <PageHeading
        eyebrow="Admin console"
        title="Buyback agreements"
        description="Once a financed loan's certification is completed, initiate a buyback agreement anchored on the certified value. Edit the value table and terms before the seller accepts."
      />

      {error && (
        <div className="mb-5">
          <ErrorBanner message={error} />
        </div>
      )}

      {loans === null || offers === null ? (
        <LoadingBlock />
      ) : (
        <>
          <EligibleApplications loans={loans} onInitiated={() => setReload((n) => n + 1)} />

          <MonoLabel>Agreements</MonoLabel>
          <div className="mt-3">
            {offers.length === 0 ? (
              <EmptyState
                title="No buyback agreements yet"
                description="Agreements appear here once initiated from a certified, financed loan application above."
              />
            ) : (
              <div className="space-y-4">
                {offers.map((offer) => (
                  <AgreementCard key={offer.id} offer={offer} onChanged={() => setReload((n) => n + 1)} />
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
