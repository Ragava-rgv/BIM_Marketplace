import type {
  UserRole,
  GstStatus,
  ListingStatus,
  ComplexityTier,
  ListingOrigin,
  MediaType,
  EnquiryStatus,
  CommissionStatus,
  CertificationStatus,
  CertificationConditionGrade,
  LoanApplicationStatus,
  FinancePartnerType,
  BuybackStatus,
  SubscriptionPlan,
  SubscriptionStatus,
  SpecFieldType,
  SpecFilterType,
  SupportedLanguage,
  AdPlacement,
  RequirementStatus,
  QuoteStatus,
  ListingCondition,
} from './enums';

export interface UserDto {
  id: string;
  role: UserRole;
  email: string | null;
  phone: string;
  fullName: string;
  phoneVerified: boolean;
  gstNumber: string | null;
  businessName: string | null;
  gstStatus: GstStatus;
  locationCity: string | null;
  locationState: string | null;
  address: string | null;
  activeMode: string;
  canSell: boolean;
  preferredLanguage: SupportedLanguage;
  createdAt: string;
  updatedAt: string;
}

export interface ListingMediaDto {
  id: string;
  listingId: string;
  type: MediaType;
  storageKey: string;
  url: string;
  capturedAt: string | null;
  durationSeconds: number | null;
  orderIndex: number;
  isPrimary: boolean;
}

export interface ListingDto {
  id: string;
  sellerId: string;
  title: string;
  description: string;
  machineCategory: string;
  machineSubcategory: string | null;
  machineMake: string;
  machineModel: string;
  manufactureYear: number | null;
  origin: ListingOrigin;
  importedCountry: string | null;
  askingPrice: string;
  locationCity: string;
  locationState: string;
  status: ListingStatus;
  complexityTier: ComplexityTier;
  catalogCategoryId: string | null;
  specs: Record<string, unknown> | null;
  conditionGrade: string | null;
  condition: ListingCondition;
  runningHours: number | null;
  serialNumber: string | null;
  negotiable: boolean;
  isBoosted: boolean;
  boostExpiresAt: string | null;
  postedAt: string | null;
  viewCount: number;
  media?: ListingMediaDto[];
  seller?: {
    id: string;
    fullName: string;
    phone: string;
    email: string | null;
    gstNumber: string | null;
    businessName: string | null;
    gstStatus: GstStatus;
    locationCity: string | null;
    locationState: string | null;
  };
  catalogCategory?: CategoryDto | null;
  createdAt: string;
  updatedAt: string;
}

export interface RequirementMediaDto {
  id: string;
  requirementId: string;
  type: MediaType;
  storageKey: string;
  url: string;
  capturedAt: string | null;
  durationSeconds: number | null;
  orderIndex: number;
  isPrimary: boolean;
}

export interface RequirementDto {
  id: string;
  buyerId: string;
  title: string;
  description: string;
  machineCategory: string;
  machineSubcategory: string | null;
  origin: ListingOrigin | null;
  importedCountry: string | null;
  manufactureYear: number | null;
  runningHours: number | null;
  condition: ListingCondition | null;
  complexityTier: ComplexityTier;
  catalogCategoryId: string | null;
  specs: Record<string, unknown> | null;
  budgetMin: string | null;
  budgetMax: string | null;
  quantity: number | null;
  locationCity: string | null;
  locationState: string | null;
  status: RequirementStatus;
  postedAt: string | null;
  media?: RequirementMediaDto[];
  buyer?: {
    id: string;
    fullName: string;
    phone?: string;
    email?: string | null;
    locationCity?: string | null;
    locationState?: string | null;
  };
  catalogCategory?: CategoryDto | null;
  quotes?: QuoteDto[];
  createdAt: string;
  updatedAt: string;
}

export interface QuoteMediaDto {
  id: string;
  quoteId: string;
  type: MediaType;
  storageKey: string;
  url: string;
  orderIndex: number;
  isPrimary: boolean;
}

export interface QuoteDto {
  id: string;
  requirementId: string;
  responderId: string;
  listingId: string | null;
  contactName: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
  contactCompany: string | null;
  catalogCategoryId: string | null;
  machineCategory: string | null;
  machineMake: string | null;
  machineModel: string | null;
  manufactureYear: number | null;
  origin: ListingOrigin | null;
  importedCountry: string | null;
  condition: ListingCondition | null;
  machineLocation: string | null;
  price: string | null;
  description: string | null;
  specs: Record<string, unknown> | null;
  message: string | null;
  status: QuoteStatus;
  adminReviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
  media?: QuoteMediaDto[];
  requirement?: { id: string; title: string; machineCategory: string; status?: RequirementStatus; buyer?: { id: string; fullName: string } };
  responder?: { id: string; fullName: string; phone?: string; email?: string | null; gstStatus?: GstStatus };
  listing?: ListingDto | { id: string; title: string; askingPrice?: string } | null;
}

