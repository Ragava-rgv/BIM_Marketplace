import { PrismaClient, FinancePartnerType, UserRole, GstStatus, SpecFieldType, SpecFilterType } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const INDUSTRY_CATEGORIES = [
  { id: 'metalworking', label: 'Metal Working Machines', description: 'CNC lathes, milling centres, grinding, EDM and more', subcategories: ['CNC Turning Centres','CNC Milling Machines','VMC – Vertical Machining Centres','HMC – Horizontal Machining Centres','Conventional Lathes','Surface Grinding Machines','Cylindrical Grinding Machines','EDM / Wire Cut Machines','Drilling Machines','Boring Machines','Hydraulic Power Presses','Mechanical Power Presses','Miscellaneous Metal Working'] },
  { id: 'sheet-metal', label: 'Sheet Metal Machines', description: 'Laser cutting, press brakes, shearing and punching', subcategories: ['Laser Cutting Machines','Press Brakes / Bending Machines','Shearing Machines','Punching Machines','Roll Forming Machines','Miscellaneous Sheet Metal'] },
  { id: 'plastic-rubber', label: 'Plastic & Rubber', description: 'Injection moulding, blow moulding, extrusion', subcategories: ['Injection Moulding Machines','Blow Moulding Machines','Extrusion Lines','Thermoforming Machines','Rubber Moulding Machines','Miscellaneous Plastic & Rubber'] },
  { id: 'textile', label: 'Textile Machines', description: 'Knitting, weaving, spinning and dyeing equipment', subcategories: ['Knitting Machines','Weaving Machines','Spinning Machines','Dyeing & Finishing Machines','Embroidery Machines','Miscellaneous Textile'] },
  { id: 'printing', label: 'Printing Machines', description: 'Offset, digital, screen and flexographic printing', subcategories: ['Offset Printing Machines','Digital Printing Machines','Screen Printing Machines','Flexographic Printing','Die Cutting Machines','Miscellaneous Printing'] },
  { id: 'packaging', label: 'Packaging & Conditioning', description: 'Filling, sealing, labelling and wrapping machines', subcategories: ['Filling Machines','Sealing Machines','Labelling Machines','Shrink Wrapping Machines','Cartoning Machines','Miscellaneous Packaging'] },
  { id: 'pharma-chemical', label: 'Pharmaceutical & Chemical', description: 'Tablet press, capsule filling, reactors and mixers', subcategories: ['Tablet Press Machines','Capsule Filling Machines','Blenders / Mixers','Reactors & Vessels','Coating Machines','Miscellaneous Pharma & Chemical'] },
  { id: 'food-processing', label: 'Food Processing', description: 'Industrial ovens, fryers, mixers and packaging', subcategories: ['Industrial Ovens','Fryers','Food Mixers / Blenders','Food Filling & Packaging','Bakery Machines','Miscellaneous Food Processing'] },
  { id: 'woodworking', label: 'Woodworking Machines', description: 'Saws, planers, CNC routers and edge banders', subcategories: ['Band Saws','Circular Saws','Planers / Thickness Planers','CNC Routers','Edge Banders','Mortising Machines','Miscellaneous Woodworking'] },
  { id: 'industrial-equipment', label: 'Miscellaneous Industrial Equipment', description: 'Compressors, generators, forklifts, cranes and more', subcategories: ['Air Compressors','Diesel Generators','Forklifts','Cranes & Hoists','Industrial Pumps','Hydraulic Systems','Miscellaneous Industrial Equipment'] },
];

const prisma = new PrismaClient();

/**
 * Placeholder depreciation curve — founder will supply real values per project_spec.md §5.
 * Retained value decays ~12% in year 1, then ~8% per year, floored at 20%.
 */
const DEPRECIATION_CATEGORIES = [
  'CNC Machines',
  'Lathes',
  'Presses',
  'Compressors',
  'Generators',
  'Material Handling',
];

