import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { BuybackOfferDto } from '../../shared';
import { BuybackStatus } from '../../shared';
import { api, apiErrorMessage } from '../../lib/api';
import { formatDateTime, formatInr } from '../../lib/format';
import { Button, Card, EmptyState, ErrorBanner, LoadingBlock, MonoLabel, PageHeading, StatusBadge } from '../../components/ui';

function OfferCard({ offer, onChanged }: { offer: BuybackOfferDto; onChanged: () => void }) {
  const { t } = useTranslation();
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const accept = async () => {
    setAccepting(true);
    setError(null);
    try {
      await api.post(`/buyback/${offer.id}/accept`);
      onChanged();
    } catch (err) {
      setError(apiErrorMessage(err, t('buyer.buyback.errorAccept')));
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
              offer.machineReference ?? t('buyer.buyback.machineFallback')
            )}
          </p>
          <p className="mt-1 text-sm text-navy/55">
            {offer.listing && `${offer.listing.machineMake} ${offer.listing.machineModel} · ${offer.listing.manufactureYear} · `}
            {t('buyer.buyback.machineAge', { years: offer.machineAgeYears })} · {t('buyer.buyback.offered', { date: formatDateTime(offer.createdAt) })}
          </p>
          <p className="mt-1 text-sm text-navy/55">
            {offer.certifiedValue ? `${t('buyer.buyback.certifiedValue', { value: formatInr(offer.certifiedValue) })} · ` : ''}
            {t('buyer.buyback.currentOffer')} <span className="font-semibold text-navy">{formatInr(offer.offerAmount)}</span>
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
          <MonoLabel>{t('buyer.buyback.valueTable.title')}</MonoLabel>
          <div className="mt-2 overflow-hidden rounded-xl border border-navy/10">
            <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-navy/[0.02] text-left text-xs font-semibold uppercase tracking-wide text-navy/40">
                <tr>
                  <th className="px-4 py-2">{t('buyer.buyback.valueTable.year')}</th>
                  <th className="px-4 py-2">{t('buyer.buyback.valueTable.retainedValue')}</th>
                  <th className="px-4 py-2">{t('buyer.buyback.valueTable.buybackValue')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy/10">
                {offer.depreciationSchedule.map((entry) => (
                  <tr key={entry.yearOffset}>
                    <td className="px-4 py-2 font-medium text-navy">
                      {entry.yearOffset === 0 ? t('buyer.buyback.valueTable.now') : t('buyer.buyback.valueTable.yearOffset', { n: entry.yearOffset })}
                    </td>
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
          <MonoLabel>{t('buyer.buyback.agreementTerms.title')}</MonoLabel>
          <p className="mt-2 text-sm text-navy/55">
            {t('buyer.buyback.agreementTerms.window', {
              years: offer.agreementTerms.buybackWindowYears,
              days: offer.agreementTerms.noticePeriodDays,
            })}
          </p>
          <p className="mt-2 whitespace-pre-line text-sm text-navy/70">{offer.agreementTerms.conditions}</p>
        </div>
      )}

      {offer.status === BuybackStatus.QUOTED && (
        <div className="mt-4 border-t border-navy/10 pt-4">
          <Button disabled={accepting} onClick={accept}>
            {accepting ? t('buyer.buyback.accepting') : t('buyer.buyback.acceptButton')}
          </Button>
        </div>
      )}
    </Card>
  );
}

export function BuyerBuyback() {
  const { t } = useTranslation();
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
          setError(apiErrorMessage(err, t('buyer.buyback.errorLoad')));
        }
      });
    return () => {
      cancelled = true;
    };
  }, [reload, t]);

  return (
    <div>
      <PageHeading
        eyebrow={t('buyer.buyback.eyebrow')}
        title={t('buyer.buyback.title')}
        description={t('buyer.buyback.description')}
      />

      {error && (
        <div className="mb-5">
          <ErrorBanner message={error} />
        </div>
      )}

      {offers === null ? (
        <LoadingBlock />
      ) : offers.length === 0 ? (
        <EmptyState title={t('buyer.buyback.emptyTitle')} description={t('buyer.buyback.emptyDescription')} />
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
