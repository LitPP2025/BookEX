// frontend/src/components/ExchangeStatus.tsx
import React from 'react';

interface ExchangeStatusProps {
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled' | 'exchanged';
}

const ExchangeStatus: React.FC<ExchangeStatusProps> = ({ status }) => {
  const getStatusInfo = () => {
    switch (status) {
      case 'pending':
        return { text: 'Ожидает подтверждения', color: '#f59e0b', bg: '#fef3c7' };
      case 'accepted':
        return { text: 'Принято', color: '#059669', bg: '#d1fae5' };
      case 'rejected':
        return { text: 'Отклонено', color: '#dc2626', bg: '#fee2e2' };
      case 'cancelled':
        return { text: 'Отменено', color: '#6b7280', bg: '#f3f4f6' };
      case 'exchanged':
        return { text: 'Обменено', color: '#059669', bg: '#d1fae5' };
      default:
        return { text: 'Неизвестно', color: '#6b7280', bg: '#f3f4f6' };
    }
  };

  const { text, color, bg } = getStatusInfo();

  return (
    <span style={{ 
      display: 'inline-block',
      padding: '0.25rem 0.75rem',
      borderRadius: '9999px',
      fontSize: '0.75rem',
      fontWeight: '500',
      color: color,
      backgroundColor: bg
    }}>
      {text}
    </span>
  );
};

export default ExchangeStatus;