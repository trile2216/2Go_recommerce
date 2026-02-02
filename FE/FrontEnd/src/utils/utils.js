// Admin Utility Functions

/**
 * Format price to Vietnamese Dong
 */
export const formatPrice = (price) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(price);
};

/**
 * Format date to DD/MM/YYYY
 */
export const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('vi-VN');
};

/**
 * Get status color class
 */
export const getStatusColor = (status) => {
  switch (status?.toLowerCase()) {
    case 'completed':
    case 'active':
      return 'badge-success';
    case 'pending':
    case 'processing':
      return 'badge-warning';
    case 'inactive':
      return 'badge-secondary';
    case 'cancelled':
    case 'failed':
      return 'badge-danger';
    default:
      return 'badge-info';
  }
};

/**
 * Get user initials from name
 */
export const getInitials = (fullName) => {
  if (!fullName) return 'U';
  return fullName
    .split(' ')
    .slice(-2)
    .map(n => n.charAt(0).toUpperCase())
    .join('');
};

/**
 * Truncate text to specified length
 */
export const truncateText = (text, length = 50) => {
  if (text.length > length) {
    return text.substring(0, length) + '...';
  }
  return text;
};

/**
 * Generate random ID
 */
export const generateId = () => {
  return Math.random().toString(36).substr(2, 9);
};

/**
 * Check if user is admin (can be extended)
 */
export const isAdmin = (user) => {
  return user?.role === 'admin' || user?.isAdmin === true;
};

/**
 * Format number with commas
 */
export const formatNumber = (num) => {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

/**
 * Calculate percentage
 */
export const calculatePercentage = (current, total) => {
  if (total === 0) return 0;
  return Math.round((current / total) * 100);
};

/**
 * Get time ago string
 */
export const getTimeAgo = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now - date);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
};

/**
 * Validate email
 */
export const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

/**
 * Validate phone
 */
export const validatePhone = (phone) => {
  const re = /^(\+84|0)[0-9]{9,10}$/;
  return re.test(phone);
};

/**
 * Deep clone object
 */
export const deepClone = (obj) => {
  return JSON.parse(JSON.stringify(obj));
};

/**
 * Debounce function
 */
export const debounce = (func, delay) => {
  let timeoutId;
  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

/**
 * Throttle function
 */
export const throttle = (func, delay) => {
  let lastCall = 0;
  return function (...args) {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      func(...args);
    }
  };
};

export default {
  formatPrice,
  formatDate,
  getStatusColor,
  getInitials,
  truncateText,
  generateId,
  isAdmin,
  formatNumber,
  calculatePercentage,
  getTimeAgo,
  validateEmail,
  validatePhone,
  deepClone,
  debounce,
  throttle
};
