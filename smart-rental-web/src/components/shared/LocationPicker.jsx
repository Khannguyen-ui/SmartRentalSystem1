// src/components/shared/LocationPicker.jsx
import React, { useState, useMemo, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import { GeoSearchControl, EsriProvider } from 'leaflet-geosearch'; // Đổi sang EsriProvider
import { Button, message, Tooltip } from 'antd';
import { AimOutlined } from '@ant-design/icons'; // Icon định vị
import L from 'leaflet';

// Import CSS
import 'leaflet/dist/leaflet.css';
import 'leaflet-geosearch/dist/geosearch.css';

// Fix lỗi icon mặc định
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// 1. Component để Map bay đến vị trí mới
const MapUpdater = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.flyTo(center, 16, { animate: true });
    }
  }, [center, map]);
  return null;
};

// 2. Thanh tìm kiếm (Dùng Esri thay vì OSM)
const SearchControl = ({ onResult }) => {
  const map = useMap();

  useEffect(() => {
    // EsriProvider thường tìm địa chỉ VN tốt hơn Nominatim
    const provider = new EsriProvider(); 

    const searchControl = new GeoSearchControl({
      provider: provider,
      style: 'bar',
      autoComplete: true, 
      autoCompleteDelay: 250,
      showMarker: false, 
      retainZoomLevel: false,
      animateZoom: true,
      keepResult: false,
      searchLabel: 'Nhập địa chỉ hoặc địa điểm nổi tiếng gần đó...',
    });

    map.addControl(searchControl);

    const handleShowLocation = (result) => {
        if (result && result.location) {
            onResult({ lat: result.location.y, lng: result.location.x });
        }
    };

    map.on('geosearch/showlocation', handleShowLocation);

    return () => {
        map.removeControl(searchControl);
        map.off('geosearch/showlocation', handleShowLocation);
    };
  }, [map, onResult]);

  return null;
};

// 3. Marker Kéo thả
function DraggableMarker({ position, setPosition, onLocationChange }) {
    const markerRef = React.useRef(null);
    const eventHandlers = useMemo(
        () => ({
            dragend() {
                const marker = markerRef.current;
                if (marker != null) {
                    const newPos = marker.getLatLng();
                    setPosition(newPos);
                    onLocationChange(newPos.lat, newPos.lng);
                }
            },
        }),
        [onLocationChange, setPosition],
    );

    return <Marker draggable={true} eventHandlers={eventHandlers} position={position} ref={markerRef} />;
}

// --- COMPONENT CHÍNH ---
const LocationPicker = ({ onCoordinatesChange, initialLat = 10.7769, initialLng = 106.7009 }) => {
    const [position, setPosition] = useState({ lat: initialLat, lng: initialLng });

    // Hàm cập nhật vị trí chung
    const updatePosition = (lat, lng) => {
        const newPos = { lat: parseFloat(lat), lng: parseFloat(lng) };
        setPosition(newPos);
        onCoordinatesChange(newPos.lat, newPos.lng);
    };

    // Xử lý nút "Lấy vị trí hiện tại"
    const handleGetCurrentLocation = () => {
        if (!navigator.geolocation) {
            message.error("Trình duyệt không hỗ trợ định vị!");
            return;
        }
        
        message.loading({ content: "Đang lấy vị trí...", key: "loc" });
        
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const { latitude, longitude } = pos.coords;
                updatePosition(latitude, longitude);
                message.success({ content: "Đã lấy vị trí hiện tại!", key: "loc" });
            },
            (err) => {
                console.error(err);
                message.error({ content: "Không thể lấy vị trí. Hãy cấp quyền truy cập vị trí cho web.", key: "loc" });
            },
            { enableHighAccuracy: true } // Yêu cầu độ chính xác cao nhất (GPS)
        );
    };

    return (
        <div className="w-full">
            <div className="flex justify-between items-end mb-2">
                <div className="text-xs text-gray-500 italic flex-1">
                    * Tìm điểm mốc gần nhà (Trường học, Chợ...) rồi kéo ghim về nhà.
                </div>
                
                {/* Nút định vị GPS */}
                <Tooltip title="Lấy vị trí hiện tại của bạn">
                    <Button 
                        type="primary" 
                        size="small" 
                        icon={<AimOutlined />} 
                        onClick={handleGetCurrentLocation}
                        className="bg-green-600 hover:bg-green-500 border-none shadow-sm"
                    >
                        Vị trí của tôi
                    </Button>
                </Tooltip>
            </div>
            
            <div className="h-[350px] rounded-lg border border-gray-300 relative z-0 overflow-hidden shadow-sm">
                <MapContainer center={position} zoom={13} style={{ height: '100%', width: '100%' }}>
                    <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='&copy; OpenStreetMap contributors'
                    />
                    
                    <MapUpdater center={position} />
                    <SearchControl onResult={(pos) => updatePosition(pos.lat, pos.lng)} />
                    
                    <DraggableMarker 
                        position={position} 
                        setPosition={setPosition} 
                        onLocationChange={onCoordinatesChange} 
                    />
                </MapContainer>
            </div>
            
            <div className="mt-2 text-xs text-gray-400 text-right">
                Tọa độ: {position.lat.toFixed(6)}, {position.lng.toFixed(6)}
            </div>
        </div>
    );
};

export default LocationPicker;