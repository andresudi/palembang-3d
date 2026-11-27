import * as THREE from 'three';
import { CAMERA_PRESETS, SCENE_PINS } from './landmarks.js';

export function createHud({
  rootEl,
  camera,
  onSelectPreset,
  onSelectLighting,
  onToggleLabels,
  onSwitchMode,
}) {
  let activePreset = 'overview';
  let activeLighting = 'siang';
  let labelsVisible = true;
  let infoExpanded = false;

  // Build clean Songket-slate HUD DOM
  const hud = document.createElement('div');
  hud.className = 'hud-layer';

  // Top bar: identity on left, lighting & label toggle on right
  const topBar = document.createElement('header');
  topBar.className = 'hud-top';

  const brand = document.createElement('div');
  brand.className = 'brand-pill';
  brand.innerHTML = `
    <span class="brand-mark" aria-hidden="true"></span>
    <div class="brand-text">
      <h1>Kota Palembang 3D</h1>
      <p>Diorama Sungai Musi · Skala terkompresi</p>
    </div>
  `;

  const topControls = document.createElement('div');
  topControls.className = 'top-controls';

  if (onSwitchMode) {
    const modeGroup = document.createElement('div');
    modeGroup.className = 'segmented-control';
    modeGroup.setAttribute('role', 'group');
    modeGroup.setAttribute('aria-label', 'Mode visualisasi');

    const satBtn = document.createElement('button');
    satBtn.type = 'button';
    satBtn.className = 'seg-btn';
    satBtn.textContent = 'Satelit 3D';
    satBtn.dataset.modeBtn = 'satellite';
    satBtn.addEventListener('click', () => onSwitchMode('satellite'));

    const dioBtn = document.createElement('button');
    dioBtn.type = 'button';
    dioBtn.className = 'seg-btn active';
    dioBtn.textContent = 'Diorama';
    dioBtn.dataset.modeBtn = 'diorama';

    modeGroup.append(satBtn, dioBtn);
    topControls.appendChild(modeGroup);
  }

  const lightingGroup = document.createElement('div');
  lightingGroup.className = 'segmented-control';
  lightingGroup.setAttribute('role', 'group');
  lightingGroup.setAttribute('aria-label', 'Suasana pencahayaan');

  const lightingModes = [
    { id: 'siang', label: 'Siang' },
    { id: 'senja', label: 'Senja' },
    { id: 'malam', label: 'Malam' },
  ];

  const lightingBtns = new Map();
  for (const mode of lightingModes) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'seg-btn';
    btn.textContent = mode.label;
    btn.dataset.lightingBtn = mode.id;
    btn.addEventListener('click', () => onSelectLighting(mode.id));
    lightingGroup.appendChild(btn);
    lightingBtns.set(mode.id, btn);
  }

  const labelBtn = document.createElement('button');
  labelBtn.type = 'button';
  labelBtn.className = 'toggle-btn active';
  labelBtn.textContent = 'Label 3D';
  labelBtn.dataset.labelsBtn = 'true';
  labelBtn.setAttribute('aria-pressed', 'true');
  labelBtn.addEventListener('click', () => onToggleLabels());

  topControls.appendChild(lightingGroup);
  topControls.appendChild(labelBtn);
  topBar.appendChild(brand);
  topBar.appendChild(topControls);

  // Compact Info Card (top-right under controls, collapsible)
  const infoCard = document.createElement('aside');
  infoCard.className = 'info-card';
  infoCard.setAttribute('aria-live', 'polite');

  const infoHeader = document.createElement('div');
  infoHeader.className = 'info-header';
  const infoZone = document.createElement('span');
  infoZone.className = 'info-zone';
  const infoToggle = document.createElement('button');
  infoToggle.type = 'button';
  infoToggle.className = 'info-collapse';
  infoToggle.textContent = 'Tutup';
  infoToggle.addEventListener('click', () => {
    infoExpanded = !infoExpanded;
    infoCard.classList.toggle('collapsed', !infoExpanded);
    infoToggle.textContent = infoExpanded ? 'Tutup' : 'Info';
  });
  infoHeader.appendChild(infoZone);
  infoHeader.appendChild(infoToggle);

  const infoTitle = document.createElement('h2');
  infoTitle.className = 'info-title';
  const infoBody = document.createElement('p');
  infoBody.className = 'info-summary';
  const infoNote = document.createElement('p');
  infoNote.className = 'info-note';

  infoCard.appendChild(infoHeader);
  infoCard.appendChild(infoTitle);
  infoCard.appendChild(infoBody);
  infoCard.appendChild(infoNote);

  // Bottom horizontal camera preset rail
  const presetNav = document.createElement('nav');
  presetNav.className = 'preset-dock';
  presetNav.setAttribute('aria-label', 'Pilih fokus tengara');

  const presetBtns = new Map();
  for (const preset of CAMERA_PRESETS) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'preset-btn';
    btn.textContent = preset.label;
    btn.dataset.presetBtn = preset.id;
    btn.addEventListener('click', () => onSelectPreset(preset.id));
    presetNav.appendChild(btn);
    presetBtns.set(preset.id, btn);
  }

  // Subtle interaction hint
  const hint = document.createElement('div');
  hint.className = 'controls-hint';
  hint.textContent = 'Seret untuk putar · Gulir untuk perbesar · Klik kanan untuk geser';

  // 3D Floating Label Layer
  const labelsLayer = document.createElement('div');
  labelsLayer.className = 'labels-layer';

  const pinElements = SCENE_PINS.map((pin) => {
    const el = document.createElement('button');
    el.type = 'button';
    el.className = 'scene-pin';
    el.textContent = pin.label;
    el.dataset.pinId = pin.id;
    const targetPreset = pin.presetId || pin.id;
    el.addEventListener('click', () => onSelectPreset(targetPreset));
    labelsLayer.appendChild(el);
    return {
      ...pin,
      el,
      worldPos: new THREE.Vector3(...pin.position),
    };
  });

  hud.appendChild(labelsLayer);
  hud.appendChild(topBar);
  hud.appendChild(infoCard);
  hud.appendChild(presetNav);
  hud.appendChild(hint);
  rootEl.appendChild(hud);

  const projVec = new THREE.Vector3();

  function syncState({ presetId, lightingMode, showLabels }) {
    if (presetId) {
      activePreset = presetId;
      rootEl.dataset.preset = activePreset;
      for (const [id, btn] of presetBtns) {
        btn.classList.toggle('active', id === activePreset);
        btn.setAttribute('aria-current', id === activePreset ? 'true' : 'false');
      }
      infoExpanded = activePreset !== "overview";
      infoCard.classList.toggle("collapsed", !infoExpanded);
      infoToggle.textContent = infoExpanded ? "Tutup" : "Info";
      const p = CAMERA_PRESETS.find((item) => item.id === activePreset) || CAMERA_PRESETS[0];
      infoZone.textContent = p.zone;
      infoTitle.textContent = p.title;
      infoBody.textContent = p.summary;
      infoNote.textContent = p.note;
    }

    if (lightingMode) {
      activeLighting = lightingMode;
      rootEl.dataset.lighting = activeLighting;
      for (const [id, btn] of lightingBtns) {
        btn.classList.toggle('active', id === activeLighting);
        btn.setAttribute('aria-pressed', id === activeLighting ? 'true' : 'false');
      }
    }

    if (typeof showLabels === 'boolean') {
      labelsVisible = showLabels;
      rootEl.dataset.labels = String(labelsVisible);
      labelsLayer.classList.toggle('hidden', !labelsVisible);
      labelBtn.classList.toggle('active', labelsVisible);
      labelBtn.setAttribute('aria-pressed', String(labelsVisible));
    }
  }

  function updatePins(width, height) {
    if (!labelsVisible) return;
    // Keep Overview uncluttered by showing primary landmark pins; show all pins belonging to focused preset
    const overviewPinIds = new Set([
      'ampera',
      'masjid-lrt',
      'pasar-16',
      'kuto-besak',
      'walikota-kambang',
      'kampung-kapitan',
      'jakabaring',
      'musi-iv',
      'pulau-kemaro',
    ]);
    for (const pin of pinElements) {
      const targetPreset = pin.presetId || pin.id;
      const matchesFocus =
        activePreset === 'overview'
          ? overviewPinIds.has(pin.id)
          : targetPreset === activePreset || (activePreset === 'ampera' && pin.id === 'lrt');
      if (!matchesFocus) {
        pin.el.style.opacity = '0';
        pin.el.style.pointerEvents = 'none';
        continue;
      }
      projVec.copy(pin.worldPos).project(camera);
      const visible = projVec.z > -1 && projVec.z < 1;
      if (!visible) {
        pin.el.style.opacity = '0';
        pin.el.style.pointerEvents = 'none';
        continue;
      }
      const x = (projVec.x * 0.5 + 0.5) * width;
      const y = (-projVec.y * 0.5 + 0.5) * height;
      const onScreen = x > 44 && x < width - 44 && y > 68 && y < height - 76;
      pin.el.style.opacity = onScreen ? '1' : '0';
      pin.el.style.pointerEvents = onScreen ? 'auto' : 'none';
      pin.el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) translate(-50%, -100%)`;
    }
  }

  syncState({ presetId: activePreset, lightingMode: activeLighting, showLabels: labelsVisible });

  return {
    syncState,
    updatePins,
    getState: () => ({ activePreset, activeLighting, labelsVisible }),
  };
}
