export enum UserRole {
  SELLER = 'SELLER',
  BUYER = 'BUYER',
  ADMIN = 'ADMIN',
}

export enum GstStatus {
  UNVERIFIED = 'UNVERIFIED',
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export enum ListingStatus {
  DRAFT = 'DRAFT',
  PENDING_REVIEW = 'PENDING_REVIEW',
  ACTIVE = 'ACTIVE',
  UNDER_OFFER = 'UNDER_OFFER',
  SOLD = 'SOLD',
  REJECTED = 'REJECTED',
  WITHDRAWN = 'WITHDRAWN',
}

export enum ComplexityTier {
  SIMPLE = 'SIMPLE',
  STANDARD = 'STANDARD',
  COMPLEX = 'COMPLEX',
}

export enum ListingOrigin {
  INDIAN = 'INDIAN',
  IMPORTED = 'IMPORTED',
}

export enum ListingCondition {
  OLD = 'OLD',
  NEW = 'NEW',
}

export enum MediaType {
  PHOTO = 'PHOTO',
  VIDEO = 'VIDEO',
}

export enum EnquiryStatus {
  NEW = 'NEW',
  CLOSED = 'CLOSED',
}

export enum CommissionStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
}

export enum CertificationStatus {
  REQUESTED = 'REQUESTED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  REJECTED = 'REJECTED',
}

export enum CertificationConditionGrade {
  A = 'A',
  B = 'B',
  C = 'C',
  D = 'D',
}

export enum LoanApplicationStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  CERT_PENDING = 'CERT_PENDING',
  WITH_PARTNER = 'WITH_PARTNER',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export enum FinancePartnerType {
  BANK = 'BANK',
  NBFC = 'NBFC',
}

export enum BuybackStatus {
  QUOTED = 'QUOTED',
  ACCEPTED = 'ACCEPTED',
  EXPIRED = 'EXPIRED',
  COMPLETED = 'COMPLETED',
}

export enum SubscriptionPlan {
  FREE = 'FREE',
  STANDARD = 'STANDARD',
}

export enum SubscriptionStatus {
  ACTIVE = 'ACTIVE',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED',
}

export enum SpecFieldType {
  number = 'number',
  text = 'text',
  select = 'select',
  boolean = 'boolean',
}

export enum SpecFilterType {
  range = 'range',
  exact = 'exact',
  none = 'none',
}

export enum SupportedLanguage {
  EN = 'EN',
  TA = 'TA',
  HI = 'HI',
}

/** Data-driven language switcher source of truth — add a new entry here (+ locale JSON pair) to support another language. */
export const LANGUAGE_OPTIONS: { code: SupportedLanguage; glyph: string; nativeLabel: string }[] = [
  { code: SupportedLanguage.EN, glyph: 'A', nativeLabel: 'English' },
  { code: SupportedLanguage.TA, glyph: 'அ', nativeLabel: 'தமிழ்' },
  { code: SupportedLanguage.HI, glyph: 'अ', nativeLabel: 'हिन्दी' },
];

export enum AdPlacement {
  IN_GRID = 'IN_GRID',
  HOME_BANNER = 'HOME_BANNER',
}

/** No approval gate: a requirement goes ACTIVE the moment it's posted. */
export enum RequirementStatus {
  ACTIVE = 'ACTIVE',
  FULFILLED = 'FULFILLED',
  CLOSED = 'CLOSED',
}

/** No approval gate: a quote reaches the requirement owner the moment it's submitted. */
export enum QuoteStatus {
  SUBMITTED = 'SUBMITTED',
  WITHDRAWN = 'WITHDRAWN',
}

/** Commission split: 2% total, 1% buyer + 1% seller (non-negotiable, see project_spec.md §8.6) */
export const BUYER_COMMISSION_RATE = 0.01;
export const SELLER_COMMISSION_RATE = 0.01;

/** Listing media gate (project_spec.md §8.3) */
export const MIN_LISTING_PHOTOS = 5;
export const MAX_LISTING_PHOTOS = 10;
export const PHOTO_MAX_AGE_DAYS = 30;
export const MIN_VIDEO_DURATION_SECONDS = 60;

/** Subscription listing quotas */
export const FREE_LISTING_QUOTA = 2;
export const STANDARD_LISTING_QUOTA = 4;
export const STANDARD_SUBSCRIPTION_PRICE_INR = 1000;
export const CONTACT_REVEAL_PRICE_INR = 500;

/** Default buyer contact-view quota — used only by the seed script; runtime default comes from the DB-flagged isDefault plan */
export const DEFAULT_BUYER_CONTACT_VIEW_QUOTA = 10;

