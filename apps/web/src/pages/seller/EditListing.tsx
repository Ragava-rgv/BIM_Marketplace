import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { ListingDto, ListingMediaDto } from '@machinebazaar/shared';
import { api, apiErrorMessage } from '../../lib/api';
import {
  ListingDetailsForm,
  listingDetailsToPayload,
  type ListingDetailsValues,
} from '../../components/ListingDetailsForm';
import { ListingMediaManager } from '../../components/ListingMediaManager';
import { Button, Card, ErrorBanner, LoadingBlock, Modal, PageHeading, StatusBadge, SuccessBanner } from '../../components/ui';
import { ArrowLeftIcon } from '../../components/icons';

const EDITABLE = new Set(['DRAFT', 'REJECTED', 'ACTIVE']);

function toDetailsValues(listing: ListingDto): ListingDetailsValues {
  return {
    title: listing.title,
    description: listing.description,
    machineCategory: listing.machineCategory,
    machineSubcategory: listing.machineSubcategory ?? '',
    machineMake: listing.machineMake,
    machineModel: listing.machineModel,
    manufactureYear: listing.manufactureYear != null ? String(listing.manufactureYear) : '',
    origin: listing.origin,
    importedCountry: listing.importedCountry ?? '',
    askingPrice: listing.askingPrice,
    locationCity: listing.locationCity,
    locationState: listing.locationState,
    complexityTier: listing.complexityTier,
    condition: listing.condition,
    catalogCategoryId: listing.catalogCategoryId ?? '',
    specs: (listing.specs as Record<string, string>) ?? {},
    conditionGrade: listing.conditionGrade ?? '',
    runningHours: listing.runningHours != null ? String(listing.runningHours) : '',
    negotiable: listing.negotiable ?? false,
  };
}

