export function formatDate(date: string | Date) {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatTime(date: string | Date) {
  return new Date(date).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatDateTime(date: string | Date) {
  return new Date(date).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatDuration(seconds: number) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m ${secs}s`;
}

export function isOverdue(dueDate: string | undefined) {
  if (!dueDate) return false;
  return new Date(dueDate) < new Date() && new Date(dueDate) > new Date(0);
}

export function getStatusColor(status: string) {
  const colors: Record<string, string> = {
    PENDING: 'bg-gray-100 text-gray-800',
    IN_PROGRESS: 'bg-blue-100 text-blue-800',
    COMPLETED: 'bg-yellow-100 text-yellow-800',
    APPROVED: 'bg-green-100 text-green-800',
    RETURNED: 'bg-red-100 text-red-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
}

export function getPriorityColor(priority: string) {
  const colors: Record<string, string> = {
    CRITICAL: 'bg-danger-50 text-danger-800',
    HIGH: 'bg-warning-50 text-warning-800',
    MEDIUM: 'bg-primary-100 text-primary-800',
    LOW: 'bg-gray-100 text-gray-800',
  };
  return colors[priority] || 'bg-gray-100 text-gray-800';
}
