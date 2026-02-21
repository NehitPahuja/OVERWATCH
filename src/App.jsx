import { useEffect, useMemo, useState } from 'react';

const MAP_LAYERS = [
  { id: 'flights', label: 'Live Flights', provider: 'OpenSky Network', icon: '✈️', color: 'text-emerald-400' },
  { id: 'earthquakes', label: 'Earthquakes (24h)', provider: 'USGS', icon: '🌋', color: 'text-orange-400' },
  { id: 'satellites', label: 'Satellites', provider: 'CelesTrak', icon: '🛰️', color: 'text-blue-400' },
  { id: 'traffic', label: 'Street Traffic', provider: 'OpenStreetMap', icon: '🚗', color: 'text-red-400' },
  { id: 'weather', label: 'Weather Radar', provider: 'NOAA NEXRAD', icon: '🌧️', color: 'text-cyan-400' },
];

const PRESETS = [
  { id: 'normal', label: 'Normal', icon: '⚪' },
  { id: 'crt', label: 'CRT', icon: '📺' },
  { id: 'nvg', label: 'NVG', icon: '🌙' },
  { id: 'flir', label: 'FLIR', icon: '🌡️' },
];

const LOCATIONS = [
  { id: 'capitol', label: 'US Capitol', coords: [-77.0091, 38.8899], bbox: [-77.015, 38.885, -77.003, 38.895] },
  { id: 'monument', label: 'Washington Monument', coords: [-77.0353, 38.8895], bbox: [-77.040, 38.886, -77.030, 38.893] },
  { id: 'pentagon', label: 'Pentagon', coords: [-77.0569, 38.8719], bbox: [-77.062, 38.868, -77.052, 38.875] },
  { id: 'tokyo', label: 'Tokyo Shuto', coords: [139.767, 35.681], bbox: [139.75, 35.67, 139.78, 35.69] },
];

function DynamicNumber({ value, precision = 0, suffix = "" }) {
  const [displayValue, setDisplayValue] = useState(value);
  useEffect(() => {
    setDisplayValue(value);
    const interval = setInterval(() => {
      const jitter = (Math.random() - 0.5) * (value * 0.005);
      setDisplayValue(value + jitter);
    }, 1500 + Math.random() * 2000);
    return () => clearInterval(interval);
  }, [value]);
  return <span>{displayValue.toLocaleString(undefined, { minimumFractionDigits: precision, maximumFractionDigits: precision })}{suffix}</span>;
}

