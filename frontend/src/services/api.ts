import axios from 'axios';
import { AuthResponse, Book, User, Exchange, ExchangeResponse, ChatThread, ChatMessage } from '../types';
import { API_BASE_URL } from '../config';

const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authAPI = {
  register: (userData: {
    email: string;
    username: string;
    password: string;
    full_name?: string;
    city?: string;
    about?: string;
  }) => api.post<AuthResponse>('/auth/register', userData),

  login: (username: string, password: string) => {
    const formData = new FormData();
    formData.append('username', username);
    formData.append('password', password);
    return api.post<AuthResponse>('/auth/login', formData);
  },
  refresh: (payload: { refresh_token: string }) => api.post<AuthResponse>('/auth/refresh', payload),
  updateProfile: (data: { full_name?: string | null; city?: string | null; about?: string | null }) =>
    api.put<User>('/auth/profile', data),
};

export interface PaginatedResponse<T> {
  books: T[];
  total_count: number;
  total_pages: number;
  current_page: number;
  limit: number;
}

export const exchangesAPI = {
  createExchange: (exchangeData: any) => api.post<ExchangeResponse>('/exchanges/', exchangeData),
  getMyExchanges: () => api.get<Exchange[]>(`/exchanges/my-requests`),
  getMyOffers: () => api.get<Exchange[]>(`/exchanges/my-offers`),
  acceptExchange: (exchangeId: number) => api.put<ExchangeResponse>(`/exchanges/${exchangeId}/accept`),
  rejectExchange: (exchangeId: number) => api.put<ExchangeResponse>(`/exchanges/${exchangeId}/reject`),
  cancelExchange: (exchangeId: number) => api.delete(`/exchanges/${exchangeId}/cancel`),
};

export const booksAPI = {
  getBooks: (params?: {
    page?: number;
    limit?: number;
    genre?: string;
    condition?: string;
    search?: string;
  }) => api.get<PaginatedResponse<Book>>('/books/', { params }),
  getMyBooks: () => api.get<Book[]>('/books/my-books'),
  getBook: (id: number) => api.get<Book>(`/books/${id}`),
  createBook: (formData: FormData) => api.post<Book>('/books/', formData),
  updateBook: (id: number, formData: FormData) => api.put<Book>(`/books/${id}`, formData),
  deleteBook: (id: number) => api.delete(`/books/${id}`),
  getUserProfile: (userId: number) => api.get<User>(`/auth/profile/${userId}`),
  getUserBooks: (userId: number) => api.get<Book[]>(`/auth/profile/${userId}/books`),
};

export const chatAPI = {
  getThreads: () => api.get<ChatThread[]>('/chat/threads'),
  createThread: (partnerId: number) => api.post<ChatThread>('/chat/threads', { partner_id: partnerId }),
  createThreadByUsername: (username: string) =>
    api.post<ChatThread>('/chat/threads/by-username', { username }),
  createThreadByBook: (bookId: number) =>
    api.post<ChatThread>('/chat/threads/by-book', { book_id: bookId }),
  getMessages: (threadId: number, limit = 50) =>
    api.get<ChatMessage[]>(`/chat/threads/${threadId}/messages`, { params: { limit } }),
  sendMessage: (threadId: number, content: string) =>
    api.post<ChatMessage>(`/chat/threads/${threadId}/messages`, { content }),
};

export default api;
