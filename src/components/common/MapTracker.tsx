import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { GPSLocation } from '../../types';

interface MapTrackerProps {
  gpsData: GPSLocation;
  onRateClick?: () => void;
}

export const MapTracker: React.FC<MapTrackerProps> = ({ gpsData, onRateClick }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const busMarkerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Initialize map if not existing
    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        zoomControl: false,
      }).setView([gpsData.currentLat, gpsData.currentLng], 8);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 18,
      }).addTo(map);

      // Add Zoom Control at bottom right
      L.control.zoom({ position: 'bottomright' }).addTo(map);

      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;

    // Clear previous layers except tile layer
    map.eachLayer(layer => {
      if (layer instanceof L.Marker || layer instanceof L.Polyline || layer instanceof L.CircleMarker) {
        map.removeLayer(layer);
      }
    });

    // Draw Route Polyline
    if (gpsData.routeWaypoints && gpsData.routeWaypoints.length > 0) {
      const latLngs: [number, number][] = gpsData.routeWaypoints.map(wp => [wp.lat, wp.lng]);
      const polyline = L.polyline(latLngs, {
        color: '#1A1A1A',
        weight: 4,
        opacity: 0.9,
        dashArray: '6, 6',
      }).addTo(map);

      // Add Stop Markers
      gpsData.routeWaypoints.forEach((wp, idx) => {
        const isTerm = idx === 0 || idx === gpsData.routeWaypoints.length - 1;
        const iconHtml = `<div class="flex items-center justify-center w-6 h-6 border border-[#1A1A1A] ${
          isTerm ? 'bg-[#1A1A1A] text-white font-bold text-[10px]' : 'bg-[#006633] text-white font-bold text-[9px]'
        } shadow-[2px_2px_0px_#1A1A1A]">${idx + 1}</div>`;

        const customIcon = L.divIcon({
          html: iconHtml,
          className: 'custom-stop-marker',
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        });

        L.marker([wp.lat, wp.lng], { icon: customIcon })
          .addTo(map)
          .bindPopup(`<div class="font-bold text-xs uppercase font-serif">${wp.name}</div>`);
      });

      // Fit bounds nicely
      map.fitBounds(polyline.getBounds(), { padding: [30, 30] });
    }

    // Bus Custom Marker
    const busIconHtml = `
      <div class="relative flex items-center justify-center">
        <div class="absolute w-10 h-10 bg-[#006633]/30 rounded-full animate-ping"></div>
        <div class="w-9 h-9 bg-[#006633] text-white flex items-center justify-center border border-[#1A1A1A] shadow-[3px_3px_0px_#1A1A1A]">
          <svg class="w-5 h-5 fill-current" viewBox="0 0 24 24">
            <path d="M4 16c0 .88.39 1.67 1 2.22V20c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h8v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1.78c.61-.55 1-1.34 1-2.22V6c0-3.5-3.58-4-8-4s-8 .5-8 4v10zm3.5 1c-.83 0-1.5-.67-1.5-1.5S6.67 14 7.5 14s1.5.67 1.5 1.5S8.33 17 7.5 17zm9 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm1.5-6H6V6h12v5z"/>
          </svg>
        </div>
      </div>
    `;

    const busIcon = L.divIcon({
      html: busIconHtml,
      className: 'custom-bus-marker',
      iconSize: [36, 36],
      iconAnchor: [18, 18],
    });

    const busMarker = L.marker([gpsData.currentLat, gpsData.currentLng], { icon: busIcon })
      .addTo(map)
      .bindPopup(
        `<div class="p-1 text-xs font-sans">
          <div class="font-bold text-[#006633] uppercase font-mono">${gpsData.busRegistration}</div>
          <div class="text-[#1A1A1A] font-serif italic">${gpsData.route}</div>
          <div class="text-[#1A1A1A]/70 font-mono">Speed: ${gpsData.speedKmH} km/h</div>
        </div>`
      );

    busMarkerRef.current = busMarker;
  }, [gpsData]);

  return (
    <div className="relative w-full h-80 overflow-hidden border border-[#1A1A1A] bg-[#F2EFE9] shadow-[4px_4px_0px_#1A1A1A]">
      <div ref={mapContainerRef} className="w-full h-full z-10" />

      {/* Floating Status Overlay */}
      <div className="absolute top-3 left-3 z-20 bg-[#1A1A1A] text-white p-3.5 border border-[#1A1A1A] shadow-[4px_4px_0px_#006633] max-w-xs text-xs space-y-2">
        <div className="flex items-center justify-between font-bold text-sm text-white">
          <span className="font-mono text-amber-300">{gpsData.busRegistration}</span>
          <span className="bg-[#006633] text-white border border-white/20 text-[9px] px-2 py-0.5 font-mono uppercase tracking-widest font-bold">
            Live GPS
          </span>
        </div>

        <p className="text-slate-300 font-serif italic text-[11px] leading-tight">{gpsData.route}</p>

        {/* Trips Completed & Rating Badges */}
        <div className="flex items-center justify-between pt-1 border-t border-slate-800 text-[10px] font-mono">
          <div className="flex items-center space-x-1 text-emerald-400 font-bold">
            <span>🏁</span>
            <span>{gpsData.busTripsCompletedCount || 342} Trips Taken</span>
          </div>

          <div className="flex items-center space-x-1 bg-amber-400/20 text-amber-300 px-1.5 py-0.5 border border-amber-400/30 rounded-none text-[9px] font-bold">
            <span>★</span>
            <span>{gpsData.ratingStars || 4.8}</span>
            <span className="text-slate-400 font-normal">({gpsData.ratingCount || 156})</span>
          </div>
        </div>

        {/* Speed Metrics */}
        <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800 font-mono text-[10px] uppercase">
          <div>
            <span className="text-slate-400 block text-[8px] tracking-widest">Live Speed</span>
            <span className="text-emerald-400 font-black">{gpsData.speedKmH} km/h</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[8px] tracking-widest">Avg Speed</span>
            <span className="text-white font-bold">{gpsData.averageSpeedKmH || 78} km/h</span>
          </div>
        </div>

        {/* Rate Van Button */}
        {onRateClick && (
          <button
            onClick={onRateClick}
            className="w-full mt-1 bg-amber-400 hover:bg-amber-300 text-slate-900 font-mono font-black text-[9px] py-1.5 px-2 border border-black uppercase tracking-wider transition flex items-center justify-center space-x-1 shadow-[2px_2px_0px_#006633]"
          >
            <span>★ Rate This Trip / Van</span>
          </button>
        )}
      </div>
    </div>
  );
};

