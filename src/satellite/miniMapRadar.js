// v2.4 Compact Interactive 2D Mini-Map Radar for Real Satellite 3D
// Displays real Sungai Musi, LRT line, 20 POI dots, active road route, Sriwijaya relics,
// and live rotating camera FOV wedge. Click anywhere on the radar to fly straight there!
import pathData from './data/palembang-paths.json';
import { PALEMBANG_POIS } from './palembangPois.js';
import { SRIWIJAYA_RELICS } from './playableBoatLayer.js';

const BOUNDS = {
  minLng: 104.718,
  maxLng: 104.824,
  minLat: -3.032,
  maxLat: -2.968,
};

export function createMiniMapRadar({ map, routePlanner, playableBoat }) {
  const wrap = document.createElement('div');
  wrap.className = 'radar-widget';
  wrap.title = 'Radar Palembang · Klik untuk terbang langsung ke titik tujuan';

  const canvas = document.createElement('canvas');
  canvas.width = 264;
  canvas.height = 200;
  canvas.className = 'radar-canvas';

  const label = document.createElement('span');
  label.className = 'radar-label';
  label.textContent = 'RADAR MUSI · N ↑';

  wrap.append(canvas, label);
  const ctx = canvas.getContext('2d');

  let visible = true;
  let rafId = null;

  function toPx(lng, lat) {
    const x = ((lng - BOUNDS.minLng) / (BOUNDS.maxLng - BOUNDS.minLng)) * canvas.width;
    const y = ((BOUNDS.maxLat - lat) / (BOUNDS.maxLat - BOUNDS.minLat)) * canvas.height;
    return [x, y];
  }

  function toLngLat(px, py) {
    const lng = BOUNDS.minLng + (px / canvas.width) * (BOUNDS.maxLng - BOUNDS.minLng);
    const lat = BOUNDS.maxLat - (py / canvas.height) * (BOUNDS.maxLat - BOUNDS.minLat);
    return [lng, lat];
  }

  // Pre-filter river & LRT coordinates to radar bounds
  const riverPts = [];
  for (let i = 0; i < pathData.river[0].length; i += 2) {
    const lng = pathData.river[0][i];
    const lat = pathData.river[0][i + 1];
    if (lng >= BOUNDS.minLng - 0.01 && lng <= BOUNDS.maxLng + 0.01 && lat >= BOUNDS.minLat - 0.01 && lat <= BOUNDS.maxLat + 0.01) {
      riverPts.push(toPx(lng, lat));
    }
  }
  const lrtPts = [];
  for (let i = 0; i < pathData.lrt[0].length; i += 2) {
    const lng = pathData.lrt[0][i];
    const lat = pathData.lrt[0][i + 1];
    if (lng >= BOUNDS.minLng - 0.01 && lng <= BOUNDS.maxLng + 0.01 && lat >= BOUNDS.minLat - 0.01 && lat <= BOUNDS.maxLat + 0.01) {
      lrtPts.push(toPx(lng, lat));
    }
  }

  function draw() {
    if (!visible) return;
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    // Subtle radar grid
    ctx.strokeStyle = 'rgba(216, 173, 92, 0.12)';
    ctx.lineWidth = 1;
    for (let x = 44; x < w; x += 44) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 40; y < h; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // Sungai Musi ribbon
    if (riverPts.length > 1) {
      ctx.strokeStyle = 'rgba(56, 148, 178, 0.55)';
      ctx.lineWidth = 10;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      riverPts.forEach(([x, y], i) => (i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)));
      ctx.stroke();
    }

    // LRT Sumsel line
    if (lrtPts.length > 1) {
      ctx.strokeStyle = 'rgba(200, 61, 50, 0.78)';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      lrtPts.forEach(([x, y], i) => (i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)));
      ctx.stroke();
    }

    // Active route polyline (if any)
    const route = routePlanner?.getState?.();
    if (route?.coords?.length > 1) {
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 3;
      ctx.beginPath();
      route.coords.forEach(([lng, lat], i) => {
        const [x, y] = toPx(lng, lat);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
    }

    // 20 POI dots
    for (const poi of PALEMBANG_POIS) {
      const [x, y] = toPx(poi.center[0], poi.center[1]);
      ctx.fillStyle =
        poi.category === 'kuliner' ? '#fbbf24' : poi.category === 'lrt' ? '#38bdf8' : '#e2e8f0';
      ctx.beginPath();
      ctx.arc(x, y, poi.id === 'ampera' ? 4.0 : 2.3, 0, Math.PI * 2);
      ctx.fill();
    }

    // Sriwijaya relics when Playable Boat is active
    const boatSt = playableBoat?.getState?.();
    if (boatSt?.active) {
      ctx.fillStyle = '#fde047';
      for (const r of SRIWIJAYA_RELICS) {
        const [x, y] = toPx(r.lngLat[0], r.lngLat[1]);
        ctx.beginPath();
        ctx.arc(x, y, 3.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Live camera center + rotating FOV cone
    const c = map.getCenter();
    const [cx, cy] = toPx(c.lng, c.lat);
    const bearingRad = (map.getBearing() * Math.PI) / 180;
    // Canvas angle: 0 rad = East (+X), -PI/2 = North (-Y)
    const dirAngle = bearingRad - Math.PI / 2;

    ctx.fillStyle = 'rgba(216, 173, 92, 0.28)';
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, 26, dirAngle - 0.48, dirAngle + 0.48);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#ff4d42';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  function scheduleDraw() {
    if (rafId !== null) return;
    rafId = requestAnimationFrame(() => {
      rafId = null;
      draw();
    });
  }

  map.on('move', scheduleDraw);
  canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const py = ((e.clientY - rect.top) / rect.height) * canvas.height;
    const [lng, lat] = toLngLat(px, py);
    map.flyTo({ center: [lng, lat], duration: 900, essential: true });
  });

  function setVisible(flag) {
    visible = Boolean(flag);
    wrap.classList.toggle('hidden', !visible);
    if (visible) scheduleDraw();
  }

  draw();

  return {
    el: wrap,
    setVisible,
    isVisible: () => visible,
    refresh: scheduleDraw,
    cleanup() {
      map.off('move', scheduleDraw);
      if (rafId !== null) cancelAnimationFrame(rafId);
    },
  };
}
