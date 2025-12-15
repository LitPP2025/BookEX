import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { booksAPI } from '../services/api';
import { getCoverUrl } from '../utils/media';

const EditBook: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    description: '',
    genre: '',
    condition: ''
  });
  const [cover, setCover] = useState<File | null>(null);
  const [currentCover, setCurrentCover] = useState<string | null>(null);
  const [currentCoverUrl, setCurrentCoverUrl] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchBook = async () => {
      try {
        const response = await booksAPI.getBook(Number(id));
        const book = response.data;
        setFormData({
          title: book.title,
          author: book.author,
          description: book.description || '',
          genre: book.genre || '',
          condition: book.condition || ''
        });
        setCurrentCover(book.cover);
        setCurrentCoverUrl(book.cover_url ?? null);
      } catch (err: any) {
        setError('Книга не найдена');
      } finally {
        setInitialLoading(false);
      }
    };

    if (id) {
      fetchBook();
    }
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setCover(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const data = new FormData();
    data.append('title', formData.title);
    data.append('author', formData.author);
    data.append('description', formData.description);
    data.append('genre', formData.genre);
    data.append('condition', formData.condition);
    if (cover) {
      data.append('cover', cover);
    }

    try {
      await booksAPI.updateBook(Number(id), data);
      navigate('/profile');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Не удалось обновить книгу. Попробуйте снова.');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="loading">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="container">
      <div style={{ maxWidth: '600px', margin: '2rem auto' }}>
        <div className="card">
          <h2 className="text-center mb-3">Редактировать книгу</h2>
          
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Название книги *</label>
              <input
                type="text"
                name="title"
                className="form-input"
                value={formData.title}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Автор *</label>
              <input
                type="text"
                name="author"
                className="form-input"
                value={formData.author}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Описание</label>
              <textarea
                name="description"
                className="form-textarea"
                value={formData.description}
                onChange={handleChange}
                rows={4}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Жанр</label>
              <input
                type="text"
                name="genre"
                className="form-input"
                value={formData.genre}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Состояние</label>
              <select
                name="condition"
                className="form-select"
                value={formData.condition}
                onChange={handleChange}
              >
                <option value="">Выберите состояние</option>
                <option value="excellent">Отличное</option>
                <option value="good">Хорошее</option>
                <option value="satisfactory">Удовлетворительное</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Обложка книги</label>
              
              {currentCover && (
                <div style={{ marginBottom: '1rem' }}>
                  <p style={{ fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                    Текущая обложка:
                  </p>
                  <img 
                    src={getCoverUrl(currentCover, currentCoverUrl) || ''}
                    alt="Current cover"
                    style={{ 
                      maxWidth: '150px', 
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)'
                    }}
                  />
                </div>
              )}

              <div
                style={{
                  border: '2px dashed var(--border-color)',
                  borderRadius: '8px',
                  padding: '1.5rem',
                  textAlign: 'center',
                  marginBottom: '0.5rem'
                }}
              >
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleCoverChange}
                  style={{ display: 'none' }}
                  id="cover-upload-edit"
                />
                <label htmlFor="cover-upload-edit" style={{ cursor: 'pointer' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🔄</div>
                  <div style={{ color: 'var(--text-secondary)' }}>
                    {cover ? cover.name : 'Загрузить новую обложку'}
                  </div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                    Оставьте пустым, чтобы сохранить текущую
                  </div>
                </label>
              </div>
            </div>

            {error && (
              <div style={{ 
                color: '#dc2626', 
                backgroundColor: '#fef2f2',
                padding: '0.75rem',
                borderRadius: '8px',
                marginBottom: '1rem',
                border: '1px solid #fecaca'
              }}>
                {error}
              </div>
            )}
            
            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
              <button 
                type="button"
                className="btn btn-secondary"
                style={{ flex: 1 }}
                onClick={() => navigate('/profile')}
                disabled={loading}
              >
                Отмена
              </button>
              <button 
                type="submit" 
                className="btn btn-primary"
                style={{ flex: 1 }}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="loading-spinner" style={{ width: '16px', height: '16px', marginRight: '0.5rem' }}></div>
                    Сохранение...
                  </>
                ) : (
                  'Сохранить изменения'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditBook;
