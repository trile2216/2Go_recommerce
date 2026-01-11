import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../../../service/api.auth';
import './Login.css';

const Login = () => {
  const [credentials, setCredentials] = useState({
    identifier: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCredentials({
      ...credentials,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await login(credentials);
      console.log('Login response:', response);
      
      // Extract data from API response
      const { accessToken, refreshToken, userId, email, phone } = response;
      
      console.log('Extracted - accessToken:', accessToken, 'userId:', userId, 'email:', email);
      
      if (accessToken && userId) {
        // Create user object
        const userData = {
          userId,
          email,
          phone,
          fullName: email.split('@')[0] // Use email prefix as fullName, can be updated later
        };
        
        // Store tokens and user in localStorage
        localStorage.setItem('token', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        localStorage.setItem('user', JSON.stringify(userData));
        
        console.log('Successfully stored - token:', accessToken);
        console.log('Successfully stored - user:', userData);
        console.log('Verify from localStorage:', localStorage.getItem('user'));
        
        // Navigate to home after a small delay
        setTimeout(() => {
          console.log('Navigating to home');
          navigate('/');
        }, 100);
      } else {
        setError('Invalid login response - missing required fields');
        console.error('Missing required fields:', { accessToken, userId });
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Login</h2>
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="identifier">Email or Username</label>
            <input
              id="identifier"
              type="text"
              name="identifier"
              value={credentials.identifier}
              onChange={handleChange}
              placeholder="Enter your email or username"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              name="password"
              value={credentials.password}
              onChange={handleChange}
              placeholder="Enter your password"
              required
            />
          </div>

          <button type="submit" disabled={loading}>
            {loading ? 'Loading...' : 'Login'}
          </button>
        </form>

        <p className="auth-link">
          Don't have an account? <a href="/auth/register">Register here</a>
        </p>
      </div>
    </div>
  );
};

export default Login;
