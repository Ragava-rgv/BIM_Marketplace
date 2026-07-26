import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { BuybackOfferDto } from '@machinebazaar/shared';
import { BuybackStatus } from '@machinebazaar/shared';
import { api, apiErrorMessage } from '../../lib/api';
import { formatDateTime, formatInr } from '../../lib/format';
import { Button, Card, EmptyState, ErrorBanner, LoadingBlock, MonoLabel, PageHeading, StatusBadge } from '../../components/ui';

function OfferCard({ offer, onChanged }: { offer: BuybackOfferDto; onChanged: () => void }) {
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const accept = async () => {
    setAccepting(true);
    setError(null);
    try {
      await api.post(`/buyback/${offer.id}/accept`);
      onChanged();
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not accept this agreement.'));
    } finally {
      setAccepting(false);
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
            Machine age {offer.machineAgeYears} yr · Offered {formatDateTime(offer.createdAt)}
          </p>
          <p className="mt-1 text-sm text-navy/55">
            {offer.certifiedValue ? `Certified value ${formatInr(offer.certifiedValue)} · ` : ''}
            Current buyback offer <span className="font-semibold text-navy">{formatInr(offer.offerAmount)}</span>
          </p>
        </div>
        <StatusBadge status={offer.status} />
      </div>

      {error && (
        <div className="mt-3">
          <ErrorBanner message={error} />
        </div>
      )}

      {offer.depreciationSchedule && (
        <div className="mt-4 border-t border-navy/10 pt-4">
          <MonoLabel>Buyback value table</MonoLabel>
          <div className="mt-2 overflow-hidden rounded-xl border border-navy/10">
            <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-navy/[0.02] text-left text-xs font-semibold uppercase tracking-wide text-navy/40">
                <tr>
                  <th className="px-4 py-2">Year</th>
                  <th className="px-4 py-2">Retained value</th>
                  <th className="px-4 py-2">Buyback value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy/10">
                {offer.depreciationSchedule.map((entry) => (
                  <tr key={entry.yearOffset}>
                    <td className="px-4 py-2 font-medium text-navy">{entry.yearOffset === 0 ? 'Now' : `+${entry.yearOffset} yr`}</td>
                    <td className="px-4 py-2">{Number(entry.retainedValuePct).toFixed(1)}%</td>
                    <td className="px-4 py-2">{formatInr(entry.buybackValue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>
        </div>
      )}

      {offer.agreementTerms && (
        <div className="mt-4 border-t border-navy/10 pt-4">
          <MonoLabel>Agreement terms</MonoLabel>
          <p className="mt-2 text-sm text-navy/55">
            Buyback window: {offer.agreementTerms.buybackWindowYears} year(s) · Notice period: {offer.agreementTerms.noticePeriodDays} day(s)
          </p>
          <p className="mt-2 whitespace-pre-line text-sm text-navy/70">{offer.agreementTerms.conditions}</p>
        </div>
      )}

      {offer.status === BuybackStatus.QUOTED && (
        <div className="mt-4 border-t border-navy/10 pt-4">
          <Button disabled={accepting} onClick={accept}>
            {accepting ? 'Accepting...' : 'Accept buyback agreement'}
          </Button>
        </div>
      )}
    </Card>
  );
}

export function BuyerBuyback() {
  const [offers, setOffers] = useState<BuybackOfferDto[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let cancelled = false;
    api
      .get<BuybackOfferDto[]>('/buyback/mine')
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
        eyebrow="Buyer workspace"
        title="Buyback agreements"
        description="When a machine you financed is certified and the loan is approved, our team prepares a buyback agreement anchored on the certified value with a year-on-year buyback table for you to review and accept."
      />

      {error && (
        <div className="mb-5">
          <ErrorBanner message={error} />
        </div>
      )}

      {offers === null ? (
        <LoadingBlock />
      ) : offers.length === 0 ? (
        <EmptyState title="No buyback agreements yet" description="Agreements appear here once our team prepares one for your certified, financed purchase." />
      ) : (
        <div className="space-y-4">
          {offers.map((offer) => (
            <OfferCard key={offer.id} offer={offer} onChanged={() => setReload((n) => n + 1)} />
          ))}
        </div>
      )}
    </div>
  );
}
