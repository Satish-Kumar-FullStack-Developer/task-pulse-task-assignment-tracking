import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getTaskDetail, updateTaskStatus, startTimer, pauseTimer, getTimeLogs, getComments, addComment } from '../utils/api';
import { Task, TimeLog, Comment } from '../utils/api';
import { formatDate, formatDateTime, formatDuration, getStatusColor, getPriorityColor } from '../utils/formatters';
import { Alert, Button, Textarea } from '../components/Form';
import { ChevronLeft, Clock, MessageCircle } from 'lucide-react';
import { useTaskUpdates } from '../hooks/useWebSocket';
import { TASK_STATUS } from '../constants';

export default const TaskDetailPage = () => {
  const { taskId } = useParams<{ taskId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [task, setTask] = useState<Task | null>(null);
  const [timeLogs, setTimeLogs] = useState<TimeLog[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [totalTime, setTotalTime] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newComment, setNewComment] = useState('');
  const [returnReason, setReturnReason] = useState('');
  const [activeTimerId, setActiveTimerId] = useState<string | null>(null);

  const updates = useTaskUpdates(taskId || '');

  useEffect(() => {
    loadTask();
    const interval = setInterval(updateElapsedTime, 1000);
    return () => clearInterval(interval);
  }, [taskId]);

  useEffect(() => {
    if (updates?.type === 'timerStarted') {
      loadTask();
    }
  }, [updates]);

  const loadTask = async () => {
    if (!taskId) return;
    try {
      const response = await getTaskDetail(taskId);
      setTask(response.data);

      const commentsRes = await getComments(taskId);
      setComments(commentsRes.data);

      const timeLogsRes = await getTimeLogs(taskId);
      setTimeLogs(timeLogsRes.data.timeLogs);
      setTotalTime(timeLogsRes.data.totalTime);
      setElapsedTime(timeLogsRes.data.elapsedTime);

      // Find active timer
      const active = timeLogsRes.data.timeLogs.find((log: any) => !log.endTime);
      setActiveTimerId(active?.id || null);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load task');
    } finally {
      setLoading(false);
    }
  };

  const updateElapsedTime = () => {
    if (activeTimerId) {
      setElapsedTime((prev) => prev + 1);
    }
  };

  const handleStartTimer = async () => {
    if (!taskId) return;
    try {
      await startTimer(taskId);
      loadTask();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to start timer');
    }
  };

  const handlePauseTimer = async () => {
    if (!taskId || !activeTimerId) return;
    try {
      await pauseTimer(taskId, activeTimerId);
      setActiveTimerId(null);
      loadTask();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to pause timer');
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!taskId || !task) return;
    try {
      await updateTaskStatus(taskId, newStatus, newStatus === 'RETURNED' ? returnReason : undefined);
      setReturnReason('');
      loadTask();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update task');
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskId || !newComment.trim()) return;

    try {
      await addComment(taskId, newComment);
      setNewComment('');
      loadTask();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to add comment');
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading task...</div>;
  }

  if (!task) {
    return <Alert type="error">Task not found</Alert>;
  }

  const canEdit = user?.id === task.creatorId || user?.id === task.assigneeId;
  const isAssignee = user?.id === task.assigneeId;
  const isCreator = user?.id === task.creatorId;

  return (
    <div>
      {/* Header */}
      <button onClick={() => navigate('/')} className="flex items-center gap-2 text-primary-600 hover:text-primary-700 mb-6">
        <ChevronLeft className="w-4 h-4" />
        Back to Tasks
      </button>

      {error && <Alert type="error" className="mb-6">{error}</Alert>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Task Header */}
          <div className="card p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h1 className="text-3xl font-bold">{task.title}</h1>
                <p className="text-gray-600 mt-2">{task.description}</p>
              </div>
              <div className="flex gap-2">
                <span className={`badge ${getStatusColor(task.status)}`}>{task.status.replace('_', ' ')}</span>
                <span className={`badge ${getPriorityColor(task.priority)}`}>{task.priority}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Created by</p>
                <p className="font-medium">{task.creator.name}</p>
              </div>
              <div>
                <p className="text-gray-600">Assigned to</p>
                <p className="font-medium">{task.assignee.name}</p>
              </div>
              {task.dueDate && (
                <div>
                  <p className="text-gray-600">Due Date</p>
                  <p className="font-medium">{formatDate(task.dueDate)}</p>
                </div>
              )}
              {task.completedAt && (
                <div>
                  <p className="text-gray-600">Completed</p>
                  <p className="font-medium">{formatDateTime(task.completedAt)}</p>
                </div>
              )}
            </div>
          </div>

          {/* Timer Section */}
          {task.status === TASK_STATUS.IN_PROGRESS && (
            <div className="card p-6 bg-blue-50 border-blue-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Clock className="w-6 h-6 text-primary-600" />
                  <div>
                    <p className="text-sm text-gray-600">Elapsed Time</p>
                    <p className="text-3xl font-bold font-mono">{formatDuration(elapsedTime)}</p>
                  </div>
                </div>
                <div>
                  {activeTimerId ? (
                    <Button variant="danger" onClick={handlePauseTimer}>
                      Pause Timer
                    </Button>
                  ) : (
                    <Button variant="primary" onClick={handleStartTimer}>
                      Start Timer
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Status Actions */}
          {isAssignee && task.status === TASK_STATUS.PENDING && (
            <Button variant="primary" onClick={() => handleStatusChange(TASK_STATUS.IN_PROGRESS)} className="w-full">
              Start Task
            </Button>
          )}

          {isAssignee && task.status === TASK_STATUS.IN_PROGRESS && (
            <Button variant="primary" onClick={() => handleStatusChange(TASK_STATUS.COMPLETED)} className="w-full">
              Mark Complete
            </Button>
          )}

          {isCreator && task.status === TASK_STATUS.COMPLETED && (
            <div className="space-y-4 card p-6">
              <div>
                <label className="block text-sm font-medium mb-2">Approve or Return?</label>
                <div className="flex gap-2">
                  <Button variant="primary" onClick={() => handleStatusChange(TASK_STATUS.APPROVED)} className="flex-1">
                    Approve
                  </Button>
                  <Button variant="danger" onClick={async () => {
                    if (returnReason) await handleStatusChange(TASK_STATUS.RETURNED);
                  }} className="flex-1">
                    Return
                  </Button>
                </div>
              </div>

              {task.status === TASK_STATUS.COMPLETED && (
                <Textarea
                  label="Return Reason (if returning)"
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  placeholder="Explain why this task is being returned..."
                />
              )}
            </div>
          )}

          {/* Comments Section */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              Comments ({comments.length})
            </h2>

            <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
              {comments.map((comment) => (
                <div key={comment.id} className="border-l-2 border-primary-200 pl-4">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium text-sm">{comment.author.name}</p>
                    <span className="text-xs bg-gray-100 px-2 py-1 rounded">{comment.author.role}</span>
                    {comment.isSystem && <span className="text-xs text-gray-600">[System]</span>}
                  </div>
                  <p className="text-gray-600 text-sm mt-1">{comment.content}</p>
                  <p className="text-gray-400 text-xs mt-2">{formatDateTime(comment.createdAt)}</p>
                </div>
              ))}
            </div>

            {canEdit && (
              <form onSubmit={handleAddComment} className="border-t pt-4">
                <Textarea
                  placeholder="Add a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  rows={3}
                />
                <Button type="submit" variant="primary">
                  Post Comment
                </Button>
              </form>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Time Log */}
          <div className="card p-4">
            <h3 className="font-semibold mb-4">Time Log</h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {timeLogs.length === 0 ? (
                <p className="text-gray-600 text-sm">No time entries yet</p>
              ) : (
                timeLogs.map((log) => (
                  <div key={log.id} className="text-sm border-b pb-2">
                    <div className="flex justify-between">
                      <span>{formatDate(log.startTime)}</span>
                      <span className="font-medium">{log.duration ? formatDuration(log.duration) : 'Running'}</span>
                    </div>
                  </div>
                ))
              )}
              {timeLogs.length > 0 && (
                <div className="pt-2 border-t font-semibold flex justify-between">
                  <span>Total:</span>
                  <span>{formatDuration(totalTime)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Info */}
          <div className="card p-4 text-sm text-gray-600">
            <p>Created: {formatDateTime(task.createdAt)}</p>
            <p>Updated: {formatDateTime(task.updatedAt)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
