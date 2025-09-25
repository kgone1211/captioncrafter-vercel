'use client';

import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Info, AlertTriangle, X } from 'lucide-react';

export type NotificationType = 'success' | 'error' | 'info' | 'warning';

interface NotificationToastProps {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  duration?: number;
  onClose: (id: string) => void;
}

export default function NotificationToast({
  id,
  type,
  title,
  message,
  duration = 5000,
  onClose,
}: NotificationToastProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Trigger animation
    const timer = setTimeout(() => setIsVisible(true), 100);
    
    // Auto-close after duration
    const autoCloseTimer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => onClose(id), 300); // Wait for animation
    }, duration);

    return () => {
      clearTimeout(timer);
      clearTimeout(autoCloseTimer);
    };
  }, [id, duration, onClose]);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'info':
      default:
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  const getBackgroundColor = () => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      case 'info':
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => onClose(id), 300);
  };

  return (
    <div
      className={`
        fixed top-4 right-4 z-50 max-w-sm w-full mx-4
        transform transition-all duration-300 ease-in-out
        ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
      `}
    >
      <div className={`
        ${getBackgroundColor()}
        border rounded-lg shadow-lg p-4
        backdrop-blur-sm bg-opacity-95
      `}>
        <div className="flex items-start space-x-3">
          {getIcon()}
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-medium text-gray-900">{title}</h4>
            <p className="text-sm text-gray-600 mt-1">{message}</p>
          </div>
          <button
            onClick={handleClose}
            className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// Notification Manager Hook
export function useNotifications() {
  const [notifications, setNotifications] = useState<Array<{
    id: string;
    type: NotificationType;
    title: string;
    message: string;
    duration?: number;
  }>>([]);

  const addNotification = (
    type: NotificationType,
    title: string,
    message: string,
    duration?: number
  ) => {
    const id = Math.random().toString(36).substr(2, 9);
    setNotifications(prev => [...prev, { id, type, title, message, duration }]);
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };

  const showSuccess = (title: string, message: string, duration?: number) => {
    addNotification('success', title, message, duration);
  };

  const showError = (title: string, message: string, duration?: number) => {
    addNotification('error', title, message, duration);
  };

  const showInfo = (title: string, message: string, duration?: number) => {
    addNotification('info', title, message, duration);
  };

  const showWarning = (title: string, message: string, duration?: number) => {
    addNotification('warning', title, message, duration);
  };

  return {
    notifications,
    addNotification,
    removeNotification,
    showSuccess,
    showError,
    showInfo,
    showWarning,
  };
}
