import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Book, User, Exchange, ExchangeResponse } from '../types';
import { booksAPI, exchangesAPI } from '../services/api';
import { Link } from 'react-router-dom';
import ExchangeStatus from '../components/ExchangeStatus';
import { resolveBookCover } from '../utils/media';

const Profile: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const [myBooks, setMyBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [exchanges, setExchanges] = useState<Exchange[]>([]);
  const [offers, setOffers] = useState<Exchange[]>([]);
  const [activeTab, setActiveTab] = useState<'requests' | 'offers'>('requests');
  const [loadingExchanges, setLoadingExchanges] = useState(true);
  const [aboutValue, setAboutValue] = useState(user?.about ?? '');
  const [isSavingAbout, setIsSavingAbout] = useState(false);
  const [aboutError, setAboutError] = useState<string | null>(null);
  const [isEditingAbout, setIsEditingAbout] = useState(false);

  useEffect(() => {
    const fetchMyBooks = async () => {
      try {
        const response = await booksAPI.getMyBooks();
        setMyBooks(response.data);
      } catch (error) {
        console.error('Ошибка при загрузке книг:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMyBooks();

    const fetchExchanges = async () => {
      try {
        const [requestsResponse, offersResponse] = await Promise.all([
          exchangesAPI.getMyExchanges(),
          exchangesAPI.getMyOffers()
        ]);
        setExchanges(requestsResponse.data);
        setOffers(offersResponse.data);
      } catch (error) {
        console.error('Ошибка при загрузке обменов:', error);
      }
    };
    
    if (user) {
      fetchExchanges();
    }
  }, [user]);

  useEffect(() => {
    setAboutValue(user?.about ?? '');
  }, [user?.about]);

  const aboutHasChanges = (user?.about ?? '') !== (aboutValue ?? '');

  const handleAboutSave = async () => {
    if (isSavingAbout || !aboutHasChanges) return;
    try {
      setIsSavingAbout(true);
      setAboutError(null);
      const normalizedAbout = aboutValue.trim() ? aboutValue : null;
      await updateProfile({ about: normalizedAbout });
      setAboutValue(normalizedAbout ?? '');
      setIsEditingAbout(false);
    } catch (error) {
      console.error('Ошибка при обновлении профиля', error);
      setAboutError('Не удалось сохранить. Попробуйте ещё раз.');
    } finally {
      setIsSavingAbout(false);
    }
  };

  const handleDeleteBook = async (bookId: number) => {
    if (window.confirm('Вы уверены, что хотите удалить эту книгу?')) {
      try {
        await booksAPI.deleteBook(bookId);
        setMyBooks(myBooks.filter(book => book.id !== bookId));
      } catch (error) {
        console.error('Ошибка при удалении книги:', error);
        alert('Не удалось удалить книгу');
      }
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="hero">
        <h1>Мой профиль</h1>
        <p>Управляйте вашими книгами и данными</p>
      </div>

      <div className="card mb-3">
        <h2 className="mb-2">Информация о пользователе</h2>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
          gap: '1.5rem',
          marginTop: '1.5rem'
        }}>
          <div>
            <label style={{ fontWeight: '600', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              Имя пользователя
            </label>
            <p style={{ fontSize: '1.125rem', fontWeight: '500' }}>{user?.username}</p>
          </div>
          <div>
            <label style={{ fontWeight: '600', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              Email
            </label>
            <p style={{ fontSize: '1.125rem', fontWeight: '500' }}>{user?.email}</p>
          </div>
          <div>
            <label style={{ fontWeight: '600', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              Полное имя
            </label>
            <p style={{ fontSize: '1.125rem', fontWeight: '500' }}>{user?.full_name || 'Не указано'}</p>
          </div>
          <div>
            <label style={{ fontWeight: '600', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              Город
            </label>
            <p style={{ fontSize: '1.125rem', fontWeight: '500' }}>{user?.city || 'Не указан'}</p>
          </div>
        </div>
        
        <div className="profile-about-editor">
          <div className="profile-about-header">
            <label className="profile-about-label">
              О себе
              <span className="profile-about-helper">Расскажите немного о себе, любимых жанрах и интересах</span>
            </label>
            {!isEditingAbout && (
              <button
                type="button"
                className="btn btn-secondary profile-about-edit-btn"
                onClick={() => {
                  setIsEditingAbout(true);
                  setAboutError(null);
                }}
              >
                Изменить
              </button>
            )}
          </div>

          {isEditingAbout ? (
            <>
              <textarea
                className="form-textarea"
                rows={4}
                placeholder="Например: люблю научную фантастику и современные романы..."
                value={aboutValue}
                onChange={(e) => setAboutValue(e.target.value)}
              />
              {aboutError && <span className="profile-about-error">{aboutError}</span>}
              <div className="profile-about-actions">
                <button
                  className="btn btn-primary"
                  onClick={handleAboutSave}
                  disabled={isSavingAbout || !aboutHasChanges}
                >
                  {isSavingAbout ? 'Сохраняем...' : 'Сохранить'}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setAboutValue(user?.about ?? '');
                    setAboutError(null);
                    setIsEditingAbout(false);
                  }}
                  disabled={isSavingAbout}
                >
                  Отмена
                </button>
              </div>
            </>
          ) : (
            <p className="profile-about-text">
              {user?.about?.trim()
                ? user.about
                : 'Вы еще не рассказали о себе. Нажмите «Изменить», чтобы добавить описание.'}
            </p>
          )}
        </div>
      </div>

      <div className="card mt-3">
        <h2 className="mb-2">История обменов</h2>
        
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          <button 
            className={`btn ${activeTab === 'requests' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('requests')}
          >
            Мои запросы
          </button>
          <button 
            className={`btn ${activeTab === 'offers' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('offers')}
          >
            Мои предложения
          </button>
        </div>
      
        {activeTab === 'requests' && (
          <div className="book-list">
            {exchanges.length === 0 ? (
              <p className="text-center mt-3">Нет активных запросов на обмен</p>
            ) : (
              exchanges.map(exchange => {
                const coverSrc = exchange.book ? resolveBookCover(exchange.book) : null;
                return (
                  <div key={exchange.id} className="book-item" style={{ padding: '1.5rem' }}>
                  <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                    <div style={{ flex: '0 0 100px' }}>
                      {coverSrc ? (
                        <img
                          src={coverSrc}
                          alt={exchange.book.title}
                          className="book-cover-vertical"
                        />
                      ) : (
                        <div className="book-cover-placeholder-vertical">📚</div>
                      )}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                        <div>
                          <h3 className="book-title-vertical">{exchange.book?.title}</h3>
                          <p className="book-author-vertical">
                            <strong>Автор:</strong> {exchange.book?.author}
                          </p>
                          <p style={{ color: 'var(--text-secondary)' }}>
                            <strong>Владелец:</strong> {exchange.owner?.username}
                          </p>
                        </div>
                        <ExchangeStatus status={exchange.status as any} />
                      </div>
                      <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>
                          Запрошено: {new Date(exchange.created_at).toLocaleDateString('ru-RU')}
                        </span>
                        {exchange.status === 'pending' && (
                          <button
                            onClick={async () => {
                              try {
                                await exchangesAPI.cancelExchange(exchange.id);
                                setExchanges(exchanges.filter(ex => ex.id !== exchange.id));
                              } catch (err) {
                                console.error('Error cancelling exchange:', err);
                              }
                            }}
                            className="btn btn-danger"
                            style={{ padding: '0.25rem 0.75rem' }}
                          >
                            Отменить
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      
        {activeTab === 'offers' && (
          <div className="book-list">
            {offers.length === 0 ? (
              <p className="text-center mt-3">Нет активных предложений для обмена</p>
            ) : (
              offers.map(exchange => {
                const coverSrc = exchange.book ? resolveBookCover(exchange.book) : null;
                return (
                <div key={exchange.id} className="book-item" style={{ padding: '1.5rem' }}>
                  <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                    <div style={{ flex: '0 0 100px' }}>
                      {coverSrc ? (
                        <img
                          src={coverSrc}
                          alt={exchange.book.title}
                          className="book-cover-vertical"
                        />
                      ) : (
                        <div className="book-cover-placeholder-vertical">📚</div>
                      )}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                        <div>
                          <h3 className="book-title-vertical">{exchange.book?.title}</h3>
                          <p className="book-author-vertical">
                            <strong>Автор:</strong> {exchange.book?.author}
                          </p>
                          <p style={{ color: 'var(--text-secondary)' }}>
                            <strong>Запрашивающий:</strong> {exchange.requester?.username}
                          </p>
                        </div>
                        <ExchangeStatus status={exchange.status as any} />
                      </div>
                      <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>
                          Предложено: {new Date(exchange.created_at).toLocaleDateString('ru-RU')}
                        </span>
                        {exchange.status === 'pending' && (
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button
                              onClick={async () => {
                                try {
                                  await exchangesAPI.acceptExchange(exchange.id);
                                  setOffers(offers.filter(ex => ex.id !== exchange.id));
                                } catch (err) {
                                  console.error('Error accepting exchange:', err);
                                }
                              }}
                              className="btn btn-success"
                              style={{ padding: '0.25rem 0.75rem' }}
                            >
                              Принять
                            </button>
                            <button
                              onClick={async () => {
                                try {
                                  await exchangesAPI.rejectExchange(exchange.id);
                                  setOffers(offers.filter(ex => ex.id !== exchange.id));
                                } catch (err) {
                                  console.error('Error rejecting exchange:', err);
                                }
                              }}
                              className="btn btn-danger"
                              style={{ padding: '0.25rem 0.75rem' }}
                            >
                              Отклонить
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                );
              })
            )}
          </div>
        )}
      </div>

      <div className="card">
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '2rem',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <h2 style={{ margin: 0 }}>Мои книги</h2>
          <Link to="/add-book" className="btn btn-primary">
            + Добавить книгу
          </Link>
        </div>
        
        {myBooks.length === 0 ? (
          <div className="text-center" style={{ padding: '3rem', color: 'var(--text-secondary)' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📚</div>
            <h3>У вас пока нет книг</h3>
            <p>Добавьте свою первую книгу для обмена!</p>
            <Link to="/add-book" className="btn btn-primary" style={{ marginTop: '1rem' }}>
              Добавить книгу
            </Link>
          </div>
        ) : (
          <div className="my-books-wrapper">
            <div className="my-books-list">
            {myBooks.map(book => {
              const coverSrc = resolveBookCover(book);
              return (
              <div key={book.id} className="my-book-card">
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
                        <span className="my-book-tag">{book.genre}</span>
                      </div>
                    )}
                    {book.condition && (
                      <div className="my-book-meta-field">
                        <span className="my-book-meta-label">Состояние:</span>
                        <span className="my-book-tag condition">
                          {book.condition === 'excellent' && 'Отличное'}
                          {book.condition === 'good' && 'Хорошее'}
                          {book.condition === 'satisfactory' && 'Удовлетворительное'}
                        </span>
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
                  
                  <div className="my-book-card-footer">
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                      Добавлено: {new Date(book.created_at).toLocaleDateString('ru-RU')}
                    </span>
                    <div className="my-book-actions">
                      <Link 
                        to={`/edit-book/${book.id}`} 
                        className="my-book-action-link edit"
                      >
                        Редактировать
                      </Link>
                      <button 
                        onClick={() => handleDeleteBook(book.id)}
                        className="my-book-action-link delete"
                      >
                        Удалить
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
            })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
