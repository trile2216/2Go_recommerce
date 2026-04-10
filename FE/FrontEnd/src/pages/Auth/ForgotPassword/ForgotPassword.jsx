import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { forgotPassword, resetPassword } from '../../../service/auth/api.auth';
import { useToast } from '../../../context/ToastContext';
import { useTitle } from '../../../hooks/useTitle';

const ForgotPassword = () => {
  useTitle('Quên mật khẩu');
  const navigate = useNavigate();
  const toast = useToast();

  const [step, setStep] = useState(1); 
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const handleSendCode = async (e) => {
    e.preventDefault();
    if (!email) {
      setError('Vui lòng nhập email');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      await forgotPassword({ email });
      toast.success('Mã xác thực đã được gửi đến email của bạn');
      setStep(2);
    } catch (err) {
      console.error('Forgot password error:', err);
      setError(err.response?.data?.message || 'Không thể gửi mã xác thực. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!code || !newPassword) {
      setError('Vui lòng điền đầy đủ thông tin');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await resetPassword({ email, code, newPassword });
      toast.success('Đặt lại mật khẩu thành công! Vui lòng đăng nhập lại.');
      navigate('/auth/login');
    } catch (err) {
      console.error('Reset password error:', err);
      setError(err.response?.data?.message || 'Không thể đặt lại mật khẩu. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-wrapper login-wrapper">
        <div className="auth-card login-card" style={{ maxWidth: '400px' }}>
          <div className="auth-card-header login-card-header">
            <div className="auth-header-title">
              <h6 className="sign-in-text">
                {step === 1 ? 'Quên mật khẩu' : 'Đặt lại mật khẩu'}
              </h6>
            </div>
          </div>

          <div className="auth-card-body">
            {error && <div className="auth-error-message">{error}</div>}

            {step === 1 ? (
              <form onSubmit={handleSendCode}>
                <div className="auth-form-group">
                  <label htmlFor="email" className="auth-form-label">Email</label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Nhập email của bạn"
                    className="auth-form-input"
                    required
                  />
                </div>
                <button type="submit" className="auth-submit-btn" disabled={loading}>
                  {loading ? 'Đang xử lý...' : 'Gửi mã xác thực'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleResetPassword}>
                <div className="auth-form-group">
                  <label htmlFor="emailDisplay" className="auth-form-label">Email</label>
                  <input
                    id="emailDisplay"
                    type="email"
                    value={email}
                    disabled
                    className="auth-form-input"
                  />
                </div>
                <div className="auth-form-group">
                  <label htmlFor="code" className="auth-form-label">Mã xác thực</label>
                  <input
                    id="code"
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="Nhập mã xác thực"
                    className="auth-form-input"
                    required
                  />
                </div>
                <div className="auth-form-group">
                  <label htmlFor="newPassword" className="auth-form-label">Mật khẩu mới</label>
                  <input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Nhập mật khẩu mới"
                    className="auth-form-input"
                    required
                  />
                </div>
                <button type="submit" className="auth-submit-btn" disabled={loading}>
                  {loading ? 'Đang xử lý...' : 'Đặt lại mật khẩu'}
                </button>
              </form>
            )}

            <hr className="auth-divider" />
            
            <div className="login-footer">
              <div className="footer-left">
                <Link to="/auth/login" className="auth-footer-link login-footer-link">
                  <small>Quay lại đăng nhập</small>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