/** Quota-alert modal thresholds */
export const QUOTA_ALERT_AFTER_USED = 4;
export const QUOTA_ALERT_REMAINING_THRESHOLD = 2;

/** Kitmondo-inspired industrial machinery categories (excludes broadcast, film/audio, construction, agriculture) */
export const MACHINE_CATEGORIES = [
  {
    id: 'metalworking',
    label: 'Metal Working Machines',
    description: 'CNC lathes, milling centres, grinding, EDM and more',
    subcategories: [
      'SPM Machine',
      'CNC Turning Centres',
      'CNC Milling Machines',
      'VMC – Vertical Machining Centres',
      'HMC – Horizontal Machining Centres',
      'Conventional Lathes',
      'Surface Grinding Machines',
      'Cylindrical Grinding Machines',
      'EDM / Wire Cut Machines',
      'Drilling Machines',
      'Boring Machines',
      'Hydraulic Power Presses',
      'Mechanical Power Presses',
      'Miscellaneous Metal Working',
    ],
  },
  {
    id: 'sheet-metal',
    label: 'Sheet Metal Machines',
    description: 'Laser cutting, press brakes, shearing and punching',
    subcategories: [
      'Laser Cutting Machines',
      'Press Brakes / Bending Machines',
      'Shearing Machines',
      'Punching Machines',
      'Roll Forming Machines',
      'Miscellaneous Sheet Metal',
    ],
  },
  {
    id: 'plastic-rubber',
    label: 'Plastic & Rubber',
    description: 'Injection moulding, blow moulding, extrusion',
    subcategories: [
      'Injection Moulding Machines',
      'Blow Moulding Machines',
      'Extrusion Lines',
      'Thermoforming Machines',
      'Rubber Moulding Machines',
      'Miscellaneous Plastic & Rubber',
    ],
  },
  {
    id: 'textile',
    label: 'Textile Machines',
    description: 'Knitting, weaving, spinning and dyeing equipment',
    subcategories: [
      'Knitting Machines',
      'Weaving Machines',
      'Spinning Machines',
      'Dyeing & Finishing Machines',
      'Embroidery Machines',
      'Miscellaneous Textile',
    ],
  },
  {
    id: 'printing',
    label: 'Printing Machines',
    description: 'Offset, digital, screen and flexographic printing',
    subcategories: [
      'Offset Printing Machines',
      'Digital Printing Machines',
      'Screen Printing Machines',
      'Flexographic Printing',
      'Die Cutting Machines',
      'Miscellaneous Printing',
    ],
  },
  {
    id: 'packaging',
    label: 'Packaging & Conditioning',
    description: 'Filling, sealing, labelling and wrapping machines',
    subcategories: [
      'Filling Machines',
      'Sealing Machines',
      'Labelling Machines',
      'Shrink Wrapping Machines',
      'Cartoning Machines',
      'Miscellaneous Packaging',
    ],
  },
  {
    id: 'pharma-chemical',
    label: 'Pharmaceutical & Chemical',
    description: 'Tablet press, capsule filling, reactors and mixers',
    subcategories: [
      'Tablet Press Machines',
      'Capsule Filling Machines',
      'Blenders / Mixers',
      'Reactors & Vessels',
      'Coating Machines',
      'Miscellaneous Pharma & Chemical',
    ],
  },
  {
    id: 'food-processing',
    label: 'Food Processing',
    description: 'Industrial ovens, fryers, mixers and packaging',
    subcategories: [
      'Industrial Ovens',
      'Fryers',
      'Food Mixers / Blenders',
      'Food Filling & Packaging',
      'Bakery Machines',
      'Miscellaneous Food Processing',
    ],
  },
  {
    id: 'woodworking',
    label: 'Woodworking Machines',
    description: 'Saws, planers, CNC routers and edge banders',
    subcategories: [
      'Band Saws',
      'Circular Saws',
      'Planers / Thickness Planers',
      'CNC Routers',
      'Edge Banders',
      'Mortising Machines',
      'Miscellaneous Woodworking',
    ],
  },
  {
    id: 'industrial-equipment',
    label: 'Miscellaneous Industrial Equipment',
    description: 'Compressors, generators, forklifts, cranes and more',
    subcategories: [
      'Air Compressors',
      'Diesel Generators',
      'Forklifts',
      'Cranes & Hoists',
      'Industrial Pumps',
      'Hydraulic Systems',
      'Miscellaneous Industrial Equipment',
    ],
  },
] as const;

export type MachineCategoryId = (typeof MACHINE_CATEGORIES)[number]['id'];
