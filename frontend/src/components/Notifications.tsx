import React from 'react';
import { Link } from 'react-router-dom';
import { useNotifications } from '../context/NotificationsContext';

const Notifications: React.FC = () => {
  const {
    notifications,
    clearNotifications,
    markNotificationAsRead,
  } = useNotifications();

  const unreadNotifications = notifications.filter(n => !n.read);

  if (!unreadNotifications.length) {
    return null;
  }

  return (
    <div className="floating-notifications">
      {unreadNotifications.map(notification => {
        return (
          <div
            key={notification.id}
            className="notification-card"
          >
            <div className="notification-header">
              <h4 className="notification-title">{notification.title}</h4>
              <button
                className="notification-close"
                onClick={() => markNotificationAsRead(notification.id)}
                aria-label="Закрыть уведомление"
              >
                ×
              </button>
            </div>

            <p className="notification-body">
              {notification.message}
            </p>

            <div className="notification-actions">
              {notification.bookId && (
                <Link className="notification-link" to={`/book/${notification.bookId}`}>
                  Посмотреть книгу
                </Link>
              )}
              <button className="notification-btn" onClick={clearNotifications}>
                Закрыть все
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default Notifications;
