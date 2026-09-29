import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import { getNearbyWells } from '../../services/api';
import type { Well } from '../../types';

// Fix for default marker icon in Vite
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

L.Icon.Default.mergeOptions({ iconRetinaUrl, iconUrl, shadowUrl });

const activeIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
});

const historicalIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
});

const ACTIVE_WELL_COORDS: [number, number] = [27.015, 95.020];

interface MapProps {
  radius: number;
  selectedWellId: string | null;
  onSelectWell: (id: string) => void;
}

const MapUpdater = ({ center, radius }: { center: [number, number]; radius: number }) => {
  const map = useMap();
  useEffect(() => {
    const bounds = new L.LatLng(center[0], center[1]).toBounds(radius * 1000 * 2.5);
    map.fitBounds(bounds, { padding: [20, 20] });
  }, [map, center, radius]);
  return null;
};

export const NearbyWellMap: React.FC<MapProps> = ({ radius, selectedWellId, onSelectWell }) => {
  const [wells, setWells] = useState<Well[]>([]);

  useEffect(() => {
    getNearbyWells(ACTIVE_WELL_COORDS[0], ACTIVE_WELL_COORDS[1], radius)
      .then(data => setWells(data.filter(w => w.id !== 'WELL-A')))
      .catch(() => {});
  }, [radius]);

  return (
    <MapContainer
      center={ACTIVE_WELL_COORDS}
      zoom={11}
      style={{ height: '100%', width: '100%', background: '#0a0e17' }}
      className="z-0"
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
      />
      
      <MapUpdater center={ACTIVE_WELL_COORDS} radius={radius} />

      <Circle
        center={ACTIVE_WELL_COORDS}
        radius={radius * 1000}
        pathOptions={{ color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.08, weight: 1 }}
      />

      <Marker position={ACTIVE_WELL_COORDS} icon={activeIcon}>
        <Popup>
          <div className="font-bold text-gray-900">WELL-A (Active)</div>
          <div className="text-sm text-gray-600">Development Well</div>
        </Popup>
      </Marker>

      {wells.map(well => (
        <Marker
          key={well.id}
          position={[well.latitude, well.longitude]}
          icon={historicalIcon}
          eventHandlers={{ click: () => onSelectWell(well.id) }}
        >
          <Popup>
            <div className="font-bold text-gray-900">{well.id} - {well.name}</div>
            <div className="text-sm text-gray-600">Depth: {well.total_depth.toFixed(0)}m</div>
            <div className="text-sm text-gray-600">Type: {well.well_type}</div>
            <div className="text-sm text-gray-600">Status: {well.status}</div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
};
