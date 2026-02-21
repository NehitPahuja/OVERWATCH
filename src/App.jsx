import { useEffect, useMemo, useState } from 'react';

const MAP_LAYERS = [
  { id: 'flights', label: 'Live Flights', provider: 'OpenSky Network', icon: '✈️' },
  { id: 'satellites', label: 'Satellites', provider: 'CelesTrak', icon: '🛰️' },
  { id: 'traffic', label: 'Street Traffic', provider: 'OpenStreetMap', icon: '🚗' },
  { id: 'weather', label: 'Weather Radar', provider: 'Windy', icon: '🌧️' },
];

const PRESETS = [
  { id: 'crt', label: 'CRT', icon: '📺' },
  { id: 'nvg', label: 'NVG', icon: '🌙' },
  { id: 'flir', label: 'FLIR', icon: '🌡️' },
];

const LOCATIONS = [
  { id: 'global', label: 'Global', center: [20, 0], zoom: 2, bbox: [-180, -60, 180, 75] },
  { id: 'usa', label: 'USA', center: [38.5, -97], zoom: 5, bbox: [-130, 24, -65, 50] },
  { id: 'europe', label: 'Europe', center: [50, 10], zoom: 5, bbox: [-10, 35, 30, 60] },
  { id: 'asia', label: 'Asia', center: [30, 105], zoom: 4, bbox: [60, 10, 150, 55] },
  { id: 'tokyo', label: 'Tokyo', center: [35.681, 139.767], zoom: 10, bbox: [139.3, 35.4, 140.2, 36.0] },
];

// Realistic callsign prefixes
const SIM_CALLSIGNS = ['AAL', 'UAL', 'DAL', 'SWA', 'JBU', 'DLH', 'BAW', 'AFR', 'KLM', 'ANA', 'JAL', 'QFA', 'SIA', 'UAE', 'THY', 'CPA', 'CSN', 'CCA', 'RYR', 'EZY'];
const SIM_COUNTRIES = ['United States', 'Germany', 'United Kingdom', 'France', 'Japan', 'Australia', 'UAE', 'Turkey', 'China', 'Ireland'];

function generateSimFlights(bbox) {
  const span = bbox[2] - bbox[0];
  const count = span > 100 ? 300 : span > 30 ? 100 : 30;
  return Array.from({ length: count }, (_, i) => ({
    id: `SIM${i}`,
    callsign: SIM_CALLSIGNS[i % SIM_CALLSIGNS.length] + (100 + Math.floor(Math.random() * 8900)),
    country: SIM_COUNTRIES[i % SIM_COUNTRIES.length],
    lat: bbox[1] + Math.random() * (bbox[3] - bbox[1]),
    lng: bbox[0] + Math.random() * (bbox[2] - bbox[0]),
    alt: 5000 + Math.random() * 11000,
    speed: Math.round(300 + Math.random() * 250),
    dir: Math.floor(Math.random() * 360),
  }));
}

