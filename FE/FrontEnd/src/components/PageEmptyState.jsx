import { useNavigate } from 'react-router-dom';


/**
 * Empty state chung cho các trang danh sách
 * @param {Object} props
 * @param {React.ReactNode} props.icon - Icon hiển thị
 * @param {string} props.title - Tiêu đề
 * @param {string} props.description - Mô tả
 * @param {string} [props.actionLabel] - Nhãn nút hành động
 * @param {string} [props.actionTo] - Route điều hướng khi click nút
 * @param {function} [props.onAction] - Handler tuỳ chỉnh
 */
export default function PageEmptyState({ icon, title, description, actionLabel, actionTo, onAction }) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onAction) onAction();
    else if (actionTo) navigate(actionTo);
  };

  return (
    <div className="page-empty-state">
      {icon && <div className="page-empty-icon">{icon}</div>}
      <h3 className="page-empty-title">{title}</h3>
      <p className="page-empty-desc">{description}</p>
      {actionLabel && (
        <button className="page-empty-btn" onClick={handleClick}>
          {actionLabel}
        </button>
      )}
    </div>
  );
}
