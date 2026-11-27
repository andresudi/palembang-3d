// Collapsible left Exploration Drawer + Active Experience Banner for Real Satellite 3D
import { PALEMBANG_POIS, POI_CATEGORIES } from './palembangPois.js';

const CAT_BADGE = {
  landmark: { icon: '🏛️', label: 'Landmark' },
  kuliner: { icon: '🍜', label: 'Kuliner' },
  lrt: { icon: '🚆', label: 'LRT' },
};

export function createExploreDrawer({
  cameraModes,
  passport,
  ambience,
  weatherGis,
  onSelectPoi,
  onCategoryChange,
  onToggleAudio,
  onToggleBuildings,
  onToggleTraffic,
  onToggleLabels,
  onSelectLighting,
  onDrawerToggle,
}) {
  let isOpen = false;
  let activeTab = 'ride'; // 'ride' | 'explore' | 'gis'
  let activeCategory = 'all';
  let searchQuery = '';

  // --- Drawer Shell ---
  const drawer = document.createElement('aside');
  drawer.className = 'explore-drawer';
  drawer.setAttribute('aria-label', 'Panel Eksplorasi Palembang');
  drawer.dataset.open = 'false';

  const head = document.createElement('div');
  head.className = 'drawer-head';
  head.innerHTML = `<span class="drawer-title">Eksplorasi Palembang</span>`;
  const closeBtn = document.createElement('button');
  closeBtn.type = 'button';
  closeBtn.className = 'drawer-close';
  closeBtn.textContent = 'Tutup';
  closeBtn.addEventListener('click', () => setOpen(false));
  head.appendChild(closeBtn);

  const tabBar = document.createElement('div');
  tabBar.className = 'drawer-tabs';
  tabBar.setAttribute('role', 'tablist');

  const tabDefs = [
    { id: 'ride', label: 'Naik & Tur' },
    { id: 'explore', label: 'Jelajah' },
    { id: 'gis', label: 'Cuaca & GIS' },
  ];
  const tabBtns = new Map();
  const tabPanels = new Map();

  for (const t of tabDefs) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'drawer-tab';
    btn.role = 'tab';
    btn.textContent = t.label;
    btn.dataset.drawerTab = t.id;
    btn.addEventListener('click', () => setTab(t.id));
    tabBar.appendChild(btn);
    tabBtns.set(t.id, btn);
  }

  const body = document.createElement('div');
  body.className = 'drawer-body';

  // === TAB 1: Naik & Tur ===
  const ridePanel = document.createElement('div');
  ridePanel.className = 'drawer-panel';

  const rideSectionTitle = document.createElement('p');
  rideSectionTitle.className = 'drawer-section-label';
  rideSectionTitle.textContent = 'Mode Naik (Ride-Along 1-Klik)';
  ridePanel.appendChild(rideSectionTitle);

  const modeActionBtns = new Map();
  function makeActionCard({ modeId, icon, title, desc, onClick }) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'action-card';
    btn.dataset.actionMode = modeId;
    btn.innerHTML = `
      <span class="action-icon" aria-hidden="true">${icon}</span>
      <span class="action-copy">
        <strong>${title}</strong>
        <small>${desc}</small>
      </span>
      <span class="action-pill">Mulai</span>
    `;
    btn.addEventListener('click', onClick);
    modeActionBtns.set(modeId, btn);
    return btn;
  }

  const rideStack = document.createElement('div');
  rideStack.className = 'action-stack';
  rideStack.append(
    makeActionCard({
      modeId: 'ride-lrt',
      icon: '🚆',
      title: 'Naik LRT Sumsel',
      desc: 'Ikuti kereta 3-gerbong di viaduk layang (~65 km/j)',
      onClick: () => {
        if (cameraModes.getState().mode === 'ride-lrt') cameraModes.stopAll();
        else cameraModes.startRide('lrt');
      },
    }),
    makeActionCard({
      modeId: 'ride-boat',
      icon: '🚤',
      title: 'Naik Perahu Ketek',
      desc: 'Susuri Sungai Musi melintasi Ampera & BKB',
      onClick: () => {
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
      title: 'Ikut Tongkang Batu Bara',
      desc: 'Konvoi kapal tunda & tongkang di alur utama Musi',
      onClick: () => {
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
  tourSectionTitle.textContent = 'Tur Otomatis & Drone Bebas';
  ridePanel.appendChild(tourSectionTitle);

  const tourStack = document.createElement('div');
  tourStack.className = 'action-stack';
  tourStack.append(
    makeActionCard({
      modeId: 'tour',
      icon: '🎬',
      title: 'Tur Sinematik Palembang',
      desc: 'Terbang otomatis keliling 10 landmark + narasi',
      onClick: () => {
        if (cameraModes.getState().mode === 'tour') cameraModes.stopAll();
        else cameraModes.startTour(1);
      },
    }),
    makeActionCard({
      modeId: 'drone',
      icon: '🛸',
      title: 'Free Drone (WASD / Panah)',
      desc: 'Terbang bebas · Q/E atur tinggi · Shift cepat',
      onClick: () => {
        if (cameraModes.getState().mode === 'drone') cameraModes.stopAll();
        else cameraModes.startDrone();
      },
    })
  );
  ridePanel.appendChild(tourStack);

  const layerTitle = document.createElement('p');
  layerTitle.className = 'drawer-section-label';
  layerTitle.textContent = 'Lapisan Visual 3D';
  ridePanel.appendChild(layerTitle);

  const layerRow = document.createElement('div');
  layerRow.className = 'layer-toggle-row';

  const bldgToggle = document.createElement('button');
  bldgToggle.type = 'button';
  bldgToggle.className = 'toggle-btn active';
  bldgToggle.textContent = 'Gedung 3D';
  bldgToggle.dataset.buildingsBtn = 'true';
  bldgToggle.setAttribute('aria-pressed', 'true');
  bldgToggle.addEventListener('click', () => {
    const next = onToggleBuildings();
    bldgToggle.classList.toggle('active', next);
    bldgToggle.setAttribute('aria-pressed', String(next));
  });

  const animToggle = document.createElement('button');
  animToggle.type = 'button';
  animToggle.className = 'toggle-btn active';
  animToggle.textContent = 'Animasi';
  animToggle.dataset.trafficBtn = 'true';
  animToggle.setAttribute('aria-pressed', 'true');
  animToggle.addEventListener('click', () => {
    const next = onToggleTraffic();
    animToggle.classList.toggle('active', next);
    animToggle.setAttribute('aria-pressed', String(next));
  });

  const labelToggle = document.createElement('button');
  labelToggle.type = 'button';
  labelToggle.className = 'toggle-btn active';
  labelToggle.textContent = 'Label 3D';
  labelToggle.dataset.labelsBtn = 'true';
  labelToggle.setAttribute('aria-pressed', 'true');
  labelToggle.addEventListener('click', () => {
    const next = onToggleLabels();
    labelToggle.classList.toggle('active', next);
    labelToggle.setAttribute('aria-pressed', String(next));
  });

  layerRow.append(bldgToggle, animToggle, labelToggle);
  ridePanel.appendChild(layerRow);
  tabPanels.set('ride', ridePanel);

  // === TAB 2: Jelajah (Phase 2: Passport X/20 + Category Filter + Search + Culinary/LRT POIs + Audio) ===
  const explorePanel = document.createElement('div');
  explorePanel.className = 'drawer-panel';

  // Passport Penjelajah Card
  const passportCard = document.createElement('div');
  passportCard.className = 'passport-card';
  passportCard.innerHTML = `
    <div class="passport-top">
      <div>
        <span class="passport-eyebrow">Passport Penjelajah</span>
        <strong class="passport-rank" data-passport-rank>Wisatawan Baru</strong>
      </div>
      <div class="passport-right">
        <span class="passport-count" data-passport-count>0/20</span>
        <button type="button" class="passport-reset" data-passport-reset title="Ulangi progress">Reset</button>
      </div>
    </div>
    <div class="passport-bar"><div class="passport-fill" data-passport-fill style="width: 0%"></div></div>
  `;
  const passportRankEl = passportCard.querySelector('[data-passport-rank]');
  const passportCountEl = passportCard.querySelector('[data-passport-count]');
  const passportFillEl = passportCard.querySelector('[data-passport-fill]');
  passportCard.querySelector('[data-passport-reset]').addEventListener('click', () => {
    passport.reset();
    syncPassport();
  });

  // Category Filter Pills
  const catRow = document.createElement('div');
  catRow.className = 'cat-filter-row';
  const catBtns = new Map();
  for (const cat of POI_CATEGORIES) {
    const count = cat.id === 'all' ? PALEMBANG_POIS.length : PALEMBANG_POIS.filter((p) => p.category === cat.id).length;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'cat-pill';
    btn.dataset.catFilter = cat.id;
    btn.textContent = `${cat.label} (${count})`;
    btn.addEventListener('click', () => {
      setCategory(cat.id);
    });
    catRow.appendChild(btn);
    catBtns.set(cat.id, btn);
  }

  // Search Box
  const searchInput = document.createElement('input');
  searchInput.type = 'search';
  searchInput.className = 'drawer-search';
  searchInput.placeholder = 'Cari pempek, pindang, stasiun, landmark...';
  searchInput.setAttribute('aria-label', 'Cari lokasi dan kuliner Palembang');
  searchInput.dataset.poiSearch = 'true';

  const poiList = document.createElement('div');
  poiList.className = 'poi-list';

  function renderPoiList() {
    const q = searchQuery.trim().toLowerCase();
    poiList.innerHTML = '';
    const items = PALEMBANG_POIS.filter((p) => {
      if (activeCategory !== 'all' && p.category !== activeCategory) return false;
      if (!q) return true;
      return (
        p.label.toLowerCase().includes(q) ||
        p.title.toLowerCase().includes(q) ||
        p.signature.toLowerCase().includes(q) ||
        p.zone.toLowerCase().includes(q)
      );
    });

    for (const p of items) {
      const visited = passport.isVisited(p.id);
      const badge = CAT_BADGE[p.category] || CAT_BADGE.landmark;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `poi-item cat-${p.category}${visited ? ' visited' : ''}`;
      btn.dataset.poiCard = p.id;
      btn.innerHTML = `
        <div class="poi-item-head">
          <strong>${badge.icon} ${p.label}</strong>
          <span class="poi-check">${visited ? '✓ Dikunjungi' : badge.label}</span>
        </div>
        <small class="poi-sig">${p.signature}</small>
      `;
      btn.addEventListener('click', () => {
        cameraModes.stopAll();
        onSelectPoi(p);
      });
      poiList.appendChild(btn);
    }

    if (items.length === 0) {
      poiList.innerHTML = `<p class="drawer-empty">Tidak ada lokasi atau kuliner yang cocok.</p>`;
    }
  }

  searchInput.addEventListener('input', () => {
    searchQuery = searchInput.value;
    renderPoiList();
  });

  // Procedural Web Audio Ambience Control Strip
  const audioCard = document.createElement('div');
  audioCard.className = 'audio-card';
  audioCard.innerHTML = `
    <div class="audio-head">
      <div class="audio-copy">
        <strong>Ambience Sungai Musi</strong>
        <small data-audio-status>Nonaktif · Air sungai & klakson kapal</small>
      </div>
      <button type="button" class="toggle-btn audio-btn" data-drawer-audio-btn>Putar</button>
    </div>
    <div class="audio-vol-row">
      <span>Vol</span>
      <input type="range" min="0" max="100" value="55" data-audio-volume aria-label="Volume suara ambience" />
      <button type="button" class="horn-btn" data-horn-btn title="Bunyikan klakson kapal Sungai Musi">Klakson</button>
    </div>
  `;
  const audioStatusEl = audioCard.querySelector('[data-audio-status]');
  const drawerAudioBtn = audioCard.querySelector('[data-drawer-audio-btn]');
  const audioVolSlider = audioCard.querySelector('[data-audio-volume]');
  const hornBtn = audioCard.querySelector('[data-horn-btn]');

  drawerAudioBtn.addEventListener('click', () => onToggleAudio());
  audioVolSlider.addEventListener('input', () => {
    ambience.setVolume(Number(audioVolSlider.value) / 100);
  });
  hornBtn.addEventListener('click', () => {
    if (!ambience.isEnabled()) onToggleAudio();
    ambience.playBoatHorn(false);
  });

  explorePanel.append(passportCard, catRow, searchInput, poiList, audioCard);
  tabPanels.set('explore', explorePanel);

  // === TAB 3: Cuaca & GIS (Phase 3: Live Open-Meteo Weather + 3D Rain + Musi Tide + GIS Measure) ===
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
      <input type="range" class="tide-slider" min="0" max="3.5" step="0.1" value="0" data-tide-slider aria-label="Simulasi kenaikan muka air Sungai Musi" />
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
    weatherSyncBtn.textContent = 'Memuat...';
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

  tideSlider.addEventListener('input', () => {
    weatherGis.setTideMeters(Number(tideSlider.value));
  });
  tideResetBtn.addEventListener('click', () => {
    tideSlider.value = '0';
    weatherGis.setTideMeters(0);
  });

  measureToggleBtn.addEventListener('click', () => {
    const next = !weatherGis.getMeasureState().active;
    weatherGis.setMeasureActive(next);
  });
  measureClearBtn.addEventListener('click', () => {
    weatherGis.clearMeasurePoints();
  });

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

  tabPanels.set('gis', gisPanel);

  body.append(ridePanel, explorePanel, gisPanel);
  drawer.append(head, tabBar, body);

  // --- Floating Active Experience Banner ---
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

  // Subtle Passport Stamp Toast (bottom-left above hint)
  const toast = document.createElement('div');
  toast.className = 'passport-toast hidden';
  toast.setAttribute('aria-live', 'polite');
  let toastTimer = null;

  function showToast(text) {
    clearTimeout(toastTimer);
    toast.textContent = text;
    toast.classList.remove('hidden');
    toastTimer = setTimeout(() => toast.classList.add('hidden'), 2800);
  }

  function bindHold(btn, downPatch, upPatch) {
    const start = (e) => {
      e.preventDefault();
      cameraModes.setVirtualDroneInput(downPatch);
    };
    const end = () => cameraModes.setVirtualDroneInput(upPatch);
    btn.addEventListener('pointerdown', start);
    btn.addEventListener('pointerup', end);
    btn.addEventListener('pointerleave', end);
    btn.addEventListener('pointercancel', end);
  }

  function syncModeBanner(state) {
    for (const [id, btn] of modeActionBtns) {
      const active = state.mode === id;
      btn.classList.toggle('active', active);
      const pill = btn.querySelector('.action-pill');
      if (pill) pill.textContent = active ? 'Aktif' : 'Mulai';
    }

    if (state.mode === 'free') {
      banner.classList.add('hidden');
      return;
    }

    banner.classList.remove('hidden');
    bannerTitle.textContent = state.label;
    bannerDetail.textContent = state.detail;
    bannerActions.innerHTML = '';

    if (state.mode === 'tour') {
      const pauseBtn = document.createElement('button');
      pauseBtn.type = 'button';
      pauseBtn.className = 'banner-btn';
      pauseBtn.textContent = state.tourPaused ? 'Lanjut' : 'Jeda';
      pauseBtn.dataset.tourPauseBtn = 'true';
      pauseBtn.addEventListener('click', () => cameraModes.toggleTourPause());

      const nextBtn = document.createElement('button');
      nextBtn.type = 'button';
      nextBtn.className = 'banner-btn';
      nextBtn.textContent = 'Berikutnya';
      nextBtn.dataset.tourNextBtn = 'true';
      nextBtn.addEventListener('click', () => cameraModes.nextTourStop());

      bannerActions.append(pauseBtn, nextBtn);
    } else if (state.mode === 'drone') {
      const pad = document.createElement('div');
      pad.className = 'drone-pad';
      const btns = [
        ['↑', { forward: 1 }, { forward: 0 }, 'Maju (W)'],
        ['↓', { forward: -1 }, { forward: 0 }, 'Mundur (S)'],
        ['←', { right: -1 }, { right: 0 }, 'Kiri (A)'],
        ['→', { right: 1 }, { right: 0 }, 'Kanan (D)'],
        ['+', { up: -1 }, { up: 0 }, 'Turun (Q)'],
        ['−', { up: 1 }, { up: 0 }, 'Naik (E)'],
      ];
      for (const [txt, dn, up, title] of btns) {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'banner-btn drone-key';
        b.textContent = txt;
        b.title = title;
        bindHold(b, dn, up);
        pad.appendChild(b);
      }
      bannerActions.appendChild(pad);
    }

    const stopBtn = document.createElement('button');
    stopBtn.type = 'button';
    stopBtn.className = 'banner-btn banner-stop';
    stopBtn.textContent = 'Berhenti';
    stopBtn.dataset.stopModeBtn = 'true';
    stopBtn.addEventListener('click', () => cameraModes.stopAll());
    bannerActions.appendChild(stopBtn);
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
    drawerAudioBtn.textContent = isOn ? 'Aktif' : 'Putar';
    audioStatusEl.textContent = isOn
      ? 'Aktif · Riak Sungai Musi & kapal'
      : 'Nonaktif · Air sungai & klakson kapal';
  }

  function setTab(tabId) {
    activeTab = tabId;
    for (const [id, btn] of tabBtns) {
      const on = id === activeTab;
      btn.classList.toggle('active', on);
      btn.setAttribute('aria-selected', String(on));
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
    animToggle.setAttribute('aria-pressed', String(isOn));
  }

  setTab('ride');
  setCategory('all', false);
  syncPassport();
  syncAudio(false);

  return {
    drawerEl: drawer,
    bannerEl: banner,
    toastEl: toast,
    setOpen,
    isOpen: () => isOpen,
    setTab,
    setCategory,
    syncModeBanner,
    syncTrafficToggle,
    syncPassport,
    syncAudio,
    syncWeather,
    syncTide,
    syncMeasure,
    showToast,
  };
}
