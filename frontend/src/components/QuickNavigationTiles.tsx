import type { SVGProps } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSellNavigate } from '../lib/use-sell-navigate';
import { CartIcon, UploadIcon, TargetIcon, WrenchIcon } from './icons';

type Tile = {
  id: string;
  label: string;
  icon: (props: SVGProps<SVGSVGElement>) => React.ReactElement;
  disabled?: boolean;
  onClick?: () => void;
};

/** 4-tile quick-nav row (Buy / Sell / Machine Required / Spare Parts) between the hero
    search bar and the category chip row — a faster jump-off point than scrolling. */
export function QuickNavigationTiles() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const goSell = useSellNavigate();

  const tiles: Tile[] = [
    {
      id: 'buy',
      label: t('public.home.quickNav.buy'),
      icon: CartIcon,
      onClick: () => document.getElementById('results-section')?.scrollIntoView({ behavior: 'smooth' }),
    },
    {
      id: 'sell',
      label: t('public.home.quickNav.sell'),
      icon: UploadIcon,
      onClick: goSell,
    },
    {
      id: 'wanted',
      // Always the public browse-and-quote page — signed-in buyers already have their
      // own posted requirements under the buyer dashboard's "My requirements" nav link.
      label: t('public.home.quickNav.required'),
      icon: TargetIcon,
      onClick: () => navigate('/wanted'),
    },
    {
      id: 'spare-parts',
      label: t('public.home.quickNav.spareParts'),
      icon: WrenchIcon,
      disabled: true,
    },
  ];

  return (
    <div className="bg-white px-6 pb-6 lg:px-[52px]">
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
          {tiles.map((tile) => (
            <button
              key={tile.id}
              type="button"
              disabled={tile.disabled}
              onClick={tile.onClick}
              className={`group flex flex-col items-center justify-center gap-2 rounded-[12px] border border-line p-4 text-center transition ${
                tile.disabled
                  ? 'cursor-default bg-paper opacity-50'
                  : 'bg-white hover:border-copper hover:shadow-[inset_0_0_0_1px_#B45309]'
              }`}
            >
              <tile.icon className={`h-6 w-6 ${tile.disabled ? 'text-muted' : 'text-forest group-hover:text-copper'}`} />
              <span className={`text-[14px] font-semibold ${tile.disabled ? 'text-muted' : 'text-forest group-hover:text-copper'}`}>
                {tile.label}
              </span>
              {tile.disabled && (
                <span className="font-mono text-[10px] font-semibold uppercase tracking-wide text-muted">
                  {t('public.home.quickNav.comingSoon')}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
