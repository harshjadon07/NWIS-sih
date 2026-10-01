import re

content = """import React, { useEffect, useState, useRef } from 'react';
import { APIProvider, Map, AdvancedMarker, Pin, useMap, InfoWindow } from '@vis.gl/react-google-maps';
import { getNearbyWells } from '../../services/api';
import type { Well } from '../../types';

const ACTIVE_WELL_COORDS = { lat: 27.015, lng: 95.020 };

interface MapProps {
  radius: number;
  selectedWellId: string | null;
  onSelectWell: (id: string) => void;
}

const CircleComponent = ({ center, radius }: { center: google.maps.LatLngLiteral; radius: number }) => {
  const map = useMap();
  const circleRef = useRef<google.maps.Circle | null>(null);

  useEffect(() => {
    if (!map) return;
    if (!circleRef.current) {
      circleRef.current = new window.google.maps.Circle({
        strokeColor: '#3b82f6',
        strokeOpacity: 1,
        strokeWeight: 1,
        fillColor: '#3b82f6',
        fillOpacity: 0.08,
        map,
        center,
        radius: radius * 1000,
      });
    } else {
      circleRef.current.setRadius(radius * 1000);
      circleRef.current.setCenter(center);
    }
  }, [map, center, radius]);

  return null;
};

const BoundsUpdater = ({ center, radius }: { center: google.maps.LatLngLiteral; radius: number }) => {
  const map = useMap();
  useEffect(() => {
    if (!map) return;
    const r = radius * 1000;
    // rough approximation of bounds based on radius in meters
    const latDiff = r / 111320;
    const lngDiff = r / (40075000 * Math.cos(center.lat * Math.PI / 180) / 360);
    const bounds = new window.google.maps.LatLngBounds(
      { lat: center.lat - latDiff, lng: center.lng - lngDiff },
      { lat: center.lat + latDiff, lng: center.lng + lngDiff }
    );
    map.fitBounds(bounds, 20); // 20px padding
  }, [map, center, radius]);
  return null;
};

export const NearbyWellMap: React.FC<MapProps> = ({ radius, selectedWellId, onSelectWell }) => {
  const [wells, setWells] = useState<Well[]>([]);
  const [activeWellPopup, setActiveWellPopup] = useState(false);
  const [popupWell, setPopupWell] = useState<Well | null>(null);

  useEffect(() => {
    getNearbyWells(ACTIVE_WELL_COORDS.lat, ACTIVE_WELL_COORDS.lng, radius)
      .then(data => setWells(data.filter(w => w.id !== 'WELL-A')))
      .catch(() => {});
  }, [radius]);

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "DEMO_MAP_ID";

  if (!import.meta.env.VITE_GOOGLE_MAPS_API_KEY) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-4 text-text-secondary bg-primary">
        <div className="text-xl font-bold text-text-primary mb-2">Google Maps API Key Required</div>
        <p className="mb-4 text-sm">Please set the VITE_GOOGLE_MAPS_API_KEY environment variable in your frontend/.env file.</p>
        <p className="text-xs">You can use the Google Maps Demo Key for prototyping. Go to https://mapsplatform.google.com/maps-demo-key to get one.</p>
      </div>
    );
  }

  return (
    <APIProvider apiKey={apiKey}>
      <Map
        defaultCenter={ACTIVE_WELL_COORDS}
        defaultZoom={11}
        mapId="DEMO_MAP_ID"
        style={{ width: '100%', height: '100%' }}
        disableDefaultUI={true}
        zoomControl={true}
        internalUsageAttributionIds={["gmp_git_agentskills_v1"]}
      >
        <BoundsUpdater center={ACTIVE_WELL_COORDS} radius={radius} />
        <CircleComponent center={ACTIVE_WELL_COORDS} radius={radius} />

        <AdvancedMarker 
          position={ACTIVE_WELL_COORDS} 
          onClick={() => setActiveWellPopup(true)}
          title="WELL-A"
        >
          <Pin background="#10b981" borderColor="#047857" glyphColor="#fff" />
        </AdvancedMarker>

        {activeWellPopup && (
          <InfoWindow 
            position={ACTIVE_WELL_COORDS} 
            onCloseClick={() => setActiveWellPopup(false)}
            pixelOffset={[0, -30]}
          >
            <div className="text-gray-900 min-w-[120px]">
              <div className="font-bold text-sm">WELL-A (Active)</div>
              <div className="text-xs text-gray-600">Development Well</div>
            </div>
          </InfoWindow>
        )}

        {wells.map(well => (
          <AdvancedMarker
            key={well.id}
            position={{ lat: well.latitude, lng: well.longitude }}
            onClick={() => {
              onSelectWell(well.id);
              setPopupWell(well);
            }}
            title={well.name}
          >
            <Pin background="#3b82f6" borderColor="#1d4ed8" glyphColor="#fff" />
          </AdvancedMarker>
        ))}

        {popupWell && (
          <InfoWindow 
            position={{ lat: popupWell.latitude, lng: popupWell.longitude }}
            onCloseClick={() => setPopupWell(null)}
            pixelOffset={[0, -30]}
          >
            <div className="text-gray-900 min-w-[150px]">
              <div className="font-bold text-sm mb-1">{popupWell.id} - {popupWell.name}</div>
              <div className="text-xs text-gray-600 mb-0.5">Depth: {popupWell.total_depth.toFixed(0)}m</div>
              <div className="text-xs text-gray-600 mb-0.5">Type: {popupWell.well_type}</div>
              <div className="text-xs text-gray-600">Status: {popupWell.status}</div>
            </div>
          </InfoWindow>
        )}
      </Map>
    </APIProvider>
  );
};
"""

with open(r"C:\Users\harsh\Desktop\sih 26121\frontend\src\components\Map\NearbyWellMap.tsx", "w", encoding="utf-8") as f:
    f.write(content)
