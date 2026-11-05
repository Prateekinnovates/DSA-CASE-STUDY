# 🚑 Route-O-Rescue: Shortest Path Planning for Emergency Services

[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688?style=flat&logo=fastapi)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18.3-61DAFB?style=flat&logo=react)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-5.2-646CFF?style=flat&logo=vite)](https://vitejs.dev)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?style=flat&logo=tailwind-css)](https://tailwindcss.com)
[![Leaflet](https://img.shields.io/badge/Leaflet-1.9-199900?style=flat&logo=leaflet)](https://leafletjs.com)
[![Python Tests](https://img.shields.io/badge/Pytest-23%20Passed-brightgreen?style=flat&logo=pytest)](https://pytest.org)

**Route-O-Rescue** is an interactive, mission-critical emergency dispatch and route optimization platform. It models urban infrastructure as a directed/undirected weighted graph where intersections, hospitals, fire stations, and accident sites form vertices, while streets with distance, dynamic traffic multipliers, and road closures form weighted edges.

All graph algorithms—including **Dijkstra's Algorithm**, **A\* Search**, **Bellman-Ford**, and **Multi-Source Dijkstra**—are **implemented entirely from scratch** without graph libraries (like `networkx`) or built-in priority queue modules.

---

## 🌟 Core Features

### 1. 🗺️ Interactive Graph Builder & Map
- **Click-to-Build**: Click anywhere on the dark map canvas to add facilities (**Hospital**, **Fire Station**, **Police Station**, **Junction**, or **Accident Site**).
- **Interactive Road Network**: Connect vertices with weighted edges including distance (km), traffic multiplier factor ($1.0\times$ to $5.0\times$), speed limit (km/h), and status (`open` or `blocked`).
- **Drag-to-Move**: Drag any node to reposition it; coordinates and road lengths dynamically update.
- **Import / Export**: Save and load custom city graphs as JSON.
- **Preset City**: Preloaded with a realistic 24-node, 45-edge **Metro City Emergency Response Network**.

### 2. ⚡ Pure From-Scratch Graph Algorithms
- **Dijkstra's Algorithm**: Implemented with a custom **Binary Min-Heap Priority Queue** from scratch. Guarantees optimal shortest paths on non-negative weighted graphs in $\mathcal{O}((V + E) \log V)$ time.
- **A\* Search**: Uses an admissible and consistent **Haversine great-circle distance heuristic** scaled by maximum velocity, ensuring fewer explored vertices while maintaining guaranteed optimality.
- **Bellman-Ford Algorithm**: Iteratively relaxes all edges across $|V|-1$ passes. Demonstrates dynamic weight adaptation and verifies absence of negative-weight cycles in $\mathcal{O}(V \cdot E)$ time.
- **Multi-Source Dijkstra**: Dispatches the closest emergency unit across multiple distributed stations to an incident site with one click.
- **Backup Alternate Route (Yen's Edge-Deviation)**: Computes a resilient second-shortest path as an immediate detour in case the primary road becomes congested or blocked en route.

### 3. 🚨 Real-Time Emergency Scenarios & Auto-Rerouting
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
├── backend/
│   ├── app/
│   │   ├── algorithms/
│   │   │   ├── priority_queue.py   # Custom Binary Min-Heap (pure scratch)
│   │   │   ├── dijkstra.py         # Dijkstra with step recorder
│   │   │   ├── astar.py            # A* with Haversine heuristic
│   │   │   ├── bellman_ford.py     # Bellman-Ford with iterative relaxation
│   │   │   ├── multi_source.py     # Multi-Source nearest facility dispatch
│   │   │   └── alternate_path.py   # Yen's edge-deviation second shortest path
│   │   ├── data/
│   │   │   └── sample_city.json    # Metro City: 24 nodes, 45 edges
│   │   ├── graph.py                # Graph data structure & cost modeling
│   │   ├── models.py               # Pydantic request/response schemas
│   │   └── main.py                 # FastAPI application & REST endpoints
│   ├── tests/
│   │   ├── test_priority_queue.py  # MinHeap data structure unit tests
│   │   ├── test_algorithms.py      # Dijkstra, A*, Bellman-Ford accuracy tests
│   │   ├── test_edge_cases.py      # Disconnected, same node, zero cost, road blocks
│   │   ├── test_multi_source.py    # Multi-source dispatch tests
│   │   └── test_api.py             # FastAPI REST endpoint integration tests
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── CityMap.jsx          # Leaflet dark map with SVG routes & vehicle
│   │   │   ├── Navbar.jsx           # Header, live stats, presets, import/export
│   │   │   ├── SidebarLeft.jsx      # Scenario selector, algorithm picker, map tools
│   │   │   ├── SidebarRight.jsx     # Playback controls, Min-Heap viewer, analytics
│   │   │   ├── PlaybackControls.jsx # Play, pause, step forward/back, speed
│   │   │   ├── ComparisonChart.jsx  # Benchmark visual bar chart
│   │   │   ├── NodeModal.jsx        # Add/edit vertex modal
│   │   │   ├── EdgeModal.jsx        # Add/edit weighted road modal
│   │   │   └── Legend.jsx           # Floating map legend
│   │   ├── services/
│   │   │   └── api.js               # REST client for FastAPI
│   │   ├── utils/
│   │   │   ├── helpers.js           # Formatters, color themes, traffic helpers
│   │   │   └── sampleData.js        # Fallback offline client dataset
│   │   ├── App.jsx                  # Main dashboard layout & state orchestrator
│   │   ├── index.css                # Dark emergency aesthetic & glowing styling
│   │   └── main.jsx
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── vercel.json
├── render.yaml                      # Deploy configuration for Render
└── README.md
```

---

## 🚀 Setup & Local Execution Instructions

### Prerequisites
- **Python**: 3.10+
- **Node.js**: v18+ and `npm`

### 1. Backend Setup (FastAPI)
```bash
# Navigate to backend directory
cd "DSA Case Study/backend"

# Install dependencies
pip install -r requirements.txt

# Run the full unit test suite (23 tests)
$env:PYTHONPATH="." # On Windows PowerShell
pytest tests -v

# Start the FastAPI server
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
The backend API documentation is now live at: `http://127.0.0.1:8000/docs`

### 2. Frontend Setup (React + Vite + Tailwind)
```bash
# Open a new terminal and navigate to frontend directory
cd "DSA Case Study/frontend"

# Install packages
npm install

# Start development server
npm run dev
```
Open your browser at: `http://localhost:5173`

---

## 🧪 Unit Test Coverage (pytest)
The test suite in `backend/tests/` verifies correctness and handles critical edge cases:
- `test_priority_queue.py`: Custom `MinHeap` push, pop, order preservation, tie-breaking, and state serialization.
- `test_algorithms.py`: Dijkstra, A\*, Bellman-Ford path accuracy, cost equivalence, and second-shortest path derivation.
- `test_edge_cases.py`:
  - Disconnected graph (returns `found: False` with descriptive error).
  - Source equals destination ($\text{distance} = 0$, immediate path).
  - Blocked roads (safely detours around blocked segments).
  - Heavy traffic congestion (diverts onto faster routes despite longer raw distance).
  - Invalid / nonexistent node identifiers.
- `test_multi_source.py`: Multi-source hospital and fire station emergency dispatch.
- `test_api.py`: Full REST API endpoint verification with `TestClient`.

To execute:
```bash
pytest backend/tests -v
```
Output:
```text
======================= 23 passed in 0.46s =======================
```

---

## 🌐 Cloud Deployment Guide

### Deploying Backend to Render
1. Push the repository to GitHub.
2. In [Render](https://render.com), create a new **Web Service**.
3. Choose runtime **Python 3**.
4. Set Build Command: `pip install -r backend/requirements.txt`
5. Set Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
6. Set Environment Variable: `PYTHONPATH=backend`
*(Alternatively, import `render.yaml` directly).*

### Deploying Frontend to Vercel
1. In [Vercel](https://vercel.com), import the `frontend/` directory.
2. Set Build Command: `npm run build`
3. Set Output Directory: `dist`
4. The included `frontend/vercel.json` ensures client-side routing works smoothly.

---

## 🔮 Future Scope & Extensibility
1. **Real-Time Traffic APIs**: Ingest live congestion data from Google Maps Directions API or TomTom Traffic Flow into edge weights.
2. **OpenStreetMap Overpass Integration**: Import real-world street geometry and intersections for any geographic city coordinate bounding box.
3. **Multi-Vehicle Fleet Dispatch**: Implement Hungarian Algorithm / Minimum Cost Maximum Flow (MCMF) for dispatching multiple emergency units to multiple simultaneous accidents.
4. **Emergency Green Wave Preemption**: Model traffic light preemption along the emergency corridor to clear red lights before vehicle arrival.

