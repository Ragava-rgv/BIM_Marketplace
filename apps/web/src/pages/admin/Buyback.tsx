import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { BuybackOfferDto, BuybackScheduleEntryDto, LoanApplicationDto } from '@machinebazaar/shared';
import { BuybackStatus, CertificationStatus } from '@machinebazaar/shared';
import { api, apiErrorMessage } from '../../lib/api';
import { formatDateTime, formatInr } from '../../lib/format';
import { Button, Card, EmptyState, ErrorBanner, Field, Input, LoadingBlock, MonoLabel, PageHeading, StatusBadge, Textarea } from '../../components/ui';

function EligibleApplications({ loans, onInitiated }: { loans: LoanApplicationDto[]; onInitiated: () => void }) {
  const { t } = useTranslation();
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
      setError(apiErrorMessage(err, t('admin.buyback.initiateError')));
    } finally {
      setActingId(null);
    }
  };

  return (
    <div className="mb-8">
      <MonoLabel>{t('admin.buyback.eligibleHeading')}</MonoLabel>
      <div className="mt-3 space-y-3">
        {error && <ErrorBanner message={error} />}
        {eligible.map((loan) => {
          const certifiedValue = loan.certification?.inspectionReport?.recommendedMarketValue;
          return (
            <Card key={loan.id} className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-display text-lg text-navy">
                  <Link to={`/listings/${loan.listingId}`} className="hover:text-accent">
                    {loan.listing?.title ?? t('admin.buyback.listingFallback', { id: loan.listingId.slice(0, 8) })}
                  </Link>
                </p>
                <p className="mt-1 text-sm text-navy/55">
                  {t('admin.buyback.loanApprovedLine', { buyer: loan.buyer?.fullName, time: formatDateTime(loan.createdAt) })}
                  {certifiedValue != null ? t('admin.buyback.certifiedValueSuffix', { value: formatInr(certifiedValue) }) : ''}
                </p>
              </div>
              <Button disabled={actingId === loan.id} onClick={() => initiate(loan.id)}>
                {actingId === loan.id ? t('admin.buyback.creating') : t('admin.buyback.initiateAgreement')}
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
  const { t } = useTranslation();
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
            <th className="px-4 py-2">{t('admin.buyback.columns.year')}</th>
            <th className="px-4 py-2">{t('admin.buyback.columns.retainedValue')}</th>
            <th className="px-4 py-2">{t('admin.buyback.columns.buybackValue')}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-navy/10">
          {schedule.map((entry, index) => (
            <tr key={entry.yearOffset}>
              <td className="px-4 py-2 font-medium text-navy">{entry.yearOffset === 0 ? t('admin.buyback.now') : t('admin.buyback.yearOffset', { year: entry.yearOffset })}</td>
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
  const { t } = useTranslation();
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
      setError(apiErrorMessage(err, t('admin.buyback.saveAgreementError')));
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
      setError(apiErrorMessage(err, action === 'accept' ? t('admin.buyback.acceptError') : t('admin.buyback.completeError')));
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
              offer.machineReference ?? t('admin.buyback.machineFallback')
            )}
          </p>
          <p className="mt-1 text-sm text-navy/55">
            {offer.listing && `${offer.listing.machineMake} ${offer.listing.machineModel} · ${offer.listing.manufactureYear} · `}
            {t('admin.buyback.machineAgeLine', { age: offer.machineAgeYears, time: formatDateTime(offer.createdAt) })}
          </p>
          <p className="mt-1 text-sm text-navy/55">
            {t('admin.buyback.originalPrice', { price: formatInr(offer.originalPrice) })}
            {offer.certifiedValue ? t('admin.buyback.certifiedValueSuffix', { value: formatInr(offer.certifiedValue) }) : ''}
            {' '}
            {t('admin.buyback.currentOffer', { amount: formatInr(offer.offerAmount) })}
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
        <MonoLabel>{t('admin.buyback.valueTable')}</MonoLabel>
        <div className="mt-2">
          <ScheduleTable schedule={schedule} editable={editable} onChange={setSchedule} />
        </div>
      </div>

      <div className="mt-4 border-t border-navy/10 pt-4">
        <MonoLabel>{t('admin.buyback.agreementTerms')}</MonoLabel>
        <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label={t('admin.buyback.fields.buybackWindow')}>
            <Input
              type="number"
              min={1}
              step="1"
              value={buybackWindowYears}
              onChange={(e) => setBuybackWindowYears(e.target.value)}
              disabled={!editable}
            />
          </Field>
          <Field label={t('admin.buyback.fields.noticePeriod')}>
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
          <Field label={t('admin.buyback.fields.conditions')}>
            <Textarea rows={5} value={conditions} onChange={(e) => setConditions(e.target.value)} disabled={!editable} />
          </Field>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-navy/10 pt-4">
        {editable && (
          <Button disabled={saving} onClick={save}>
            {saving ? t('admin.buyback.saving') : t('admin.buyback.saveAgreement')}
          </Button>
        )}
        {offer.status === BuybackStatus.QUOTED && (
          <Button variant="secondary" disabled={acting} onClick={() => act('accept')}>
            {t('admin.buyback.markAccepted')}
          </Button>
        )}
        {offer.status === BuybackStatus.ACCEPTED && (
          <Button variant="secondary" disabled={acting} onClick={() => act('complete')}>
            {t('admin.buyback.markCompleted')}
          </Button>
        )}
      </div>
    </Card>
  );
}

export function AdminBuyback() {
  const { t } = useTranslation();
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
          setError(apiErrorMessage(err, t('admin.buyback.loadError')));
        }
      });
    return () => {
      cancelled = true;
    };
  }, [reload, t]);

  return (
    <div>
      <PageHeading
        eyebrow={t('admin.buyback.eyebrow')}
        title={t('admin.buyback.title')}
        description={t('admin.buyback.description')}
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

          <MonoLabel>{t('admin.buyback.agreements')}</MonoLabel>
          <div className="mt-3">
            {offers.length === 0 ? (
              <EmptyState
                title={t('admin.buyback.emptyTitle')}
                description={t('admin.buyback.emptyDescription')}
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
