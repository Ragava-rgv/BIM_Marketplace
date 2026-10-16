import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { ListingDto, PaginatedResult } from '../shared';
import { api } from '../lib/api';
import { formatInr } from '../lib/format';
import { MachineIcon } from './icons';

/** Navy ticker bar (project_spec.md Â§4): scrolls live/recent ACTIVE listings. */
export function TickerBar() {
  const [listings, setListings] = useState<ListingDto[]>([]);

  useEffect(() => {
    let cancelled = false;
    api
      .get<PaginatedResult<ListingDto>>('/listings', { params: { pageSize: 12, page: 1 } })
      .then(({ data }) => {
        if (!cancelled) setListings(data.items);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  if (listings.length === 0) return null;

  // Duplicate the list so the CSS marquee loops seamlessly.
  const track = [...listings, ...listings];

  return (
    <div className="max-w-full overflow-hidden border-b border-white/10 bg-ink py-2.5">
      <div className="flex w-max ticker-track">
        {track.map((listing, idx) => (
          <Link
            key={`${listing.id}-${idx}`}
            to={`/listings/${listing.id}`}
            className="flex shrink-0 items-center gap-2 border-r border-white/10 px-6 font-mono text-xs text-white/70 transition hover:text-white"
          >
            <MachineIcon className="h-4 w-4 text-copper" />
            <span className="font-semibold text-white">{listing.title}</span>
            <span className="text-white/40">
              {listing.locationCity}, {listing.locationState}
            </span>
            <span className="font-bold text-copper">{formatInr(listing.askingPrice)}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
