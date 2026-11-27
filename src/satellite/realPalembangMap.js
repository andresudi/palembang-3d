import * as maplibregl from 'maplibre-gl';
import maplibreWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url';
import 'maplibre-gl/dist/maplibre-gl.css';
import { REAL_PRESETS } from './realLandmarks.js';
import { PALEMBANG_POIS, createPassportStore } from './palembangPois.js';
import { createAmbienceAudio } from './ambienceAudio.js';
import { createHeroLandmarksCustomLayer } from './heroLandmarksLayer.js';
import { createAnimatedTrafficLayer } from './animatedTrafficLayer.js';
import { createCameraModesController } from './cameraModes.js';
import { createExploreDrawer } from './exploreDrawer.js';
import { createWeatherGisEngine } from './weatherGisEngine.js';

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
      maxBounds: [
        [104.725, -3.040],
        [104.835, -2.962],
      ],
      maxPitch: 78,
      minZoom: 13.8,
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
  let activePinCategory = 'landmark'; // Clean overview starts with Landmark pins; Jelajah filters light up Kuliner/LRT/Semua
  let labelsVisible = true;
  let buildingsVisible = true;
  let trafficVisible = true;
  let infoExpanded = false;
  let isReady = false;
  let isFlying = false;

  const hero3d = createHeroLandmarksCustomLayer();
  const traffic3d = createAnimatedTrafficLayer();
  const passport = createPassportStore();
  const ambience = createAmbienceAudio();

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
      <p>Satelit Esri · Gedung 3D OSM · Lalu Lintas, LRT & Sungai Aktif</p>
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

  // Slim Top-Bar: [Satelit 3D | Diorama] + [Siang | Senja | Malam] + [Suara] + [Eksplorasi]
  const audioBtn = document.createElement('button');
  audioBtn.type = 'button';
  audioBtn.className = 'toggle-btn audio-top-btn';
  audioBtn.textContent = 'Suara';
  audioBtn.title = 'Putar / matikan ambience Sungai Musi';
  audioBtn.dataset.audioBtn = 'true';
  audioBtn.setAttribute('aria-pressed', 'false');

  const exploreBtn = document.createElement('button');
  exploreBtn.type = 'button';
  exploreBtn.className = 'toggle-btn explore-trigger';
  exploreBtn.innerHTML = `<span class="explore-dot" aria-hidden="true"></span>Eksplorasi`;
  exploreBtn.dataset.exploreBtn = 'true';
  exploreBtn.setAttribute('aria-expanded', 'false');

  topControls.append(modeGroup, lightingGroup, audioBtn, exploreBtn);
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
  hint.textContent = 'Seret geser · Klik kanan putar/miring 3D · Buka "Eksplorasi" untuk Naik LRT/Perahu, Tur & Drone';

  let exploreDrawer;
  const weatherGis = createWeatherGisEngine({
    map,
    rootEl,
    ambience,
    onWeatherChange(state) {
      exploreDrawer?.syncWeather(state);
      applyLighting(activeLighting);
    },
    onTideChange(state) {
      exploreDrawer?.syncTide(state);
    },
    onMeasureChange(state) {
      exploreDrawer?.syncMeasure(state);
    },
  });

  const cameraModes = createCameraModesController({
    map,
    traffic3d,
    ensureTrafficEnabled() {
      if (!trafficVisible) {
        trafficVisible = true;
        traffic3d.setEnabled(true);
        exploreDrawer?.syncTrafficToggle(true);
      }
    },
    onSelectPreset(presetId, opts) {
      selectPreset(presetId, opts);
    },
    onStateChange(state) {
      rootEl.dataset.cameraMode = state.mode;
      exploreBtn.classList.toggle('has-active-mode', state.mode !== 'free');
      exploreDrawer?.syncModeBanner(state);
    },
  });

  function toggleAudio() {
    const isOn = ambience.toggle();
    audioBtn.classList.toggle('active', isOn);
    audioBtn.setAttribute('aria-pressed', String(isOn));
    audioBtn.textContent = isOn ? 'Suara On' : 'Suara';
    exploreDrawer?.syncAudio(isOn);
  }
  audioBtn.addEventListener('click', toggleAudio);

  exploreDrawer = createExploreDrawer({
    cameraModes,
    passport,
    ambience,
    weatherGis,
    onSelectPoi(poi) {
      selectPoi(poi);
    },
    onCategoryChange(cat) {
      activePinCategory = cat;
      refreshMarkerVisibility();
    },
    onToggleAudio() {
      toggleAudio();
    },
    onToggleBuildings() {
      buildingsVisible = !buildingsVisible;
      if (map.getLayer('osm-buildings-3d')) {
        map.setLayoutProperty('osm-buildings-3d', 'visibility', buildingsVisible ? 'visible' : 'none');
      }
      return buildingsVisible;
    },
    onToggleTraffic() {
      trafficVisible = !trafficVisible;
      traffic3d.setEnabled(trafficVisible);
      return trafficVisible;
    },
    onToggleLabels() {
      labelsVisible = !labelsVisible;
      rootEl.dataset.labels = String(labelsVisible);
      refreshMarkerVisibility();
      return labelsVisible;
    },
    onSelectLighting(mode) {
      applyLighting(mode);
    },
    onDrawerToggle(open) {
      exploreBtn.classList.toggle('active', open);
      exploreBtn.setAttribute('aria-expanded', String(open));
    },
  });

  exploreBtn.addEventListener('click', () => {
    exploreDrawer.setOpen(!exploreDrawer.isOpen());
  });

  hud.append(topBar, exploreDrawer.drawerEl, exploreDrawer.bannerEl, exploreDrawer.toastEl, infoCard, presetNav, hint);
  rootEl.appendChild(hud);

  // Real-world interactive HTML POI markers (10 Landmarks + 6 Kuliner + 4 Stasiun LRT)
  const PIN_PREFIX = { landmark: '', kuliner: '🍜 ', lrt: '🚆 ' };
  const markerObjs = [];
  for (const poi of PALEMBANG_POIS) {
    const el = document.createElement('button');
    el.type = 'button';
    el.className = `scene-pin map-pin pin-${poi.category}`;
    el.textContent = `${PIN_PREFIX[poi.category] || ''}${poi.label}`;
    el.dataset.pinId = poi.id;
    el.dataset.pinCategory = poi.category;
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      selectPoi(poi);
    });
    const marker = new maplibregl.Marker({ element: el, anchor: 'bottom' })
      .setLngLat(poi.center)
      .addTo(map);
    markerObjs.push({ marker, el, poi });
  }

  function refreshMarkerVisibility() {
    for (const m of markerObjs) {
      const catMatch = activePinCategory === 'all' || m.poi.category === activePinCategory;
      const show = labelsVisible && catMatch;
      m.el.style.display = show ? '' : 'none';
      m.el.classList.toggle('visited', passport.isVisited(m.poi.id));
    }
  }

  function stampPassport(poiId, label) {
    const newlyStamped = passport.markVisited(poiId);
    if (newlyStamped) {
      const sum = passport.getSummary();
      exploreDrawer.showToast(`✓ Passport: ${label} (${sum.visitedCount}/${sum.total})`);
      exploreDrawer.syncPassport();
      refreshMarkerVisibility();
    }
  }

  function syncInfoCard(item, { expand = true } = {}) {
    infoExpanded = expand;
    infoCard.classList.toggle('collapsed', !infoExpanded);
    infoToggle.textContent = infoExpanded ? 'Tutup' : 'Info';
    infoZone.textContent = item.signature ? `${item.signature}` : item.zone;
    infoTitle.textContent = item.title;
    infoBody.textContent = item.summary;
    infoNote.textContent = item.note;
  }

  function syncPresetUi(presetId) {
    activePreset = presetId;
    rootEl.dataset.preset = activePreset;
    for (const [id, btn] of presetBtns) {
      btn.classList.toggle('active', id === activePreset);
      btn.setAttribute('aria-current', id === activePreset ? 'true' : 'false');
    }
    const p = REAL_PRESETS.find((x) => x.id === activePreset) || REAL_PRESETS[0];
    syncInfoCard(p, { expand: activePreset !== 'overview' });
  }

  function selectPoi(poi, opts = {}) {
    if (!opts.fromTour && cameraModes.getState().mode !== 'free') {
      cameraModes.stopAll();
    }
    // Highlight matching dock preset if this POI maps to one
    const matchingPreset = REAL_PRESETS.find((x) => x.id === (poi.presetId || poi.id));
    activePreset = matchingPreset ? matchingPreset.id : poi.id;
    rootEl.dataset.preset = activePreset;
    for (const [id, btn] of presetBtns) {
      btn.classList.toggle('active', id === activePreset);
      btn.setAttribute('aria-current', id === activePreset ? 'true' : 'false');
    }
    syncInfoCard(poi, { expand: true });
    stampPassport(poi.id, poi.label);

    isFlying = true;
    map.flyTo({
      center: poi.center,
      zoom: poi.zoom,
      pitch: poi.pitch,
      bearing: poi.bearing,
      duration: opts.fromTour ? 1800 : 1200,
      essential: true,
    });
  }

  function selectPreset(presetId, opts = {}) {
    const p = REAL_PRESETS.find((x) => x.id === presetId);
    if (!p) return;
    if (!opts.fromTour && cameraModes.getState().mode !== 'free') {
      cameraModes.stopAll();
    }
    syncPresetUi(p.id);
    if (p.id !== 'overview') {
      stampPassport(p.id, p.label);
    }
    isFlying = true;
    map.flyTo({
      center: p.center,
      zoom: p.zoom,
      pitch: p.pitch,
      bearing: p.bearing,
      duration: opts.fromTour ? 1800 : 1200,
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
    const wMode = weatherGis.getWeatherState().mode;
    const isRain = wMode === 'hujan';
    const isCloudy = wMode === 'berawan';

    hero3d.setLightingMode(key);
    traffic3d.setLightingMode(key);
    weatherGis.setLightingMode(key);
    ambience.setMood(key);

    if (map.getLayer('satellite-imagery')) {
      const sky = isRain
        ? {
            ...theme.sky,
            'sky-color': key === 'malam' ? '#070e18' : '#4a5d6e',
            'horizon-color': key === 'malam' ? '#1a2736' : '#8da0b0',
            'fog-color': key === 'malam' ? '#13202e' : '#8fa2b2',
            'fog-ground-blend': 0.35,
          }
        : isCloudy
          ? {
              ...theme.sky,
              'horizon-color': key === 'malam' ? theme.sky['horizon-color'] : '#b2c6d6',
              'fog-color': key === 'malam' ? theme.sky['fog-color'] : '#b0c4d4',
            }
          : theme.sky;
      map.setSky(sky);
      map.setLight(theme.light);
      const rainDim = isRain ? 0.82 : isCloudy ? 0.92 : 1.0;
      const rainDesat = isRain ? -0.22 : isCloudy ? -0.08 : 0.0;
      map.setPaintProperty('satellite-imagery', 'raster-brightness-max', Number((theme.satBrightnessMax * rainDim).toFixed(2)));
      map.setPaintProperty('satellite-imagery', 'raster-saturation', Number((theme.satSaturation + rainDesat).toFixed(2)));
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
    if (!map.getLayer('palembang-live-traffic-3d')) {
      map.addLayer(traffic3d.layer, 'road-labels');
    }
    weatherGis.onStyleLoad();
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
  refreshMarkerVisibility();
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
      trafficVisible,
      audioEnabled: ambience.isEnabled(),
      activePinCategory,
      visiblePinCount: markerObjs.filter((m) => m.el.style.display !== 'none').length,
      passport: passport.getSummary(),
      weather: weatherGis.getWeatherState(),
      tide: weatherGis.getTideState(),
      measure: weatherGis.getMeasureState(),
      drawerOpen: exploreDrawer.isOpen(),
      cameraMode: cameraModes.getState().mode,
      tweening: isFlying,
      landmarkCount: REAL_PRESETS.length,
      animationStats: traffic3d.getStats(),
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
    cameraModes.cleanup();
    weatherGis.cleanup();
    ambience.cleanup();
    traffic3d.setEnabled(false);
    for (const m of markerObjs) m.marker.remove();
    map.remove();
  };
}
