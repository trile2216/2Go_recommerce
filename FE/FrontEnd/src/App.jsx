import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Provider } from 'react-redux';
import store from './context/store';
import { SearchProvider } from './context/SearchContext';
import { CartProvider } from './context/CartContext';
import { ToastProvider } from './context/ToastContext';
import './styles/toast.css';
import UserLayout from './layouts/UserLayout';
import './App.css'
import Homepage from './pages/Homepage/Homepage';
import Login from './pages/Auth/Login/Login';
import Register from './pages/Auth/Register/Register';
import ProductDetail from './pages/PostDetail/ProductDetail';
import Compare from './pages/ComparePage/Compare';
import Listings from './pages/Listings/Listings';
import PostListing from './pages/PostListing/PostListing';
import Chat from './pages/Chat/Chat';
import CompareFloatingButton from './components/CompareFloatingButton';
import ScrollToTop from './components/ScrollToTop';

// Admin Pages
import AdminDashboard from './pages/Admin/AdminDashboard/AdminDashboard';
import AdminProducts from './pages/Admin/AdminProduct/AdminProducts';
import AdminCustomers from './pages/Admin/AdminCustomer/AdminCustomers';
import AdminOrders from './pages/Admin/AdminOrder/AdminOrders';
import AdminListing from './pages/Admin/AdminListing/AdminListing';
import AdminCategory from './pages/Admin/AdminCategory/AdminCategory';
import UserInfo from './pages/UserInfo/UserInfo';
import ProtectedRoute from './context/ProtectedRoute';
import Orders from './pages/Order/Order';
import OrderDetail from './pages/OrderDetail/OrderDetail';
import Checkout from './pages/Checkout/Checkout';
import PaymentResult from './pages/PaymentResult/PaymentResult';
import SellerListings from './pages/SellerListings/SellerListings';
import SavedListings from './pages/SavedListings/SavedListings';

function App() {
  return (
    <Provider store={store}>
      <Router>
        <ScrollToTop />
        <ToastProvider>
        <SearchProvider>
        <CartProvider>
        <CompareFloatingButton />
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Homepage />} />
          <Route path="/auth/login" element={<Login />} />
          <Route path="/auth/register" element={<Register />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/compare" element={<Compare />} />
          <Route path="/listings" element={<Listings />} />
          {/* Protected Routes - Requires login */}
          <Route element={<ProtectedRoute allowedRoles={['User']}/>}>
            <Route path="/user/info" element={<UserInfo />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/order/:orderId" element={<OrderDetail />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/payment/result" element={<PaymentResult />} />
            <Route path="/seller/listings" element={<SellerListings />} />
            <Route path="/saved-listings" element={<SavedListings />} />
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
          </Route>

          {/* Admin Routes - Protected */}
          <Route element={<ProtectedRoute allowedRoles={['Admin', 'Moderator']} />}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/products" element={<AdminProducts />} />
            <Route path="/admin/customers" element={<AdminCustomers />} />
            <Route path="/admin/orders" element={<AdminOrders />} />
            <Route path="/admin/listings" element={<AdminListing />} />
            <Route path="/admin/categories" element={<AdminCategory />} />
          </Route>
        </Routes>
        </CartProvider>
        </SearchProvider>
        </ToastProvider>
      </Router>
    </Provider>
  )
}

export default App
