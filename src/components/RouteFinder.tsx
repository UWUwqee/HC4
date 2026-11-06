import React, { useEffect, useRef, useState } from 'react';
import type { GeoJSONSource as MapLibreGeoJSONSource, Map as MapLibreMap, Marker as MapLibreMarker } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Bike, CarFront, ChevronDown, ChevronUp, ExternalLink, LocateFixed, MapPin, PersonStanding, RefreshCw } from 'lucide-react';
import { CLINIC_ADDRESS } from '../data/delfinSalongaClinicInfo';

type TravelMode = 'walking' | 'bicycling' | 'driving' | 'motorcycle';
type Renderer = 'maplibre' | 'leaflet';
type Position = { latitude: number; longitude: number; accuracy: number; heading?: number | null; source?: 'gps' | 'manual' };
type RouteManeuver = { instruction: string; length: number; time: number };
type OsrmRouteResponse = {
  code?: string;
  message?: string;
  routes?: Array<{
    distance: number;
    duration: number;
    geometry: { coordinates: Array<[number, number]> };
    legs: Array<{
      steps: Array<{
        distance: number;
        duration: number;
        name: string;
        maneuver: { type: string; modifier?: string };
      }>;
    }>;
  }>;
  waypoints?: Array<{ location: [number, number] }>;
};
type RouteInfo = {
  distance: number;
  duration: number;
  approximate: boolean;
  startAccessDistance: number;
  endAccessDistance: number;
  straightLineDistance: number;
  maneuvers: RouteManeuver[];
};
type RouteFeatureCollection = GeoJSON.FeatureCollection<GeoJSON.LineString>;

const destination: L.LatLngTuple = [14.5429309, 121.0656783];
const destinationName = 'Delfin Salonga Health Center';
const destinationAddress = 'Emerald Avenue, Emerald Subdivision, Barangay Santo Rosario-Kanluran, Pateros, Metro Manila';
const wazeUrl = `https://www.waze.com/ul?ll=${destination[0]}%2C${destination[1]}&navigate=yes`;
const routingProfiles: Record<TravelMode, string> = {
  walking: 'routed-foot',
  bicycling: 'routed-bike',
  driving: 'routed-car',
  motorcycle: 'routed-car',
};
const routeColors: Record<TravelMode, string> = {
  walking: '#22c55e',
  bicycling: '#f59e0b',
  driving: '#38bdf8',
  motorcycle: '#ef4444',
};
const modeLabels: Record<TravelMode, string> = {
  walking: 'Walk',
  bicycling: 'Bike',
  driving: 'Car',
  motorcycle: 'Motorcycle',
};
const modes: Array<{ id: TravelMode; label: string; icon: React.ReactNode }> = [
  { id: 'walking', label: 'Walk', icon: <PersonStanding className="h-4 w-4" /> },
  { id: 'bicycling', label: 'Bike', icon: <Bike className="h-4 w-4" /> },
  { id: 'driving', label: 'Car', icon: <CarFront className="h-4 w-4" /> },
  { id: 'motorcycle', label: 'Motorcycle', icon: <CarFront className="h-4 w-4" /> },
];
const emptyFeatures: RouteFeatureCollection = { type: 'FeatureCollection', features: [] };

function distanceBetween(a: Position, b: Position) {
  const radians = (degrees: number) => degrees * Math.PI / 180;
  const latitudeDelta = radians(b.latitude - a.latitude);
  const longitudeDelta = radians(b.longitude - a.longitude);
  const value = Math.sin(latitudeDelta / 2) ** 2
    + Math.cos(radians(a.latitude)) * Math.cos(radians(b.latitude)) * Math.sin(longitudeDelta / 2) ** 2;
  return 6_371_000 * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
}

function distanceBetweenLatLng(a: L.LatLngTuple, b: L.LatLngTuple) {
  return distanceBetween(
    { latitude: a[0], longitude: a[1], accuracy: 0 },
    { latitude: b[0], longitude: b[1], accuracy: 0 },
  );
}

