// v2.3 Full Bilingual ID <-> EN Localization (HUD, Drawer, Festival, Boat Mini-Game & All 20 POIs)
const STORAGE_KEY = 'palembang_3d_lang_v1';

const UI_STRINGS = {
  id: {
    brandTitle: 'Kota Palembang 3D',
    brandSub: 'Satelit Esri · Gedung 3D OSM · Lalu Lintas, LRT & Sungai Aktif',
    satMode: 'Satelit 3D',
    dioMode: 'Diorama',
    day: 'Siang',
    sunset: 'Senja',
    night: 'Malam',
    share: 'Bagikan',
    sound: 'Suara',
    soundOn: 'Suara On',
    explore: 'Eksplorasi',
    close: 'Tutup',
    info: 'Info',
    drawerTitle: 'Eksplorasi Palembang',
    tabRide: 'Naik & Tur',
    tabExplore: 'Jelajah',
    tabGis: 'Cuaca & GIS',
    tabFestival: 'Festival',
    secRide: 'Mode Naik & Mini-Game Sungai Musi',
    secTour: 'Tur Otomatis & Drone Bebas',
    secLayers: 'Lapisan Visual 3D',
    rideLrt: 'Naik LRT Sumsel',
    rideLrtDesc: 'Ikuti kereta 3-gerbong di viaduk layang (~65 km/j)',
    rideBoat: 'Naik Perahu Ketek',
    rideBoatDesc: 'Susuri Sungai Musi melintasi Ampera & BKB',
    rideBarge: 'Ikut Tongkang Batu Bara',
    rideBargeDesc: 'Konvoi kapal tunda & tongkang di alur utama Musi',
    playBoat: 'Setir Perahu Ketek + Misi Sriwijaya',
    playBoatDesc: 'Kendalikan kapal (WASD) & kumpulkan 5 artefak emas!',
    tourTitle: 'Tur Sinematik Palembang',
    tourDesc: 'Terbang otomatis keliling 10 landmark + narasi',
    droneTitle: 'Free Drone (WASD / Panah)',
    droneDesc: 'Terbang bebas · Q/E atur tinggi · Shift cepat',
    start: 'Mulai',
    active: 'Aktif',
    stop: 'Berhenti',
    bldg3d: 'Gedung 3D',
    anim: 'Animasi',
    label3d: 'Label 3D',
    radar: 'Radar 2D',
    passportEyebrow: 'Passport Penjelajah',
    searchPh: 'Cari pempek, pindang, stasiun, landmark...',
    routeTitle: 'Perencana Rute Jalan Nyata',
    routeGo: 'Cari Rute',
    routeClear: 'Hapus',
    openGmaps: 'Buka di Google Maps ↗',
    secClock: 'Waktu 24 Jam & Time-Lapse',
    timelapse: 'Putar 24 Jam',
    timelapseStop: 'Jeda 24 Jam',
    secFest: 'Festival Budaya Palembang 3D',
    festBidar: 'Festival Balap Perahu Bidar',
    festBidarDesc: '6 perahu bidar panjang balapan di koridor BKB–Ampera',
    festFireworks: 'Malam Kembang Api & Lampion',
    festFireworksDesc: 'Kembang api di atas Ampera + 48 lampion Pulau Kemaro',
    secPhoto: 'Photo Mode (Kartu Pos 3D)',
    photoBtn: 'Masuk Photo Mode',
    photoDesc: 'Sembunyikan HUD & unduh kartu pos PNG resolusi penuh',
    photoShutter: '📸 Unduh Kartu Pos PNG',
    photoWatermark: 'Watermark',
    photoExit: 'Keluar',
    hint: 'Seret geser · Klik kanan putar/miring 3D · Buka "Eksplorasi" untuk Festival, Setir Kapal, Rute & GIS',
    toastShareCopied: '✓ Tautan sudut kamera disalin ke clipboard!',
    toastShareUrl: '✓ Tautan sudut kamera diperbarui di URL browser!',
    toastPhotoSaved: '✓ Kartu pos Palembang 3D berhasil diunduh!',
  },
  en: {
    brandTitle: 'Palembang City 3D',
    brandSub: 'Esri Satellite · OSM 3D Buildings · Live Traffic, LRT & River',
    satMode: 'Satellite 3D',
    dioMode: 'Diorama',
    day: 'Day',
    sunset: 'Sunset',
    night: 'Night',
    share: 'Share',
    sound: 'Audio',
    soundOn: 'Audio On',
    explore: 'Explore',
    close: 'Close',
    info: 'Info',
    drawerTitle: 'Explore Palembang',
    tabRide: 'Ride & Play',
    tabExplore: 'Discover',
    tabGis: 'Weather & GIS',
    tabFestival: 'Festival',
    secRide: 'Ride-Along & Musi River Mini-Game',
    secTour: 'Auto-Tour & Free Drone',
    secLayers: '3D Visual Layers',
    rideLrt: 'Ride South Sumatra LRT',
    rideLrtDesc: 'Follow a 3-car elevated train (~65 km/h)',
    rideBoat: 'Ride Perahu Ketek',
    rideBoatDesc: 'Cruise Sungai Musi past Ampera Bridge & BKB',
    rideBarge: 'Trail Coal Barge Convoy',
    rideBargeDesc: 'Follow a tugboat & coal barge down the Musi',
    playBoat: 'Steer Perahu Ketek + Srivijaya Quest',
    playBoatDesc: 'Drive your own boat (WASD) & collect 5 golden relics!',
    tourTitle: 'Cinematic Palembang Tour',
    tourDesc: 'Auto-fly across 10 landmarks with storytelling',
    droneTitle: 'Free Drone (WASD / Arrows)',
    droneDesc: 'Free flight · Q/E altitude · Shift boost',
    start: 'Start',
    active: 'Active',
    stop: 'Stop',
    bldg3d: '3D Buildings',
    anim: 'Live Traffic',
    label3d: '3D Labels',
    radar: '2D Radar',
    passportEyebrow: 'Explorer Passport',
    searchPh: 'Search pempek, pindang, LRT station, landmark...',
    routeTitle: 'Real Road Route Planner',
    routeGo: 'Find Route',
    routeClear: 'Clear',
    openGmaps: 'Open in Google Maps ↗',
    secClock: '24-Hour Time & Time-Lapse',
    timelapse: 'Play 24h Cycle',
    timelapseStop: 'Pause 24h',
    secFest: 'Palembang Cultural Festivals 3D',
    festBidar: 'Traditional Bidar Boat Race',
    festBidarDesc: '6 long traditional Bidar canoes racing past Ampera',
    festFireworks: 'Ampera Fireworks & Kemaro Lanterns',
    festFireworksDesc: '3D fireworks over Ampera + 48 Kemaro sky lanterns',
    secPhoto: 'Photo Mode (3D Postcard)',
    photoBtn: 'Enter Photo Mode',
    photoDesc: 'Hide all HUD & download a full-res PNG postcard',
    photoShutter: '📸 Download PNG Postcard',
    photoWatermark: 'Watermark',
    photoExit: 'Exit',
    hint: 'Drag to pan · Right-drag to tilt/rotate 3D · Open "Explore" for Festivals, Boat Quest, Routes & GIS',
    toastShareCopied: '✓ Camera deep-link copied to clipboard!',
    toastShareUrl: '✓ Camera deep-link updated in browser URL!',
    toastPhotoSaved: '✓ Palembang 3D postcard downloaded!',
  },
};

