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
  status: string;
  priority: string;
  creatorId: string;
  assigneeId: string;
  creator: any;
  assignee: any;
  dueDate?: string;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
  timeLogs: any[];
  comments: any[];
}

export interface TimeLog {
  id: string;
  startTime: string;
  endTime?: string;
  duration?: number;
}

export interface Comment {
  id: string;
  content: string;
  author: any;
  createdAt: string;
}

export interface Notification {
  id: string;
  message: string;
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
