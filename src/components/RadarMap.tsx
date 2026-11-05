'use client';

import React, { useEffect, useRef } from 'react';
import { NearbyOutbreakItem } from '@/types/api';

interface RadarMapProps {
  centerLat: number;
  centerLng: number;
  radiusKm: number;
  reports: NearbyOutbreakItem[];
  onSelectReport?: (report: NearbyOutbreakItem) => void;
}

export default function RadarMap({
  centerLat,
  centerLng,
  radiusKm,
  reports,
  onSelectReport,
}: RadarMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);

  useEffect(() => {
    let isMounted = true;

    async function initMap() {
      if (typeof window === 'undefined' || !mapContainerRef.current) return;

      const L = (await import('leaflet')).default;

      // Ensure container isn't already initialized
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      // Initialize Map
      const map = L.map(mapContainerRef.current).setView([centerLat, centerLng], 12);
      mapInstanceRef.current = map;

      // Base Tile Layer (OpenStreetMap CartoDB Positron for clean contrast)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 18,
      }).addTo(map);

      // Farmer Current Location Icon
      const farmerIcon = L.divIcon({
        className: 'custom-farmer-pin',
        html: `
          <div style="position: relative; width: 24px; height: 24px;">
            <div style="position: absolute; width: 24px; height: 24px; background-color: #10b981; border-radius: 50%; opacity: 0.4; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
            <div style="position: absolute; top: 4px; left: 4px; width: 16px; height: 16px; background-color: #047857; border: 2px solid white; border-radius: 50%; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>
          </div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      L.marker([centerLat, centerLng], { icon: farmerIcon })
        .addTo(map)
        .bindPopup(`
          <div style="font-family: sans-serif; font-size: 12px; padding: 4px;">
            <strong style="color: #065f46;">📍 Your Farm Location</strong><br/>
            Lat: ${centerLat.toFixed(3)}, Lng: ${centerLng.toFixed(3)}
          </div>
        `);

      // 5.0 km Perimeter Circle
      L.circle([centerLat, centerLng], {
        radius: radiusKm * 1000,
        color: '#10b981',
        fillColor: '#10b981',
        fillOpacity: 0.08,
        weight: 2,
        dashArray: '5, 5',
      }).addTo(map);

      // Plot nearby outbreak reports
      reports.forEach((rep) => {
        const isSevere = rep.severity === 'severe';
        const isMod = rep.severity === 'moderate';
        const pinColor = isSevere ? '#ef4444' : isMod ? '#f59e0b' : '#10b981';

        const outbreakIcon = L.divIcon({
          className: 'outbreak-pin',
          html: `
            <div style="background-color: ${pinColor}; width: 18px; height: 18px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; color: white; font-size: 10px; font-weight: bold;">
              !
            </div>
          `,
          iconSize: [18, 18],
          iconAnchor: [9, 9],
        });

        const marker = L.marker(
          [rep.approximateLocation.latitude, rep.approximateLocation.longitude],
          { icon: outbreakIcon }
        ).addTo(map);

        marker.bindPopup(`
          <div style="font-family: sans-serif; font-size: 12px; min-width: 170px; padding: 4px;">
            <span style="background: ${pinColor}; color: white; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: bold; text-transform: uppercase;">
              ${rep.severity}
            </span>
            <h4 style="margin: 6px 0 2px 0; font-size: 13px; font-weight: bold; color: #1f2937;">
              ${rep.diseaseNameEn}
            </h4>
            <div style="color: #4b5563; font-size: 11px; margin-bottom: 4px;">
              ${rep.diseaseNameTe}
            </div>
            <div style="font-size: 11px; color: #6b7280;">
              Crop: <strong>${rep.crop}</strong><br/>
              Distance: <strong>${rep.distanceKm} km</strong><br/>
              Reported: <strong>${rep.reportedDaysAgo} days ago</strong>
            </div>
          </div>
        `);

        if (onSelectReport) {
          marker.on('click', () => onSelectReport(rep));
        }
      });
    }

    initMap();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [centerLat, centerLng, radiusKm, reports, onSelectReport]);

  return (
    <div className="relative w-full h-full min-h-[420px] rounded-2xl overflow-hidden shadow-inner border border-stone-200 dark:border-stone-800">
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Map Legend Overlay */}
      <div className="absolute bottom-3 left-3 z-10 bg-white/95 dark:bg-stone-900/95 backdrop-blur-md px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-800 text-xs shadow-md space-y-1.5">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-emerald-600 border border-white" />
          <span className="text-stone-700 dark:text-stone-300 font-medium">Your Farm (Center)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-red-500 border border-white" />
          <span className="text-stone-700 dark:text-stone-300">Severe Outbreak</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-amber-500 border border-white" />
          <span className="text-stone-700 dark:text-stone-300">Moderate Alert</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-0.5 border-t-2 border-dashed border-emerald-500 inline-block" />
          <span className="text-stone-500 dark:text-stone-400">5.0 km Perimeter</span>
        </div>
      </div>
    </div>
  );
}
