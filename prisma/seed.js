import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Delete all existing records

  // Create seed data

  // Temporary check: list users
  const users = await prisma.user.findMany();
  console.log('Users in DB:', users);

  console.log('Database has been seeded!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
