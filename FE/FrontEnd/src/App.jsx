import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Provider } from 'react-redux';
import store from './store';
import './App.css'
import Homepage from './pages/Homepage/Homepage';
import Login from './pages/Auth/Login/Login';
import Register from './pages/Auth/Register/Register';
import ProductDetail from './pages/PostDetail/ProductDetail';
import Compare from './pages/ComparePage/Compare';

function App() {
  return (
    <Provider store={store}>
      <Router>
        <Routes>
          <Route path="/" element={<Homepage />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/compare" element={<Compare />} />
          <Route path="/auth/login" element={<Login />} />
          <Route path="/auth/register" element={<Register />} />
        </Routes>
      </Router>
    </Provider>
  )
}

export default App
