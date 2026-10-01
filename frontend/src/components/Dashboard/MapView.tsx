import React, { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { Hotspot, IndustrialFacility, HotspotReplayItem } from '../../types';
import { Layers, Factory, Flame, Play, Pause, RotateCcw, Activity, Plus, Minus, Target, Clock } from 'lucide-react';
import { apiService } from '../../services/api';

interface Props {
  hotspots: Hotspot[];
  industrialSites: IndustrialFacility[];
  selectedHotspot: Hotspot | null;
  onSelectHotspot: (hotspot: Hotspot) => void;
  onViewIncident?: (hotspot: Hotspot) => void;
}

// Controller to invalidate Leaflet map size on mount and container resize
const MapResizeController: React.FC = () => {
  const map = useMap();
  useEffect(() => {
    map.invalidateSize();
    map.setView([22.5937, 78.9629], 5);
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 250);
    return () => clearTimeout(timer);
  }, [map]);
  return null;
};

// Controller to fly to selected hotspot location when clicked
const MapFocusController: React.FC<{ selectedHotspot: Hotspot | null }> = ({ selectedHotspot }) => {
  const map = useMap();
  useEffect(() => {
    if (selectedHotspot && selectedHotspot.latitude && selectedHotspot.longitude) {
      map.flyTo([selectedHotspot.latitude, selectedHotspot.longitude], 12, { duration: 1.2 });
    }
  }, [selectedHotspot, map]);
  return null;
};

// Map Zoom State Listener for Dynamic Clustering
const ZoomListener: React.FC<{ onZoomChange: (zoom: number) => void }> = ({ onZoomChange }) => {
  const map = useMapEvents({
    zoomend: () => {
      onZoomChange(map.getZoom());
    }
  });
  return null;
};

