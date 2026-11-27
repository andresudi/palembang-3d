#!/usr/bin/env node
// Fetches real Palembang road network, Musi River centerline, and LRT Sumsel route from
// OpenStreetMap (Overpass API) and bakes them into a compact JSON used by the animated
// traffic layer in Satellite 3D mode. Data © OpenStreetMap contributors (ODbL).
//
// Usage: node scripts/fetch-osm-paths.mjs
import { writeFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = resolve(ROOT, 'src/satellite/data/palembang-paths.json');

const ENDPOINTS = [
  'https://overpass.private.coffee/api/interpreter',
  'https://overpass-api.de/api/interpreter',
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
];

// (south, west, north, east)
const ROAD_BBOX = '-3.06,104.68,-2.90,104.84';
const RAIL_BBOX = '-3.06,104.66,-2.86,104.84';
const RIVER_BBOX = '-3.08,104.62,-2.92,104.92';

const QUERY = `
[out:json][timeout:120];
(
  way["highway"~"^(trunk|primary|secondary|tertiary|trunk_link|primary_link|secondary_link)$"](${ROAD_BBOX});
  way["railway"="light_rail"](${RAIL_BBOX});
  way["waterway"="river"]["name"~"Musi"](${RIVER_BBOX});
  node["railway"="station"](${RAIL_BBOX});
);
out body;
>;
out skel qt;
`;

async function fetchOverpass() {
  let lastErr;
  for (const url of ENDPOINTS) {
    try {
      console.log(`Querying ${url} ...`);
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'palembang-3d-demo/1.0 (open-source visualization)',
        },
        body: 'data=' + encodeURIComponent(QUERY),
        signal: AbortSignal.timeout(90000),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn(`  failed: ${err.message}`);
      lastErr = err;
    }
  }
  throw lastErr;
}

const round6 = (v) => Math.round(v * 1e6) / 1e6;

