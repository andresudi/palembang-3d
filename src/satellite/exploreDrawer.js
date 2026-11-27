// Collapsible left Exploration Drawer + Active Mode Banners + Photo Mode Shutter Bar (v2.0)
import { PALEMBANG_POIS, POI_CATEGORIES } from './palembangPois.js';

const CAT_BADGE = {
  landmark: { icon: '🏛️', id: 'Landmark', en: 'Landmark' },
  kuliner: { icon: '🍜', id: 'Kuliner', en: 'Culinary' },
  lrt: { icon: '🚆', id: 'LRT', en: 'LRT' },
};

export function createExploreDrawer({
  i18n,
  cameraModes,
  playableBoat,
  festival3d,
  routePlanner,
  passport,
  ambience,
  audioGuide,
  weatherGis,
  onSelectPoi,
  onCategoryChange,
  onToggleAudio,
  onToggleBuildings,
  onToggleTraffic,
  onToggleLabels,
  onToggleRadar,
  onSetQuality,
  onToggleLang,
  onShare,
  onOpenHelp,
  onStartTimeline,
  onSetHour,
  onToggleTimelapse,
  onSetFestival,
  onEnterPhotoMode,
  onExitPhotoMode,
  onDownloadPostcard,
  onDrawerToggle,
}) {
  let isOpen = false;
  let activeTab = 'ride'; // 'ride' | 'explore' | 'gis' | 'festival'
  let activeCategory = 'all';
  let searchQuery = '';
  let photoWatermark = true;

  const t = (k) => i18n.t(k);

  // --- Drawer Shell ---
  const drawer = document.createElement('aside');
  drawer.className = 'explore-drawer';
  drawer.setAttribute('aria-label', 'Panel Eksplorasi Palembang');
  drawer.dataset.open = 'false';

  const head = document.createElement('div');
  head.className = 'drawer-head';
  const drawerTitleEl = document.createElement('span');
  drawerTitleEl.className = 'drawer-title';

  const headActions = document.createElement('div');
  headActions.className = 'drawer-head-actions';

  const mobileTools = document.createElement('div');
  mobileTools.className = 'drawer-mobile-tools';
  const mLangBtn = document.createElement('button');
  mLangBtn.type = 'button';
  mLangBtn.className = 'drawer-close';
  mLangBtn.textContent = i18n.getLang().toUpperCase();
  mLangBtn.addEventListener('click', () => onToggleLang?.());

  const mShareBtn = document.createElement('button');
  mShareBtn.type = 'button';
  mShareBtn.className = 'drawer-close';
  mShareBtn.textContent = '↗';
  mShareBtn.title = 'Bagikan';
  mShareBtn.addEventListener('click', () => onShare?.());

  const mHelpBtn = document.createElement('button');
  mHelpBtn.type = 'button';
  mHelpBtn.className = 'drawer-close';
  mHelpBtn.textContent = '?';
  mHelpBtn.title = 'Bantuan';
  mHelpBtn.addEventListener('click', () => onOpenHelp?.());

  mobileTools.append(mLangBtn, mShareBtn, mHelpBtn);

  const closeBtn = document.createElement('button');
  closeBtn.type = 'button';
  closeBtn.className = 'drawer-close';
  closeBtn.addEventListener('click', () => setOpen(false));
  headActions.append(mobileTools, closeBtn);
  head.append(drawerTitleEl, headActions);

  const tabBar = document.createElement('div');
  tabBar.className = 'drawer-tabs drawer-tabs-4';
  tabBar.setAttribute('role', 'tablist');

  const tabDefs = [
    { id: 'ride', key: 'tabRide' },
    { id: 'explore', key: 'tabExplore' },
    { id: 'gis', key: 'tabGis' },
    { id: 'festival', key: 'tabFestival' },
  ];
  const tabBtns = new Map();
  const tabPanels = new Map();

  for (const def of tabDefs) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'drawer-tab';
    btn.role = 'tab';
    btn.dataset.drawerTab = def.id;
    btn.addEventListener('click', () => setTab(def.id));
    tabBar.appendChild(btn);
    tabBtns.set(def.id, { btn, key: def.key });
  }

  const body = document.createElement('div');
  body.className = 'drawer-body';

  // === TAB 1: Naik & Tur (+ Playable Boat Mini-Game + 4 Layer Toggles) ===
  const ridePanel = document.createElement('div');
  ridePanel.className = 'drawer-panel';

  const rideSectionTitle = document.createElement('p');
  rideSectionTitle.className = 'drawer-section-label';
  ridePanel.appendChild(rideSectionTitle);

  const modeActionBtns = new Map();
  function makeActionCard({ modeId, icon, titleKey, descKey, onClick }) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'action-card';
    btn.dataset.actionMode = modeId;
    btn.innerHTML = `
      <span class="action-icon" aria-hidden="true">${icon}</span>
      <span class="action-copy">
        <strong data-i18n-title></strong>
        <small data-i18n-desc></small>
      </span>
      <span class="action-pill" data-action-pill></span>
    `;
    btn.addEventListener('click', onClick);
    modeActionBtns.set(modeId, { btn, titleKey, descKey });
    return btn;
  }

  const rideStack = document.createElement('div');
  rideStack.className = 'action-stack';
  rideStack.append(
    makeActionCard({
      modeId: 'play-boat',
      icon: '⛵',
      titleKey: 'playBoat',
      descKey: 'playBoatDesc',
      onClick: () => {
        if (playableBoat.getState().active) {
          playableBoat.stop();
        } else {
          cameraModes.stopAll();
          playableBoat.start();
        }
      },
    }),
    makeActionCard({
      modeId: 'ride-lrt',
      icon: '🚆',
      titleKey: 'rideLrt',
      descKey: 'rideLrtDesc',
      onClick: () => {
        playableBoat.stop();
        if (cameraModes.getState().mode === 'ride-lrt') cameraModes.stopAll();
        else cameraModes.startRide('lrt');
      },
    }),
    makeActionCard({
      modeId: 'ride-boat',
      icon: '🚤',
      titleKey: 'rideBoat',
      descKey: 'rideBoatDesc',
      onClick: () => {
        playableBoat.stop();
        if (cameraModes.getState().mode === 'ride-boat') cameraModes.stopAll();
        else {
          cameraModes.startRide('boat');
          ambience?.playBoatHorn(false);
        }
      },
    }),
    makeActionCard({
      modeId: 'ride-barge',
      icon: '🚢',
      titleKey: 'rideBarge',
      descKey: 'rideBargeDesc',
      onClick: () => {
        playableBoat.stop();
        if (cameraModes.getState().mode === 'ride-barge') cameraModes.stopAll();
        else {
          cameraModes.startRide('barge');
          ambience?.playBoatHorn(true);
        }
      },
    })
  );
  ridePanel.appendChild(rideStack);

  const tourSectionTitle = document.createElement('p');
  tourSectionTitle.className = 'drawer-section-label';
  ridePanel.appendChild(tourSectionTitle);

  const tourStack = document.createElement('div');
  tourStack.className = 'action-stack';
  tourStack.append(
    makeActionCard({
      modeId: 'tour',
      icon: '🎬',
      titleKey: 'tourTitle',
      descKey: 'tourDesc',
      onClick: () => {
        playableBoat.stop();
        if (cameraModes.getState().mode === 'tour') cameraModes.stopAll();
        else cameraModes.startTour(1);
      },
    }),
    makeActionCard({
      modeId: 'drone',
      icon: '🛸',
      titleKey: 'droneTitle',
      descKey: 'droneDesc',
      onClick: () => {
        playableBoat.stop();
        if (cameraModes.getState().mode === 'drone') cameraModes.stopAll();
        else cameraModes.startDrone();
      },
    })
  );
  ridePanel.appendChild(tourStack);

  const layerTitle = document.createElement('p');
  layerTitle.className = 'drawer-section-label';
  ridePanel.appendChild(layerTitle);

  const layerRow = document.createElement('div');
  layerRow.className = 'layer-toggle-row layer-toggle-row-4';

  const bldgToggle = document.createElement('button');
  bldgToggle.type = 'button';
  bldgToggle.className = 'toggle-btn active';
  bldgToggle.dataset.buildingsBtn = 'true';
  bldgToggle.addEventListener('click', () => {
    const next = onToggleBuildings();
    bldgToggle.classList.toggle('active', next);
  });

  const animToggle = document.createElement('button');
  animToggle.type = 'button';
  animToggle.className = 'toggle-btn active';
  animToggle.dataset.trafficBtn = 'true';
  animToggle.addEventListener('click', () => {
    const next = onToggleTraffic();
    animToggle.classList.toggle('active', next);
  });

  const labelToggle = document.createElement('button');
  labelToggle.type = 'button';
  labelToggle.className = 'toggle-btn active';
  labelToggle.dataset.labelsBtn = 'true';
  labelToggle.addEventListener('click', () => {
    const next = onToggleLabels();
    labelToggle.classList.toggle('active', next);
  });

  const radarToggle = document.createElement('button');
  radarToggle.type = 'button';
  radarToggle.className = 'toggle-btn active';
  radarToggle.dataset.radarBtn = 'true';
  radarToggle.addEventListener('click', () => {
    const next = onToggleRadar();
    radarToggle.classList.toggle('active', next);
  });

  layerRow.append(bldgToggle, animToggle, labelToggle, radarToggle);
  ridePanel.appendChild(layerRow);

  // v2.5 Graphics Quality Toggle (High vs Eco)
  const qualityRow = document.createElement('div');
  qualityRow.className = 'quality-row';
  qualityRow.innerHTML = `
    <span class="quality-label" data-quality-label>Grafis</span>
    <div class="segmented-control quality-seg">
      <button type="button" class="seg-btn" data-quality-btn="high">Tinggi</button>
      <button type="button" class="seg-btn" data-quality-btn="eco">Hemat</button>
    </div>
  `;
  const qualityLabelEl = qualityRow.querySelector('[data-quality-label]');
  const qHighBtn = qualityRow.querySelector('[data-quality-btn="high"]');
  const qEcoBtn = qualityRow.querySelector('[data-quality-btn="eco"]');
  qHighBtn.addEventListener('click', () => onSetQuality?.('high'));
  qEcoBtn.addEventListener('click', () => onSetQuality?.('eco'));
  ridePanel.appendChild(qualityRow);

  tabPanels.set('ride', ridePanel);

  // === TAB 2: Jelajah (Passport + Category Filter + Search + POI List + Route Planner + Audio) ===
  const explorePanel = document.createElement('div');
  explorePanel.className = 'drawer-panel';

  const passportCard = document.createElement('div');
  passportCard.className = 'passport-card';
  passportCard.innerHTML = `
    <div class="passport-top">
      <div>
        <span class="passport-eyebrow" data-passport-eyebrow>Passport Penjelajah</span>
        <strong class="passport-rank" data-passport-rank>Wisatawan Baru</strong>
      </div>
      <div class="passport-right">
        <span class="passport-count" data-passport-count>0/20</span>
        <button type="button" class="passport-reset" data-passport-reset>Reset</button>
      </div>
    </div>
    <div class="passport-bar"><div class="passport-fill" data-passport-fill style="width: 0%"></div></div>
  `;
  const passportEyebrowEl = passportCard.querySelector('[data-passport-eyebrow]');
  const passportRankEl = passportCard.querySelector('[data-passport-rank]');
  const passportCountEl = passportCard.querySelector('[data-passport-count]');
  const passportFillEl = passportCard.querySelector('[data-passport-fill]');
  passportCard.querySelector('[data-passport-reset]').addEventListener('click', () => {
    passport.reset();
    syncPassport();
  });

  const catRow = document.createElement('div');
  catRow.className = 'cat-filter-row';
  const catBtns = new Map();
  for (const cat of POI_CATEGORIES) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'cat-pill';
    btn.dataset.catFilter = cat.id;
    btn.addEventListener('click', () => setCategory(cat.id));
    catRow.appendChild(btn);
    catBtns.set(cat.id, btn);
  }

  const searchInput = document.createElement('input');
  searchInput.type = 'search';
  searchInput.className = 'drawer-search';
  searchInput.dataset.poiSearch = 'true';

  const poiList = document.createElement('div');
  poiList.className = 'poi-list';

  function renderPoiList() {
    const lang = i18n.getLang();
    const q = searchQuery.trim().toLowerCase();
    poiList.innerHTML = '';
    const items = PALEMBANG_POIS.filter((raw) => {
      if (activeCategory !== 'all' && raw.category !== activeCategory) return false;
      const p = i18n.localizePoi(raw);
      if (!q) return true;
      return (
        p.label.toLowerCase().includes(q) ||
        p.title.toLowerCase().includes(q) ||
        p.signature.toLowerCase().includes(q) ||
        p.zone.toLowerCase().includes(q)
      );
    });

    for (const raw of items) {
      const p = i18n.localizePoi(raw);
      const visited = passport.isVisited(p.id);
      const badge = CAT_BADGE[p.category] || CAT_BADGE.landmark;
      const catText = lang === 'en' ? badge.en : badge.id;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `poi-item cat-${p.category}${visited ? ' visited' : ''}`;
      btn.dataset.poiCard = p.id;
      btn.innerHTML = `
        <div class="poi-item-head">
          <strong>${badge.icon} ${p.label}</strong>
          <span class="poi-check">${visited ? (lang === 'en' ? '✓ Visited' : '✓ Dikunjungi') : catText}</span>
        </div>
        <small class="poi-sig">${p.signature}</small>
      `;
      btn.addEventListener('click', () => {
        cameraModes.stopAll();
        playableBoat.stop();
        onSelectPoi(raw);
      });
      poiList.appendChild(btn);
    }

    if (items.length === 0) {
      poiList.innerHTML = `<p class="drawer-empty">${lang === 'en' ? 'No matching places found.' : 'Tidak ada lokasi cocok.'}</p>`;
    }
  }
  searchInput.addEventListener('input', () => {
    searchQuery = searchInput.value;
    renderPoiList();
  });

  // v2.3 Real Road Route Planner Card (OSRM + Local OSM A* Fallback)
  const routeCard = document.createElement('div');
  routeCard.className = 'gis-card route-card';
  const optsHtml = PALEMBANG_POIS.map((p) => `<option value="${p.id}">${p.label}</option>`).join('');
  routeCard.innerHTML = `
    <p class="drawer-section-label route-heading" data-route-heading>Perencana Rute Jalan Nyata</p>
    <div class="route-selects">
      <select class="route-select" data-route-from aria-label="Titik awal">${optsHtml}</select>
      <select class="route-select" data-route-to aria-label="Tujuan">${optsHtml}</select>
    </div>
    <div class="route-btns">
      <button type="button" class="toggle-btn active route-go-btn" data-route-go>Cari Rute</button>
      <button type="button" class="passport-reset" data-route-clear>Hapus</button>
    </div>
    <div class="measure-result" data-route-result></div>
  `;
  const routeHeadingEl = routeCard.querySelector('[data-route-heading]');
  const routeFromSel = routeCard.querySelector('[data-route-from]');
  const routeToSel = routeCard.querySelector('[data-route-to]');
  const routeGoBtn = routeCard.querySelector('[data-route-go]');
  const routeClearBtn = routeCard.querySelector('[data-route-clear]');
  const routeResultEl = routeCard.querySelector('[data-route-result]');
  routeFromSel.value = 'ampera';
  routeToSel.value = 'kuliner-pempek-candy';

  routeGoBtn.addEventListener('click', async () => {
    const fromPoi = PALEMBANG_POIS.find((p) => p.id === routeFromSel.value);
    const toPoi = PALEMBANG_POIS.find((p) => p.id === routeToSel.value);
    if (!fromPoi || !toPoi || fromPoi.id === toPoi.id) return;
    routeGoBtn.disabled = true;
    routeGoBtn.textContent = '...';
    await routePlanner.planRoute(fromPoi, toPoi);
    routeGoBtn.disabled = false;
    routeGoBtn.textContent = t('routeGo');
  });
  routeClearBtn.addEventListener('click', () => routePlanner.clearRoute());

  function syncRoute(state) {
    if (!state) {
      routeResultEl.innerHTML = '';
      return;
    }
    const srcTag = state.source === 'osrm' ? 'OSRM Live' : 'OSM Palembang Graph';
    routeResultEl.innerHTML = `
      <div class="measure-dist">${state.fromLabel} → ${state.toLabel}: <strong>${state.formatted}</strong></div>
      <div class="measure-eta-grid">
        <span>🚗 ${state.carEta}</span>
        <span>🚶 ${state.walkEta}</span>
      </div>
      <div class="route-meta-row">
        <small>${srcTag}</small>
        <a class="gmaps-link" href="${state.gmapsUrl}" target="_blank" rel="noopener noreferrer">${t('openGmaps')}</a>
      </div>
    `;
  }

  // Procedural Web Audio Strip
  const audioCard = document.createElement('div');
  audioCard.className = 'audio-card';
  audioCard.innerHTML = `
    <div class="audio-head">
      <div class="audio-copy">
        <strong>Ambience Sungai Musi</strong>
        <small data-audio-status>Nonaktif · Air sungai &amp; klakson kapal</small>
      </div>
      <button type="button" class="toggle-btn audio-btn" data-drawer-audio-btn>Putar</button>
    </div>
    <div class="audio-vol-row">
      <span>Vol</span>
      <input type="range" min="0" max="100" value="55" data-audio-volume aria-label="Volume" />
      <button type="button" class="horn-btn" data-horn-btn>Klakson</button>
    </div>
  `;
  const audioStatusEl = audioCard.querySelector('[data-audio-status]');
  const drawerAudioBtn = audioCard.querySelector('[data-drawer-audio-btn]');
  const audioVolSlider = audioCard.querySelector('[data-audio-volume]');
  const hornBtn = audioCard.querySelector('[data-horn-btn]');
  drawerAudioBtn.addEventListener('click', () => onToggleAudio());
  audioVolSlider.addEventListener('input', () => ambience.setVolume(Number(audioVolSlider.value) / 100));
  hornBtn.addEventListener('click', () => {
    if (!ambience.isEnabled()) onToggleAudio();
    ambience.playBoatHorn(false);
  });

  explorePanel.append(passportCard, catRow, searchInput, poiList, routeCard, audioCard);
  tabPanels.set('explore', explorePanel);

  // === TAB 3: Cuaca & GIS ===
  const gisPanel = document.createElement('div');
  gisPanel.className = 'drawer-panel';
  gisPanel.innerHTML = `
    <p class="drawer-section-label">Cuaca Palembang (Open-Meteo · Gratis)</p>
    <div class="gis-card">
      <div class="weather-live-head">
        <div class="weather-live-copy">
          <strong data-weather-title>☀️ Cerah (Simulasi)</strong>
          <small data-weather-meta>Klik Sync Live untuk cuaca aktual Palembang</small>
        </div>
        <button type="button" class="toggle-btn weather-sync-btn" data-weather-sync>Sync Live</button>
      </div>
      <div class="layer-toggle-row weather-mode-row">
        <button type="button" class="toggle-btn active" data-weather-btn="cerah">Cerah</button>
        <button type="button" class="toggle-btn" data-weather-btn="berawan">Berawan</button>
        <button type="button" class="toggle-btn" data-weather-btn="hujan">Hujan 3D</button>
      </div>
    </div>

    <p class="drawer-section-label">Simulasi Pasang Sungai Musi</p>
    <div class="gis-card">
      <div class="tide-head">
        <strong>Kenaikan Muka Air</strong>
        <div class="tide-right">
          <span class="tide-val" data-tide-val>+0.0 m</span>
          <button type="button" class="passport-reset" data-tide-reset>Normal</button>
        </div>
      </div>
      <input type="range" class="tide-slider" min="0" max="3.5" step="0.1" value="0" data-tide-slider aria-label="Pasang Sungai Musi" />
      <p class="tide-status level-normal" data-tide-status>Normal · Muka air standar Sungai Musi</p>
    </div>

    <p class="drawer-section-label">Alat Ukur Jarak (2 Titik)</p>
    <div class="gis-card">
      <div class="measure-top">
        <button type="button" class="toggle-btn measure-toggle" data-measure-toggle>Mulai Ukur (Klik Peta)</button>
        <button type="button" class="passport-reset" data-measure-clear>Hapus</button>
      </div>
      <div class="measure-presets">
        <button type="button" class="mini-chip" data-measure-preset="ampera-kemaro">Ampera ↔ Kemaro</button>
        <button type="button" class="mini-chip" data-measure-preset="ampera-jakabaring">Ampera ↔ Jakabaring</button>
      </div>
      <div class="measure-result" data-measure-result>
        <small>Aktifkan lalu klik Titik A &amp; Titik B di peta 3D.</small>
      </div>
    </div>
  `;

  const weatherTitleEl = gisPanel.querySelector('[data-weather-title]');
  const weatherMetaEl = gisPanel.querySelector('[data-weather-meta]');
  const weatherSyncBtn = gisPanel.querySelector('[data-weather-sync]');
  const weatherModeBtns = [...gisPanel.querySelectorAll('[data-weather-btn]')];
  const tideValEl = gisPanel.querySelector('[data-tide-val]');
  const tideSlider = gisPanel.querySelector('[data-tide-slider]');
  const tideStatusEl = gisPanel.querySelector('[data-tide-status]');
  const tideResetBtn = gisPanel.querySelector('[data-tide-reset]');
  const measureToggleBtn = gisPanel.querySelector('[data-measure-toggle]');
  const measureClearBtn = gisPanel.querySelector('[data-measure-clear]');
  const measureResultEl = gisPanel.querySelector('[data-measure-result]');

  weatherSyncBtn.addEventListener('click', async () => {
    weatherSyncBtn.textContent = '...';
    weatherSyncBtn.disabled = true;
    await weatherGis.syncLiveWeather();
    weatherSyncBtn.textContent = 'Sync Live';
    weatherSyncBtn.disabled = false;
  });
  for (const btn of weatherModeBtns) {
    btn.addEventListener('click', () => {
      const m = btn.dataset.weatherBtn;
      weatherGis.setWeatherMode(m, { source: 'manual', storm: m === 'hujan' });
    });
  }
  tideSlider.addEventListener('input', () => weatherGis.setTideMeters(Number(tideSlider.value)));
  tideResetBtn.addEventListener('click', () => {
    tideSlider.value = '0';
    weatherGis.setTideMeters(0);
  });
  measureToggleBtn.addEventListener('click', () => weatherGis.setMeasureActive(!weatherGis.getMeasureState().active));
  measureClearBtn.addEventListener('click', () => weatherGis.clearMeasurePoints());

  const MEASURE_PRESETS = {
    'ampera-kemaro': [
      [104.76340, -2.99194],
      [104.81312, -2.98038],
    ],
    'ampera-jakabaring': [
      [104.76340, -2.99194],
      [104.78910, -3.02150],
    ],
  };
  for (const btn of gisPanel.querySelectorAll('[data-measure-preset]')) {
    btn.addEventListener('click', () => {
      const pair = MEASURE_PRESETS[btn.dataset.measurePreset];
      if (pair) weatherGis.setMeasurePoints(pair[0], pair[1]);
    });
  }
  tabPanels.set('gis', gisPanel);

  // === TAB 4: Festival, 24h Time-Lapse & Photo Mode (v2.1) ===
  const festPanel = document.createElement('div');
  festPanel.className = 'drawer-panel';
  festPanel.innerHTML = `
    <p class="drawer-section-label" data-sec-clock>Waktu 24 Jam &amp; Time-Lapse</p>
    <div class="gis-card">
      <div class="tide-head">
        <strong data-clock-display>11:30 WIB</strong>
        <button type="button" class="toggle-btn clock-play-btn" data-timelapse-btn>Putar 24 Jam</button>
      </div>
      <input type="range" class="tide-slider clock-slider" min="0" max="23.9" step="0.1" value="11.5" data-hour-slider aria-label="Waktu 24 jam" />
      <div class="clock-ticks"><span>00:00</span><span>06:00</span><span>12:00</span><span>18:00</span><span>23:59</span></div>
    </div>

    <p class="drawer-section-label" data-sec-fest>Festival Budaya Palembang 3D</p>
    <div class="action-stack">
      <button type="button" class="action-card" data-festival-btn="bidar">
        <span class="action-icon" aria-hidden="true">🚣</span>
        <span class="action-copy">
          <strong data-fest-bidar-title>Festival Balap Perahu Bidar</strong>
          <small data-fest-bidar-desc>6 perahu bidar panjang balapan di koridor BKB–Ampera</small>
        </span>
        <span class="action-pill" data-fest-pill="bidar">Mulai</span>
      </button>
      <button type="button" class="action-card" data-festival-btn="fireworks">
        <span class="action-icon" aria-hidden="true">🎆</span>
        <span class="action-copy">
          <strong data-fest-fw-title>Malam Kembang Api &amp; Lampion</strong>
          <small data-fest-fw-desc>Kembang api di atas Ampera + 48 lampion Pulau Kemaro</small>
        </span>
        <span class="action-pill" data-fest-pill="fireworks">Mulai</span>
      </button>
    </div>

    <p class="drawer-section-label" data-sec-photo>Photo Mode &amp; Linimasa Sejarah</p>
    <div class="action-stack">
      <button type="button" class="action-card" data-timeline-open="true">
        <span class="action-icon" aria-hidden="true">📜</span>
        <span class="action-copy">
          <strong data-tl-card-title>Timeline Sejarah Palembang (5 Era)</strong>
          <small data-tl-card-desc>683 M Sriwijaya → 1780 Kesultanan → 1928 → 1965 Ampera → LRT</small>
        </span>
        <span class="action-pill" data-tl-pill>Mulai</span>
      </button>
      <button type="button" class="action-card" data-photo-enter="true">
        <span class="action-icon" aria-hidden="true">📸</span>
        <span class="action-copy">
          <strong data-photo-title>Masuk Photo Mode</strong>
          <small data-photo-desc>Sembunyikan HUD &amp; unduh kartu pos PNG resolusi penuh</small>
        </span>
        <span class="action-pill">Buka</span>
      </button>
    </div>
  `;

  const secClockEl = festPanel.querySelector('[data-sec-clock]');
  const secFestEl = festPanel.querySelector('[data-sec-fest]');
  const secPhotoEl = festPanel.querySelector('[data-sec-photo]');
  const clockDisplayEl = festPanel.querySelector('[data-clock-display]');
  const hourSlider = festPanel.querySelector('[data-hour-slider]');
  const timelapseBtn = festPanel.querySelector('[data-timelapse-btn]');
  const bidarBtn = festPanel.querySelector('[data-festival-btn="bidar"]');
  const fwBtn = festPanel.querySelector('[data-festival-btn="fireworks"]');
  const timelineOpenBtn = festPanel.querySelector('[data-timeline-open]');
  const photoEnterBtn = festPanel.querySelector('[data-photo-enter]');

  hourSlider.addEventListener('input', () => onSetHour(Number(hourSlider.value)));
  timelapseBtn.addEventListener('click', () => onToggleTimelapse());
  bidarBtn.addEventListener('click', () => onSetFestival(festival3d.getMode() === 'bidar' ? 'none' : 'bidar'));
  fwBtn.addEventListener('click', () => onSetFestival(festival3d.getMode() === 'fireworks' ? 'none' : 'fireworks'));
  timelineOpenBtn.addEventListener('click', () => {
    setOpen(false);
    onStartTimeline?.();
  });
  photoEnterBtn.addEventListener('click', () => onEnterPhotoMode());

  tabPanels.set('festival', festPanel);

  body.append(ridePanel, explorePanel, gisPanel, festPanel);
  drawer.append(head, tabBar, body);

  // --- Floating Active Experience Banner (Ride-Along / Tour / Drone / Playable Boat) ---
  const banner = document.createElement('div');
  banner.className = 'mode-banner hidden';
  banner.setAttribute('aria-live', 'polite');

  const bannerInfo = document.createElement('div');
  bannerInfo.className = 'mode-banner-info';
  const bannerTitle = document.createElement('strong');
  const bannerDetail = document.createElement('span');
  bannerInfo.append(bannerTitle, bannerDetail);

  const bannerActions = document.createElement('div');
  bannerActions.className = 'mode-banner-actions';
  banner.append(bannerInfo, bannerActions);

  // --- Photo Mode Bottom Shutter Bar ---
  const photoBar = document.createElement('div');
  photoBar.className = 'photo-bar hidden';
  const shutterBtn = document.createElement('button');
  shutterBtn.type = 'button';
  shutterBtn.className = 'banner-btn photo-shutter-btn';
  shutterBtn.dataset.photoShutter = 'true';
  shutterBtn.addEventListener('click', () => onDownloadPostcard(photoWatermark));

  const wmToggleBtn = document.createElement('button');
  wmToggleBtn.type = 'button';
  wmToggleBtn.className = 'banner-btn active';
  wmToggleBtn.addEventListener('click', () => {
    photoWatermark = !photoWatermark;
    wmToggleBtn.classList.toggle('active', photoWatermark);
    wmToggleBtn.textContent = `${t('photoWatermark')}: ${photoWatermark ? 'ON' : 'OFF'}`;
  });

  const photoExitBtn = document.createElement('button');
  photoExitBtn.type = 'button';
  photoExitBtn.className = 'banner-btn banner-stop';
  photoExitBtn.dataset.photoExit = 'true';
  photoExitBtn.addEventListener('click', () => onExitPhotoMode());

  photoBar.append(shutterBtn, wmToggleBtn, photoExitBtn);

  // --- Toast ---
  const toast = document.createElement('div');
  toast.className = 'passport-toast hidden';
  toast.setAttribute('aria-live', 'polite');
  let toastTimer = null;

  function showToast(text) {
    clearTimeout(toastTimer);
    toast.textContent = text;
    toast.classList.remove('hidden');
    toastTimer = setTimeout(() => toast.classList.add('hidden'), 3000);
  }

  function bindHold(btn, downFn, upFn) {
    const start = (e) => {
      e.preventDefault();
      downFn();
    };
    btn.addEventListener('pointerdown', start);
    btn.addEventListener('pointerup', upFn);
    btn.addEventListener('pointerleave', upFn);
    btn.addEventListener('pointercancel', upFn);
  }

  function syncModeBanner(camState, boatState = playableBoat.getState()) {
    const boatOn = Boolean(boatState?.active);
    for (const [id, item] of modeActionBtns) {
      const active = id === 'play-boat' ? boatOn : !boatOn && camState.mode === id;
      item.btn.classList.toggle('active', active);
      const pill = item.btn.querySelector('[data-action-pill]');
      if (pill) pill.textContent = active ? t('active') : t('start');
    }

    if (boatOn) {
      const lang = i18n.getLang();
      banner.classList.remove('hidden');
      bannerTitle.textContent =
        lang === 'en'
          ? `⛵ Steer Ketek · ${boatState.speedKmh} km/h · Relics ${boatState.collectedCount}/${boatState.totalRelics}`
          : `⛵ Setir Perahu Ketek · ${boatState.speedKmh} km/j · Artefak ${boatState.collectedCount}/${boatState.totalRelics}`;
      if (boatState.completed) {
        bannerDetail.textContent =
          lang === 'en'
            ? `🏆 All 5 Srivijaya Relics Collected in ${boatState.elapsedSec}s!`
            : `🏆 Semua 5 Artefak Sriwijaya Terkumpul (${boatState.elapsedSec} dtk)!`;
      } else if (boatState.nearestRelic) {
        const rName = lang === 'en' ? boatState.nearestRelic.nameEn : boatState.nearestRelic.nameId;
        bannerDetail.textContent =
          lang === 'en'
            ? `Nearest: ${rName} (${boatState.nearestRelic.distM} m) · WASD / Arrows`
            : `Terdekat: ${rName} (${boatState.nearestRelic.distM} m) · WASD / Panah`;
      }

      if (!bannerActions.dataset.boatControlsMounted) {
        bannerActions.innerHTML = '';
        bannerActions.dataset.boatControlsMounted = 'true';
        const pad = document.createElement('div');
        pad.className = 'drone-pad';
        const controls = [
          ['↑', () => playableBoat.setVirtualInput({ throttle: 1 }), () => playableBoat.setVirtualInput({ throttle: 0 })],
          ['↓', () => playableBoat.setVirtualInput({ throttle: -1 }), () => playableBoat.setVirtualInput({ throttle: 0 })],
          ['←', () => playableBoat.setVirtualInput({ steer: -1 }), () => playableBoat.setVirtualInput({ steer: 0 })],
          ['→', () => playableBoat.setVirtualInput({ steer: 1 }), () => playableBoat.setVirtualInput({ steer: 0 })],
        ];
        for (const [sym, dn, up] of controls) {
          const b = document.createElement('button');
          b.type = 'button';
          b.className = 'banner-btn drone-key';
          b.textContent = sym;
          bindHold(b, dn, up);
          pad.appendChild(b);
        }
        const resetBtn = document.createElement('button');
        resetBtn.type = 'button';
        resetBtn.className = 'banner-btn';
        resetBtn.textContent = 'Reset';
        resetBtn.addEventListener('click', () => playableBoat.start({ reset: true }));

        const stopBtn = document.createElement('button');
        stopBtn.type = 'button';
        stopBtn.className = 'banner-btn banner-stop';
        stopBtn.textContent = t('stop');
        stopBtn.dataset.stopModeBtn = 'true';
        stopBtn.addEventListener('click', () => playableBoat.stop());

        bannerActions.append(pad, resetBtn, stopBtn);
      }
      return;
    }

    delete bannerActions.dataset.boatControlsMounted;
    if (camState.mode === 'free') {
      banner.classList.add('hidden');
      return;
    }

    banner.classList.remove('hidden');
    bannerTitle.textContent = camState.label;
    bannerDetail.textContent = camState.detail;
    bannerActions.innerHTML = '';

    if (camState.mode === 'tour') {
      const en = i18n.getLang() === 'en';
      const narrOn = Boolean(audioGuide?.getState?.().autoTourNarration);
      const narrBtn = document.createElement('button');
      narrBtn.type = 'button';
      narrBtn.className = `banner-btn${narrOn ? ' active' : ''}`;
      narrBtn.dataset.tourNarrationBtn = 'true';
      narrBtn.textContent = en ? `🔊 Voice: ${narrOn ? 'ON' : 'OFF'}` : `🔊 Narasi: ${narrOn ? 'ON' : 'OFF'}`;
      narrBtn.addEventListener('click', () => {
        audioGuide?.toggleAutoTourNarration?.();
        syncModeBanner(cameraModes.getState(), playableBoat.getState());
      });

      const pauseBtn = document.createElement('button');
      pauseBtn.type = 'button';
      pauseBtn.className = 'banner-btn';
      pauseBtn.textContent = camState.tourPaused ? (en ? 'Resume' : 'Lanjut') : (en ? 'Pause' : 'Jeda');
      pauseBtn.addEventListener('click', () => cameraModes.toggleTourPause());

      const nextBtn = document.createElement('button');
      nextBtn.type = 'button';
      nextBtn.className = 'banner-btn';
      nextBtn.textContent = en ? 'Next' : 'Berikutnya';
      nextBtn.addEventListener('click', () => cameraModes.nextTourStop());

      bannerActions.append(narrBtn, pauseBtn, nextBtn);
    } else if (camState.mode === 'drone') {
      const pad = document.createElement('div');
      pad.className = 'drone-pad';
      const btns = [
        ['↑', { forward: 1 }, { forward: 0 }],
        ['↓', { forward: -1 }, { forward: 0 }],
        ['←', { right: -1 }, { right: 0 }],
        ['→', { right: 1 }, { right: 0 }],
        ['+', { up: -1 }, { up: 0 }],
        ['−', { up: 1 }, { up: 0 }],
      ];
      for (const [txt, dn, up] of btns) {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'banner-btn drone-key';
        b.textContent = txt;
        bindHold(b, () => cameraModes.setVirtualDroneInput(dn), () => cameraModes.setVirtualDroneInput(up));
        pad.appendChild(b);
      }
      bannerActions.appendChild(pad);
    }

    const stopBtn = document.createElement('button');
    stopBtn.type = 'button';
    stopBtn.className = 'banner-btn banner-stop';
    stopBtn.textContent = t('stop');
    stopBtn.dataset.stopModeBtn = 'true';
    stopBtn.addEventListener('click', () => cameraModes.stopAll());
    bannerActions.appendChild(stopBtn);
  }

  function syncWeather(state) {
    for (const btn of weatherModeBtns) {
      btn.classList.toggle('active', btn.dataset.weatherBtn === state.mode);
    }
    const modeLabels = { cerah: '☀️ Cerah', berawan: '⛅ Berawan', hujan: '🌧️ Hujan Tropis 3D' };
    if (state.source === 'live' && state.live) {
      weatherTitleEl.textContent = `${state.live.icon} ${state.live.label} · ${state.live.tempC}°C`;
      weatherMetaEl.textContent = `Live Palembang · Lembap ${state.live.humidity}% · Angin ${state.live.windKmh} km/j`;
    } else if (state.error) {
      weatherTitleEl.textContent = modeLabels[state.mode] || '☀️ Cerah';
      weatherMetaEl.textContent = `Mode simulasi (${state.error})`;
    } else {
      weatherTitleEl.textContent = `${modeLabels[state.mode] || '☀️ Cerah'} (Simulasi)`;
      weatherMetaEl.textContent =
        state.mode === 'hujan'
          ? 'Partikel hujan 3D & suara hujan aktif'
          : 'Klik Sync Live untuk cuaca aktual Palembang';
    }
  }

  function syncTide(state) {
    tideValEl.textContent = `+${state.meters.toFixed(1)} m`;
    tideSlider.value = String(state.meters);
    tideStatusEl.textContent = state.statusText;
    tideStatusEl.className = `tide-status level-${state.level}`;
  }

  function syncMeasure(state) {
    measureToggleBtn.classList.toggle('active', state.active);
    measureToggleBtn.textContent = state.active ? 'Mode Ukur Aktif' : 'Mulai Ukur (Klik Peta)';
    if (state.formatted && state.eta) {
      measureResultEl.innerHTML = `
        <div class="measure-dist">Jarak Garis Lurus: <strong>${state.formatted}</strong></div>
        <div class="measure-eta-grid">
          <span>🚶 ${state.eta.walk}</span>
          <span>🚗 ${state.eta.car}</span>
          <span>🚆 ${state.eta.lrt}</span>
          <span>🚤 ${state.eta.ketek}</span>
        </div>
      `;
    } else if (state.active && state.hasA) {
      measureResultEl.innerHTML = `<small>Titik A ditetapkan — klik Titik B di peta 3D.</small>`;
    } else if (state.active) {
      measureResultEl.innerHTML = `<small>Klik Titik A di mana saja pada peta 3D.</small>`;
    } else {
      measureResultEl.innerHTML = `<small>Aktifkan lalu klik Titik A &amp; Titik B di peta 3D.</small>`;
    }
  }

  function syncClock(hour, isTimelapse) {
    const h = Math.floor(hour) % 24;
    const m = Math.floor((hour - Math.floor(hour)) * 60);
    clockDisplayEl.textContent = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')} WIB`;
    hourSlider.value = String(hour.toFixed(1));
    timelapseBtn.classList.toggle('active', isTimelapse);
    timelapseBtn.textContent = isTimelapse ? t('timelapseStop') : t('timelapse');
  }

  function syncFestival(festMode) {
    const isBidar = festMode === 'bidar';
    const isFw = festMode === 'fireworks';
    bidarBtn.classList.toggle('active', isBidar);
    fwBtn.classList.toggle('active', isFw);
    festPanel.querySelector('[data-fest-pill="bidar"]').textContent = isBidar ? t('active') : t('start');
    festPanel.querySelector('[data-fest-pill="fireworks"]').textContent = isFw ? t('active') : t('start');
  }

  function syncPhotoMode(isPhoto) {
    photoBar.classList.toggle('hidden', !isPhoto);
  }

  function setCategory(catId, notify = true) {
    activeCategory = catId;
    for (const [id, btn] of catBtns) {
      btn.classList.toggle('active', id === activeCategory);
    }
    renderPoiList();
    if (notify) onCategoryChange(activeCategory);
  }

  function syncPassport() {
    const sum = passport.getSummary();
    passportRankEl.textContent = sum.rank;
    passportCountEl.textContent = `${sum.visitedCount}/${sum.total}`;
    passportFillEl.style.width = `${sum.percent}%`;
    renderPoiList();
  }

  function syncAudio(isOn) {
    drawerAudioBtn.classList.toggle('active', isOn);
    drawerAudioBtn.textContent = isOn ? t('active') : 'Putar';
    audioStatusEl.textContent = isOn
      ? 'Aktif · Riak Sungai Musi & kapal'
      : 'Nonaktif · Air sungai & klakson kapal';
  }

  function applyLanguage() {
    const lang = i18n.getLang();
    drawerTitleEl.textContent = t('drawerTitle');
    closeBtn.textContent = t('close');
    for (const [, item] of tabBtns) {
      item.btn.textContent = t(item.key);
    }
    rideSectionTitle.textContent = t('secRide');
    tourSectionTitle.textContent = t('secTour');
    layerTitle.textContent = t('secLayers');
    for (const [, item] of modeActionBtns) {
      item.btn.querySelector('[data-i18n-title]').textContent = t(item.titleKey);
      item.btn.querySelector('[data-i18n-desc]').textContent = t(item.descKey);
    }
    bldgToggle.textContent = t('bldg3d');
    animToggle.textContent = t('anim');
    labelToggle.textContent = t('label3d');
    radarToggle.textContent = t('radar');
    passportEyebrowEl.textContent = t('passportEyebrow');
    searchInput.placeholder = t('searchPh');
    routeHeadingEl.textContent = t('routeTitle');
    routeGoBtn.textContent = t('routeGo');
    routeClearBtn.textContent = t('routeClear');

    const catLabels = lang === 'en'
      ? { all: 'All', landmark: 'Landmarks', kuliner: 'Culinary', lrt: 'LRT Stations' }
      : { all: 'Semua', landmark: 'Landmark', kuliner: 'Kuliner', lrt: 'Stasiun LRT' };
    for (const cat of POI_CATEGORIES) {
      const count = cat.id === 'all' ? PALEMBANG_POIS.length : PALEMBANG_POIS.filter((p) => p.category === cat.id).length;
      catBtns.get(cat.id).textContent = `${catLabels[cat.id]} (${count})`;
    }

    secClockEl.textContent = t('secClock');
    secFestEl.textContent = t('secFest');
    secPhotoEl.textContent = t('secPhoto');
    festPanel.querySelector('[data-fest-bidar-title]').textContent = t('festBidar');
    festPanel.querySelector('[data-fest-bidar-desc]').textContent = t('festBidarDesc');
    festPanel.querySelector('[data-fest-fw-title]').textContent = t('festFireworks');
    festPanel.querySelector('[data-fest-fw-desc]').textContent = t('festFireworksDesc');
    festPanel.querySelector('[data-photo-title]').textContent = t('photoBtn');
    festPanel.querySelector('[data-photo-desc]').textContent = t('photoDesc');
    shutterBtn.textContent = t('photoShutter');
    wmToggleBtn.textContent = `${t('photoWatermark')}: ${photoWatermark ? 'ON' : 'OFF'}`;
    photoExitBtn.textContent = t('photoExit');

    syncModeBanner(cameraModes.getState(), playableBoat.getState());
    syncFestival(festival3d.getMode());
    syncRoute(routePlanner.getState());
    renderPoiList();
  }

  function setTab(tabId) {
    activeTab = tabId;
    for (const [id, item] of tabBtns) {
      const on = id === activeTab;
      item.btn.classList.toggle('active', on);
      item.btn.setAttribute('aria-selected', String(on));
    }
    for (const [id, panel] of tabPanels) {
      panel.classList.toggle('active', id === activeTab);
    }
  }

  function setOpen(flag) {
    isOpen = Boolean(flag);
    drawer.dataset.open = String(isOpen);
    drawer.classList.toggle('open', isOpen);
    onDrawerToggle(isOpen);
  }

  function syncTrafficToggle(isOn) {
    animToggle.classList.toggle('active', isOn);
  }

  function syncQuality(q) {
    qHighBtn.classList.toggle('active', q !== 'eco');
    qEcoBtn.classList.toggle('active', q === 'eco');
  }

  const origApplyLang = applyLanguage;
  function applyLanguageWithV25() {
    origApplyLang();
    const en = i18n.getLang() === 'en';
    mLangBtn.textContent = i18n.getLang().toUpperCase();
    qualityLabelEl.textContent = en ? 'Graphics' : 'Grafis';
    qHighBtn.textContent = en ? 'High' : 'Tinggi';
    qEcoBtn.textContent = en ? 'Eco' : 'Hemat';
    festPanel.querySelector('[data-tl-card-title]').textContent = en
      ? 'Palembang Historical Timeline (5 Eras)'
      : 'Timeline Sejarah Palembang (5 Era)';
    festPanel.querySelector('[data-tl-card-desc]').textContent = en
      ? '683 CE Srivijaya → 1780 Sultanate → 1928 → 1965 Ampera → LRT'
      : '683 M Sriwijaya → 1780 Kesultanan → 1928 → 1965 Ampera → LRT';
    festPanel.querySelector('[data-tl-pill]').textContent = t('start');
  }

  setTab('ride');
  setCategory('all', false);
  syncPassport();
  syncAudio(false);
  applyLanguageWithV25();

  return {
    drawerEl: drawer,
    bannerEl: banner,
    photoBarEl: photoBar,
    toastEl: toast,
    setOpen,
    isOpen: () => isOpen,
    setTab,
    setCategory,
    syncModeBanner,
    syncTrafficToggle,
    syncQuality,
    syncPassport,
    syncAudio,
    syncWeather,
    syncTide,
    syncMeasure,
    syncRoute,
    syncClock,
    syncFestival,
    syncPhotoMode,
    applyLanguage: applyLanguageWithV25,
    showToast,
  };
}