export interface WishlistDto {
  id: string;
  buyerId: string;
  listingId: string;
  createdAt: string;
  listing?: ListingDto;
}

export interface PromotionPlanDto {
  id: string;
  name: string;
  displayName: string;
  priceInr: string;
  durationDays: number;
  sortWeight: number;
  isActive: boolean;
  description: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface ListingBoostDto {
  id: string;
  listingId: string;
  sellerId: string;
  planId: string | null;
  price: string;
  durationDays: number;
  startsAt: string;
  expiresAt: string;
  createdAt: string;
  listing?: { id: string; title: string };
  plan?: PromotionPlanDto | null;
}

export interface ListingBoostStatusDto {
  isBoosted: boolean;
  boostExpiresAt: string | null;
}

export interface AdvertisementDto {
  id: string;
  title: string;
  imageUrl: string;
  linkUrl: string | null;
  position: number;
  placement: AdPlacement;
  startsAt: string | null;
  endsAt: string | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface EnquiryListingSummary {
  id: string;
  title: string;
  askingPrice: string;
  status: ListingStatus;
}

/** Buyer's own enquiry view, or the admin's full-detail view. */
export interface EnquiryDto {
  id: string;
  listingId: string;
  buyerId: string;
  sellerId: string;
  status: EnquiryStatus;
  createdAt: string;
  listing?: EnquiryListingSummary;
  buyer?: {
    fullName: string;
    phone: string;
    email: string | null;
    gstNumber: string | null;
    businessName: string | null;
    locationCity: string | null;
    locationState: string | null;
  };
}

/** Seller's view of an enquiry — minimal buyer details only. */
export interface SellerEnquiryDto {
  id: string;
  listingId: string;
  listingTitle: string;
  status: EnquiryStatus;
  createdAt: string;
  buyerName: string;
  buyerLocationCity: string | null;
  buyerLocationState: string | null;
}

export interface ReleasedContactDto {
  fullName: string;
  phone: string;
  email: string | null;
}

export interface TransactionDto {
  id: string;
  listingId: string;
  buyerId: string;
  sellerId: string;
  salePrice: string;
  buyerCommission: string;
  sellerCommission: string;
  commissionStatus: CommissionStatus;
  contactReleasedAt: string | null;
  createdAt: string;
}

export interface ReleasedContactSummaryDto {
  transactionId: string;
  listingId: string;
  listingTitle: string;
  contactReleasedAt: string;
  contact: ReleasedContactDto;
}

/** Structured inspection report filled in by the certifying inspector. */
export interface InspectionReportDto {
  conditionGrade: CertificationConditionGrade;
  verifiedRunHours: number;
  verifiedManufactureYear: number;
  functionalTestPassed: boolean;
  defectsObserved: string;
  recommendedMarketValue: number;
  inspectorName: string;
  inspectionDate: string;
}

export interface CertificationDto {
  id: string;
  listingId: string;
  loanApplicationId: string;
  complexityTier: ComplexityTier;
  fee: string;
  status: CertificationStatus;
  reportStorageKey: string | null;
  inspectorNotes: string | null;
  inspectionReport: InspectionReportDto | null;
  createdAt: string;
  completedAt: string | null;
  listing?: {
    title: string;
    machineCategory: string;
    machineMake: string;
    machineModel: string;
    manufactureYear: number | null;
    askingPrice: string;
    locationCity: string;
    locationState: string;
  };
}

export interface LoanApplicationDto {
  id: string;
  listingId: string;
  buyerId: string;
  partnerId: string | null;
  amountRequested: string;
  status: LoanApplicationStatus;
  referralCommission: string | null;
  createdAt: string;
  partner?: FinancePartnerDto | null;
  listing?: {
    id: string;
    title: string;
    askingPrice: string;
    machineCategory: string;
    machineMake: string;
    machineModel: string;
    manufactureYear: number | null;
    locationCity: string;
    locationState: string;
    complexityTier: ComplexityTier;
    status: ListingStatus;
  };
  buyer?: { fullName: string; phone: string; email: string | null; gstStatus: GstStatus };
  certification?: CertificationDto | null;
  buybackOffer?: { id: string } | null;
}

export interface FinancePartnerDto {
  id: string;
  name: string;
  type: FinancePartnerType;
  referralRate: string;
  active: boolean;
}

/** One row of the year-on-year buyback value table, anchored on the certified value (§ buyback flow step 5). */
export interface BuybackScheduleEntryDto {
  yearOffset: number;
  retainedValuePct: string;
  buybackValue: string;
}

/** Editable terms of the buyback agreement document (§ buyback flow step 4). */
export interface BuybackAgreementTermsDto {
  buybackWindowYears: number;
  noticePeriodDays: number;
  conditions: string;
}

export interface BuybackOfferDto {
  id: string;
  listingId: string | null;
  loanApplicationId: string | null;
  machineReference: string | null;
  originalPrice: string;
  machineAgeYears: number;
  certifiedValue: string | null;
  depreciatedValue: string;
  offerAmount: string;
  depreciationSchedule: BuybackScheduleEntryDto[] | null;
  agreementTerms: BuybackAgreementTermsDto | null;
  status: BuybackStatus;
  createdAt: string;
  listing?: {
    id: string;
    title: string;
    machineCategory: string;
    machineMake: string;
    machineModel: string;
    manufactureYear: number | null;
    locationCity: string;
    locationState: string;
    sellerId: string;
  };
}

export interface DepreciationScheduleDto {
  id: string;
  machineCategory: string;
  yearOffset: number;
  retainedValuePct: string;
}

export interface AuthTokensDto {
  accessToken: string;
  refreshToken: string;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface SubscriptionPlanConfigDto {
  id: string;
  name: string;
  displayName: string;
  listingQuota: number;
  priceInr: string;
  durationDays: number;
  isActive: boolean;
  isFree: boolean;
  description: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface SellerSubscriptionDto {
  id: string;
  sellerId: string;
  plan: SubscriptionPlan;
  planConfigId: string | null;
  listingQuota: number;
  price: string;
  durationDays: number;
  startsAt: string;
  expiresAt: string;
  status: SubscriptionStatus;
  createdAt: string;
  planConfig?: SubscriptionPlanConfigDto | null;
}

export interface SubscriptionStatusDto {
  plan: SubscriptionPlan;
  listingQuota: number;
  activeListingsCount: number;
  remainingSlots: number;
  subscription: SellerSubscriptionDto | null;
}

export interface RazorpayOrderDto {
  razorpayOrderId: string;
  amount: number;
  currency: string;
  keyId: string;
}

export interface BuyerSubscriptionPlanDto {
  id: string;
  name: string;
  displayName: string;
  contactViewQuota: number;
  priceInr: string;
  durationDays: number | null;
  isActive: boolean;
  isFree: boolean;
  isDefault: boolean;
  description: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface BuyerSubscriptionDto {
  id: string;
  buyerId: string;
  planId: string | null;
  quotaTotal: number;
  quotaUsed: number;
  price: string;
  durationDays: number | null;
  startsAt: string;
  expiresAt: string | null;
  status: SubscriptionStatus;
  adjustedBy: string | null;
  adjustedAt: string | null;
  adjustmentReason: string | null;
  createdAt: string;
  plan?: BuyerSubscriptionPlanDto | null;
  buyer?: { id: string; fullName: string; phone: string; email: string | null } | null;
}

export interface BuyerSubscriptionStatusDto {
  quotaTotal: number;
  quotaUsed: number;
  quotaRemaining: number;
  expiresAt: string | null;
  status: SubscriptionStatus;
  subscription: BuyerSubscriptionDto;
}

export interface ContactViewDto {
  id: string;
  buyerId: string;
  listingId: string;
  sellerId: string;
  viewedAt: string;
  listing?: { id: string; title: string; machineCategory: string } | null;
  seller?: { id: string; fullName: string; businessName: string | null } | null;
}

export interface ContactViewStatusDto {
  contact: { fullName: string; phone: string; address: string; email: string | null } | null;
  quotaUsed: number;
  quotaTotal: number;
  quotaRemaining: number;
  isIdempotent: boolean;
}

// ---------------------------------------------------------------------------
// Self-expandable machine catalog
// ---------------------------------------------------------------------------

export interface CategorySpecTemplateDto {
  id: string;
  categoryId: string;
  fieldKey: string;
  fieldLabel: string;
  unit: string | null;
  fieldType: SpecFieldType;
  options: string[];
  isRequired: boolean;
  isFilterable: boolean;
  filterType: SpecFilterType;
  displayOrder: number;
  helpText: string | null;
}

export interface SubcategoryDto {
  id: string;
  categoryId: string;
  name: string;
  slug: string;
  iconKey: string | null;
  imageUrl: string | null;
  description: string | null;
  listingCount: number;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryDto {
  id: string;
  groupId: string | null;
  name: string;
  slug: string;
  iconKey: string | null;
  imageUrl: string | null;
  thumbnailUrl: string | null;
  description: string | null;
  listingCount: number;
  isActive: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
  specFields?: CategorySpecTemplateDto[];
  subcategories?: SubcategoryDto[];
}

export interface CategoryGroupDto {
  id: string;
  name: string;
  displayOrder: number;
  isActive: boolean;
  categories: CategoryDto[];
}
