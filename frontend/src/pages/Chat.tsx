import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { chatAPI } from '../services/api';
import { ChatThread, ChatMessage } from '../types';
import { useAuth } from '../context/AuthContext';
import { setupChatMessages } from '../services/socket';
import { useNotifications } from '../context/NotificationsContext';

const Chat: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { getIsUserOnline } = useNotifications();

  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [activeThread, setActiveThread] = useState<ChatThread | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [loadingThreads, setLoadingThreads] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [error, setError] = useState('');
  const [newChatUsername, setNewChatUsername] = useState('');
  const [isStartingChat, setIsStartingChat] = useState(false);
  const [startChatError, setStartChatError] = useState('');
  const [requestedThreadId, setRequestedThreadId] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const fetchThreads = useCallback(async () => {
    setLoadingThreads(true);
    try {
      const response = await chatAPI.getThreads();
      setThreads(response.data);
      setActiveThread(prev => {
        if (prev) {
          return response.data.find(thread => thread.id === prev.id) ?? prev;
        }
        return response.data[0] ?? null;
      });
    } catch (err) {
      console.error('Не удалось загрузить чаты', err);
      setError('Не удалось загрузить список чатов.');
    } finally {
      setLoadingThreads(false);
    }
  }, []);

  const fetchMessages = useCallback(async (threadId: number) => {
    setLoadingMessages(true);
    try {
      const response = await chatAPI.getMessages(threadId);
      setMessages(response.data);
      setThreads(prev =>
        prev.map(thread =>
          thread.id === threadId ? { ...thread, unread_count: 0 } : thread
        )
      );
    } catch (err) {
      console.error('Не удалось загрузить сообщения', err);
      setError('Не удалось загрузить сообщения.');
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  const startThreadWithPartner = useCallback(
    async (partnerId: number) => {
      if (!user) return;
      if (partnerId === user.id) {
        const existing = threads.find(thread => thread.partner.id === partnerId);
        if (existing) {
          setActiveThread(existing);
        }
        return;
      }
      try {
        const response = await chatAPI.createThread(partnerId);
        await fetchThreads();
        setActiveThread(response.data);
        setError('');
      } catch (err: any) {
        console.error('Не удалось открыть чат', err);
        try {
          const threadsResponse = await chatAPI.getThreads();
          setThreads(threadsResponse.data);
          const existing = threadsResponse.data.find(thread => thread.partner.id === partnerId);
          if (existing) {
            setActiveThread(existing);
            setError('');
            return;
          }
        } catch (fetchErr) {
          console.error('Не удалось обновить список чатов', fetchErr);
        }
        const detail = err?.response?.data?.detail;
        setError(detail || 'Не удалось открыть чат с выбранным пользователем.');
      }
    },
    [fetchThreads, threads, user]
  );

  useEffect(() => {
    if (user) {
      fetchThreads();
    }
  }, [user, fetchThreads]);

  const activeThreadId = activeThread?.id;

  useEffect(() => {
    if (activeThreadId) {
      fetchMessages(activeThreadId);
    } else {
      setMessages([]);
    }
  }, [activeThreadId, fetchMessages]);

  useEffect(() => {
    if (!user) return;
    const params = new URLSearchParams(location.search);
    const threadParam = params.get('thread');
    const partnerParam = params.get('user');

    if (threadParam) {
      const threadId = Number(threadParam);
      if (!Number.isNaN(threadId)) {
        setRequestedThreadId(threadId);
        if (!threads.some(thread => thread.id === threadId)) {
          fetchThreads();
        }
      }
    }

    if (partnerParam) {
      const partnerId = Number(partnerParam);
      if (!Number.isNaN(partnerId)) {
        const existing = threads.find(thread => thread.partner.id === partnerId);
        if (existing) {
          setActiveThread(existing);
        } else {
          startThreadWithPartner(partnerId);
        }
      }
    }
  }, [location.search, threads, user, startThreadWithPartner, fetchThreads]);

  useEffect(() => {
    if (!requestedThreadId) return;
    const existing = threads.find(thread => thread.id === requestedThreadId);
    if (existing) {
      setActiveThread(existing);
      setRequestedThreadId(null);
    }
  }, [requestedThreadId, threads]);

  const handleIncomingMessage = useCallback(
    (payload: any) => {
      if (!payload?.message) return;
      const { thread_id, message, meta } = payload;
      const normalizedThreadId = Number(thread_id);
      if (Number.isNaN(normalizedThreadId)) return;

      const activeId = activeThread?.id ?? null;

      setThreads(prev => {
        let found = false;
        const updated = prev.map(thread => {
          if (thread.id === normalizedThreadId) {
            found = true;
            const isActive = activeId === normalizedThreadId;
            const isOwnMessage = message.sender_id === user?.id;
            return {
              ...thread,
              last_message: meta?.last_message ?? message.content,
              last_message_at: meta?.last_message_at ?? message.created_at,
              unread_count: isActive || isOwnMessage ? 0 : thread.unread_count + 1,
            };
          }
          return thread;
        });
        if (!found) {
          fetchThreads();
        }
        return updated;
      });

      if (activeId === normalizedThreadId) {
        setMessages(prev => (prev.some(item => item.id === message.id) ? prev : [...prev, message]));
      }
    },
    [activeThread?.id, user?.id, fetchThreads]
  );

  useEffect(() => {
    if (!user) return;
    const cleanup = setupChatMessages(handleIncomingMessage);
    return () => cleanup();
  }, [handleIncomingMessage, user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeThread || !messageInput.trim()) return;
    try {
      const response = await chatAPI.sendMessage(activeThread.id, messageInput.trim());
      setMessages(prev => [...prev, response.data]);
      setMessageInput('');
      setThreads(prev =>
        prev.map(thread =>
          thread.id === activeThread.id
            ? {
                ...thread,
                last_message: response.data.content,
                last_message_at: response.data.created_at,
                unread_count: 0,
              }
            : thread
        )
      );
    } catch (err) {
      console.error('Не удалось отправить сообщение', err);
      setError('Не удалось отправить сообщение.');
    }
  };

  const handleStartChatByUsername = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChatUsername.trim()) {
      setStartChatError('Введите имя пользователя');
      return;
    }
    setIsStartingChat(true);
    setStartChatError('');
    try {
      const response = await chatAPI.createThreadByUsername(newChatUsername.trim());
      setNewChatUsername('');
      await fetchThreads();
      setActiveThread(response.data);
    } catch (err: any) {
      setStartChatError(err.response?.data?.detail || 'Не удалось создать диалог');
    } finally {
      setIsStartingChat(false);
    }
  };

  if (!user) {
    return (
      <div className="container">
        <div className="card text-center" style={{ padding: '3rem' }}>
          <h3>Только для авторизованных пользователей</h3>
          <p>Авторизуйтесь, чтобы использовать чат.</p>
          <button className="btn btn-primary" onClick={() => navigate('/login')}>
            Войти
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="hero">
        <h1>Чат</h1>
        <p>Общайтесь с другими читателями и обсуждайте обмены</p>
      </div>

      <div className="chat-wrapper card">
        <div className="chat-sidebar">
          <div>
            <div className="chat-sidebar-header">
              <h3>Диалоги</h3>
              <span>{threads.length}</span>
            </div>
            <form className="chat-new-thread" onSubmit={handleStartChatByUsername}>
              <label>
                Начать чат по логину
                <input
                  type="text"
                  placeholder="Например, test42"
                  value={newChatUsername}
                  onChange={e => setNewChatUsername(e.target.value)}
                />
              </label>
              {startChatError && <span className="chat-new-thread-error">{startChatError}</span>}
              <button type="submit" className="btn btn-secondary" disabled={isStartingChat}>
                {isStartingChat ? 'Создание…' : 'Начать'}
              </button>
            </form>
          </div>
          {loadingThreads ? (
            <div className="chat-empty">Загрузка диалогов...</div>
          ) : threads.length === 0 ? (
            <div className="chat-empty">
              <p>Пока что диалогов нет</p>
              <button className="btn btn-primary" onClick={() => navigate('/')}>
                Найти книгу
              </button>
            </div>
          ) : (
            <div className="chat-threads">
              {threads.map(thread => (
                <button
                  key={thread.id}
                  className={`chat-thread ${activeThread?.id === thread.id ? 'active' : ''}`}
                  onClick={() => setActiveThread(thread)}
                >
                  <div className="chat-thread-header">
                    <div>
                      <p className="chat-thread-name">{thread.partner.username}</p>
                      <span className={`chat-status-dot ${getIsUserOnline(String(thread.partner.id)) ? 'online' : ''}`} />
                    </div>
                    <span className="chat-thread-time">
                      {thread.last_message_at
                        ? new Date(thread.last_message_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
                        : ''}
                    </span>
                  </div>
                  <p className="chat-thread-preview">
                    {thread.last_message ? thread.last_message : 'Сообщений пока нет'}
                  </p>
                  {thread.unread_count > 0 && <span className="chat-thread-unread">{thread.unread_count}</span>}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="chat-content">
          {!activeThread ? (
            <div className="chat-empty">
              <p>Выберите диалог, чтобы начать общение</p>
            </div>
          ) : (
            <>
              <div className="chat-content-header">
                <div>
                  <h3>{activeThread.partner.username}</h3>
                  <span className="chat-content-status">
                    {getIsUserOnline(String(activeThread.partner.id)) ? 'онлайн' : 'офлайн'}
                  </span>
                </div>
              </div>
              <div className="chat-messages">
                {loadingMessages ? (
                  <div className="chat-empty">Загрузка сообщений...</div>
                ) : (
                  <>
                    {messages.map(message => (
                      <div
                        key={message.id}
                        className={`chat-message ${message.sender_id === user.id ? 'mine' : ''}`}
                      >
                        <div className="chat-message-content">{message.content}</div>
                        <span className="chat-message-time">
                          {new Date(message.created_at).toLocaleTimeString('ru-RU', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>
              <form className="chat-input" onSubmit={handleSendMessage}>
                <textarea
                  rows={2}
                  placeholder="Введите сообщение..."
                  value={messageInput}
                  onChange={e => setMessageInput(e.target.value)}
                />
                <button type="submit" className="btn btn-primary">
                  Отправить
                </button>
              </form>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="chat-error">
          {error}
          <button onClick={() => setError('')}>&times;</button>
        </div>
      )}
    </div>
  );
};

export default Chat;