// Satellite orbit data — realistic names and orbital parameters
const SAT_DATA = [
  { name: 'ISS (ZARYA)', norad: 25544, type: 'LEO', incl: 51.6, alt: 420 },
  { name: 'HUBBLE', norad: 20580, type: 'LEO', incl: 28.5, alt: 540 },
  { name: 'STARLINK-1007', norad: 44713, type: 'LEO', incl: 53.0, alt: 550 },
  { name: 'STARLINK-2041', norad: 48201, type: 'LEO', incl: 53.0, alt: 550 },
  { name: 'STARLINK-3291', norad: 51456, type: 'LEO', incl: 53.2, alt: 550 },
  { name: 'STARLINK-4105', norad: 53102, type: 'LEO', incl: 53.2, alt: 540 },
  { name: 'STARLINK-5523', norad: 56201, type: 'LEO', incl: 43.0, alt: 530 },
  { name: 'ONEWEB-0012', norad: 44057, type: 'LEO', incl: 87.9, alt: 1200 },
  { name: 'ONEWEB-0394', norad: 52750, type: 'LEO', incl: 87.9, alt: 1200 },
  { name: 'COSMOS 2545', norad: 45358, type: 'LEO', incl: 67.1, alt: 680 },
  { name: 'COSMOS 2560', norad: 52765, type: 'LEO', incl: 64.8, alt: 850 },
  { name: 'TIANGONG', norad: 54216, type: 'LEO', incl: 41.5, alt: 390 },
  { name: 'LANDSAT 9', norad: 49260, type: 'LEO', incl: 98.2, alt: 705 },
  { name: 'SENTINEL-2A', norad: 40697, type: 'LEO', incl: 98.6, alt: 786 },
  { name: 'TERRA', norad: 25994, type: 'LEO', incl: 98.2, alt: 705 },
  { name: 'AQUA', norad: 27424, type: 'LEO', incl: 98.2, alt: 705 },
  { name: 'NOAA-20', norad: 43013, type: 'LEO', incl: 98.7, alt: 824 },
  { name: 'GPS IIR-M 1', norad: 28874, type: 'MEO', incl: 55.0, alt: 20200 },
  { name: 'GPS III SV01', norad: 43873, type: 'MEO', incl: 55.0, alt: 20200 },
  { name: 'GPS III SV05', norad: 49558, type: 'MEO', incl: 55.0, alt: 20200 },
  { name: 'GALILEO-201', norad: 40128, type: 'MEO', incl: 56.0, alt: 23222 },
  { name: 'GALILEO-215', norad: 43564, type: 'MEO', incl: 56.0, alt: 23222 },
  { name: 'GLONASS 758', norad: 43687, type: 'MEO', incl: 64.8, alt: 19140 },
  { name: 'BEIDOU-3 M23', norad: 49808, type: 'MEO', incl: 55.0, alt: 21528 },
  { name: 'GOES-16', norad: 41866, type: 'GEO', incl: 0.04, alt: 35786 },
  { name: 'GOES-18', norad: 51850, type: 'GEO', incl: 0.03, alt: 35786 },
  { name: 'METEOSAT-11', norad: 40732, type: 'GEO', incl: 0.5, alt: 35786 },
  { name: 'HIMAWARI-9', norad: 51054, type: 'GEO', incl: 0.03, alt: 35786 },
  { name: 'INTELSAT 40e', norad: 53307, type: 'GEO', incl: 0.01, alt: 35786 },
  { name: 'SES-17', norad: 49055, type: 'GEO', incl: 0.05, alt: 35786 },
];

function generateSatPositions(time) {
  return SAT_DATA.map((sat, i) => {
    // Simulate orbital motion: LEO ~90min, MEO ~12hr, GEO ~24hr period
    const period = sat.type === 'LEO' ? 5400 : sat.type === 'MEO' ? 43200 : 86400;
    const angularSpeed = (360 / period); // degrees per second
    const phase = (i * 137.5) % 360; // golden angle spacing
    const elapsed = time / 1000; // seconds since epoch
    const lng = ((phase + elapsed * angularSpeed) % 360) - 180;
    const lat = sat.incl * Math.sin(((phase + elapsed * angularSpeed * 1.3) % 360) * Math.PI / 180);
    return {
      id: `SAT-${sat.norad}`,
      name: sat.name,
      norad: sat.norad,
      type: sat.type,
      lat: Math.max(-85, Math.min(85, lat)),
      lng: lng,
      alt: sat.alt,
    };
  });
}

function DynamicNumber({ value, precision = 0 }) {
  const [v, setV] = useState(value);
  useEffect(() => {
    setV(value);
    const i = setInterval(() => setV(value + (Math.random() - 0.5) * value * 0.003), 2500);
    return () => clearInterval(i);
  }, [value]);
  return <span>{v.toLocaleString(undefined, { minimumFractionDigits: precision, maximumFractionDigits: precision })}</span>;
}