function buildCurve(): number[] {
  const curve: number[] = [100];
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
    { name: 'State Industrial Bank', type: FinancePartnerType.BANK, referralRate: 0.5, active: true },
    { name: 'Apex NBFC Finance', type: FinancePartnerType.NBFC, referralRate: 0.75, active: true },
    { name: 'National Machinery Credit', type: FinancePartnerType.BANK, referralRate: 0.4, active: true },
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
      role: UserRole.ADMIN,
      email,
      phone,
      passwordHash,
      fullName: 'Platform Admin',
      phoneVerified: true,
      gstStatus: GstStatus.UNVERIFIED,
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

// ---------------------------------------------------------------------------
// Self-expandable machine catalog seed
// ---------------------------------------------------------------------------

type SpecFieldSeed = {
  fieldKey: string;
  fieldLabel: string;
  unit?: string;
  fieldType: SpecFieldType;
  options?: string[];
  isRequired?: boolean;
  isFilterable?: boolean;
  filterType?: SpecFilterType;
};

type CategorySeed = {
  name: string;
  slug: string;
  description?: string;
  specFields: SpecFieldSeed[];
};

type GroupSeed = {
  name: string;
  categories: CategorySeed[];
};

const CATALOG: GroupSeed[] = [
  {
    name: 'Metal Cutting',
    categories: [
      {
        name: 'CNC Turning Centre',
        slug: 'cnc-turning-centre',
        description: 'CNC lathes and turning centres',
        specFields: [
          { fieldKey: 'swing_over_bed', fieldLabel: 'Swing Over Bed', unit: 'mm', fieldType: SpecFieldType.number, isFilterable: true, filterType: SpecFilterType.range },
          { fieldKey: 'distance_centres', fieldLabel: 'Distance Between Centres', unit: 'mm', fieldType: SpecFieldType.number },
          { fieldKey: 'chuck_size', fieldLabel: 'Chuck Size', unit: 'inch', fieldType: SpecFieldType.number, isFilterable: true, filterType: SpecFilterType.exact },
          { fieldKey: 'spindle_bore', fieldLabel: 'Spindle Bore', unit: 'mm', fieldType: SpecFieldType.number },
          { fieldKey: 'max_rpm', fieldLabel: 'Max Spindle RPM', unit: 'rpm', fieldType: SpecFieldType.number, isFilterable: true, filterType: SpecFilterType.range },
          { fieldKey: 'controller', fieldLabel: 'Controller', fieldType: SpecFieldType.text },
          { fieldKey: 'turret_stations', fieldLabel: 'Turret Stations', unit: 'nos', fieldType: SpecFieldType.number },
          { fieldKey: 'tailstock', fieldLabel: 'Tailstock', fieldType: SpecFieldType.select, options: ['Programmable', 'Manual', 'None'] },
        ],
      },
      {
        name: 'Conventional Lathe',
        slug: 'conventional-lathe',
        description: 'Manual and engine lathes',
        specFields: [
          { fieldKey: 'swing_over_bed', fieldLabel: 'Swing Over Bed', unit: 'mm', fieldType: SpecFieldType.number, isFilterable: true, filterType: SpecFilterType.range },
          { fieldKey: 'admit_centres', fieldLabel: 'Distance Between Centres', unit: 'mm', fieldType: SpecFieldType.number },
          { fieldKey: 'spindle_bore', fieldLabel: 'Spindle Bore', unit: 'mm', fieldType: SpecFieldType.number },
          { fieldKey: 'bed_width', fieldLabel: 'Bed Width', unit: 'mm', fieldType: SpecFieldType.number },
          { fieldKey: 'speeds', fieldLabel: 'Number of Speeds', unit: 'nos', fieldType: SpecFieldType.number },
          { fieldKey: 'motor_power', fieldLabel: 'Motor Power', unit: 'HP', fieldType: SpecFieldType.number },
        ],
      },
      {
        name: 'VMC / HMC',
        slug: 'vmc-hmc',
        description: 'Vertical and horizontal machining centres',
        specFields: [
          { fieldKey: 'x_travel', fieldLabel: 'X-Axis Travel', unit: 'mm', fieldType: SpecFieldType.number, isFilterable: true, filterType: SpecFilterType.range },
          { fieldKey: 'y_travel', fieldLabel: 'Y-Axis Travel', unit: 'mm', fieldType: SpecFieldType.number },
          { fieldKey: 'z_travel', fieldLabel: 'Z-Axis Travel', unit: 'mm', fieldType: SpecFieldType.number },
          { fieldKey: 'table_size', fieldLabel: 'Table Size', unit: 'mm', fieldType: SpecFieldType.text },
          { fieldKey: 'spindle_taper', fieldLabel: 'Spindle Taper', fieldType: SpecFieldType.text },
          { fieldKey: 'max_rpm', fieldLabel: 'Max Spindle RPM', unit: 'rpm', fieldType: SpecFieldType.number, isFilterable: true, filterType: SpecFilterType.range },
          { fieldKey: 'atc_capacity', fieldLabel: 'ATC Capacity', unit: 'nos', fieldType: SpecFieldType.number, isFilterable: true, filterType: SpecFilterType.range },
        ],
      },
      {
        name: 'Milling Machine',
        slug: 'milling-machine',
        description: 'Conventional milling machines',
        specFields: [
          { fieldKey: 'table_size', fieldLabel: 'Table Size', unit: 'mm', fieldType: SpecFieldType.text },
          { fieldKey: 'x_travel', fieldLabel: 'X-Axis Travel', unit: 'mm', fieldType: SpecFieldType.number, isFilterable: true, filterType: SpecFilterType.range },
          { fieldKey: 'spindle_taper', fieldLabel: 'Spindle Taper', fieldType: SpecFieldType.text },
          { fieldKey: 'speeds', fieldLabel: 'Number of Speeds', unit: 'nos', fieldType: SpecFieldType.number },
          { fieldKey: 'motor_power', fieldLabel: 'Motor Power', unit: 'HP', fieldType: SpecFieldType.number },
        ],
      },
      {
        name: 'EDM / Wire Cut',
        slug: 'edm-wire-cut',
        description: 'Electrical discharge and wire-cut machines',
        specFields: [
          { fieldKey: 'work_tank', fieldLabel: 'Work Tank Size', unit: 'mm', fieldType: SpecFieldType.text },
          { fieldKey: 'max_workpiece', fieldLabel: 'Max Workpiece Weight', unit: 'kg', fieldType: SpecFieldType.number, isFilterable: true, filterType: SpecFilterType.range },
          { fieldKey: 'xy_travel', fieldLabel: 'X/Y Travel', unit: 'mm', fieldType: SpecFieldType.text },
          { fieldKey: 'wire_dia', fieldLabel: 'Wire Diameter', unit: 'mm', fieldType: SpecFieldType.number },
          { fieldKey: 'taper', fieldLabel: 'Max Taper', unit: 'deg', fieldType: SpecFieldType.number },
          { fieldKey: 'control', fieldLabel: 'Control', fieldType: SpecFieldType.text },
        ],
      },
      {
        name: 'Surface Grinder',
        slug: 'surface-grinder',
        description: 'Surface grinding machines',
        specFields: [
          { fieldKey: 'table_size', fieldLabel: 'Table Size', unit: 'mm', fieldType: SpecFieldType.text },
          { fieldKey: 'max_grinding_length', fieldLabel: 'Max Grinding Length', unit: 'mm', fieldType: SpecFieldType.number, isFilterable: true, filterType: SpecFilterType.range },
          { fieldKey: 'wheel_size', fieldLabel: 'Grinding Wheel Size', unit: 'mm', fieldType: SpecFieldType.text },
          { fieldKey: 'spindle_power', fieldLabel: 'Spindle Power', unit: 'HP', fieldType: SpecFieldType.number },
        ],
      },
      {
        name: 'Bandsaw / Cutting',
        slug: 'bandsaw-cutting',
        description: 'Metal bandsaws and cutting machines',
        specFields: [
          { fieldKey: 'max_cutting_dia', fieldLabel: 'Max Cutting Diameter', unit: 'mm', fieldType: SpecFieldType.number, isFilterable: true, filterType: SpecFilterType.range },
          { fieldKey: 'blade_size', fieldLabel: 'Blade Size', unit: 'mm', fieldType: SpecFieldType.text },
          { fieldKey: 'motor_power', fieldLabel: 'Motor Power', unit: 'HP', fieldType: SpecFieldType.number },
          { fieldKey: 'type', fieldLabel: 'Type', fieldType: SpecFieldType.select, options: ['Horizontal', 'Vertical'] },
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
          { fieldKey: 'tonnage', fieldLabel: 'Tonnage', unit: 'ton', fieldType: SpecFieldType.number, isFilterable: true, filterType: SpecFilterType.range },
          { fieldKey: 'stroke_length', fieldLabel: 'Stroke Length', unit: 'mm', fieldType: SpecFieldType.number },
          { fieldKey: 'bed_size', fieldLabel: 'Bed Size', unit: 'mm', fieldType: SpecFieldType.text },
          { fieldKey: 'shut_height', fieldLabel: 'Shut Height', unit: 'mm', fieldType: SpecFieldType.number },
          { fieldKey: 'strokes_min', fieldLabel: 'Strokes Per Minute', unit: 'spm', fieldType: SpecFieldType.number },
          { fieldKey: 'press_type', fieldLabel: 'Press Type', fieldType: SpecFieldType.select, options: ['C-frame', 'H-frame', 'Pillar', 'Pneumatic'] },
        ],
      },
      {
        name: 'Hydraulic Press',
        slug: 'hydraulic-press',
        description: 'Hydraulic presses',
        specFields: [
          { fieldKey: 'tonnage', fieldLabel: 'Tonnage', unit: 'ton', fieldType: SpecFieldType.number, isFilterable: true, filterType: SpecFilterType.range },
          { fieldKey: 'daylight', fieldLabel: 'Daylight', unit: 'mm', fieldType: SpecFieldType.number },
          { fieldKey: 'stroke', fieldLabel: 'Stroke', unit: 'mm', fieldType: SpecFieldType.number },
          { fieldKey: 'bed_size', fieldLabel: 'Bed Size', unit: 'mm', fieldType: SpecFieldType.text },
          { fieldKey: 'ram_speed', fieldLabel: 'Ram Speed', unit: 'mm/s', fieldType: SpecFieldType.number },
        ],
      },
      {
        name: 'Press Brake',
        slug: 'press-brake',
        description: 'CNC and hydraulic press brakes',
        specFields: [
          { fieldKey: 'tonnage', fieldLabel: 'Tonnage', unit: 'ton', fieldType: SpecFieldType.number, isFilterable: true, filterType: SpecFilterType.range },
          { fieldKey: 'bending_length', fieldLabel: 'Bending Length', unit: 'mm', fieldType: SpecFieldType.number, isFilterable: true, filterType: SpecFilterType.range },
          { fieldKey: 'stroke', fieldLabel: 'Stroke', unit: 'mm', fieldType: SpecFieldType.number },
          { fieldKey: 'throat_depth', fieldLabel: 'Throat Depth', unit: 'mm', fieldType: SpecFieldType.number },
          { fieldKey: 'control', fieldLabel: 'Control', fieldType: SpecFieldType.text },
        ],
      },
      {
        name: 'Shearing Machine',
        slug: 'shearing-machine',
        description: 'Plate and sheet shearing machines',
        specFields: [
          { fieldKey: 'cutting_length', fieldLabel: 'Cutting Length', unit: 'mm', fieldType: SpecFieldType.number, isFilterable: true, filterType: SpecFilterType.range },
          { fieldKey: 'cutting_thickness', fieldLabel: 'Max Cutting Thickness', unit: 'mm', fieldType: SpecFieldType.number, isFilterable: true, filterType: SpecFilterType.range },
          { fieldKey: 'type', fieldLabel: 'Type', fieldType: SpecFieldType.select, options: ['Hydraulic', 'Mechanical'] },
        ],
      },
      {
        name: 'Rolling Machine',
        slug: 'rolling-machine',
        description: 'Plate and section rolling machines',
        specFields: [
          { fieldKey: 'roll_length', fieldLabel: 'Roll Length', unit: 'mm', fieldType: SpecFieldType.number, isFilterable: true, filterType: SpecFilterType.range },
          { fieldKey: 'roll_dia', fieldLabel: 'Roll Diameter', unit: 'mm', fieldType: SpecFieldType.number },
          { fieldKey: 'max_thickness', fieldLabel: 'Max Plate Thickness', unit: 'mm', fieldType: SpecFieldType.number, isFilterable: true, filterType: SpecFilterType.range },
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
          { fieldKey: 'clamping_force', fieldLabel: 'Clamping Force', unit: 'ton', fieldType: SpecFieldType.number, isFilterable: true, filterType: SpecFilterType.range },
          { fieldKey: 'shot_weight', fieldLabel: 'Shot Weight', unit: 'gram', fieldType: SpecFieldType.number, isFilterable: true, filterType: SpecFilterType.range },
          { fieldKey: 'screw_dia', fieldLabel: 'Screw Diameter', unit: 'mm', fieldType: SpecFieldType.number },
          { fieldKey: 'tie_bar_dist', fieldLabel: 'Tie Bar Distance', unit: 'mm', fieldType: SpecFieldType.text },
          { fieldKey: 'platen_size', fieldLabel: 'Platen Size', unit: 'mm', fieldType: SpecFieldType.text },
          { fieldKey: 'injection_pressure', fieldLabel: 'Injection Pressure', unit: 'bar', fieldType: SpecFieldType.number },
          { fieldKey: 'control', fieldLabel: 'Control System', fieldType: SpecFieldType.select, options: ['Microprocessor', 'PLC', 'Servo', 'Hydraulic'] },
        ],
      },
      {
        name: 'Blow Moulding',
        slug: 'blow-moulding',
        description: 'Blow moulding machines',
        specFields: [
          { fieldKey: 'clamping_force', fieldLabel: 'Clamping Force', unit: 'ton', fieldType: SpecFieldType.number, isFilterable: true, filterType: SpecFilterType.range },
          { fieldKey: 'max_volume', fieldLabel: 'Max Container Volume', unit: 'litre', fieldType: SpecFieldType.number, isFilterable: true, filterType: SpecFilterType.range },
          { fieldKey: 'screw_dia', fieldLabel: 'Screw Diameter', unit: 'mm', fieldType: SpecFieldType.number },
          { fieldKey: 'station_type', fieldLabel: 'Station Type', fieldType: SpecFieldType.select, options: ['Single', 'Double'] },
        ],
      },
      {
        name: 'Die Casting',
        slug: 'die-casting',
        description: 'Die casting machines',
        specFields: [
          { fieldKey: 'clamping_force', fieldLabel: 'Clamping Force', unit: 'ton', fieldType: SpecFieldType.number, isFilterable: true, filterType: SpecFilterType.range },
          { fieldKey: 'shot_weight', fieldLabel: 'Max Shot Weight', unit: 'gram', fieldType: SpecFieldType.number },
          { fieldKey: 'platen_size', fieldLabel: 'Platen Size', unit: 'mm', fieldType: SpecFieldType.text },
          { fieldKey: 'type', fieldLabel: 'Type', fieldType: SpecFieldType.select, options: ['Hot Chamber', 'Cold Chamber'] },
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
        await prisma.categorySpecTemplate.upsert({
          where: { categoryId_fieldKey: { categoryId: dbCat.id, fieldKey: field.fieldKey } },
          update: {
            fieldLabel: field.fieldLabel,
            unit: field.unit ?? null,
            fieldType: field.fieldType,
            options: field.options ?? [],
            isRequired: field.isRequired ?? false,
            isFilterable: field.isFilterable ?? false,
            filterType: field.filterType ?? SpecFilterType.none,
            displayOrder: fieldOrder,
          },
          create: {
            categoryId: dbCat.id,
            fieldKey: field.fieldKey,
            fieldLabel: field.fieldLabel,
            unit: field.unit ?? null,
            fieldType: field.fieldType,
            options: field.options ?? [],
            isRequired: field.isRequired ?? false,
            isFilterable: field.isFilterable ?? false,
            filterType: field.filterType ?? SpecFilterType.none,
            displayOrder: fieldOrder,
          },
        });
        fieldOrder++;
      }
    }
  }
  console.log(`Seeded ${CATALOG.length} groups, ${CATALOG.flatMap((g) => g.categories).length} categories`);
}

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/** Seeds the 10 INDUSTRY_CATEGORIES as browse-level DB categories with their subcategories. */
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
