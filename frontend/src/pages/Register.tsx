import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Register: React.FC = () => {
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
    full_name: '',
    city: '',
    about: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      await register(formData);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Ошибка регистрации. Попробуйте снова.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div style={{ maxWidth: '500px', margin: '2rem auto' }}>
        <div className="card">
          <h2 className="text-center mb-3">Регистрация</h2>
          
          <form onSubmit={handleSubmit}>
            {['email', 'username', 'password', 'full_name', 'city'].map((field) => (
              <div key={field} className="form-group">
                <label className="form-label">
                  {field === 'email' && 'Email'}
                  {field === 'username' && 'Имя пользователя'}
                  {field === 'password' && 'Пароль'}
                  {field === 'full_name' && 'Полное имя'}
                  {field === 'city' && 'Город'}
                </label>
                <input
                  type={field === 'password' ? 'password' : 'text'}
                  name={field}
                  className="form-input"
                  value={formData[field as keyof typeof formData]}
                  onChange={handleChange}
                  required={['email', 'username', 'password'].includes(field)}
                  placeholder={
                    field === 'email' ? 'your@email.com' :
                    field === 'username' ? 'Придумайте имя пользователя' :
                    field === 'password' ? 'Создайте надежный пароль' :
                    field === 'full_name' ? 'Ваше полное имя' :
                    'Ваш город'
                  }
                />
              </div>
            ))}
            
            <div className="form-group">
              <label className="form-label">О себе</label>
              <textarea
                name="about"
                className="form-textarea"
                value={formData.about}
                onChange={handleChange}
                placeholder="Расскажите немного о себе..."
                rows={4}
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
              {loading ? 'Регистрация...' : 'Зарегистрироваться'}
            </button>
          </form>
          
          <p className="text-center mt-3">
            Уже есть аккаунт? <Link to="/login" style={{ color: 'var(--primary-color)' }}>Войдите</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;