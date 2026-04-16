import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { TEST_USERS, USER_ROLES, TASK_STATUS, TASK_PRIORITY } from './constants';

const prisma = new PrismaClient();

const castUserRole = (role: string) => role as any;
const castTaskStatus = (status: string) => status as any;
const castTaskPriority = (priority: string) => priority as any;

async function main() {
  await prisma.deliveryLog.deleteMany();
  await prisma.activityLog.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.timeLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.task.deleteMany();
  await prisma.user.deleteMany();

  const manager1 = await prisma.user.create({
    data: {
      name: TEST_USERS.MANAGER_1.name,
      email: TEST_USERS.MANAGER_1.email,
      passwordHash: await bcrypt.hash(TEST_USERS.MANAGER_1.password, 10),
      role: castUserRole(USER_ROLES.MANAGER),
      phone: TEST_USERS.MANAGER_1.phone,
    },
  });

  const manager2 = await prisma.user.create({
    data: {
      name: TEST_USERS.MANAGER_2.name,
      email: TEST_USERS.MANAGER_2.email,
      passwordHash: await bcrypt.hash(TEST_USERS.MANAGER_2.password, 10),
      role: castUserRole(USER_ROLES.MANAGER),
      phone: TEST_USERS.MANAGER_2.phone,
    },
  });

  const employee1 = await prisma.user.create({
    data: {
      name: TEST_USERS.EMPLOYEE_1.name,
      email: TEST_USERS.EMPLOYEE_1.email,
      passwordHash: await bcrypt.hash(TEST_USERS.EMPLOYEE_1.password, 10),
      role: castUserRole(USER_ROLES.EMPLOYEE),
      managerId: manager1.id,
      phone: TEST_USERS.EMPLOYEE_1.phone,
    },
  });

  const employee2 = await prisma.user.create({
    data: {
      name: TEST_USERS.EMPLOYEE_2.name,
      email: TEST_USERS.EMPLOYEE_2.email,
      passwordHash: await bcrypt.hash(TEST_USERS.EMPLOYEE_2.password, 10),
      role: castUserRole(USER_ROLES.EMPLOYEE),
      managerId: manager1.id,
      phone: TEST_USERS.EMPLOYEE_2.phone,
    },
  });

  const employee3 = await prisma.user.create({
    data: {
      name: TEST_USERS.EMPLOYEE_3.name,
      email: TEST_USERS.EMPLOYEE_3.email,
      passwordHash: await bcrypt.hash(TEST_USERS.EMPLOYEE_3.password, 10),
      role: castUserRole(USER_ROLES.EMPLOYEE),
      managerId: manager2.id,
      phone: TEST_USERS.EMPLOYEE_3.phone,
    },
  });

  const task1 = await prisma.task.create({
    data: {
      title: 'Client Meeting Notes',
      description: 'Compile and organize notes from today\'s client meetings',
      status: castTaskStatus(TASK_STATUS.PENDING),
      priority: castTaskPriority(TASK_PRIORITY.HIGH),
      creatorId: manager1.id,
      assigneeId: employee1.id,
      dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    },
  });

  const task2 = await prisma.task.create({
    data: {
      title: 'Project Documentation',
      description: 'Update project documentation with latest features',
      status: castTaskStatus(TASK_STATUS.PENDING),
      priority: castTaskPriority(TASK_PRIORITY.MEDIUM),
      creatorId: manager1.id,
      assigneeId: employee2.id,
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    },
  });

  const task3 = await prisma.task.create({
    data: {
      title: 'Financial Report',
      description: 'Prepare quarterly financial report',
      status: castTaskStatus(TASK_STATUS.IN_PROGRESS),
      priority: castTaskPriority(TASK_PRIORITY.HIGH),
      creatorId: manager2.id,
      assigneeId: employee3.id,
      dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
      startedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    },
  });

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
    },
  });
}

main()
  .catch((e) => {
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
