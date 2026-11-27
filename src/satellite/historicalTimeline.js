// v3.0 5-Era Historical Timeline of Palembang (683 M Sriwijaya -> 2018+ Modern LRT)
// Flies to each era's flagship landmark, applies subtle archival sepia tone on older eras,
// syncs the Info Card + Wikimedia photo, and hooks cleanly into Web Speech Audio Guide.

export const HISTORICAL_ERAS = [
  {
    id: 'era-sriwijaya',
    year: '683 M',
    shortId: 'Sriwijaya',
    shortEn: 'Srivijaya',
    titleId: 'Kemaharajaan Maritim Sriwijaya (Abad VII–XIII)',
    titleEn: 'Srivijaya Maritime Empire (7th–13th Century)',
    zoneId: '683 M · Prasasti Kedukan Bukit & Sungai Musi',
    zoneEn: '683 CE · Kedukan Bukit Inscription & Musi River',
    summaryId:
      'Prasasti Kedukan Bukit (682/683 M) di tepian anak Sungai Musi menandai lahirnya Sriwijaya — kerajaan maritim agung Nusantara yang mengendalikan jalur pelayaran Selat Malaka serta menjadi pusat pembelajaran ilmu pengetahuan Asia Tenggara.',
    summaryEn:
      'The Kedukan Bukit inscription (682/683 CE) along the Musi River basin marks the rise of Srivijaya — a great maritime empire controlling Strait of Malacca trade routes and serving as a premier center of Buddhist scholarship in Southeast Asia.',
    noteId: 'Sungai Musi sejak lebih dari 1.300 tahun lalu sudah menjadi urat nadi pelayaran samudra Palembang.',
    noteEn: 'For over 1,300 years, the Musi River has served as Palembang’s maritime lifeline.',
    center: [104.7600, -2.9922],
    zoom: 16.2,
    pitch: 62,
    bearing: 36,
    filterCss: 'sepia(0.68) contrast(1.06) brightness(0.92)',
  },
  {
    id: 'era-kesultanan',
    year: '1780',
    shortId: 'Kesultanan',
    shortEn: 'Sultanate',
    titleId: 'Kesultanan Palembang Darussalam (1659–1823)',
    titleEn: 'Palembang Darussalam Sultanate (1659–1823)',
    zoneId: '1780 · Benteng Kuto Besak & Masjid Agung SMB I',
    zoneEn: '1780 · Kuto Besak Fort & SMB I Great Mosque',
    summaryId:
      'Di bawah Sultan Mahmud Badaruddin I dan II, Palembang membangun keraton batu Benteng Kuto Besak (1780–1797) menghadap Sungai Musi, Masjid Agung berarsitektur tumpang Nusantara, serta melahirkan kejayaan tenun Songket dan Rumah Limas.',
    summaryEn:
      'Under Sultans Mahmud Badaruddin I & II, Palembang built the riverside stone fortress of Kuto Besak (1780–1797) and the tiered-roof Great Mosque, ushering in the golden age of Songket weaving and traditional Rumah Limas architecture.',
    noteId: 'Perhatikan gerbang Lawang Kuto dan Rumah Limas yang menghadap langsung ke belokan Sungai Musi.',
    noteEn: 'Observe the Lawang Kuto gateway and Rumah Limas facing the bend of the Musi River.',
    center: [104.7599, -2.9918],
    zoom: 16.9,
    pitch: 60,
    bearing: -18,
    filterCss: 'sepia(0.48) contrast(1.05) brightness(0.96)',
  },
  {
    id: 'era-kolonial',
    year: '1928',
    shortId: 'Kolonial',
    shortEn: 'Colonial',
    titleId: 'Kota Modern Awal & Gedung Ledeng (1928)',
    titleEn: 'Early Modern City & Gedung Ledeng (1928)',
    zoneId: '1928 · Watertoren Kantor Walikota & Talang Semut',
    zoneEn: '1928 · City Hall Water Tower & Talang Semut',
    summaryId:
      'Pada 1928 dibangun Menara Air (Gedung Ledeng) bergaya kolonial yang kini menjadi Kantor Walikota Palembang, diikuti penataan kawasan taman dan danau Kambang Iwak di Talang Semut serta perluasan perdagangan Pasar 16 Ilir.',
    summaryEn:
      'In 1928 the Dutch-colonial Water Tower (Gedung Ledeng) was completed — today Palembang City Hall — alongside the lakeside urban garden of Kambang Iwak in Talang Semut and the expansion of Pasar 16 Ilir.',
    noteId: 'Menara air setinggi ~36 m ini masih berdiri megah di jantung Jl. Merdeka.',
    noteEn: 'This ~36 m heritage water tower still anchors Palembang’s historic Merdeka corridor.',
    center: [104.7567, -2.9910],
    zoom: 16.8,
    pitch: 62,
    bearing: 16,
    filterCss: 'sepia(0.32) saturate(0.76) contrast(1.04)',
  },
  {
    id: 'era-ampera',
    year: '1965',
    shortId: 'Ampera',
    shortEn: 'Ampera',
    titleId: 'Peresmian Jembatan Ampera (30 Sept 1965)',
    titleEn: 'Inauguration of Ampera Bridge (Sept 30, 1965)',
    zoneId: '1965 · Amanat Penderitaan Rakyat · Sungai Musi',
    zoneEn: '1965 · Spanning Seberang Ilir & Seberang Ulu',
    summaryId:
      'Untuk pertama kalinya dalam sejarah, Jembatan Ampera menyatukan daratan Seberang Ilir dan Seberang Ulu secara permanen. Dulu bentang tengah 75 meternya dapat diangkat setinggi puluhan meter agar kapal laut besar bisa lewat di bawahnya.',
    summaryEn:
      'For the first time in history, Ampera Bridge permanently linked Seberang Ilir and Seberang Ulu. Its 75-meter central vertical-lift span originally rose high above the river to let ocean-going ships pass underneath.',
    noteId: 'Warna jembatan sempat berganti dari abu-abu, kuning, hingga akhirnya merah bata ikonik sejak 2002.',
    noteEn: 'The bridge changed from gray to yellow before adopting its iconic brick-red coat in 2002.',
    center: [104.7634, -2.9919],
    zoom: 16.9,
    pitch: 66,
    bearing: 52,
    filterCss: 'sepia(0.18) contrast(1.08)',
  },
  {
    id: 'era-modern',
    year: '2018+',
    shortId: 'Era LRT',
    shortEn: 'LRT Era',
    titleId: 'Palembang Modern: LRT Sumsel & Jakabaring (2018–Kini)',
    titleEn: 'Modern Palembang: South Sumatra LRT & JSC (2018–Present)',
    zoneId: '2018–Kini · LRT Pertama di Indonesia & Jembatan Musi IV',
    zoneEn: '2018–Now · Indonesia’s First LRT & Musi IV Bridge',
    summaryId:
      'Menyongsong Asian Games 2018, Palembang mengoperasikan LRT pertama di Indonesia sepanjang 23,4 km dari Bandara SMB II melintasi Sungai Musi hingga Jakabaring Sport City, diperkuat Jembatan Musi IV sebagai koridor modern baru.',
    summaryEn:
      'Built for the 2018 Asian Games, Palembang launched Indonesia’s first light-rail network (23.4 km from SMB II Airport across the Musi River to Jakabaring Sport City), complemented by the modern cable-stayed Musi IV Bridge.',
    noteId: 'Kembali ke warna penuh masa kini — jelajahi semua landmark dengan lalu lintas & kereta LRT aktif!',
    noteEn: 'Full present-day color restored — explore all landmarks with live traffic & LRT trains!',
    center: [104.7642, -2.9912],
    zoom: 15.65,
    pitch: 64,
    bearing: 42,
    filterCss: 'none',
  },
];

