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
  { id: 'global', label: 'Global', center: [20, 0], bbox: [-180, -60, 180, 75] },
  { id: 'usa', label: 'USA', center: [38.5, -97], bbox: [-130, 24, -65, 50] },
  { id: 'europe', label: 'Europe', center: [50, 10], bbox: [-10, 35, 30, 60] },
  { id: 'tokyo', label: 'Tokyo', center: [35.681, 139.767], bbox: [139.5, 35.5, 140.0, 35.9] },
];

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
  const [selectedFlight, setSelectedFlight] = useState(null);

  // ── Fetch LIVE flights from OpenSky Network (free, real-time) ──
  useEffect(() => {
    async function fetchFlights() {
      try {
        // OpenSky returns ALL aircraft in the bounding box with real positions
        const bbox = activeLoc.bbox;
        const url = `https://opensky-network.org/api/states/all?lamin=${bbox[1]}&lomin=${bbox[0]}&lamax=${bbox[3]}&lomax=${bbox[2]}`;
        const res = await fetch(url);
        const json = await res.json();

        if (json.states && json.states.length > 0) {
          // Limit to 100 for performance, pick random sample if more
          const states = json.states.length > 100
            ? json.states.sort(() => Math.random() - 0.5).slice(0, 100)
            : json.states;

          setFlights(
            states
              .filter((s) => s[5] != null && s[6] != null && !s[8]) // has lon, lat, and is airborne
              .map((s) => ({
                id: s[0], // icao24
                callsign: (s[1] || '').trim() || 'N/A',
                country: s[2],
                lng: s[5],
                lat: s[6],
                alt: s[7] || 10000, // baro altitude in meters
                speed: s[9] ? Math.round(s[9] * 1.944) : 0, // m/s to knots
                dir: s[10] || 0, // true track in degrees
              }))
          );
        }
      } catch (e) {
        console.warn('OpenSky fetch error:', e);
      }
    }
    fetchFlights();
    const iv = setInterval(fetchFlights, 15000); // refresh every 15s
    return () => clearInterval(iv);
  }, [activeLoc]);

  // ── Build map iframe URL ──
  const mapUrl = useMemo(() => {
    if (selectedFlight) {
      const { lat, lng } = selectedFlight;
      return `https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.5}%2C${lat - 0.3}%2C${lng + 0.5}%2C${lat + 0.3}&layer=mapnik`;
    }
    if (activeLayer === 'weather') {
      return `https://embed.windy.com/embed2.html?lat=${activeLoc.center[0]}&lon=${activeLoc.center[1]}&detailLat=${activeLoc.center[0]}&detailLon=${activeLoc.center[1]}&zoom=5&level=surface&overlay=radar&product=radar&menu=&message=true&marker=&calendar=now&pressure=&type=map&location=coordinates&metricWind=default&metricTemp=default&radarRange=-1`;
    }
    const b = activeLoc.bbox;
    return `https://www.openstreetmap.org/export/embed.html?bbox=${b[0]}%2C${b[1]}%2C${b[2]}%2C${b[3]}&layer=mapnik`;
  }, [activeLayer, activeLoc, selectedFlight]);

  // ── Visual filter for preset ──
  const iframeFilter = useMemo(() => {
    // Don't apply destructive filters to weather - it kills radar colors
    if (activeLayer === 'weather') return 'brightness(0.85)';
    if (activePreset === 'nvg') return 'sepia(100%) hue-rotate(80deg) saturate(400%) brightness(0.7) contrast(1.3)';
    if (activePreset === 'flir') return 'grayscale(100%) invert(100%) brightness(1.3) contrast(1.8)';
    return 'grayscale(1) contrast(1.2) invert(1) brightness(0.7)'; // CRT
  }, [activePreset, activeLayer]);

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-black text-slate-100 font-mono">
      {/* CRT OVERLAY */}
      <div className="crt-overlay absolute inset-0 z-[9999] pointer-events-none" />

      {/* ── HEADER HUD ── */}
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
          <span className="inline-block w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
          {activePreset.toUpperCase()}
        </p>
      </div>

      {/* ── INTEL TAGS ── */}
      <div className="absolute top-16 left-7 z-50 text-[9px] text-cyan-600/40 uppercase leading-relaxed pointer-events-none">
        <p>CLASSIFIED // SI-TK // NOFORN</p>
        <p>SIGINT KH11-4166 • OPS-ACTIVE</p>
        <p className="text-cyan-500 font-bold mt-1">
          {selectedFlight
            ? `LOCK: ${selectedFlight.callsign} • ${selectedFlight.country}`
            : `MODE: ${activeLayer.toUpperCase()} [${flights.length} TRACKS]`}
        </p>
      </div>

      <div className="absolute top-16 right-7 z-50 text-[9px] text-cyan-600/40 uppercase text-right pointer-events-none">
        <p>SYS 2026-02-21T17:55:12Z</p>
        <p>LAT {activeLoc.center[0].toFixed(4)} LON {activeLoc.center[1].toFixed(4)}</p>
      </div>

      {/* ── MAP IFRAME ── */}
      <div className="absolute inset-0 z-0">
        <iframe
          key={mapUrl}
          title="Map"
          src={mapUrl}
          className="w-full h-full border-0"
          style={{ filter: iframeFilter }}
        />
      </div>

      {/* ── VIEWFINDER VIGNETTE ── */}
      <div
        className="absolute inset-0 z-10 pointer-events-none"
        style={{
          background: 'radial-gradient(circle at center, transparent 55%, rgba(0,0,0,0.5) 70%, rgba(0,0,0,0.95) 85%)',
        }}
      />

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

      {/* ── LIVE FLIGHT MARKERS ── */}
      {activeLayer === 'flights' && !selectedFlight && (
        <div className="absolute inset-0 z-30">
          {flights.map((f) => {
            // Convert lat/lng to screen percentage based on current bbox
            const bbox = activeLoc.bbox;
            const x = ((f.lng - bbox[0]) / (bbox[2] - bbox[0])) * 100;
            const y = ((bbox[3] - f.lat) / (bbox[3] - bbox[1])) * 100;
            if (x < 0 || x > 100 || y < 0 || y > 100) return null;
            return (
              <button
                key={f.id}
                onClick={() => setSelectedFlight(f)}
                className="absolute group"
                style={{ left: `${x}%`, top: `${y}%`, transform: 'translate(-50%, -50%)' }}
              >
                <div className="relative">
                  <div
                    className="text-lg transition-transform group-hover:scale-150 drop-shadow-[0_0_4px_rgba(16,185,129,0.6)]"
                    style={{ transform: `rotate(${f.dir}deg)` }}
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
            );
          })}
        </div>
      )}

      {/* ── SELECTED FLIGHT LOCK ── */}
      {selectedFlight && (
        <div className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none">
          <div className="flex flex-col items-center gap-3">
            <div
              className="text-5xl drop-shadow-[0_0_15px_rgba(34,211,238,0.8)]"
              style={{ transform: `rotate(${selectedFlight.dir}deg)` }}
            >
              ✈️
            </div>
            <div className="bg-black/90 border border-cyan-500/60 px-5 py-3 rounded-lg shadow-2xl text-center">
              <p className="text-xl font-black text-cyan-400 chromatic-aberration">{selectedFlight.callsign}</p>
              <p className="text-[10px] text-cyan-600 font-bold uppercase mt-1">
                FL{Math.round(selectedFlight.alt / 30.48)} • {selectedFlight.speed} KTS • {selectedFlight.country}
              </p>
              <p className="text-[8px] text-cyan-800 mt-1">
                {selectedFlight.lat.toFixed(4)}°N {selectedFlight.lng.toFixed(4)}°E
              </p>
            </div>
            <button
              onClick={() => setSelectedFlight(null)}
              className="pointer-events-auto px-5 py-1.5 bg-red-500/20 border border-red-500/50 text-red-400 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all"
            >
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
            <span className="text-emerald-400 animate-pulse">● LIVE</span>
          </p>
          <p className="text-3xl font-black text-emerald-400">
            <DynamicNumber value={flights.length > 0 ? flights.length : 0} />
          </p>
          <div className="mt-2 text-[8px] text-emerald-900 uppercase font-bold leading-relaxed truncate">
            {flights.length > 0
              ? flights.slice(0, 6).map((f) => f.callsign).filter(c => c !== 'N/A').join(' | ')
              : 'Awaiting signal...'}
          </div>
        </div>

        <div className="bg-black/70 backdrop-blur-sm border border-cyan-900/50 rounded-xl p-2 space-y-1">
          {MAP_LAYERS.map((l) => (
            <button
              key={l.id}
              onClick={() => { setActiveLayer(l.id); setSelectedFlight(null); }}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${activeLayer === l.id
                  ? 'bg-cyan-500 text-black shadow-[0_0_12px_rgba(34,211,238,0.4)]'
                  : 'text-slate-600 hover:text-slate-400 hover:bg-white/5'
                }`}
            >
              <span>{l.icon}</span>
              {l.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div className="absolute right-8 bottom-8 z-50 flex flex-col items-end gap-3">
        <div className="bg-black/70 backdrop-blur-sm border border-cyan-900/50 rounded-full px-4 py-2 flex items-center gap-3">
          <span className="text-[8px] text-cyan-800 uppercase font-black tracking-widest">Style</span>
          {PRESETS.map((p) => (
            <button
              key={p.id}
              onClick={() => setActivePreset(p.id)}
              className={`w-9 h-9 rounded-full flex items-center justify-center text-base transition-all ${activePreset === p.id
                  ? 'bg-cyan-500 text-black shadow-[0_0_15px_rgba(34,211,238,0.6)]'
                  : 'text-slate-700 hover:text-slate-500'
                }`}
            >
              {p.icon}
            </button>
          ))}
        </div>

        <div className="flex gap-2 flex-wrap justify-end">
          {LOCATIONS.map((l) => (
            <button
              key={l.id}
              onClick={() => { setActiveLoc(l); setSelectedFlight(null); }}
              className={`px-3 py-1.5 border rounded-lg text-[9px] font-black uppercase tracking-wider transition-all ${activeLoc.id === l.id
                  ? 'border-cyan-500 text-cyan-400 bg-cyan-900/20'
                  : 'border-slate-800 text-slate-700 hover:border-slate-700'
                }`}
            >
              {l.label}
            </button>
          ))}
        </div>
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
