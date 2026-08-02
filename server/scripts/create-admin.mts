import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const USERNAME = 'sanju';
const PASSWORD = 'sanju';
const FULL_NAME = 'Sanju';
const EMAIL = 'sanju@gmail.com';
const MOBILE = '0000000000';

async function main() {
  const company = await prisma.company.findFirst();
  if (!company) {
    throw new Error('No company found. Run the seed first (npm run db:seed).');
  }

  const superAdminGroup = await prisma.userGroup.findUnique({
    where: { companyId_groupName: { companyId: company.id, groupName: 'Super Admin' } },
  });
  if (!superAdminGroup) {
    throw new Error('Super Admin user group not found. Run the seed first (npm run db:seed).');
  }

  const passwordHash = await bcrypt.hash(PASSWORD, 10);

  const user = await prisma.user.upsert({
    where: { username: USERNAME },
    update: { passwordHash, userGroupId: superAdminGroup.id, isActive: true, deletedAt: null },
    create: {
      companyId: company.id,
      userGroupId: superAdminGroup.id,
      fullName: FULL_NAME,
      username: USERNAME,
      email: EMAIL,
      mobile: MOBILE,
      passwordHash,
      isActive: true,
    },
  });

  console.log(`Super Admin ready: ${user.username} (id: ${user.id})`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
