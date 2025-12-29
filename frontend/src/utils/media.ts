import { API_BASE_URL } from '../config';
import { Book } from '../types';

const ensureAbsoluteUrl = (input?: string | null) => {
  if (!input) return null;
  if (/^https?:\/\//i.test(input)) {
    return input;
  }

  const normalizedPath = input.startsWith('/') ? input : `/${input}`;

  if (/^https?:\/\//i.test(API_BASE_URL)) {
    const base = API_BASE_URL.replace(/\/$/, '');
    return `${base}${normalizedPath}`;
  }

  // API_BASE_URL относительный (например, "/api"), возвращаем путь без добавления базового URL
  return normalizedPath;
};

export const getCoverUrl = (cover?: string | null, coverUrl?: string | null) => {
  const normalizedCoverUrl = ensureAbsoluteUrl(coverUrl);
  if (normalizedCoverUrl) return normalizedCoverUrl;

  if (!cover) return null;
  return ensureAbsoluteUrl(`/media/${cover.startsWith('/') ? cover.slice(1) : cover}`);
};

export const resolveBookCover = (book: Pick<Book, 'cover' | 'cover_url'>) =>
  getCoverUrl(book.cover, book.cover_url);
