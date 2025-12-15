import io, { Socket } from 'socket.io-client';
import { SOCKET_BASE_URL } from '../config';

let socket: Socket | null = null;
const SOCKET_URL = SOCKET_BASE_URL;

export const initSocket = () => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      path: '/ws/socket.io',
      transports: ['websocket'],
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
    
    // Обработчики ошибок и событий
    socket.on('connect_error', (error) => {
      console.error('Ошибка подключения к вебсокетам:', error);
    });
    
    socket.on('disconnect', (reason) => {
      console.log('Вебсокет отключен. Причина:', reason);
      if (reason === 'io server disconnect') {
        socket?.connect();
      }
    });
  }
  return socket;
};

export const connectSocket = async (token: string) => {
  const socket = initSocket();

  if (!socket.connected) {
    try {
      // Правильная передача токена
      socket.io.opts.query = { token };
      
      return new Promise<void>((resolve, reject) => {
        socket.on('connect_error', (error) => {
          reject(new Error('Ошибка подключения к вебсокетам'));
        });
        
        socket.on('auth_success', () => {
          resolve();
        });
        
        socket.on('auth_error', (error) => {
          reject(new Error(error.error || 'Ошибка аутентификации вебсокетов'));
        });
        
        socket.connect();
      });
    } catch (error) {
      console.error('❌ Ошибка подключения к вебсокетам:', error);
      throw error;
    }
  }
  return Promise.resolve();
};

export const disconnectSocket = () => {
  if (socket?.connected) {
    socket.disconnect();
  }
  socket = null;
};

export const setupExchangeNotifications = (callback: (exchange: any) => void) => {
  const socket = initSocket();
  
  socket.on('new_exchanges', (data: { exchanges: any[] }) => {
    console.log('Получены новые предложения обмена:', data);
    data.exchanges.forEach(callback);
  });
  
  return () => {
    socket.off('new_exchanges');
  };
};

export const setupExchangeStatusUpdates = (callback: (update: any) => void) => {
  const socket = initSocket();
  
  socket.on('exchange_status_update', (data: any) => {
    console.log('Обновление статуса обмена:', data);
    callback(data);
  });
  
  return () => {
    socket.off('exchange_status_update');
  };
};

export const setupUserStatus = (callback: (data: { user_id: string; isOnline: boolean }) => void) => {
  const socket = initSocket();
  
  socket.on('user_online', (data: { user_id: string }) => {
    callback({ user_id: data.user_id, isOnline: true });
  });
  
  socket.on('user_offline', (data: { user_id: string }) => {
    callback({ user_id: data.user_id, isOnline: false });
  });
  
  return () => {
    socket.off('user_online');
    socket.off('user_offline');
  };
};

export const setupChatMessages = (callback: (data: any) => void) => {
  const socket = initSocket();
  socket.on('chat_message', callback);
  return () => {
    socket.off('chat_message', callback);
  };
};