export default function App() {
  const [activeLayer, setActiveLayer] = useState('flights');
  const [activePreset, setActivePreset] = useState('crt');
  const [activeLoc, setActiveLoc] = useState(LOCATIONS[0]);
  const [flights, setFlights] = useState([]);
  const [totalFlights, setTotalFlights] = useState(0);
  const [selectedFlight, setSelectedFlight] = useState(null);
  const [dataSource, setDataSource] = useState('INIT');
  const [satellites, setSatellites] = useState([]);

  // ── Satellite position updates (every 3 seconds) ──
  useEffect(() => {
    function updateSats() {
      setSatellites(generateSatPositions(Date.now()));
    }
    updateSats();
    const iv = setInterval(updateSats, 3000);
    return () => clearInterval(iv);
  }, []);

  // ── Visible satellites in current bbox ──
  const visibleSatellites = useMemo(() => {
    const b = activeLoc.bbox;
    return satellites
      .filter((s) => s.lng >= b[0] && s.lng <= b[2] && s.lat >= b[1] && s.lat <= b[3])
      .map((s) => ({
        ...s,
        screenX: ((s.lng - b[0]) / (b[2] - b[0])) * 100,
        screenY: ((b[3] - s.lat) / (b[3] - b[1])) * 100,
      }));
  }, [satellites, activeLoc]);

  // ── Fetch flights: OpenSky direct → proxy → simulated fallback ──
  useEffect(() => {
    let cancelled = false;

    async function tryFetch(url) {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (!json.states || json.states.length === 0) throw new Error('No states');
      return json.states
        .filter((s) => s[5] != null && s[6] != null && !s[8])
        .map((s) => ({
          id: s[0],
          callsign: (s[1] || '').trim() || 'N/A',
          country: s[2],
          lng: s[5], lat: s[6],
          alt: s[7] || 10000,
          speed: s[9] ? Math.round(s[9] * 1.944) : 0,
          dir: s[10] || 0,
        }));
    }

    async function fetchFlights() {
      const b = activeLoc.bbox;
      const baseUrl = activeLoc.id === 'global'
        ? 'https://opensky-network.org/api/states/all'
        : `https://opensky-network.org/api/states/all?lamin=${b[1]}&lomin=${b[0]}&lamax=${b[3]}&lomax=${b[2]}`;

      // Attempt 1: Direct
      try {
        const data = await tryFetch(baseUrl);
        if (!cancelled) { setFlights(data.slice(0, 500)); setTotalFlights(data.length); setDataSource('OPENSKY LIVE'); }
        return;
      } catch (_) { }

      // Attempt 2: CORS proxy
      try {
        const data = await tryFetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(baseUrl)}`);
        if (!cancelled) { setFlights(data.slice(0, 500)); setTotalFlights(data.length); setDataSource('OPENSKY PROXY'); }
        return;
      } catch (_) { }

      // Attempt 3: Simulated
      if (!cancelled) {
        const sim = generateSimFlights(b);
        setFlights(sim); setTotalFlights(sim.length); setDataSource('SIMULATED');
      }
    }

    fetchFlights();
    const iv = setInterval(fetchFlights, 30000);
    return () => { cancelled = true; clearInterval(iv); };
  }, [activeLoc]);

  // ── Map iframe URL ──
  const mapUrl = useMemo(() => {
    if (selectedFlight) {
      const { lat, lng } = selectedFlight;
      return `https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.3}%2C${lat - 0.2}%2C${lng + 0.3}%2C${lat + 0.2}&layer=mapnik`;
    }
    if (activeLayer === 'weather') {
      return `https://embed.windy.com/embed2.html?lat=${activeLoc.center[0]}&lon=${activeLoc.center[1]}&detailLat=${activeLoc.center[0]}&detailLon=${activeLoc.center[1]}&zoom=${activeLoc.zoom + 2}&level=surface&overlay=radar&product=radar&menu=&message=true&marker=&calendar=now&pressure=&type=map&location=coordinates&metricWind=default&metricTemp=default&radarRange=-1`;
    }
    const b = activeLoc.bbox;
    return `https://www.openstreetmap.org/export/embed.html?bbox=${b[0]}%2C${b[1]}%2C${b[2]}%2C${b[3]}&layer=mapnik`;
  }, [activeLayer, activeLoc, selectedFlight]);

  // ── Visual filter per preset ──
  const iframeFilter = useMemo(() => {
    if (activeLayer === 'weather') return 'brightness(0.85)';
    if (activePreset === 'nvg') return 'sepia(100%) hue-rotate(80deg) saturate(400%) brightness(0.7) contrast(1.3)';
    if (activePreset === 'flir') return 'grayscale(100%) invert(100%) brightness(1.3) contrast(1.8)';
    return 'grayscale(1) contrast(1.2) invert(1) brightness(0.7)';
  }, [activePreset, activeLayer]);

  // ── Position flights relative to current bbox ──
  const visibleFlights = useMemo(() => {
    const b = activeLoc.bbox;
    return flights
      .filter((f) => f.lng >= b[0] && f.lng <= b[2] && f.lat >= b[1] && f.lat <= b[3])
      .map((f) => ({
        ...f,
        screenX: ((f.lng - b[0]) / (b[2] - b[0])) * 100,
        screenY: ((b[3] - f.lat) / (b[3] - b[1])) * 100,
      }));
  }, [flights, activeLoc]);

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-black text-slate-100 font-mono">
      {/* CRT OVERLAY */}
      <div className="crt-overlay absolute inset-0 z-[9999] pointer-events-none" />

      {/* ── HEADER ── */}
      <div className="absolute top-5 left-7 z-50 pointer-events-none">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-7 h-7 rounded border border-cyan-500/60 flex items-center justify-center">
            <div className="w-3 h-3 bg-cyan-400 rotate-45 animate-pulse" />
          </div>
          <h1 className="text-2xl font-black tracking-tighter text-cyan-400 italic">WORLDVIEW</h1>
        </div>
        <p className="text-[9px] tracking-[0.3em] text-cyan-800 uppercase ml-1">Tactical Reconnaissance Node</p>
      </div>

      <div className="absolute top-5 right-7 z-50 text-right pointer-events-none">
        <p className="text-[10px] text-cyan-800 uppercase tracking-widest font-bold">Link</p>
        <p className="text-lg font-black text-cyan-400 flex items-center justify-end gap-2">
          <span className={`inline-block w-2 h-2 rounded-full animate-pulse ${dataSource === 'SIMULATED' ? 'bg-yellow-500' : 'bg-emerald-500'}`} />
          {activePreset.toUpperCase()}
        </p>
      </div>

      {/* ── INTEL TAGS ── */}
      <div className="absolute top-16 left-7 z-50 text-[9px] text-cyan-600/40 uppercase leading-relaxed pointer-events-none">
        <p>CLASSIFIED // SI-TK // NOFORN</p>
        <p>SOURCE: {activeLayer === 'satellites' ? 'CELESTRAK SIM' : dataSource} • OPS-ACTIVE</p>
        <p className="text-cyan-500 font-bold mt-1">
          {selectedFlight
            ? `LOCK: ${selectedFlight.callsign} • ${selectedFlight.country}`
            : activeLayer === 'satellites'
              ? `MODE: SATELLITES [${satellites.length} TRACKED / ${visibleSatellites.length} VISIBLE]`
              : `MODE: ${activeLayer.toUpperCase()} [${totalFlights} TRACKS / ${visibleFlights.length} VISIBLE]`}
        </p>
      </div>

      <div className="absolute top-16 right-7 z-50 text-[9px] text-cyan-600/40 uppercase text-right pointer-events-none">
        <p>SYS 2026-02-21T17:55:12Z</p>
        <p>AREA: {activeLoc.label.toUpperCase()} • LAT {activeLoc.center[0].toFixed(2)} LON {activeLoc.center[1].toFixed(2)}</p>
      </div>

      {/* ── MAP ── pointer-events-none on iframe prevents user from desyncing zoom */}
      <div className="absolute inset-0 z-0">
        <iframe key={mapUrl} title="Map" src={mapUrl} className="w-full h-full border-0 pointer-events-none" style={{ filter: iframeFilter }} />
      </div>

      {/* ── VIGNETTE ── */}
      <div className="absolute inset-0 z-10 pointer-events-none" style={{ background: 'radial-gradient(circle at center, transparent 55%, rgba(0,0,0,0.5) 70%, rgba(0,0,0,0.95) 85%)' }} />

      {/* ── RETICLE ── */}
      <div className="absolute inset-0 z-20 pointer-events-none flex items-center justify-center">
        <div className="w-40 h-40 border border-cyan-500/15 rounded-full" />
        <div className="absolute w-80 h-80 border border-cyan-500/8 rounded-full" />
        <div className="absolute w-full h-px bg-cyan-500/10" />
        <div className="absolute h-full w-px bg-cyan-500/10" />
        <div className="absolute w-6 h-6 border-l-2 border-t-2 border-cyan-400/40 -translate-x-40 -translate-y-40" />
        <div className="absolute w-6 h-6 border-r-2 border-t-2 border-cyan-400/40 translate-x-40 -translate-y-40" />
        <div className="absolute w-6 h-6 border-l-2 border-b-2 border-cyan-400/40 -translate-x-40 translate-y-40" />
        <div className="absolute w-6 h-6 border-r-2 border-b-2 border-cyan-400/40 translate-x-40 translate-y-40" />
      </div>

      {/* ── FLIGHT MARKERS — synced to map bbox ── */}
      {activeLayer === 'flights' && !selectedFlight && (
        <div className="absolute inset-0 z-30">
          {visibleFlights.map((f) => (
            <button
              key={f.id}
              onClick={() => setSelectedFlight(f)}
              className="absolute group"
              style={{ left: `${f.screenX}%`, top: `${f.screenY}%`, transform: 'translate(-50%, -50%)' }}
            >
              <div className="relative">
                <div
                  className="text-lg transition-transform group-hover:scale-150"
                  style={{ transform: `rotate(${f.dir}deg)`, filter: 'drop-shadow(0 0 4px rgba(16,185,129,0.6))' }}
                >
                  ✈️
                </div>
                <div className="hidden group-hover:flex absolute top-5 left-3 bg-black/90 border border-emerald-500/50 px-2 py-1 items-center gap-2 whitespace-nowrap rounded z-[100]">
                  <span className="text-[9px] font-black text-emerald-400 uppercase">{f.callsign}</span>
                  <span className="text-[8px] text-emerald-700">FL{Math.round(f.alt / 30.48)}</span>
                  <span className="text-[8px] text-emerald-700">{f.speed}kts</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* ── SATELLITE MARKERS ── */}
      {activeLayer === 'satellites' && (
        <div className="absolute inset-0 z-30">
          {visibleSatellites.map((s) => (
            <div
              key={s.id}
              className="absolute group"
              style={{ left: `${s.screenX}%`, top: `${s.screenY}%`, transform: 'translate(-50%, -50%)' }}
            >
              <div className="relative">
                <div
                  className="text-sm transition-transform group-hover:scale-150"
                  style={{ filter: `drop-shadow(0 0 6px ${s.type === 'GEO' ? 'rgba(234,179,8,0.8)' : s.type === 'MEO' ? 'rgba(168,85,247,0.7)' : 'rgba(59,130,246,0.7)'})` }}
                >
                  🛰️
                </div>
                {/* Orbit ring for GEO sats */}
                {s.type === 'GEO' && <div className="absolute -inset-1 border border-yellow-500/30 rounded-full animate-ping" style={{ animationDuration: '3s' }} />}
                {/* Tooltip */}
                <div className="hidden group-hover:flex absolute top-5 left-3 bg-black/90 border border-blue-500/50 px-2 py-1 flex-col whitespace-nowrap rounded z-[100]">
                  <span className="text-[9px] font-black text-blue-400 uppercase">{s.name}</span>
                  <span className="text-[8px] text-blue-700">{s.type} • {s.alt.toLocaleString()}km • NORAD {s.norad}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── SELECTED FLIGHT ── */}
      {selectedFlight && (
        <div className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none">
          <div className="flex flex-col items-center gap-3">
            <div className="text-5xl" style={{ transform: `rotate(${selectedFlight.dir}deg)`, filter: 'drop-shadow(0 0 12px rgba(34,211,238,0.8))' }}>✈️</div>
            <div className="bg-black/90 border border-cyan-500/60 px-5 py-3 rounded-lg shadow-2xl text-center">
              <p className="text-xl font-black text-cyan-400 chromatic-aberration">{selectedFlight.callsign}</p>
              <p className="text-[10px] text-cyan-600 font-bold uppercase mt-1">FL{Math.round(selectedFlight.alt / 30.48)} • {selectedFlight.speed} KTS</p>
              <p className="text-[9px] text-cyan-800 mt-1">{selectedFlight.country} • {selectedFlight.lat.toFixed(3)}°N {selectedFlight.lng.toFixed(3)}°E</p>
            </div>
            <button onClick={() => setSelectedFlight(null)} className="pointer-events-auto px-5 py-1.5 bg-red-500/20 border border-red-500/50 text-red-400 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all">
              × Release Lock
            </button>
          </div>
        </div>
      )}

      {/* ── LEFT PANEL ── */}
      <div className="absolute left-8 bottom-8 z-50 w-64 space-y-3">
        <div className="bg-black/70 backdrop-blur-sm border border-cyan-900/50 rounded-xl p-4">
          <p className="text-[9px] text-emerald-600 uppercase font-black tracking-widest mb-1 flex justify-between">
            Tracked Aircraft
            <span className={`${dataSource === 'SIMULATED' ? 'text-yellow-400' : 'text-emerald-400'} animate-pulse`}>
              ● {dataSource}
            </span>
          </p>
          <p className="text-3xl font-black text-emerald-400">
            <DynamicNumber value={totalFlights > 0 ? totalFlights : 0} />
          </p>
          <p className="text-[9px] text-emerald-900 font-bold mt-1">{visibleFlights.length} in viewport</p>
          <div className="mt-2 text-[8px] text-emerald-900 uppercase font-bold leading-relaxed truncate">
            {flights.length > 0 ? flights.slice(0, 6).map((f) => f.callsign).filter(c => c !== 'N/A').join(' | ') : 'Awaiting signal...'}
          </div>
        </div>

        <div className="bg-black/70 backdrop-blur-sm border border-cyan-900/50 rounded-xl p-2 space-y-1">
          {MAP_LAYERS.map((l) => (
            <button key={l.id} onClick={() => { setActiveLayer(l.id); setSelectedFlight(null); }}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${activeLayer === l.id ? 'bg-cyan-500 text-black shadow-[0_0_12px_rgba(34,211,238,0.4)]' : 'text-slate-600 hover:text-slate-400 hover:bg-white/5'}`}>
              <span>{l.icon}</span> {l.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div className="absolute right-8 bottom-8 z-50 flex flex-col items-end gap-3">
        <div className="bg-black/70 backdrop-blur-sm border border-cyan-900/50 rounded-full px-4 py-2 flex items-center gap-3">
          <span className="text-[8px] text-cyan-800 uppercase font-black tracking-widest">Style</span>
          {PRESETS.map((p) => (
            <button key={p.id} onClick={() => setActivePreset(p.id)}
              className={`w-9 h-9 rounded-full flex items-center justify-center text-base transition-all ${activePreset === p.id ? 'bg-cyan-500 text-black shadow-[0_0_15px_rgba(34,211,238,0.6)]' : 'text-slate-700 hover:text-slate-500'}`}>
              {p.icon}
            </button>
          ))}
        </div>

        <div className="flex gap-2 flex-wrap justify-end">
          {LOCATIONS.map((l) => (
            <button key={l.id} onClick={() => { setActiveLoc(l); setSelectedFlight(null); }}
              className={`px-3 py-1.5 border rounded-lg text-[9px] font-black uppercase tracking-wider transition-all ${activeLoc.id === l.id ? 'border-cyan-500 text-cyan-400 bg-cyan-900/20' : 'border-slate-800 text-slate-700 hover:border-slate-700'}`}>
              {l.label}
            </button>
          ))}
        </div>

        {selectedFlight && (
          <button onClick={() => setSelectedFlight(null)} className="px-5 py-1.5 bg-red-500/20 border border-red-500/50 text-red-400 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all">
            × Release Lock
          </button>
        )}
      </div>

      {/* ── BOTTOM TELEMETRY ── */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-50 pointer-events-none text-center">
        <p className="text-[9px] text-cyan-700 font-black tracking-[0.2em] uppercase chromatic-aberration">
          ALT: <DynamicNumber value={selectedFlight ? selectedFlight.alt : 119942} />m • GSD: 0.15m • NIIRS: 8.9
        </p>
      </div>
    </div>
  );
}
