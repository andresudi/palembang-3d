// v2.3 Real Road Route Planner (Public Zero-Key OSRM + Automatic Local A* Fallback on Baked OSM Palembang Graph)
import pathData from './data/palembang-paths.json';

function haversineM(a, b) {
  const R = 6371000;
  const toRad = Math.PI / 180;
  const dLat = (b[1] - a[1]) * toRad;
  const dLng = (b[0] - a[0]) * toRad;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(a[1] * toRad) * Math.cos(b[1] * toRad) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

function formatMins(mins) {
  if (mins < 1) return '<1 mnt';
  if (mins < 60) return `${Math.round(mins)} mnt`;
  const h = Math.floor(mins / 60);
  const m = Math.round(mins % 60);
  return m > 0 ? `${h}j ${m}m` : `${h} jam`;
}

// Build lightweight undirected adjacency list over baked Palembang OSM road nodes for instant offline A* fallback
let cachedAdj = null;
function getLocalGraph() {
  if (cachedAdj) return cachedAdj;
  const flat = pathData.nodes;
  const n = flat.length / 2;
  const adj = Array.from({ length: n }, () => []);
  for (const e of pathData.edges) {
    for (let i = 2; i < e.length - 1; i++) {
      const u = e[i];
      const v = e[i + 1];
      const dist = haversineM([flat[u * 2], flat[u * 2 + 1]], [flat[v * 2], flat[v * 2 + 1]]);
      adj[u].push([v, dist]);
      adj[v].push([u, dist]);
    }
  }
  cachedAdj = { flat, n, adj };
  return cachedAdj;
}

function findNearestNode(graph, coord) {
  const { flat, n, adj } = graph;
  let best = 0;
  let bestD = 1e12;
  for (let i = 0; i < n; i++) {
    if (adj[i].length === 0) continue;
    const dx = flat[i * 2] - coord[0];
    const dy = flat[i * 2 + 1] - coord[1];
    const d = dx * dx + dy * dy;
    if (d < bestD) {
      bestD = d;
      best = i;
    }
  }
  return best;
}

// Fast binary min-heap A* on local Palembang OSM graph
function computeLocalOsmRoute(fromCoord, toCoord) {
  const graph = getLocalGraph();
  const start = findNearestNode(graph, fromCoord);
  const goal = findNearestNode(graph, toCoord);
  const { flat, n, adj } = graph;
  const goalPt = [flat[goal * 2], flat[goal * 2 + 1]];

  const gScore = new Float64Array(n).fill(1e15);
  const prev = new Int32Array(n).fill(-1);
  const closed = new Uint8Array(n);
  gScore[start] = 0;

  // Simple min-heap of [fScore, nodeIdx]
  const heap = [[haversineM([flat[start * 2], flat[start * 2 + 1]], goalPt), start]];
  const push = (item) => {
    heap.push(item);
    let i = heap.length - 1;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (heap[p][0] <= heap[i][0]) break;
      [heap[p], heap[i]] = [heap[i], heap[p]];
      i = p;
    }
  };
  const pop = () => {
    const top = heap[0];
    const last = heap.pop();
    if (heap.length) {
      heap[0] = last;
      let i = 0;
      for (;;) {
        let l = i * 2 + 1;
        let r = l + 1;
        let sm = i;
        if (l < heap.length && heap[l][0] < heap[sm][0]) sm = l;
        if (r < heap.length && heap[r][0] < heap[sm][0]) sm = r;
        if (sm === i) break;
        [heap[i], heap[sm]] = [heap[sm], heap[i]];
        i = sm;
      }
    }
    return top;
  };

  let visited = 0;
  let found = false;
  while (heap.length && visited++ < 12000) {
    const [, u] = pop();
    if (u === goal) {
      found = true;
      break;
    }
    if (closed[u]) continue;
    closed[u] = 1;
    for (const [v, w] of adj[u]) {
      if (closed[v]) continue;
      const ng = gScore[u] + w;
      if (ng < gScore[v]) {
        gScore[v] = ng;
        prev[v] = u;
        const h = haversineM([flat[v * 2], flat[v * 2 + 1]], goalPt);
        push([ng + h, v]);
      }
    }
  }

  if (!found) {
    const direct = haversineM(fromCoord, toCoord);
    return {
      coords: [fromCoord, toCoord],
      distanceM: Math.round(direct),
      source: 'direct',
    };
  }

  const coords = [toCoord];
  let cur = goal;
  while (cur !== -1) {
    coords.push([flat[cur * 2], flat[cur * 2 + 1]]);
    cur = prev[cur];
  }
  coords.push(fromCoord);
  coords.reverse();
  return {
    coords,
    distanceM: Math.round(gScore[goal]),
    source: 'local-osm',
  };
}

