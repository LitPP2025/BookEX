export const translateCondition = (condition: string | null): string => {
  if (!condition) return 'Не указано';
  
  const translations: { [key: string]: string } = {
    'excellent': 'Отличное',
    'good': 'Хорошее',
    'satisfactory': 'Удовлетворительное',
    'available': 'Доступна',
    'exchanged': 'Обменена',
    'reserved': 'Забронирована'
  };
  
  return translations[condition] || condition;
};

export const translateGenre = (genre: string | null): string => {
  if (!genre) return 'Не указан';
  
  const translations: { [key: string]: string } = {
    'fantasy': 'Фэнтези',
    'science_fiction': 'Научная фантастика',
    'mystery': 'Детектив',
    'romance': 'Роман',
    'thriller': 'Триллер',
    'biography': 'Биография',
    'history': 'История',
    'science': 'Наука',
    'classic': 'Классика',
    'children': 'Детская литература'
  };
  
  return translations[genre] || genre;
};

export const translateStatus = (status: string | null): string => {
  if (!status) return 'Не указано';
  const translations: { [key: string]: string } = {
    'pending': 'Ожидает подтверждения',
    'accepted': 'Принято',
    'rejected': 'Отклонено',
    'cancelled': 'Отменено',
    'exchanged': 'Обменено',
    'available': 'Доступна для обмена'
  };
  return translations[status] || status;
};