function shouldAcceptPosition(current: Position, next: Position) {
  const movement = distanceBetween(current, next);
  if (next.accuracy < current.accuracy * 0.8) return true;
  if (next.accuracy <= 250 && movement > Math.max(40, current.accuracy, next.accuracy)) return true;
  return next.accuracy < current.accuracy;
}

function isValidCoordinate(longitude: number, latitude: number) {
  return Number.isFinite(longitude) && Number.isFinite(latitude)
    && longitude >= -180 && longitude <= 180
    && latitude >= -90 && latitude <= 90;
}

function formatDistance(meters: number) {
  return meters >= 1000 ? `${(meters / 1000).toFixed(1)} km` : `${Math.round(meters)} m`;
}

function formatDuration(seconds: number) {
  const minutes = Math.max(1, Math.ceil(seconds / 60));
  return minutes >= 60 ? `${Math.floor(minutes / 60)} hr ${minutes % 60} min` : `${minutes} min`;
}

function maneuverInstruction(type: string, modifier?: string, street?: string) {
  const road = street ? ` onto ${street}` : '';
  if (type === 'depart') return `Head ${modifier?.replace('-', ' ') ?? 'ahead'}${street ? ` on ${street}` : ''}.`;
  if (type === 'arrive') return 'Arrive at the health center.';
  if (type === 'roundabout' || type === 'rotary') return `Enter the roundabout${road}.`;
  return `Turn ${modifier?.replace('-', ' ') ?? 'ahead'}${road}.`;
}

function accuracyFeature(position: Position): GeoJSON.Feature<GeoJSON.Polygon> {
  const latitude = position.latitude * Math.PI / 180;
  const longitude = position.longitude * Math.PI / 180;
  const angularDistance = position.accuracy / 6_371_000;
  const coordinates: number[][] = [];
  for (let step = 0; step <= 64; step += 1) {
    const bearing = step / 64 * Math.PI * 2;
    const pointLatitude = Math.asin(Math.sin(latitude) * Math.cos(angularDistance) + Math.cos(latitude) * Math.sin(angularDistance) * Math.cos(bearing));
    const pointLongitude = longitude + Math.atan2(Math.sin(bearing) * Math.sin(angularDistance) * Math.cos(latitude), Math.cos(angularDistance) - Math.sin(latitude) * Math.sin(pointLatitude));
    coordinates.push([pointLongitude * 180 / Math.PI, pointLatitude * 180 / Math.PI]);
  }
  return { type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: [coordinates] } };
}

function markerElement(color: string, label: string, heading?: number | null, userLocation = false) {
  const element = document.createElement('div');
  element.setAttribute('aria-label', label);
  element.title = label;
  element.className = userLocation ? 'route-user-marker' : '';
  Object.assign(element.style, {
    width: userLocation ? '22px' : '18px',
    height: userLocation ? '22px' : '18px',
    borderRadius: '50%',
    background: color,
    border: '3px solid white',
    boxShadow: '0 2px 8px rgba(15,23,42,.45)',
    transform: heading != null ? `rotate(${heading}deg)` : '',
  });
  if (userLocation && heading != null) element.innerHTML = '<span class="route-heading-arrow"></span>';
  return element;
}

function mapLibreBounds(points: [number, number][]) {
  const bounds = L.latLngBounds(points.map(([longitude, latitude]) => [latitude, longitude] as L.LatLngTuple));
  return [[bounds.getWest(), bounds.getSouth()], [bounds.getEast(), bounds.getNorth()]] as [[number, number], [number, number]];
}

