export interface User {
  id: number;
  email: string;
  username: string;
  full_name: string | null;
  city: string | null;
  about: string | null;
  created_at: string;
}

export interface UserBasic {
  id: number;
  username: string;
  city: string | null;
}

export interface Book {
  id: number;
  title: string;
  author: string;
  description: string | null;
  genre: string | null;
  condition: string | null;
  cover: string | null;
  cover_url?: string | null;
  owner_id: number;
  owner: UserBasic; // Добавляем владельца
  status: string;
  created_at: string;
  updated_at: string | null;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  refresh_token: string;
  user: User;
}

export interface Exchange {
  id: number;
  book_id: number;
  requester_id: number;
  owner_id: number;
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled';
  created_at: string;
  updated_at?: string;
  book?: Book;
  requester?: User;
  owner?: User;
}

export interface ExchangeResponse extends Exchange {
  book: Book;
  requester: User;
  owner: User;
}

export interface ChatThread {
  id: number;
  partner: UserBasic;
  last_message: string | null;
  last_message_at: string | null;
  unread_count: number;
}

export interface ChatMessage {
  id: number;
  thread_id: number;
  sender_id: number;
  content: string;
  created_at: string;
  is_read: boolean;
}
