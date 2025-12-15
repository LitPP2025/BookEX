import React, { createContext, useContext, ReactNode } from 'react';
import { useSocket } from '../hooks/useSocket';

type Notification = {
  id: string | number;
  title: string;
  message: string;
  bookId?: number;
  type?: string;
  status?: string;
  read?: boolean;
};

interface NotificationsContextValue {
  notifications: Notification[];
  unreadCount: number;
  clearNotifications: () => void;
  markNotificationAsRead: (id: string | number) => void;
  getIsUserOnline: (userId: string) => boolean;
}

const NotificationsContext = createContext<NotificationsContextValue | undefined>(undefined);

export const NotificationsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const {
    notifications,
    clearNotifications,
    markNotificationAsRead,
    getIsUserOnline,
  } = useSocket();

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <NotificationsContext.Provider
      value={{
        notifications,
        unreadCount,
        clearNotifications,
        markNotificationAsRead,
        getIsUserOnline,
      }}
    >
      {children}
    </NotificationsContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationsProvider');
  }
  return context;
};
