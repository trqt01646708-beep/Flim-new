import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext'; // Import useAuth

const RequireAdminAuth = ({ children }) => {
  const { adminToken } = useAuth(); // Dùng context thay vì localStorage
  return adminToken ? children : <Navigate to="/admin/login" replace />;
};

export default RequireAdminAuth;