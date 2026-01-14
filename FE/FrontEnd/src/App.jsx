import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Provider } from 'react-redux';
import store from './store';
import './App.css'
import Homepage from './pages/Homepage/Homepage';
import Login from './pages/Auth/Login/Login';
import Register from './pages/Auth/Register/Register';
import ProductDetail from './pages/PostDetail/ProductDetail';
import Compare from './pages/ComparePage/Compare';

// Admin Pages
import AdminDashboard from './pages/Admin/AdminDashboard';
import AdminProducts from './pages/Admin/AdminProducts';
import AdminCustomers from './pages/Admin/AdminCustomers';
import AdminOrders from './pages/Admin/AdminOrders';
import ProtectedRoute from './components/Admin/ProtectedRoute';

function App() {
  return (
    <Provider store={store}>
      <Router>
        <Routes>
          {/* Frontend Routes */}
          <Route path="/" element={<Homepage />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/compare" element={<Compare />} />
          <Route path="/auth/login" element={<Login />} />
          <Route path="/auth/register" element={<Register />} />

          {/* Admin Routes - Protected */}
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/products" 
            element={
                <AdminProducts />
            } 
          />
          <Route 
            path="/admin/customers" 
            element={
                <AdminCustomers />
            } 
          />
          <Route 
            path="/admin/orders" 
            element={
                <AdminOrders />
            } 
          />
        </Routes>
      </Router>
    </Provider>
  )
}

export default App
