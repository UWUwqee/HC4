import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Bike, CarFront, ChevronDown, ChevronUp, ExternalLink, LocateFixed, MapPin, PersonStanding, RefreshCw } from 'lucide-react';
import { CLINIC_ADDRESS } from '../data/delfinSalongaClinicInfo';
import { useHealthCenter } from '../context/HealthCenterContext';

type TravelMode = 'walking' | 'bicycling' | 'driving' | 'motorcycle';
type Position = { latitude: number; longitude: number; accuracy: number; source: 'gps' | 'manual' };
type PreviousRoute = { position: Position; mode: TravelMode; timestamp: number };
type RouteStep = { distance: number; name: string; maneuver: { type: string; modifier?: string } };
type RouteResult = {
  code?: string;
  message?: string;
  routes?: Array<{
    distance: number;
    duration: number;
    geometry: { coordinates: Array<[number, number]> };
    legs: Array<{ steps: RouteStep[] }>;
  }>;
};

const destination: L.LatLngTuple = [14.5469469, 121.0715389];
const routingProfiles: Record<TravelMode, string> = {
  walking: 'routed-foot',
  bicycling: 'routed-bike',
  driving: 'routed-car',
  motorcycle: 'routed-car',
};
const modeLabels: Record<TravelMode, string> = { walking: 'Walk', bicycling: 'Bike', driving: 'Car', motorcycle: 'Motorcycle' };
const modes: Array<{ id: TravelMode; label: string; icon: React.ReactNode }> = [
  { id: 'walking', label: 'Walk', icon: <PersonStanding className="h-4 w-4" /> },
  { id: 'bicycling', label: 'Bike', icon: <Bike className="h-4 w-4" /> },
  { id: 'driving', label: 'Car', icon: <CarFront className="h-4 w-4" /> },
  { id: 'motorcycle', label: 'Moto', icon: <CarFront className="h-4 w-4" /> },
];

function formatDistance(meters: number) {
  return meters >= 1000 ? `${(meters / 1000).toFixed(1)} km` : `${Math.round(meters)} m`;
}

function formatDuration(seconds: number) {
  const minutes = Math.max(1, Math.ceil(seconds / 60));
  return minutes >= 60 ? `${Math.floor(minutes / 60)} hr ${minutes % 60} min` : `${minutes} min`;
}

function distanceBetween(a: Position, b: Position) {
  const radians = (degrees: number) => degrees * Math.PI / 180;
  const latitudeDelta = radians(b.latitude - a.latitude);
  const longitudeDelta = radians(b.longitude - a.longitude);
  const value = Math.sin(latitudeDelta / 2) ** 2
    + Math.cos(radians(a.latitude)) * Math.cos(radians(b.latitude)) * Math.sin(longitudeDelta / 2) ** 2;
  return 6_371_000 * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
}

function maneuverInstruction(step: RouteStep) {
  if (step.maneuver.type === 'depart') return step.name ? `Head out on ${step.name}.` : 'Head toward the health center.';
  if (step.maneuver.type === 'arrive') return 'Arrive at Delfin Salonga Health Center.';
  const action = step.maneuver.type === 'roundabout' ? 'Enter the roundabout' : `Turn ${step.maneuver.modifier?.replace('-', ' ') ?? 'ahead'}`;
  return step.name ? `${action} onto ${step.name}.` : `${action}.`;
}

