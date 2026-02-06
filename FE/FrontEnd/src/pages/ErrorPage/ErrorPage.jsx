import { useNavigate } from 'react-router-dom';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import './ErrorPage.css';

export default function ErrorPage({ error = 'Something went wrong!' }) {
  const navigate = useNavigate();

  const handleReturnHome = () => {
    navigate('/');
  };

  return (
    <div className="error-page-wrapper">
      <Header />
      <div className="error-page-container">
        <div className="face">
          <div className="band">
            <div className="red"></div>
            <div className="white"></div>
            <div className="blue"></div>
          </div>
          <div className="eyes"></div>
          <div className="dimples"></div>
          <div className="mouth"></div>
        </div>

        <h1>Oops! Có lỗi xảy ra!</h1>
        {error && <p className="error-message">{error}</p>}
        <div className="btn" onClick={handleReturnHome}>
          Quay về trang chủ
        </div>
      </div>
      <Footer />
    </div>
  );
}