function haversine(a, b) {
  const R = 6371000;
  const toRad = Math.PI / 180;
  const dLat = (b[1] - a[1]) * toRad;
  const dLng = (b[0] - a[0]) * toRad;
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(a[1] * toRad) * Math.cos(b[1] * toRad) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

function lineLength(coords) {
  let len = 0;
  for (let i = 1; i < coords.length; i++) len += haversine(coords[i - 1], coords[i]);
  return len;
}

// Greedily stitch ways (arrays of node ids) that share endpoints into long chains.
function stitch(ways) {
  const remaining = new Set(ways.map((_, i) => i));
  const byEnd = new Map();
  ways.forEach((w, i) => {
    for (const id of [w[0], w[w.length - 1]]) {
      if (!byEnd.has(id)) byEnd.set(id, []);
      byEnd.get(id).push(i);
    }
  });
  const take = (endId) => {
    for (const i of byEnd.get(endId) || []) {
      if (remaining.has(i)) {
        remaining.delete(i);
        const w = ways[i];
        return w[0] === endId ? w.slice() : w.slice().reverse();
      }
    }
    return null;
  };
  const chains = [];
  while (remaining.size) {
    const first = remaining.values().next().value;
    remaining.delete(first);
    let chain = ways[first].slice();
    for (;;) {
      const next = take(chain[chain.length - 1]);
      if (!next) break;
      chain = chain.concat(next.slice(1));
    }
    for (;;) {
      const prev = take(chain[0]);
      if (!prev) break;
      chain = prev.reverse().concat(chain.slice(1));
    }
    chains.push(chain);
  }
  return chains;
}

const CLASS_CODE = { trunk: 0, primary: 1, secondary: 2, tertiary: 3 };

async function main() {
  const data = await fetchOverpass();
  const nodeCoords = new Map();
  const roads = [];
  const lrtWays = [];
  const riverWays = [];
  const stations = [];

  for (const el of data.elements) {
    if (el.type === 'node') {
      nodeCoords.set(el.id, [el.lon, el.lat]);
      if (el.tags?.railway === 'station' && el.tags?.name) {
        stations.push({ name: el.tags.name, lng: round6(el.lon), lat: round6(el.lat) });
      }
    }
  }
  for (const el of data.elements) {
    if (el.type !== 'way' || !el.tags) continue;
    if (el.tags.highway) roads.push(el);
    else if (el.tags.railway === 'light_rail') lrtWays.push(el.nodes);
    else if (el.tags.waterway === 'river') riverWays.push(el.nodes);
  }

  // --- Road graph: split ways into edges at junction nodes ---
  const usage = new Map();
  for (const w of roads) {
    w.nodes.forEach((id, i) => {
      const isEnd = i === 0 || i === w.nodes.length - 1;
      usage.set(id, (usage.get(id) || 0) + (isEnd ? 2 : 1));
    });
  }
  const nodeIndex = new Map();
  const flatNodes = [];
  const idx = (id) => {
    if (!nodeIndex.has(id)) {
      const c = nodeCoords.get(id);
      nodeIndex.set(id, flatNodes.length / 2);
      flatNodes.push(round6(c[0]), round6(c[1]));
    }
    return nodeIndex.get(id);
  };

  const edges = [];
  for (const w of roads) {
    const t = w.tags;
    const base = t.highway.replace('_link', '');
    const cls = t.highway.endsWith('_link') ? 4 : CLASS_CODE[base] ?? 3;
    let nodes = w.nodes.filter((id) => nodeCoords.has(id));
    if (nodes.length < 2) continue;
    let oneway = t.oneway === 'yes' || t.oneway === '1' || t.oneway === 'true' || t.junction === 'roundabout' || t.junction === 'circular';
    if (t.oneway === '-1') {
      nodes = nodes.slice().reverse();
      oneway = true;
    }
    const bridge = t.bridge && t.bridge !== 'no' ? 1 : 0;
    const flags = (oneway ? 1 : 0) | (bridge ? 2 : 0);
    let start = 0;
    for (let i = 1; i < nodes.length; i++) {
      if (i === nodes.length - 1 || (usage.get(nodes[i]) || 0) > 1) {
        const seg = nodes.slice(start, i + 1);
        if (seg.length >= 2) edges.push([cls, flags, ...seg.map(idx)]);
        start = i;
      }
    }
  }

  const toCoords = (chain) => chain.filter((id) => nodeCoords.has(id)).map((id) => nodeCoords.get(id));
  const flat = (coords) => coords.flatMap(([x, y]) => [round6(x), round6(y)]);

  const lrtChains = stitch(lrtWays)
    .map(toCoords)
    .filter((c) => lineLength(c) > 1500)
    .sort((a, b) => lineLength(b) - lineLength(a));
  const riverChains = stitch(riverWays)
    .map(toCoords)
    .sort((a, b) => lineLength(b) - lineLength(a));

  // De-duplicate stations by name (OSM may have one node per platform)
  const seen = new Set();
  const uniqStations = stations.filter((s) => (seen.has(s.name) ? false : (seen.add(s.name), true)));

  const out = {
    meta: {
      source: 'OpenStreetMap contributors via Overpass API',
      license: 'ODbL 1.0 — https://www.openstreetmap.org/copyright',
      roadBbox: ROAD_BBOX,
      generated: new Date().toISOString().slice(0, 10),
    },
    nodes: flatNodes,
    edges,
    lrt: lrtChains.slice(0, 2).map(flat),
    river: riverChains.slice(0, 1).map(flat),
    stations: uniqStations,
  };

  await mkdir(dirname(OUT), { recursive: true });
  const json = JSON.stringify(out);
  await writeFile(OUT, json);
  const roadKm = edges.reduce((sum, e) => {
    const c = e.slice(2).map((i) => [flatNodes[i * 2], flatNodes[i * 2 + 1]]);
    return sum + lineLength(c);
  }, 0) / 1000;
  console.log(JSON.stringify({
    out: 'src/satellite/data/palembang-paths.json',
    bytes: json.length,
    roadWays: roads.length,
    roadEdges: edges.length,
    roadNodes: flatNodes.length / 2,
    roadKm: Math.round(roadKm),
    bridgesEdges: edges.filter((e) => e[1] & 2).length,
    lrtChainsKm: lrtChains.map((c) => +(lineLength(c) / 1000).toFixed(2)),
    riverChainsKm: riverChains.map((c) => +(lineLength(c) / 1000).toFixed(2)),
    stations: uniqStations.map((s) => s.name),
  }, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
