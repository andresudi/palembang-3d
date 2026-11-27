export const REAL_PRESETS = [
  {
    id: 'overview',
    label: 'Overview',
    title: 'Koridor Sungai Musi, Kota Palembang (Satelit 3D Nyata)',
    zone: 'Citra Satelit Esri + Bangunan 3D OpenStreetMap',
    center: [104.7642, -2.9912],
    zoom: 15.65,
    pitch: 64,
    bearing: 42,
    coordsText: '2.9912° S, 104.7642° E',
    summary:
      'Tampilan 3D realistis Kota Palembang memadukan citra satelit resolusi tinggi, kontur elevasi DEM, ribuan bangunan 3D OpenStreetMap, serta overlay 3D skala nyata Jembatan Ampera, Jembatan Musi IV, dan Pagoda Pulau Kemaro.',
    note:
      'Skala & jarak 1:1 dunia nyata. Gunakan tombol mode di kiri atas untuk membandingkan dengan versi Diorama offline.',
  },
  {
    id: 'ampera',
    label: 'Ampera',
    title: 'Jembatan Ampera & Sungai Musi',
    zone: '2.9918° S, 104.7635° E · Skala Nyata',
    center: [104.76345, -2.99185],
    zoom: 16.9,
    pitch: 66,
    bearing: 52,
    coordsText: '2.9918° S, 104.7635° E',
    summary:
      'Model 3D Jembatan Ampera skala nyata (menara merah bata 63 m, bentang utama 75 m) diposisikan langsung di atas citra satelit Sungai Musi pada koordinat dan sudut asli NW–SE (146,5°).',
    note:
      'Coba ganti suasana ke Senja atau Malam untuk melihat pendar lampu menara Ampera dan gedung-gedung sekitar Sungai Musi.',
  },
  {
    id: 'masjid-lrt',
    label: 'Bundaran & Masjid',
    title: 'Bundaran Air Mancur & Masjid Agung SMB I',
    zone: '2.9880° S, 104.7607° E · Jl. Jenderal Sudirman',
    center: [104.7607, -2.9880],
    zoom: 17.1,
    pitch: 60,
    bearing: -18,
    coordsText: '2.9880° S, 104.7607° E',
    summary:
      'Titik nol pusat Kota Palembang menampilkan Bundaran Air Mancur, Masjid Agung Sultan Mahmud Badaruddin I, koridor LRT Sumsel, serta deretan bangunan nyata di sepanjang Jl. Jenderal Sudirman.',
    note:
      'Ekstrusi bangunan 3D berasal langsung dari footprint OpenStreetMap terbaru.',
  },
  {
    id: 'pasar-16',
    label: 'Pasar 16 Ilir',
    title: 'Kawasan Niaga Pasar 16 Ilir',
    zone: '2.9894° S, 104.7638° E · Tepian Musi Timur',
    center: [104.7638, -2.9894],
    zoom: 17.2,
    pitch: 60,
    bearing: 24,
    coordsText: '2.9894° S, 104.7638° E',
    summary:
      'Pusat perdagangan bersejarah di sisi timur Jembatan Ampera dengan kepadatan ruko nyata dan dermaga sungai di tepian Seberang Ilir.',
    note:
      'Matikan tombol Gedung 3D jika ingin melihat detail atap foto satelit asli tanpa ekstrusi.',
  },
  {
    id: 'kuto-besak',
    label: 'Kuto Besak',
    title: 'Benteng Kuto Besak & Plaza BKB',
    zone: '2.9922° S, 104.7600° E · Seberang Ilir Barat',
    center: [104.7600, -2.9922],
    zoom: 17.0,
    pitch: 58,
    bearing: -22,
    coordsText: '2.9922° S, 104.7600° E',
    summary:
      'Kompleks bersejarah Benteng Kuto Besak, pelataran tepi sungai Plaza BKB, dan Museum Sultan Mahmud Badaruddin II tepat di barat Jembatan Ampera.',
    note:
      'Terlihat orientasi nyata benteng menghadap langsung ke belokan Sungai Musi.',
  },
  {
    id: 'walikota-kambang',
    label: 'Walikota & KI',
    title: 'Kantor Walikota & Taman Kambang Iwak',
    zone: '2.9904° S, 104.7515° E · Jl. Merdeka – Talang Semut',
    center: [104.7510, -2.9903],
    zoom: 15.8,
    pitch: 58,
    bearing: -35,
    coordsText: '2.9903° S, 104.7510° E',
    summary:
      'Menghubungkan kawasan kolonial Gedung Ledeng (Kantor Walikota Palembang) hingga danau dan ruang terbuka hijau Taman Kambang Iwak di kawasan Talang Semut.',
    note:
      'Jarak sebenarnya sekitar 1,2 km ke barat dari kawasan Benteng Kuto Besak.',
  },
  {
    id: 'kampung-kapitan',
    label: 'Kampung Kapitan',
    title: 'Kampung Kapitan & 7 Ulu',
    zone: '2.9958° S, 104.7634° E · Tepian Seberang Ulu',
    center: [104.7634, -2.9958],
    zoom: 17.2,
    pitch: 60,
    bearing: 145,
    coordsText: '2.9958° S, 104.7634° E',
    summary:
      'Kawasan cagar budaya permukiman tepi sungai 7 Ulu di Seberang Ulu tepat di seberang Benteng Kuto Besak dan sisi barat kaki selatan Jembatan Ampera.',
    note:
      'Menampilkan pola permukiman tepi Sungai Musi nyata pada foto udara satelit.',
  },
  {
    id: 'jakabaring',
    label: 'Jakabaring',
    title: 'Stadion Gelora Sriwijaya & Jakabaring Sport City',
    zone: '3.0215° S, 104.7891° E · Seberang Ulu Selatan',
    center: [104.7891, -3.0215],
    zoom: 16.0,
    pitch: 60,
    bearing: -25,
    coordsText: '3.0215° S, 104.7891° E',
    summary:
      'Kompleks olahraga berskala internasional Jakabaring Sport City, Stadion Gelora Sriwijaya, danau dayung, serta jaringan jalan utama Seberang Ulu selatan.',
    note:
      'Berjarak nyata ~4,4 km ke tenggara dari Jembatan Ampera, terhubung oleh koridor LRT Sumsel.',
  },
  {
    id: 'musi-iv',
    label: 'Jembatan Musi IV',
    title: 'Jembatan Musi IV (Cable-Stayed)',
    zone: '2.9832° S, 104.7744° E · Hilir Timur Musi',
    center: [104.77436, -2.98318],
    zoom: 16.5,
    pitch: 65,
    bearing: 58,
    coordsText: '2.9832° S, 104.7744° E',
    summary:
      'Overlay 3D Jembatan Musi IV skala nyata (pilon putih kembar & kabel kipas) pada sudut aktual 339,2° menghubungkan koridor Pasar Kuto / 14 Ilir dengan Seberang Ulu timur.',
    note:
      'Berjarak ~1,5 km di hilir timur Jembatan Ampera.',
  },
  {
    id: 'pulau-kemaro',
    label: 'Pulau Kemaro',
    title: 'Pulau Kemaro & Pagoda 9 Lantai',
    zone: '2.9795° S, 104.8140° E · Delta Hilir Sungai Musi',
    center: [104.8148, -2.9795],
    zoom: 16.5,
    pitch: 62,
    bearing: 36,
    coordsText: '2.9795° S, 104.8148° E',
    summary:
      'Pulau delta nyata di tengah hilir Sungai Musi (~6,3 km timur Jembatan Ampera) dengan overlay 3D Pagoda 9 Lantai merah-emas setinggi 45 m dan Klenteng Hok Tjing Rio.',
    note:
      'Perhatikan skala jarak sebenarnya di Sungai Musi dibandingkan tampilan diorama terkompresi.',
  },
  {
    id: 'musi-vi',
    label: 'Jembatan Musi VI',
    title: 'Jembatan Musi VI (Pelengkung LED RGB)',
    zone: '3.0044° S, 104.7499° E · 32 Ilir – 3-4 Ulu',
    center: [104.74992, -3.00437],
    zoom: 16.5,
    pitch: 65,
    bearing: 35,
    coordsText: '3.0044° S, 104.7499° E',
    summary:
      'Jembatan pelengkung baja ikonik sepanjang 925 meter yang menghubungkan Ilir Barat II dan Seberang Ulu I, terkenal dengan atraksi lampu LED RGB warna-warni yang memantul di Sungai Musi saat malam hari.',
    note:
      'Coba ganti suasana ke Senja atau Malam untuk menyaksikan gelombang lampu LED warna-warni melengkung di atas Musi VI.',
  },
  {
    id: 'masjid-cheng-ho',
    label: 'Masjid Cheng Ho',
    title: 'Masjid Al-Islam Muhammad Cheng Ho Sriwijaya',
    zone: '3.0242° S, 104.7807° E · Kompleks Jakabaring',
    center: [104.78071, -3.02422],
    zoom: 17.5,
    pitch: 62,
    bearing: -24,
    coordsText: '3.0242° S, 104.7807° E',
    summary:
      'Masjid berarsitektur akulturasi Tionghoa, Nusantara, dan Islam di kawasan Jakabaring dengan atap pagoda hijau-merah-emas, dua menara kembar 5 lantai, gerbang paifang, serta lampion merah yang berayun lembut.',
    note:
      'Berjarak hanya ~430 m dari Stasiun LRT Jakabaring dan ~900 m dari Stadion Gelora Sriwijaya.',
  },
  {
    id: 'bukit-siguntang',
    label: 'Bukit Siguntang',
    title: 'Taman Purbakala Bukit Siguntang (Sriwijaya)',
    zone: '2.9972° S, 104.7256° E · Bukit Kecil Barat',
    center: [104.72555, -2.99722],
    zoom: 16.9,
    pitch: 60,
    bearing: 28,
    coordsText: '2.9972° S, 104.7256° E',
    summary:
      'Titik tertinggi sekaligus situs suci peninggalan Kerajaan Sriwijaya abad ke-7 tempat ditemukannya arca Buddha Amarawati raksasa dan kompleks makam tokoh bangsawan Melayu-Palembang.',
    note:
      'Ganti ke suasana Senja atau Malam untuk melihat pendar kunang-kunang emas melayang di sekitar pendopo bukit.',
  },
];

