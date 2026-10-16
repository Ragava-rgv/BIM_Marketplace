import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AdPlacement, type AdvertisementDto } from '../shared';
import { api } from '../lib/api';

/** Wide, full-content-width promotional banner — sourced from the same admin-managed
    Advertisement system as the in-grid ad tiles, just filtered to the HOME_BANNER placement. */
export function HomeAdBanner() {
  const { t } = useTranslation();
  const [ad, setAd] = useState<AdvertisementDto | null>(null);

  useEffect(() => {
    let cancelled = false;
    api
      .get<AdvertisementDto[]>('/advertisements', { params: { placement: AdPlacement.HOME_BANNER } })
      .then(({ data }) => { if (!cancelled) setAd(data[0] ?? null); })
      .catch(() => { if (!cancelled) setAd(null); });
    return () => { cancelled = true; };
  }, []);

  if (!ad) return null;

  const content = (
    <div className="relative h-[160px] w-full overflow-hidden rounded-[14px] border border-line sm:h-[200px] md:h-[250px]">
      <img src={ad.imageUrl} alt={ad.title} className="h-full w-full object-cover" />
      <span className="absolute left-3 top-3 z-[1] rounded bg-ink/70 px-2 py-1 font-mono text-[9.5px] font-semibold uppercase tracking-wide text-white">
        {t('public.home.banner.sponsored')}
      </span>
    </div>
  );

  return ad.linkUrl ? (
    <a href={ad.linkUrl} target="_blank" rel="noopener noreferrer sponsored" className="block">
      {content}
    </a>
  ) : (
    content
  );
}
