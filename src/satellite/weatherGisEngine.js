// Phase 3 Smart City & GIS Engine (100% Zero-API-Key):
// 1. Live Palembang Weather via Open-Meteo + Manual Simulation + Tropical Rain Particle Overlay
// 2. Real-Time Musi River Tide / Flood Elevation Simulation (MapLibre 3D WebGL depth-tested water plane)
// 3. Two-Point GIS Distance & Travel-Time Measure Tool
import * as THREE from 'three';
import * as maplibregl from 'maplibre-gl';

const ANCHOR_LNGLAT = [104.76340, -2.99194];
const OPEN_METEO_URL =
  'https://api.open-meteo.com/v1/forecast?latitude=-2.9909&longitude=104.7566&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,precipitation&timezone=Asia%2FJakarta';

function decodeWmoCode(code) {
  if (code === 0 || code === 1) return { mode: 'cerah', label: 'Cerah', icon: '☀️' };
  if (code === 2 || code === 3 || code === 45 || code === 48) {
    return { mode: 'berawan', label: 'Berawan', icon: '⛅' };
  }
  if (code >= 95) return { mode: 'hujan', label: 'Hujan Petir Tropis', icon: '⛈️', storm: true };
  if (code >= 51) return { mode: 'hujan', label: 'Hujan Tropis', icon: '🌧️' };
  return { mode: 'berawan', label: 'Berawan', icon: '⛅' };
}

