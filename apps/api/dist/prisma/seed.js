"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcrypt = __importStar(require("bcrypt"));
const INDUSTRY_CATEGORIES = [
    { id: 'metalworking', label: 'Metal Working Machines', description: 'CNC lathes, milling centres, grinding, EDM and more', subcategories: ['CNC Turning Centres', 'CNC Milling Machines', 'VMC – Vertical Machining Centres', 'HMC – Horizontal Machining Centres', 'Conventional Lathes', 'Surface Grinding Machines', 'Cylindrical Grinding Machines', 'EDM / Wire Cut Machines', 'Drilling Machines', 'Boring Machines', 'Hydraulic Power Presses', 'Mechanical Power Presses', 'Miscellaneous Metal Working'] },
    { id: 'sheet-metal', label: 'Sheet Metal Machines', description: 'Laser cutting, press brakes, shearing and punching', subcategories: ['Laser Cutting Machines', 'Press Brakes / Bending Machines', 'Shearing Machines', 'Punching Machines', 'Roll Forming Machines', 'Miscellaneous Sheet Metal'] },
    { id: 'plastic-rubber', label: 'Plastic & Rubber', description: 'Injection moulding, blow moulding, extrusion', subcategories: ['Injection Moulding Machines', 'Blow Moulding Machines', 'Extrusion Lines', 'Thermoforming Machines', 'Rubber Moulding Machines', 'Miscellaneous Plastic & Rubber'] },
    { id: 'textile', label: 'Textile Machines', description: 'Knitting, weaving, spinning and dyeing equipment', subcategories: ['Knitting Machines', 'Weaving Machines', 'Spinning Machines', 'Dyeing & Finishing Machines', 'Embroidery Machines', 'Miscellaneous Textile'] },
    { id: 'printing', label: 'Printing Machines', description: 'Offset, digital, screen and flexographic printing', subcategories: ['Offset Printing Machines', 'Digital Printing Machines', 'Screen Printing Machines', 'Flexographic Printing', 'Die Cutting Machines', 'Miscellaneous Printing'] },
    { id: 'packaging', label: 'Packaging & Conditioning', description: 'Filling, sealing, labelling and wrapping machines', subcategories: ['Filling Machines', 'Sealing Machines', 'Labelling Machines', 'Shrink Wrapping Machines', 'Cartoning Machines', 'Miscellaneous Packaging'] },
    { id: 'pharma-chemical', label: 'Pharmaceutical & Chemical', description: 'Tablet press, capsule filling, reactors and mixers', subcategories: ['Tablet Press Machines', 'Capsule Filling Machines', 'Blenders / Mixers', 'Reactors & Vessels', 'Coating Machines', 'Miscellaneous Pharma & Chemical'] },
    { id: 'food-processing', label: 'Food Processing', description: 'Industrial ovens, fryers, mixers and packaging', subcategories: ['Industrial Ovens', 'Fryers', 'Food Mixers / Blenders', 'Food Filling & Packaging', 'Bakery Machines', 'Miscellaneous Food Processing'] },
    { id: 'woodworking', label: 'Woodworking Machines', description: 'Saws, planers, CNC routers and edge banders', subcategories: ['Band Saws', 'Circular Saws', 'Planers / Thickness Planers', 'CNC Routers', 'Edge Banders', 'Mortising Machines', 'Miscellaneous Woodworking'] },
    { id: 'industrial-equipment', label: 'Miscellaneous Industrial Equipment', description: 'Compressors, generators, forklifts, cranes and more', subcategories: ['Air Compressors', 'Diesel Generators', 'Forklifts', 'Cranes & Hoists', 'Industrial Pumps', 'Hydraulic Systems', 'Miscellaneous Industrial Equipment'] },
];
const prisma = new client_1.PrismaClient();
const DEPRECIATION_CATEGORIES = [
    'CNC Machines',
    'Lathes',
    'Presses',
    'Compressors',
    'Generators',
    'Material Handling',
];
function buildCurve() {
    const curve = [100];
    for (let year = 1; year <= 15; year++) {
        const prev = curve[year - 1];
        const drop = year === 1 ? 12 : 8;
        curve.push(Math.max(20, Math.round((prev - drop) * 100) / 100));
    }
    return curve;
}
async function seedDepreciationSchedule() {
    const curve = buildCurve();
    for (const category of DEPRECIATION_CATEGORIES) {
        for (let yearOffset = 0; yearOffset < curve.length; yearOffset++) {
            await prisma.depreciationSchedule.upsert({
                where: { machineCategory_yearOffset: { machineCategory: category, yearOffset } },
                update: { retainedValuePct: curve[yearOffset] },
                create: {
                    machineCategory: category,
                    yearOffset,
                    retainedValuePct: curve[yearOffset],
                },
            });
        }
    }
    console.log(`Seeded depreciation schedule for ${DEPRECIATION_CATEGORIES.length} categories x ${curve.length} years`);
}
async function seedFinancePartners() {
    const partners = [
        { name: 'State Industrial Bank', type: client_1.FinancePartnerType.BANK, referralRate: 0.5, active: true },
        { name: 'Apex NBFC Finance', type: client_1.FinancePartnerType.NBFC, referralRate: 0.75, active: true },
        { name: 'National Machinery Credit', type: client_1.FinancePartnerType.BANK, referralRate: 0.4, active: true },
    ];
    for (const partner of partners) {
        const existing = await prisma.financePartner.findFirst({ where: { name: partner.name } });
        if (!existing) {
            await prisma.financePartner.create({ data: partner });
        }
    }
    console.log(`Seeded ${partners.length} finance partners`);
}
async function seedAdminUser() {
    const email = process.env.ADMIN_SEED_EMAIL ?? 'admin@machinebazaar.in';
    const password = process.env.ADMIN_SEED_PASSWORD ?? 'ChangeMe123!';
    const phone = process.env.ADMIN_SEED_PHONE ?? '9999999999';
    const passwordHash = await bcrypt.hash(password, 12);
    await prisma.user.upsert({
        where: { email },
        update: { passwordHash },
        create: {
            role: client_1.UserRole.ADMIN,
            email,
            phone,
            passwordHash,
            fullName: 'Platform Admin',
            phoneVerified: true,
            gstStatus: client_1.GstStatus.UNVERIFIED,
        },
    });
    console.log(`Seeded admin user: ${email}`);
}
async function seedSubscriptionPlans() {
    const plans = [
        {
            name: 'FREE',
            displayName: 'Free',
            listingQuota: 2,
            priceInr: 0,
            durationDays: 30,
            isActive: true,
            isFree: true,
            description: 'GST-verified sellers get 2 listing slots at no cost.',
            sortOrder: 0,
        },
        {
            name: 'STANDARD',
            displayName: 'Standard',
            listingQuota: 4,
            priceInr: 1000,
            durationDays: 30,
            isActive: true,
            isFree: false,
            description: 'List up to 4 machines per month with priority review.',
            sortOrder: 1,
        },
    ];
    for (const plan of plans) {
        await prisma.subscriptionPlanConfig.upsert({
            where: { name: plan.name },
            update: {},
            create: plan,
        });
    }
    console.log(`Seeded ${plans.length} subscription plan configs`);
}
async function seedBuyerSubscriptionPlans() {
    const plans = [
        {
            name: 'FREE',
            displayName: 'Free',
            contactViewQuota: 10,
            priceInr: 0,
            durationDays: null,
            isActive: true,
            isFree: true,
            isDefault: true,
            description: '10 free contact views, no expiry.',
            sortOrder: 0,
        },
        {
            name: 'STANDARD',
            displayName: 'Standard',
            contactViewQuota: 30,
            priceInr: 499,
            durationDays: 30,
            isActive: true,
            isFree: false,
            isDefault: false,
            description: '30 contact views per month.',
            sortOrder: 1,
        },
        {
            name: 'PRO',
            displayName: 'Pro',
            contactViewQuota: 100,
            priceInr: 1499,
            durationDays: 30,
            isActive: true,
            isFree: false,
            isDefault: false,
            description: '100 contact views per month, for active buyers.',
            sortOrder: 2,
        },
    ];
    for (const plan of plans) {
        await prisma.buyerSubscriptionPlan.upsert({
            where: { name: plan.name },
            update: {},
            create: plan,
        });
    }
    console.log(`Seeded ${plans.length} buyer subscription plans`);
}
async function seedBoostPlans() {
    const plans = [
        {
            name: 'BASIC_BOOST',
            displayName: '3-Day Boost',
            priceInr: 199,
            durationDays: 3,
            sortWeight: 1,
            isActive: true,
            description: 'Pushes your listing to the top of search results for 3 days.',
            sortOrder: 0,
        },
        {
            name: 'WEEKLY_BOOST',
            displayName: '7-Day Boost',
            priceInr: 399,
            durationDays: 7,
            sortWeight: 2,
            isActive: true,
            description: 'Pushes your listing to the top of search results for a full week.',
            sortOrder: 1,
        },
        {
            name: 'MONTHLY_BOOST',
            displayName: '30-Day Boost',
            priceInr: 999,
            durationDays: 30,
            sortWeight: 3,
            isActive: true,
            description: 'Maximum visibility — top placement for a full month.',
            sortOrder: 2,
        },
    ];
    for (const plan of plans) {
        await prisma.promotionPlan.upsert({
            where: { name: plan.name },
            update: {},
            create: plan,
        });
    }
    console.log(`Seeded ${plans.length} boost plans`);
}
const CATALOG = [
    {
        name: 'Metal Cutting',
        categories: [
            {
                name: 'CNC Turning Centre',
                slug: 'cnc-turning-centre',
                description: 'CNC lathes and turning centres',
                specFields: [
                    { fieldKey: 'swing_over_bed', fieldLabel: 'Swing Over Bed', unit: 'mm', fieldType: client_1.SpecFieldType.number, isFilterable: true, filterType: client_1.SpecFilterType.range },
                    { fieldKey: 'distance_centres', fieldLabel: 'Distance Between Centres', unit: 'mm', fieldType: client_1.SpecFieldType.number },
                    { fieldKey: 'chuck_size', fieldLabel: 'Chuck Size', unit: 'inch', fieldType: client_1.SpecFieldType.number, isFilterable: true, filterType: client_1.SpecFilterType.exact },
                    { fieldKey: 'spindle_bore', fieldLabel: 'Spindle Bore', unit: 'mm', fieldType: client_1.SpecFieldType.number },
                    { fieldKey: 'max_rpm', fieldLabel: 'Max Spindle RPM', unit: 'rpm', fieldType: client_1.SpecFieldType.number, isFilterable: true, filterType: client_1.SpecFilterType.range },
                    { fieldKey: 'controller', fieldLabel: 'Controller', fieldType: client_1.SpecFieldType.text },
                    { fieldKey: 'turret_stations', fieldLabel: 'Turret Stations', unit: 'nos', fieldType: client_1.SpecFieldType.number },
                    { fieldKey: 'tailstock', fieldLabel: 'Tailstock', fieldType: client_1.SpecFieldType.select, options: ['Programmable', 'Manual', 'None'] },
                ],
            },
            {
                name: 'Conventional Lathe',
                slug: 'conventional-lathe',
                description: 'Manual and engine lathes',
                specFields: [
                    { fieldKey: 'swing_over_bed', fieldLabel: 'Swing Over Bed', unit: 'mm', fieldType: client_1.SpecFieldType.number, isFilterable: true, filterType: client_1.SpecFilterType.range },
                    { fieldKey: 'admit_centres', fieldLabel: 'Distance Between Centres', unit: 'mm', fieldType: client_1.SpecFieldType.number },
                    { fieldKey: 'spindle_bore', fieldLabel: 'Spindle Bore', unit: 'mm', fieldType: client_1.SpecFieldType.number },
                    { fieldKey: 'bed_width', fieldLabel: 'Bed Width', unit: 'mm', fieldType: client_1.SpecFieldType.number },
                    { fieldKey: 'speeds', fieldLabel: 'Number of Speeds', unit: 'nos', fieldType: client_1.SpecFieldType.number },
                    { fieldKey: 'motor_power', fieldLabel: 'Motor Power', unit: 'HP', fieldType: client_1.SpecFieldType.number },
                ],
            },
            {
                name: 'VMC / HMC',
                slug: 'vmc-hmc',
                description: 'Vertical and horizontal machining centres',
                specFields: [
                    { fieldKey: 'x_travel', fieldLabel: 'X-Axis Travel', unit: 'mm', fieldType: client_1.SpecFieldType.number, isFilterable: true, filterType: client_1.SpecFilterType.range },
                    { fieldKey: 'y_travel', fieldLabel: 'Y-Axis Travel', unit: 'mm', fieldType: client_1.SpecFieldType.number },
                    { fieldKey: 'z_travel', fieldLabel: 'Z-Axis Travel', unit: 'mm', fieldType: client_1.SpecFieldType.number },
                    { fieldKey: 'table_size', fieldLabel: 'Table Size', unit: 'mm', fieldType: client_1.SpecFieldType.text },
                    { fieldKey: 'spindle_taper', fieldLabel: 'Spindle Taper', fieldType: client_1.SpecFieldType.text },
                    { fieldKey: 'max_rpm', fieldLabel: 'Max Spindle RPM', unit: 'rpm', fieldType: client_1.SpecFieldType.number, isFilterable: true, filterType: client_1.SpecFilterType.range },
                    { fieldKey: 'atc_capacity', fieldLabel: 'ATC Capacity', unit: 'nos', fieldType: client_1.SpecFieldType.number, isFilterable: true, filterType: client_1.SpecFilterType.range },
                ],
            },
            {
                name: 'Milling Machine',
                slug: 'milling-machine',
                description: 'Conventional milling machines',
                specFields: [
                    { fieldKey: 'table_size', fieldLabel: 'Table Size', unit: 'mm', fieldType: client_1.SpecFieldType.text },
                    { fieldKey: 'x_travel', fieldLabel: 'X-Axis Travel', unit: 'mm', fieldType: client_1.SpecFieldType.number, isFilterable: true, filterType: client_1.SpecFilterType.range },
                    { fieldKey: 'spindle_taper', fieldLabel: 'Spindle Taper', fieldType: client_1.SpecFieldType.text },
                    { fieldKey: 'speeds', fieldLabel: 'Number of Speeds', unit: 'nos', fieldType: client_1.SpecFieldType.number },
                    { fieldKey: 'motor_power', fieldLabel: 'Motor Power', unit: 'HP', fieldType: client_1.SpecFieldType.number },
                ],
            },
            {
                name: 'EDM / Wire Cut',
                slug: 'edm-wire-cut',
                description: 'Electrical discharge and wire-cut machines',
                specFields: [
                    { fieldKey: 'work_tank', fieldLabel: 'Work Tank Size', unit: 'mm', fieldType: client_1.SpecFieldType.text },
                    { fieldKey: 'max_workpiece', fieldLabel: 'Max Workpiece Weight', unit: 'kg', fieldType: client_1.SpecFieldType.number, isFilterable: true, filterType: client_1.SpecFilterType.range },
                    { fieldKey: 'xy_travel', fieldLabel: 'X/Y Travel', unit: 'mm', fieldType: client_1.SpecFieldType.text },
                    { fieldKey: 'wire_dia', fieldLabel: 'Wire Diameter', unit: 'mm', fieldType: client_1.SpecFieldType.number },
                    { fieldKey: 'taper', fieldLabel: 'Max Taper', unit: 'deg', fieldType: client_1.SpecFieldType.number },
                    { fieldKey: 'control', fieldLabel: 'Control', fieldType: client_1.SpecFieldType.text },
                ],
            },
            {
                name: 'Surface Grinder',
                slug: 'surface-grinder',
                description: 'Surface grinding machines',
                specFields: [
                    { fieldKey: 'table_size', fieldLabel: 'Table Size', unit: 'mm', fieldType: client_1.SpecFieldType.text },
                    { fieldKey: 'max_grinding_length', fieldLabel: 'Max Grinding Length', unit: 'mm', fieldType: client_1.SpecFieldType.number, isFilterable: true, filterType: client_1.SpecFilterType.range },
                    { fieldKey: 'wheel_size', fieldLabel: 'Grinding Wheel Size', unit: 'mm', fieldType: client_1.SpecFieldType.text },
                    { fieldKey: 'spindle_power', fieldLabel: 'Spindle Power', unit: 'HP', fieldType: client_1.SpecFieldType.number },
                ],
            },
            {
                name: 'Bandsaw / Cutting',
                slug: 'bandsaw-cutting',
                description: 'Metal bandsaws and cutting machines',
                specFields: [
                    { fieldKey: 'max_cutting_dia', fieldLabel: 'Max Cutting Diameter', unit: 'mm', fieldType: client_1.SpecFieldType.number, isFilterable: true, filterType: client_1.SpecFilterType.range },
                    { fieldKey: 'blade_size', fieldLabel: 'Blade Size', unit: 'mm', fieldType: client_1.SpecFieldType.text },
                    { fieldKey: 'motor_power', fieldLabel: 'Motor Power', unit: 'HP', fieldType: client_1.SpecFieldType.number },
                    { fieldKey: 'type', fieldLabel: 'Type', fieldType: client_1.SpecFieldType.select, options: ['Horizontal', 'Vertical'] },
                ],
            },
        ],
    },
    {
        name: 'Forming & Pressing',
        categories: [
            {
                name: 'Power Press',
                slug: 'power-press',
                description: 'Mechanical and pneumatic power presses',
                specFields: [
                    { fieldKey: 'tonnage', fieldLabel: 'Tonnage', unit: 'ton', fieldType: client_1.SpecFieldType.number, isFilterable: true, filterType: client_1.SpecFilterType.range },
                    { fieldKey: 'stroke_length', fieldLabel: 'Stroke Length', unit: 'mm', fieldType: client_1.SpecFieldType.number },
                    { fieldKey: 'bed_size', fieldLabel: 'Bed Size', unit: 'mm', fieldType: client_1.SpecFieldType.text },
                    { fieldKey: 'shut_height', fieldLabel: 'Shut Height', unit: 'mm', fieldType: client_1.SpecFieldType.number },
                    { fieldKey: 'strokes_min', fieldLabel: 'Strokes Per Minute', unit: 'spm', fieldType: client_1.SpecFieldType.number },
                    { fieldKey: 'press_type', fieldLabel: 'Press Type', fieldType: client_1.SpecFieldType.select, options: ['C-frame', 'H-frame', 'Pillar', 'Pneumatic'] },
                ],
            },
            {
                name: 'Hydraulic Press',
                slug: 'hydraulic-press',
                description: 'Hydraulic presses',
                specFields: [
                    { fieldKey: 'tonnage', fieldLabel: 'Tonnage', unit: 'ton', fieldType: client_1.SpecFieldType.number, isFilterable: true, filterType: client_1.SpecFilterType.range },
                    { fieldKey: 'daylight', fieldLabel: 'Daylight', unit: 'mm', fieldType: client_1.SpecFieldType.number },
                    { fieldKey: 'stroke', fieldLabel: 'Stroke', unit: 'mm', fieldType: client_1.SpecFieldType.number },
                    { fieldKey: 'bed_size', fieldLabel: 'Bed Size', unit: 'mm', fieldType: client_1.SpecFieldType.text },
                    { fieldKey: 'ram_speed', fieldLabel: 'Ram Speed', unit: 'mm/s', fieldType: client_1.SpecFieldType.number },
                ],
            },
            {
                name: 'Press Brake',
                slug: 'press-brake',
                description: 'CNC and hydraulic press brakes',
                specFields: [
                    { fieldKey: 'tonnage', fieldLabel: 'Tonnage', unit: 'ton', fieldType: client_1.SpecFieldType.number, isFilterable: true, filterType: client_1.SpecFilterType.range },
                    { fieldKey: 'bending_length', fieldLabel: 'Bending Length', unit: 'mm', fieldType: client_1.SpecFieldType.number, isFilterable: true, filterType: client_1.SpecFilterType.range },
                    { fieldKey: 'stroke', fieldLabel: 'Stroke', unit: 'mm', fieldType: client_1.SpecFieldType.number },
                    { fieldKey: 'throat_depth', fieldLabel: 'Throat Depth', unit: 'mm', fieldType: client_1.SpecFieldType.number },
                    { fieldKey: 'control', fieldLabel: 'Control', fieldType: client_1.SpecFieldType.text },
                ],
            },
            {
                name: 'Shearing Machine',
                slug: 'shearing-machine',
                description: 'Plate and sheet shearing machines',
                specFields: [
                    { fieldKey: 'cutting_length', fieldLabel: 'Cutting Length', unit: 'mm', fieldType: client_1.SpecFieldType.number, isFilterable: true, filterType: client_1.SpecFilterType.range },
                    { fieldKey: 'cutting_thickness', fieldLabel: 'Max Cutting Thickness', unit: 'mm', fieldType: client_1.SpecFieldType.number, isFilterable: true, filterType: client_1.SpecFilterType.range },
                    { fieldKey: 'type', fieldLabel: 'Type', fieldType: client_1.SpecFieldType.select, options: ['Hydraulic', 'Mechanical'] },
                ],
            },
            {
                name: 'Rolling Machine',
                slug: 'rolling-machine',
                description: 'Plate and section rolling machines',
                specFields: [
                    { fieldKey: 'roll_length', fieldLabel: 'Roll Length', unit: 'mm', fieldType: client_1.SpecFieldType.number, isFilterable: true, filterType: client_1.SpecFilterType.range },
                    { fieldKey: 'roll_dia', fieldLabel: 'Roll Diameter', unit: 'mm', fieldType: client_1.SpecFieldType.number },
                    { fieldKey: 'max_thickness', fieldLabel: 'Max Plate Thickness', unit: 'mm', fieldType: client_1.SpecFieldType.number, isFilterable: true, filterType: client_1.SpecFilterType.range },
                ],
            },
        ],
    },
    {
        name: 'Moulding & Casting',
        categories: [
            {
                name: 'Injection Moulding',
                slug: 'injection-moulding',
                description: 'Plastic injection moulding machines',
                specFields: [
                    { fieldKey: 'clamping_force', fieldLabel: 'Clamping Force', unit: 'ton', fieldType: client_1.SpecFieldType.number, isFilterable: true, filterType: client_1.SpecFilterType.range },
                    { fieldKey: 'shot_weight', fieldLabel: 'Shot Weight', unit: 'gram', fieldType: client_1.SpecFieldType.number, isFilterable: true, filterType: client_1.SpecFilterType.range },
                    { fieldKey: 'screw_dia', fieldLabel: 'Screw Diameter', unit: 'mm', fieldType: client_1.SpecFieldType.number },
                    { fieldKey: 'tie_bar_dist', fieldLabel: 'Tie Bar Distance', unit: 'mm', fieldType: client_1.SpecFieldType.text },
                    { fieldKey: 'platen_size', fieldLabel: 'Platen Size', unit: 'mm', fieldType: client_1.SpecFieldType.text },
                    { fieldKey: 'injection_pressure', fieldLabel: 'Injection Pressure', unit: 'bar', fieldType: client_1.SpecFieldType.number },
                    { fieldKey: 'control', fieldLabel: 'Control System', fieldType: client_1.SpecFieldType.select, options: ['Microprocessor', 'PLC', 'Servo', 'Hydraulic'] },
                ],
            },
            {
                name: 'Blow Moulding',
                slug: 'blow-moulding',
                description: 'Blow moulding machines',
                specFields: [
                    { fieldKey: 'clamping_force', fieldLabel: 'Clamping Force', unit: 'ton', fieldType: client_1.SpecFieldType.number, isFilterable: true, filterType: client_1.SpecFilterType.range },
                    { fieldKey: 'max_volume', fieldLabel: 'Max Container Volume', unit: 'litre', fieldType: client_1.SpecFieldType.number, isFilterable: true, filterType: client_1.SpecFilterType.range },
                    { fieldKey: 'screw_dia', fieldLabel: 'Screw Diameter', unit: 'mm', fieldType: client_1.SpecFieldType.number },
                    { fieldKey: 'station_type', fieldLabel: 'Station Type', fieldType: client_1.SpecFieldType.select, options: ['Single', 'Double'] },
                ],
            },
            {
                name: 'Die Casting',
                slug: 'die-casting',
                description: 'Die casting machines',
                specFields: [
                    { fieldKey: 'clamping_force', fieldLabel: 'Clamping Force', unit: 'ton', fieldType: client_1.SpecFieldType.number, isFilterable: true, filterType: client_1.SpecFilterType.range },
                    { fieldKey: 'shot_weight', fieldLabel: 'Max Shot Weight', unit: 'gram', fieldType: client_1.SpecFieldType.number },
                    { fieldKey: 'platen_size', fieldLabel: 'Platen Size', unit: 'mm', fieldType: client_1.SpecFieldType.text },
                    { fieldKey: 'type', fieldLabel: 'Type', fieldType: client_1.SpecFieldType.select, options: ['Hot Chamber', 'Cold Chamber'] },
                ],
            },
        ],
    },
];
async function seedCatalog() {
    let groupOrder = 0;
    for (const group of CATALOG) {
        const dbGroup = await prisma.categoryGroup.upsert({
            where: { name: group.name },
            update: { displayOrder: groupOrder },
            create: { name: group.name, displayOrder: groupOrder, isActive: true },
        });
        groupOrder++;
        let catOrder = 0;
        for (const cat of group.categories) {
            const dbCat = await prisma.category.upsert({
                where: { slug: cat.slug },
                update: { name: cat.name, description: cat.description ?? null, groupId: dbGroup.id, displayOrder: catOrder },
                create: {
                    name: cat.name,
                    slug: cat.slug,
                    description: cat.description ?? null,
                    groupId: dbGroup.id,
                    displayOrder: catOrder,
                    isActive: true,
                },
            });
            catOrder++;
            let fieldOrder = 0;
            for (const field of cat.specFields) {
                const existingField = await prisma.categorySpecTemplate.findFirst({
                    where: { categoryId: dbCat.id, subcategoryId: null, fieldKey: field.fieldKey },
                });
                const fieldData = {
                    fieldLabel: field.fieldLabel,
                    unit: field.unit ?? null,
                    fieldType: field.fieldType,
                    options: field.options ?? [],
                    isRequired: field.isRequired ?? false,
                    isFilterable: field.isFilterable ?? false,
                    filterType: field.filterType ?? client_1.SpecFilterType.none,
                    displayOrder: fieldOrder,
                };
                if (existingField) {
                    await prisma.categorySpecTemplate.update({ where: { id: existingField.id }, data: fieldData });
                }
                else {
                    await prisma.categorySpecTemplate.create({
                        data: { categoryId: dbCat.id, fieldKey: field.fieldKey, ...fieldData },
                    });
                }
                fieldOrder++;
            }
        }
    }
    console.log(`Seeded ${CATALOG.length} groups, ${CATALOG.flatMap((g) => g.categories).length} categories`);
}
function toSlug(name) {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
}
async function seedIndustryCategories() {
    const groupName = 'Industry Browse';
    const group = await prisma.categoryGroup.upsert({
        where: { name: groupName },
        update: { displayOrder: 99 },
        create: { name: groupName, displayOrder: 99, isActive: true },
    });
    let catOrder = 0;
    let subTotal = 0;
    for (const cat of INDUSTRY_CATEGORIES) {
        const dbCat = await prisma.category.upsert({
            where: { slug: cat.id },
            update: { name: cat.label, description: cat.description, groupId: group.id, displayOrder: catOrder },
            create: {
                name: cat.label,
                slug: cat.id,
                description: cat.description,
                groupId: group.id,
                displayOrder: catOrder,
                isActive: true,
            },
        });
        catOrder++;
        let subOrder = 0;
        for (const subName of cat.subcategories) {
            const subSlug = toSlug(subName);
            await prisma.subcategory.upsert({
                where: { categoryId_slug: { categoryId: dbCat.id, slug: subSlug } },
                update: { name: subName, displayOrder: subOrder },
                create: {
                    categoryId: dbCat.id,
                    name: subName,
                    slug: subSlug,
                    displayOrder: subOrder,
                    isActive: true,
                },
            });
            subOrder++;
            subTotal++;
        }
    }
    console.log(`Seeded ${INDUSTRY_CATEGORIES.length} industry categories, ${subTotal} subcategories`);
}
async function seedAppSettings() {
    await prisma.appSetting.upsert({
        where: { key: 'contact_reveal_price_inr' },
        update: {},
        create: { key: 'contact_reveal_price_inr', value: '500', label: 'Contact reveal price (₹)' },
    });
    console.log('Seeded app settings');
}
async function main() {
    await seedDepreciationSchedule();
    await seedFinancePartners();
    await seedAdminUser();
    await seedSubscriptionPlans();
    await seedBuyerSubscriptionPlans();
    await seedBoostPlans();
    await seedCatalog();
    await seedIndustryCategories();
    await seedAppSettings();
}
main()
    .catch((err) => {
    console.error(err);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed.js.map