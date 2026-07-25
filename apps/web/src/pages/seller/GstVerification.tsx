import { GstVerificationPanel } from '../../components/GstVerificationPanel';
import { PageHeading } from '../../components/ui';

export function SellerGstVerification() {
  return (
    <div>
      <PageHeading
        eyebrow="Seller requirement"
        title="GST verification"
        description="An ACTIVE GST registration is required before you can publish any listing. We verify your GSTIN through the Masters India API and auto-fill your business name from the response."
      />
      <GstVerificationPanel
        requireAddress
        intro={
          <p>
            Sellers must have an <span className="font-semibold text-navy">ACTIVE</span> GST
            registration to create and publish listings on BIM. Enter your GSTIN and business
            address below — we&apos;ll validate the GSTIN, confirm it isn&apos;t cancelled or
            suspended, and pull your registered business name automatically. Your address is
            shown to buyers once they view your contact details.
          </p>
        }
      />
    </div>
  );
}
