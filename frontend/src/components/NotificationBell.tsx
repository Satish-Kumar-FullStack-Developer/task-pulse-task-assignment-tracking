import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getUnreadCount, markAllAsRead } from '../utils/api';
import { useWebSocket } from '../hooks/useWebSocket';
import { Bell, X } from 'lucide-react';

const NotificationBell = () => {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [showPanel, setShowPanel] = useState(false);
  const { socket } = useWebSocket();

  useEffect(() => {
    fetchUnreadCount();

    if (socket) {
      socket.on('notification:created', () => {
        fetchUnreadCount();
      });

      return () => {
        socket.off('notification:created');
      };
    }
  }, [socket]);

  const fetchUnreadCount = async () => {
    try {
      const response = await getUnreadCount();
      setUnreadCount(response.data.count);
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
      setUnreadCount(0);
      setShowPanel(false);
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowPanel(!showPanel)}
        className="relative p-2 text-gray-600 hover:text-gray-900"
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 w-5 h-5 bg-danger-600 text-white text-xs rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {showPanel && (
        <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <div className="p-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="font-semibold">Notifications</h3>
            <button
              onClick={() => setShowPanel(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {unreadCount === 0 ? (
              <div className="p-4 text-center text-gray-500">
                No unread notifications
              </div>
            ) : (
              <div>
                <div className="p-4 text-sm text-gray-600">
                  {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
                </div>
                <button
                  onClick={handleMarkAllAsRead}
                  className="w-full p-4 text-primary-600 hover:bg-gray-50 text-center border-t border-gray-200"
                >
                  Mark all as read
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default NotificationBell;
