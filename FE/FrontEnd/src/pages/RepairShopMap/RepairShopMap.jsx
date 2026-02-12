import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { getUserLocationWithAddress } from '../../service/location/api.location';
import { repairShops } from '../../data/repairShopsData';
import './RepairShopMap.css';
import Header from '../../components/Header'; // Assuming we want Header here
import { AlertCircle, MapPin, Navigation, Phone, Star, Clock, Wrench } from 'lucide-react';

// Fix for default Leaflet icons not showing in React/Vite/Webpack
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

// Custom icons
const userIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

const shopIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

// Haversine formula to calculate distance (in km)
const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in km
    return d;
};

const deg2rad = (deg) => {
    return deg * (Math.PI / 180);
};

// Component to fly to location when selected
const FlyToLocation = ({ center }) => {
    const map = useMap();
    useEffect(() => {
        if (center) {
            map.flyTo(center, 15, {
                duration: 1.5
            });
        }
    }, [center, map]);
    return null;
};

const RepairShopMap = () => {
    const [userLocation, setUserLocation] = useState(null);
    const [shopsWithDistance, setShopsWithDistance] = useState([]);
    const [selectedShop, setSelectedShop] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Default center (Ho Chi Minh City)
    const defaultCenter = [10.762622, 106.660172];

    useEffect(() => {
        const initMap = async () => {
            try {
                setLoading(true);
                // Get user location
                const locationData = await getUserLocationWithAddress();
                const userLat = locationData.coordinates.latitude;
                const userLon = locationData.coordinates.longitude;

                setUserLocation([userLat, userLon]);

                // Calculate distances and sort shops
                const shops = repairShops.map(shop => {
                    const distance = calculateDistance(userLat, userLon, shop.latitude, shop.longitude);
                    return { ...shop, distance };
                }).sort((a, b) => a.distance - b.distance);

                setShopsWithDistance(shops);
                setLoading(false);
            } catch (err) {
                console.error("Error getting location:", err);
                setError("Không thể lấy vị trí của bạn. Vui lòng kiểm tra quyền truy cập vị trí.");
                
                // Fallback: Show shops calculated from default center if user location fails
                const shops = repairShops.map(shop => {
                    const distance = calculateDistance(defaultCenter[0], defaultCenter[1], shop.latitude, shop.longitude);
                    return { ...shop, distance: null }; // Unknown distance
                });
                setShopsWithDistance(shops);
                setLoading(false);
            }
        };

        const timer = setTimeout(() => {
            initMap();
        }, 500); // Small delay to ensure component mount

        return () => clearTimeout(timer);
    }, []);

    const handleShopClick = (shop) => {
        setSelectedShop(shop);
    };

    return (
        <div className="page-wrapper">
             <Header />
            <div className="repair-shop-map-container">
                {/* Sidebar List */}
                <div className="map-sidebar">
                    <div className="sidebar-header">
                        <h2>Tìm Tiệm Sửa Chữa</h2>
                        <p className="sidebar-subtitle">
                            {userLocation ? 'Gần vị trí của bạn nhất' : 'Danh sách tiệm sửa chữa'}
                        </p>
                    </div>

                    <div className="shop-list">
                        {loading ? (
                            <div className="p-4 text-center">Đang tải bản đồ...</div>
                        ) : (
                            shopsWithDistance.map(shop => (
                                <div 
                                    key={shop.id} 
                                    className={`shop-item ${selectedShop?.id === shop.id ? 'active' : ''}`}
                                    onClick={() => handleShopClick(shop)}
                                >
                                    <div className="shop-name">{shop.name}</div>
                                    <div className="shop-address">
                                        <MapPin size={16} className="mt-1 flex-shrink-0" />
                                        <span>{shop.address}</span>
                                    </div>
                                    <div className="shop-meta">
                                        <div className="shop-rating">
                                            <Star size={14} fill="#faad14" color="#faad14" />
                                            <span>{shop.rating}</span>
                                        </div>
                                        {shop.distance !== null && (
                                            <div className="shop-distance">
                                                {shop.distance.toFixed(2)} km
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Map Area */}
                <div className="map-area">
                    {loading ? (
                        <div className="map-loading">
                            <div className="loader"></div>
                            <p>Đang tìm vị trí của bạn...</p>
                        </div>
                    ) : (
                        <MapContainer 
                            center={userLocation || defaultCenter} 
                            zoom={13} 
                            scrollWheelZoom={true}
                        >
                            <TileLayer
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            />

                            <FlyToLocation center={selectedShop ? [selectedShop.latitude, selectedShop.longitude] : userLocation} />

                            {/* User Marker */}
                            {userLocation && (
                                <Marker position={userLocation} icon={userIcon}>
                                    <Popup>
                                        <div className="font-weight-bold">Vị trí của bạn</div>
                                    </Popup>
                                </Marker>
                            )}

                            {/* Shop Markers */}
                            {shopsWithDistance.map(shop => (
                                <Marker 
                                    key={shop.id} 
                                    position={[shop.latitude, shop.longitude]} 
                                    icon={shopIcon}
                                    eventHandlers={{
                                        click: () => handleShopClick(shop),
                                    }}
                                >
                                    <Popup className="custom-popup">
                                        <div className="popup-header">
                                            {shop.name}
                                        </div>
                                        <div className="popup-body">
                                            <div className="popup-info-row">
                                                <MapPin size={16} />
                                                <span>{shop.address}</span>
                                            </div>
                                            <div className="popup-info-row">
                                                <AlertCircle size={16} /> {/* Should be Phone icon but reused generic for now if needed, using custom */}
                                                 <span>{shop.phone}</span>
                                            </div>
                                            <div className="popup-info-row">
                                                 <Clock size={16} />
                                                 <span>{shop.openHours}</span>
                                            </div>
                                            
                                            <div className="popup-services">
                                                {shop.services.map((service, idx) => (
                                                    <span key={idx} className="service-tag">{service}</span>
                                                ))}
                                            </div>

                                            <div className="popup-actions">
                                                <a 
                                                    href={`https://www.google.com/maps/dir/?api=1&destination=${shop.latitude},${shop.longitude}`} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                    className="direction-btn"
                                                >
                                                    <Navigation size={16} />
                                                    Chỉ đường
                                                </a>
                                            </div>
                                        </div>
                                    </Popup>
                                </Marker>
                            ))}
                        </MapContainer>
                    )}
                </div>
            </div>
        </div>
    );
};

export default RepairShopMap;
