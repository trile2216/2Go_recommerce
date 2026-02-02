import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { login } from '../../../service/auth/api.auth';
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
      
      const { accessToken, refreshToken, userId, email, phone } = response;
      
      console.log('Extracted - accessToken:', accessToken, 'userId:', userId, 'email:', email);
      
      if (accessToken && userId) {
        const userData = {
          userId,
          email,
          phone,
          fullName: email.split('@')[0]
        };
        
        localStorage.setItem('token', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        localStorage.setItem('user', JSON.stringify(userData));
        
        console.log('Successfully stored - token:', accessToken);
        console.log('Successfully stored - user:', userData);
        console.log('Verify from localStorage:', localStorage.getItem('user'));
        
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

  const handleOAuthClick = (provider) => {
    console.log(`${provider} login clicked`);
    // TODO: Implement OAuth login
  };

  return (
    <div className="login-container">
      <div className="login-wrapper">
        <div className="login-card">
          {/* Header */}
          <div className="card-header">
            <div className="header-title">
              <h6 className="sign-in-text">Sign in with</h6>
            </div>
            
            {/* OAuth Buttons */}
            <div className="oauth-buttons">
              <button
                type="button"
                className="oauth-btn google-btn"
                onClick={() => handleOAuthClick('Google')}
              >
                <svg className="oauth-icon" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                GOOGLE
              </button>
            </div>

            <hr className="divider" />
          </div>

          {/* Form */}
          <div className="card-body">
            <div className="form-intro">
              <small>Or sign in with credentials</small>
            </div>

            {error && <div className="error-message">{error}</div>}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="identifier" className="form-label">
                  Email
                </label>
                <input
                  id="identifier"
                  type="text"
                  name="identifier"
                  value={credentials.identifier}
                  onChange={handleChange}
                  placeholder="Email"
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="password" className="form-label">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  name="password"
                  value={credentials.password}
                  onChange={handleChange}
                  placeholder="Password"
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group checkbox-group">
                <label className="checkbox-label">
                  <input
                    id="customCheckLogin"
                    type="checkbox"
                    className="form-checkbox"
                  />
                  <span className="checkbox-text">Remember me</span>
                </label>
              </div>

              <button type="submit" className="submit-btn" disabled={loading}>
                {loading ? 'Loading...' : 'Sign In'}
              </button>
            </form>
          </div>
        </div>

        {/* Footer Links */}
        <div className="auth-footer">
          <div className="footer-left">
            <a href="#pablo" onClick={(e) => e.preventDefault()} className="footer-link">
              <small>Forgot password?</small>
            </a>
          </div>
          <div className="footer-right">
            <Link to="/auth/register" className="footer-link">
              <small>Create new account</small>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