function haversineMeters(a, b) {
  const R = 6371000;
  const toRad = Math.PI / 180;
  const dLat = (b[1] - a[1]) * toRad;
  const dLng = (b[0] - a[0]) * toRad;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(a[1] * toRad) * Math.cos(b[1] * toRad) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

function formatDuration(minutes) {
  if (minutes < 1) return '<1 mnt';
  if (minutes < 60) return `${Math.round(minutes)} mnt`;
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return m > 0 ? `${h}j ${m}m` : `${h} jam`;
}

export function getTideStatus(meters) {
  if (meters <= 0.05) return { level: 'normal', text: 'Normal · Muka air standar Sungai Musi' };
  if (meters <= 1.2) return { level: 'waspada', text: 'Pasang Harian · Dermaga & tepian mulai tergenang' };
  if (meters <= 2.4) return { level: 'siaga', text: 'Siaga Pasang Tinggi · Genangan tepian BKB, 16 Ilir & 7 Ulu' };
  return { level: 'awas', text: 'Banjir Rob Signifikan · Permukiman dataran rendah tergenang' };
}

export function createWeatherGisEngine({
  map,
  rootEl,
  ambience,
  onWeatherChange,
  onTideChange,
  onMeasureChange,
}) {
  // === 1. Tropical Rain Particle Canvas Overlay ===
  const rainCanvas = document.createElement('canvas');
  rainCanvas.className = 'rain-overlay';
  rainCanvas.setAttribute('aria-hidden', 'true');
  rootEl.appendChild(rainCanvas);
  const rainCtx = rainCanvas.getContext('2d');

  let weatherMode = 'cerah'; // 'cerah' | 'berawan' | 'hujan'
  let lightingMode = 'siang';
  let isStorm = false;
  let liveWeatherData = null;
  let weatherSource = 'manual'; // 'manual' | 'live'
  let rainRafId = null;
  let lightningAlpha = 0;

  const DROP_COUNT = 340;
  const drops = Array.from({ length: DROP_COUNT }, () => ({
    x: Math.random(),
    y: Math.random(),
    z: 0.35 + Math.random() * 0.65, // parallax depth
    len: 12 + Math.random() * 18,
    speed: 0.75 + Math.random() * 0.75,
  }));

  function resizeRainCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = rootEl.clientWidth || window.innerWidth;
    const h = rootEl.clientHeight || window.innerHeight;
    if (rainCanvas.width !== Math.round(w * dpr) || rainCanvas.height !== Math.round(h * dpr)) {
      rainCanvas.width = Math.round(w * dpr);
      rainCanvas.height = Math.round(h * dpr);
    }
  }

  let lastRainTs = 0;
  function tickRain(ts) {
    if (weatherMode !== 'hujan') {
      rainRafId = null;
      return;
    }
    const dt = lastRainTs > 0 ? Math.min(0.06, (ts - lastRainTs) / 1000) : 0.016;
    lastRainTs = ts;

    resizeRainCanvas();
    const w = rainCanvas.width;
    const h = rainCanvas.height;
    rainCtx.clearRect(0, 0, w, h);

    // Subtle overcast mist tint during tropical downpour
    const isNight = lightingMode === 'malam';
    rainCtx.fillStyle = isNight ? 'rgba(10, 18, 30, 0.16)' : 'rgba(165, 188, 208, 0.14)';
    rainCtx.fillRect(0, 0, w, h);

    // Occasional soft lightning shimmer during thunderstorm
    if (isStorm && Math.random() < 0.004) {
      lightningAlpha = 0.24;
    }
    if (lightningAlpha > 0.005) {
      rainCtx.fillStyle = `rgba(225, 240, 255, ${lightningAlpha.toFixed(3)})`;
      rainCtx.fillRect(0, 0, w, h);
      lightningAlpha *= 0.86;
    }

    const windSlant = 0.17;
    rainCtx.lineCap = 'round';
    for (let i = 0; i < DROP_COUNT; i++) {
      const d = drops[i];
      d.y += d.speed * d.z * dt * 1.95;
      d.x += windSlant * d.speed * d.z * dt * 1.1;
      if (d.y > 1.05) {
        d.y = -0.05;
        d.x = Math.random() * 1.15 - 0.15;
      }
      if (d.x > 1.08) d.x -= 1.16;

      const x0 = d.x * w;
      const y0 = d.y * h;
      const streak = d.len * d.z * (w / 1280);
      rainCtx.strokeStyle = isNight
        ? `rgba(185, 215, 245, ${(0.22 + d.z * 0.26).toFixed(2)})`
        : `rgba(226, 242, 255, ${(0.28 + d.z * 0.34).toFixed(2)})`;
      rainCtx.lineWidth = 0.7 + d.z * 1.15;
      rainCtx.beginPath();
      rainCtx.moveTo(x0, y0);
      rainCtx.lineTo(x0 + streak * windSlant * 1.4, y0 + streak);
      rainCtx.stroke();
    }

    rainRafId = requestAnimationFrame(tickRain);
  }

  function setWeatherMode(mode, { source = 'manual', storm = false } = {}) {
    weatherMode = mode === 'hujan' || mode === 'berawan' ? mode : 'cerah';
    weatherSource = source;
    isStorm = Boolean(storm);
    rootEl.dataset.weather = weatherMode;

    if (weatherMode === 'hujan') {
      ambience?.setRainIntensity(isStorm ? 0.95 : 0.72);
      if (rainRafId === null) {
        lastRainTs = 0;
        rainRafId = requestAnimationFrame(tickRain);
      }
    } else {
      ambience?.setRainIntensity(0);
      if (rainRafId !== null) {
        cancelAnimationFrame(rainRafId);
        rainRafId = null;
      }
      rainCtx.clearRect(0, 0, rainCanvas.width, rainCanvas.height);
    }

    onWeatherChange(getWeatherState());
  }

  async function syncLiveWeather() {
    try {
      const res = await fetch(OPEN_METEO_URL);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const cur = json?.current;
      if (!cur) throw new Error('Data cuaca tidak tersedia');
      const decoded = decodeWmoCode(cur.weather_code);
      liveWeatherData = {
        tempC: cur.temperature_2m,
        humidity: cur.relative_humidity_2m,
        windKmh: cur.wind_speed_10m,
        precipMm: cur.precipitation,
        code: cur.weather_code,
        label: decoded.label,
        icon: decoded.icon,
        time: cur.time,
      };
      setWeatherMode(decoded.mode, { source: 'live', storm: Boolean(decoded.storm) });
      return liveWeatherData;
    } catch (err) {
      console.warn('Open-Meteo fetch failed:', err?.message || err);
      onWeatherChange(getWeatherState(err?.message || 'Gagal memuat cuaca live'));
      return null;
    }
  }

  function getWeatherState(errorMsg = '') {
    return Object.freeze({
      mode: weatherMode,
      source: weatherSource,
      isStorm,
      live: liveWeatherData,
      error: errorMsg,
    });
  }

  // === 2. Musi River 3D Tide / Flood Elevation Simulation ===
  const anchor = maplibregl.MercatorCoordinate.fromLngLat(ANCHOR_LNGLAT, 0);
  const meterScale = anchor.meterInMercatorCoordinateUnits();
  const rotX = new THREE.Matrix4().makeRotationAxis(new THREE.Vector3(1, 0, 0), Math.PI / 2);
  const anchorMatrix = new THREE.Matrix4()
    .makeTranslation(anchor.x, anchor.y, anchor.z)
    .scale(new THREE.Vector3(meterScale, -meterScale, meterScale))
    .multiply(rotX);

  const tideScene = new THREE.Scene();
  const tideUniforms = {
    uTime: { value: 0 },
    uTint: { value: new THREE.Color('#2c6b74') },
    uHighlight: { value: new THREE.Color('#9cd7e0') },
    uOpacity: { value: 0.56 },
  };
  const tideMat = new THREE.ShaderMaterial({
    uniforms: tideUniforms,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    vertexShader: `
      varying vec2 vWorldXZ;
      void main() {
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vWorldXZ = wp.xz;
        gl_Position = projectionMatrix * viewMatrix * wp;
      }
    `,
    fragmentShader: `
      uniform float uTime;
      uniform vec3 uTint;
      uniform vec3 uHighlight;
      uniform float uOpacity;
      varying vec2 vWorldXZ;
      void main() {
        float w1 = sin(vWorldXZ.x * 0.045 + uTime * 1.4) * cos(vWorldXZ.y * 0.042 - uTime * 1.1);
        float w2 = sin((vWorldXZ.x + vWorldXZ.y) * 0.09 - uTime * 2.1);
        float shimmer = smoothstep(0.35, 0.95, 0.5 + 0.35 * w1 + 0.15 * w2);
        vec3 col = mix(uTint, uHighlight, shimmer * 0.38);
        gl_FragColor = vec4(col, uOpacity);
      }
    `,
  });
  const tideGeo = new THREE.PlaneGeometry(14000, 10000);
  tideGeo.rotateX(-Math.PI / 2);
  const tideMesh = new THREE.Mesh(tideGeo, tideMat);
  tideMesh.frustumCulled = false;
  tideMesh.visible = false;
  tideScene.add(tideMesh);

  let tideRenderer = null;
  let tideCamera = null;
  let tideMeters = 0;

  const tideLayer = {
    id: 'palembang-musi-tide-3d',
    type: 'custom',
    renderingMode: '3d',
    onAdd(m, gl) {
      tideCamera = new THREE.Camera();
      tideRenderer = new THREE.WebGLRenderer({
        canvas: m.getCanvas(),
        context: gl,
        antialias: true,
      });
      tideRenderer.autoClear = false;
      tideRenderer.outputColorSpace = THREE.SRGBColorSpace;
    },
    render(gl, options) {
      if (!tideRenderer || !tideCamera || tideMeters <= 0.02) return;
      const projArr = options?.defaultProjectionData?.mainMatrix || options?.modelViewProjectionMatrix || options;
      const proj = new THREE.Matrix4().fromArray(projArr);

      // Anchor floodwater slightly above Musi River baseline elevation, scaled with terrain exaggeration (1.35)
      const baseElev =
        typeof map.queryTerrainElevation === 'function'
          ? Math.max(0, map.queryTerrainElevation(ANCHOR_LNGLAT) || 0)
          : 0;
      tideMesh.position.y = baseElev + 1.8 + tideMeters * 3.1;
      tideMesh.visible = true;
      tideUniforms.uTime.value = performance.now() * 0.001;

      tideRenderer.resetState();
      tideCamera.projectionMatrix = proj.multiply(anchorMatrix);
      tideRenderer.render(tideScene, tideCamera);
    },
  };

  function setTideMeters(val) {
    tideMeters = Math.max(0, Math.min(3.5, Number(val) || 0));
    tideMesh.visible = tideMeters > 0.02;
    tideUniforms.uOpacity.value = 0.44 + Math.min(0.28, tideMeters * 0.08);
    map.triggerRepaint();
    onTideChange(getTideState());
  }

  function getTideState() {
    const status = getTideStatus(tideMeters);
    return Object.freeze({
      meters: Number(tideMeters.toFixed(1)),
      level: status.level,
      statusText: status.text,
    });
  }

  function setLightingMode(mode) {
    lightingMode = mode;
    if (mode === 'malam') {
      tideUniforms.uTint.value.set('#142c3b');
      tideUniforms.uHighlight.value.set('#4c7c96');
    } else if (mode === 'senja') {
      tideUniforms.uTint.value.set('#4b534c');
      tideUniforms.uHighlight.value.set('#e5a365');
    } else {
      tideUniforms.uTint.value.set('#2c6b74');
      tideUniforms.uHighlight.value.set('#9cd7e0');
    }
  }

  // === 3. Two-Point GIS Distance Measure Tool ===
  let measureActive = false;
  let pointA = null;
  let pointB = null;

  function ensureMeasureLayers() {
    if (!map.getSource('palembang-measure-src')) {
      map.addSource('palembang-measure-src', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });
    }
    if (!map.getLayer('palembang-measure-line')) {
      map.addLayer({
        id: 'palembang-measure-line',
        type: 'line',
        source: 'palembang-measure-src',
        filter: ['==', ['geometry-type'], 'LineString'],
        paint: {
          'line-color': '#f5c556',
          'line-width': 3.5,
          'line-dasharray': [2.5, 1.5],
        },
      });
    }
    if (!map.getLayer('palembang-measure-pts')) {
      map.addLayer({
        id: 'palembang-measure-pts',
        type: 'circle',
        source: 'palembang-measure-src',
        filter: ['==', ['geometry-type'], 'Point'],
        paint: {
          'circle-radius': 7,
          'circle-color': '#c83d32',
          'circle-stroke-color': '#f5c556',
          'circle-stroke-width': 2.5,
        },
      });
    }
    if (!map.getLayer('palembang-measure-labels')) {
      map.addLayer({
        id: 'palembang-measure-labels',
        type: 'symbol',
        source: 'palembang-measure-src',
        filter: ['==', ['geometry-type'], 'Point'],
        layout: {
          'text-field': ['get', 'label'],
          'text-font': ['Noto Sans Regular'],
          'text-size': 12,
          'text-offset': [0, -1.45],
        },
        paint: {
          'text-color': '#fff8e8',
          'text-halo-color': 'rgba(16, 22, 27, 0.92)',
          'text-halo-width': 1.8,
        },
      });
    }
  }

  function updateMeasureGeoJson() {
    const src = map.getSource('palembang-measure-src');
    if (!src) return;
    const features = [];
    if (pointA) {
      features.push({
        type: 'Feature',
        properties: { label: 'Titik A' },
        geometry: { type: 'Point', coordinates: pointA },
      });
    }
    if (pointB) {
      features.push({
        type: 'Feature',
        properties: { label: 'Titik B' },
        geometry: { type: 'Point', coordinates: pointB },
      });
    }
    if (pointA && pointB) {
      features.push({
        type: 'Feature',
        properties: {},
        geometry: { type: 'LineString', coordinates: [pointA, pointB] },
      });
    }
    src.setData({ type: 'FeatureCollection', features });
  }

  function getMeasureState() {
    if (!pointA || !pointB) {
      return Object.freeze({
        active: measureActive,
        hasA: Boolean(pointA),
        hasB: Boolean(pointB),
        distanceM: null,
        formatted: null,
        eta: null,
      });
    }
    const distanceM = Math.round(haversineMeters(pointA, pointB));
    const km = distanceM / 1000;
    const formatted = distanceM >= 1000 ? `${km.toFixed(2)} km` : `${distanceM} m`;
    return Object.freeze({
      active: measureActive,
      hasA: true,
      hasB: true,
      distanceM,
      formatted,
      eta: Object.freeze({
        walk: formatDuration((km / 4.8) * 60),
        car: formatDuration((km / 32) * 60),
        lrt: formatDuration((km / 52) * 60),
        ketek: formatDuration((km / 16) * 60),
      }),
    });
  }

  function setMeasureActive(flag) {
    measureActive = Boolean(flag);
    map.getCanvas().style.cursor = measureActive ? 'crosshair' : '';
    if (!measureActive) {
      pointA = null;
      pointB = null;
      updateMeasureGeoJson();
    } else {
      ensureMeasureLayers();
    }
    onMeasureChange(getMeasureState());
  }

  function setMeasurePoints(a, b) {
    measureActive = true;
    map.getCanvas().style.cursor = 'crosshair';
    ensureMeasureLayers();
    pointA = [a[0], a[1]];
    pointB = [b[0], b[1]];
    updateMeasureGeoJson();
    onMeasureChange(getMeasureState());
  }

  function clearMeasurePoints() {
    pointA = null;
    pointB = null;
    updateMeasureGeoJson();
    onMeasureChange(getMeasureState());
  }

  function onMapClick(e) {
    if (!measureActive) return;
    const coord = [Number(e.lngLat.lng.toFixed(6)), Number(e.lngLat.lat.toFixed(6))];
    if (!pointA || (pointA && pointB)) {
      pointA = coord;
      pointB = null;
    } else {
      pointB = coord;
    }
    ensureMeasureLayers();
    updateMeasureGeoJson();
    onMeasureChange(getMeasureState());
  }

  map.on('click', onMapClick);

  function onStyleLoad() {
    if (!map.getLayer('palembang-musi-tide-3d')) {
      const beforeId = map.getLayer('palembang-hero-3d') ? 'palembang-hero-3d' : 'road-labels';
      map.addLayer(tideLayer, beforeId);
    }
    ensureMeasureLayers();
  }

  function cleanup() {
    if (rainRafId !== null) cancelAnimationFrame(rainRafId);
    map.off('click', onMapClick);
    rainCanvas.remove();
  }

  return {
    onStyleLoad,
    setWeatherMode,
    syncLiveWeather,
    getWeatherState,
    setTideMeters,
    getTideState,
    setLightingMode,
    setMeasureActive,
    setMeasurePoints,
    clearMeasurePoints,
    getMeasureState,
    cleanup,
  };
}
