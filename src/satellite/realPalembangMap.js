import * as maplibregl from 'maplibre-gl';
import maplibreWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url';
import 'maplibre-gl/dist/maplibre-gl.css';
import { REAL_PRESETS, REAL_MARKERS } from './realLandmarks.js';
import { createHeroLandmarksCustomLayer } from './heroLandmarksLayer.js';

maplibregl.setWorkerUrl(maplibreWorkerUrl);

const LIGHTING_THEMES = {
  siang: {
    sky: {
      'sky-color': '#2b6ea8',
      'sky-horizon-blend': 0.55,
      'horizon-color': '#c9e3f4',
      'horizon-fog-blend': 0.72,
      'fog-color': '#c7e0ef',
      'fog-ground-blend': 0.5,
    },
    light: { anchor: 'viewport', color: '#fff8ea', intensity: 0.45, position: [1.3, 130, 42] },
    satBrightnessMax: 1.0,
    satSaturation: 0.08,
    satContrast: 0.06,
    bldgColor: [
      'interpolate',
      ['linear'],
      ['coalesce', ['get', 'render_height'], 7],
      0, '#dcd6ca',
      10, '#d2cbc0',
      24, '#c4ccd4',
      50, '#b5c4d4',
    ],
    bldgOpacity: 0.82,
  },
  senja: {
    sky: {
      'sky-color': '#222b57',
      'sky-horizon-blend': 0.65,
      'horizon-color': '#eb894f',
      'horizon-fog-blend': 0.78,
      'fog-color': '#d28056',
      'fog-ground-blend': 0.52,
    },
    light: { anchor: 'viewport', color: '#ffb060', intensity: 0.65, position: [1.5, 250, 22] },
    satBrightnessMax: 0.76,
    satSaturation: 0.14,
    satContrast: 0.12,
    bldgColor: [
      'interpolate',
      ['linear'],
      ['coalesce', ['get', 'render_height'], 7],
      0, '#a68c7d',
      12, '#be987c',
      28, '#d4a372',
      50, '#e3b37a',
    ],
    bldgOpacity: 0.86,
  },
  malam: {
    sky: {
      'sky-color': '#060c1c',
      'sky-horizon-blend': 0.5,
      'horizon-color': '#182b48',
      'horizon-fog-blend': 0.75,
      'fog-color': '#101c2e',
      'fog-ground-blend': 0.55,
    },
    light: { anchor: 'viewport', color: '#ffd9a8', intensity: 0.36, position: [1.2, 110, 45] },
    satBrightnessMax: 0.38,
    satSaturation: -0.22,
    satContrast: 0.22,
    bldgColor: [
      'interpolate',
      ['linear'],
      ['coalesce', ['get', 'render_height'], 7],
      0, '#232b36',
      10, '#333d4a',
      20, '#6e5c44',
      38, '#c99349',
    ],
    bldgOpacity: 0.88,
  },
};

