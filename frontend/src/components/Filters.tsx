import React from 'react';

interface FiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  selectedGenre: string;
  onGenreChange: (value: string) => void;
  selectedCondition: string;
  onConditionChange: (value: string) => void;
}

const Filters: React.FC<FiltersProps> = ({
  search,
  onSearchChange,
  selectedGenre,
  onGenreChange,
  selectedCondition,
  onConditionChange,
}) => {
  const genres = [
    'Фантастика', 'Фэнтези', 'Детектив', 'Роман', 'Триллер', 
    'Биография', 'История', 'Наука', 'Классика', 'Детская литература'
  ];

  return (
    <div className="filters-card">
      <h3>Фильтры поиска</h3>
      
      {/* Поиск по названию и автору */}
      <div className="form-group">
        <label className="form-label">Поиск по книгам</label>
        <input
          type="text"
          className="form-input"
          placeholder="Название, автор или описание..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      {/* Фильтр по жанру */}
      <div className="form-group">
        <label className="form-label">Жанр</label>
        <select
          className="form-select"
          value={selectedGenre}
          onChange={(e) => onGenreChange(e.target.value)}
        >
          <option value="">Все жанры</option>
          {genres.map(genre => (
            <option key={genre} value={genre}>{genre}</option>
          ))}
        </select>
      </div>

      {/* Фильтр по состоянию */}
      <div className="form-group">
        <label className="form-label">Состояние</label>
        <select
          className="form-select"
          value={selectedCondition}
          onChange={(e) => onConditionChange(e.target.value)}
        >
          <option value="">Любое состояние</option>
          <option value="excellent">Отличное</option>
          <option value="good">Хорошее</option>
          <option value="satisfactory">Удовлетворительное</option>
        </select>
      </div>
    </div>
  );
};

export default Filters;