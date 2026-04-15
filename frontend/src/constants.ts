export const CONFIG = {
  API_URL: import.meta.env.VITE_API_URL || 'http://localhost:3001',
  WS_URL: import.meta.env.VITE_WS_URL || 'ws://localhost:3001',
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

export const LOCAL_STORAGE = {
  TOKEN: 'token',
  USER: 'user',
};

export const PAGINATION = {
  DEFAULT_LIMIT: 20,
};

export const VALIDATION = {
  MIN_COMMENT_LENGTH: 1,
  MAX_COMMENT_LENGTH: 1000,
};

export const ERROR_MESSAGES = {
  LOGIN_FAILED: 'Login failed',
  FETCH_FAILED: 'Failed to fetch',
  NETWORK_ERROR: 'Network error occurred',
  UNKNOWN_ERROR: 'An unknown error occurred',
};

export const SUCCESS_MESSAGES = {
  TASK_CREATED: 'Task created successfully',
  TASK_UPDATED: 'Task updated successfully',
  LOGIN_SUCCESS: 'Logged in successfully',
};

export const TEST_CREDENTIALS = {
  MANAGER_EMAIL: 'manager1@test.com',
  MANAGER_PASSWORD: 'password123',
  EMPLOYEE_EMAIL: 'employee1@test.com',
  EMPLOYEE_PASSWORD: 'password123',
};