export const REAL_MARKERS = [
  { id: 'ampera', label: 'Jembatan Ampera', lngLat: [104.76340, -2.99194] },
  { id: 'masjid-lrt', label: 'Masjid Agung & BAM', lngLat: [104.7606, -2.9880] },
  { id: 'pasar-16', label: 'Pasar 16 Ilir', lngLat: [104.76375, -2.98936] },
  { id: 'kuto-besak', label: 'Benteng Kuto Besak', lngLat: [104.75998, -2.99218] },
  { id: 'tugu-belido', label: 'Tugu Ikan Belido', lngLat: [104.76008, -2.99268] },
  { id: 'walikota-kambang', label: 'Kantor Walikota', lngLat: [104.75667, -2.99104] },
  { id: 'kambang-iwak', label: 'Kambang Iwak', lngLat: [104.74645, -2.98979] },
  { id: 'kampung-kapitan', label: 'Kampung Kapitan', lngLat: [104.76341, -2.99584] },
  { id: 'jakabaring', label: 'Gelora Sriwijaya Jakabaring', lngLat: [104.78910, -3.02150] },
  { id: 'danau-dayung', label: 'Danau Dayung JSC', lngLat: [104.79600, -3.01850] },
  { id: 'musi-iv', label: 'Jembatan Musi IV', lngLat: [104.77410, -2.98355] },
  { id: 'musi-vi', label: 'Jembatan Musi VI', lngLat: [104.74992, -3.00437] },
  { id: 'masjid-cheng-ho', label: 'Masjid Cheng Ho', lngLat: [104.78071, -3.02422] },
  { id: 'bukit-siguntang', label: 'Bukit Siguntang', lngLat: [104.72555, -2.99722] },
  { id: 'pulau-kemaro', label: 'Pulau Kemaro', lngLat: [104.81305, -2.97995] },
];
