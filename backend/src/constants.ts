export const CONFIG = {
  PORT: process.env.PORT || 3001,
  NODE_ENV: process.env.NODE_ENV || 'development',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',
};

export const JWT = {
  TOKEN_EXPIRY: '24h',
  REFRESH_TOKEN_EXPIRY: '7d',
  SECRET: process.env.JWT_SECRET || 'your_jwt_secret_key_change_in_production',
  REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'your_jwt_refresh_secret_key_change_in_production',
};

export const WHATSAPP = {
  PROVIDER: process.env.WHATSAPP_PROVIDER || 'msg91',
  MSG91_AUTH_KEY: process.env.MSG91_AUTH_KEY,
  MSG91_ROUTE: process.env.MSG91_ROUTE || '1',
  GUPSHUP_API_KEY: process.env.GUPSHUP_API_KEY,
  GUPSHUP_APP_NAME: process.env.GUPSHUP_APP_NAME,
};

export const USER_ROLES = {
  MANAGER: 'MANAGER',
  EMPLOYEE: 'EMPLOYEE',
};

export const TASK_STATUS = {
  PENDING: 'PENDING',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  APPROVED: 'APPROVED',
  RETURNED: 'RETURNED',
};

export const TASK_PRIORITY = {
  CRITICAL: 'CRITICAL',
  HIGH: 'HIGH',
  MEDIUM: 'MEDIUM',
  LOW: 'LOW',
};

export const NOTIFICATION_TYPE = {
  TASK_ASSIGNED: 'TASK_ASSIGNED',
  TASK_STARTED: 'TASK_STARTED',
  TASK_COMPLETED: 'TASK_COMPLETED',
  TASK_RETURNED: 'TASK_RETURNED',
  COMMENT_ADDED: 'COMMENT_ADDED',
  TASK_APPROVED: 'TASK_APPROVED',
};

export const NOTIFICATION_CHANNEL = {
  IN_APP: 'IN_APP',
  WHATSAPP: 'WHATSAPP',
};

export const DELIVERY_STATUS = {
  PENDING: 'PENDING',
  SENT: 'SENT',
  DELIVERED: 'DELIVERED',
  READ: 'READ',
  FAILED: 'FAILED',
};

export const TEST_USERS = {
  MANAGER_1: {
    email: 'manager1@test.com',
    password: 'password123',
    name: 'Rajesh Gupta',
    phone: '+919876543210',
  },
  MANAGER_2: {
    email: 'manager2@test.com',
    password: 'password123',
    name: 'Anita Sharma',
    phone: '+919876543211',
  },
  EMPLOYEE_1: {
    email: 'employee1@test.com',
    password: 'password123',
    name: 'Vikram Patel',
    phone: '+919876543220',
  },
  EMPLOYEE_2: {
    email: 'employee2@test.com',
    password: 'password123',
    name: 'Priya Singh',
    phone: '+919876543221',
  },
  EMPLOYEE_3: {
    email: 'employee3@test.com',
    password: 'password123',
    name: 'Arjun Mehta',
    phone: '+919876543222',
  },
};

export const API_RESPONSES = {
  TITLE_REQUIRED: 'Title and assignee required',
  ASSIGNEE_MUST_BE_EMPLOYEE: 'Assignee must be an employee',
  TASK_NOT_FOUND: 'Task not found',
  ACCESS_DENIED: 'Access denied',
  USER_NOT_FOUND: 'User not found',
  INVALID_CREDENTIALS: 'Invalid credentials',
  INVALID_TOKEN: 'Invalid token',
  NO_TOKEN: 'No token provided',
  ONLY_MANAGERS_CAN_CREATE: 'Only managers can create tasks',
  ONLY_MANAGERS_CAN_APPROVE: 'Only managers can approve or return tasks',
  ONLY_EMPLOYEES_CAN_ASSIGN: 'Only the assigned employee can start this task',
};
