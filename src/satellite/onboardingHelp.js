// v2.5 1-Time Welcome Onboarding Card + Keyboard & Controls Shortcut Help Modal (Bilingual ID / EN)
const ONBOARD_KEY = 'palembang_3d_onboarded_v1';

export function createOnboardingAndHelp({
  i18n,
  hasDeepLink,
  onStartTour,
  onStartBoat,
}) {
  let helpOpen = false;
  let onboardingOpen = false;

  // --- 1. One-Time Welcome Onboarding Overlay ---
  const onboardBackdrop = document.createElement('div');
  onboardBackdrop.className = 'modal-backdrop hidden';
  onboardBackdrop.dataset.onboardingModal = 'true';

  const onboardCard = document.createElement('div');
  onboardCard.className = 'welcome-card';
  onboardCard.setAttribute('role', 'dialog');
  onboardCard.setAttribute('aria-modal', 'true');
  onboardBackdrop.appendChild(onboardCard);

  function markOnboarded() {
    onboardingOpen = false;
    onboardBackdrop.classList.add('hidden');
    try {
      window.localStorage?.setItem(ONBOARD_KEY, '1');
    } catch {}
  }

  function renderOnboarding() {
    const en = i18n.getLang() === 'en';
    onboardCard.innerHTML = `
      <span class="welcome-eyebrow">${en ? '1:1 REAL SATELLITE 3D · PALEMBANG' : 'SATELIT 3D SKALA 1:1 · PALEMBANG'}</span>
      <h2>${en ? 'Welcome to Explore Palembang 3D' : 'Selamat Datang di Explore Palembang 3D'}</h2>
      <p>${
        en
          ? 'Explore Palembang with live traffic, South Sumatra LRT, Musi River boats, 20 landmark & culinary POIs, live weather, festivals, and a playable boat quest.'
          : 'Jelajahi Palembang lengkap dengan lalu lintas aktif, LRT Sumsel, perahu Sungai Musi, 20 landmark & kuliner, cuaca live, festival 3D, hingga mini-game setir perahu.'
      }</p>
      <div class="welcome-tips">
        <span>🖱️ ${en ? 'Drag to pan · Right-drag to tilt 3D' : 'Seret geser · Klik kanan miringkan 3D'}</span>
        <span>🧭 ${en ? 'Open "Explore" for Rides, Festivals & GIS' : 'Buka "Eksplorasi" untuk Naik LRT, Festival & GIS'}</span>
      </div>
      <div class="welcome-actions">
        <button type="button" class="welcome-btn primary" data-onboard-start>${en ? 'Start Exploring' : 'Mulai Jelajah'}</button>
        <button type="button" class="welcome-btn" data-onboard-tour>🎬 ${en ? 'Auto Tour' : 'Tur Sinematik'}</button>
        <button type="button" class="welcome-btn" data-onboard-boat>⛵ ${en ? 'Steer Boat' : 'Setir Perahu'}</button>
      </div>
    `;
    onboardCard.querySelector('[data-onboard-start]').addEventListener('click', () => markOnboarded());
    onboardCard.querySelector('[data-onboard-tour]').addEventListener('click', () => {
      markOnboarded();
      onStartTour();
    });
    onboardCard.querySelector('[data-onboard-boat]').addEventListener('click', () => {
      markOnboarded();
      onStartBoat();
    });
  }

  onboardBackdrop.addEventListener('click', (e) => {
    if (e.target === onboardBackdrop) markOnboarded();
  });

  // Auto-show once on first visit unless opened from a shared deep-link or ?noonboarding=1
  const params = new URLSearchParams(window.location.search);
  let alreadySeen = false;
  try {
    alreadySeen = window.localStorage?.getItem(ONBOARD_KEY) === '1';
  } catch {}
  if (!alreadySeen && !hasDeepLink && params.get('noonboarding') !== '1') {
    onboardingOpen = true;
    renderOnboarding();
    onboardBackdrop.classList.remove('hidden');
  }

  // --- 2. Keyboard & Controls Shortcut Help Modal (?) ---
  const helpBackdrop = document.createElement('div');
  helpBackdrop.className = 'modal-backdrop hidden';
  helpBackdrop.dataset.helpModal = 'true';

  const helpCard = document.createElement('div');
  helpCard.className = 'help-card';
  helpCard.setAttribute('role', 'dialog');
  helpCard.setAttribute('aria-modal', 'true');
  helpBackdrop.appendChild(helpCard);

  function renderHelp() {
    const en = i18n.getLang() === 'en';
    const rows = en
      ? [
          ['Left Drag / 1-Finger', 'Pan map across Palembang'],
          ['Right Drag / 2-Finger', 'Rotate & tilt 3D camera'],
          ['Scroll / Pinch', 'Zoom in & out'],
          ['W A S D / Arrows', 'Fly Free Drone or steer Perahu Ketek'],
          ['Q / E (or Space)', 'Descend / Ascend Free Drone'],
          ['Shift', 'Drone turbo speed boost (2.2×)'],
          ['Esc', 'Exit Drone, Ride-Along, Boat, or Photo Mode'],
        ]
      : [
          ['Seret Kiri / 1 Jari', 'Geser peta koridor Palembang'],
          ['Seret Kanan / 2 Jari', 'Putar & miringkan kamera 3D'],
          ['Gulir / Cubit', 'Perbesar & perkecil tampilan'],
          ['W A S D / Panah', 'Terbang Free Drone atau setir Perahu Ketek'],
          ['Q / E (atau Spasi)', 'Turunkan / naikkan ketinggian Drone'],
          ['Shift', 'Kecepatan turbo Drone (2,2×)'],
          ['Esc', 'Keluar dari mode Drone, Naik, Perahu, atau Foto'],
        ];

    helpCard.innerHTML = `
      <div class="help-head">
        <h3>${en ? 'Controls & Keyboard Shortcuts' : 'Panduan Kontrol & Shortcut Keyboard'}</h3>
        <button type="button" class="drawer-close" data-help-close>${en ? 'Close' : 'Tutup'}</button>
      </div>
      <div class="shortcut-list">
        ${rows.map(([k, desc]) => `<div class="shortcut-row"><kbd>${k}</kbd><span>${desc}</span></div>`).join('')}
      </div>
      <div class="help-foot">
        <button type="button" class="mini-chip" data-reopen-welcome>${en ? 'Show Welcome Guide' : 'Tampilkan Panduan Awal'}</button>
      </div>
    `;
    helpCard.querySelector('[data-help-close]').addEventListener('click', () => setHelpOpen(false));
    helpCard.querySelector('[data-reopen-welcome]').addEventListener('click', () => {
      setHelpOpen(false);
      onboardingOpen = true;
      renderOnboarding();
      onboardBackdrop.classList.remove('hidden');
    });
  }

  helpBackdrop.addEventListener('click', (e) => {
    if (e.target === helpBackdrop) setHelpOpen(false);
  });

  function setHelpOpen(flag) {
    helpOpen = Boolean(flag);
    if (helpOpen) renderHelp();
    helpBackdrop.classList.toggle('hidden', !helpOpen);
  }

  function onKeyDown(e) {
    if (e.code === 'Escape') {
      if (helpOpen) setHelpOpen(false);
      else if (onboardingOpen) markOnboarded();
    }
  }
  window.addEventListener('keydown', onKeyDown);

  return {
    onboardEl: onboardBackdrop,
    helpEl: helpBackdrop,
    setHelpOpen,
    isHelpOpen: () => helpOpen,
    isOnboardingOpen: () => onboardingOpen,
    dismissOnboarding: markOnboarded,
    applyLanguage() {
      if (onboardingOpen) renderOnboarding();
      if (helpOpen) renderHelp();
    },
    cleanup() {
      window.removeEventListener('keydown', onKeyDown);
    },
  };
}
