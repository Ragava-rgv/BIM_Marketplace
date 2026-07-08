"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MACHINE_CATEGORIES = exports.CONTACT_REVEAL_PRICE_INR = exports.STANDARD_SUBSCRIPTION_PRICE_INR = exports.STANDARD_LISTING_QUOTA = exports.FREE_LISTING_QUOTA = exports.MIN_VIDEO_DURATION_SECONDS = exports.PHOTO_MAX_AGE_DAYS = exports.MAX_LISTING_PHOTOS = exports.MIN_LISTING_PHOTOS = exports.SELLER_COMMISSION_RATE = exports.BUYER_COMMISSION_RATE = exports.SpecFilterType = exports.SpecFieldType = exports.SubscriptionStatus = exports.SubscriptionPlan = exports.BuybackStatus = exports.FinancePartnerType = exports.LoanApplicationStatus = exports.CertificationConditionGrade = exports.CertificationStatus = exports.CommissionStatus = exports.EnquiryStatus = exports.MediaType = exports.ComplexityTier = exports.ListingStatus = exports.GstStatus = exports.UserRole = void 0;
var UserRole;
(function (UserRole) {
    UserRole["SELLER"] = "SELLER";
    UserRole["BUYER"] = "BUYER";
    UserRole["ADMIN"] = "ADMIN";
})(UserRole || (exports.UserRole = UserRole = {}));
var GstStatus;
(function (GstStatus) {
    GstStatus["UNVERIFIED"] = "UNVERIFIED";
    GstStatus["ACTIVE"] = "ACTIVE";
    GstStatus["INACTIVE"] = "INACTIVE";
})(GstStatus || (exports.GstStatus = GstStatus = {}));
var ListingStatus;
(function (ListingStatus) {
    ListingStatus["DRAFT"] = "DRAFT";
    ListingStatus["PENDING_REVIEW"] = "PENDING_REVIEW";
    ListingStatus["ACTIVE"] = "ACTIVE";
    ListingStatus["UNDER_OFFER"] = "UNDER_OFFER";
    ListingStatus["SOLD"] = "SOLD";
    ListingStatus["REJECTED"] = "REJECTED";
    ListingStatus["WITHDRAWN"] = "WITHDRAWN";
})(ListingStatus || (exports.ListingStatus = ListingStatus = {}));
var ComplexityTier;
(function (ComplexityTier) {
    ComplexityTier["SIMPLE"] = "SIMPLE";
    ComplexityTier["STANDARD"] = "STANDARD";
    ComplexityTier["COMPLEX"] = "COMPLEX";
})(ComplexityTier || (exports.ComplexityTier = ComplexityTier = {}));
var MediaType;
(function (MediaType) {
    MediaType["PHOTO"] = "PHOTO";
    MediaType["VIDEO"] = "VIDEO";
})(MediaType || (exports.MediaType = MediaType = {}));
var EnquiryStatus;
(function (EnquiryStatus) {
    EnquiryStatus["NEW"] = "NEW";
    EnquiryStatus["CLOSED"] = "CLOSED";
})(EnquiryStatus || (exports.EnquiryStatus = EnquiryStatus = {}));
var CommissionStatus;
(function (CommissionStatus) {
    CommissionStatus["PENDING"] = "PENDING";
    CommissionStatus["PAID"] = "PAID";
})(CommissionStatus || (exports.CommissionStatus = CommissionStatus = {}));
var CertificationStatus;
(function (CertificationStatus) {
    CertificationStatus["REQUESTED"] = "REQUESTED";
    CertificationStatus["IN_PROGRESS"] = "IN_PROGRESS";
    CertificationStatus["COMPLETED"] = "COMPLETED";
    CertificationStatus["REJECTED"] = "REJECTED";
})(CertificationStatus || (exports.CertificationStatus = CertificationStatus = {}));
var CertificationConditionGrade;
(function (CertificationConditionGrade) {
    CertificationConditionGrade["A"] = "A";
    CertificationConditionGrade["B"] = "B";
    CertificationConditionGrade["C"] = "C";
    CertificationConditionGrade["D"] = "D";
})(CertificationConditionGrade || (exports.CertificationConditionGrade = CertificationConditionGrade = {}));
var LoanApplicationStatus;
(function (LoanApplicationStatus) {
    LoanApplicationStatus["DRAFT"] = "DRAFT";
    LoanApplicationStatus["SUBMITTED"] = "SUBMITTED";
    LoanApplicationStatus["CERT_PENDING"] = "CERT_PENDING";
    LoanApplicationStatus["WITH_PARTNER"] = "WITH_PARTNER";
    LoanApplicationStatus["APPROVED"] = "APPROVED";
    LoanApplicationStatus["REJECTED"] = "REJECTED";
})(LoanApplicationStatus || (exports.LoanApplicationStatus = LoanApplicationStatus = {}));
var FinancePartnerType;
(function (FinancePartnerType) {
    FinancePartnerType["BANK"] = "BANK";
    FinancePartnerType["NBFC"] = "NBFC";
})(FinancePartnerType || (exports.FinancePartnerType = FinancePartnerType = {}));
var BuybackStatus;
(function (BuybackStatus) {
    BuybackStatus["QUOTED"] = "QUOTED";
    BuybackStatus["ACCEPTED"] = "ACCEPTED";
    BuybackStatus["EXPIRED"] = "EXPIRED";
    BuybackStatus["COMPLETED"] = "COMPLETED";
})(BuybackStatus || (exports.BuybackStatus = BuybackStatus = {}));
var SubscriptionPlan;
(function (SubscriptionPlan) {
    SubscriptionPlan["FREE"] = "FREE";
    SubscriptionPlan["STANDARD"] = "STANDARD";
})(SubscriptionPlan || (exports.SubscriptionPlan = SubscriptionPlan = {}));
var SubscriptionStatus;
(function (SubscriptionStatus) {
    SubscriptionStatus["ACTIVE"] = "ACTIVE";
    SubscriptionStatus["EXPIRED"] = "EXPIRED";
    SubscriptionStatus["CANCELLED"] = "CANCELLED";
})(SubscriptionStatus || (exports.SubscriptionStatus = SubscriptionStatus = {}));
var SpecFieldType;
(function (SpecFieldType) {
    SpecFieldType["number"] = "number";
    SpecFieldType["text"] = "text";
    SpecFieldType["select"] = "select";
    SpecFieldType["boolean"] = "boolean";
})(SpecFieldType || (exports.SpecFieldType = SpecFieldType = {}));
var SpecFilterType;
(function (SpecFilterType) {
    SpecFilterType["range"] = "range";
    SpecFilterType["exact"] = "exact";
    SpecFilterType["none"] = "none";
})(SpecFilterType || (exports.SpecFilterType = SpecFilterType = {}));
/** Commission split: 2% total, 1% buyer + 1% seller (non-negotiable, see project_spec.md §8.6) */
exports.BUYER_COMMISSION_RATE = 0.01;
exports.SELLER_COMMISSION_RATE = 0.01;
/** Listing media gate (project_spec.md §8.3) */
exports.MIN_LISTING_PHOTOS = 5;
exports.MAX_LISTING_PHOTOS = 10;
exports.PHOTO_MAX_AGE_DAYS = 30;
exports.MIN_VIDEO_DURATION_SECONDS = 60;
/** Subscription listing quotas */
exports.FREE_LISTING_QUOTA = 2;
exports.STANDARD_LISTING_QUOTA = 4;
exports.STANDARD_SUBSCRIPTION_PRICE_INR = 1000;
exports.CONTACT_REVEAL_PRICE_INR = 500;
/** Kitmondo-inspired industrial machinery categories (excludes broadcast, film/audio, construction, agriculture) */
exports.MACHINE_CATEGORIES = [
    {
        id: 'metalworking',
        label: 'Metal Working Machines',
        description: 'CNC lathes, milling centres, grinding, EDM and more',
        subcategories: [
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
];
