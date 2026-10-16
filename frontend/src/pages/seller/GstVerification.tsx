import { useTranslation } from 'react-i18next';
import { GstVerificationPanel } from '../../components/GstVerificationPanel';
import { PageHeading } from '../../components/ui';

export function SellerGstVerification() {
  const { t } = useTranslation();
  return (
    <div>
      <PageHeading
        eyebrow={t('seller.gstVerification.eyebrow')}
        title={t('seller.gstVerification.title')}
        description={t('seller.gstVerification.description')}
      />
      <GstVerificationPanel
        requireAddress
        intro={
          <p>
            {t('seller.gstVerification.intro.before')}{' '}
            <span className="font-semibold text-navy">{t('seller.gstVerification.intro.activeLabel')}</span>{' '}
            {t('seller.gstVerification.intro.after')}
          </p>
        }
      />
    </div>
  );
}
