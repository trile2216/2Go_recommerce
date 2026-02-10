import { useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { Scale } from 'lucide-react';
import './CompareFloatingButton.css';

export default function CompareFloatingButton() {
  const navigate = useNavigate();
  const location = useLocation();
  const compareItems = useSelector(state => state.compare.items);

  // Don't show on the compare page itself
  if (location.pathname === '/compare' || compareItems.length === 0) {
    return null;
  }

  return (
    <button
      className="compare-floating-btn"
      onClick={() => navigate('/compare')}
      title="So sánh sản phẩm"
    >
      <Scale size={22} />
      <span className="compare-floating-text">So sánh</span>
      <span className="compare-floating-badge">{compareItems.length}</span>
    </button>
  );
}