export const RouteFinder: React.FC = () => {
  const { language, siteContent } = useHealthCenter();
  const isFilipino = language === 'fil';
  const clinicAddress = (isFilipino ? siteContent.settings.clinicAddressFil : siteContent.settings.clinicAddress) || CLINIC_ADDRESS;
  const [travelMode, setTravelMode] = useState<TravelMode>('walking');
  const [origin, setOrigin] = useState<Position | null>(null);
  const [locationError, setLocationError] = useState('');
  const [routeError, setRouteError] = useState('');
  const [mapError, setMapError] = useState('');
  const [locating, setLocating] = useState(true);
  const [mapReady, setMapReady] = useState(false);
  const [route, setRoute] = useState<{ distance: number; duration: number; firstStep?: RouteStep } | null>(null);
  const [routing, setRouting] = useState(false);
  const [collapsed, setCollapsed] = useState(() => window.matchMedia('(max-width: 639px)').matches);
  const [pinStartMode, setPinStartMode] = useState(false);
  const [trackingAttempt, setTrackingAttempt] = useState(0);
  const mapElementRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const userMarkerRef = useRef<L.CircleMarker | null>(null);
  const destinationMarkerRef = useRef<L.CircleMarker | null>(null);
  const routeLineRef = useRef<L.Polyline | null>(null);
  const manualOriginRef = useRef(false);
  const pinStartModeRef = useRef(pinStartMode);
  const lastRouteRef = useRef<PreviousRoute | null>(null);
  pinStartModeRef.current = pinStartMode;

  useEffect(() => {
    if (!mapElementRef.current) return;
    const map = L.map(mapElementRef.current, { zoomControl: false, minZoom: 3 }).setView(destination, 15);
    mapRef.current = map;
    const tiles = L.tileLayer('https://tile.openstreetmap.de/{z}/{x}/{y}.png', {
      maxZoom: 19,
      className: 'map-dark-tiles',
      attribution: '&copy; OpenStreetMap contributors &middot; OSM.de tiles',
    });
    tiles.on('tileerror', () => setMapError('Map tiles could not load. Check your connection.'));
    tiles.on('tileload', () => setMapError(''));
    tiles.addTo(map);
    L.control.zoom({ position: 'bottomright' }).addTo(map);
    destinationMarkerRef.current = L.circleMarker(destination, { radius: 9, color: '#fff', weight: 3, fillColor: '#b84236', fillOpacity: 1 })
      .addTo(map).bindTooltip('Delfin Salonga Health Center');
    map.on('click', (event) => {
      if (!pinStartModeRef.current) return;
      manualOriginRef.current = true;
      setOrigin({ latitude: event.latlng.lat, longitude: event.latlng.lng, accuracy: 0, source: 'manual' });
      setLocationError('');
      setRouteError('');
      setPinStartMode(false);
      setRoute(null);
    });
    setMapReady(true);
    requestAnimationFrame(() => map.invalidateSize());
    return () => {
      map.remove();
      mapRef.current = null;
      userMarkerRef.current = null;
      destinationMarkerRef.current = null;
      routeLineRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (collapsed) return;
    const frame = requestAnimationFrame(() => mapRef.current?.invalidateSize({ pan: false }));
    return () => cancelAnimationFrame(frame);
  }, [collapsed]);

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationError(isFilipino ? 'Hindi suportado ang lokasyon. Maaari mong i-pin ang panimulang punto sa mapa.' : 'Location is not supported. You can pin your start on the map.');
      setLocating(false);
      return;
    }
    setLocationError('');
    setLocating(true);
    const watchId = navigator.geolocation.watchPosition(({ coords }) => {
      if (!manualOriginRef.current) {
        setOrigin({ latitude: coords.latitude, longitude: coords.longitude, accuracy: Math.max(coords.accuracy || 0, 1), source: 'gps' });
        setLocationError('');
      }
      setLocating(false);
    }, (error) => {
      setLocating(false);
      setLocationError(error.code === error.PERMISSION_DENIED
        ? (isFilipino ? 'Hindi pinayagan ang lokasyon. I-enable ito o i-pin ang simula sa mapa.' : 'Location permission was denied. Enable it or pin your start on the map.')
        : (isFilipino ? 'Hindi makuha ang lokasyon. Suriin ang GPS o network.' : 'Could not determine location. Check GPS or network reception.'));
    }, { enableHighAccuracy: true, maximumAge: 0, timeout: 30000 });
    return () => navigator.geolocation.clearWatch(watchId);
  }, [trackingAttempt, isFilipino]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    if (!origin) {
      userMarkerRef.current?.remove();
      userMarkerRef.current = null;
      return;
    }
    const point: L.LatLngTuple = [origin.latitude, origin.longitude];
    const color = origin.source === 'manual' ? '#0f766e' : origin.accuracy > 250 ? '#c47a00' : '#1677c8';
    if (!userMarkerRef.current) {
      userMarkerRef.current = L.circleMarker(point, { radius: 8, color: '#fff', weight: 3, fillColor: color, fillOpacity: 1 })
        .addTo(map).bindTooltip(isFilipino ? 'Kasalukuyang lokasyon' : 'Your location');
    } else {
      userMarkerRef.current.setLatLng(point).setStyle({ fillColor: color });
    }
  }, [origin, mapReady, isFilipino]);

  useEffect(() => {
    mapRef.current?.getContainer().classList.toggle('route-start-pin-mode', pinStartMode);
  }, [pinStartMode, mapReady]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady || !origin || (origin.source === 'gps' && origin.accuracy > 250)) {
      setRouting(false);
      setRoute(null);
      lastRouteRef.current = null;
      routeLineRef.current?.remove();
      routeLineRef.current = null;
      return;
    }
    const previous = lastRouteRef.current;
    if (previous && previous.mode === travelMode && previous.position.source === origin.source
      && distanceBetween(previous.position, origin) < 40 && Date.now() - previous.timestamp < 20000) return;
    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      setRouting(true);
      setRouteError('');
      routeLineRef.current?.remove();
      routeLineRef.current = null;
      const profile = routingProfiles[travelMode];
      const points = `${origin.longitude},${origin.latitude};${destination[1]},${destination[0]}`;
      const url = `https://routing.openstreetmap.de/${profile}/route/v1/driving/${points}?overview=full&geometries=geojson&steps=true&alternatives=false`;
      try {
        const response = await fetch(url, { signal: controller.signal });
        if (!response.ok) throw new Error('Routing service is unavailable.');
        const result = await response.json() as RouteResult;
        const trip = result.routes?.[0];
        if (result.code !== 'Ok' || !trip) throw new Error(result.message || 'No route was found for this travel mode.');
        const routePoints = trip.geometry.coordinates.map(([longitude, latitude]) => [latitude, longitude] as L.LatLngTuple);
        if (routePoints.length < 2) throw new Error('The routing service returned an invalid route.');
        routeLineRef.current = L.polyline(routePoints, { color: '#1685a8', weight: 6, opacity: 0.95 }).addTo(map);
        map.fitBounds(routeLineRef.current.getBounds().extend(destination), { padding: [32, 32], maxZoom: 17 });
        const firstStep = trip.legs.flatMap((leg) => leg.steps).find((step) => step.distance > 0);
        setRoute({ distance: trip.distance, duration: trip.duration, firstStep });
        lastRouteRef.current = { position: origin, mode: travelMode, timestamp: Date.now() };
      } catch (error) {
        if (controller.signal.aborted) return;
        setRoute(null);
        setRouteError(error instanceof Error ? error.message : 'Could not calculate this route.');
      } finally {
        if (!controller.signal.aborted) setRouting(false);
      }
    }, 300);
    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [origin, travelMode, mapReady]);

  const locationStatus = origin?.source === 'manual'
    ? (isFilipino ? 'Naka-pin ang simula' : 'Start point pinned')
    : origin && origin.accuracy > 250
      ? (isFilipino ? 'Mahina ang GPS' : 'Weak GPS signal')
      : origin
        ? (isFilipino ? 'Live na lokasyon' : 'Live location')
        : locating
          ? (isFilipino ? 'Hinahanap ang lokasyon' : 'Finding location')
          : (isFilipino ? 'Hindi available ang lokasyon' : 'Location unavailable');
  const googleMapsUrl = new URL('https://www.google.com/maps/dir/');
  googleMapsUrl.searchParams.set('api', '1');
  googleMapsUrl.searchParams.set('destination', clinicAddress);
  googleMapsUrl.searchParams.set('travelmode', travelMode === 'walking' ? 'walking' : travelMode === 'bicycling' ? 'bicycling' : 'driving');
  if (origin) googleMapsUrl.searchParams.set('origin', `${origin.latitude},${origin.longitude}`);
  const wazeUrl = `https://www.waze.com/ul?ll=${destination[0]}%2C${destination[1]}&navigate=yes`;

  const retryLocation = () => {
    manualOriginRef.current = false;
    setPinStartMode(false);
    setOrigin(null);
    setRoute(null);
    setLocationError('');
    setRouteError('');
    lastRouteRef.current = null;
    setTrackingAttempt((attempt) => attempt + 1);
  };
  const beginManualPin = () => setPinStartMode(true);
  const returnToGps = () => {
    manualOriginRef.current = false;
    setPinStartMode(false);
    setOrigin(null);
    setRoute(null);
    lastRouteRef.current = null;
    setLocating(true);
    setTrackingAttempt((attempt) => attempt + 1);
  };
  const recenterMap = () => {
    const map = mapRef.current;
    if (!map) return;
    if (routeLineRef.current) map.fitBounds(routeLineRef.current.getBounds(), { padding: [32, 32], maxZoom: 17 });
    else if (origin) map.fitBounds(L.latLngBounds([origin.latitude, origin.longitude], destination), { padding: [32, 32], maxZoom: 16 });
    else map.setView(destination, 15);
  };
  const selectTravelMode = (mode: TravelMode) => {
    if (mode === travelMode) return;
    setRoute(null);
    setRouteError('');
    setTravelMode(mode);
  };

  return (
    <section aria-label={isFilipino ? 'Mapa ng direksyon' : 'Navigation map'} className="border-b border-[#dce7e1] bg-[#f7faf8] py-3 sm:py-4">
      <div className="mx-auto flex max-w-7xl justify-end px-5 sm:px-8 lg:px-12">
        <aside aria-label={isFilipino ? 'Live na mapa ng direksyon' : 'Live directions map'} className="route-enter w-full max-w-[360px] overflow-hidden rounded-sm border border-[#d7dfda] bg-[#fcfdfb] shadow-[0_10px_32px_rgba(23,58,55,0.12)]">
          <header className="flex items-center justify-between gap-2 bg-[#173a37] px-3 py-2.5 text-white">
            <div className="min-w-0">
              <h2 className="truncate text-sm font-bold">{isFilipino ? 'Mag-navigate sa health center' : 'Navigate to health center'}</h2>
              <p className="truncate text-[11px] text-white/75">Delfin Salonga Health Center · {clinicAddress}</p>
              <p className="mt-1 flex items-center gap-1.5 text-[10px] text-white/80"><span className={`h-1.5 w-1.5 rounded-full ${origin?.source === 'manual' ? 'bg-teal-300' : origin ? 'bg-emerald-300' : 'bg-slate-400'} ${origin?.source === 'gps' ? 'animate-pulse' : ''}`} />{locationStatus}</p>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <button type="button" onClick={recenterMap} aria-label={isFilipino ? 'I-center ang mapa' : 'Recenter map'} title={isFilipino ? 'I-center ang mapa' : 'Recenter map'} className="rounded-md p-2 text-white/85 hover:bg-white/10 hover:text-white"><LocateFixed className="h-4 w-4" /></button>
              <button type="button" onClick={() => setCollapsed((value) => !value)} aria-label={collapsed ? 'Expand map' : 'Collapse map'} title={collapsed ? 'Expand map' : 'Collapse map'} className="rounded-md p-2 text-white/85 hover:bg-white/10 hover:text-white">{collapsed ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}</button>
            </div>
          </header>

          <div className={collapsed ? 'hidden' : ''}>
            <div className="grid grid-cols-4 border-b border-slate-200" role="group" aria-label={isFilipino ? 'Paraan ng biyahe' : 'Travel mode'}>
              {modes.map((mode) => <button key={mode.id} type="button" onClick={() => selectTravelMode(mode.id)} aria-pressed={travelMode === mode.id} className={`flex min-h-11 min-w-0 flex-col items-center justify-center gap-1 border-r border-[#dfe6e1] py-2 text-[11px] font-bold last:border-r-0 sm:flex-row ${travelMode === mode.id ? 'bg-[#dce9e2] text-[#173a37]' : 'text-slate-600 hover:bg-[#f4f7f4]'}`}>{mode.icon}<span>{isFilipino && mode.id === 'walking' ? 'Lakad' : isFilipino && mode.id === 'bicycling' ? 'Bisikleta' : isFilipino && mode.id === 'driving' ? 'Sasakyan' : mode.label}</span></button>)}
            </div>
            <div className="relative">
              <div ref={mapElementRef} className="h-[170px] w-full bg-slate-100" aria-label={isFilipino ? 'Mapa na nagpapakita ng iyong lokasyon, health center, at ruta' : 'Map showing your location, the health center, and route'} />
              {pinStartMode && <div className="absolute left-2 right-2 top-2 z-[1000] flex items-center justify-between gap-2 rounded-md bg-white px-3 py-2 text-xs font-semibold text-slate-900 shadow-lg"><span>{isFilipino ? 'I-tap ang iyong lokasyon sa mapa' : 'Tap your start location on the map'}</span><button type="button" onClick={() => setPinStartMode(false)} className="text-teal-900 underline">{isFilipino ? 'Kanselahin' : 'Cancel'}</button></div>}
            </div>
            <div className="space-y-1.5 px-3 py-2.5">
              {mapError && <p role="alert" className="text-xs text-rose-800">{mapError}</p>}
              {origin?.source === 'gps' && origin.accuracy > 250 && <p role="status" className="border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">{isFilipino ? 'Hindi sapat ang katumpakan ng GPS para sa maaasahang ruta. I-pin ang simula o maghintay ng mas malinaw na signal.' : `GPS accuracy is about ${formatDistance(origin.accuracy)}. Pin your start or wait for a more accurate signal before using the route.`}</p>}
              {route && <p className="flex items-center gap-2 text-sm font-bold text-slate-900"><MapPin className="h-4 w-4 text-teal-800" />{modeLabels[travelMode]} · {formatDistance(route.distance)} · {isFilipino ? 'tinatayang' : 'about'} {formatDuration(route.duration)}</p>}
              {routing && <p role="status" className="text-xs text-slate-600">{isFilipino ? 'Kinakalkula ang ruta…' : 'Calculating a street route…'}</p>}
              {route?.firstStep && <p className="border-l-2 border-teal-700 pl-3 text-xs font-semibold text-slate-700">{maneuverInstruction(route.firstStep)}</p>}
              {locating && <p role="status" className="text-xs text-slate-600">{isFilipino ? 'Humihingi ng pahintulot sa lokasyon…' : 'Requesting your location…'}</p>}
              {locationError && <div className="flex items-center justify-between gap-3"><p role="alert" className="text-xs text-rose-800">{locationError}</p><button type="button" onClick={retryLocation} className="inline-flex shrink-0 items-center gap-1 text-xs font-bold text-teal-900"><RefreshCw className="h-3.5 w-3.5" />{isFilipino ? 'Ulitin' : 'Retry'}</button></div>}
              {routeError && <p role="alert" className="text-xs text-rose-800">{routeError}</p>}
              {origin?.source === 'manual' && <button type="button" onClick={returnToGps} className="inline-flex items-center gap-1 text-xs font-bold text-teal-900 underline underline-offset-2"><LocateFixed className="h-3.5 w-3.5" />{isFilipino ? 'Gamitin ang live GPS' : 'Use live GPS instead'}</button>}
              {origin?.source !== 'manual' && (!origin || origin.accuracy > 250) && !pinStartMode && <button type="button" onClick={beginManualPin} className="inline-flex items-center gap-1 text-xs font-bold text-teal-900 underline underline-offset-2"><MapPin className="h-3.5 w-3.5" />{isFilipino ? 'I-pin ang panimulang lokasyon' : 'Pin my start on map'}</button>}
              {(travelMode === 'driving' || travelMode === 'motorcycle') && <div className="flex flex-wrap gap-x-4 gap-y-2"><a href={googleMapsUrl.toString()} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-900 underline underline-offset-2">{isFilipino ? 'Buksan ang navigation' : 'Open navigation'} <ExternalLink className="h-3.5 w-3.5" /></a><a href={wazeUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-900 underline underline-offset-2">Open in Waze <ExternalLink className="h-3.5 w-3.5" /></a></div>}
              <p className="flex items-start gap-1 text-[10px] leading-relaxed text-slate-500"><MapPin className="mt-0.5 h-3 w-3 shrink-0" />{isFilipino ? 'Mga mapa at ruta mula sa OpenStreetMap. Ibinabahagi lamang ang lokasyon sa browser mo.' : 'Map and route data by OpenStreetMap. Your location stays in this browser.'}</p>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
};