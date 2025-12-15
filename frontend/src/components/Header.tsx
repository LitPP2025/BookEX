import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import HeaderNotifications from './HeaderNotifications';

const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="app-header">
      <div className="container">
          <div className="header-content">
            <Link to="/" className="logo">
              <span className="logo-icon" aria-hidden="true">
                <span className="logo-page logo-page-left" />
                <span className="logo-page logo-page-right" />
                <span className="logo-bookmark" />
              </span>
              <div className="logo-text">
                <span className="logo-title">BookEX</span>
                <span className="logo-subtitle">обмен книгами</span>
              </div>
            </Link>
            
            <nav className="nav-items">
              {user && <HeaderNotifications />}
              {user ? (
                <>
                  <span className="user-greeting">Привет, {user.username}!</span>
                  <Link to="/profile" className="nav-link">Мой профиль</Link>
                <Link to="/add-book" className="nav-link">Добавить книгу</Link>
                <Link to="/chat" className="nav-link">Чат</Link>
                <button 
                  onClick={handleLogout}
                  className="btn btn-secondary"
                >
                  Выйти
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="nav-link">Войти</Link>
                <Link to="/register" className="btn btn-primary">Регистрация</Link>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;
