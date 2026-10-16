import { useTranslation } from 'react-i18next';

interface Props {
  open: boolean;
  loading: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export function WithdrawConfirmSheet({ open, loading, onConfirm, onClose }: Props) {
  const { t } = useTranslation();
  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-[60] bg-black/40" onClick={loading ? undefined : onClose} />
      <div
        className="fixed bottom-0 left-0 right-0 z-[70] bg-white rounded-t-[24px] px-6 pt-5"
        style={{ paddingBottom: `calc(env(safe-area-inset-bottom) + 24px)` }}
      >
        <div className="w-10 h-1 rounded-full bg-gray-200 mx-auto mb-5" />
        <h2 className="text-[18px] font-extrabold text-ink tracking-[-0.3px] mb-2">
          {t('seller.editListing.withdrawConfirm.title')}
        </h2>
        <p className="text-[13.5px] text-gray-500 leading-relaxed mb-5">
          {t('seller.editListing.withdrawConfirm.body')}
        </p>

        <div className="space-y-2.5">
          <button
            onClick={onConfirm}
            disabled={loading}
            className="w-full h-[50px] bg-red-600 text-white rounded-[13px] text-[14.5px] font-bold disabled:opacity-50"
          >
            {loading ? t('seller.editListing.withdrawing') : t('seller.editListing.withdrawConfirm.confirm')}
          </button>
          <button
            onClick={onClose}
            disabled={loading}
            className="w-full h-[46px] bg-gray-100 text-gray-700 rounded-[13px] text-[14px] font-semibold disabled:opacity-50"
          >
            {t('seller.editListing.withdrawConfirm.cancel')}
          </button>
        </div>
      </div>
    </>
  );
}