export function EditListing() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [listing, setListing] = useState<ListingDto | null>(null);
  const [media, setMedia] = useState<ListingMediaDto[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [savingDetails, setSavingDetails] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [withdrawConfirmOpen, setWithdrawConfirmOpen] = useState(false);

  const load = () => {
    if (!id) return;
    api
      .get<ListingDto>(`/listings/mine/${id}`)
      .then(({ data }) => {
        setListing(data);
        setMedia(data.media ?? []);
      })
      .catch((err) => setLoadError(apiErrorMessage(err, t('seller.editListing.errors.notFound'))));
  };

  useEffect(load, [id]);

  if (loadError) {
    return (
      <div className="text-center">
        <ErrorBanner message={loadError} />
        <Link to="/seller/listings" className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-accent">
          <ArrowLeftIcon className="h-4 w-4" />
          {t('seller.editListing.backToListings')}
        </Link>
      </div>
    );
  }

  if (!listing) return <LoadingBlock />;

  const editable = EDITABLE.has(listing.status);
  // Media upload is allowed on live listings so sellers can refresh photos without re-review
  const mediaEditable = editable || listing.status === 'ACTIVE';
  // Submitting for review only applies to draft/rejected listings — an ACTIVE listing is
  // already live and editable in place, it doesn't need (re-)submitting.
  const canSubmitForReview = listing.status === 'DRAFT' || listing.status === 'REJECTED';
  const photos = media.filter((m) => m.type === 'PHOTO');
  const video = media.find((m) => m.type === 'VIDEO');
  const mediaReady = photos.length >= 5 && photos.length <= 10 && !!video && (video.durationSeconds ?? 0) >= 60;

  const handleUpdate = async (values: ListingDetailsValues) => {
    setActionError(null);
    setNotice(null);
    setSavingDetails(true);
    try {
      const { data } = await api.patch<ListingDto>(`/listings/${listing.id}`, listingDetailsToPayload(values));
      setListing(data);
      setNotice(t('seller.editListing.notices.detailsUpdated'));
    } catch (err) {
      setActionError(apiErrorMessage(err, t('seller.editListing.errors.updateFailed')));
    } finally {
      setSavingDetails(false);
    }
  };

  const handleSubmit = async () => {
    setActionError(null);
    setNotice(null);
    setSubmitting(true);
    try {
      const { data } = await api.post<ListingDto>(`/listings/${listing.id}/submit`);
      setListing(data);
      setNotice(t('seller.editListing.notices.submitted'));
    } catch (err) {
      setActionError(apiErrorMessage(err, t('seller.editListing.errors.submitFailed')));
    } finally {
      setSubmitting(false);
    }
  };

  const handleWithdraw = async () => {
    setWithdrawConfirmOpen(false);
    setActionError(null);
    setNotice(null);
    setWithdrawing(true);
    try {
      const { data } = await api.post<ListingDto>(`/listings/${listing.id}/withdraw`);
      setListing(data);
      setNotice(t('seller.editListing.notices.withdrawn'));
    } catch (err) {
      setActionError(apiErrorMessage(err, t('seller.editListing.errors.withdrawFailed')));
    } finally {
      setWithdrawing(false);
    }
  };

  return (
    <div>
      <Link to="/seller/listings" className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-navy/55 hover:text-navy">
        <ArrowLeftIcon className="h-4 w-4" />
        {t('seller.editListing.backToListings')}
      </Link>

      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <PageHeading title={listing.title} description={t('seller.editListing.description')} />
        <StatusBadge status={listing.status} />
      </div>

      {actionError && <div className="mb-5"><ErrorBanner message={actionError} /></div>}
      {notice && <div className="mb-5"><SuccessBanner message={notice} /></div>}

      {!editable && (
        <Card className="mb-6 border-navy/10 bg-navy/[0.02]">
          <p className="text-sm text-navy/60">
            {t('seller.editListing.notEditable.currentlyPrefix')}{' '}
            <span className="font-semibold text-navy">{t(`common:status.listing.${listing.status}`).toLowerCase()}</span>.{' '}
            {t('seller.editListing.notEditable.editWindowPrefix')}{' '}
            <span className="font-semibold">{t('common:status.listing.DRAFT').toLowerCase()}</span>{' '}
            {t('seller.editListing.notEditable.or')}{' '}
            <span className="font-semibold">{t('common:status.listing.REJECTED').toLowerCase()}</span>{' '}
            {t('seller.editListing.notEditable.statusSuffix')}
            {listing.status !== 'SOLD' && ` ${t('seller.editListing.notEditable.withdrawHint')}`}
          </p>
        </Card>
      )}

      <div className="space-y-10">
        <section>
          <h2 className="mb-4 font-display text-xl text-navy">{t('seller.editListing.sections.detailsHeading')}</h2>
          {editable ? (
            <Card className="max-w-2xl">
              <ListingDetailsForm initial={toDetailsValues(listing)} submitLabel={t('seller.editListing.saveChanges')} submitting={savingDetails} onSubmit={handleUpdate} />
            </Card>
          ) : (
            <Card className="max-w-2xl space-y-2 text-sm text-navy/65">
              <p>{listing.description}</p>
              <p className="text-navy/45">
                {listing.machineMake} · {listing.machineModel} · {listing.locationCity}, {listing.locationState}
              </p>
            </Card>
          )}
        </section>

        <section>
          <h2 className="mb-4 font-display text-xl text-navy">{t('seller.editListing.sections.mediaHeading')}</h2>
          {mediaEditable ? (
            <ListingMediaManager listingId={listing.id} media={media} onChange={setMedia} />
          ) : media.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {media.map((item) => (
                <div key={item.id} className="overflow-hidden rounded-xl border border-navy/10">
                  {item.type === 'PHOTO' ? (
                    <img src={item.url} alt="" className="aspect-square w-full object-cover" />
                  ) : (
                    <video src={item.url} className="aspect-square w-full object-cover" muted />
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-navy/45">{t('seller.editListing.noMedia')}</p>
          )}
        </section>

        <section className="flex flex-wrap gap-3 border-t border-navy/10 pt-8">
          {canSubmitForReview && (
            <Button onClick={handleSubmit} disabled={submitting || !mediaReady}>
              {submitting ? t('seller.editListing.submitting') : t('seller.editListing.submitForReview')}
            </Button>
          )}
          {listing.status !== 'SOLD' && listing.status !== 'WITHDRAWN' && (
            <Button variant="ghost" onClick={() => setWithdrawConfirmOpen(true)} disabled={withdrawing}>
              {withdrawing ? t('seller.editListing.withdrawing') : t('seller.editListing.withdrawListing')}
            </Button>
          )}
          <Button variant="ghost" onClick={() => navigate(`/listings/${listing.id}`)}>
            {t('seller.editListing.viewPublicPage')}
          </Button>
        </section>
      </div>

      <Modal
        open={withdrawConfirmOpen}
        onClose={() => setWithdrawConfirmOpen(false)}
        title={t('seller.editListing.withdrawConfirm.title')}
        footer={
          <>
            <Button variant="danger" onClick={handleWithdraw} disabled={withdrawing}>
              {withdrawing ? t('seller.editListing.withdrawing') : t('seller.editListing.withdrawConfirm.confirm')}
            </Button>
            <Button variant="ghost" onClick={() => setWithdrawConfirmOpen(false)} disabled={withdrawing}>
              {t('seller.editListing.withdrawConfirm.cancel')}
            </Button>
          </>
        }
      >
        <p className="text-sm text-navy/65">{t('seller.editListing.withdrawConfirm.body')}</p>
      </Modal>
    </div>
  );
}
