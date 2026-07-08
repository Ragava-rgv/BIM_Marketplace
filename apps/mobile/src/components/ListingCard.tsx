import { Link } from 'react-router-dom';
import type { ListingDto } from '@machinebazaar/shared';
import { formatInrShort } from '../lib/format';
import { EyeIcon, MachineIcon, PlayIcon } from './icons';

export function ListingCard({ listing }: { listing: ListingDto }) {
  const cover = listing.media?.find((m) => m.type === 'PHOTO');
  const video = listing.media?.find((m) => m.type === 'VIDEO');
  const isCertified = listing.status === 'ACTIVE';

  return (
    <Link to={`/listings/${listing.id}`}
      className="block bg-white border border-gray-200 rounded-[13px] overflow-hidden">
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
              {video.durationSeconds ? `${video.durationSeconds}s` : 'VIDEO'}
            </span>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 p-[10px_12px] min-w-0">
          {/* Badge */}
          {isCertified ? (
            <span className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-[5px] mb-1.5 bg-green-bg text-green-txt border border-green-bdr">
              <span className="w-1.5 h-1.5 rounded-full bg-green-txt" />
              CERTIFIED
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-[5px] mb-1.5 bg-copper-bg text-copper border border-copper-bdr">
              UNVERIFIED
            </span>
          )}

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
            <span className="truncate">{listing.machineMake} · GST</span>
          </div>

          {/* Spec strip */}
          <p className="font-mono text-[8.5px] text-gray-500 font-semibold tracking-[0.05em]">
            <span className="text-ink font-bold">{listing.manufactureYear}</span>
            {' · '}{listing.complexityTier}
            {' · '}{listing.locationCity}
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-gray-200 bg-gray-25 px-3 py-[9px]">
        <div>
          <p className="font-mono text-[8px] font-semibold text-gray-500 tracking-[0.06em] mb-0.5">
            ASKING · {listing.locationCity.toUpperCase()}
          </p>
          <p className="text-[17px] font-extrabold text-ink tracking-[-0.4px] leading-none">
            {formatInrShort(listing.askingPrice)}
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-8 h-8 border border-gray-300 rounded-[8px] bg-white flex items-center justify-center">
            <EyeIcon className="w-[13px] h-[13px] text-gray-700" />
          </span>
          <span className="h-8 px-3 bg-copper rounded-[8px] flex items-center text-[11.5px] font-semibold text-white">
            Enquire
          </span>
        </div>
      </div>
    </Link>
  );
}
