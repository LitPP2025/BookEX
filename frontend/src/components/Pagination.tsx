import React from 'react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  totalCount,
  onPageChange,
}) => {
  // Функция для генерации массива номеров страниц для отображения
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    // Корректируем startPage, если endPage достиг максимума
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    return pages;
  };

  if (totalPages <= 1) return null;

  const pageNumbers = getPageNumbers();

  return (
    <div className="pagination">
      <div className="pagination-info">
        Показано {(currentPage - 1) * 10 + 1}-{Math.min(currentPage * 10, totalCount)} из {totalCount} книг
      </div>
      
      <div className="pagination-controls">
        {/* Кнопка "Назад" */}
        <button
          className={`pagination-btn ${currentPage === 1 ? 'disabled' : ''}`}
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          ← Назад
        </button>

        {/* Первая страница */}
        {pageNumbers[0] > 1 && (
          <>
            <button
              className={`pagination-btn ${currentPage === 1 ? 'active' : ''}`}
              onClick={() => onPageChange(1)}
            >
              1
            </button>
            {pageNumbers[0] > 2 && <span className="pagination-ellipsis">...</span>}
          </>
        )}

        {/* Номера страниц */}
        {pageNumbers.map(page => (
          <button
            key={page}
            className={`pagination-btn ${currentPage === page ? 'active' : ''}`}
            onClick={() => onPageChange(page)}
          >
            {page}
          </button>
        ))}

        {/* Последняя страница */}
        {pageNumbers[pageNumbers.length - 1] < totalPages && (
          <>
            {pageNumbers[pageNumbers.length - 1] < totalPages - 1 && (
              <span className="pagination-ellipsis">...</span>
            )}
            <button
              className={`pagination-btn ${currentPage === totalPages ? 'active' : ''}`}
              onClick={() => onPageChange(totalPages)}
            >
              {totalPages}
            </button>
          </>
        )}

        {/* Кнопка "Вперед" */}
        <button
          className={`pagination-btn ${currentPage === totalPages ? 'disabled' : ''}`}
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          Вперед →
        </button>
      </div>
    </div>
  );
};

export default Pagination;