import { API_BASE_URL } from '../config';
import { Book } from '../types';

const ensureAbsoluteUrl = (input?: string | null) => {
  if (!input) return null;
  if (/^https?:\/\//i.test(input)) {
    return input;
  }
  const base = API_BASE_URL.replace(/\/$/, '');
  const path = input.startsWith('/') ? input : `/${input}`;
  return `${base}${path}`;
};

export const getCoverUrl = (cover?: string | null, coverUrl?: string | null) => {
  const normalizedCoverUrl = ensureAbsoluteUrl(coverUrl);
  if (normalizedCoverUrl) return normalizedCoverUrl;

  if (!cover) return null;
  return ensureAbsoluteUrl(`/media/${cover.startsWith('/') ? cover.slice(1) : cover}`);
};

export const resolveBookCover = (book: Pick<Book, 'cover' | 'cover_url'>) =>
  getCoverUrl(book.cover, book.cover_url);
