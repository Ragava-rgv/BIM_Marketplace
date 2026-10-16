-- Removes the admin-approval gate from Requirement and Quote lifecycles.
-- Existing rows are remapped (not deleted) so real data survives the enum shrink:
--   RequirementStatus: DRAFT/PENDING_REVIEW -> ACTIVE, REJECTED -> CLOSED
--   QuoteStatus:        PENDING_ADMIN/APPROVED -> SUBMITTED, REJECTED -> WITHDRAWN

-- QuoteStatus
ALTER TYPE "QuoteStatus" RENAME TO "QuoteStatus_old";
CREATE TYPE "QuoteStatus" AS ENUM ('SUBMITTED', 'WITHDRAWN');

ALTER TABLE "quotes" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "quotes" ALTER COLUMN "status" TYPE "QuoteStatus" USING (
  CASE "status"::text
    WHEN 'PENDING_ADMIN' THEN 'SUBMITTED'
    WHEN 'APPROVED' THEN 'SUBMITTED'
    WHEN 'REJECTED' THEN 'WITHDRAWN'
    ELSE 'SUBMITTED'
  END
)::"QuoteStatus";
ALTER TABLE "quotes" ALTER COLUMN "status" SET DEFAULT 'SUBMITTED';

DROP TYPE "QuoteStatus_old";

-- RequirementStatus
ALTER TYPE "RequirementStatus" RENAME TO "RequirementStatus_old";
CREATE TYPE "RequirementStatus" AS ENUM ('ACTIVE', 'FULFILLED', 'CLOSED');

ALTER TABLE "requirements" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "requirements" ALTER COLUMN "status" TYPE "RequirementStatus" USING (
  CASE "status"::text
    WHEN 'DRAFT' THEN 'ACTIVE'
    WHEN 'PENDING_REVIEW' THEN 'ACTIVE'
    WHEN 'REJECTED' THEN 'CLOSED'
    ELSE "status"::text
  END
)::"RequirementStatus";
ALTER TABLE "requirements" ALTER COLUMN "status" SET DEFAULT 'ACTIVE';

DROP TYPE "RequirementStatus_old";
