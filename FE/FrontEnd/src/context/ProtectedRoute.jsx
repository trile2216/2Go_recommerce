import { Navigate, Outlet } from "react-router-dom";
import { useSelector } from "react-redux";

const ProtectedRoute = ({ allowedRoles, children }) => {
  const token = useSelector((state) => state.user.token);
  const role = useSelector((state) => state.user.role);

  // Not logged in
  if (!token) {
    return <Navigate to="/auth/login" replace />;
  }

  // No permission (only check if allowedRoles is provided)
  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to="/" replace />;
  }

  // Valid
  return children ? children : <Outlet />;
};

export default ProtectedRoute;
