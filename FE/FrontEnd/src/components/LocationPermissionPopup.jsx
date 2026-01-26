import { useState, useEffect } from "react";
import { MapPin, X, Loader2 } from "lucide-react";
import { getUserLocationWithAddress } from "../service/location/api.location";

export default function LocationPermissionPopup() {
  const [showLocationPermission, setShowLocationPermission] = useState(false);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

  // Check if we should show location permission popup
  useEffect(() => {
    const locationPermissionAsked = localStorage.getItem('locationPermissionAsked');
    const locationPermissionGranted = localStorage.getItem('locationPermissionGranted');
    
    if (!locationPermissionAsked && 'geolocation' in navigator) {
      // First time - show popup after a short delay for better UX
      const timer = setTimeout(() => {
        setShowLocationPermission(true);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (locationPermissionGranted === 'true' && 'geolocation' in navigator) {
      // User already granted permission - automatically get location in background
      const updateLocation = async () => {
        try {
          console.log('Auto-updating user location...');
          const locationData = await getUserLocationWithAddress({
            enableHighAccuracy: false,
            timeout: 15000,
            maximumAge: 300000
          });
          
          // Update location data in localStorage
          localStorage.setItem('userLocation', JSON.stringify(locationData));
          console.log('Location auto-updated:', locationData);
          
          // Dispatch custom event to notify other components
          window.dispatchEvent(new Event('locationUpdated'));
        } catch (error) {
          console.warn('Failed to auto-update location:', error);
          // Don't show error to user, just log it
        }
      };
      
      // Update location after a delay to not block initial page load
      const timer = setTimeout(updateLocation, 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAllowLocation = async () => {
    setIsLoadingLocation(true);
    
    try {
      // Pass custom options for faster location retrieval
      const locationData = await getUserLocationWithAddress({
        enableHighAccuracy: false, // Use network location (faster)
        timeout: 15000, // 15 seconds timeout
        maximumAge: 300000 // Accept cached position up to 5 minutes
      });
      
      // Save location data to localStorage
      localStorage.setItem('userLocation', JSON.stringify(locationData));
      localStorage.setItem('locationPermissionAsked', 'true');
      localStorage.setItem('locationPermissionGranted', 'true');
      
      // Dispatch custom event to notify other components
      window.dispatchEvent(new Event('locationUpdated'));
            
      setShowLocationPermission(false);
    } catch (error) {
      // Error or denied
      console.error('Location access denied or error:', error);
      
      // Show more specific error messages
      let errorMessage = 'Không thể lấy vị trí của bạn. ';
      
      if (error.code === 1) {
        errorMessage += 'Vui lòng cho phép quyền truy cập vị trí trong trình duyệt.';
      } else if (error.code === 2) {
        errorMessage += 'Không thể xác định vị trí. Vui lòng kiểm tra kết nối mạng.';
      } else if (error.code === 3) {
        errorMessage += 'Quá thời gian chờ. Vui lòng thử lại.';
      } else {
        errorMessage += 'Vui lòng thử lại sau.';
      }
      
      localStorage.setItem('locationPermissionAsked', 'true');
      localStorage.setItem('locationPermissionGranted', 'false');
      setShowLocationPermission(false);
      
      alert(errorMessage);
    } finally {
      setIsLoadingLocation(false);
    }
  };

  const handleDenyLocation = () => {
    localStorage.setItem('locationPermissionAsked', 'true');
    localStorage.setItem('locationPermissionGranted', 'false');
    setShowLocationPermission(false);
  };

  if (!showLocationPermission) {
    return null;
  }

  return (
    <div className="location-permission-overlay">
      <div className="location-permission-popup">
        <div className="permission-icon">
          <MapPin size={48} />
        </div>
        <h2 className="permission-title">Cho phép truy cập vị trí của bạn?</h2>
        <p className="permission-description">
          Chúng tôi sử dụng vị trí của bạn để hiển thị các sản phẩm gần bạn nhất và mang đến trải nghiệm mua sắm tốt hơn.
        </p>
        <div className="permission-actions">
          <button 
            className="permission-btn deny-btn"
            onClick={handleDenyLocation}
            disabled={isLoadingLocation}
          >
            Không, cảm ơn
          </button>
          <button 
            className="permission-btn allow-btn"
            onClick={handleAllowLocation}
            disabled={isLoadingLocation}
          >
            {isLoadingLocation ? (
              <>
                <Loader2 size={18} className="spinner" />
                Đang lấy vị trí...
              </>
            ) : (
              <>
                <MapPin size={18} />
                Cho phép
              </>
            )}
          </button>
        </div>
        <button 
          className="permission-close"
          onClick={handleDenyLocation}
          aria-label="Đóng"
        >
          <X size={20} />
        </button>
      </div>
    </div>
  );
}