const POI_EN = {
  ampera: {
    title: 'Ampera Bridge & Musi River',
    signature: 'City Icon · 66 m Twin Towers',
    summary:
      'Palembang’s iconic brick-red vertical-lift bridge spanning the Musi River since 1965, anchored at true 1:1 GPS scale and its real NW–SE alignment.',
    note: 'Try Sunset, Night, or the 3D Fireworks Festival to see Ampera illuminated over the Musi River.',
  },
  'masjid-lrt': {
    title: 'SMB I Great Mosque & Fountain Roundabout',
    signature: 'Historic Mosque & City Zero Point',
    summary:
      'The 18th-century Sultan Mahmud Badaruddin I Great Mosque featuring its signature three-tiered green tumpang roof and 46 m minaret beside the animated Fountain Roundabout.',
    note: 'Connected directly to the elevated South Sumatra LRT corridor along Jl. Jenderal Sudirman.',
  },
  monpera: {
    title: 'People’s Struggle Monument (Monpera)',
    signature: '5-Petal Jasmine Monument · 1947 Battle',
    summary:
      'A five-petal jasmine flower monument commemorating South Sumatra’s Five Days Five Nights Battle of 1947, situated between the Great Mosque and Kuto Besak Fort.',
    note: 'Surrounded by historic cannons and shaded pedestrian walkways leading to Plaza BKB.',
  },
  'pasar-16': {
    title: 'Pasar 16 Ilir Historic Market',
    signature: 'Historic Riverside Trading Hub',
    summary:
      'Palembang’s bustling centuries-old riverfront trading district just east of Ampera Bridge, linking riverboat jetties with dense shophouse blocks.',
    note: 'Toggle 3D Buildings in the drawer to compare OSM extrusions against raw satellite roofs.',
  },
  'kuto-besak': {
    title: 'Kuto Besak Fort & Plaza BKB',
    signature: 'Sultanate Fortress · Musi Promenade',
    summary:
      'The 18th-century Palembang Sultanate limestone fortress facing the Musi River, framed by twin terracotta bastions, the Lawang Kuto gateway, and a waving Merah-Putih flag.',
    note: 'Launch the Playable Perahu Ketek mini-game right in front of Plaza BKB!',
  },
  'walikota-kambang': {
    title: 'Palembang City Hall (Gedung Ledeng) & Kambang Iwak',
    signature: '1928 Heritage Water Tower & Park Lake',
    summary:
      'Links the 1928 Dutch-colonial Gedung Ledeng City Hall water tower with the beloved lakeside jogging park of Taman Kambang Iwak in Talang Semut.',
    note: 'Located ~1.2 km west of Benteng Kuto Besak in real 1:1 coordinates.',
  },
  'kampung-kapitan': {
    title: 'Kampung Kapitan 7 Ulu',
    signature: 'Heritage Riverside Settlement',
    summary:
      'Historic Chinese-Palembang stilt-house heritage quarter on the Seberang Ulu bank directly across the river from Kuto Besak Fort.',
    note: 'Showcases authentic riverside settlement patterns on aerial satellite imagery.',
  },
  jakabaring: {
    title: 'Gelora Sriwijaya Stadium & Jakabaring Sport City',
    signature: 'International Sports Complex',
    summary:
      'Home to Gelora Sriwijaya Stadium (with 4 3D floodlight towers), rowing lake, and 2018 Asian Games venues in southern Seberang Ulu.',
    note: '4.4 km southeast of Ampera Bridge, connected directly via the South Sumatra LRT.',
  },
  'musi-iv': {
    title: 'Musi IV Cable-Stayed Bridge',
    signature: 'Modern Cable-Stayed Crossing',
    summary:
      'True-scale 3D overlay of the twin white cable-stayed pylons connecting Pasar Kuto / 14 Ilir with eastern Seberang Ulu, ~1.5 km downstream of Ampera.',
    note: 'Watch coal barge convoys pass beneath the central shipping span.',
  },
  'pulau-kemaro': {
    title: 'Kemaro Island & 9-Story Pagoda',
    signature: 'Musi Delta · 45 m Red-Gold Pagoda',
    summary:
      'A legendary river delta island ~6.3 km east of Ampera Bridge featuring the 45-meter nine-story octagonal Pagoda and Hok Tjing Rio Temple.',
    note: 'Activate the Fireworks & Lanterns Festival to see glowing sky lanterns drift over Kemaro Island.',
  },
  'kuliner-pempek-candy': {
    title: 'Pempek Candy (Jl. Jenderal Sudirman)',
    signature: 'Kapal Selam · Lenjer · Sweet-Spicy Cuko',
    summary:
      'One of Palembang’s most famous pempek houses since 1994 on Jl. Jenderal Sudirman, prized for dense mackerel fishcakes and rich dark tamarind-palm sugar cuko sauce.',
    note: 'Popular for vacuum-packed souvenirs and dine-in along the LRT corridor.',
  },
  'kuliner-pempek-vico': {
    title: 'Pempek Vico (Jl. Letkol Iskandar)',
    signature: 'Grilled Pempek Panggang · Adaan · Red Bean Ice',
    summary:
      'A local and traveler favorite across from Palembang Indah Mall, famous for crispy adaan, smoky grilled pempek panggang, and refreshing Es Kacang Merah.',
    note: 'About 900 m from Cinde LRT Station and the Great Mosque.',
  },
  'kuliner-kampung-pempek': {
    title: 'Kampung Pempek 26 Ilir (Jl. Mujahidin)',
    signature: 'Dozens of Family Pempek Stalls · Kulit & Lenggang',
    summary:
      'Palembang’s legendary culinary lane packed with dozens of home-style pempek shops serving crispy pempek kulit, lenggang, tekwan, and model at local prices.',
    note: 'A 5-minute walk from Palembang City Hall (Gedung Ledeng).',
  },
  'kuliner-martabak-har': {
    title: 'Martabak HAR (Great Mosque · Sudirman)',
    signature: 'Duck-Egg Martabak · Spiced Potato Curry',
    summary:
      'A Palembang institution since 1947 founded by Haji Abdul Rozak right across from the Great Mosque: thin crispy egg martabak drenched in savory spiced potato curry.',
    note: 'Open late into the night — ideal after viewing Ampera Bridge lights.',
  },
  'kuliner-mie-celor': {
    title: 'Mie Celor 26 Ilir H.M. Syafei Z',
    signature: 'Blanched Egg Noodles · Rich Prawn-Coconut Broth',
    summary:
      'Palembang’s beloved breakfast specialty: thick yellow noodles blanched in hot water and topped with velvety shrimp-coconut broth, bean sprouts, boiled egg, and chives.',
    note: 'Busiest in the morning before 10:00 WIB.',
  },
  'kuliner-riverside-bkb': {
    title: 'River Side Restaurant (Plaza BKB)',
    signature: 'Pindang Patin · Pindang Tulang · Ampera View',
    summary:
      'An iconic boat-shaped riverside restaurant on Plaza BKB serving tangy-savory Palembang pindang patin fish soup with front-row views of Ampera Bridge.',
    note: 'Switch to Sunset or Night for the signature Musi riverside dining atmosphere.',
  },
  'lrt-ampera': {
    title: 'Ampera LRT Station',
    signature: 'Central Hub · Ampera, Pasar 16 Ilir & Great Mosque',
    summary:
      'The busiest station on Indonesia’s first light-rail network (South Sumatra LRT), located right on the north bank beside Ampera Bridge and Pasar 16 Ilir.',
    note: 'Use "Ride South Sumatra LRT" in the Ride & Play tab to cross the Musi River by rail.',
  },
  'lrt-cinde': {
    title: 'Cinde LRT Station',
    signature: 'Cinde Market & Sudirman Culinary Corridor',
    summary:
      'Serves Cinde commercial district, Jl. Jenderal Sudirman offices, and easy access to Pempek Vico, Palembang Indah Mall, and Pempek Candy.',
    note: 'Part of the 23.4 km airport-to-Jakabaring elevated LRT line.',
  },
  'lrt-polresta': {
    title: 'Polresta LRT Station',
    signature: 'Seberang Ulu Gateway · Ampera to Jakabaring',
    summary:
      'The first elevated station on the Seberang Ulu side after crossing the Musi River from Ampera Station along Jl. Gubernur H. Bastari.',
    note: 'Surrounded by active two-way Seberang Ulu boulevard traffic.',
  },
  'lrt-jakabaring': {
    title: 'Jakabaring LRT Station',
    signature: 'Gateway to Gelora Sriwijaya Stadium & JSC',
    summary:
      'Primary transit gateway serving Gelora Sriwijaya Stadium, Jakabaring Rowing Lake, and OPI Mall in southern Palembang.',
    note: 'Built for the 2018 Asian Games linking SMB II Airport straight to Jakabaring.',
  },
};

export function createI18n() {
  const urlLang = new URLSearchParams(window.location.search).get('lang');
  let stored = null;
  try {
    stored = window.localStorage?.getItem(STORAGE_KEY);
  } catch {}
  let lang = urlLang === 'en' || urlLang === 'id' ? urlLang : stored === 'en' ? 'en' : 'id';

  const listeners = new Set();

  function setLang(next) {
    const clean = next === 'en' ? 'en' : 'id';
    if (clean === lang) return;
    lang = clean;
    try {
      window.localStorage?.setItem(STORAGE_KEY, lang);
    } catch {}
    for (const fn of listeners) fn(lang);
  }

  function t(key) {
    return UI_STRINGS[lang]?.[key] || UI_STRINGS.id[key] || key;
  }

  function localizePoi(poi) {
    if (lang !== 'en' || !POI_EN[poi.id]) return poi;
    return { ...poi, ...POI_EN[poi.id] };
  }

  return {
    getLang: () => lang,
    setLang,
    toggle: () => setLang(lang === 'id' ? 'en' : 'id'),
    t,
    localizePoi,
    onChange(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
  };
}