// Custom Map Control Toolbar (Zoom In, Zoom Out, Center India, Toggle Overlays)
const MapControlToolbar: React.FC<{
  onToggleOverlays: () => void;
  showOverlays: boolean;
}> = ({ onToggleOverlays, showOverlays }) => {
  const map = useMap();
  return (
    <div className="absolute top-3 left-3 z-[400] flex flex-col space-y-1">
      <div className="bg-white/90 dark:bg-slate-950/90 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-xl p-1 shadow-2xl flex flex-col items-center space-y-1 text-slate-800 dark:text-slate-200">
        <button
          onClick={() => map.zoomIn()}
          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800/80 rounded-lg text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
          title="Zoom In"
        >
          <Plus className="w-4 h-4" />
        </button>
        <button
          onClick={() => map.zoomOut()}
          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800/80 rounded-lg text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
          title="Zoom Out"
        >
          <Minus className="w-4 h-4" />
        </button>
        <button
          onClick={() => map.setView([22.5937, 78.9629], 5)}
          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800/80 rounded-lg text-slate-700 dark:text-slate-200 hover:text-amber-600 dark:hover:text-amber-400 transition cursor-pointer"
          title="Center on India"
        >
          <Target className="w-4 h-4" />
        </button>
        <button
          onClick={onToggleOverlays}
          className={`p-2 hover:bg-slate-100 dark:hover:bg-slate-800/80 rounded-lg transition cursor-pointer ${
            showOverlays ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/40' : 'text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white'
          }`}
          title="Map Overlays"
        >
          <Layers className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

/**
 * Creates custom Leaflet DivIcon for thermal observation hotspots strictly based on real FRP intensity
 */
const createHotspotIcon = (hotspot: Hotspot, isSelected: boolean) => {
  const frp = hotspot.frp || 0;
  
  // Real FRP-derived visual intensity scale
  let coreColor = '#facc15'; // Yellow (< 15 MW)
  let outerGlow = 'rgba(250, 204, 21, 0.7)';
  let glowRadius = 8;
  let size = 10;

  if (frp >= 45) {
    coreColor = '#ef4444'; // Red-orange High FRP (> 45 MW)
    outerGlow = 'rgba(239, 68, 68, 0.85)';
    glowRadius = 14;
    size = 14;
  } else if (frp >= 15) {
    coreColor = '#f97316'; // Orange Moderate FRP (15 - 45 MW)
    outerGlow = 'rgba(249, 115, 22, 0.75)';
    glowRadius = 11;
    size = 12;
  }

  if (isSelected) {
    // Clicked hotspot: bright orange focus ring, subtle pulse, slightly larger than normal hotspot
    const containerSize = size + 16;
    const html = `
      <div style="
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        width: ${containerSize}px;
        height: ${containerSize}px;
      ">
        <div style="
          position: absolute;
          inset: 0;
          border-radius: 50%;
          background: rgba(249, 115, 22, 0.25);
          border: 2px solid #f97316;
          box-shadow: 0 0 16px #f97316;
          animation: pulse 1.6s infinite ease-in-out;
        "></div>
        <div style="
          width: ${size + 2}px;
          height: ${size + 2}px;
          background-color: ${coreColor};
          border-radius: 50%;
          border: 2px solid #ffffff;
          box-shadow: 0 0 ${glowRadius + 4}px ${outerGlow};
          position: relative;
          z-index: 10;
        "></div>
      </div>
    `;
    return L.divIcon({
      html,
      className: 'custom-hotspot-selected',
      iconSize: [containerSize, containerSize],
      iconAnchor: [containerSize / 2, containerSize / 2]
    });
  }

  const html = `
    <div style="
      width: ${size}px;
      height: ${size}px;
      background-color: ${coreColor};
      border-radius: 50%;
      border: 1px solid rgba(15, 23, 42, 0.9);
      box-shadow: 0 0 ${glowRadius}px ${outerGlow};
      transition: transform 0.2s ease;
    "></div>
  `;

  return L.divIcon({
    html,
    className: 'custom-hotspot-marker',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2]
  });
};

/**
 * Creates distinct Blue/Cyan factory icons for Industrial Facilities
 */
const createFacilityIcon = () => {
  const html = `
    <div style="
      background-color: #0284c7;
      width: 18px;
      height: 18px;
      border-radius: 5px;
      border: 1px solid #bae6fd;
      box-shadow: 0 0 6px rgba(2, 132, 199, 0.45);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #ffffff;
      font-size: 10px;
      line-height: 1;
    ">
      🏭
    </div>
  `;

  return L.divIcon({
    html,
    className: 'custom-facility-marker',
    iconSize: [18, 18],
    iconAnchor: [9, 9]
  });
};

/**
 * Creates professional thermal cluster marker with dark circular core & subtle ring glow
 */
const createClusterIcon = (count: number, maxFrp: number) => {
  let size = 28;
  let fontSize = 11;
  let glowRadius = 4;
  if (count >= 25) {
    size = 38;
    fontSize = 12;
    glowRadius = 6;
  } else if (count >= 10) {
    size = 32;
    fontSize = 11;
    glowRadius = 5;
  }

  let glowColor = 'rgba(249, 115, 22, 0.35)';
  let ringColor = '#f97316';
  if (maxFrp >= 45) {
    glowColor = 'rgba(239, 68, 68, 0.4)';
    ringColor = '#ef4444';
  } else if (maxFrp < 15) {
    glowColor = 'rgba(234, 179, 8, 0.3)';
    ringColor = '#eab308';
  }

  const html = `
    <div style="
      width: ${size}px;
      height: ${size}px;
      border-radius: 50%;
      background-color: #0f172a;
      border: 1.5px solid ${ringColor};
      box-shadow: 0 0 ${glowRadius}px ${glowColor}, inset 0 0 3px rgba(0, 0, 0, 0.9);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #ffffff;
      font-weight: 800;
      font-size: ${fontSize}px;
      font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
      cursor: pointer;
      user-select: none;
    ">
      <span>${count}</span>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'custom-cluster-marker',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2]
  });
};

export const MapView: React.FC<Props> = ({
  hotspots,
  industrialSites,
  selectedHotspot,
  onSelectHotspot,
  onViewIncident
}) => {
  const [showFacilities, setShowFacilities] = useState(true);
  const [showHotspots, setShowHotspots] = useState(true);
  const [showBoundaries, setShowBoundaries] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  const [showOverlaysPanel, setShowOverlaysPanel] = useState(true);
  const [currentZoom, setCurrentZoom] = useState(5);

  // Replay Mode State
  const [isReplayMode, setIsReplayMode] = useState(false);
  const [replayData, setReplayData] = useState<HotspotReplayItem[]>([]);
  const [replayIndex, setReplayIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [replaySpeed, setReplaySpeed] = useState(1000);

  useEffect(() => {
    if (isReplayMode && replayData.length === 0) {
      apiService.getHotspotReplayData().then((data) => {
        setReplayData(data);
        setReplayIndex(0);
      }).catch(console.error);
    }
  }, [isReplayMode]);

  useEffect(() => {
    let timer: any;
    if (isPlaying && isReplayMode && replayData.length > 0) {
      timer = setInterval(() => {
        setReplayIndex((prev) => {
          if (prev >= replayData.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, replaySpeed);
    }
    return () => clearInterval(timer);
  }, [isPlaying, isReplayMode, replayData, replaySpeed]);

  // Spatial clustering based on real hotspots and zoom level
  const clusteredNodes = useMemo(() => {
    if (currentZoom >= 7 || isReplayMode) {
      return hotspots.map((h) => ({ type: 'single' as const, data: h }));
    }

    const threshold = currentZoom <= 4 ? 1.4 : currentZoom === 5 ? 0.75 : 0.35;
    const result: Array<{ type: 'single'; data: Hotspot } | { type: 'cluster'; count: number; lat: number; lng: number; maxFrp: number; items: Hotspot[] }> = [];
    const visited = new Set<string>();

    hotspots.forEach((item) => {
      if (visited.has(item.hotspot_id)) return;

      const group = hotspots.filter((other) => {
        if (visited.has(other.hotspot_id)) return false;
        const dLat = Math.abs(item.latitude - other.latitude);
        const dLng = Math.abs(item.longitude - other.longitude);
        return dLat < threshold && dLng < threshold;
      });

      if (group.length > 1) {
        group.forEach((g) => visited.add(g.hotspot_id));
        const avgLat = group.reduce((acc, g) => acc + g.latitude, 0) / group.length;
        const avgLng = group.reduce((acc, g) => acc + g.longitude, 0) / group.length;
        const maxFrp = Math.max(...group.map((g) => g.frp || 0));
        result.push({
          type: 'cluster',
          count: group.length,
          lat: avgLat,
          lng: avgLng,
          maxFrp,
          items: group
        });
      } else {
        visited.add(item.hotspot_id);
        result.push({ type: 'single', data: item });
      }
    });

    return result;
  }, [hotspots, currentZoom, isReplayMode]);

  const activeReplayHotspots = isReplayMode ? replayData.slice(0, replayIndex + 1) : [];

  return (
    <div className="relative w-full h-full min-h-[500px] overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl bg-slate-100 dark:bg-slate-950">
      <MapContainer
        center={[22.5937, 78.9629]}
        zoom={5}
        minZoom={3}
        maxZoom={18}
        zoomControl={false}
        scrollWheelZoom={false}
        className="w-full h-full z-0"
      >
        {/* Dark Satellite Imagery Basemap & Boundary Reference Overlay */}
        <TileLayer
          attribution='&copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP'
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          className="map-tile-dark-imagery"
        />
        {(showBoundaries || showLabels) && (
          <TileLayer
            url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"
            pane="shadowPane"
            opacity={0.85}
          />
        )}

        <MapResizeController />
        <MapFocusController selectedHotspot={selectedHotspot} />
        <ZoomListener onZoomChange={(z) => setCurrentZoom(z)} />
        <MapControlToolbar
          onToggleOverlays={() => setShowOverlaysPanel(!showOverlaysPanel)}
          showOverlays={showOverlaysPanel}
        />

        {/* Industrial Facilities Layer (Blue/Cyan Markers) */}
        {showFacilities &&
          industrialSites.map((site) => (
            <Marker
              key={site.facility_id}
              position={[site.latitude, site.longitude]}
              icon={createFacilityIcon()}
            >
              <Popup className="custom-leaflet-popup">
                <div className="p-2 space-y-1.5 text-xs bg-slate-900 text-slate-100 rounded-xl border border-slate-700 min-w-[200px]">
                  <div className="flex items-center space-x-1.5 font-bold text-sky-400 pb-1 border-b border-slate-800">
                    <Factory className="w-4 h-4" />
                    <span>{site.name}</span>
                  </div>
                  <p className="text-slate-300">
                    <strong className="text-slate-400">Type:</strong> {site.facility_type.replace(/_/g, ' ')}
                  </p>
                  {site.operator_owner && (
                    <p className="text-slate-400">
                      <strong className="text-slate-400">Operator:</strong> {site.operator_owner}
                    </p>
                  )}
                  {site.state && (
                    <p className="text-slate-400">
                      <strong className="text-slate-400">Location:</strong> {site.district ? `${site.district}, ` : ''}{site.state}
                    </p>
                  )}
                  <p className="text-[10px] text-slate-500 pt-1 border-t border-slate-800/80">
                    Source: {site.source_dataset}
                  </p>
                </div>
              </Popup>
            </Marker>
          ))}

        {/* Thermal Observations Layer (Real NASA FIRMS Hotspots) */}
        {showHotspots && (
          isReplayMode
            ? activeReplayHotspots.map((item) => (
                <Marker
                  key={item.hotspot_id}
                  position={[item.latitude, item.longitude]}
                  icon={createHotspotIcon(
                    {
                      hotspot_id: item.hotspot_id,
                      source: 'FIRMS',
                      source_dataset: 'NOAA_VIIRS',
                      latitude: item.latitude,
                      longitude: item.longitude,
                      acquisition_datetime: item.acquisition_datetime,
                      satellite: item.satellite,
                      instrument: 'VIIRS',
                      frp: item.frp,
                      deduplication_hash: item.hotspot_id,
                      created_at: item.acquisition_datetime
                    },
                    false
                  )}
                />
              ))
            : clusteredNodes.map((node, i) => {
                if (node.type === 'cluster') {
                  return (
                    <Marker
                      key={`cluster-${i}-${node.lat}-${node.lng}`}
                      position={[node.lat, node.lng]}
                      icon={createClusterIcon(node.count, node.maxFrp)}
                      eventHandlers={{
                        click: () => onSelectHotspot(node.items[0])
                      }}
                    />
                  );
                }

                const hotspot = node.data;
                const isSelected = selectedHotspot?.hotspot_id === hotspot.hotspot_id;
                const probableCls = hotspot.classification?.probable_classification || 'Unclassified Thermal Activity';
                const confidenceScore = hotspot.classification?.confidence_score ?? (hotspot as any).confidence_score;
                const rawConfLevel = hotspot.classification?.confidence_level || 'Moderate';
                const confLevelClean = rawConfLevel.replace(/\s+confidence$/i, '');
                const formattedConfText = `${confLevelClean.charAt(0).toUpperCase()}${confLevelClean.slice(1).toLowerCase()} confidence`;

                return (
                  <Marker
                    key={hotspot.hotspot_id}
                    position={[hotspot.latitude, hotspot.longitude]}
                    icon={createHotspotIcon(hotspot, isSelected)}
                    eventHandlers={{
                      click: () => onSelectHotspot(hotspot)
                    }}
                  >
                    <Popup className="custom-leaflet-popup">
                      {/* OUTER POPUP SHELL - MATCHING IMAGE 2 PROPORTIONS */}
                      <div className="bg-[#0B1120] p-3 sm:p-4 text-slate-100 rounded-[14px] w-[340px] max-w-[calc(100vw-32px)] shadow-2xl relative border border-slate-800/80">
                        
                        {/* INNER BORDERED CARD - MANDATORY SEPARATE CARD */}
                        <div className="bg-[#080D1A] border border-slate-700/80 rounded-xl p-3.5 space-y-3">
                          
                          {/* HEADER: Flame Icon + Classification Title */}
                          <div className="flex items-center space-x-2 pb-2.5 border-b border-slate-800/80">
                            <Flame className="w-4 h-4 text-orange-400 shrink-0" />
                            <span className="text-amber-400 font-bold text-sm truncate">{probableCls}</span>
                          </div>

                          {/* 2-COLUMN TELEMETRY GRID */}
                          <div className="space-y-2 text-xs">
                            <div className="grid grid-cols-[140px_1fr] items-center">
                              <span className="text-slate-400 font-medium">FRP (Thermal Intensity):</span>
                              <span className="font-extrabold text-slate-100 font-mono text-right">
                                {hotspot.frp ? `${hotspot.frp} MW` : 'N/A'}
                              </span>
                            </div>

                            <div className="grid grid-cols-[140px_1fr] items-center">
                              <span className="text-slate-400 font-medium">Satellite Instrument:</span>
                              <span className="font-semibold text-slate-200 font-mono text-right">
                                {hotspot.satellite || 'N21'} ({hotspot.instrument || 'VIIRS'})
                              </span>
                            </div>

                            <div className="grid grid-cols-[140px_1fr] items-center">
                              <span className="text-slate-400 font-medium">Acquisition Datetime:</span>
                              <span className="font-mono text-cyan-300 text-xs text-right whitespace-nowrap">
                                {new Date(hotspot.acquisition_datetime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                              </span>
                            </div>

                            <div className="grid grid-cols-[140px_1fr] items-center">
                              <span className="text-slate-400 font-medium">Evidence Confidence:</span>
                              <span className="font-semibold text-emerald-400 text-right whitespace-nowrap text-xs">
                                {confidenceScore !== undefined && confidenceScore !== null
                                  ? `${confidenceScore <= 1.0 && confidenceScore > 0 ? Math.round(confidenceScore * 100) : Math.round(confidenceScore)}%`
                                  : '55%'}
                                <span className="font-sans font-normal ml-1">
                                  ({formattedConfText})
                                </span>
                              </span>
                            </div>
                          </div>

                          {/* NEAREST FACILITY SECTION */}
                          {hotspot.classification?.nearest_facility_name && (
                            <div className="pt-2.5 border-t border-slate-800/80 space-y-0.5 text-xs">
                              <span className="text-slate-400 font-medium block">Nearest Facility:</span>
                              <div className="font-bold text-blue-300 block truncate">
                                {hotspot.classification.nearest_facility_name}
                                {hotspot.classification.distance_to_nearest_facility_km !== undefined && (
                                  <span className="text-slate-400 font-normal font-mono ml-1">
                                    ({hotspot.classification.distance_to_nearest_facility_km.toFixed(2)} km)
                                  </span>
                                )}
                              </div>
                            </div>
                          )}

                          {/* ACTION CTA BUTTON */}
                          <button
                            onClick={() => {
                              if (onViewIncident) {
                                onViewIncident(hotspot);
                              } else {
                                onSelectHotspot(hotspot);
                              }
                            }}
                            className="w-full h-9 mt-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black rounded-lg text-xs transition shadow-md flex items-center justify-center space-x-1.5 cursor-pointer uppercase tracking-wider"
                          >
                            <span>View Incident Intelligence</span>
                            <span>→</span>
                          </button>
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                );
              })
        )}
      </MapContainer>

      {/* FLOATING MAP OVERLAYS PANEL (TOP-LEFT NEXT TO CONTROLS) */}
      {showOverlaysPanel && (
        <div className="absolute top-3 left-16 z-[400]">
          <div className="bg-white/95 dark:bg-[#090D16]/95 backdrop-blur-md p-2 rounded-lg border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 shadow-2xl space-y-0.5 w-[138px]">
            <div className="text-slate-900 dark:text-slate-100 font-bold text-[8.5px] tracking-wider uppercase pb-0.5 border-b border-slate-200 dark:border-slate-800/80 mb-0.5">
              MAP OVERLAYS
            </div>

            <label className="flex items-center space-x-1 text-slate-700 dark:text-slate-300 cursor-pointer select-none py-0.5 h-[17px]">
              <input
                type="checkbox"
                checked={showHotspots}
                onChange={(e) => setShowHotspots(e.target.checked)}
                className="rounded border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 text-amber-500 focus:ring-amber-500 w-[10px] h-[10px] cursor-pointer shrink-0"
              />
              <div className="flex items-center space-x-1 min-w-0">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-500 shadow-[0_0_4px_#f97316] inline-block shrink-0" />
                <span className="font-semibold text-slate-800 dark:text-slate-200 text-[8px] leading-none whitespace-nowrap">Thermal Hotspots ({hotspots.length})</span>
              </div>
            </label>

            <label className="flex items-center space-x-1 text-slate-700 dark:text-slate-300 cursor-pointer select-none py-0.5 h-[17px]">
              <input
                type="checkbox"
                checked={showFacilities}
                onChange={(e) => setShowFacilities(e.target.checked)}
                className="rounded border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 text-sky-400 focus:ring-sky-500 w-[10px] h-[10px] cursor-pointer shrink-0"
              />
              <div className="flex items-center space-x-1 min-w-0">
                <span className="w-2.5 h-2.5 rounded bg-sky-600 border border-sky-300 flex items-center justify-center text-[6px] inline-block text-center text-white shrink-0">🏭</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 text-[8px] leading-none whitespace-nowrap">Industrial Facilities ({industrialSites.length})</span>
              </div>
            </label>

            <label className="flex items-center space-x-1 text-slate-700 dark:text-slate-300 cursor-pointer select-none py-0.5 h-[17px]">
              <input
                type="checkbox"
                checked={isReplayMode}
                onChange={(e) => setIsReplayMode(e.target.checked)}
                className="rounded border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 text-purple-400 focus:ring-purple-500 w-[10px] h-[10px] cursor-pointer shrink-0"
              />
              <div className="flex items-center space-x-1 min-w-0">
                <Clock className="w-2.5 h-2.5 text-purple-500 dark:text-purple-400 shrink-0" />
                <span className="font-semibold text-purple-600 dark:text-purple-300 text-[8px] leading-none whitespace-nowrap">Thermal History Replay</span>
              </div>
            </label>
          </div>
        </div>
      )}

      {/* FLOATING THERMAL ACTIVITY LEGEND (BOTTOM-LEFT) */}
      <div className="absolute bottom-8 left-4 z-[400] hidden sm:block">
        <div className="bg-white/95 dark:bg-[#090D16]/95 backdrop-blur-md p-2 rounded-lg border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 shadow-2xl space-y-0.5 w-[138px]">
          <div className="flex items-center space-x-1 text-slate-900 dark:text-slate-100 font-bold text-[8.5px] tracking-wider uppercase pb-0.5 border-b border-slate-200 dark:border-slate-800/80 mb-0.5">
            <Activity className="w-2.5 h-2.5 text-amber-500 dark:text-amber-400 shrink-0" />
            <span className="truncate">Thermal Activity (FRP)</span>
          </div>

          <div className="flex items-center space-x-1 py-0.5 h-[17px]">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_4px_#ef4444] inline-block shrink-0" />
            <span className="font-semibold text-slate-800 dark:text-slate-200 text-[8px] leading-none whitespace-nowrap">Higher FRP (&gt; 45 MW)</span>
          </div>

          <div className="flex items-center space-x-1 py-0.5 h-[17px]">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-500 shadow-[0_0_4px_#f97316] inline-block shrink-0" />
            <span className="font-semibold text-slate-800 dark:text-slate-200 text-[8px] leading-none whitespace-nowrap">Moderate FRP (15-45 MW)</span>
          </div>

          <div className="flex items-center space-x-1 py-0.5 h-[17px]">
            <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 shadow-[0_0_4px_#facc15] inline-block shrink-0" />
            <span className="font-semibold text-slate-800 dark:text-slate-200 text-[8px] leading-none whitespace-nowrap">Lower FRP (&lt; 15 MW)</span>
          </div>

          <div className="flex items-center space-x-1 pt-0.5 border-t border-slate-200 dark:border-slate-800/80 py-0.5 h-[17px]">
            <span className="w-2.5 h-2.5 rounded bg-sky-600 border border-sky-300 flex items-center justify-center text-[6px] inline-block text-center text-white shrink-0">🏭</span>
            <span className="font-semibold text-sky-600 dark:text-sky-300 text-[8px] leading-none whitespace-nowrap">Industrial Facility</span>
          </div>
        </div>
      </div>

      {/* Historical Map Replay Controller Bar */}
      {isReplayMode && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[400] bg-white/95 dark:bg-slate-950/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 px-6 py-3 rounded-2xl shadow-2xl text-xs flex items-center space-x-4 max-w-xl w-full text-slate-800 dark:text-slate-200">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="p-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white transition cursor-pointer"
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>

          <button
            onClick={() => setReplayIndex(0)}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition cursor-pointer"
            title="Reset Timeline"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <div className="flex-1 space-y-1">
            <div className="flex justify-between text-[11px] text-slate-500 dark:text-slate-400">
              <span>Step {replayIndex + 1} of {replayData.length}</span>
              <span className="font-mono text-cyan-600 dark:text-cyan-400">
                {replayData[replayIndex]
                  ? new Date(replayData[replayIndex].acquisition_datetime).toLocaleString()
                  : 'Start'}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max={Math.max(0, replayData.length - 1)}
              value={replayIndex}
              onChange={(e) => setReplayIndex(Number(e.target.value))}
              className="w-full accent-cyan-400 h-1 bg-slate-200 dark:bg-slate-800 rounded-lg cursor-pointer"
            />
          </div>

          <div className="flex items-center space-x-1 text-[11px]">
            <button
              onClick={() => setReplaySpeed(1500)}
              className={`px-2 py-1 rounded cursor-pointer ${replaySpeed === 1500 ? 'bg-cyan-100 dark:bg-cyan-950 text-cyan-600 dark:text-cyan-400 border border-cyan-300 dark:border-cyan-800 font-bold' : 'text-slate-500 dark:text-slate-400'}`}
            >
              1x
            </button>
            <button
              onClick={() => setReplaySpeed(700)}
              className={`px-2 py-1 rounded cursor-pointer ${replaySpeed === 700 ? 'bg-cyan-100 dark:bg-cyan-950 text-cyan-600 dark:text-cyan-400 border border-cyan-300 dark:border-cyan-800 font-bold' : 'text-slate-500 dark:text-slate-400'}`}
            >
              2x
            </button>
            <button
              onClick={() => setReplaySpeed(300)}
              className={`px-2 py-1 rounded cursor-pointer ${replaySpeed === 300 ? 'bg-cyan-100 dark:bg-cyan-950 text-cyan-600 dark:text-cyan-400 border border-cyan-300 dark:border-cyan-800 font-bold' : 'text-slate-500 dark:text-slate-400'}`}
            >
              5x
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
