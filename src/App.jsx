import { useEffect, useMemo, useState } from 'react';

const navItems = ['Dashboard', 'Datasets', 'Query Builder', 'Graph View'];

const fallbackData = {
  traffic: [
    { corridor: 'I-95 North', avgSpeedKph: 62, congestion: 'Moderate' },
    { corridor: 'A40 West', avgSpeedKph: 47, congestion: 'Heavy' },
    { corridor: 'Tokyo Shuto C1', avgSpeedKph: 52, congestion: 'Moderate' },
  ],
  flights: { totalFlights: 8432, sampleCallsigns: ['UAL15', 'AAL229', 'DLH2VT', 'AFR102'] },
  earthquakes: { lastDayCount: 128, maxMagnitude: 5.1 },
};

async function fetchJSON(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 9000);

  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } finally {
    clearTimeout(timeout);
  }
}

export default function App() {
  const [activeNav, setActiveNav] = useState('Dashboard');
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState([]);
  const [data, setData] = useState(fallbackData);

  useEffect(() => {
    let mounted = true;

    async function loadIntelFeeds() {
      setLoading(true);
      const nextErrors = [];

      const [trafficResp, flightsResp, eqResp] = await Promise.allSettled([
        fetchJSON('https://data.cityofnewyork.us/resource/i4gi-tjb9.json?$limit=6'),
        fetchJSON('https://opensky-network.org/api/states/all'),
        fetchJSON('https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson'),
      ]);

      const nextData = { ...fallbackData };

      if (trafficResp.status === 'fulfilled' && Array.isArray(trafficResp.value)) {
        nextData.traffic = trafficResp.value.slice(0, 4).map((item, idx) => ({
          corridor: item.boro || item.roadway_name || `Corridor-${idx + 1}`,
          avgSpeedKph: Number(item.speed) || Math.floor(35 + Math.random() * 45),
          congestion: Number(item.speed) < 35 ? 'Heavy' : Number(item.speed) < 60 ? 'Moderate' : 'Light',
        }));
      } else {
        nextErrors.push('Traffic feed unavailable; using fallback telemetry.');
      }

      if (flightsResp.status === 'fulfilled' && flightsResp.value?.states) {
        const states = flightsResp.value.states;
        nextData.flights = {
          totalFlights: states.length,
          sampleCallsigns: states
            .slice(0, 4)
            .map((s) => s[1]?.trim())
            .filter(Boolean),
        };
      } else {
        nextErrors.push('Flight feed unavailable; using fallback telemetry.');
      }

      if (eqResp.status === 'fulfilled' && eqResp.value?.features) {
        const mags = eqResp.value.features.map((f) => f.properties?.mag || 0);
        nextData.earthquakes = {
          lastDayCount: eqResp.value.features.length,
          maxMagnitude: Math.max(...mags).toFixed(1),
        };
      } else {
        nextErrors.push('Earthquake feed unavailable; using fallback telemetry.');
      }

      if (mounted) {
        setData(nextData);
        setErrors(nextErrors);
        setLoading(false);
      }
    }

    loadIntelFeeds();
    const interval = setInterval(loadIntelFeeds, 1000 * 60 * 2);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  const graphSeries = useMemo(() => {
    const base = [
      { label: 'Traffic', value: data.traffic.reduce((acc, r) => acc + r.avgSpeedKph, 0) / data.traffic.length },
      { label: 'Flights', value: data.flights.totalFlights / 140 },
      { label: 'Seismic', value: data.earthquakes.lastDayCount },
    ];

    const max = Math.max(...base.map((b) => b.value), 1);
    return base.map((item) => ({ ...item, pct: Math.round((item.value / max) * 100) }));
  }, [data]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto flex min-h-screen max-w-[1800px]">
        <aside className="w-72 border-r border-cyan-900/70 bg-slate-900/70 p-5 backdrop-blur">
          <h1 className="mb-1 text-xl font-semibold tracking-[0.3em] text-cyan-300">OVERWATCH</h1>
          <p className="mb-8 text-xs uppercase tracking-[0.24em] text-slate-400">WorldView Tactical Node</p>

          <nav className="space-y-2">
            {navItems.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setActiveNav(item)}
                className={`w-full rounded-md border px-4 py-3 text-left text-sm transition ${
                  activeNav === item
                    ? 'border-cyan-500 bg-cyan-500/10 text-cyan-200 shadow-panel'
                    : 'border-slate-700 bg-slate-900 text-slate-300 hover:border-slate-500'
                }`}
              >
                {item}
              </button>
            ))}
          </nav>

          <div className="mt-8 rounded-lg border border-emerald-700/50 bg-emerald-900/20 p-3 text-xs text-emerald-200">
            System Status: {loading ? 'Syncing feeds...' : 'Operational'}
          </div>
        </aside>

        <main className="flex-1 p-6 lg:p-8">
          <header className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-cyan-100">{activeNav}</h2>
              <p className="text-sm text-slate-400">Dark tactical command interface with live public intelligence feeds.</p>
            </div>
          </header>

          {errors.length > 0 && (
            <div className="mb-4 rounded border border-amber-600/40 bg-amber-950/30 p-3 text-xs text-amber-200">
              {errors.map((e) => (
                <div key={e}>{e}</div>
              ))}
            </div>
          )}

          <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
            <article className="rounded-xl border border-slate-700 bg-slate-900/80 p-4 shadow-panel xl:col-span-2">
              <h3 className="mb-3 text-sm uppercase tracking-wide text-cyan-300">OpenInfraMap (Live Layer)</h3>
              <div className="h-[420px] overflow-hidden rounded-lg border border-cyan-900/60">
                <iframe
                  title="OpenInfraMap"
                  src="https://openinframap.org/#3.19/20.24/7.97/L,P,T"
                  className="h-full w-full"
                  loading="lazy"
                />
              </div>
            </article>

            <article className="space-y-4 rounded-xl border border-slate-700 bg-slate-900/80 p-4 shadow-panel">
              <div className="rounded-lg border border-slate-700 bg-slate-950 p-3">
                <p className="text-xs uppercase tracking-wide text-slate-400">Live Flights</p>
                <p className="mt-2 text-3xl font-semibold text-emerald-300">{data.flights.totalFlights.toLocaleString()}</p>
                <p className="mt-2 text-xs text-slate-400">{data.flights.sampleCallsigns.join(' • ') || 'No callsigns available'}</p>
              </div>
              <div className="rounded-lg border border-slate-700 bg-slate-950 p-3">
                <p className="text-xs uppercase tracking-wide text-slate-400">Earthquakes (24h)</p>
                <p className="mt-2 text-3xl font-semibold text-orange-300">{data.earthquakes.lastDayCount}</p>
                <p className="mt-2 text-xs text-slate-400">Max magnitude: M{data.earthquakes.maxMagnitude}</p>
              </div>
              <div className="rounded-lg border border-slate-700 bg-slate-950 p-3">
                <p className="text-xs uppercase tracking-wide text-slate-400">Traffic Corridors</p>
                <div className="mt-2 space-y-2 text-xs">
                  {data.traffic.map((row) => (
                    <div key={row.corridor} className="flex justify-between rounded bg-slate-900 p-2">
                      <span className="text-slate-300">{row.corridor}</span>
                      <span className="text-cyan-300">{row.avgSpeedKph} kph • {row.congestion}</span>
                    </div>
                  ))}
                </div>
              </div>
            </article>
          </section>

          <section className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
            <article className="rounded-xl border border-slate-700 bg-slate-900/80 p-4 shadow-panel">
              <h3 className="mb-3 text-sm uppercase tracking-wide text-cyan-300">Query Builder</h3>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <input className="rounded border border-slate-600 bg-slate-950 px-3 py-2 text-sm" placeholder="Source: flights" />
                <input className="rounded border border-slate-600 bg-slate-950 px-3 py-2 text-sm" placeholder="Filter: region=EU" />
                <button className="rounded border border-cyan-700 bg-cyan-800/40 px-3 py-2 text-sm text-cyan-100">Run Query</button>
              </div>
            </article>

            <article className="rounded-xl border border-slate-700 bg-slate-900/80 p-4 shadow-panel">
              <h3 className="mb-3 text-sm uppercase tracking-wide text-cyan-300">Graph View</h3>
              <div className="space-y-3">
                {graphSeries.map((g) => (
                  <div key={g.label}>
                    <div className="mb-1 flex justify-between text-xs text-slate-300">
                      <span>{g.label}</span>
                      <span>{g.pct}%</span>
                    </div>
                    <div className="h-3 rounded bg-slate-800">
                      <div className="h-3 rounded bg-gradient-to-r from-cyan-500 to-emerald-500" style={{ width: `${g.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </article>
          </section>
        </main>
      </div>
    </div>
  );
}
