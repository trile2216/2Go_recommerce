import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Provider } from 'react-redux';
import store from './store';
import UserLayout from './layouts/UserLayout';
import './App.css'
import Homepage from './pages/Homepage/Homepage';
import Login from './pages/Auth/Login/Login';
import Register from './pages/Auth/Register/Register';
import ProductDetail from './pages/PostDetail/ProductDetail';
import Compare from './pages/ComparePage/Compare';
import PostListing from './pages/PostListing/PostListing';
import Chat from './pages/Chat/Chat';

// Admin Pages
import AdminDashboard from './pages/Admin/AdminDashboard/AdminDashboard';
import AdminProducts from './pages/Admin/AdminProduct/AdminProducts';
import AdminCustomers from './pages/Admin/AdminCustomer/AdminCustomers';
import AdminOrders from './pages/Admin/AdminOrder/AdminOrders';
import AdminListing from './pages/Admin/AdminListing/AdminListing';
import AdminCategory from './pages/Admin/AdminCategory/AdminCategory';
import UserInfo from './pages/UserInfo/UserInfo';
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
          <Route path="/user/info" element={<UserInfo />} />
          <Route path="/post/listing" element={
            <UserLayout>
              <PostListing />
            </UserLayout>
          } />
          <Route path="/chat" element={
            <UserLayout>
              <Chat />
            </UserLayout>
          } />

          {/* Admin Routes - Protected */}
          <Route
            path="/admin"
            element={
              <AdminDashboard />
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
          <Route
            path="/admin/listings"
            element={
              <AdminListing />
            }
          />
          <Route
            path="/admin/categories"
            element={
              <AdminCategory />
            }
          />
        </Routes>
      </Router>
    </Provider>
  )
}

export default App
