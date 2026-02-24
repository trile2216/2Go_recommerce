import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { register } from '../../../service/auth/api.auth';
import { useDispatch } from 'react-redux';
import { loginSuccess } from '../../../context/UserSlice';
import useAuth from '../../../context/UseAuth';
import { useToast } from '../../../context/ToastContext';
import { useTitle } from '../../../hooks/useTitle';
import './Register.css';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../../../config/firebase';

const Register = () => {
  useTitle('Register');
  const [userInfo, setUserInfo] = useState({
    email: '',
    phone: '',
    password: '',
    fullName: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { loginWithOAuthAction } = useAuth();
  const toast = useToast();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setUserInfo({
      ...userInfo,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validate input
      if (!userInfo.email || !userInfo.phone || !userInfo.password || !userInfo.fullName) {
        setError('Vui lòng điền đầy đủ tất cả các trường');
        setLoading(false);
        return;
      }

      const response = await register(userInfo);
      
      if (response.token) {
        dispatch(loginSuccess({
          token: response.token,
          user: response.user || userInfo,
        }));
      }
      
      toast.success('Đăng ký thành công!');
      navigate('/login');
    } catch (err) {
      console.error('Registration error:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Đăng ký thất bại. Vui lòng thử lại.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthClick = async () => {
    setLoading(true);
    setError('');
    
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const firebaseUser = result.user;
      
      // Get Firebase ID Token
      const idToken = await firebaseUser.getIdToken();
      
      // Use context auth action
      await loginWithOAuthAction({
        idToken,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName,
      });
      
      setTimeout(() => {
        navigate('/');
      }, 100);
    } catch (error) {
      console.error('OAuth login error:', error);
      setError(error.response?.data?.message || 'OAuth login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-wrapper register-wrapper">
        <div className="auth-card register-card">
          {/* Header */}
          <div className="auth-card-header">
            <div className="auth-header-title">
              <h6 className="sign-up-text">Sign up with</h6>
            </div>
            
            {/* OAuth Buttons */}
            <div className="auth-oauth-buttons">
              <button
                type="button"
                className="auth-oauth-btn google-btn"
                onClick={() => handleOAuthClick('Google')}
              >
                <svg className="auth-oauth-icon" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                GOOGLE
              </button>
            </div>

            <hr className="auth-divider" />
          </div>

          {/* Form */}
          <div className="auth-card-body">
            <div className="auth-form-intro">
              <small>Or sign up with credentials</small>
            </div>

            {error && <div className="auth-error-message">{error}</div>}

            <form onSubmit={handleSubmit}>
              <div className="auth-form-group">
                <label htmlFor="fullName" className="auth-form-label">
                  Name
                </label>
                <input
                  id="fullName"
                  type="text"
                  name="fullName"
                  value={userInfo.fullName}
                  onChange={handleChange}
                  placeholder="Name"
                  className="auth-form-input"
                  required
                />
              </div>

              <div className="auth-form-group">
                <label htmlFor="email" className="auth-form-label">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  name="email"
                  value={userInfo.email}
                  onChange={handleChange}
                  placeholder="Email"
                  className="auth-form-input"
                  required
                />
              </div>

              <div className="auth-form-group">
                <label htmlFor="phone" className="auth-form-label">
                  Phone
                </label>
                <input
                  id="phone"
                  type="tel"
                  name="phone"
                  value={userInfo.phone}
                  onChange={handleChange}
                  placeholder="Phone Number"
                  className="auth-form-input"
                  required
                />
              </div>

              <div className="auth-form-group">
                <label htmlFor="password" className="auth-form-label">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  name="password"
                  value={userInfo.password}
                  onChange={handleChange}
                  placeholder="Password"
                  className="auth-form-input"
                  required
                />
              </div>

              

              <button type="submit" className="auth-submit-btn" disabled={loading}>
                {loading ? 'Loading...' : 'Create Account'}
              </button>
            </form>
          </div>
        </div>

        {/* Footer Link */}
        <div className="register-footer">
          <div className="footer-text">
            Already have an account?{' '}
            <Link to="/auth/login" className="auth-footer-link register-footer-link">
              Login here
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
