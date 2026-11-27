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
import { createFestivalLayer } from './festivalLayer.js';
import { createPlayableBoatLayer } from './playableBoatLayer.js';
import { createRoutePlanner } from './routePlanner.js';
import { createMiniMapRadar } from './miniMapRadar.js';
import { createI18n } from './i18n.js';
import { createOnboardingAndHelp } from './onboardingHelp.js';
import { fetchWikimediaPhoto, createPhotoLightbox } from './wikimediaPhoto.js';
import { createHistoricalTimeline } from './historicalTimeline.js';

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

function parseUrlCameraParams(fallback) {
  const params = new URLSearchParams(window.location.search);
  const num = (key, min, max, def) => {
    const raw = params.get(key);
    if (raw === null || raw === '') return def;
    const v = Number(raw);
    return Number.isFinite(v) ? Math.max(min, Math.min(max, v)) : def;
  };
  const lng = num('lng', 104.728, 104.832, fallback.center[0]);
  const lat = num('lat', -3.038, -2.964, fallback.center[1]);
  const zoom = num('z', 13.8, 18.8, fallback.zoom);
  const pitch = num('pitch', 0, 78, fallback.pitch);
  const bearing = num('bearing', -360, 360, fallback.bearing);
  const lightingParam = params.get('lighting');
  const lighting = lightingParam && lightingParam in LIGHTING_THEMES ? lightingParam : 'siang';
  const weatherParam = params.get('weather');
  const weather = ['cerah', 'berawan', 'hujan'].includes(weatherParam) ? weatherParam : 'cerah';
  const hasCustomView = params.has('lng') && params.has('lat');
  return { center: [lng, lat], zoom, pitch, bearing, lighting, weather, hasCustomView };
}