function buildSatelliteStyle() {
  return {
    version: 8,
    glyphs: 'https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf',
    sources: {
      'esri-satellite': {
        type: 'raster',
        tiles: [
          'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        ],
        tileSize: 256,
        maxzoom: 19,
        attribution: 'Imagery © Esri, Maxar, Earthstar Geographics · Buildings © OpenStreetMap / OpenFreeMap',
      },
      openfreemap: {
        type: 'vector',
        url: 'https://tiles.openfreemap.org/planet',
      },
      'aws-terrain': {
        type: 'raster-dem',
        tiles: ['https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png'],
        encoding: 'terrarium',
        tileSize: 256,
        maxzoom: 15,
      },
    },
    terrain: {
      source: 'aws-terrain',
      exaggeration: 1.35,
    },
    sky: LIGHTING_THEMES.siang.sky,
    light: LIGHTING_THEMES.siang.light,
    layers: [
      {
        id: 'satellite-imagery',
        type: 'raster',
        source: 'esri-satellite',
        paint: {
          'raster-brightness-max': LIGHTING_THEMES.siang.satBrightnessMax,
          'raster-saturation': LIGHTING_THEMES.siang.satSaturation,
          'raster-contrast': LIGHTING_THEMES.siang.satContrast,
          'raster-fade-duration': 150,
        },
      },
      // Subtle translucent highlight for Sungai Musi water surface sheen at dusk/night
      {
        id: 'osm-buildings-3d',
        type: 'fill-extrusion',
        source: 'openfreemap',
        'source-layer': 'building',
        minzoom: 13.5,
        paint: {
          'fill-extrusion-color': LIGHTING_THEMES.siang.bldgColor,
          'fill-extrusion-height': [
            'max',
            ['coalesce', ['get', 'render_height'], 6.5],
            5.5,
          ],
          'fill-extrusion-base': ['coalesce', ['get', 'render_min_height'], 0],
          'fill-extrusion-opacity': LIGHTING_THEMES.siang.bldgOpacity,
          'fill-extrusion-vertical-gradient': true,
        },
      },
      // Crisp hybrid road & waterway labels over satellite
      {
        id: 'road-labels',
        type: 'symbol',
        source: 'openfreemap',
        'source-layer': 'transportation_name',
        minzoom: 14.5,
        layout: {
          'symbol-placement': 'line',
          'text-field': ['coalesce', ['get', 'name:id'], ['get', 'name']],
          'text-font': ['Noto Sans Regular'],
          'text-size': 11,
        },
        paint: {
          'text-color': '#f7f3ea',
          'text-halo-color': 'rgba(14, 20, 26, 0.85)',
          'text-halo-width': 1.4,
        },
      },
      {
        id: 'water-labels',
        type: 'symbol',
        source: 'openfreemap',
        'source-layer': 'water_name',
        minzoom: 12,
        layout: {
          'text-field': ['coalesce', ['get', 'name:id'], ['get', 'name']],
          'text-font': ['Noto Sans Italic'],
          'text-size': 13,
        },
        paint: {
          'text-color': '#cceeff',
          'text-halo-color': 'rgba(10, 22, 32, 0.85)',
          'text-halo-width': 1.6,
        },
      },
    ],
  };
}

export function mountRealPalembangMap({ rootEl, onSwitchMode, showWebGLFallback }) {
  rootEl.innerHTML = '';

  const mapContainer = document.createElement('div');
  mapContainer.className = 'canvas-stage satellite-stage';
  rootEl.appendChild(mapContainer);

  let map;
  try {
    const initial = REAL_PRESETS[0];
    map = new maplibregl.Map({
      container: mapContainer,
      style: buildSatelliteStyle(),
      center: initial.center,
      zoom: initial.zoom,
      pitch: initial.pitch,
      bearing: initial.bearing,
      maxPitch: 78,
      minZoom: 11.5,
      maxZoom: 18.8,
      antialias: true,
      attributionControl: false,
      canvasContextAttributes: { preserveDrawingBuffer: true, antialias: true },
    });
    map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-right');
  } catch (err) {
    console.warn('MapLibre WebGL initialization failed:', err?.message || err);
    showWebGLFallback(err?.message || err);
    return () => {};
  }

  let activePreset = 'overview';
  let activeLighting = 'siang';
  let labelsVisible = true;
  let buildingsVisible = true;
  let infoExpanded = false;
  let isReady = false;
  let isFlying = false;

  const hero3d = createHeroLandmarksCustomLayer();

  // --- Songket-slate HUD matching Diorama mode + Mode & 3D Buildings toggles ---
  const hud = document.createElement('div');
  hud.className = 'hud-layer';

  const topBar = document.createElement('header');
  topBar.className = 'hud-top';

  const brand = document.createElement('div');
  brand.className = 'brand-pill';
  brand.innerHTML = `
    <span class="brand-mark" aria-hidden="true"></span>
    <div class="brand-text">
      <h1>Kota Palembang 3D</h1>
      <p>Satelit Nyata Esri · Bangunan 3D OSM · Skala 1:1</p>
    </div>
  `;

  const topControls = document.createElement('div');
  topControls.className = 'top-controls';

  // Mode switcher: Satelit 3D vs Diorama
  const modeGroup = document.createElement('div');
  modeGroup.className = 'segmented-control';
  modeGroup.setAttribute('role', 'group');
  modeGroup.setAttribute('aria-label', 'Mode visualisasi');

  const satBtn = document.createElement('button');
  satBtn.type = 'button';
  satBtn.className = 'seg-btn active';
  satBtn.textContent = 'Satelit 3D';
  satBtn.dataset.modeBtn = 'satellite';

  const dioBtn = document.createElement('button');
  dioBtn.type = 'button';
  dioBtn.className = 'seg-btn';
  dioBtn.textContent = 'Diorama';
  dioBtn.dataset.modeBtn = 'diorama';
  dioBtn.addEventListener('click', () => onSwitchMode('diorama'));

  modeGroup.append(satBtn, dioBtn);

  // Lighting switcher
  const lightingGroup = document.createElement('div');
  lightingGroup.className = 'segmented-control';
  lightingGroup.setAttribute('role', 'group');
  lightingGroup.setAttribute('aria-label', 'Suasana pencahayaan');

  const lightingBtns = new Map();
  for (const mode of [
    { id: 'siang', label: 'Siang' },
    { id: 'senja', label: 'Senja' },
    { id: 'malam', label: 'Malam' },
  ]) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'seg-btn';
    btn.textContent = mode.label;
    btn.dataset.lightingBtn = mode.id;
    btn.addEventListener('click', () => applyLighting(mode.id));
    lightingGroup.appendChild(btn);
    lightingBtns.set(mode.id, btn);
  }

  // Toggle OSM 3D Buildings
  const bldgBtn = document.createElement('button');
  bldgBtn.type = 'button';
  bldgBtn.className = 'toggle-btn active';
  bldgBtn.textContent = 'Gedung 3D';
  bldgBtn.dataset.buildingsBtn = 'true';
  bldgBtn.setAttribute('aria-pressed', 'true');
  bldgBtn.addEventListener('click', () => {
    buildingsVisible = !buildingsVisible;
    bldgBtn.classList.toggle('active', buildingsVisible);
    bldgBtn.setAttribute('aria-pressed', String(buildingsVisible));
    if (map.getLayer('osm-buildings-3d')) {
      map.setLayoutProperty('osm-buildings-3d', 'visibility', buildingsVisible ? 'visible' : 'none');
    }
  });

  // Toggle 3D Landmark Pins
  const labelBtn = document.createElement('button');
  labelBtn.type = 'button';
  labelBtn.className = 'toggle-btn active';
  labelBtn.textContent = 'Label 3D';
  labelBtn.dataset.labelsBtn = 'true';
  labelBtn.setAttribute('aria-pressed', 'true');
  labelBtn.addEventListener('click', () => {
    labelsVisible = !labelsVisible;
    rootEl.dataset.labels = String(labelsVisible);
    labelBtn.classList.toggle('active', labelsVisible);
    labelBtn.setAttribute('aria-pressed', String(labelsVisible));
    for (const m of markerObjs) {
      m.el.style.display = labelsVisible ? '' : 'none';
    }
  });

  topControls.append(modeGroup, lightingGroup, bldgBtn, labelBtn);
  topBar.append(brand, topControls);

  // Info Card
  const infoCard = document.createElement('aside');
  infoCard.className = 'info-card collapsed';
  infoCard.setAttribute('aria-live', 'polite');

  const infoHeader = document.createElement('div');
  infoHeader.className = 'info-header';
  const infoZone = document.createElement('span');
  infoZone.className = 'info-zone';
  const infoToggle = document.createElement('button');
  infoToggle.type = 'button';
  infoToggle.className = 'info-collapse';
  infoToggle.textContent = 'Info';
  infoToggle.addEventListener('click', () => {
    infoExpanded = !infoExpanded;
    infoCard.classList.toggle('collapsed', !infoExpanded);
    infoToggle.textContent = infoExpanded ? 'Tutup' : 'Info';
  });
  infoHeader.append(infoZone, infoToggle);

  const infoTitle = document.createElement('h2');
  infoTitle.className = 'info-title';
  const infoBody = document.createElement('p');
  infoBody.className = 'info-summary';
  const infoNote = document.createElement('p');
  infoNote.className = 'info-note';
  infoCard.append(infoHeader, infoTitle, infoBody, infoNote);

  // Bottom Preset Dock
  const presetNav = document.createElement('nav');
  presetNav.className = 'preset-dock';
  presetNav.setAttribute('aria-label', 'Pilih fokus tengara');

  const presetBtns = new Map();
  for (const p of REAL_PRESETS) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'preset-btn';
    btn.textContent = p.label;
    btn.dataset.presetBtn = p.id;
    btn.addEventListener('click', () => selectPreset(p.id));
    presetNav.appendChild(btn);
    presetBtns.set(p.id, btn);
  }

  const hint = document.createElement('div');
  hint.className = 'controls-hint';
  hint.textContent = 'Seret untuk geser · Klik kanan + seret untuk putar/miring 3D · Gulir untuk zoom';

  hud.append(topBar, infoCard, presetNav, hint);
  rootEl.appendChild(hud);

  // Real-world interactive HTML landmark markers
  const markerObjs = [];
  for (const pin of REAL_MARKERS) {
    const el = document.createElement('button');
    el.type = 'button';
    el.className = 'scene-pin map-pin';
    el.textContent = pin.label;
    el.dataset.pinId = pin.id;
    const targetId = pin.presetId || pin.id;
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      selectPreset(targetId);
    });
    const marker = new maplibregl.Marker({ element: el, anchor: 'bottom' })
      .setLngLat(pin.lngLat)
      .addTo(map);
    markerObjs.push({ marker, el });
  }

  function syncPresetUi(presetId) {
    activePreset = presetId;
    rootEl.dataset.preset = activePreset;
    for (const [id, btn] of presetBtns) {
      btn.classList.toggle('active', id === activePreset);
      btn.setAttribute('aria-current', id === activePreset ? 'true' : 'false');
    }
    const p = REAL_PRESETS.find((x) => x.id === activePreset) || REAL_PRESETS[0];
    infoExpanded = activePreset !== 'overview';
    infoCard.classList.toggle('collapsed', !infoExpanded);
    infoToggle.textContent = infoExpanded ? 'Tutup' : 'Info';
    infoZone.textContent = p.zone;
    infoTitle.textContent = p.title;
    infoBody.textContent = p.summary;
    infoNote.textContent = p.note;
  }

  function selectPreset(presetId) {
    const p = REAL_PRESETS.find((x) => x.id === presetId);
    if (!p) return;
    syncPresetUi(p.id);
    isFlying = true;
    map.flyTo({
      center: p.center,
      zoom: p.zoom,
      pitch: p.pitch,
      bearing: p.bearing,
      duration: 1200,
      essential: true,
    });
  }

  function applyLighting(mode) {
    const key = mode in LIGHTING_THEMES ? mode : 'siang';
    activeLighting = key;
    rootEl.dataset.lighting = activeLighting;
    for (const [id, btn] of lightingBtns) {
      btn.classList.toggle('active', id === activeLighting);
      btn.setAttribute('aria-pressed', id === activeLighting ? 'true' : 'false');
    }

    const theme = LIGHTING_THEMES[key];
    hero3d.setLightingMode(key);

    if (map.getLayer('satellite-imagery')) {
      map.setSky(theme.sky);
      map.setLight(theme.light);
      map.setPaintProperty('satellite-imagery', 'raster-brightness-max', theme.satBrightnessMax);
      map.setPaintProperty('satellite-imagery', 'raster-saturation', theme.satSaturation);
      map.setPaintProperty('satellite-imagery', 'raster-contrast', theme.satContrast);
      if (map.getLayer('osm-buildings-3d')) {
        map.setPaintProperty('osm-buildings-3d', 'fill-extrusion-color', theme.bldgColor);
        map.setPaintProperty('osm-buildings-3d', 'fill-extrusion-opacity', theme.bldgOpacity);
      }
    }
  }

  map.on('error', (e) => {
    console.error('MapLibre error:', e?.error?.message || e?.message || e);
  });

  map.on('moveend', () => {
    isFlying = false;
  });

  map.on('style.load', () => {
    if (!map.getLayer('palembang-hero-3d')) {
      map.addLayer(hero3d.layer, 'road-labels');
    }
    applyLighting(activeLighting);
  });

  map.on('idle', () => {
    if (!isReady) {
      isReady = true;
      rootEl.dataset.ready = 'true';
    }
  });

  // Fallback readiness after map load in case tiles take slightly longer
  map.on('load', () => {
    setTimeout(() => {
      if (!isReady) {
        isReady = true;
        rootEl.dataset.ready = 'true';
      }
    }, 800);
  });

  syncPresetUi('overview');
  rootEl.dataset.mode = 'satellite';
  rootEl.dataset.labels = 'true';
  rootEl.dataset.lighting = 'siang';
  lightingBtns.get('siang')?.classList.add('active');
  lightingBtns.get('siang')?.setAttribute('aria-pressed', 'true');

  // Expose unified read-only telemetry matching Diorama contract
  const getTelemetry = () => {
    const center = map.getCenter();
    return Object.freeze({
      mode: 'satellite',
      ready: isReady,
      preset: activePreset,
      lighting: activeLighting,
      labelsVisible,
      buildingsVisible,
      tweening: isFlying,
      landmarkCount: REAL_PRESETS.length,
      camera: Object.freeze({
        lng: Number(center.lng.toFixed(5)),
        lat: Number(center.lat.toFixed(5)),
        zoom: Number(map.getZoom().toFixed(2)),
        pitch: Number(map.getPitch().toFixed(1)),
        bearing: Number(map.getBearing().toFixed(1)),
      }),
    });
  };

  Object.defineProperty(window, '__PALEMBANG_3D__', {
    enumerable: true,
    configurable: true,
    get: getTelemetry,
  });

  return function cleanup() {
    for (const m of markerObjs) m.marker.remove();
    map.remove();
  };
}
