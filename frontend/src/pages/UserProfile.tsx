import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Book, User } from '../types';
import { booksAPI } from '../services/api';
import { translateCondition, translateGenre } from '../utils/translations';
import { resolveBookCover } from '../utils/media';
import { useAuth } from '../context/AuthContext';
import UserStatusIndicator from '../components/UserStatusIndicator';

const UserProfile: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const [user, setUser] = useState<any>(null);
  const [userBooks, setUserBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const [userResponse, booksResponse] = await Promise.all([
          booksAPI.getUserProfile(Number(userId)),
          booksAPI.getUserBooks(Number(userId))
        ]);
        setUser(userResponse.data);
        setUserBooks(booksResponse.data);
      } catch (err: any) {
        setError('Не удалось загрузить профиль пользователя');
        console.error('Error fetching user ', err);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchUserData();
    }
  }, [userId]);

  if (loading) {
    return (
      <div className="loading">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <div className="card text-center" style={{ padding: '3rem' }}>
          <h3>{error}</h3>
          <button onClick={() => navigate('/')} className="btn btn-primary mt-3">
            Вернуться на главную
          </button>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container">
        <div className="card text-center" style={{ padding: '3rem' }}>
          <h3>Пользователь не найден</h3>
          <button onClick={() => navigate('/')} className="btn btn-primary mt-3">
            Вернуться на главную
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="hero">
        <h1>Профиль пользователя</h1>
        <p>Информация о пользователе и его книжной коллекции</p>
      </div>
      
      <div className="card mb-3">
        <div 
          style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '1.5rem',
            gap: '1rem',
            flexWrap: 'wrap'
          }}
        >
          <h2 style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '12px',
            margin: 0 
          }}>
            {user.username}
            <UserStatusIndicator userId={user.id} size={16} />
          </h2>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {currentUser?.id !== user.id && (
              <Link to={`/chat?user=${user.id}`} className="btn btn-primary">
                Написать пользователю
              </Link>
            )}
            {currentUser?.id === user.id ? (
              <button 
                onClick={() => navigate('/profile')} 
                className="btn btn-secondary"
              >
                Мой профиль
              </button>
            ) : (
              <a href="#user-books" className="btn btn-secondary">
                Книги пользователя
              </a>
            )}
          </div>
        </div>
        
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
          gap: '1.5rem',
          marginTop: '1.5rem'
        }}>
          <div>
            <label style={{ fontWeight: '600', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              Полное имя
            </label>
            <p style={{ fontSize: '1.125rem', fontWeight: '500' }}>
              {user.full_name || 'Не указано'}
            </p>
          </div>
          <div>
            <label style={{ fontWeight: '600', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              Город
            </label>
            <p style={{ fontSize: '1.125rem', fontWeight: '500' }}>
              {user.city || 'Не указан'}
            </p>
          </div>
          <div>
            <label style={{ fontWeight: '600', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              Email
            </label>
            <p style={{ fontSize: '1.125rem', fontWeight: '500' }}>
              {user.email}
            </p>
          </div>
        </div>
        
        {user.about && (
          <div style={{ marginTop: '1.5rem' }}>
            <label style={{ fontWeight: '600', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              О себе
            </label>
            <p style={{ 
              marginTop: '0.5rem',
              padding: '1rem',
              background: 'var(--secondary-color)',
              borderRadius: '8px',
              lineHeight: '1.6'
            }}>
              {user.about}
            </p>
          </div>
        )}
      </div>
      
      <div className="card" id="user-books">
        <h2>Книги пользователя ({userBooks.length})</h2>
        
        {userBooks.length === 0 ? (
          <div className="text-center" style={{ padding: '3rem', color: 'var(--text-secondary)' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📚</div>
            <h3>У пользователя нет доступных книг</h3>
            <p>Возможно, все книги уже находятся в процессе обмена</p>
          </div>
        ) : (
          <div className="my-books-list">
            {userBooks.map(book => {
              const coverSrc = resolveBookCover(book);
              return (
              <Link 
                key={book.id} 
                to={`/book/${book.id}`} 
                className="my-book-card my-book-card-link"
              >
                <div className="my-book-cover-frame">
                  {coverSrc ? (
                    <img 
                      src={coverSrc}
                      alt={book.title}
                      className="my-book-cover-image"
                    />
                  ) : (
                    <div className="my-book-cover-placeholder">
                    📚
                    </div>
                  )}
                </div>
                <div className="my-book-content">
                  <h3 className="book-title">{book.title}</h3>
                  <p className="book-author">Автор: {book.author}</p>
                  <div className="my-book-meta">
                    {book.genre && (
                      <div className="my-book-meta-field">
                        <span className="my-book-meta-label">Жанр:</span>
                        <span className="my-book-tag">{translateGenre(book.genre)}</span>
                      </div>
                    )}
                    {book.condition && (
                      <div className="my-book-meta-field">
                        <span className="my-book-meta-label">Состояние:</span>
                        <span className="my-book-tag condition">{translateCondition(book.condition)}</span>
                      </div>
                    )}
                    <div className="my-book-meta-field">
                      <span className="my-book-meta-label">Статус:</span>
                      <span className={`my-book-tag status ${book.status === 'available' ? 'available' : 'unavailable'}`}>
                        {book.status === 'available' ? 'Доступна' : 'Обменена'}
                      </span>
                    </div>
                  </div>
                  {book.description && (
                    <div className="my-book-description-block">
                      <span className="my-book-description-label">Описание</span>
                      <p className="my-book-description">
                        {book.description}
                      </p>
                    </div>
                  )}
                </div>
              </Link>
            )})}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserProfile;