export function mountRealPalembangMap({ rootEl, onSwitchMode, showWebGLFallback }) {
  rootEl.innerHTML = '';

  const mapContainer = document.createElement('div');
  mapContainer.className = 'canvas-stage satellite-stage';
  rootEl.appendChild(mapContainer);

  const initialView = parseUrlCameraParams(REAL_PRESETS[0]);
  let map;
  try {
    map = new maplibregl.Map({
      container: mapContainer,
      style: buildSatelliteStyle(),
      center: initialView.center,
      zoom: initialView.zoom,
      pitch: initialView.pitch,
      bearing: initialView.bearing,
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
  let activePoiItem = REAL_PRESETS[0];
  let activeLighting = initialView.lighting;
  let currentHour = activeLighting === 'malam' ? 21.0 : activeLighting === 'senja' ? 17.75 : 11.5;
  let timelapseRunning = false;
  let timelapseRafId = null;
  let lastTlTs = 0;
  let photoMode = false;
  let activePinCategory = 'landmark'; // Clean overview starts with Landmark pins; Jelajah filters light up Kuliner/LRT/Semua
  let labelsVisible = true;
  let buildingsVisible = true;
  let trafficVisible = true;
  let infoExpanded = false;
  let isReady = false;
  let isFlying = false;
  let lastShareUrl = '';
  let currentPhotoData = null;
  let photoFetchSeq = 0;

  // Auto-select Eco graphics on mobile viewports (<=720px) unless user explicitly saved a preference
  const QUALITY_KEY = 'palembang_3d_quality_v1';
  let savedQuality = null;
  try {
    savedQuality = window.localStorage?.getItem(QUALITY_KEY);
  } catch {}
  let graphicsQuality =
    savedQuality === 'eco' || savedQuality === 'high'
      ? savedQuality
      : (rootEl.clientWidth || window.innerWidth) <= 720
        ? 'eco'
        : 'high';

  const i18n = createI18n();
  const hero3d = createHeroLandmarksCustomLayer();
  const traffic3d = createAnimatedTrafficLayer();
  const passport = createPassportStore();
  const ambience = createAmbienceAudio();
  const festival3d = createFestivalLayer({ ambience });

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

  // Slim Top-Bar: [Satelit 3D | Diorama] + [Siang | Senja | Malam] + [ID/EN] + [Bagikan] + [Suara] + [?] + [Eksplorasi]
  const langBtn = document.createElement('button');
  langBtn.type = 'button';
  langBtn.className = 'toggle-btn lang-btn top-only-btn';
  langBtn.textContent = i18n.getLang().toUpperCase();
  langBtn.title = 'Switch Language (Indonesia / English)';
  langBtn.dataset.langBtn = 'true';

  const shareBtn = document.createElement('button');
  shareBtn.type = 'button';
  shareBtn.className = 'toggle-btn top-only-btn';
  shareBtn.textContent = 'Bagikan';
  shareBtn.title = 'Salin tautan sudut kamera saat ini';
  shareBtn.dataset.shareBtn = 'true';

  const audioBtn = document.createElement('button');
  audioBtn.type = 'button';
  audioBtn.className = 'toggle-btn audio-top-btn';
  audioBtn.textContent = 'Suara';
  audioBtn.title = 'Putar / matikan ambience Sungai Musi';
  audioBtn.dataset.audioBtn = 'true';
  audioBtn.setAttribute('aria-pressed', 'false');

  const helpBtn = document.createElement('button');
  helpBtn.type = 'button';
  helpBtn.className = 'toggle-btn help-btn top-only-btn';
  helpBtn.textContent = '?';
  helpBtn.title = 'Panduan kontrol & shortcut keyboard';
  helpBtn.dataset.helpBtn = 'true';

  const exploreBtn = document.createElement('button');
  exploreBtn.type = 'button';
  exploreBtn.className = 'toggle-btn explore-trigger';
  exploreBtn.innerHTML = `<span class="explore-dot" aria-hidden="true"></span><span data-explore-label>Eksplorasi</span>`;
  exploreBtn.dataset.exploreBtn = 'true';
  exploreBtn.setAttribute('aria-expanded', 'false');

  topControls.append(modeGroup, lightingGroup, langBtn, shareBtn, audioBtn, helpBtn, exploreBtn);
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

  const infoPhotoBtn = document.createElement('button');
  infoPhotoBtn.type = 'button';
  infoPhotoBtn.className = 'info-photo-wrap hidden';
  infoPhotoBtn.dataset.infoPhotoBtn = 'true';
  infoPhotoBtn.innerHTML = `<img class="info-photo-img" alt="" /><span class="info-photo-caption">Wikimedia · Perbesar</span>`;
  const infoPhotoImg = infoPhotoBtn.querySelector('.info-photo-img');
  const infoPhotoCaption = infoPhotoBtn.querySelector('.info-photo-caption');

  const infoTitle = document.createElement('h2');
  infoTitle.className = 'info-title';
  const infoBody = document.createElement('p');
  infoBody.className = 'info-summary';
  const infoNote = document.createElement('p');
  infoNote.className = 'info-note';

  const infoGmaps = document.createElement('a');
  infoGmaps.className = 'info-gmaps-link hidden';
  infoGmaps.target = '_blank';
  infoGmaps.rel = 'noopener noreferrer';
  infoGmaps.textContent = 'Buka di Google Maps ↗';

  infoCard.append(infoHeader, infoPhotoBtn, infoTitle, infoBody, infoNote, infoGmaps);

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
  let radar;

  const lightbox = createPhotoLightbox({ i18n });
  infoPhotoBtn.addEventListener('click', () => {
    if (currentPhotoData) {
      lightbox.open(currentPhotoData, infoTitle.textContent);
    }
  });
  infoPhotoImg.addEventListener('error', () => {
    infoPhotoBtn.classList.add('hidden');
  });

  const timeline = createHistoricalTimeline({
    i18n,
    mapContainer,
    onSelectEra(eraItem) {
      cameraModes.stopAll();
      playableBoat.stop();
      rootEl.dataset.timeline = 'true';
      syncInfoCard(eraItem, { expand: true });
      isFlying = true;
      map.flyTo({
        center: eraItem.center,
        zoom: eraItem.zoom,
        pitch: eraItem.pitch,
        bearing: eraItem.bearing,
        duration: 1350,
        essential: true,
      });
    },
    onExit() {
      rootEl.dataset.timeline = 'false';
      syncPresetUi('overview');
    },
  });

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

  const routePlanner = createRoutePlanner({
    map,
    onRouteChange(state) {
      exploreDrawer?.syncRoute(state);
      radar?.refresh();
    },
  });

  const playableBoat = createPlayableBoatLayer({
    map,
    ambience,
    onUpdate(boatState) {
      rootEl.dataset.playableBoat = String(boatState.active);
      if (boatState.active && infoExpanded) {
        infoExpanded = false;
        infoCard.classList.add('collapsed');
        infoToggle.textContent = i18n.t('info');
      }
      exploreBtn.classList.toggle('has-active-mode', boatState.active || cameraModes.getState().mode !== 'free');
      exploreDrawer?.syncModeBanner(cameraModes.getState(), boatState);
      radar?.refresh();
    },
    onCollect(relic, boatState) {
      const rName = i18n.getLang() === 'en' ? relic.nameEn : relic.nameId;
      exploreDrawer?.showToast(
        boatState.completed
          ? `🏆 ${i18n.getLang() === 'en' ? 'All 5 Srivijaya Relics Found!' : 'Semua 5 Artefak Sriwijaya Terkumpul!'}`
          : `✨ ${rName} (${boatState.collectedCount}/${boatState.totalRelics})`
      );
      exploreDrawer?.syncModeBanner(cameraModes.getState(), boatState);
    },
  });

  radar = createMiniMapRadar({ map, routePlanner, playableBoat });

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
      exploreBtn.classList.toggle('has-active-mode', state.mode !== 'free' || playableBoat.getState().active);
      exploreDrawer?.syncModeBanner(state, playableBoat.getState());
    },
  });

  // 24-Hour Continuous Time-of-Day Mapping & Auto Time-Lapse
  function setHourOfDay(hour) {
    currentHour = ((Number(hour) % 24) + 24) % 24;
    let bucket = 'siang';
    if (currentHour < 5.3 || currentHour >= 19.2) bucket = 'malam';
    else if (currentHour < 7.2 || currentHour >= 16.5) bucket = 'senja';
    if (bucket !== activeLighting) {
      applyLighting(bucket, { keepHour: true });
    } else if (map.getLayer('satellite-imagery')) {
      // Fine-tune brightness smoothly across morning/noon/dusk/night
      const daylight = Math.max(0, Math.sin(((currentHour - 5.5) / 13.5) * Math.PI));
      const wMode = weatherGis.getWeatherState().mode;
      const rainDim = wMode === 'hujan' ? 0.82 : wMode === 'berawan' ? 0.92 : 1.0;
      const bMax = Number(((0.38 + daylight * 0.62) * rainDim).toFixed(2));
      map.setPaintProperty('satellite-imagery', 'raster-brightness-max', bMax);
      const sunAz = (90 + (currentHour / 24) * 260) % 360;
      const sunElev = Math.max(12, Math.min(72, 14 + daylight * 58));
      map.setLight({
        anchor: 'viewport',
        color: bucket === 'senja' ? '#ffb060' : bucket === 'malam' ? '#ffd9a8' : '#fff8ea',
        intensity: bucket === 'senja' ? 0.62 : bucket === 'malam' ? 0.36 : 0.45,
        position: [1.3, sunAz, sunElev],
      });
    }
    exploreDrawer?.syncClock(currentHour, timelapseRunning);
  }

  function stopTimelapse() {
    timelapseRunning = false;
    if (timelapseRafId !== null) {
      cancelAnimationFrame(timelapseRafId);
      timelapseRafId = null;
    }
    lastTlTs = 0;
    exploreDrawer?.syncClock(currentHour, false);
  }

  function toggleTimelapse() {
    if (timelapseRunning) {
      stopTimelapse();
      return;
    }
    timelapseRunning = true;
    lastTlTs = 0;
    exploreDrawer?.syncClock(currentHour, true);
    const stepTl = (ts) => {
      if (!timelapseRunning) return;
      const dt = lastTlTs > 0 ? Math.min(0.08, (ts - lastTlTs) / 1000) : 0.016;
      lastTlTs = ts;
      setHourOfDay(currentHour + dt * 2.0);
      timelapseRafId = requestAnimationFrame(stepTl);
    };
    timelapseRafId = requestAnimationFrame(stepTl);
  }

  function setFestivalMode(festMode) {
    festival3d.setMode(festMode);
    exploreDrawer?.syncFestival(festMode);
    if (festMode === 'bidar') {
      applyLighting('siang');
      map.flyTo({ center: [104.7628, -2.9924], zoom: 16.5, pitch: 66, bearing: 46, duration: 1200 });
    } else if (festMode === 'fireworks') {
      stopTimelapse();
      applyLighting('malam');
      map.flyTo({ center: [104.7634, -2.9919], zoom: 16.1, pitch: 68, bearing: 48, duration: 1200 });
    }
  }

  function setPhotoMode(flag) {
    photoMode = Boolean(flag);
    rootEl.dataset.photoMode = String(photoMode);
    exploreDrawer?.syncPhotoMode(photoMode);
    if (photoMode) {
      exploreDrawer?.setOpen(false);
    }
  }

  function downloadPostcard(withWatermark = true) {
    const mapCanvas = map.getCanvas();
    const out = document.createElement('canvas');
    out.width = mapCanvas.width;
    out.height = mapCanvas.height;
    const ctx = out.getContext('2d');
    ctx.drawImage(mapCanvas, 0, 0);

    const rainCanvas = rootEl.querySelector('.rain-overlay');
    if (rainCanvas && weatherGis.getWeatherState().mode === 'hujan') {
      ctx.drawImage(rainCanvas, 0, 0, out.width, out.height);
    }

    if (withWatermark) {
      const barH = Math.max(44, Math.round(out.height * 0.068));
      const grad = ctx.createLinearGradient(0, out.height - barH * 1.6, 0, out.height);
      grad.addColorStop(0, 'rgba(14, 21, 27, 0)');
      grad.addColorStop(1, 'rgba(14, 21, 27, 0.88)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, out.height - barH * 1.6, out.width, barH * 1.6);

      ctx.fillStyle = '#d8ad5c';
      ctx.fillRect(24, out.height - barH + 12, 4, barH - 22);
      ctx.fillStyle = '#f4efe6';
      ctx.font = `600 ${Math.max(15, Math.round(barH * 0.34))}px "Plus Jakarta Sans", sans-serif`;
      ctx.fillText('EXPLORE PALEMBANG 3D', 38, out.height - barH + Math.round(barH * 0.5));
      ctx.fillStyle = '#b8bdb8';
      ctx.font = `500 ${Math.max(11, Math.round(barH * 0.24))}px "Plus Jakarta Sans", sans-serif`;
      const c = map.getCenter();
      ctx.fillText(
        `Sungai Musi · 1:1 Satellite 3D · ${Math.abs(c.lat).toFixed(4)}°S, ${c.lng.toFixed(4)}°E`,
        38,
        out.height - Math.round(barH * 0.2)
      );
    }

    try {
      const link = document.createElement('a');
      link.download = `explore-palembang-3d-${Date.now()}.png`;
      link.href = out.toDataURL('image/png');
      link.click();
    } catch {}
    exploreDrawer?.showToast(i18n.t('toastPhotoSaved'));
  }

  function toggleAudio() {
    const isOn = ambience.toggle();
    audioBtn.classList.toggle('active', isOn);
    audioBtn.setAttribute('aria-pressed', String(isOn));
    audioBtn.textContent = isOn ? i18n.t('soundOn') : i18n.t('sound');
    exploreDrawer?.syncAudio(isOn);
  }
  audioBtn.addEventListener('click', toggleAudio);

  function buildShareUrl() {
    const c = map.getCenter();
    const url = new URL(window.location.href);
    url.searchParams.set('mode', 'satellite');
    url.searchParams.set('lng', c.lng.toFixed(5));
    url.searchParams.set('lat', c.lat.toFixed(5));
    url.searchParams.set('z', map.getZoom().toFixed(2));
    url.searchParams.set('pitch', map.getPitch().toFixed(1));
    url.searchParams.set('bearing', map.getBearing().toFixed(1));
    url.searchParams.set('lighting', activeLighting);
    url.searchParams.set('lang', i18n.getLang());
    const wMode = weatherGis.getWeatherState().mode;
    if (wMode !== 'cerah') url.searchParams.set('weather', wMode);
    else url.searchParams.delete('weather');
    return url.toString();
  }

  async function triggerShare() {
    lastShareUrl = buildShareUrl();
    try {
      window.history.replaceState(null, '', lastShareUrl);
    } catch {}
    let copied = false;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(lastShareUrl);
        copied = true;
      }
    } catch {}
    exploreDrawer?.showToast(copied ? i18n.t('toastShareCopied') : i18n.t('toastShareUrl'));
  }
  shareBtn.addEventListener('click', triggerShare);

  function applyQuality(q, { persist = false } = {}) {
    graphicsQuality = q === 'eco' ? 'eco' : 'high';
    rootEl.dataset.quality = graphicsQuality;
    traffic3d.setQuality(graphicsQuality);
    if (map.getSource('aws-terrain')) {
      map.setTerrain({ source: 'aws-terrain', exaggeration: graphicsQuality === 'eco' ? 1.0 : 1.35 });
    }
    if (persist) {
      try {
        window.localStorage?.setItem(QUALITY_KEY, graphicsQuality);
      } catch {}
    }
    exploreDrawer?.syncQuality(graphicsQuality);
  }

  const onboardingHelp = createOnboardingAndHelp({
    i18n,
    hasDeepLink: initialView.hasCustomView,
    onStartTour() {
      playableBoat.stop();
      cameraModes.startTour(1);
    },
    onStartBoat() {
      cameraModes.stopAll();
      playableBoat.start();
    },
  });
  helpBtn.addEventListener('click', () => onboardingHelp.setHelpOpen(!onboardingHelp.isHelpOpen()));

  exploreDrawer = createExploreDrawer({
    i18n,
    cameraModes,
    playableBoat,
    festival3d,
    routePlanner,
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
    onToggleRadar() {
      const next = !radar.isVisible();
      radar.setVisible(next);
      return next;
    },
    onSetQuality(q) {
      applyQuality(q, { persist: true });
    },
    onToggleLang() {
      i18n.toggle();
      applyGlobalLanguage();
    },
    onShare() {
      triggerShare();
    },
    onOpenHelp() {
      onboardingHelp.setHelpOpen(true);
    },
    onStartTimeline() {
      timeline.start(0);
    },
    onSetHour(h) {
      stopTimelapse();
      setHourOfDay(h);
    },
    onToggleTimelapse() {
      toggleTimelapse();
    },
    onSetFestival(m) {
      setFestivalMode(m);
    },
    onEnterPhotoMode() {
      setPhotoMode(true);
    },
    onExitPhotoMode() {
      setPhotoMode(false);
    },
    onDownloadPostcard(wm) {
      downloadPostcard(wm);
    },
    onDrawerToggle(open) {
      exploreBtn.classList.toggle('active', open);
      exploreBtn.setAttribute('aria-expanded', String(open));
    },
  });

  function applyGlobalLanguage() {
    const lang = i18n.getLang();
    document.documentElement.lang = lang;
    langBtn.textContent = lang.toUpperCase();
    brand.querySelector('h1').textContent = i18n.t('brandTitle');
    brand.querySelector('p').textContent = i18n.t('brandSub');
    satBtn.textContent = i18n.t('satMode');
    dioBtn.textContent = i18n.t('dioMode');
    lightingBtns.get('siang').textContent = i18n.t('day');
    lightingBtns.get('senja').textContent = i18n.t('sunset');
    lightingBtns.get('malam').textContent = i18n.t('night');
    shareBtn.textContent = i18n.t('share');
    audioBtn.textContent = ambience.isEnabled() ? i18n.t('soundOn') : i18n.t('sound');
    exploreBtn.querySelector('[data-explore-label]').textContent = i18n.t('explore');
    hint.textContent = i18n.t('hint');
    infoGmaps.textContent = i18n.t('openGmaps');
    syncInfoCard(activePoiItem, { expand: infoExpanded });
    exploreDrawer.applyLanguage();
    onboardingHelp.applyLanguage();
    timeline.applyLanguage();
  }
  langBtn.addEventListener('click', () => {
    i18n.toggle();
    applyGlobalLanguage();
  });

  exploreBtn.addEventListener('click', () => {
    exploreDrawer.setOpen(!exploreDrawer.isOpen());
  });

  hud.append(
    topBar,
    exploreDrawer.drawerEl,
    exploreDrawer.bannerEl,
    exploreDrawer.photoBarEl,
    exploreDrawer.toastEl,
    infoCard,
    radar.el,
    timeline.barEl,
    presetNav,
    hint,
    onboardingHelp.onboardEl,
    onboardingHelp.helpEl,
    lightbox.el
  );
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

  function syncInfoCard(rawItem, { expand = true } = {}) {
    activePoiItem = rawItem;
    const item = i18n.localizePoi(rawItem);
    infoExpanded = expand;
    infoCard.classList.toggle('collapsed', !infoExpanded);
    infoToggle.textContent = infoExpanded ? i18n.t('close') : i18n.t('info');
    infoZone.textContent = item.signature ? `${item.signature}` : item.zone;
    infoTitle.textContent = item.title;
    infoBody.textContent = item.summary;
    infoNote.textContent = item.note;
    if (item.center && item.id !== 'overview') {
      infoGmaps.href = `https://www.google.com/maps/search/?api=1&query=${item.center[1]},${item.center[0]}`;
      infoGmaps.classList.remove('hidden');
    } else {
      infoGmaps.classList.add('hidden');
    }

    // Async Wikimedia photo fetch (in-memory cached, graceful hide if unavailable)
    const seq = ++photoFetchSeq;
    currentPhotoData = null;
    infoPhotoBtn.classList.add('hidden');
    if (item.id && item.id !== 'overview') {
      fetchWikimediaPhoto(item.id).then((photo) => {
        if (seq !== photoFetchSeq || !photo?.thumbUrl) return;
        currentPhotoData = photo;
        infoPhotoImg.src = photo.thumbUrl;
        infoPhotoImg.alt = item.title;
        infoPhotoCaption.textContent =
          i18n.getLang() === 'en' ? 'Wikimedia · Click to enlarge' : 'Wikimedia · Klik perbesar';
        infoPhotoBtn.classList.remove('hidden');
      });
    }
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
    if (timeline.getState().active) {
      timeline.stop();
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

  function applyLighting(mode, { keepHour = false } = {}) {
    const key = mode in LIGHTING_THEMES ? mode : 'siang';
    activeLighting = key;
    if (!keepHour) {
      currentHour = key === 'malam' ? 21.0 : key === 'senja' ? 17.75 : 11.5;
      exploreDrawer?.syncClock(currentHour, timelapseRunning);
    }
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
    if (!map.getLayer('palembang-festival-3d')) {
      map.addLayer(festival3d.layer, 'road-labels');
    }
    if (!map.getLayer('palembang-playable-boat-3d')) {
      map.addLayer(playableBoat.layer, 'road-labels');
    }
    weatherGis.onStyleLoad();
    routePlanner.onStyleLoad();
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
  applyGlobalLanguage();
  applyQuality(graphicsQuality);
  exploreDrawer.syncClock(currentHour, false);
  rootEl.dataset.mode = 'satellite';
  rootEl.dataset.labels = 'true';
  rootEl.dataset.lighting = activeLighting;
  lightingBtns.get(activeLighting)?.classList.add('active');
  lightingBtns.get(activeLighting)?.setAttribute('aria-pressed', 'true');
  if (initialView.weather !== 'cerah') {
    weatherGis.setWeatherMode(initialView.weather, { source: 'manual', storm: initialView.weather === 'hujan' });
  }

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
      route: routePlanner.getState(),
      festivalMode: festival3d.getMode(),
      playableBoat: playableBoat.getState(),
      lang: i18n.getLang(),
      hour: Number(currentHour.toFixed(1)),
      timelapse: timelapseRunning,
      photoMode,
      radarVisible: radar.isVisible(),
      quality: graphicsQuality,
      onboardingOpen: onboardingHelp.isOnboardingOpen(),
      helpOpen: onboardingHelp.isHelpOpen(),
      timeline: timeline.getState(),
      currentPhoto: currentPhotoData ? Object.freeze({ title: currentPhotoData.title, thumbUrl: currentPhotoData.thumbUrl }) : null,
      lightboxOpen: lightbox.isOpen(),
      lastShareUrl,
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
    stopTimelapse();
    timeline.cleanup();
    lightbox.cleanup();
    onboardingHelp.cleanup();
    cameraModes.cleanup();
    playableBoat.cleanup();
    radar.cleanup();
    weatherGis.cleanup();
    ambience.cleanup();
    traffic3d.setEnabled(false);
    for (const m of markerObjs) m.marker.remove();
    map.remove();
  };
}