export const RouteFinder: React.FC = () => {
  const [travelMode, setTravelMode] = useState<TravelMode>('walking');
  const [origin, setOrigin] = useState<Position | null>(null);
  const [locationError, setLocationError] = useState('');
  const [routeError, setRouteError] = useState('');
  const [mapError, setMapError] = useState('');
  const [locating, setLocating] = useState(true);
  const [mapReady, setMapReady] = useState(false);
  const [renderer, setRenderer] = useState<Renderer>('maplibre');
  const [route, setRoute] = useState<RouteInfo | null>(null);
  const [routing, setRouting] = useState(false);
  const [collapsed, setCollapsed] = useState(() => window.matchMedia('(max-width: 639px)').matches);
  const [trackingAttempt, setTrackingAttempt] = useState(0);
  const [pinStartMode, setPinStartMode] = useState(false);
  const mapElementRef = useRef<HTMLDivElement>(null);
  const mapLibreRef = useRef<MapLibreMap | null>(null);
  const mapLibreMarkerConstructorRef = useRef<typeof MapLibreMarker | null>(null);
  const leafletMapRef = useRef<L.Map | null>(null);
  const userMarkerRef = useRef<L.CircleMarker | null>(null);
  const accuracyCircleRef = useRef<L.Circle | null>(null);
  const destinationMarkerRef = useRef<L.CircleMarker | null>(null);
  const routeLineRef = useRef<L.Polyline | null>(null);
  const accessLinesRef = useRef<L.Polyline[]>([]);
  const libreUserMarkerRef = useRef<MapLibreMarker | null>(null);
  const libreDestinationMarkerRef = useRef<MapLibreMarker | null>(null);
  const routePointsRef = useRef<[number, number][]>([]);
  const lastRouteRef = useRef<{ position: Position; mode: TravelMode; timestamp: number } | null>(null);
  const activeRouteRequestRef = useRef<{ position: Position; mode: TravelMode; controller: AbortController } | null>(null);
  const currentOriginRef = useRef(origin);
  const currentTravelModeRef = useRef(travelMode);
  const currentRendererRef = useRef(renderer);
  currentOriginRef.current = origin;
  currentTravelModeRef.current = travelMode;
  currentRendererRef.current = renderer;
  const shouldFitRouteRef = useRef(true);
  const manualOriginRef = useRef(false);
  const pinStartModeRef = useRef(false);
  const fallbackUsedRef = useRef(false);
  pinStartModeRef.current = pinStartMode;

  const setPinCursor = (enabled: boolean) => {
    mapLibreRef.current?.getCanvasContainer().classList.toggle('route-start-pin-mode', enabled);
    leafletMapRef.current?.getContainer().classList.toggle('route-start-pin-mode', enabled);
  };

  const clearRenderedRoute = () => {
    routePointsRef.current = [];
    routeLineRef.current?.remove();
    routeLineRef.current = null;
    accessLinesRef.current.forEach((line) => line.remove());
    accessLinesRef.current = [];
    (mapLibreRef.current?.getSource('route') as MapLibreGeoJSONSource | undefined)?.setData(emptyFeatures);
    (mapLibreRef.current?.getSource('access-links') as MapLibreGeoJSONSource | undefined)?.setData(emptyFeatures);
  };

  useEffect(() => () => {
    activeRouteRequestRef.current?.controller.abort();
    activeRouteRequestRef.current = null;
  }, []);

  useEffect(() => {
    let disposed = false;
    let maplibreMap: MapLibreMap | null = null;
    let fallbackStarted = false;
    let fallbackTimer = 0;
    setMapReady(false);
    setMapError('');

    const activateLeafletFallback = (reason: string) => {
      if (disposed || fallbackStarted || fallbackUsedRef.current) return;
      fallbackStarted = true;
      fallbackUsedRef.current = true;
      maplibreMap?.remove();
      mapLibreRef.current = null;
      mapLibreMarkerConstructorRef.current = null;
      libreUserMarkerRef.current = null;
      libreDestinationMarkerRef.current = null;
      setRenderer('leaflet');
      setMapError(reason);
    };

    const initMapLibre = async () => {
      if (!mapElementRef.current) return;

      const maplibre = await import('maplibre-gl');
      const map = new maplibre.Map({
        container: mapElementRef.current,
        style: 'https://demotiles.maplibre.org/style.json',
        center: [121.0656783, 14.5429309],
        zoom: 13,
        attributionControl: true,
      });

      map.addControl(new maplibre.NavigationControl({ showCompass: true, showZoom: true }), 'top-right');
      map.addControl(new maplibre.ScaleControl({ maxWidth: 120, unit: 'metric' }), 'bottom-left');

      map.on('load', () => {
        map.addSource('route', { type: 'geojson', data: emptyFeatures });
        map.addSource('access-links', { type: 'geojson', data: emptyFeatures });
        map.addLayer({
          id: 'route-line',
          type: 'line',
          source: 'route',
          paint: { 'line-color': '#0f766e', 'line-width': 5, 'line-opacity': 0.9 },
        });
        map.addLayer({
          id: 'access-line',
          type: 'line',
          source: 'access-links',
          paint: { 'line-color': '#f59e0b', 'line-width': 3, 'line-dasharray': [2, 2], 'line-opacity': 0.8 },
        });
      });

      map.on('error', () => {
        activateLeafletFallback('Map rendering failed. Falling back to a simpler map.');
      });

      maplibreMap = map;
      mapLibreRef.current = map;

      mapLibreMarkerConstructorRef.current = maplibre.Marker;

      if (!disposed) {
        setMapReady(true);
      }
    };

    const initLeaflet = () => {
      if (!mapElementRef.current || leafletMapRef.current) return;

      const map = L.map(mapElementRef.current, {
        zoomControl: true,
        attributionControl: true,
      }).setView([14.5429309, 121.0656783], 13);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(map);

      leafletMapRef.current = map;
      if (!disposed) setMapReady(true);
    };

    const initMap = async () => {
      try {
        if (!mapElementRef.current) return;
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
          initLeaflet();
          return;
        }
        await initMapLibre();
      } catch {
        initLeaflet();
      }
    };

    const timer = window.setTimeout(() => {
      if (!disposed && !fallbackStarted) {
        initMap();
      }
    }, 150);

    return () => {
      disposed = true;
      window.clearTimeout(timer);
      window.clearTimeout(fallbackTimer);
      maplibreMap?.remove();
      leafletMapRef.current?.remove();
      leafletMapRef.current = null;
      mapLibreRef.current = null;
      mapLibreMarkerConstructorRef.current = null;
      libreUserMarkerRef.current?.remove();
      libreDestinationMarkerRef.current?.remove();
      userMarkerRef.current?.remove();
      accuracyCircleRef.current?.remove();
      destinationMarkerRef.current?.remove();
      accessLinesRef.current.forEach((line) => line.remove());
      accessLinesRef.current = [];
      routeLineRef.current?.remove();
    };
  }, []);

  useEffect(() => {
    if (!mapReady) return;
    if (renderer !== 'leaflet') return;

    if (!leafletMapRef.current) return;
    if (!destinationMarkerRef.current) {
      destinationMarkerRef.current = L.circleMarker(destination, {
        radius: 9,
        color: '#0f766e',
        weight: 3,
        fillColor: '#14b8a6',
        fillOpacity: 1,
      }).addTo(leafletMapRef.current);
      destinationMarkerRef.current.bindPopup(destinationName).openPopup();
    }

    if (origin) {
      const position: L.LatLngTuple = [origin.latitude, origin.longitude];
      const userMarker = L.circleMarker(position, {
        radius: 8,
        color: '#0ea5e9',
        weight: 3,
        fillColor: '#38bdf8',
        fillOpacity: 1,
      }).addTo(leafletMapRef.current);
      if (userMarkerRef.current) userMarkerRef.current.remove();
      userMarkerRef.current = userMarker;

      const accuracy = L.circle(position, { radius: origin.accuracy, color: '#38bdf8', fillOpacity: 0.12 }).addTo(leafletMapRef.current);
      if (accuracyCircleRef.current) accuracyCircleRef.current.remove();
      accuracyCircleRef.current = accuracy;
    }
  }, [origin, mapReady, renderer]);

  useEffect(() => {
    if (!mapReady) return;
    if (renderer !== 'maplibre') return;

    const map = mapLibreRef.current;
    if (!map) return;

    const destinationMarker = mapLibreMarkerConstructorRef.current?.({
      color: '#0f766e',
      element: markerElement('#0f766e', destinationName),
    }).setLngLat([destination[1], destination[0]]).addTo(map);
    if (libreDestinationMarkerRef.current) libreDestinationMarkerRef.current.remove();
    libreDestinationMarkerRef.current = destinationMarker ?? null;

    if (origin) {
      const userMarker = mapLibreMarkerConstructorRef.current?.({
        color: '#0ea5e9',
        element: markerElement('#0ea5e9', 'Your location', origin.heading ?? null, true),
      }).setLngLat([origin.longitude, origin.latitude]).addTo(map);
      if (libreUserMarkerRef.current) libreUserMarkerRef.current.remove();
      libreUserMarkerRef.current = userMarker ?? null;

      const accuracyGeojson = accuracyFeature(origin);
      const source = map.getSource('accuracy') as MapLibreGeoJSONSource | undefined;
      if (source) source.setData(accuracyGeojson as any);
      else map.addSource('accuracy', { type: 'geojson', data: accuracyGeojson });
      if (!map.getLayer('accuracy-fill')) {
        map.addLayer({
          id: 'accuracy-fill',
          type: 'fill',
          source: 'accuracy',
          paint: { 'fill-color': '#38bdf8', 'fill-opacity': 0.12 },
        });
      }
    }
  }, [origin, mapReady, renderer]);

  useEffect(() => {
    if (!mapReady) return;
    if (!origin) return;
    const map = renderer === 'maplibre' ? mapLibreRef.current : leafletMapRef.current;
    if (!map) return;

    const routeBounds = [destination, [origin.longitude, origin.latitude] as [number, number]];
    if (renderer === 'maplibre') {
      const bounds = mapLibreBounds(routeBounds.map(([longitude, latitude]) => [longitude, latitude] as [number, number]));
      map.fitBounds(bounds, { padding: 50, maxZoom: 14 });
    } else {
      const bounds = L.latLngBounds([destination, [origin.latitude, origin.longitude] as L.LatLngTuple]);
      map.fitBounds(bounds, { padding: [30, 30] });
    }
  }, [origin, mapReady, renderer]);

  useEffect(() => {
    const requestPosition = () => {
      if (!navigator.geolocation) {
        setLocationError('Geolocation is not supported on this device.');
        setLocating(false);
        return;
      }

      const onSuccess = (position: GeolocationPosition) => {
        const nextPosition: Position = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy || 30,
          heading: position.coords.heading ?? null,
          source: 'gps',
        };

        setOrigin((current) => {
          if (!current) return nextPosition;
          if (shouldAcceptPosition(current, nextPosition)) return nextPosition;
          return current;
        });

        setLocating(false);
        setLocationError('');
      };

      const onError = () => {
        setLocationError('Location access is unavailable. You can still use the route finder by setting a start point on the map.');
        setLocating(false);
      };

      const watcher = navigator.geolocation.watchPosition(onSuccess, onError, {
        enableHighAccuracy: true,
        timeout: 20000,
        maximumAge: 15000,
      });

      return () => navigator.geolocation.clearWatch(watcher);
    };

    requestPosition();
  }, []);

  useEffect(() => {
    if (!origin || !mapReady || pinStartMode) return;

    const routeRequest = async () => {
      if (!origin) return;
      setRouting(true);
      setRouteError('');

      const url = `https://router.project-osrm.org/route/v1/${routingProfiles[travelMode]}/${origin.longitude},${origin.latitude};${destination[1]},${destination[0]}?overview=full&geometries=geojson&steps=true`;
      const controller = new AbortController();

      activeRouteRequestRef.current?.controller.abort();
      activeRouteRequestRef.current = { position: origin, mode: travelMode, controller };

      try {
        const response = await fetch(url, { signal: controller.signal });
        if (!response.ok) throw new Error('Route unavailable');
        const data = (await response.json()) as OsrmRouteResponse;

        const routeData = data.routes?.[0];
        if (!routeData) throw new Error('No route found');

        const steps = routeData.legs?.[0]?.steps ?? [];
        const maneuvers: RouteManeuver[] = steps.map((step) => ({
          instruction: maneuverInstruction(step.maneuver?.type ?? 'continue', step.maneuver?.modifier, step.name),
          length: step.distance,
          time: step.duration,
        }));

        const routeInfo: RouteInfo = {
          distance: routeData.distance,
          duration: routeData.duration,
          approximate: true,
          startAccessDistance: 0,
          endAccessDistance: 0,
          straightLineDistance: distanceBetweenLatLng([origin.longitude, origin.latitude], destination),
          maneuvers,
        };

        setRoute(routeInfo);
        setRouting(false);

        const coordinates = routeData.geometry.coordinates.map(([longitude, latitude]) => [longitude, latitude] as [number, number]);
        routePointsRef.current = coordinates;

        if (renderer === 'maplibre') {
          const source = mapLibreRef.current?.getSource('route') as MapLibreGeoJSONSource | undefined;
          const routeFeatures: RouteFeatureCollection = {
            type: 'FeatureCollection',
            features: [{ type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates } }],
          };
          source?.setData(routeFeatures);
          mapLibreRef.current?.setPaintProperty('route-line', 'line-color', routeColors[travelMode]);
        } else if (renderer === 'leaflet' && leafletMapRef.current) {
          clearRenderedRoute();
          routeLineRef.current = L.polyline(coordinates.map(([longitude, latitude]) => [latitude, longitude] as L.LatLngTuple), {
            color: routeColors[travelMode],
            weight: 5,
            opacity: 0.9,
          }).addTo(leafletMapRef.current);
        }
      } catch (error) {
        setRouteError('Unable to calculate a route right now. Try another travel mode or start point.');
        setRouting(false);
      }
    };

    routeRequest();
  }, [origin, mapReady, pinStartMode, travelMode, renderer]);

  const handleManualStart = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    setPinStartMode(true);
    setPinCursor(true);
    setOrigin((current) => current ?? { latitude: 14.5429309, longitude: 121.0656783, accuracy: 25, source: 'manual' });
  };

  const handleMapClick = (event: L.LeafletMouseEvent | { lngLat: { lng: number; lat: number } }) => {
    if (!pinStartMode) return;

    const longitude = 'lng' in event ? event.lngLat.lng : event.latlng.lng;
    const latitude = 'lng' in event ? event.lngLat.lat : event.latlng.lat;

    if (!isValidCoordinate(longitude, latitude)) return;

    const nextOrigin: Position = {
      latitude,
      longitude,
      accuracy: 25,
      source: 'manual',
    };

    setOrigin(nextOrigin);
    setPinStartMode(false);
    setPinCursor(false);
    setLocationError('');
  };

  useEffect(() => {
    if (!leafletMapRef.current) return;
    if (!pinStartMode) return;

    const map = leafletMapRef.current;
    const clickHandler = (event: L.LeafletMouseEvent) => handleMapClick(event);
    map.on('click', clickHandler);

    return () => {
      map.off('click', clickHandler);
    };
  }, [pinStartMode]);

  useEffect(() => {
    if (!mapLibreRef.current) return;
    if (!pinStartMode) return;

    const map = mapLibreRef.current;
    const clickHandler = (event: { lngLat: { lng: number; lat: number } }) => handleMapClick({ lngLat: { lng: event.lngLat.lng, lat: event.lngLat.lat } });
    map.on('click', clickHandler);

    return () => {
      map.off('click', clickHandler);
    };
  }, [pinStartMode]);

  const refreshLocation = () => {
    setLocating(true);
    setTrackingAttempt((value) => value + 1);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        const nextPosition: Position = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy || 30,
          heading: position.coords.heading ?? null,
          source: 'gps',
        };
        setOrigin(nextPosition);
        setLocating(false);
      }, () => {
        setLocationError('Unable to refresh your current location.');
        setLocating(false);
      }, {
        enableHighAccuracy: true,
        timeout: 20000,
        maximumAge: 5000,
      });
    }
  };

  return (
    <section id="route-finder" className="site-section-bg section-enter border-b border-[#dce7e1]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="rounded-2xl border border-[#dfe6e1] bg-white shadow-sm overflow-hidden">
          <div className="flex items-center justify-between gap-3 bg-[#0f4d3c] px-4 py-3 text-white">
            <div className="min-w-0">
              <h2 className="text-sm font-bold tracking-wide uppercase">Navigate to health center</h2>
            </div>
            <div className="flex items-center gap-2 text-white/85">
              <button type="button" onClick={() => setCollapsed((value) => !value)} aria-label={collapsed ? 'Expand route finder' : 'Collapse route finder'} className="inline-flex h-8 w-8 items-center justify-center rounded-full hover:bg-white/10">
                {collapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {!collapsed && (
            <>
              <div className="border-b border-[#dfe6e1] bg-[#edf5f1] px-4 py-3">
                <div className="flex flex-col gap-3">
                  <div className="flex items-start gap-3">
                    <MapPin className="mt-0.5 h-5 w-5 text-[#0f4d3c]" />
                    <div className="min-w-0">
                      <div className="text-lg font-bold text-[#0f4d3c]">{destinationName}</div>
                      <div className="text-sm text-[#4b5563]">{destinationAddress}</div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {modes.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setTravelMode(item.id)}
                        className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-semibold transition ${
                          travelMode === item.id
                            ? 'border-[#0f4d3c] bg-[#0f4d3c] text-white'
                            : 'border-[#dfe6e1] bg-white text-[#374151] hover:border-[#9bbdad]'
                        }`}
                      >
                        {item.icon}
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-[#f9fafb]">
                <div ref={mapElementRef} className="h-[360px] w-full" />
              </div>

              <div className="border-t border-[#dfe6e1] bg-white px-4 py-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-2 text-sm font-medium text-[#374151]">
                    <button type="button" onClick={refreshLocation} className="inline-flex items-center gap-2 rounded-full border border-[#dfe6e1] bg-white px-2.5 py-1.5 hover:bg-[#f3f7f5]">
                      <LocateFixed className="h-4 w-4 text-[#0f4d3c]" />
                      {locating ? 'Locating...' : 'Refresh'}
                    </button>
                    {origin && (
                      <span className="text-[#4b5563]">
                        {formatDistance(distanceBetweenLatLng([origin.longitude, origin.latitude], destination))} away
                      </span>
                    )}
                  </div>

                  <a href={wazeUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full bg-[#0f4d3c] px-3 py-2 text-sm font-bold text-white hover:bg-[#123f36]">
                    Open Waze
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>

                {locationError && <p className="mt-3 text-sm text-amber-700">{locationError}</p>}
                {routeError && <p className="mt-3 text-sm text-rose-700">{routeError}</p>}
                {mapError && <p className="mt-3 text-xs text-slate-600">{mapError}</p>}

                {route && (
                  <div className="mt-4 rounded-xl border border-[#dfe6e1] bg-[#f7faf8] p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="text-xs font-bold uppercase tracking-[0.12em] text-[#0f4d3c]">Route info</div>
                        <div className="mt-1 text-sm font-semibold text-[#1f2937]">
                          {formatDistance(route.distance)} • {formatDuration(route.duration)}
                        </div>
                      </div>
                      <div className="rounded-full bg-[#dff3eb] px-2.5 py-1 text-xs font-bold text-[#0f4d3c]">
                        {route.approximate ? 'Approximate' : 'Exact'}
                      </div>
                    </div>

                    <div className="mt-3 space-y-2">
                      {route.maneuvers.slice(0, 3).map((maneuver, index) => (
                        <div key={`${maneuver.instruction}-${index}`} className="flex gap-2 text-sm text-[#374151]">
                          <span className="mt-0.5 h-2 w-2 rounded-full bg-[#0f4d3c]" />
                          <span>{maneuver.instruction}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {!route && !routeError && (
                  <div className="mt-4 rounded-xl border border-dashed border-[#dfe6e1] bg-[#f9fafb] p-3 text-sm text-[#4b5563]">
                    Route preview will appear after your current location is detected.
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
};