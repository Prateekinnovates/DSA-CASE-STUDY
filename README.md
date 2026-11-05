# 🚑 Route-O-Rescue: Shortest Path Planning for Emergency Services

[![React](https://img.shields.io/badge/React-18.3-61DAFB?style=flat&logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.2-3178C6?style=flat&logo=typescript)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-5.4-646CFF?style=flat&logo=vite)](https://vitejs.dev)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?style=flat&logo=tailwind-css)](https://tailwindcss.com)
[![Leaflet](https://img.shields.io/badge/Leaflet-1.9-199900?style=flat&logo=leaflet)](https://leafletjs.com)
[![Zero Backend](https://img.shields.io/badge/Backend-100%25%20Client--Side-brightgreen?style=flat)](#)

**Route-O-Rescue** is an interactive, mission-critical emergency dispatch and route optimization platform. It models urban infrastructure as a directed/undirected weighted graph where intersections, hospitals, fire stations, and accident sites form vertices, while streets with distance, dynamic traffic multipliers, and road closures form weighted edges.

All graph algorithms—including **Dijkstra's Algorithm**, **A\* Search**, **Bellman-Ford**, and **Multi-Source Dijkstra**—are implemented **completely from scratch in TypeScript modules** (`src/lib/`), executing directly in the client browser with zero backend server or network latency.

---

## 🌟 Core Features

### 1. ⚡ Pure From-Scratch TypeScript Graph Algorithms (`src/lib/`)
- **Dijkstra's Algorithm** ([`dijkstra.ts`](file:///c:/Users/prate/OneDrive/Desktop/DSA%20Case%20Study/frontend/src/lib/dijkstra.ts)): Implemented with a custom **Binary Min-Heap Priority Queue** (`priorityQueue.ts`) from scratch. Guarantees optimal shortest paths on non-negative weighted graphs in $\mathcal{O}((V + E) \log V)$ time.
- **A\* Search** ([`astar.ts`](file:///c:/Users/prate/OneDrive/Desktop/DSA%20Case%20Study/frontend/src/lib/astar.ts)): Uses an admissible and consistent **Haversine great-circle distance heuristic** scaled by maximum network velocity, steering the frontier directly toward the destination.
- **Bellman-Ford Algorithm** ([`bellmanFord.ts`](file:///c:/Users/prate/OneDrive/Desktop/DSA%20Case%20Study/frontend/src/lib/bellmanFord.ts)): Iteratively relaxes all edges across $|V|-1$ passes in $\mathcal{O}(V \cdot E)$ time, detects negative weight cycles, and demonstrates dynamic road congestion handling.
- **Multi-Source Dijkstra** ([`multiSource.ts`](file:///c:/Users/prate/OneDrive/Desktop/DSA%20Case%20Study/frontend/src/lib/multiSource.ts)): Evaluates all available emergency stations across the city simultaneously to auto-dispatch the nearest unit to an incident.
- **Backup Alternate Route (Yen's Edge-Deviation)** ([`alternatePath.ts`](file:///c:/Users/prate/OneDrive/Desktop/DSA%20Case%20Study/frontend/src/lib/alternatePath.ts)): Computes a resilient second-shortest path as an immediate detour in case the primary road becomes congested or blocked en route.

### 2. 🗺️ Interactive Graph Builder & Map
- **Click-to-Build**: Click anywhere on the map to add facilities (**Hospital**, **Fire Station**, **Police Station**, **Junction**, or **Accident Site**).
- **Interactive Road Network**: Connect vertices with weighted edges including distance (km), traffic multiplier factor ($1.0\times$ to $4.0\times$), speed limit (km/h), and status (`open` or `blocked`).
- **Drag-to-Move**: Drag any node to reposition it; coordinates and road lengths dynamically update in client state.
- **Browser Import / Export**: Save and load custom city graphs as JSON directly through the browser.
- **Preset City**: Preloaded with a realistic 24-node, 45-edge **Metro City Emergency Response Network** (`src/data/sample_city.json`).

### 3. 🚨 Real-Time Emergency Scenarios & Dynamic Re-Routing
- **Ambulance Emergency**: Auto-finds the nearest Level-1 trauma center or community hospital to an accident site.
- **Fire Response**: Auto-dispatches the closest ladder brigade or heavy rescue fire station to structural fires.
- **Police Dispatch**: Rapid response routing from tactical precincts to active incidents.
- **Dynamic Road Blockage**: Click any road to toggle a roadblock (`open` $\leftrightarrow$ `blocked`). The system dynamically detects the severed edge and automatically re-routes active emergency vehicles in real-time.

### 4. 🎬 Step-by-Step Algorithm Visualizer
- **Visual Playback**: Play, Pause, Step Forward, Step Backward, Reset, and adjust animation speed ($0.5\times$ to $4.0\times$).
- **Algorithm State Inspector**:
  - Highlights currently visited/settled nodes in bright cyan.
  - Highlights active frontier (Priority Queue) nodes in amber.
  - Pulses relaxed edges with animated yellow dashes.
  - Live **Min-Heap Inspector** displays the queue state and tentative travel times at every tick.
- **Animated Vehicle Marker**: Smoothly drives an Ambulance 🚑, Fire Truck 🚒, or Police Cruiser 🚓 along the calculated shortest path.

### 5. 📊 Analytics & DSA Benchmark Panel
- Head-to-head comparison between **Dijkstra**, **A\***, and **Bellman-Ford** on identical endpoints:
  - Nodes visited count.
  - Edges relaxed count.
  - Execution time (microseconds / milliseconds).
  - Total travel time (minutes) and distance (km).
- Interactive SVG performance bar chart.
- Time & Space complexity guide.

---

## 📐 Graph Theory & Algorithmic Concepts

### Graph Model
A city road network is represented as $G = (V, E, W)$:
- **Vertices ($V$)**: $v \in V$ with geographical coordinates $(\text{lat}_v, \text{lon}_v)$ and type $T_v \in \{\text{hospital}, \text{fire\_station}, \text{police\_station}, \text{junction}, \text{accident}\}$.
- **Edges ($E$)**: Directed or bidirectional edges $(u, v) \in E$ representing road segments.
- **Cost Function ($W$)**:
  $$\text{Effective Speed } s(e) = \frac{\text{speed\_limit}(e)}{\text{traffic\_multiplier}(e)}$$
  $$\text{Travel Time (Weight) } w(e) = \begin{cases} \infty & \text{if } \text{status}(e) = \text{blocked} \\ \frac{\text{distance\_km}(e)}{s(e)} \times 60 \text{ minutes} & \text{if } \text{status}(e) = \text{open} \end{cases}$$

### Admissible Haversine Heuristic ($h(n)$)
For A\* search, the straight-line distance is computed via the spherical Haversine formula:
$$d = 2R \arcsin\left(\sqrt{\sin^2\left(\frac{\Delta \phi}{2}\right) + \cos(\phi_1)\cos(\phi_2)\sin^2\left(\frac{\Delta \lambda}{2}\right)}\right)$$
The heuristic estimate in minutes to destination $T$ is:
$$h(n) = \frac{d(n, T)}{v_{\max}} \times 60$$
Since no vehicle can exceed the maximum network speed $v_{\max}$ and road paths cannot be shorter than the straight-line distance, $h(n) \le d^*(n, T)$ (admissible) and $h(u) \le w(u, v) + h(v)$ (monotonic/consistent), guaranteeing optimal paths.

### Algorithmic Complexities

| Algorithm | Time Complexity | Space Complexity | Best For | Heuristic Needed? |
| :--- | :--- | :--- | :--- | :--- |
| **Dijkstra** | $\mathcal{O}((V + E) \log V)$ | $\mathcal{O}(V + E)$ | General single-source shortest path | No |
| **A\* Search** | $\mathcal{O}(E) \text{ to } \mathcal{O}(V \log V)$ | $\mathcal{O}(V + E)$ | Targeted point-to-point routing | Yes (Admissible) |
| **Bellman-Ford** | $\mathcal{O}(V \cdot E)$ | $\mathcal{O}(V)$ | Dynamic penalty / negative cycle check | No |
| **Multi-Source** | $\mathcal{O}((V + E) \log V)$ | $\mathcal{O}(V + E)$ | Nearest facility among $k$ candidates | No |
| **Yen's 2nd Path** | $\mathcal{O}(K \cdot (V + E) \log V)$ | $\mathcal{O}(V + E)$ | Backup / detour contingency planning | No |

---

## 🏗️ Project Architecture

```
DSA Case Study/
└── frontend/
    ├── src/
    │   ├── lib/                     # Pure TypeScript graph algorithms from scratch
    │   │   ├── types.ts             # TypeScript interfaces for nodes, edges, steps, responses
    │   │   ├── priorityQueue.ts     # Binary Min-Heap Priority Queue (pure scratch)
    │   │   ├── graph.ts             # CityGraph class, adjacency list & Haversine distance
    │   │   ├── dijkstra.ts          # Dijkstra with step-by-step state recording
    │   │   ├── astar.ts             # A* Search with admissible Haversine heuristic
    │   │   ├── bellmanFord.ts       # Bellman-Ford with iterative relaxation passes
    │   │   ├── multiSource.ts       # Multi-Source nearest facility dispatch
    │   │   ├── alternatePath.ts     # Yen's edge-deviation second-shortest path
    │   │   └── index.ts             # Barrel export & algorithm comparison runner
    │   ├── data/
    │   │   └── sample_city.json     # Metro City dataset: 24 nodes, 45 edges
    │   ├── components/
    │   │   ├── CityMap.jsx          # Leaflet dark map with SVG routes & vehicle marker
    │   │   ├── Navbar.jsx           # Header, live stats, presets, import/export JSON
    │   │   ├── SidebarLeft.jsx      # Scenario selector, algorithm picker, map tools
    │   │   ├── SidebarRight.jsx     # Playback controls, Min-Heap viewer, analytics
    │   │   ├── PlaybackControls.jsx # Play, pause, step forward/back, speed slider
    │   │   ├── ComparisonChart.jsx  # Benchmark visual bar chart
    │   │   ├── NodeModal.jsx        # Add/edit vertex modal
    │   │   ├── EdgeModal.jsx        # Add/edit weighted road modal
    │   │   └── Legend.jsx           # Floating map legend
    │   ├── utils/
    │   │   ├── helpers.js           # Formatters, color themes, traffic helpers
    │   │   └── sampleData.js        # Fallback dataset
    │   ├── App.jsx                  # Main dashboard layout & state orchestrator
    │   ├── index.css                # Dark emergency aesthetic & glowing styling
    │   └── main.jsx
    ├── package.json
    ├── vite.config.js
    ├── tailwind.config.js
    └── vercel.json                  # Vercel deployment configuration
```

---

## 🚀 Setup & Execution

### Prerequisites
- **Node.js**: v18+ and `npm`

### Start Development Server
```bash
cd frontend
npm install
npm run dev
```
Open your browser at: `http://localhost:5173`

### Production Build
```bash
cd frontend
npm run build
```
Creates an optimized static bundle in `frontend/dist/` ready for immediate deployment to Vercel, Netlify, or GitHub Pages.
