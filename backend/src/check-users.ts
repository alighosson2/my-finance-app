import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkUsers() {
  try {
    // Use 'users' (plural) to match your Prisma model name
    const allUsers = await prisma.users.findMany();
    console.log('All users:', allUsers);

    const user1 = await prisma.users.findUnique({ 
      where: { id: 1 } 
    });
    console.log('User with ID=1:', user1);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();