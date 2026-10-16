import { Trans, useTranslation } from 'react-i18next';
import { GstVerificationPanel } from '../../components/GstVerificationPanel';
import { PageHeading } from '../../components/ui';

export function BuyerGstVerification() {
  const { t } = useTranslation();
  return (
    <div>
      <PageHeading
        eyebrow={t('buyer.gstVerification.eyebrow')}
        title={t('buyer.gstVerification.title')}
        description={t('buyer.gstVerification.description')}
      />
      <GstVerificationPanel
        intro={
          <p>
            <Trans i18nKey="buyer.gstVerification.introText">
              You can browse listings and message sellers right away — GST verification is only a
              gating step before you submit a <span className="font-semibold text-navy">loan application</span>.
              Enter your GSTIN below — we&apos;ll validate it, confirm it isn&apos;t cancelled or
              suspended, and pull your registered business name automatically.
            </Trans>
          </p>
        }
      />
    </div>
  );
}
