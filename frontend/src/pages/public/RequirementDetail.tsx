import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { RequirementDto } from '../../shared';
import { api, apiErrorMessage } from '../../lib/api';
import { formatInr, formatDate } from '../../lib/format';
import { useAuth } from '../../lib/auth-context';
import { useSellNavigate } from '../../lib/use-sell-navigate';
import { Button, Card, ErrorBanner, LoadingBlock, MonoLabel } from '../../components/ui';
import { QuoteForm } from '../../components/QuoteForm';
import { MapPinIcon } from '../../components/icons';

export function RequirementDetail() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const goSell = useSellNavigate();

  const [req, setReq] = useState<RequirementDto | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    api.get<RequirementDto>(`/requirements/${id}`)
      .then(({ data }) => setReq(data))
      .catch((err) => setError(apiErrorMessage(err, t('public.requirementDetail.notFoundError'))));
  }, [id, t]);

  const canQuote = !!user?.canSell;

  if (error) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-16 text-center">
        <ErrorBanner message={error} />
        <Link to="/wanted" className="mt-6 inline-block text-sm font-semibold text-forest">{t('public.requirementDetail.backToWanted')}</Link>
      </div>
    );
  }
  if (!req) return <LoadingBlock />;

  const budget =
    req.budgetMin && req.budgetMax
      ? `${formatInr(req.budgetMin)} – ${formatInr(req.budgetMax)}`
      : req.budgetMax
        ? `${t('public.wanted.upTo')} ${formatInr(req.budgetMax)}`
        : null;

  return (
    <div className="mx-auto max-w-4xl px-6 py-8 lg:px-[52px]">
      <Link to="/wanted" className="mb-4 inline-block text-sm font-semibold text-forest">{t('public.requirementDetail.backToWanted')}</Link>

      <div className="rounded-xl border border-line bg-white p-6">
        <span className="mb-2 inline-flex w-fit items-center rounded-[6px] bg-[#FEF6EC] px-2.5 py-1 text-[11px] font-bold text-copper">
          {t('public.wanted.badge')}
        </span>
        <h1 className="font-display text-2xl text-ink">{req.title}</h1>
        <p className="mt-1 text-sm text-muted">
          {req.machineCategory}{req.machineSubcategory ? ` · ${req.machineSubcategory}` : ''} · {formatDate(req.postedAt ?? req.createdAt)}
        </p>
        {(req.locationCity || req.locationState) && (
          <div className="mt-2 flex items-center gap-1.5 text-sm text-muted">
            <MapPinIcon className="h-4 w-4" />
            {[req.locationCity, req.locationState].filter(Boolean).join(', ')}
          </div>
        )}
        {budget && <p className="mt-3 font-mono text-lg font-bold text-forest">{budget}</p>}

        <p className="mt-5 whitespace-pre-line text-sm leading-relaxed text-ink">{req.description}</p>

        <div className="mt-6 grid grid-cols-2 gap-4 rounded-xl border border-line bg-paper p-4 text-sm sm:grid-cols-3">
          <div><MonoLabel>{t('public.requirementDetail.specs.origin')}</MonoLabel><p className="mt-0.5 font-semibold">{req.origin ? t(`common:listing.origin${req.origin === 'IMPORTED' ? 'Imported' : 'Indian'}`) : t('public.requirementDetail.any')}</p></div>
          <div><MonoLabel>{t('common:listing.condition')}</MonoLabel><p className="mt-0.5 font-semibold">{req.condition ? t(`common:listing.condition${req.condition === 'NEW' ? 'New' : 'Old'}`) : t('public.requirementDetail.any')}</p></div>
          <div><MonoLabel>{t('public.requirementDetail.specs.year')}</MonoLabel><p className="mt-0.5 font-semibold">{req.manufactureYear ?? t('public.requirementDetail.any')}</p></div>
          <div><MonoLabel>{t('public.requirementDetail.specs.quantity')}</MonoLabel><p className="mt-0.5 font-semibold">{req.quantity ?? 1}</p></div>
        </div>

        {req.media && req.media.length > 0 && (
          <div className="mt-6 grid grid-cols-3 gap-2 sm:grid-cols-4">
            {req.media.map((m) => (
              <div key={m.id} className="aspect-square overflow-hidden rounded-lg border border-line bg-paper">
                {m.type === 'PHOTO' ? <img src={m.url} alt="" className="h-full w-full object-cover" /> : <video src={m.url} className="h-full w-full object-cover" muted />}
              </div>
            ))}
          </div>
        )}
      </div>

      <Card className="mt-6">
        <h2 className="font-display text-xl text-ink">{t('public.requirementDetail.quoteHeading')}</h2>
        <p className="mt-1 text-sm text-muted">{t('public.requirementDetail.quoteSubheading')}</p>

        {!user ? (
          <p className="mt-4 text-sm text-muted">
            {t('public.requirementDetail.signInPrompt')}{' '}
            <Link to="/login" className="font-semibold text-forest">{t('common:nav.login')}</Link>
          </p>
        ) : !canQuote ? (
          <div className="mt-4">
            <p className="text-sm text-muted">{t('public.requirementDetail.needsSellerPrompt')}</p>
            <Button variant="copper" className="mt-3" onClick={goSell}>
              {t('public.requirementDetail.verifyToQuote')}
            </Button>
          </div>
        ) : (
          <div className="mt-4">
            <QuoteForm
              requirementId={req.id}
              initialCatalogCategoryId={req.catalogCategoryId}
              initialSpecFields={req.catalogCategory?.specFields ?? []}
              onSubmitted={() => {}}
            />
          </div>
        )}
      </Card>

      {!user && (
        <div className="mt-6 text-center">
          <Button variant="ghost" onClick={() => navigate('/signup')}>{t('public.requirementDetail.haveAMachine')}</Button>
        </div>
      )}
    </div>
  );
}
