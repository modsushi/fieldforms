import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create test organization
  const org = await prisma.organization.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      name: 'Test Organization',
      subscriptionTier: 'pro',
    },
  });

  console.log('✅ Created organization:', org.name);

  // Hash password
  const hashedPassword = await bcrypt.hash('password', 10);

  // Create supervisor user
  const supervisor = await prisma.user.upsert({
    where: { email: 'admin@test.com' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000002',
      orgId: org.id,
      email: 'admin@test.com',
      name: 'Supervisor User',
      password: hashedPassword,
      role: 'SUPERVISOR',
    },
  });

  console.log('✅ Created supervisor:', supervisor.email);

  // Create operator user
  const operator = await prisma.user.upsert({
    where: { email: 'operator@test.com' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000003',
      orgId: org.id,
      email: 'operator@test.com',
      name: 'Operator User',
      password: hashedPassword,
      role: 'OPERATOR',
    },
  });

  console.log('✅ Created operator:', operator.email);
  
  console.log('\n🎉 Seed completed!\n');
  console.log('You can now sign in with:');
  console.log('  Supervisor - Email: admin@test.com, Password: password');
  console.log('  Operator - Email: operator@test.com, Password: password\n');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

