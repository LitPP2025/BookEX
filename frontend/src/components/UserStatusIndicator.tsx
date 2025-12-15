import React from 'react';
import { useSocket } from '../hooks/useSocket';

interface UserStatusIndicatorProps {
  userId: string | number;
  size?: number;
  showTooltip?: boolean;
}

const UserStatusIndicator: React.FC<UserStatusIndicatorProps> = ({ 
  userId, 
  size = 10, 
  showTooltip = true 
}) => {
  const { getIsUserOnline } = useSocket();
  const isOnline = getIsUserOnline(userId.toString());

  return (
    <div 
      style={{ 
        position: 'relative', 
        display: 'inline-flex', 
        alignItems: 'center',
        justifyContent: 'center'
      }}
      title={showTooltip ? (isOnline ? 'Онлайн' : 'Офлайн') : undefined}
    >
      <div style={{ 
        width: `${size}px`, 
        height: `${size}px`, 
        borderRadius: '50%', 
        backgroundColor: isOnline ? '#10B981' : '#94a3b8',
        border: '2px solid white',
        boxShadow: '0 0 0 1px rgba(0, 0, 0, 0.1)',
        transition: 'all 0.3s ease'
      }}></div>
    </div>
  );
};

export default UserStatusIndicator;