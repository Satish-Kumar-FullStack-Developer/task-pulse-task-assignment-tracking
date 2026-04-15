import axios from 'axios';

const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const api = axios.create({
  baseURL: apiUrl,
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'APPROVED' | 'RETURNED';
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  creatorId: string;
  assigneeId: string;
  creator: { id: string; name: string; email: string };
  assignee: { id: string; name: string; email: string };
  dueDate?: string;
  startedAt?: string;
  completedAt?: string;
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
  timeLogs: TimeLog[];
  comments: Comment[];
}

export interface TimeLog {
  id: string;
  taskId: string;
  userId: string;
  startTime: string;
  endTime?: string;
  duration?: number;
  createdAt: string;
}

export interface Comment {
  id: string;
  taskId: string;
  authorId: string;
  author: { id: string; name: string; role: 'MANAGER' | 'EMPLOYEE' };
  content: string;
  isSystem: boolean;
  createdAt: string;
}

export interface Notification {
  id: string;
  type: 'TASK_ASSIGNED' | 'TASK_STARTED' | 'TASK_COMPLETED' | 'TASK_RETURNED' | 'COMMENT_ADDED';
  message: string;
  taskId?: string;
  read: boolean;
  createdAt: string;
}

// Task APIs
export const getTasks = () => api.get<Task[]>('/tasks');
export const getTaskDetail = (taskId: string) => api.get<Task>(`/tasks/${taskId}`);
export const createTask = (data: any) => api.post<Task>('/tasks', data);
export const updateTaskStatus = (taskId: string, status: string, returnReason?: string) =>
  api.patch<Task>(`/tasks/${taskId}/status`, { status, returnReason });

// Timer APIs
export const startTimer = (taskId: string) => api.post(`/tasks/${taskId}/timer/start`, {});
export const pauseTimer = (taskId: string, timeLogId: string) =>
  api.post(`/tasks/${taskId}/timer/pause`, { timeLogId });
export const getTimeLogs = (taskId: string) => api.get(`/tasks/${taskId}/timeLogs`);

// Comment APIs
export const getComments = (taskId: string) => api.get<Comment[]>(`/comments/${taskId}`);
export const addComment = (taskId: string, content: string) =>
  api.post<Comment>('/comments', { taskId, content });

// Notification APIs
export const getNotifications = (limit?: number) =>
  api.get<Notification[]>('/notifications', { params: { limit } });
export const getUnreadCount = () => api.get<{ count: number }>('/notifications/count/unread');
export const markAsRead = (notificationId: string) =>
  api.patch(`/notifications/${notificationId}/read`, {});
export const markAllAsRead = () => api.patch('/notifications/read/all', {});

// User APIs
export const getEmployees = () => api.get('/users/employees');
export const getCurrentUser = () => api.get('/users/me');
