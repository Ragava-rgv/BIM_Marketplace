import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { ListingDto } from '@machinebazaar/shared';
import { ListingStatus } from '@machinebazaar/shared';
import { formatInr, formatRelativeDate } from '../lib/format';
import { useAuth } from '../lib/auth-context';
import { useWishlist } from '../lib/wishlist-context';
import { EyeIcon, HeartIcon, MachineIcon, MapPinIcon, PlayIcon } from './icons';

export function ListingCard({ listing }: { listing: ListingDto }) {
  const { t, i18n } = useTranslation();
  const locale = `${i18n.resolvedLanguage ?? 'en'}-IN`;
  const { user } = useAuth();
  const { isWishlisted, toggle } = useWishlist();
  const photos = listing.media?.filter((m) => m.type === 'PHOTO') ?? [];
  const cover = photos.find((m) => m.isPrimary) ?? photos[0];
  const video = listing.media?.find((m) => m.type === 'VIDEO');
  const isCertified = listing.status === ListingStatus.ACTIVE;
  const shortId = `MB-${listing.id.slice(0, 8).toUpperCase()}`;
  const wishlisted = isWishlisted(listing.id);

  return (
    <Link
      to={`/listings/${listing.id}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-[#E4E7EC] bg-white transition-all duration-[180ms] hover:border-[#2D6A4F] hover:shadow-[0_8px_28px_rgba(16,24,40,.08)]"
    >
      {/* â"€â"€ Media area â"€â"€ */}
      <div className="relative flex h-[110px] items-center justify-center overflow-hidden border-b border-[#E4E7EC] bg-[#F9FAFB] sm:h-[168px]">
        {/* Grid backdrop */}
        <div className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: 'linear-gradient(rgba(16,24,40,.03) 1px,transparent 1px),linear-gradient(90deg,rgba(16,24,40,.03) 1px,transparent 1px)',
            backgroundSize: '18px 18px',
          }}
        />
        {cover ? (
          <img
            src={cover.url}
            alt={listing.title}
            className="relative z-[1] h-full w-full object-cover transition duration-300 group-hover:scale-105"
          />
        ) : (
          <MachineIcon className="relative z-[1] h-[72px] w-[72px] opacity-[0.22] text-[#1B4332]" />
        )}

        {/* Cert + condition badges */}
        <div className="absolute left-2.5 top-2.5 z-[2] flex items-center gap-1.5">
          {isCertified ? (
            <span className="inline-flex items-center gap-[5px] rounded-[6px] border border-[#ABEFC6] bg-[#ECFDF3] px-2.5 py-[4px] font-['Inter'] text-[11px] font-bold text-[#067647]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#067647]" />
              {t('components.listingCard.certified')}
            </span>
          ) : (
            <span className="inline-flex items-center gap-[5px] rounded-[6px] border border-[#F5D9A8] bg-[#FEF6EC] px-2.5 py-[4px] text-[11px] font-bold text-[#B45309]">
              {t('components.listingCard.unverified')}
            </span>
          )}
          {listing.condition === 'NEW' ? (
            <span className="inline-flex items-center rounded-[6px] bg-[#1B4332] px-2.5 py-[4px] text-[11px] font-bold text-white">
              {t('common:listing.conditionNew')}
            </span>
          ) : (
            <span className="inline-flex items-center rounded-[6px] border border-[#E4E7EC] bg-white px-2.5 py-[4px] text-[11px] font-bold text-[#475467]">
              {t('common:listing.conditionOld')}
            </span>
          )}
        </div>

        {/* Video badge */}
        {video && (
          <div className={`absolute top-2.5 z-[2] ${user ? 'right-[46px]' : 'right-2.5'}`}>
            <span className="inline-flex items-center gap-[5px] rounded-[6px] bg-[rgba(16,24,40,.85)] px-2.5 py-[4px] font-mono text-[10px] font-semibold tracking-[0.03em] text-white">
              <PlayIcon className="h-[8px] w-[8px] fill-[#6CE9A6] stroke-none" />
              {t('components.listingCard.video')}{video.durationSeconds ? ` ${video.durationSeconds}s` : ''}
            </span>
          </div>
        )}

        {/* Wishlist heart */}
        {user && (
          <button
            type="button"
            aria-label={wishlisted ? t('components.listingCard.removeFromWishlist') : t('components.listingCard.saveToWishlist')}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              void toggle(listing.id);
            }}
            className="absolute right-2.5 top-2.5 z-[2] flex h-7 w-7 items-center justify-center rounded-full border border-[#E4E7EC] bg-white/90 backdrop-blur transition hover:border-[#2D6A4F]"
          >
            <HeartIcon
              className={`h-[14px] w-[14px] ${wishlisted ? 'fill-[#B45309] stroke-[#B45309]' : 'fill-none stroke-[#667085]'}`}
            />
          </button>
        )}

        {/* Ref ID */}
        <div className="absolute bottom-2.5 left-2.5 z-[2] rounded-[5px] border border-[#E4E7EC] bg-white px-2 py-[2px] font-mono text-[10px] font-semibold tracking-[0.03em] text-[#475467]">
          {shortId}
        </div>
      </div>

      {/* â"€â"€ Card body â"€â"€ */}
      <div className="flex flex-1 flex-col p-2.5 pb-3 sm:p-[14px] sm:pb-4">
        {/* Title */}
        <p className="truncate text-[12.5px] font-bold tracking-[-0.1px] text-[#101828] sm:text-[15.5px] sm:tracking-[-0.2px]">
          {listing.title}
        </p>

        {/* Seller / GST row */}
        <div className="mb-1.5 mt-0.5 flex items-center gap-1.5 truncate text-[10.5px] font-medium text-[#667085] sm:mb-3 sm:mt-[3px] sm:text-[12px]">
          <span className="hidden h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full bg-[#EDF7F2] sm:flex">
            <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
              <polyline points="1.5 4 3.2 5.8 6.5 2.2" stroke="#2D6A4F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <span className="truncate">{listing.machineMake} · {listing.machineModel} · {t('components.listingCard.gstVerified')}</span>
        </div>

        {/* Spec strip — 2 cells */}
        <div className="mb-1.5 grid grid-cols-2 overflow-hidden rounded-[9px] border border-[#E4E7EC] sm:mb-3">
          <div className="border-r border-[#E4E7EC] bg-[#FCFCFD] px-1.5 py-1 sm:px-2.5 sm:py-2">
            <p className="mb-[2px] hidden font-mono text-[8.5px] font-semibold uppercase tracking-[0.08em] text-[#667085] sm:block">{t('components.listingCard.specTier')}</p>
            <p className="truncate font-mono text-[10px] font-semibold text-[#101828] sm:text-[12px]">{listing.complexityTier}</p>
          </div>
          <div className="bg-[#FCFCFD] px-1.5 py-1 sm:px-2.5 sm:py-2">
            <p className="mb-[2px] hidden font-mono text-[8.5px] font-semibold uppercase tracking-[0.08em] text-[#667085] sm:block">{t('components.listingCard.specType')}</p>
            <p className="truncate font-mono text-[10px] font-semibold text-[#101828] sm:text-[12px]">{listing.machineCategory}</p>
          </div>
        </div>

        {/* Location */}
        <div className="mb-1 flex items-center gap-[5px] truncate text-[10.5px] font-medium text-[#667085] sm:text-[12px]">
          <MapPinIcon className="h-3 w-3 shrink-0 stroke-[#667085] sm:h-[13px] sm:w-[13px]" />
          <span className="truncate">{listing.locationCity}, {listing.locationState}</span>
        </div>

        {/* Posted date + view count — secondary metadata, kept compact */}
        <div className="mb-1.5 truncate font-mono text-[9.5px] font-medium text-[#98A2B3] sm:mb-3.5 sm:text-[10.5px]">
          {t('common:listing.posted', { date: formatRelativeDate(listing.postedAt ?? listing.createdAt, locale) })}
          {' · '}
          {t('common:listing.views', { count: listing.viewCount })}
        </div>

        {/* Footer: price + actions */}
        <div className="mt-auto flex items-center justify-between gap-2 border-t border-[#E4E7EC] pt-2 sm:pt-[13px]">
          <div className="min-w-0 flex-1">
            <p className="mb-[1px] hidden font-mono text-[9px] font-semibold uppercase tracking-[0.08em] text-[#667085] sm:block">{t('components.listingCard.asking')}</p>
            <p className="truncate font-mono text-[15px] font-extrabold leading-[1.1] tracking-[-0.3px] text-[#101828] sm:text-[21px] sm:tracking-[-0.5px]">
              {formatInr(listing.askingPrice)}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1.5 sm:gap-[7px]">
            <span className="hidden h-[38px] w-[38px] items-center justify-center rounded-lg border border-[#D0D5DD] bg-white transition hover:border-[#101828] sm:flex" title={t('common:listing.views', { count: listing.viewCount }) as string}>
              <EyeIcon className="h-[15px] w-[15px] stroke-[#344054]" />
            </span>
            <span className="flex h-8 items-center rounded-lg bg-[#1B4332] px-2.5 text-[11.5px] font-semibold text-white transition group-hover:bg-[#2D6A4F] sm:h-[38px] sm:px-4 sm:text-[13px]">
              {t('components.listingCard.enquire')}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