export function createRoutePlanner({ map, onRouteChange }) {
  let activeRoute = null;

  function ensureLayers() {
    if (!map.getSource('palembang-route-src')) {
      map.addSource('palembang-route-src', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });
    }
    if (!map.getLayer('palembang-route-casing')) {
      map.addLayer({
        id: 'palembang-route-casing',
        type: 'line',
        source: 'palembang-route-src',
        filter: ['==', ['geometry-type'], 'LineString'],
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: {
          'line-color': '#0b1926',
          'line-width': 7.5,
          'line-opacity': 0.72,
        },
      });
    }
    if (!map.getLayer('palembang-route-line')) {
      map.addLayer({
        id: 'palembang-route-line',
        type: 'line',
        source: 'palembang-route-src',
        filter: ['==', ['geometry-type'], 'LineString'],
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: {
          'line-color': '#38bdf8',
          'line-width': 4.5,
        },
      });
    }
    if (!map.getLayer('palembang-route-pts')) {
      map.addLayer({
        id: 'palembang-route-pts',
        type: 'circle',
        source: 'palembang-route-src',
        filter: ['==', ['geometry-type'], 'Point'],
        paint: {
          'circle-radius': 7,
          'circle-color': ['get', 'color'],
          'circle-stroke-color': '#ffffff',
          'circle-stroke-width': 2.2,
        },
      });
    }
  }

  function renderGeoJson(route) {
    ensureLayers();
    const src = map.getSource('palembang-route-src');
    if (!src) return;
    if (!route) {
      src.setData({ type: 'FeatureCollection', features: [] });
      return;
    }
    src.setData({
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: {},
          geometry: { type: 'LineString', coordinates: route.coords },
        },
        {
          type: 'Feature',
          properties: { color: '#22c55e' },
          geometry: { type: 'Point', coordinates: route.from.center },
        },
        {
          type: 'Feature',
          properties: { color: '#ef4444' },
          geometry: { type: 'Point', coordinates: route.to.center },
        },
      ],
    });
  }

  async function planRoute(fromPoi, toPoi) {
    if (!fromPoi || !toPoi || fromPoi.id === toPoi.id) return null;
    let coords = null;
    let distanceM = 0;
    let source = 'osrm';

    // 1. Try public zero-key OSRM driving route first (3.5s timeout)
    try {
      const url = `https://router.project-osrm.org/route/v1/driving/${fromPoi.center[0]},${fromPoi.center[1]};${toPoi.center[0]},${toPoi.center[1]}?overview=full&geometries=geojson`;
      const res = await fetch(url, { signal: AbortSignal.timeout(3500) });
      if (res.ok) {
        const json = await res.json();
        const best = json?.routes?.[0];
        if (best?.geometry?.coordinates?.length >= 2) {
          coords = best.geometry.coordinates;
          distanceM = Math.round(best.distance);
          source = 'osrm';
        }
      }
    } catch {
      // Fall back cleanly to local OSM A* graph
    }

    // 2. Guaranteed local A* fallback on baked 413km Palembang OSM road network
    if (!coords) {
      const local = computeLocalOsmRoute(fromPoi.center, toPoi.center);
      coords = local.coords;
      distanceM = local.distanceM;
      source = local.source;
    }

    const km = distanceM / 1000;
    const gmapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${fromPoi.center[1]},${fromPoi.center[0]}&destination=${toPoi.center[1]},${toPoi.center[0]}&travelmode=driving`;

    activeRoute = {
      from: fromPoi,
      to: toPoi,
      coords,
      distanceM,
      formatted: distanceM >= 1000 ? `${km.toFixed(2)} km` : `${distanceM} m`,
      carEta: formatMins((km / 28) * 60),
      walkEta: formatMins((km / 4.8) * 60),
      source,
      gmapsUrl,
    };

    renderGeoJson(activeRoute);

    // Frame route cleanly in viewport
    let minLng = 180, maxLng = -180, minLat = 90, maxLat = -90;
    for (const [x, y] of coords) {
      if (x < minLng) minLng = x;
      if (x > maxLng) maxLng = x;
      if (y < minLat) minLat = y;
      if (y > maxLat) maxLat = y;
    }
    map.fitBounds(
      [
        [minLng, minLat],
        [maxLng, maxLat],
      ],
      { padding: { top: 96, bottom: 100, left: 340, right: 80 }, pitch: 52, duration: 1100, maxZoom: 16.8 }
    );

    onRouteChange?.(getState());
    return activeRoute;
  }

  function clearRoute() {
    activeRoute = null;
    renderGeoJson(null);
    onRouteChange?.(getState());
  }

  function getState() {
    if (!activeRoute) return null;
    return Object.freeze({
      fromId: activeRoute.from.id,
      fromLabel: activeRoute.from.label,
      toId: activeRoute.to.id,
      toLabel: activeRoute.to.label,
      distanceM: activeRoute.distanceM,
      formatted: activeRoute.formatted,
      carEta: activeRoute.carEta,
      walkEta: activeRoute.walkEta,
      source: activeRoute.source,
      gmapsUrl: activeRoute.gmapsUrl,
      coords: activeRoute.coords,
    });
  }

  return {
    onStyleLoad: ensureLayers,
    planRoute,
    clearRoute,
    getState,
  };
}
