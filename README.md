# OVERWATCH

A cinematic, real-time **worldview operations dashboard** vibe-coded at GDG HackFest 2026 with **React + Vite + Tailwind CSS**.

OVERWATCH simulates a modern tactical intelligence UI with animated telemetry, global map navigation, live-style flight tracking, orbital satellite visualization, and surveillance-inspired display presets (CRT, NVG, FLIR).

---

## ✨ Overview

OVERWATCH is a single-page frontend experience designed to feel like an advanced command-and-control screen. The app renders a highly styled map-centered interface with:

- Simulated global flight activity (including viewport-based density)
- Satellite orbit visualization with realistic classes (LEO / MEO / GEO)
- Layer switching for traffic/weather/satellite/flight contexts
- Location presets for quick camera targeting (Global, USA, Europe, Asia, Tokyo)
- Visual display modes that change the operational “sensor” feel
- Dynamic telemetry and animated metrics to maintain a live-console aesthetic

The project is intentionally lightweight, running entirely on the client with deterministic + randomized simulation logic for rich motion and believable variation.

---

## 🧩 Core Features

### 1) Multi-Layer Mission View
Switch between map intelligence layers from the left control panel:

- **Live Flights** ✈️
- **Satellites** 🛰️
- **Street Traffic** 🚗
- **Weather Radar** 🌧️

Each layer is represented through a tactical control interface and tied to curated data-provider labels for immersion.

### 2) Simulated Flight Intelligence
Flight objects are generated within the currently active bounding box and include:

- Callsign
- Country of origin
- Latitude / longitude
- Altitude
- Ground speed
- Heading

Flight density scales with map span so global views feel busy while regional views stay legible.

### 3) Orbital Satellite Simulation
Satellites are modeled with realistic metadata:

- Name
- NORAD ID
- Orbit class (LEO/MEO/GEO)
- Inclination
- Approximate altitude

Positions are animated by simplified orbital periods:

- LEO ≈ 90 minutes
- MEO ≈ 12 hours
- GEO ≈ 24 hours

### 4) Tactical Display Presets
Instantly swap visual interpretation modes:

- **CRT** 📺 (retro command console feel)
- **NVG** 🌙 (night-vision inspired)
- **FLIR** 🌡️ (thermal-imagery style)

### 5) Regional Quick-Focus Controls
Jump to predefined strategic areas:

- Global
- USA
- Europe
- Asia
- Tokyo

### 6) Animated Telemetry UX
The interface includes animated counters and status text for:

- Total targets
- In-viewport counts
- Dynamic altitude readouts
- Live feed indicators

---

## 🏗️ Tech Stack

- **Framework:** React 18
- **Build Tool:** Vite 5
- **Styling:** Tailwind CSS 3 + custom CSS effects
- **Map/Geo Dependencies:** Leaflet + React Leaflet
- **Language:** JavaScript (ES Modules)

---

## 📁 Project Structure

```text
OVERWATCH/
├─ src/
│  ├─ App.jsx          # Main UI, simulation logic, controls, telemetry
│  ├─ main.jsx         # React entrypoint
│  └─ index.css        # Tailwind directives + custom visual effects
├─ index.html
├─ tailwind.config.js
├─ postcss.config.js
├─ vite.config.js
├─ package.json
└─ README.md
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ (recommended)
- npm 9+

### Install

```bash
npm install
```

### Run in Development

```bash
npm run dev
```

Then open the local URL shown by Vite (typically `http://localhost:5173`).

### Production Build

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

---

## 🎛️ Available Scripts

Defined in `package.json`:

- `npm run dev` — start local development server
- `npm run build` — create optimized production bundle
- `npm run preview` — preview the built app locally

---

## 🎨 Visual Design Notes

The UI aesthetic combines:

- neon cyan/green tactical color language
- dark glassmorphism panels
- CRT scanline and flicker overlay effects
- chromatic aberration text treatment
- micro-animations for “live system” realism

These effects are implemented in `src/index.css` and coordinated with utility styling from Tailwind.

---

## 📡 Data & Simulation Model

This project currently uses **simulated data generation** to provide a responsive and visually rich experience without backend dependencies.

- Flight entities are randomly generated per active map bounds.
- Satellite entities are defined from a curated list and animated with orbital heuristics.
- Layer provider names are presentation labels to reinforce context.

If you want to integrate real APIs later, natural extension points include:

- OpenSky (air traffic)
- CelesTrak (TLE/orbital feeds)
- OpenWeather-compatible radar overlays
- OSM-backed traffic/event overlays

---

## 🔧 Customization Ideas

You can extend OVERWATCH by adding:

- real-time websocket ingest for tracks
- historical route playback and timeline scrubber
- geofencing + alert rules
- target classification badges
- persistence for user presets
- split-screen multi-theater views
- authentication + role-based access for operator consoles

---

## 🧪 Quality Notes

- Build validation should be run before release (`npm run build`).
- Simulation-heavy UI changes should be tested across multiple viewport sizes.
- If map rendering appears blank, confirm Leaflet CSS/import usage in future refactors.

---

## 📄 License

No explicit license is currently declared in this repository.
If you plan to distribute or open-source this project, add a `LICENSE` file (MIT/Apache-2.0/etc.) and update this section.

---

## 🤝 Contributing

Contributions are welcome. A good contribution flow:

1. Fork / branch from main working branch
2. Make focused, testable changes
3. Validate with `npm run build`
4. Open a PR with clear scope and screenshots for UI changes

---

## 🛰️ Mission Statement

OVERWATCH is built to demonstrate how modern frontend tooling can deliver a high-fidelity operational interface experience—even before backend integrations are wired in.

If you want, I can also generate:

- a shorter “marketing” README variant
- an enterprise-style architecture README
- a developer-only README with API-integration scaffolding
