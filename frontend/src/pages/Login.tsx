import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      await login(username, password);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Ошибка входа. Проверьте данные.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div style={{ maxWidth: '400px', margin: '2rem auto' }}>
        <div className="card">
          <h2 className="text-center mb-3">Вход в систему</h2>
          
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Имя пользователя</label>
              <input
                type="text"
                className="form-input"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                placeholder="Введите ваше имя пользователя"
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Пароль</label>
              <input
                type="password"
                className="form-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Введите ваш пароль"
              />
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
            
            <button 
              type="submit" 
              className="btn btn-primary"
              style={{ width: '100%' }}
              disabled={loading}
            >
              {loading ? 'Вход...' : 'Войти'}
            </button>
          </form>
          
          <p className="text-center mt-3">
            Нет аккаунта? <Link to="/register" style={{ color: 'var(--primary-color)' }}>Зарегистрируйтесь</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;