export default function App() {
  const [activeLayer, setActiveLayer] = useState('satellites');
  const [activePreset, setActivePreset] = useState('crt');
  const [activeLocation, setActiveLocation] = useState(LOCATIONS[0]);
  const [parameters, setParameters] = useState({ pixelation: 40, distortion: 20, instability: 30 });
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ flights: 8200, satellites: 180, traffic: 45 });

  const [flights, setFlights] = useState([]);

  useEffect(() => {
    async function fetchFlights() {
      try {
        const aviationKey = '34b71dff34bf86d120c4af6cb0c95f1c';
        const response = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(`http://api.aviationstack.com/v1/flights?access_key=${aviationKey}&limit=10`)}`);
        const result = await response.json();
        if (result.data) {
          setFlights(result.data.filter(f => f.live).map(f => ({
            id: f.flight.icao || f.flight.iata,
            callsign: f.flight.iata || f.flight.icao,
            lat: f.live.latitude,
            lng: f.live.longitude,
            alt: f.live.altitude,
            speed: f.live.speed_horizontal
          })));
        }
      } catch (err) {
        console.error("Flight sync error:", err);
      }
    }
    fetchFlights();
    const interval = setInterval(fetchFlights, 60000);
    return () => clearInterval(interval);
  }, []);

  const getMapUrl = () => {
    const { bbox } = activeLocation;
    switch (activeLayer) {
      case 'weather':
        return `https://embed.windy.com/embed2.html?lat=${activeLocation.coords[1]}&lon=${activeLocation.coords[0]}&zoom=11&level=surface&overlay=radar&menu=&message=&marker=&calendar=&pressure=&type=map&location=coordinates&detail=&detailLat=${activeLocation.coords[1]}&detailLon=${activeLocation.coords[0]}&metricWind=default&metricTemp=default&radarRange=-1`;
      case 'traffic':
        return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox[0]}%2C${bbox[1]}%2C${bbox[2]}%2C${bbox[3]}&layer=mapnik`;
      case 'flights':
        return `https://www.openstreetmap.org/export/embed.html?bbox=-180%2C-90%2C180%2C90&layer=mapnik`;
      default:
        // Orbital/Satellite view
        return `https://www.openstreetmap.org/export/embed.html?bbox=-145.5%2C-13.5%2C181.7%2C74.6&layer=mapnik`;
    }
  };

  return (
    <div className={`relative h-screen w-screen overflow-hidden bg-black text-slate-100 font-mono crt-overlay`}>
      {/* HUD OVERLAYS */}
      <div className="absolute top-4 left-6 z-50 pointer-events-none">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full border border-cyan-500/50 flex items-center justify-center animate-pulse">
            <div className="w-4 h-4 bg-cyan-500 rounded-sm rotate-45" />
          </div>
          <h1 className="text-3xl font-black tracking-tighter text-cyan-400 italic">WORLDVIEW</h1>
        </div>
        <p className="text-[10px] tracking-[0.4em] text-cyan-900 ml-1">NO PLACE LEFT BEHIND</p>
      </div>

      <div className="absolute top-4 right-6 z-50 text-right pointer-events-none">
        <p className="text-[10px] text-cyan-700 uppercase tracking-widest">Active Style</p>
        <p className="text-xl font-bold text-cyan-400 chromatic-aberration">{activePreset.toUpperCase()}</p>
      </div>

      {/* TOP HUD INFO */}
      <div className="absolute top-20 left-6 z-50 text-[10px] text-cyan-500/60 leading-tight pointer-events-none">
        <p>TOP SECRET // SI-TK // NOFORN</p>
        <p>KH11-4166 OPS-4117</p>
        <p className="text-cyan-400 font-bold mt-1 uppercase">{activeLayer}</p>
      </div>

      <div className="absolute top-20 right-6 z-50 text-[10px] text-cyan-500/60 text-right pointer-events-none uppercase">
        <p>REC 2026-02-21 22:50:31Z</p>
        <p>ORB: 47582 PASS: DESC-180</p>
      </div>

      {/* MAIN VIEWPORT */}
      <div className={`relative h-full w-full flex items-center justify-center`}>
        <div className={`relative w-[95%] h-[85%] rounded-[3rem] overflow-hidden border border-cyan-500/20 shadow-[0_0_100px_rgba(34,211,238,0.1)] viewfinder-mask ${activePreset === 'nvg' ? 'nvg-filter' : activePreset === 'flir' ? 'flir-filter' : ''}`}>
          <iframe
            title="Tactical View"
            src={getMapUrl()}
            className={`h-full w-full grayscale contrast-125 invert opacity-70 scale-110`}
          />

          {/* RETICLE */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-24 h-24 border border-cyan-400/30 rounded-full animate-ping opacity-20" />
            <div className="absolute w-64 h-64 border border-cyan-500/10 rounded-full" />
            <div className="absolute w-full h-[1px] bg-cyan-400/10" />
            <div className="absolute h-full w-[1px] bg-cyan-400/10" />

            <div className="absolute w-4 h-4 border-l border-t border-cyan-400 -translate-x-32 -translate-y-32" />
            <div className="absolute w-4 h-4 border-r border-t border-cyan-400 translate-x-32 -translate-y-32" />
            <div className="absolute w-4 h-4 border-l border-b border-cyan-400 -translate-x-32 translate-y-32" />
            <div className="absolute w-4 h-4 border-r border-b border-cyan-400 translate-x-32 translate-y-32" />
          </div>

          {/* TARGET TAGS (MOCK) */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
            <div className="relative">
              <div className="w-3 h-3 bg-yellow-400 animate-pulse shadow-[0_0_10px_rgba(250,204,21,0.5)]" />
              <div className="absolute top-6 left-0 bg-black/80 border border-yellow-400/50 p-1 text-[8px] whitespace-nowrap text-yellow-400">
                <p className="font-bold">DELTA-2 R/B</p>
                <p>1199 km • NORAD 25876</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* LEFT PANEL: DATA LAYERS */}
      <div className="absolute left-12 top-1/2 -translate-y-1/2 w-64 z-50">
        <div className="bg-[#0b1220]/80 backdrop-blur-md border border-cyan-900/50 rounded-2xl p-4 tactical-border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[10px] uppercase tracking-widest text-cyan-500 font-bold">Data Layers</h2>
            <div className="w-4 h-4 border border-cyan-900 rounded flex items-center justify-center text-[8px]">×</div>
          </div>

          <div className="space-y-3">
            {MAP_LAYERS.map(layer => (
              <div key={layer.id} className="group cursor-pointer" onClick={() => setActiveLayer(layer.id)}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-sm">{layer.icon}</span>
                    <div>
                      <p className={`text-[11px] font-bold ${activeLayer === layer.id ? 'text-cyan-400' : 'text-slate-400'}`}>{layer.label}</p>
                      <p className="text-[8px] text-slate-600 uppercase">{layer.provider}</p>
                    </div>
                  </div>
                  <div className={`px-2 py-0.5 text-[8px] font-bold rounded transition-all ${activeLayer === layer.id ? 'bg-cyan-500 text-black shadow-[0_0_10px_rgba(34,211,238,0.5)]' : 'bg-slate-800 text-slate-500 border border-slate-700'}`}>
                    {activeLayer === layer.id ? 'ON' : 'OFF'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT PANEL: PARAMETERS */}
      <div className="absolute right-12 top-1/2 -translate-y-1/2 w-64 z-50">
        <div className="bg-[#0b1220]/80 backdrop-blur-md border border-cyan-900/50 rounded-2xl p-4 tactical-border">
          <h2 className="text-[10px] uppercase tracking-widest text-cyan-500 font-bold mb-6">Parameters</h2>

          <div className="space-y-6">
            {Object.keys(parameters).map(param => (
              <div key={param}>
                <div className="flex justify-between text-[10px] uppercase text-slate-500 mb-2">
                  <span>{param}</span>
                  <span className="text-cyan-400">{parameters[param]}%</span>
                </div>
                <input
                  type="range"
                  className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                  value={parameters[param]}
                  onChange={(e) => setParameters({ ...parameters, [param]: parseInt(e.target.value) })}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* BOTTOM BAR: STYLE PRESETS */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-50">
        <div className="bg-[#0b1220]/80 backdrop-blur-md border border-cyan-900/50 rounded-full px-6 py-3 flex items-center gap-4 tactical-border">
          <span className="text-[9px] text-cyan-700 uppercase tracking-widest mr-2">Style Presets</span>
          {PRESETS.map(preset => (
            <button
              key={preset.id}
              onClick={() => setActivePreset(preset.id)}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-full transition-all text-[10px] uppercase font-bold ${activePreset === preset.id ? 'bg-cyan-500 text-black shadow-[0_0_15px_rgba(34,211,238,0.4)]' : 'hover:bg-slate-800 text-slate-400'}`}
            >
              <span>{preset.icon}</span>
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* LOCATIONS HUD (BOTTOM LEFT) */}
      <div className="absolute bottom-8 left-8 z-50 flex gap-2">
        {LOCATIONS.map(loc => (
          <button
            key={loc.id}
            onClick={() => setActiveLocation(loc)}
            className={`px-3 py-1.5 border rounded-lg text-[9px] uppercase tracking-tighter transition-all ${activeLocation.id === loc.id ? 'border-cyan-500 text-cyan-400 bg-cyan-950/30 shadow-[0_0_10px_rgba(34,211,238,0.2)]' : 'border-slate-800 text-slate-600 hover:border-slate-700'}`}
          >
            {loc.label}
          </button>
        ))}
      </div>

      {/* COORDINATES HUD (BOTTOM RIGHT) */}
      <div className="absolute bottom-10 right-10 z-50 text-right pointer-events-none">
        <div className="text-[10px] text-cyan-400 font-bold mb-1 italic">
          GSD: {(1227.22 - parameters.pixelation * 10).toFixed(2)}M • NIIRS: 8.9
        </div>
        <div className="text-cyan-700 text-[10px] tracking-widest font-bold">
          ALT: <DynamicNumber value={119942} />M • SUN: -23.9° EL
        </div>
      </div>
    </div>
  );
}
