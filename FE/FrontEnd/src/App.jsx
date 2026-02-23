import { createBrowserRouter, RouterProvider, Outlet } from 'react-router-dom';
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
import AIChatFloating from './components/AIChatFloating';
import ScrollToTop from './components/ScrollToTop';

// Admin Pages
import AdminDashboard from './pages/Admin/AdminDashboard/AdminDashboard';
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
import SellerListingDetail from './pages/SellerListingDetail/SellerListingDetail';
import SavedListings from './pages/SavedListings/SavedListings';
import MyReviews from './pages/MyReviews/MyReviews';
import Plan from './pages/Admin/Plan/Plan';
import RepairShopMap from './pages/RepairShopMap/RepairShopMap';
import SubscriptionPlans from './pages/Subscription/SubscriptionPlans';
import AdminReports from './pages/Admin/AdminReport/AdminReports';
import AdminMarketPrice from './pages/Admin/AdminMarketPrice/AdminMarketPrice';
import MyReports from './pages/MyReports/MyReports';
import AdminListingDetail from './pages/Admin/AdminListing/AdminListingDetail';
import AdminCustomerDetail from './pages/Admin/AdminCustomer/AdminCustomerDetail';

// Moderator Pages
import ModUsers from './pages/Mod/ModUsers/ModUsers';
import ModListings from './pages/Mod/ModListings/ModListings';
import ModReports from './pages/Mod/ModReports/ModReports';

const RootLayout = () => {
  return (
    <>
      <ScrollToTop />
      <CompareFloatingButton />
      <AIChatFloating />
      <Outlet />
    </>
  );
};

const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      { path: "/", element: <Homepage /> },
      { path: "/auth/login", element: <Login /> },
      { path: "/auth/register", element: <Register /> },
      { path: "/listings/:id", element: <ProductDetail /> },
      { path: "/compare", element: <Compare /> },
      { path: "/listings", element: <Listings /> },
      { path: "/repair-shops", element: <RepairShopMap /> },
      { 
        path: "/subscription-plans", 
        element: (
          <UserLayout>
            <SubscriptionPlans />
          </UserLayout>
        ) 
      },
      
      // Protected Routes - Requires login
      {
        element: <ProtectedRoute allowedRoles={['User']} />,
        children: [
          { path: "/user/info", element: <UserInfo /> },
          { path: "/orders", element: <Orders /> },
          { path: "/orders/:orderId", element: <OrderDetail /> },
          { path: "/checkout", element: <Checkout /> },
          { path: "/payment/result", element: <PaymentResult /> },
          { path: "/seller/listings", element: <SellerListings /> },
          { path: "/seller/listings/:id", element: <SellerListingDetail /> },
          { path: "/saved-listings", element: <SavedListings /> },
          { path: "/reviews", element: <MyReviews /> },
          { path: "/reports", element: <MyReports /> },
          { 
            path: "/post/listing", 
            element: (
              <UserLayout>
                <PostListing />
              </UserLayout>
            )
          },
          { 
            path: "/chat/:chatId?", 
            element: (
              <UserLayout>
                <Chat />
              </UserLayout>
            )
          },
        ]
      },

      // Admin Routes - Protected
      {
        element: <ProtectedRoute allowedRoles={['Admin', 'Moderator']} />,
        children: [
          { path: "/admin", element: <AdminDashboard /> },
          { path: "/admin/reports", element: <AdminReports /> },
          { path: "/admin/customers", element: <AdminCustomers /> },
          { path: "/admin/orders", element: <AdminOrders /> },
          { path: "/admin/listings", element: <AdminListing /> },
          { path: "/admin/listings/:id", element: <AdminListingDetail /> },
          { path: "/admin/customers/:id", element: <AdminCustomerDetail /> },
          { path: "/admin/categories", element: <AdminCategory /> },
          { path: "/admin/plans", element: <Plan /> },
          { path: "/admin/market-prices", element: <AdminMarketPrice /> },
        ]
      },

      // Moderator Routes - Protected
      {
        element: <ProtectedRoute allowedRoles={['Admin', 'Manager']} />,
        children: [
          { path: "/mod/users", element: <ModUsers /> },
          { path: "/mod/listings", element: <ModListings /> },
          { path: "/mod/reports", element: <ModReports /> },
        ]
      }
    ]
  }
]);

function App() {
  return (
    <Provider store={store}>
      <ToastProvider>
        <SearchProvider>
          <CartProvider>
            <RouterProvider router={router} />
          </CartProvider>
        </SearchProvider>
      </ToastProvider>
    </Provider>
  )
}

export default App
