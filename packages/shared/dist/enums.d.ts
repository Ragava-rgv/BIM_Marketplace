export declare enum UserRole {
    SELLER = "SELLER",
    BUYER = "BUYER",
    ADMIN = "ADMIN"
}
export declare enum GstStatus {
    UNVERIFIED = "UNVERIFIED",
    ACTIVE = "ACTIVE",
    INACTIVE = "INACTIVE"
}
export declare enum ListingStatus {
    DRAFT = "DRAFT",
    PENDING_REVIEW = "PENDING_REVIEW",
    ACTIVE = "ACTIVE",
    UNDER_OFFER = "UNDER_OFFER",
    SOLD = "SOLD",
    REJECTED = "REJECTED",
    WITHDRAWN = "WITHDRAWN"
}
export declare enum ComplexityTier {
    SIMPLE = "SIMPLE",
    STANDARD = "STANDARD",
    COMPLEX = "COMPLEX"
}
export declare enum ListingOrigin {
    INDIAN = "INDIAN",
    IMPORTED = "IMPORTED"
}
export declare enum MediaType {
    PHOTO = "PHOTO",
    VIDEO = "VIDEO"
}
export declare enum EnquiryStatus {
    NEW = "NEW",
    CLOSED = "CLOSED"
}
export declare enum CommissionStatus {
    PENDING = "PENDING",
    PAID = "PAID"
}
export declare enum CertificationStatus {
    REQUESTED = "REQUESTED",
    IN_PROGRESS = "IN_PROGRESS",
    COMPLETED = "COMPLETED",
    REJECTED = "REJECTED"
}
export declare enum CertificationConditionGrade {
    A = "A",
    B = "B",
    C = "C",
    D = "D"
}
export declare enum LoanApplicationStatus {
    DRAFT = "DRAFT",
    SUBMITTED = "SUBMITTED",
    CERT_PENDING = "CERT_PENDING",
    WITH_PARTNER = "WITH_PARTNER",
    APPROVED = "APPROVED",
    REJECTED = "REJECTED"
}
export declare enum FinancePartnerType {
    BANK = "BANK",
    NBFC = "NBFC"
}
export declare enum BuybackStatus {
    QUOTED = "QUOTED",
    ACCEPTED = "ACCEPTED",
    EXPIRED = "EXPIRED",
    COMPLETED = "COMPLETED"
}
export declare enum SubscriptionPlan {
    FREE = "FREE",
    STANDARD = "STANDARD"
}
export declare enum SubscriptionStatus {
    ACTIVE = "ACTIVE",
    EXPIRED = "EXPIRED",
    CANCELLED = "CANCELLED"
}
export declare enum SpecFieldType {
    number = "number",
    text = "text",
    select = "select",
    boolean = "boolean"
}
export declare enum SpecFilterType {
    range = "range",
    exact = "exact",
    none = "none"
}
/** Commission split: 2% total, 1% buyer + 1% seller (non-negotiable, see project_spec.md §8.6) */
export declare const BUYER_COMMISSION_RATE = 0.01;
export declare const SELLER_COMMISSION_RATE = 0.01;
/** Listing media gate (project_spec.md §8.3) */
export declare const MIN_LISTING_PHOTOS = 5;
export declare const MAX_LISTING_PHOTOS = 10;
export declare const PHOTO_MAX_AGE_DAYS = 30;
export declare const MIN_VIDEO_DURATION_SECONDS = 60;
/** Subscription listing quotas */
export declare const FREE_LISTING_QUOTA = 2;
export declare const STANDARD_LISTING_QUOTA = 4;
export declare const STANDARD_SUBSCRIPTION_PRICE_INR = 1000;
export declare const CONTACT_REVEAL_PRICE_INR = 500;
/** Default buyer contact-view quota — used only by the seed script; runtime default comes from the DB-flagged isDefault plan */
export declare const DEFAULT_BUYER_CONTACT_VIEW_QUOTA = 10;
/** Quota-alert modal thresholds */
export declare const QUOTA_ALERT_AFTER_USED = 4;
export declare const QUOTA_ALERT_REMAINING_THRESHOLD = 2;
/** Kitmondo-inspired industrial machinery categories (excludes broadcast, film/audio, construction, agriculture) */
export declare const MACHINE_CATEGORIES: readonly [{
    readonly id: "metalworking";
    readonly label: "Metal Working Machines";
    readonly description: "CNC lathes, milling centres, grinding, EDM and more";
    readonly subcategories: readonly ["CNC Turning Centres", "CNC Milling Machines", "VMC – Vertical Machining Centres", "HMC – Horizontal Machining Centres", "Conventional Lathes", "Surface Grinding Machines", "Cylindrical Grinding Machines", "EDM / Wire Cut Machines", "Drilling Machines", "Boring Machines", "Hydraulic Power Presses", "Mechanical Power Presses", "Miscellaneous Metal Working"];
}, {
    readonly id: "sheet-metal";
    readonly label: "Sheet Metal Machines";
    readonly description: "Laser cutting, press brakes, shearing and punching";
    readonly subcategories: readonly ["Laser Cutting Machines", "Press Brakes / Bending Machines", "Shearing Machines", "Punching Machines", "Roll Forming Machines", "Miscellaneous Sheet Metal"];
}, {
    readonly id: "plastic-rubber";
    readonly label: "Plastic & Rubber";
    readonly description: "Injection moulding, blow moulding, extrusion";
    readonly subcategories: readonly ["Injection Moulding Machines", "Blow Moulding Machines", "Extrusion Lines", "Thermoforming Machines", "Rubber Moulding Machines", "Miscellaneous Plastic & Rubber"];
}, {
    readonly id: "textile";
    readonly label: "Textile Machines";
    readonly description: "Knitting, weaving, spinning and dyeing equipment";
    readonly subcategories: readonly ["Knitting Machines", "Weaving Machines", "Spinning Machines", "Dyeing & Finishing Machines", "Embroidery Machines", "Miscellaneous Textile"];
}, {
    readonly id: "printing";
    readonly label: "Printing Machines";
    readonly description: "Offset, digital, screen and flexographic printing";
    readonly subcategories: readonly ["Offset Printing Machines", "Digital Printing Machines", "Screen Printing Machines", "Flexographic Printing", "Die Cutting Machines", "Miscellaneous Printing"];
}, {
    readonly id: "packaging";
    readonly label: "Packaging & Conditioning";
    readonly description: "Filling, sealing, labelling and wrapping machines";
    readonly subcategories: readonly ["Filling Machines", "Sealing Machines", "Labelling Machines", "Shrink Wrapping Machines", "Cartoning Machines", "Miscellaneous Packaging"];
}, {
    readonly id: "pharma-chemical";
    readonly label: "Pharmaceutical & Chemical";
    readonly description: "Tablet press, capsule filling, reactors and mixers";
    readonly subcategories: readonly ["Tablet Press Machines", "Capsule Filling Machines", "Blenders / Mixers", "Reactors & Vessels", "Coating Machines", "Miscellaneous Pharma & Chemical"];
}, {
    readonly id: "food-processing";
    readonly label: "Food Processing";
    readonly description: "Industrial ovens, fryers, mixers and packaging";
    readonly subcategories: readonly ["Industrial Ovens", "Fryers", "Food Mixers / Blenders", "Food Filling & Packaging", "Bakery Machines", "Miscellaneous Food Processing"];
}, {
    readonly id: "woodworking";
    readonly label: "Woodworking Machines";
    readonly description: "Saws, planers, CNC routers and edge banders";
    readonly subcategories: readonly ["Band Saws", "Circular Saws", "Planers / Thickness Planers", "CNC Routers", "Edge Banders", "Mortising Machines", "Miscellaneous Woodworking"];
}, {
    readonly id: "industrial-equipment";
    readonly label: "Miscellaneous Industrial Equipment";
    readonly description: "Compressors, generators, forklifts, cranes and more";
    readonly subcategories: readonly ["Air Compressors", "Diesel Generators", "Forklifts", "Cranes & Hoists", "Industrial Pumps", "Hydraulic Systems", "Miscellaneous Industrial Equipment"];
}];
export type MachineCategoryId = (typeof MACHINE_CATEGORIES)[number]['id'];
