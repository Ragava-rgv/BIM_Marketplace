import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { ListingDto } from '@machinebazaar/shared';
import { formatInrShort, formatRelativeDate } from '../lib/format';
import { useAuth } from '../lib/auth-context';
import { useWishlist } from '../lib/wishlist-context';
import { EyeIcon, HeartIcon, MachineIcon, PlayIcon, StarIcon } from './icons';

export function ListingCard({ listing }: { listing: ListingDto }) {
  const { t, i18n } = useTranslation();
  const locale = `${i18n.resolvedLanguage ?? 'en'}-IN`;
  const { user } = useAuth();
  const { isWishlisted, toggle } = useWishlist();
  const photos = listing.media?.filter((m) => m.type === 'PHOTO') ?? [];
  const cover = photos.find((m) => m.isPrimary) ?? photos[0];
  const video = listing.media?.find((m) => m.type === 'VIDEO');
  const isCertified = listing.status === 'ACTIVE';
  const isSold = listing.status === 'SOLD';
  const wishlisted = isWishlisted(listing.id);

  return (
    <Link to={`/listings/${listing.id}`}
      className={`block bg-white border border-gray-200 rounded-[13px] overflow-hidden ${isSold ? 'opacity-60' : ''}`}>
      <div className="flex">
        {/* Image — 104px wide */}
        <div className="w-[104px] flex-shrink-0 border-r border-gray-200 bg-gray-50 relative flex items-center justify-center min-h-[108px] grid-backdrop">
          {cover ? (
            <img src={cover.url} alt={listing.title} className="absolute inset-0 w-full h-full object-cover" />
          ) : (
            <MachineIcon className="relative z-[1] w-[36px] h-[36px] text-gray-400 opacity-50" />
          )}
          {video && (
            <span className="absolute bottom-1.5 left-1.5 z-[2] bg-[rgba(16,24,40,.85)] text-white font-mono text-[7.5px] font-semibold px-1.5 py-0.5 rounded-[4px] flex items-center gap-1">
              <PlayIcon className="w-1.5 h-1.5 fill-[#6CE9A6]" />
              {video.durationSeconds ? `${video.durationSeconds}s` : t('components.listingCard.videoBadge')}
            </span>
          )}
          {user && (
            <button
              type="button"
              aria-label={wishlisted ? t('components.listingCard.removeFromWishlist') : t('components.listingCard.saveToWishlist')}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                void toggle(listing.id);
              }}
              className="absolute right-1.5 top-1.5 z-[2] flex h-6 w-6 items-center justify-center rounded-full bg-white/90 border border-gray-200"
            >
              <HeartIcon className={`w-[12px] h-[12px] ${wishlisted ? 'fill-copper stroke-copper' : 'fill-none stroke-gray-500'}`} />
            </button>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 p-[10px_12px] min-w-0">
          {/* Badge */}
          <div className="flex flex-wrap items-center gap-1 mb-1.5">
            {isSold ? (
              <span className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-[5px] bg-gray-200 text-gray-600">
                {t('components.listingCard.soldBadge')}
              </span>
            ) : isCertified ? (
              <span className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-[5px] bg-green-bg text-green-txt border border-green-bdr">
                <span className="w-1.5 h-1.5 rounded-full bg-green-txt" />
                {t('components.listingCard.certifiedBadge')}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-[5px] bg-copper-bg text-copper border border-copper-bdr">
                {t('components.listingCard.unverifiedBadge')}
              </span>
            )}
            {listing.isBoosted && (
              <span className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-[5px] bg-forest text-white">
                <StarIcon className="w-2 h-2 fill-white stroke-white" />
                {t('components.listingCard.boostedBadge')}
              </span>
            )}
            {listing.condition === 'NEW' ? (
              <span className="inline-flex items-center text-[9px] font-bold px-1.5 py-0.5 rounded-[5px] bg-ink text-white">
                {t('common:listing.conditionNew')}
              </span>
            ) : (
              <span className="inline-flex items-center text-[9px] font-bold px-1.5 py-0.5 rounded-[5px] bg-gray-100 text-gray-600 border border-gray-200">
                {t('common:listing.conditionOld')}
              </span>
            )}
          </div>

          {/* Title */}
          <p className="text-[13.5px] font-bold text-ink tracking-[-0.2px] leading-[1.3] mb-[3px] truncate">
            {listing.title}
          </p>

          {/* Seller row */}
          <div className="flex items-center gap-1.5 text-[10.5px] text-gray-500 font-medium mb-1.5 truncate">
            <span className="w-3 h-3 rounded-full bg-forest-bg inline-flex items-center justify-center flex-shrink-0">
              <svg width="7" height="7" viewBox="0 0 8 8" fill="none">
                <polyline points="1.5 4 3.5 6 6.5 2" stroke="#101828" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <span className="truncate">{listing.machineMake} · {t('components.listingCard.gstLabel')}</span>
          </div>

          {/* Category */}
          <p className="text-[10.5px] font-semibold text-forest-2 truncate mb-1">
            {listing.machineCategory}
            {listing.machineSubcategory ? ` · ${listing.machineSubcategory}` : ''}
          </p>

          {/* Spec strip */}
          <p className="font-mono text-[8.5px] text-gray-500 font-semibold tracking-[0.05em] truncate">
            <span className="text-ink font-bold">{listing.complexityTier}</span>
            {' · '}
            {listing.origin === 'IMPORTED'
              ? (listing.importedCountry ? t('common:listing.importedFrom', { country: listing.importedCountry }) : t('common:listing.originImported'))
              : t('common:listing.originIndian')}
            {' · '}{listing.locationCity}
          </p>

          {/* Posted date + view count — secondary metadata */}
          <p className="mt-1 font-mono text-[8.5px] font-medium text-gray-400 truncate">
            {t('common:listing.posted', { date: formatRelativeDate(listing.postedAt ?? listing.createdAt, locale) })}
            {' · '}
            {t('common:listing.views', { count: listing.viewCount })}
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between gap-2 border-t border-gray-200 bg-gray-25 px-3 py-[9px]">
        <div className="min-w-0 flex-1">
          <p className="font-mono text-[8px] font-semibold text-gray-500 tracking-[0.06em] mb-0.5 truncate">
            {t('components.listingCard.askingLabel')} · {listing.locationCity.toUpperCase()}
          </p>
          <p className="text-[17px] font-extrabold text-ink tracking-[-0.4px] leading-none truncate">
            {formatInrShort(listing.askingPrice)}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <span className="h-8 w-8 border border-gray-300 rounded-[8px] bg-white flex items-center justify-center" title={t('common:listing.views', { count: listing.viewCount }) as string}>
            <EyeIcon className="w-[13px] h-[13px] text-gray-700" />
          </span>
          <span className="h-8 px-3 bg-copper rounded-[8px] flex items-center text-[11.5px] font-semibold text-white">
            {t('components.listingCard.enquireButton')}
          </span>
        </div>
      </div>
    </Link>
  );
}
