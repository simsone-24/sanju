import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { ModuleName, PERMISSION_CATALOG, PermissionAction } from '../src/modules/permissions/catalog';

const prisma = new PrismaClient();

// Starter user groups. masters/user.md replaces hardcoded roles with groups an administrator
// creates freely — these five only exist so a fresh install has something to log in with and a
// worked example of the sample groups in the doc (§Sample User Groups). None of them is special to
// the code: every one can be renamed, re-permissioned or deleted from the Masters screen.
const GROUP_NAMES = ['Super Admin', 'Manager', 'Sales Executive', 'Event Coordinator', 'Accountant'] as const;
type GroupName = (typeof GROUP_NAMES)[number];

type PermissionSpec = PermissionAction[] | 'All' | 'No Access';

const PERMISSION_MATRIX: Record<ModuleName, Record<GroupName, PermissionSpec>> = {
  DASHBOARD: {
    'Super Admin': 'All',
    Manager: ['canView'],
    'Sales Executive': ['canView'],
    'Event Coordinator': ['canView'],
    Accountant: ['canView'],
  },
  ENQUIRIES: {
    'Super Admin': 'All',
    Manager: 'All',
    'Sales Executive': ['canView', 'canCreate', 'canEdit', 'canAssign', 'canChangeStatus', 'canExport'],
    'Event Coordinator': ['canView'],
    Accountant: ['canView'],
  },
  QUOTATIONS: {
    'Super Admin': 'All',
    Manager: 'All',
    'Sales Executive': ['canView', 'canCreate', 'canEdit', 'canPrint', 'canExport'],
    'Event Coordinator': ['canView'],
    Accountant: ['canView'],
  },
  ORDERS: {
    'Super Admin': 'All',
    Manager: 'All',
    'Sales Executive': ['canView'],
    'Event Coordinator': ['canView', 'canEdit', 'canCompleteEvent'],
    Accountant: ['canView'],
  },
  PLANNING: {
    'Super Admin': 'All',
    Manager: 'All',
    'Sales Executive': ['canView'],
    'Event Coordinator': 'All',
    Accountant: ['canView'],
  },
  PAYMENTS: {
    'Super Admin': 'All',
    Manager: ['canView', 'canExport'],
    'Sales Executive': ['canView'],
    'Event Coordinator': ['canView'],
    // user.md §Accountant — Payment Tracker is this group's working area.
    Accountant: 'All',
  },
  CUSTOMERS: {
    'Super Admin': 'All',
    Manager: 'All',
    'Sales Executive': ['canView', 'canExport'],
    'Event Coordinator': ['canView'],
    Accountant: ['canView'],
  },
  CALENDAR: {
    'Super Admin': 'All',
    Manager: 'All',
    'Sales Executive': ['canView'],
    'Event Coordinator': ['canView'],
    Accountant: ['canView'],
  },
  // "md files/Stock/stock.md" — rent is a back-office stock workflow, not a sales one. Managers run
  // it end to end, the Event Coordinator issues and books back stock without the right to delete or
  // cancel a transaction, and the Accountant sees it for the money side.
  RENT: {
    'Super Admin': 'All',
    Manager: 'All',
    'Sales Executive': 'No Access',
    'Event Coordinator': ['canView', 'canCreate', 'canEdit', 'canPrint'],
    Accountant: ['canView', 'canCreate', 'canExport'],
  },
  REPORTS: {
    'Super Admin': 'All',
    Manager: 'All',
    'Sales Executive': ['canView'],
    'Event Coordinator': ['canView'],
    Accountant: ['canView', 'canExport'],
  },
  MASTERS: {
    'Super Admin': 'All',
    Manager: ['canView', 'canCreate', 'canEdit'],
    'Sales Executive': 'No Access',
    'Event Coordinator': 'No Access',
    Accountant: 'No Access',
  },
  SETTINGS: {
    'Super Admin': 'All',
    Manager: 'No Access',
    'Sales Executive': 'No Access',
    'Event Coordinator': 'No Access',
    Accountant: 'No Access',
  },
};

function resolvePermissions(module: ModuleName, spec: PermissionSpec): PermissionAction[] {
  const available = PERMISSION_CATALOG.find((entry) => entry.module === module)?.actions.map(
    (action) => action.key,
  ) ?? [];

  if (spec === 'No Access') return [];
  if (spec === 'All') return available;
  // A group can never be seeded with an action its module does not define.
  return spec.filter((action) => available.includes(action));
}

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var ${name}. Set it in server/.env before running the seed.`);
  }
  return value;
}

async function main() {
  const companyName = requiredEnv('SEED_COMPANY_NAME');
  const adminName = requiredEnv('SEED_ADMIN_NAME');
  const adminUsername = requiredEnv('SEED_ADMIN_USERNAME').trim().toLowerCase();
  const adminPassword = requiredEnv('SEED_ADMIN_PASSWORD');
  const adminMobile = requiredEnv('SEED_ADMIN_MOBILE');
  const adminEmail = process.env.SEED_ADMIN_EMAIL || null;

  let company = await prisma.company.findFirst();
  if (!company) {
    company = await prisma.company.create({ data: { companyName, status: 'ACTIVE' } });
    console.log(`Created company: ${company.companyName}`);
  } else {
    console.log(`Using existing company: ${company.companyName}`);
  }

  const groupIdByName: Record<GroupName, number> = {} as Record<GroupName, number>;

  for (const groupName of GROUP_NAMES) {
    const group = await prisma.userGroup.upsert({
      where: { companyId_groupName: { companyId: company.id, groupName } },
      update: {},
      create: { companyId: company.id, groupName, status: 'ACTIVE' },
    });
    groupIdByName[groupName] = group.id;

    for (const module of Object.keys(PERMISSION_MATRIX) as ModuleName[]) {
      for (const action of resolvePermissions(module, PERMISSION_MATRIX[module][groupName])) {
        await prisma.userGroupPermission.upsert({
          where: {
            userGroupId_module_action: { userGroupId: group.id, module, action },
          },
          update: {},
          create: { userGroupId: group.id, module, action },
        });
      }
    }

    console.log(`Seeded user group + permissions: ${groupName}`);
  }

  const existingAdmin = await prisma.user.findUnique({ where: { username: adminUsername } });
  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash(adminPassword, 10);
    await prisma.user.create({
      data: {
        companyId: company.id,
        userGroupId: groupIdByName['Super Admin'],
        fullName: adminName,
        username: adminUsername,
        email: adminEmail,
        mobile: adminMobile,
        passwordHash,
        isActive: true,
      },
    });
    console.log(`Created Super Admin user: ${adminUsername}`);
  } else {
    console.log(`Super Admin user already exists: ${adminUsername}`);
  }

  console.log('Seed complete.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