export function createHistoricalTimeline({ i18n, mapContainer, onSelectEra, onExit }) {
  let active = false;
  let activeIndex = 0;

  const bar = document.createElement('div');
  bar.className = 'timeline-bar hidden';
  bar.dataset.timelineBar = 'true';
  bar.setAttribute('aria-label', 'Timeline Sejarah Palembang');

  const topRow = document.createElement('div');
  topRow.className = 'timeline-top-row';
  const headingEl = document.createElement('span');
  headingEl.className = 'timeline-heading';

  const navBtns = document.createElement('div');
  navBtns.className = 'timeline-nav-btns';
  const prevBtn = document.createElement('button');
  prevBtn.type = 'button';
  prevBtn.className = 'banner-btn';
  prevBtn.textContent = '◀';
  prevBtn.addEventListener('click', () => selectEra(Math.max(0, activeIndex - 1)));

  const nextBtn = document.createElement('button');
  nextBtn.type = 'button';
  nextBtn.className = 'banner-btn';
  nextBtn.textContent = '▶';
  nextBtn.addEventListener('click', () => selectEra(Math.min(HISTORICAL_ERAS.length - 1, activeIndex + 1)));

  const exitBtn = document.createElement('button');
  exitBtn.type = 'button';
  exitBtn.className = 'banner-btn banner-stop';
  exitBtn.dataset.timelineExit = 'true';
  exitBtn.addEventListener('click', () => stop());

  navBtns.append(prevBtn, nextBtn, exitBtn);
  topRow.append(headingEl, navBtns);

  const track = document.createElement('div');
  track.className = 'timeline-track';
  const eraBtns = HISTORICAL_ERAS.map((era, idx) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'timeline-node';
    btn.dataset.eraBtn = era.id;
    btn.innerHTML = `<span class="tl-year">${era.year}</span><small data-tl-short></small>`;
    btn.addEventListener('click', () => selectEra(idx));
    track.appendChild(btn);
    return btn;
  });

  bar.append(topRow, track);

  function applyLanguage() {
    const en = i18n.getLang() === 'en';
    headingEl.textContent = en ? '📜 PALEMBANG HISTORICAL TIMELINE' : '📜 LINIMASA SEJARAH PALEMBANG';
    exitBtn.textContent = en ? 'Back to Present' : 'Kembali ke Masa Kini';
    HISTORICAL_ERAS.forEach((era, i) => {
      eraBtns[i].querySelector('[data-tl-short]').textContent = en ? era.shortEn : era.shortId;
    });
  }

  function applyFilter(filterCss) {
    mapContainer.style.filter = filterCss && filterCss !== 'none' ? filterCss : '';
  }

  function formatEraItem(era) {
    const en = i18n.getLang() === 'en';
    return {
      id: era.id,
      title: en ? era.titleEn : era.titleId,
      signature: en ? era.zoneEn : era.zoneId,
      zone: en ? era.zoneEn : era.zoneId,
      summary: en ? era.summaryEn : era.summaryId,
      note: en ? era.noteEn : era.noteId,
      center: era.center,
      zoom: era.zoom,
      pitch: era.pitch,
      bearing: era.bearing,
      year: era.year,
      filterCss: era.filterCss,
    };
  }

  function selectEra(index) {
    active = true;
    activeIndex = Math.max(0, Math.min(HISTORICAL_ERAS.length - 1, index));
    bar.classList.remove('hidden');
    eraBtns.forEach((b, i) => b.classList.toggle('active', i === activeIndex));
    prevBtn.disabled = activeIndex === 0;
    nextBtn.disabled = activeIndex === HISTORICAL_ERAS.length - 1;

    const era = HISTORICAL_ERAS[activeIndex];
    applyFilter(era.filterCss);
    onSelectEra(formatEraItem(era));
  }

  function stop() {
    if (!active) return;
    active = false;
    bar.classList.add('hidden');
    applyFilter('none');
    onExit?.();
  }

  function getState() {
    const era = HISTORICAL_ERAS[activeIndex];
    return Object.freeze({
      active,
      eraId: active ? era.id : null,
      year: active ? era.year : null,
      filterCss: active ? era.filterCss : 'none',
    });
  }

  applyLanguage();

  return {
    barEl: bar,
    start: (idx = 0) => selectEra(idx),
    selectEra,
    stop,
    getState,
    applyLanguage,
    cleanup: stop,
  };
}
