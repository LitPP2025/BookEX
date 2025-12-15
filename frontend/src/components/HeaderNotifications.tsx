import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, CheckCircle, XCircle } from 'react-feather';
import { useNotifications } from '../context/NotificationsContext';

const HeaderNotifications: React.FC = () => {
  const { notifications, unreadCount, markNotificationAsRead, clearNotifications } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isOpen && containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isOpen]);

  const handleToggle = (event: React.MouseEvent) => {
    event.stopPropagation();
    setIsOpen(prev => !prev);
  };

  const renderIcon = (notification: typeof notifications[number]) => {
    if (notification.status === 'accepted') {
      return <CheckCircle size={16} color="#059669" />;
    }
    if (notification.status === 'rejected') {
      return <XCircle size={16} color="#ef4444" />;
    }
    return <Bell size={16} color="#4f46e5" />;
  };

  const shortList = notifications.slice(0, 4);

  return (
    <div className="header-notifications" ref={containerRef}>
      <button className="notification-trigger" onClick={handleToggle}>
        <Bell size={18} />
        {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
      </button>

      {isOpen && (
        <div className="notification-dropdown">
          <div className="notification-dropdown-header">
            <span>Уведомления</span>
            {notifications.length > 0 && (
              <button className="notification-clear" onClick={() => clearNotifications()}>
                Очистить
              </button>
            )}
          </div>

          {notifications.length === 0 && (
            <div className="notification-dropdown-empty">Новых уведомлений нет</div>
          )}

          {shortList.map(notification => {
            const content = (
              <>
                <div className="notification-icon">
                  {renderIcon(notification)}
                </div>
                <div>
                  <p className="notification-dropdown-title">{notification.title}</p>
                  <p className="notification-dropdown-text">{notification.message}</p>
                </div>
              </>
            );

            const handleSelect = () => {
              markNotificationAsRead(notification.id);
              setIsOpen(false);
            };

            if (notification.bookId) {
              return (
                <Link
                  key={notification.id}
                  to={`/book/${notification.bookId}`}
                  className="notification-dropdown-item"
                  onClick={handleSelect}
                >
                  {content}
                </Link>
              );
            }

            return (
              <button
                key={notification.id}
                className="notification-dropdown-item notification-dropdown-button"
                type="button"
                onClick={handleSelect}
              >
                {content}
              </button>
            );
          })}
          {notifications.length > shortList.length && (
            <div className="notification-dropdown-footer">
              <button
                className="notification-dropdown-cta"
                onClick={() => setIsOpen(false)}
              >
                Показать все
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default HeaderNotifications;
