// Collapsible left Exploration Drawer + Active Experience Banner for Real Satellite 3D
import { REAL_PRESETS } from './realLandmarks.js';

export function createExploreDrawer({
  cameraModes,
  onSelectPreset,
  onToggleBuildings,
  onToggleTraffic,
  onToggleLabels,
  onSelectLighting,
  onDrawerToggle,
}) {
  let isOpen = false;
  let activeTab = 'ride'; // 'ride' | 'explore' | 'gis'
  let searchQuery = '';

  // --- Drawer Shell ---
  const drawer = document.createElement('aside');
  drawer.className = 'explore-drawer';
  drawer.setAttribute('aria-label', 'Panel Eksplorasi Palembang');
  drawer.dataset.open = 'false';

  // Header + Tabs
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

  // === TAB 1: Naik & Tur (Phase 1 Core) ===
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
        else cameraModes.startRide('boat');
      },
    }),
    makeActionCard({
      modeId: 'ride-barge',
      icon: '🚢',
      title: 'Ikut Tongkang Batu Bara',
      desc: 'Konvoi kapal tunda & tongkang di alur utama Musi',
      onClick: () => {
        if (cameraModes.getState().mode === 'ride-barge') cameraModes.stopAll();
        else cameraModes.startRide('barge');
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

  // Layer toggles (moved cleanly from crowded top-bar into drawer!)
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

  // === TAB 2: Jelajah (Search + 10 Curated Landmarks, ready for Phase 2 Culinary/Passport/Audio) ===
  const explorePanel = document.createElement('div');
  explorePanel.className = 'drawer-panel';

  const searchInput = document.createElement('input');
  searchInput.type = 'search';
  searchInput.className = 'drawer-search';
  searchInput.placeholder = 'Cari landmark Palembang...';
  searchInput.setAttribute('aria-label', 'Cari landmark Palembang');

  const poiList = document.createElement('div');
  poiList.className = 'poi-list';

  function renderPoiList() {
    const q = searchQuery.trim().toLowerCase();
    poiList.innerHTML = '';
    const items = REAL_PRESETS.filter(
      (p) => !q || p.label.toLowerCase().includes(q) || p.title.toLowerCase().includes(q) || p.zone.toLowerCase().includes(q)
    );
    for (const p of items) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'poi-item';
      btn.innerHTML = `
        <strong>${p.label}</strong>
        <small>${p.zone}</small>
      `;
      btn.addEventListener('click', () => {
        cameraModes.stopAll();
        onSelectPreset(p.id);
      });
      poiList.appendChild(btn);
    }
    if (items.length === 0) {
      poiList.innerHTML = `<p class="drawer-empty">Tidak ada lokasi cocok.</p>`;
    }
  }
  searchInput.addEventListener('input', () => {
    searchQuery = searchInput.value;
    renderPoiList();
  });
  renderPoiList();

  const phase2Hint = document.createElement('p');
  phase2Hint.className = 'drawer-roadmap-note';
  phase2Hint.textContent = 'Fase 2 berikutnya: filter Kuliner Pempek & Stasiun LRT, Passport Penjelajah, dan audio ambience Sungai Musi.';

  explorePanel.append(searchInput, poiList, phase2Hint);
  tabPanels.set('explore', explorePanel);

  // === TAB 3: Cuaca & GIS (Quick lighting + Phase 3 preview) ===
  const gisPanel = document.createElement('div');
  gisPanel.className = 'drawer-panel';
  gisPanel.innerHTML = `
    <p class="drawer-section-label">Suasana Cepat</p>
    <div class="layer-toggle-row" data-gis-lighting>
      <button type="button" class="toggle-btn" data-quick-light="siang">Siang</button>
      <button type="button" class="toggle-btn" data-quick-light="senja">Senja</button>
      <button type="button" class="toggle-btn" data-quick-light="malam">Malam</button>
    </div>
    <p class="drawer-section-label">Segera Hadir (Fase 3 · Zero API Key)</p>
    <div class="roadmap-list">
      <div class="roadmap-item"><strong>Cuaca Live Palembang & Hujan 3D</strong><small>Data Open-Meteo real-time + partikel hujan tropis</small></div>
      <div class="roadmap-item"><strong>Simulasi Pasang Sungai Musi</strong><small>Slider elevasi genangan 0 – 3,5 meter</small></div>
      <div class="roadmap-item"><strong>Alat Ukur Jarak 2 Titik</strong><small>Hitung jarak nyata & estimasi waktu tempuh</small></div>
    </div>
  `;
  for (const btn of gisPanel.querySelectorAll('[data-quick-light]')) {
    btn.addEventListener('click', () => onSelectLighting(btn.dataset.quickLight));
  }
  tabPanels.set('gis', gisPanel);

  body.append(ridePanel, explorePanel, gisPanel);
  drawer.append(head, tabBar, body);

  // --- Floating Active Experience Banner (Top-Center when Ride-Along / Tour / Drone is active) ---
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

  return {
    drawerEl: drawer,
    bannerEl: banner,
    setOpen,
    isOpen: () => isOpen,
    setTab,
    syncModeBanner,
    syncTrafficToggle,
  };
}
