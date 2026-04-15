import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Clear existing data
  await prisma.deliveryLog.deleteMany();
  await prisma.activityLog.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.timeLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.task.deleteMany();
  await prisma.user.deleteMany();

  // Create managers
  const manager1 = await prisma.user.create({
    data: {
      name: 'Rajesh Gupta',
      email: 'manager1@test.com',
      passwordHash: await bcrypt.hash('password123', 10),
      role: 'MANAGER',
      phone: '+919876543210',
    },
  });

  const manager2 = await prisma.user.create({
    data: {
      name: 'Anita Sharma',
      email: 'manager2@test.com',
      passwordHash: await bcrypt.hash('password123', 10),
      role: 'MANAGER',
      phone: '+919876543211',
    },
  });

  // Create employees
  const employee1 = await prisma.user.create({
    data: {
      name: 'Vikram Patel',
      email: 'employee1@test.com',
      passwordHash: await bcrypt.hash('password123', 10),
      role: 'EMPLOYEE',
      managerId: manager1.id,
      phone: '+919876543220',
    },
  });

  const employee2 = await prisma.user.create({
    data: {
      name: 'Priya Singh',
      email: 'employee2@test.com',
      passwordHash: await bcrypt.hash('password123', 10),
      role: 'EMPLOYEE',
      managerId: manager1.id,
      phone: '+919876543221',
    },
  });

  const employee3 = await prisma.user.create({
    data: {
      name: 'Arjun Mehta',
      email: 'employee3@test.com',
      passwordHash: await bcrypt.hash('password123', 10),
      role: 'EMPLOYEE',
      managerId: manager2.id,
      phone: '+919876543222',
    },
  });

  // Create sample tasks
  const task1 = await prisma.task.create({
    data: {
      title: 'Client Meeting Notes',
      description: 'Compile and organize notes from today\'s client meetings',
      status: 'PENDING',
      priority: 'HIGH',
      creatorId: manager1.id,
      assigneeId: employee1.id,
      dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
    },
  });

  const task2 = await prisma.task.create({
    data: {
      title: 'Project Documentation',
      description: 'Update project documentation with latest features',
      status: 'PENDING',
      priority: 'MEDIUM',
      creatorId: manager1.id,
      assigneeId: employee2.id,
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    },
  });

  const task3 = await prisma.task.create({
    data: {
      title: 'Financial Report',
      description: 'Prepare quarterly financial report',
      status: 'IN_PROGRESS',
      priority: 'CRITICAL',
      creatorId: manager2.id,
      assigneeId: employee3.id,
      dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
      startedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // Started 2 hours ago
    },
  });

  // Create sample comments
  await prisma.comment.create({
    data: {
      taskId: task1.id,
      authorId: manager1.id,
      content: 'Please focus on client feedback about the new feature. Thanks!',
    },
  });

  await prisma.comment.create({
    data: {
      taskId: task1.id,
      authorId: employee1.id,
      content: 'Got it! I\'ll prioritize client feedback. Should be done by EOD.',
    },
  });

  // Create sample time logs
  await prisma.timeLog.create({
    data: {
      taskId: task3.id,
      userId: employee3.id,
      startTime: new Date(Date.now() - 2 * 60 * 60 * 1000),
      endTime: new Date(Date.now() - 1.5 * 60 * 60 * 1000),
      duration: 30 * 60, // 30 minutes
    },
  });

  await prisma.timeLog.create({
    data: {
      taskId: task3.id,
      userId: employee3.id,
      startTime: new Date(Date.now() - 1.5 * 60 * 60 * 1000),
      endTime: new Date(Date.now() - 1 * 60 * 60 * 1000),
      duration: 30 * 60, // 30 minutes
    },
  });

  await prisma.timeLog.create({
    data: {
      taskId: task3.id,
      userId: employee3.id,
      startTime: new Date(Date.now() - 1 * 60 * 60 * 1000),
      // Still running - no endTime
    },
  });

  console.log('✅ Database seeded successfully');
  console.log('\n📋 Test Users Created:');
  console.log('Managers:');
  console.log(`  • manager1@test.com / password123 (Rajesh Gupta)`);
  console.log(`  • manager2@test.com / password123 (Anita Sharma)`);
  console.log('\nEmployees:');
  console.log(`  • employee1@test.com / password123 (Vikram Patel) - managed by manager1`);
  console.log(`  • employee2@test.com / password123 (Priya Singh) - managed by manager1`);
  console.log(`  • employee3@test.com / password123 (Arjun Mehta) - managed by manager2`);
}

main()
  .catch((e) => {
    console.error('Seed script error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
